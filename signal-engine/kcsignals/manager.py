"""Manages each live trade second by second and emits exit instructions.

Scale-out (from the video):
  T1 -> sell half (rounded UP: 5 -> sell 3), stop to breakeven
  T2 -> sell half of what's left (rounded up); runner stop moves to T1 if trail_after_t2
  Runner rides until its stop, the next target, or the time exit.
  Add: once the stop is at breakeven, a fresh setup in the same direction re-adds the
       contracts already sold ("additions is where the money is made").
Stop: option at/below stop, or the stock trading through the chart stop (before T1).
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime

from .config import Settings
from .models import Event, EventType, OptionQuote, Side, Signal
from .risk import DayBook
from .timeutil import et_date, et_time


@dataclass
class Position:
    sig: Signal
    remaining: int
    avg_entry: float
    stop_premium: float
    next_target: int = 0
    sold: int = 0
    realized: float = 0.0
    last_premium: float = 0.0


class TradeManager:
    def __init__(self, settings: Settings, book: DayBook):
        self.s = settings
        self.book = book
        self.positions: dict[str, Position] = {}

    def open(self, sig: Signal) -> Event:
        self.positions[sig.id] = Position(sig, sig.contracts, sig.entry_premium, sig.stop_premium,
                                          last_premium=sig.entry_premium)
        self.book.open_ids.add(sig.id)
        self.book.trades += 1
        return Event(EventType.ENTRY, sig.created, sig.setup.symbol, format_entry(sig), sig.id,
                     {"occ": sig.contract.occ_symbol, "buy": sig.contracts, "limit": sig.entry_premium})

    def open_on(self, symbol: str, side: Side) -> Position | None:
        for p in self.positions.values():
            if p.sig.setup.symbol == symbol and p.sig.setup.side is side:
                return p
        return None

    def add(self, p: Position, qty: int, price: float, now: datetime, why: str) -> Event:
        p.avg_entry = round((p.avg_entry * p.remaining + price * qty) / (p.remaining + qty), 4)
        p.remaining += qty
        p.sold = 0
        # "Risk-free" add: lift the stop so the whole trade (banked trims included) can't go red.
        floor = round(p.avg_entry - p.realized / (p.remaining * 100), 2)
        p.stop_premium = max(p.stop_premium, floor)
        return Event(EventType.ADD, now, p.sig.setup.symbol,
                     f"ADD {qty}x {p.sig.contract.occ_symbol} at ~{price:.2f} ({why}). Now {p.remaining} contracts, "
                     f"stop {p.stop_premium:.2f} (whole trade stays green at worst).", p.sig.id,
                     {"occ": p.sig.contract.occ_symbol, "buy": qty, "limit": price})

    # ------------------------------------------------------------------ inputs
    def on_option_quote(self, q: OptionQuote, now: datetime) -> list[Event]:
        out = []
        for p in [p for p in self.positions.values() if p.sig.contract.occ_symbol == q.occ_symbol]:
            if q.bid > 0:
                p.last_premium = q.mid if q.ask > 0 else q.bid
                out += self._check(p, now, None)
        return out

    def on_underlying(self, symbol: str, price: float, now: datetime) -> list[Event]:
        out = []
        for p in [p for p in self.positions.values() if p.sig.setup.symbol == symbol]:
            out += self._check(p, now, price)
        return out

    def on_clock(self, now: datetime) -> list[Event]:
        out = []
        for p in list(self.positions.values()):
            same_day = p.sig.contract.expiry <= et_date(now)
            if et_time(now) >= self.s.strategy.flat_by_0dte and (same_day or not self.s.strategy.hold_overnight):
                out.append(self._close(p, now, EventType.TIME_EXIT, f"{et_time(now):%H:%M} ET — time exit, be flat into the close."))
        return out

    # ------------------------------------------------------------------ logic
    def _check(self, p: Position, now: datetime, spot: float | None) -> list[Event]:
        sig, st = p.sig, p.sig.setup
        up = st.side is Side.CALL
        prem = p.last_premium
        struct_broken = spot is not None and p.next_target == 0 and (
            spot <= st.stop_underlying if up else spot >= st.stop_underlying)
        if prem <= p.stop_premium or struct_broken:
            if p.next_target > 0:
                return [self._close(p, now, EventType.BREAKEVEN_EXIT,
                                    f"Runner stopped at {p.stop_premium:.2f} after taking profits.")]
            why = (f"{st.symbol} traded through {st.stop_underlying}" if struct_broken
                   else f"option {prem:.2f} <= stop {p.stop_premium:.2f}")
            return [self._close(p, now, EventType.STOP, f"STOP: {why}. Take the loss, no revenge trade.")]

        ev: list[Event] = []
        while p.next_target < len(sig.targets_premium) and p.remaining > 0:
            i = p.next_target
            tgt_p = sig.targets_premium[i]
            tgt_u = st.targets_underlying[i] if i < len(st.targets_underlying) else None
            hit_u = spot is not None and tgt_u is not None and (spot >= tgt_u if up else spot <= tgt_u)
            if not (prem >= tgt_p or hit_u):
                break
            qty = math.ceil(p.remaining * self.s.strategy.trim_fraction)
            p.next_target += 1
            if qty >= p.remaining:
                ev.append(self._close(p, now, EventType.TARGET_FINAL, f"TARGET {i + 1} hit (~{prem:.2f}). Trade done."))
                break
            p.remaining -= qty
            p.sold += qty
            p.realized += qty * (prem - p.avg_entry) * 100
            if i == 0:
                p.stop_premium = max(p.stop_premium, sig.entry_premium)
                stop_txt = f"stop on the rest to BREAKEVEN {p.stop_premium:.2f}"
            elif self.s.strategy.trail_after_t2:
                p.stop_premium = max(p.stop_premium, sig.targets_premium[i - 1])
                stop_txt = f"runner stop up to {p.stop_premium:.2f} (T{i})"
            else:
                stop_txt = f"runner stop stays {p.stop_premium:.2f}"
            ev.append(Event(EventType.TRIM, now, st.symbol,
                            f"TARGET {i + 1} hit (~{prem:.2f}, stock {tgt_u}): SELL {qty} of {qty + p.remaining} "
                            f"{sig.contract.occ_symbol}; {stop_txt}.", sig.id,
                            {"occ": sig.contract.occ_symbol, "sell": qty, "remaining": p.remaining}))
        return ev

    def _close(self, p: Position, now: datetime, typ: EventType, msg: str) -> Event:
        sig = p.sig
        px = p.last_premium
        if typ in (EventType.STOP, EventType.BREAKEVEN_EXIT):
            px = min(px, p.stop_premium) if px > 0 else p.stop_premium
        qty = p.remaining
        p.realized += qty * (px - p.avg_entry) * 100
        p.remaining = 0
        self.positions.pop(sig.id, None)
        self.book.open_ids.discard(sig.id)
        self.book.realized += p.realized
        self.book.record(p.realized, len(self.s.account.size_ladder))
        text = (f"{msg} SELL {qty} {sig.contract.occ_symbol}. Trade P&L ≈ ${p.realized:,.0f} · "
                f"day ≈ ${self.book.realized:,.0f}.")
        return Event(typ, now, sig.setup.symbol, text, sig.id,
                     {"occ": sig.contract.occ_symbol, "sell": qty, "pnl": round(p.realized, 2)})

    def void(self, sig_id: str) -> None:
        """Entry never filled (auto-trading): forget it without counting a trade."""
        if self.positions.pop(sig_id, None):
            self.book.open_ids.discard(sig_id)
            self.book.trades -= 1


def format_entry(sig: Signal) -> str:
    st, c = sig.setup, sig.contract
    tgts = " / ".join(f"{p:.2f} (stock {u})" for p, u in zip(sig.targets_premium, st.targets_underlying))
    return (
        f"BUY {sig.contracts}x {st.symbol} {c.expiry:%m/%d} {c.strike:g}{'C' if st.side is Side.CALL else 'P'} "
        f"[{c.occ_symbol}] limit {sig.entry_premium:.2f} (bid {c.bid:.2f}/ask {c.ask:.2f}, Δ {abs(c.delta or 0):.2f})\n"
        f"Setup: {st.kind} @ {st.trigger_level}; stock {st.entry_underlying}\n"
        f"STOP: option {sig.stop_premium:.2f} (-{sig.stop_pct:.0%}) or stock through {st.stop_underlying}\n"
        f"TARGETS: {tgts}  (R:R {sig.risk_reward:.1f} to T1)\n"
        f"Size: ${sig.capital_used:,.0f}, max loss ≈ ${sig.max_loss_dollars:,.0f}. Sell half at T1, stop to breakeven.\n"
        + "; ".join(st.notes)
    )
