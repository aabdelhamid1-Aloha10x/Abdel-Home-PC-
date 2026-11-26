"""Kay Capitals levels: NTZ, ORB, pre-market range, prior-day range, swing S/R.

NTZ (No Trading Zone) = max(yesterday high, pre-market high) .. min(yesterday low, pre-market low)
ORB = high/low of the first N minutes of the regular session.
Support/resistance = swing pivots from the last 1-2 weeks of 5-minute bars, plus today's.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

from .models import Bar
from .timeutil import RTH_OPEN, et_date, et_time, is_premarket, is_rth


def find_pivots(bars: list[Bar], left: int, right: int) -> tuple[list[float], list[float]]:
    highs, lows = [], []
    for i in range(left, len(bars) - right):
        h = bars[i].high
        l = bars[i].low
        if all(h >= b.high for b in bars[i - left:i + right + 1]):
            highs.append(h)
        if all(l <= b.low for b in bars[i - left:i + right + 1]):
            lows.append(l)
    return highs, lows


def merge_levels(levels: list[float], tol_pct: float) -> list[float]:
    """Collapse levels closer than tol_pct into one (average), sorted ascending."""
    out: list[list[float]] = []
    for lv in sorted(levels):
        if out and abs(lv - out[-1][-1]) / lv * 100 <= tol_pct:
            out[-1].append(lv)
        else:
            out.append([lv])
    return [round(sum(g) / len(g), 2) for g in out]


@dataclass
class DayLevels:
    symbol: str
    day: date | None = None
    y_high: float | None = None
    y_low: float | None = None
    y_close: float | None = None
    pm_high: float | None = None
    pm_low: float | None = None
    orb_high: float | None = None
    orb_low: float | None = None
    orb_done: bool = False
    swing_levels: list[float] = field(default_factory=list)   # from history
    intraday_levels: list[float] = field(default_factory=list)

    # ---- set-up -------------------------------------------------------
    def load_history(self, bars_1m: list[Bar], today: date, pivot_left: int, pivot_right: int) -> None:
        """bars_1m: 1-minute bars for the last ~10 sessions (any hours)."""
        self.day = today
        prior = [b for b in bars_1m if et_date(b.start) < today and is_rth(b.start)]
        if prior:
            last_day = max(et_date(b.start) for b in prior)
            yb = [b for b in prior if et_date(b.start) == last_day]
            self.y_high = max(b.high for b in yb)
            self.y_low = min(b.low for b in yb)
            self.y_close = yb[-1].close
        five = resample(prior, 300)
        hs, ls = find_pivots(five, pivot_left, pivot_right)
        self.swing_levels = merge_levels(hs + ls, 0.25)
        for b in bars_1m:  # pre-market already printed today, if engine starts late
            if et_date(b.start) == today:
                self.on_bar(b)

    # ---- live updates -------------------------------------------------
    def on_bar(self, b: Bar, orb_minutes: int = 15) -> None:
        if self.day is not None and et_date(b.start) != self.day:
            return
        if is_premarket(b.start):
            self.pm_high = b.high if self.pm_high is None else max(self.pm_high, b.high)
            self.pm_low = b.low if self.pm_low is None else min(self.pm_low, b.low)
        orb_end = (datetime.combine(date.min, RTH_OPEN) + timedelta(minutes=orb_minutes)).time()
        t = et_time(b.start)
        if RTH_OPEN <= t < orb_end:
            self.orb_high = b.high if self.orb_high is None else max(self.orb_high, b.high)
            self.orb_low = b.low if self.orb_low is None else min(self.orb_low, b.low)
        elif t >= orb_end and self.orb_high is not None:
            self.orb_done = True

    def add_intraday_pivots(self, bars: list[Bar], left: int, right: int) -> None:
        today = [b for b in bars if et_date(b.start) == self.day and is_rth(b.start)]
        hs, ls = find_pivots(today, left, right)
        self.intraday_levels = merge_levels(hs + ls, 0.1)

    # ---- derived ------------------------------------------------------
    @property
    def ntz_top(self) -> float | None:
        vals = [v for v in (self.y_high, self.pm_high) if v is not None]
        return max(vals) if vals else None

    @property
    def ntz_bottom(self) -> float | None:
        vals = [v for v in (self.y_low, self.pm_low) if v is not None]
        return min(vals) if vals else None

    def in_ntz(self, price: float) -> bool:
        top, bot = self.ntz_top, self.ntz_bottom
        return top is not None and bot is not None and bot <= price <= top

    def all_levels(self) -> list[float]:
        pts = [self.y_high, self.y_low, self.y_close, self.pm_high, self.pm_low]
        if self.orb_done:
            pts += [self.orb_high, self.orb_low]
        pts += self.swing_levels + self.intraday_levels
        return merge_levels([p for p in pts if p is not None], 0.1)

    def next_levels(self, price: float, up: bool, beyond_pct: float = 0.1, n: int = 3) -> list[float]:
        """The next n levels in the trade's direction, at least beyond_pct away."""
        gap = price * beyond_pct / 100
        lv = self.all_levels()
        if up:
            return [x for x in lv if x > price + gap][:n]
        return sorted([x for x in lv if x < price - gap], reverse=True)[:n]

    def snapshot(self) -> dict:
        return {
            "y_high": self.y_high, "y_low": self.y_low, "pm_high": self.pm_high, "pm_low": self.pm_low,
            "ntz": [self.ntz_bottom, self.ntz_top], "orb": [self.orb_low, self.orb_high],
            "levels": self.all_levels(),
        }


def resample(bars: list[Bar], seconds: int) -> list[Bar]:
    out: list[Bar] = []
    for b in bars:
        epoch = int(b.start.timestamp())
        start = datetime.fromtimestamp(epoch - epoch % seconds, tz=b.start.tzinfo)
        if out and out[-1].start == start:
            o = out[-1]
            o.high, o.low, o.close = max(o.high, b.high), min(o.low, b.low), b.close
            o.volume += b.volume
            o.vwap_num += b.vwap_num
        else:
            out.append(Bar(b.symbol, start, seconds, b.open, b.high, b.low, b.close, b.volume, b.vwap_num))
    return out
