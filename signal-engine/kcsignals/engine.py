"""Wires feed -> bars -> levels -> strategy -> contract/risk -> trade manager -> alerts."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta

from .alerts import Alerter
from .bars import BarBuilder
from .config import Settings
from .feeds.base import Feed
from .levels import DayLevels
from .manager import TradeManager
from .models import Bar, Event, EventType, OptionQuote, Setup, Trade
from .options import select_contract
from .risk import DayBook, build_signal
from .strategy import SymbolStrategy
from .timeutil import et_date, is_rth

log = logging.getLogger("kcsignals.engine")


class SymbolState:
    def __init__(self, sym: str, s: Settings, on_bar):
        self.levels = DayLevels(sym)
        self.strategy = SymbolStrategy(sym, s.strategy, self.levels)
        self.last: float | None = None
        self.pv = 0.0
        self.vol = 0.0
        tfs = sorted({60} | {secs for _, secs in s.strategy.timeframes})
        self.builders = [BarBuilder(sym, tf, on_bar) for tf in tfs]

    @property
    def vwap(self) -> float | None:
        return self.pv / self.vol if self.vol else None


class Engine:
    def __init__(self, settings: Settings, feed: Feed, alerter: Alerter | None = None):
        self.s = settings
        self.feed = feed
        self.alerter = alerter or Alerter(settings.alerts)
        self.book = DayBook()
        self.manager = TradeManager(settings, self.book)
        self.symbols = list(settings.watchlist)
        self.state: dict[str, SymbolState] = {}
        self.day = None
        self.events: asyncio.Queue[Event] = asyncio.Queue()
        self._pending: set[asyncio.Task] = set()
        self.signals: list = []
        feed.attach(self)

    # ---------------------------------------------------------------- setup
    async def start_day(self, now: datetime) -> None:
        self.day = et_date(now)
        self.book.roll(self.day, self.book.equity if self.book.start_equity else self.s.account.size)
        self.state = {}
        start = now - timedelta(days=14)
        for sym in self.symbols:
            st = SymbolState(sym, self.s, self._on_bar)
            hist = await self.feed.history_1m(sym, start, now)
            st.levels.load_history(hist, self.day, self.s.strategy.pivot_left, self.s.strategy.pivot_right)
            for b in hist:  # VWAP for today's RTH bars already printed
                if et_date(b.start) == self.day and is_rth(b.start):
                    st.pv += b.vwap_num or b.close * b.volume
                    st.vol += b.volume
                    st.last = b.close
            self.state[sym] = st
            lv = st.levels
            self.emit(Event(EventType.INFO, now, sym,
                            f"levels: NTZ {fmt(lv.ntz_bottom)}-{fmt(lv.ntz_top)} | PDH {fmt(lv.y_high)} PDL {fmt(lv.y_low)} | "
                            f"PM {fmt(lv.pm_low)}-{fmt(lv.pm_high)} | S/R {', '.join(map(str, lv.swing_levels[-8:]))}"))

    # ---------------------------------------------------------------- inputs
    def on_trade(self, t: Trade) -> None:
        st = self.state.get(t.symbol)
        if st is None:
            return
        st.last = t.price
        if is_rth(t.ts):
            st.pv += t.price * t.size
            st.vol += t.size
        for b in st.builders:
            b.add(t.price, t.size, t.ts)
        for ev in self.manager.on_underlying(t.symbol, t.price, t.ts):
            self.emit(ev)

    def on_option_quote(self, q: OptionQuote) -> None:
        for ev in self.manager.on_option_quote(q, q.ts or self.feed.now()):
            self.emit(ev)

    def on_clock(self, now: datetime) -> None:
        for st in self.state.values():
            for b in st.builders:
                b.flush_until(now)
        for ev in self.manager.on_clock(now):
            self.emit(ev)

    # ---------------------------------------------------------------- internals
    def _on_bar(self, bar: Bar) -> None:
        st = self.state[bar.symbol]
        if bar.seconds == 60:
            st.levels.on_bar(bar, self.s.strategy.orb_minutes)
            if is_rth(bar.start):
                st.levels.add_intraday_pivots(list(st.builders[0].history), self.s.strategy.pivot_left,
                                              self.s.strategy.pivot_right)
            return
        if not is_rth(bar.start):
            return
        for setup in st.strategy.on_bar(bar, st.vwap):
            task = asyncio.get_event_loop().create_task(self._handle_setup(setup))
            self._pending.add(task)
            task.add_done_callback(self._pending.discard)

    async def _handle_setup(self, setup: Setup) -> None:
        now = self.feed.now()
        spot = self.state[setup.symbol].last or setup.entry_underlying
        o = self.s.options
        try:
            chain = await self.feed.option_chain(setup.symbol, setup.side, et_date(now),
                                                 et_date(now) + timedelta(days=o.max_dte + 3), spot)
        except Exception as e:  # noqa: BLE001 - report and carry on
            self.emit(Event(EventType.RISK_BLOCK, now, setup.symbol, f"{setup.kind}: option chain error {e}"))
            return
        q, why = select_contract(chain, setup.side, spot, now, o)
        if q is None:
            self.emit(Event(EventType.RISK_BLOCK, now, setup.symbol,
                            f"{setup.kind} {setup.side.value} skipped: {'; '.join(why)}"))
            return
        sig, reason = build_signal(setup, q, spot, now, self.book, self.s.account)
        if sig is None:
            self.emit(Event(EventType.RISK_BLOCK, now, setup.symbol,
                            f"{setup.kind} {setup.side.value} @ {setup.trigger_level} skipped: {reason}"))
            return
        self.signals.append(sig)
        self.emit(self.manager.open(sig))
        await self.feed.subscribe_option(q.occ_symbol)

    def emit(self, ev: Event) -> None:
        self.events.put_nowait(ev)

    async def pump_events(self) -> None:
        while True:
            ev = await self.events.get()
            await self.alerter.send(ev)

    async def drain(self) -> None:
        if self._pending:
            await asyncio.gather(*self._pending)
        while not self.events.empty():
            await self.alerter.send(self.events.get_nowait())

    def snapshot(self) -> dict:
        return {
            "day": str(self.day), "equity": round(self.book.equity, 2), "day_pnl": round(self.book.realized, 2),
            "trades": self.book.trades, "losers": self.book.losers,
            "symbols": {s: {"last": st.last, "vwap": round(st.vwap, 2) if st.vwap else None,
                            **st.levels.snapshot()} for s, st in self.state.items()},
            "open": [{"id": p.sig.id, "symbol": p.sig.setup.symbol, "contract": p.sig.contract.occ_symbol,
                      "remaining": p.remaining, "stop": p.stop_premium, "last": p.last_premium,
                      "entry": p.sig.entry_premium, "targets": p.sig.targets_premium}
                     for p in self.manager.positions.values()],
            "events": self.alerter.recent[-50:],
        }


def fmt(x: float | None) -> str:
    return "—" if x is None else f"{x:.2f}"


async def run_engine(engine: Engine) -> None:
    feed = engine.feed
    await engine.start_day(feed.now())
    pump = asyncio.create_task(engine.pump_events())

    async def clock():
        while True:
            await asyncio.sleep(1)
            now = feed.now()
            if et_date(now) != engine.day:
                await engine.start_day(now)
            engine.on_clock(now)

    clk = asyncio.create_task(clock()) if feed.live else None
    try:
        await feed.run()
    finally:
        await engine.drain()
        for t in (pump, clk):
            if t:
                t.cancel()
