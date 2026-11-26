"""Kay Capitals levels, redrawn fresh every morning.

  * Hourly chart, extended hours ON: swing levels (bends in price, adjusted to wicks),
    then keep the 3 nearest above the pre-market high and 3 below the pre-market low.
  * Pre-market high/low, yesterday's high/low, today's open, hourly 200 SMA.
  * NTZ (No Trading Zone) = max(yesterday high, PM high) .. min(yesterday low, PM low).
  * ORB = high/low of the first 15 minutes.
  * Intraday: a level is added wherever price clearly rejects (5-min swing pivots).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

from .models import Bar
from .timeutil import RTH_OPEN, et_date, et_time, is_premarket, is_rth


def find_pivots(bars: list[Bar], left: int, right: int) -> tuple[list[float], list[float]]:
    highs, lows = [], []
    for i in range(left, len(bars) - right):
        win = bars[i - left:i + right + 1]
        if all(bars[i].high >= b.high for b in win):
            highs.append(bars[i].high)
        if all(bars[i].low <= b.low for b in win):
            lows.append(bars[i].low)
    return highs, lows


def merge_levels(levels: list[float], tol_pct: float) -> list[float]:
    """Collapse levels closer than tol_pct ("delete levels too close together")."""
    out: list[list[float]] = []
    for lv in sorted(levels):
        if out and abs(lv - out[-1][-1]) / lv * 100 <= tol_pct:
            out[-1].append(lv)
        else:
            out.append([lv])
    return [round(sum(g) / len(g), 2) for g in out]


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


@dataclass
class DayLevels:
    symbol: str
    day: date | None = None
    y_high: float | None = None
    y_low: float | None = None
    pm_high: float | None = None
    pm_low: float | None = None
    day_open: float | None = None
    orb_high: float | None = None
    orb_low: float | None = None
    orb_done: bool = False
    hourly_sma200: float | None = None
    hourly_levels: list[float] = field(default_factory=list)   # all hourly swing levels
    intraday_levels: list[float] = field(default_factory=list)
    each_side: int = 3

    def load_history(self, bars_1m: list[Bar], bars_60m: list[Bar], today: date, pivot: int) -> None:
        self.day = today
        prior = [b for b in bars_1m if et_date(b.start) < today and is_rth(b.start)]
        if prior:
            last_day = max(et_date(b.start) for b in prior)
            yb = [b for b in prior if et_date(b.start) == last_day]
            self.y_high = max(b.high for b in yb)
            self.y_low = min(b.low for b in yb)
        hourly = [b for b in bars_60m if et_date(b.start) < today]
        hs, ls = find_pivots(hourly, pivot, pivot)
        self.hourly_levels = merge_levels(hs + ls, 0.25)
        closes = [b.close for b in bars_60m]
        if len(closes) >= 200:
            self.hourly_sma200 = round(sum(closes[-200:]) / 200, 2)
        for b in bars_1m:  # whatever already printed today (pre-market, or a late start)
            if et_date(b.start) == today:
                self.on_bar(b)

    def on_bar(self, b: Bar, orb_minutes: int = 15) -> None:
        if self.day is not None and et_date(b.start) != self.day:
            return
        if is_premarket(b.start):
            self.pm_high = b.high if self.pm_high is None else max(self.pm_high, b.high)
            self.pm_low = b.low if self.pm_low is None else min(self.pm_low, b.low)
        orb_end = (datetime.combine(date.min, RTH_OPEN) + timedelta(minutes=orb_minutes)).time()
        t = et_time(b.start)
        if t == RTH_OPEN and self.day_open is None:
            self.day_open = b.open
        if RTH_OPEN <= t < orb_end:
            self.orb_high = b.high if self.orb_high is None else max(self.orb_high, b.high)
            self.orb_low = b.low if self.orb_low is None else min(self.orb_low, b.low)
        elif t >= orb_end and self.orb_high is not None:
            self.orb_done = True

    def add_intraday_pivots(self, bars_5m: list[Bar], pivot: int = 3) -> None:
        today = [b for b in bars_5m if et_date(b.start) == self.day and is_rth(b.start)]
        hs, ls = find_pivots(today, pivot, pivot)
        self.intraday_levels = merge_levels(hs + ls, 0.1)

    # ------------------------------------------------------------------ derived
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

    def key_hourly(self) -> list[float]:
        """3 hourly levels above the PM high and 3 below the PM low (falls back to yesterday)."""
        hi = self.pm_high or self.y_high
        lo = self.pm_low or self.y_low
        if hi is None or lo is None:
            return self.hourly_levels
        above = [x for x in self.hourly_levels if x > hi][: self.each_side]
        below = sorted([x for x in self.hourly_levels if x < lo], reverse=True)[: self.each_side]
        inside = [x for x in self.hourly_levels if lo <= x <= hi]
        return sorted(above + below + inside)

    def all_levels(self) -> list[float]:
        pts = [self.y_high, self.y_low, self.pm_high, self.pm_low, self.day_open, self.hourly_sma200]
        if self.orb_done:
            pts += [self.orb_high, self.orb_low]
        pts += self.key_hourly() + self.intraday_levels
        return merge_levels([p for p in pts if p is not None], 0.08)

    def next_levels(self, price: float, up: bool, extra: list[float] | None = None,
                    beyond_pct: float = 0.08, n: int = 4) -> list[float]:
        gap = price * beyond_pct / 100
        lv = merge_levels(self.all_levels() + [x for x in (extra or []) if x], 0.08)
        if up:
            return [x for x in lv if x > price + gap][:n]
        return sorted([x for x in lv if x < price - gap], reverse=True)[:n]

    def snapshot(self) -> dict:
        return {
            "y_high": self.y_high, "y_low": self.y_low, "pm_high": self.pm_high, "pm_low": self.pm_low,
            "day_open": self.day_open, "hourly_sma200": self.hourly_sma200,
            "ntz": [self.ntz_bottom, self.ntz_top], "orb": [self.orb_low, self.orb_high] if self.orb_done else [None, None],
            "hourly": self.key_hourly(), "intraday": self.intraday_levels,
        }
