"""Wires feed -> bars -> levels/indicators -> setups -> contract/risk -> trade manager
-> alerts (+ optional Alpaca auto-trading) -> dashboard charts."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta

from .alerts import Alerter
from .bars import BarBuilder
from .config import Settings
from .feeds.base import Feed
from .indicators import EMA, SMA
from .levels import DayLevels, resample
from .manager import TradeManager
from .models import Bar, Event, EventType, OptionQuote, Setup, Trade
from .options import select_contract
from .risk import DayBook, build_signal
from .strategy import SymbolStrategy
from .timeutil import ET, et_date, et_time, is_rth, to_et

log = logging.getLogger("kcsignals.engine")


class SymbolState:
    def __init__(self, sym: str, s: Settings, on_bar):
        self.levels = DayLevels(sym, each_side=s.strategy.levels_each_side)
        self.strategy = SymbolStrategy(sym, s.strategy, self.levels)
        self.last: float | None = None
        self.pv = 0.0
        self.vol = 0.0
        self.bars1m: list[Bar] = []
        tfs = sorted({60} | {secs for secs, _, _ in s.strategy.timeframes})
        self.builders = {tf: BarBuilder(sym, tf, on_bar) for tf in tfs}

    @property
    def vwap(self) -> float | None:
        return self.pv / self.vol if self.vol else None


class Engine:
    def __init__(self, settings: Settings, feed: Feed, alerter: Alerter | None = None, executor=None):
        self.s = settings
        self.feed = feed
        self.alerter = alerter or Alerter(settings.alerts)
        self.executor = executor
        self.book = DayBook()
        self.manager = TradeManager(settings, self.book)
        self.symbols = list(settings.watchlist)
        self.state: dict[str, SymbolState] = {}
        self.day = None
        self.events: asyncio.Queue[Event] = asyncio.Queue()
        self._pending: set[asyncio.Task] = set()
        self.signals: list = []
        self.markers: dict[str, list[dict]] = {}
        feed.attach(self)

    # ---------------------------------------------------------------- setup
    async def start_day(self, now: datetime) -> None:
        self.day = et_date(now)
        self.book.roll(self.day, self.book.equity if self.book.start_equity else self.s.account.size)
        self.state, self.markers = {}, {}
        if self.executor is not None:
            self.emit(Event(EventType.ORDER, now, "-", await self.executor.preflight()))
        for sym in self.symbols:
            st = SymbolState(sym, self.s, self._on_bar)
            h1 = await self.feed.history_bars(sym, now - timedelta(days=7), now, 1)
            h60 = await self.feed.history_bars(sym, now - timedelta(days=45), now, 60)
            st.levels.load_history(h1, h60, self.day, self.s.strategy.hourly_pivot_bars)
            st.strategy.warmup(h1)
            st.bars1m = [b for b in h1 if et_date(b.start) >= self.day - timedelta(days=4)]
            for b in h1:
                if et_date(b.start) == self.day and is_rth(b.start):
                    st.pv += b.vwap_num or b.close * b.volume
                    st.vol += b.volume
            if h1:
                st.last = h1[-1].close
            self.state[sym] = st
            lv = st.levels
            self.emit(Event(EventType.INFO, now, sym,
                            f"levels: NTZ {fmt(lv.ntz_bottom)}-{fmt(lv.ntz_top)} | PDH {fmt(lv.y_high)} PDL {fmt(lv.y_low)} | "
                            f"PM {fmt(lv.pm_low)}-{fmt(lv.pm_high)} | hourly {', '.join(map(str, lv.key_hourly()))}"))

    # ---------------------------------------------------------------- inputs
    def on_trade(self, t: Trade) -> None:
        st = self.state.get(t.symbol)
        if st is None:
            return
        st.last = t.price
        if is_rth(t.ts):
            st.pv += t.price * t.size
            st.vol += t.size
        for b in st.builders.values():
            b.add(t.price, t.size, t.ts)
        for ev in self.manager.on_underlying(t.symbol, t.price, t.ts):
            self.emit(ev)

    def on_option_quote(self, q: OptionQuote) -> None:
        for ev in self.manager.on_option_quote(q, q.ts or self.feed.now()):
            self.emit(ev)

    def on_clock(self, now: datetime) -> None:
        for st in self.state.values():
            for b in st.builders.values():
                b.flush_until(now)
        for ev in self.manager.on_clock(now):
            self.emit(ev)

    # ---------------------------------------------------------------- internals
    def _on_bar(self, bar: Bar) -> None:
        st = self.state[bar.symbol]
        if bar.seconds == 60:
            st.levels.on_bar(bar, self.s.strategy.orb_minutes)
            st.bars1m.append(bar)
            return
        if bar.seconds == 300 and is_rth(bar.start):
            st.levels.add_intraday_pivots(list(st.strategy.tf[300].bars))
        for setup in st.strategy.on_bar(bar, st.vwap):
            if not self._book_allows(bar.start, setup):
                continue
            task = asyncio.get_event_loop().create_task(self._handle_setup(setup))
            self._pending.add(task)
            task.add_done_callback(self._pending.discard)

    def _book_allows(self, ts: datetime, setup: Setup) -> bool:
        t = et_time(ts)
        if t >= self.s.strategy.hunt_end and self.s.account.afternoon_only_if_red and self.book.realized > 0:
            return False   # "if you're up by 11:00, call it a day"
        for w in self.s.strategy.news_blackouts:
            try:
                d, span = w.split(" ")
                a, b = span.split("-")
                if str(et_date(ts)) == d and a <= f"{t:%H:%M}" < b:
                    self.emit(Event(EventType.RISK_BLOCK, ts, setup.symbol, f"{setup.kind} skipped: news blackout {w}"))
                    return False
            except ValueError:
                continue
        return True

    async def _handle_setup(self, setup: Setup) -> None:
        now = self.feed.now()
        spot = self.state[setup.symbol].last or setup.entry_underlying
        pos = self.manager.open_on(setup.symbol, setup.side)
        if pos is not None:
            if self.s.strategy.allow_adds and pos.next_target > 0 and pos.sold > 0:
                qty, px = pos.sold, pos.last_premium
                if self.executor is not None:
                    qty, px = await self._exec_buy(setup.symbol, pos.sig.contract.occ_symbol, qty, px)
                    if qty == 0:
                        return
                self.emit(self.manager.add(pos, qty, px, now, f"{setup.kind} @ {setup.trigger_level}"))
                self._mark(setup.symbol, now, setup.side.value == "CALL", "ADD", spot)
            return
        o = self.s.options
        try:
            chain = await self.feed.option_chain(setup.symbol, setup.side, et_date(now),
                                                 et_date(now) + timedelta(days=o.max_dte + 3), spot)
        except Exception as e:  # noqa: BLE001
            self.emit(Event(EventType.RISK_BLOCK, now, setup.symbol, f"{setup.kind}: option chain error {e}"))
            return
        q, why = select_contract(chain, setup.side, spot, now, o)
        if q is None:
            self.emit(Event(EventType.RISK_BLOCK, now, setup.symbol, f"{setup.kind} {setup.side.value} skipped: {'; '.join(why)}"))
            return
        sig, reason = build_signal(setup, q, spot, now, self.book, self.s.account)
        if sig is None:
            self.emit(Event(EventType.RISK_BLOCK, now, setup.symbol,
                            f"{setup.kind} {setup.side.value} @ {setup.trigger_level} skipped: {reason}"))
            return
        if self.executor is not None:
            filled, avg = await self._exec_buy(setup.symbol, q.occ_symbol, sig.contracts, sig.entry_premium)
            if filled == 0:
                return
            sig.contracts, sig.entry_premium = filled, round(avg, 2)
            sig.stop_premium = round(avg * (1 - sig.stop_pct), 2)
            sig.capital_used = round(filled * avg * 100, 2)
            sig.max_loss_dollars = round(filled * (avg - sig.stop_premium) * 100, 2)
        self.signals.append(sig)
        self.emit(self.manager.open(sig))
        self._mark(setup.symbol, now, setup.side.value == "CALL", f"{setup.kind.split('_')[0]} {setup.side.value}", spot)
        await self.feed.subscribe_option(q.occ_symbol)

    async def _exec_buy(self, sym: str, occ: str, qty: int, limit: float) -> tuple[int, float]:
        now = self.feed.now()
        try:
            filled, avg = await self.executor.buy(occ, qty, limit)
        except Exception as e:  # noqa: BLE001
            self.emit(Event(EventType.ORDER, now, sym, f"{self.executor.label} BUY {qty} {occ} REJECTED: {e}"))
            return 0, 0.0
        msg = (f"{self.executor.label} BUY {occ}: filled {filled}/{qty} @ {avg:.2f}" if filled
               else f"{self.executor.label} BUY {occ}: not filled at {limit:.2f} in time — signal void")
        self.emit(Event(EventType.ORDER, now, sym, msg))
        return filled, avg

    async def _exec_sell(self, ev: Event) -> None:
        occ, qty = ev.data.get("occ"), int(ev.data.get("sell", 0))
        if not occ or qty <= 0:
            return
        try:
            filled, avg = await self.executor.sell(occ, qty)
            msg = f"{self.executor.label} SELL {occ}: filled {filled}/{qty} @ {avg:.2f}"
        except Exception as e:  # noqa: BLE001
            msg = f"{self.executor.label} SELL {qty} {occ} FAILED: {e} — CLOSE IT MANUALLY"
        self.emit(Event(EventType.ORDER, self.feed.now(), ev.symbol, msg))

    def _mark(self, sym: str, ts: datetime, up: bool, text: str, price: float) -> None:
        self.markers.setdefault(sym, []).append({"ts": ts, "up": up, "text": text, "price": price})

    def emit(self, ev: Event) -> None:
        self.events.put_nowait(ev)
        if ev.type in (EventType.TRIM, EventType.STOP, EventType.TARGET_FINAL, EventType.TIME_EXIT,
                       EventType.BREAKEVEN_EXIT):
            st = self.state.get(ev.symbol)
            self._mark(ev.symbol, ev.ts, ev.type is not EventType.STOP, ev.type.value, st.last if st else 0)
            if self.executor is not None:
                task = asyncio.get_event_loop().create_task(self._exec_sell(ev))
                self._pending.add(task)
                task.add_done_callback(self._pending.discard)

    async def pump_events(self) -> None:
        while True:
            ev = await self.events.get()
            await self.alerter.send(ev)

    async def drain(self) -> None:
        while self._pending:
            await asyncio.gather(*list(self._pending))
        while not self.events.empty():
            await self.alerter.send(self.events.get_nowait())

    # ---------------------------------------------------------------- dashboard
    def snapshot(self) -> dict:
        return {
            "day": str(self.day), "equity": round(self.book.equity, 2), "day_pnl": round(self.book.realized, 2),
            "trades": self.book.trades, "losers": self.book.losers, "rung": self.book.rung,
            "mode": self.s.execution.mode,
            "symbols": {s: {"last": st.last, "vwap": round(st.vwap, 2) if st.vwap else None,
                            "benched": st.strategy.benched, **st.levels.snapshot()} for s, st in self.state.items()},
            "open": [{"id": p.sig.id, "symbol": p.sig.setup.symbol, "contract": p.sig.contract.occ_symbol,
                      "remaining": p.remaining, "stop": p.stop_premium, "last": p.last_premium,
                      "entry": p.avg_entry, "targets": p.sig.targets_premium}
                     for p in self.manager.positions.values()],
            "events": self.alerter.recent[-60:],
        }

    def chart(self, sym: str, tf: int) -> dict:
        st = self.state.get(sym)
        if st is None:
            return {"bars": []}
        bars = list(st.bars1m)
        cur = st.builders[60].current
        if cur is not None:
            bars.append(cur)
        if not bars:
            return {"bars": []}
        days = sorted({et_date(b.start) for b in bars})[-2:]
        bars = resample([b for b in bars if et_date(b.start) in days], tf)

        def t(ts: datetime) -> int:  # lightweight-charts shows UTC; shift so the axis reads ET
            return int(ts.timestamp() + to_et(ts).utcoffset().total_seconds())

        e8, e21, s200 = EMA(8), EMA(21), SMA(200)
        ema8, ema21, sma200, vwap = [], [], [], []
        pv = vol = 0.0
        vday = None
        for b in bars:
            tt = t(b.start)
            ema8.append({"time": tt, "value": round(e8.update(b.close), 3)})
            ema21.append({"time": tt, "value": round(e21.update(b.close), 3)})
            v = s200.update(b.close)
            if v is not None:
                sma200.append({"time": tt, "value": round(v, 3)})
            if is_rth(b.start):
                if et_date(b.start) != vday:
                    vday, pv, vol = et_date(b.start), 0.0, 0.0
                pv += b.vwap_num or b.close * b.volume
                vol += b.volume
                if vol:
                    vwap.append({"time": tt, "value": round(pv / vol, 3)})
        marks = []
        for m in self.markers.get(sym, []):
            epoch = int(m["ts"].timestamp())
            marks.append({"time": t(datetime.fromtimestamp(epoch - epoch % tf, tz=ET)),
                          "position": "belowBar" if m["up"] else "aboveBar",
                          "color": "#3fb950" if m["up"] else "#f85149",
                          "shape": "arrowUp" if m["up"] else "arrowDown", "text": m["text"]})
        return {
            "bars": [{"time": t(b.start), "open": b.open, "high": b.high, "low": b.low, "close": b.close,
                      "volume": b.volume} for b in bars],
            "ema8": ema8, "ema21": ema21, "sma200": sma200, "vwap": vwap,
            "levels": st.levels.snapshot(), "markers": sorted(marks, key=lambda m: m["time"]),
        }


def fmt(x: float | None) -> str:
    return "—" if x is None else f"{x:.2f}"


async def run_engine(engine: Engine, until: datetime | None = None) -> None:
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
    run = asyncio.create_task(feed.run())
    try:
        if until is not None:
            delay = max(0.0, (until - datetime.now(ET)).total_seconds())
            done, _ = await asyncio.wait({run}, timeout=delay)
            if run not in done:
                run.cancel()
        else:
            await run
    finally:
        if not run.done():
            run.cancel()
        await engine.drain()
        for tk in (pump, clk):
            if tk:
                tk.cancel()
