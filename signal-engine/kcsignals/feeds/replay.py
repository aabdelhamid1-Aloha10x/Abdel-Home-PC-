"""Offline replay: feeds recorded or synthetic trades through the engine as if live.

Option quotes are simulated with Black-Scholes at a fixed IV, so replays test the
logic (levels, setups, sizing, exits), not real option fills.
"""
from __future__ import annotations

import asyncio
import csv
from datetime import date, datetime, time, timedelta

from ..models import Bar, OptionQuote, Side, Trade
from ..options import bs_greeks, bs_price, years_to_expiry
from ..timeutil import ET
from .base import Feed


def occ(sym: str, exp: date, side: Side, strike: float) -> str:
    return f"{sym}{exp:%y%m%d}{side.value[0]}{int(round(strike * 1000)):08d}"


def strike_step(spot: float) -> float:
    return 1.0 if spot < 100 else 2.5 if spot < 300 else 5.0


class ReplayFeed(Feed):
    def __init__(self, trades: list[Trade], history: dict[str, list[Bar]] | None = None,
                 iv: float = 0.45, speed: float = 0.0):
        self.trades = sorted(trades, key=lambda t: t.ts)
        self.history = history or {}
        self.iv = iv
        self.speed = speed
        self._now = self.trades[0].ts if self.trades else datetime.now(ET)
        self.spot: dict[str, float] = {}
        self.subs: set[str] = set()
        self._meta: dict[str, tuple[str, date, Side, float]] = {}

    @property
    def live(self) -> bool:
        return False

    def now(self) -> datetime:
        return self._now

    async def history_1m(self, symbol, start, end):
        return [b for b in self.history.get(symbol, []) if start <= b.start < end]

    def _quote(self, sym: str, exp: date, side: Side, k: float) -> OptionQuote:
        s = self.spot[sym]
        t = years_to_expiry(exp, self._now)
        mid = bs_price(side, s, k, t, self.iv)
        d, g = bs_greeks(side, s, k, t, self.iv)
        half = max(0.01, mid * 0.015)
        code = occ(sym, exp, side, k)
        self._meta[code] = (sym, exp, side, k)
        return OptionQuote(code, sym, side, k, exp, round(max(0.01, mid - half), 2), round(mid + half, 2),
                           d, g, self.iv, volume=2000, open_interest=5000, ts=self._now)

    async def option_chain(self, symbol, side, exp_from, exp_to, spot):
        step = strike_step(spot)
        atm = round(spot / step) * step
        out = []
        d = exp_from
        while d <= exp_to:
            if d.weekday() < 5:
                for i in range(-8, 9):
                    out.append(self._quote(symbol, d, side, atm + i * step))
            d += timedelta(days=1)
        return out

    async def subscribe_option(self, occ_symbol):
        self.subs.add(occ_symbol)

    async def run(self):
        last_sec = None
        for t in self.trades:
            self._now = t.ts
            self.spot[t.symbol] = t.price
            sec = t.ts.replace(microsecond=0)
            if last_sec is not None and sec != last_sec:
                self.engine.on_clock(sec)
            last_sec = sec
            self.engine.on_trade(t)
            for code in list(self.subs):
                sym, exp, side, k = self._meta[code]
                if sym == t.symbol:
                    self.engine.on_option_quote(self._quote(sym, exp, side, k))
            if self.engine._pending:
                await asyncio.gather(*self.engine._pending)
            if self.speed:
                await asyncio.sleep(self.speed)
        if self.trades:
            self.engine.on_clock(self.trades[-1].ts + timedelta(minutes=1))


def load_trades_csv(path: str) -> list[Trade]:
    """CSV columns: ts (ISO, with offset), symbol, price, size."""
    out = []
    with open(path) as f:
        for row in csv.DictReader(f):
            ts = datetime.fromisoformat(row["ts"])
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=ET)
            out.append(Trade(row["symbol"].upper(), ts, float(row["price"]), float(row["size"])))
    return out


# ---------------------------------------------------------------- synthetic day
def synthetic_day(symbol: str = "NVDA", day: date = date(2026, 11, 24), base: float = 180.0,
                  direction: Side = Side.CALL, fail: bool = False) -> tuple[list[Trade], list[Bar]]:
    """A textbook day: yesterday's range, quiet pre-market, an opening range, then a
    high-volume break of the NTZ edge, a low-volume retest, and a trend leg."""
    sgn = 1 if direction is Side.CALL else -1
    prev = day - timedelta(days=1 if day.weekday() > 0 else 3)
    hist: list[Bar] = []
    # Yesterday: oscillate between base-2 and base+2, a few swing points.
    t0 = datetime.combine(prev, time(9, 30), tzinfo=ET)
    import math
    for i in range(390):
        p = base + 2.0 * math.sin(i / 40)
        hist.append(Bar(symbol, t0 + timedelta(minutes=i), 60, p, p + 0.08, p - 0.08, p, 50_000, p * 50_000))
    y_hi = max(b.high for b in hist)
    y_lo = min(b.low for b in hist)
    edge = y_hi if sgn > 0 else y_lo

    trades: list[Trade] = []

    def emit(ts: datetime, price: float, size: float, n: int = 4) -> None:
        for j in range(n):
            trades.append(Trade(symbol, ts + timedelta(seconds=j * 60 / n), round(price, 2), size / n))

    # Pre-market 8:00-9:29 inside yesterday's range.
    t = datetime.combine(day, time(8, 0), tzinfo=ET)
    while t.time() < time(9, 30):
        emit(t, base + 0.5 * math.sin(t.minute / 7), 5_000)
        t += timedelta(minutes=1)

    path: list[tuple[float, float]] = []  # (price, volume) per minute from 9:30
    p = base + sgn * 0.5
    for i in range(15):           # opening range, still inside NTZ
        path.append((p + 0.4 * math.sin(i), 60_000))
    for i in range(4):            # drift toward the NTZ edge
        p = p + (edge - sgn * 0.3 - p) / 4
        path.append((p, 40_000))
    path.append((edge - sgn * 0.1, 40_000))
    path.append((edge - sgn * 0.05, 40_000))           # 2m bar fully below the edge
    path.append((edge + sgn * 0.6, 220_000))
    path.append((edge + sgn * 0.9, 220_000))            # 2m breakout bar, huge volume
    path.append((edge + sgn * 0.5, 30_000))
    path.append((edge + sgn * 0.1, 30_000))
    path.append((edge + sgn * 0.12, 30_000))
    path.append((edge + sgn * 0.25, 30_000))            # 2m retest bar: tags the edge, holds, quiet
    p = edge + sgn * 0.3
    for i in range(60):                                 # trend leg (or a failed breakout)
        p += (-sgn * 0.12) if fail else (sgn * 0.12)
        path.append((p, 70_000))
    for i in range(200):                                # afternoon chop to the close
        path.append((p + 0.3 * math.sin(i / 5), 30_000))

    t = datetime.combine(day, time(9, 30), tzinfo=ET)
    for price, vol in path:
        emit(t, price, vol)
        t += timedelta(minutes=1)
        if t.time() >= time(16, 0):
            break
    return trades, hist
