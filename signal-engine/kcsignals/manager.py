"""Manages each live signal second by second and emits exit instructions.

Plan per trade (Kay Capitals scale-out):
  T1 hit  -> sell trim_fraction (50%), move stop to breakeven (entry price)
  T2/T3   -> sell half of what's left / the rest
  Stop    -> premium at/below stop, OR underlying trades through the structural stop
  Time    -> flat by flat_by_0dte (15:45 ET) unless hold_overnight is set
The engine assumes you took each ENTRY it sent, to keep its day P&L guard honest.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from .config import Settings
from .models import Event, EventType, OptionQuote, Side, Signal
from .risk import DayBook
from .timeutil import et_date, et_time


@dataclass
class Position:
    sig: Signal
    remaining: int
    stop_premium: float
    next_target: int = 0
    realized: float = 0.0
    last_premium: float = 0.0
    last_spot: float = 0.0
    history: list[str] = field(default_factory=list)


class TradeManager:
    def __init__(self, settings: Settings, book: DayBook):
        self.s = settings
        self.book = book
        self.positions: dict[str, Position] = {}

    def open(self, sig: Signal) -> Event:
        self.positions[sig.id] = Position(sig, sig.contracts, sig.stop_premium, last_premium=sig.entry_premium,
                                          last_spot=sig.setup.entry_underlying)
        self.book.open_ids.add(sig.id)
        self.book.trades += 1
        return Event(EventType.ENTRY, sig.created, sig.setup.symbol, format_entry(sig), sig.id)

    def by_occ(self, occ: str) -> list[Position]:
        return [p for p in self.positions.values() if p.sig.contract.occ_symbol == occ]

    def by_symbol(self, sym: str) -> list[Position]:
        return [p for p in self.positions.values() if p.sig.setup.symbol == sym]

    # ------------------------------------------------------------------
    def on_option_quote(self, q: OptionQuote, now: datetime) -> list[Event]:
        out = []
        for p in self.by_occ(q.occ_symbol):
            if q.bid > 0:
                p.last_premium = q.bid if q.ask <= 0 else q.mid
                out += self._check(p, now, spot=None)
        return out

    def on_underlying(self, symbol: str, price: float, now: datetime) -> list[Event]:
        out = []
        for p in self.by_symbol(symbol):
            p.last_spot = price
            out += self._check(p, now, spot=price)
        return out

    def on_clock(self, now: datetime) -> list[Event]:
        out = []
        t = et_time(now)
        for p in list(self.positions.values()):
            same_day = p.sig.contract.expiry <= et_date(now)
            if t >= self.s.strategy.flat_by_0dte and (same_day or not self.s.strategy.hold_overnight):
                out.append(self._close(p, now, EventType.TIME_EXIT,
                                       f"{et_time(now):%H:%M} ET — close everything, don't hold 0DTE into the bell"))
        return out

    # ------------------------------------------------------------------
    def _check(self, p: Position, now: datetime, spot: float | None) -> list[Event]:
        sig = p.sig
        st = sig.setup
        up = st.side is Side.CALL
        prem = p.last_premium
        ev: list[Event] = []

        # Stops first.
        struct_broken = spot is not None and p.next_target == 0 and (
            spot <= st.stop_underlying if up else spot >= st.stop_underlying)
        if prem <= p.stop_premium or struct_broken:
            if p.next_target > 0:
                return [self._close(p, now, EventType.BREAKEVEN_EXIT, "Pulled back to entry after the trim — out at breakeven")]
            why = (f"{st.symbol} traded through {st.stop_underlying}" if struct_broken
                   else f"premium {prem:.2f} <= stop {p.stop_premium:.2f}")
            return [self._close(p, now, EventType.STOP, f"STOP: {why}. Take the loss, no revenge trade.")]

        # Targets (premium, or underlying reaching the level if option quotes lag).
        while p.next_target < len(sig.targets_premium) and p.remaining > 0:
            i = p.next_target
            tgt_p = sig.targets_premium[i]
            tgt_u = st.targets_underlying[i] if i < len(st.targets_underlying) else None
            hit_u = spot is not None and tgt_u is not None and (spot >= tgt_u if up else spot <= tgt_u)
            if not (prem >= tgt_p or hit_u):
                break
            last = i == len(sig.targets_premium) - 1
            qty = p.remaining if last or p.remaining == 1 else max(1, int(p.remaining * self.s.strategy.trim_fraction))
            px = max(prem, tgt_p) if prem >= tgt_p else prem
            p.remaining -= qty
            p.realized += qty * (px - sig.entry_premium) * 100
            p.next_target += 1
            p.stop_premium = max(p.stop_premium, sig.entry_premium)
            if p.remaining == 0:
                ev.append(self._close(p, now, EventType.TARGET_FINAL,
                                      f"TARGET {i + 1} hit (~{px:.2f}): sell the last {qty}. Trade done."))
                break
            ev.append(Event(EventType.TRIM, now, st.symbol,
                            f"TARGET {i + 1} hit (~{px:.2f}, underlying {tgt_u}): SELL {qty} of {qty + p.remaining} "
                            f"{sig.contract.occ_symbol}. Move stop on the rest to BREAKEVEN {sig.entry_premium:.2f}.",
                            sig.id, {"sell": qty, "remaining": p.remaining}))
        return ev

    def _close(self, p: Position, now: datetime, typ: EventType, msg: str) -> Event:
        sig = p.sig
        px = p.last_premium
        if typ is EventType.STOP:
            px = min(px, p.stop_premium) if px > 0 else p.stop_premium
        if p.remaining:
            p.realized += p.remaining * (px - sig.entry_premium) * 100
        qty = p.remaining
        p.remaining = 0
        self.positions.pop(sig.id, None)
        self.book.open_ids.discard(sig.id)
        self.book.realized += p.realized
        if p.realized < 0:
            self.book.losers += 1
        text = f"{msg} {'SELL ' + str(qty) + ' ' + sig.contract.occ_symbol + '. ' if qty and typ is not EventType.TARGET_FINAL else ''}" \
               f"Trade P&L ≈ ${p.realized:,.0f}. Day P&L ≈ ${self.book.realized:,.0f}."
        return Event(typ, now, sig.setup.symbol, text, sig.id, {"pnl": round(p.realized, 2)})


def format_entry(sig: Signal) -> str:
    st, c = sig.setup, sig.contract
    tgts = " / ".join(f"{p:.2f} (stock {u})" for p, u in zip(sig.targets_premium, st.targets_underlying))
    return (
        f"BUY {sig.contracts}x {st.symbol} {c.expiry:%m/%d} {c.strike:g}{'C' if st.side is Side.CALL else 'P'} "
        f"[{c.occ_symbol}] limit {sig.entry_premium:.2f} (bid {c.bid:.2f}/ask {c.ask:.2f}, Δ {abs(c.delta or 0):.2f})\n"
        f"Setup: {st.kind} @ {st.trigger_level} on {st.timeframe_s // 60}m; stock {st.entry_underlying}\n"
        f"STOP: option {sig.stop_premium:.2f} (-{sig.stop_pct:.0%}) or stock through {st.stop_underlying}\n"
        f"TARGETS: {tgts}  (R:R {sig.risk_reward:.1f} to T1)\n"
        f"Size: ${sig.capital_used:,.0f} in, max loss ≈ ${sig.max_loss_dollars:,.0f}. "
        f"Plan: sell half at T1, stop to breakeven.\n" + ("; ".join(st.notes))
    )
