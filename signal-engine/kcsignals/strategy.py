"""Kay Capitals entry setups, evaluated on closed bars of the 2m / 5m / 10m charts.

1. BREAK + RETEST (NTZ edge, ORB, VWAP, key level): a close through the line on
   above-average volume arms it; a later candle pulls back to the line, holds, on lower
   volume than the breakout -> entry. Never chase the breakout candle itself.
2. FIB PULLBACK ("LTP"): in a trend (EMA8 over EMA21 and price on the right side of
   VWAP), after the first counter-trend candle draw a Fib from where the leg started to
   its extreme. Entry when a candle dips into 0.236-0.382, holds, and closes back in the
   trend direction (patience candle) with at least one confluence line in that zone
   (EMA8/21, VWAP, SMA200/400, ORB, a level). A touch of 0.5 kills it until a new extreme.
3. LEVEL FLAG: a tight flag sitting right on a level, then a candle breaks the flag on
   above-average volume.
Filters: no entries in the first 15 min, none inside the NTZ, none after 11:00 by
default, and a symbol is benched for the day after repeated failed ORB breaks (chop).
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import date, datetime

from .config import StrategyCfg
from .indicators import Indicators
from .levels import DayLevels, resample
from .models import Bar, Setup, Side
from .timeutil import RTH_OPEN, et_date, et_time, is_rth


@dataclass
class _Arm:
    line: float
    bar_index: int
    breakout_volume: float


@dataclass
class _Leg:
    hi: float | None = None
    lo: float | None = None
    invalid: bool = False


@dataclass
class TFState:
    seconds: int
    ind: Indicators
    bars: deque = field(default_factory=lambda: deque(maxlen=300))
    n: int = 0
    arms: dict = field(default_factory=dict)
    legs: dict = field(default_factory=lambda: {Side.CALL: _Leg(), Side.PUT: _Leg()})


class SymbolStrategy:
    def __init__(self, symbol: str, cfg: StrategyCfg, levels: DayLevels):
        self.symbol = symbol
        self.cfg = cfg
        self.levels = levels
        self.tf = {secs: TFState(secs, Indicators(cfg.volume_len)) for secs, _, _ in cfg.timeframes}
        self.fired: set[tuple] = set()
        self.failed_orb = 0
        self.benched = False
        self.first2m_note: str | None = None
        self.day: date | None = None

    # ---------------------------------------------------------------- housekeeping
    def warmup(self, bars_1m: list[Bar]) -> None:
        for secs, st in self.tf.items():
            for b in resample([b for b in bars_1m], secs):
                st.ind.update(b)
                st.bars.append(b)

    def _new_day(self, d: date) -> None:
        self.day = d
        self.fired.clear()
        self.failed_orb = 0
        self.benched = False
        self.first2m_note = None
        for st in self.tf.values():
            st.arms.clear()
            st.legs = {Side.CALL: _Leg(), Side.PUT: _Leg()}

    def window_open(self, secs: int, ts: datetime) -> bool:
        t = et_time(ts)
        return any(s == secs and a <= t < b for s, a, b in self.cfg.timeframes)

    def entries_allowed(self, ts: datetime) -> bool:
        t = et_time(ts)
        if t < self.cfg.hunt_start or t >= self.cfg.no_new_entries_after:
            return False
        if t >= self.cfg.hunt_end and not self.cfg.allow_afternoon:
            return False
        return not self.benched

    # ---------------------------------------------------------------- main entry
    def on_bar(self, bar: Bar, vwap: float | None) -> list[Setup]:
        st = self.tf.get(bar.seconds)
        if st is None:
            return []
        d = et_date(bar.start)
        if d != self.day:
            self._new_day(d)
        st.ind.update(bar)
        st.bars.append(bar)
        st.n += 1
        if not is_rth(bar.start):
            return []
        if bar.seconds == 120 and et_time(bar.start) == RTH_OPEN and self.first2m_note is None:
            lv = self.levels
            if lv.pm_high and bar.high > lv.pm_high:
                self.first2m_note = "first 2m candle broke the PM high (priority ticker)"
            elif lv.pm_low and bar.low < lv.pm_low:
                self.first2m_note = "first 2m candle broke the PM low (priority ticker)"
        if len(st.bars) < 6 or not self.window_open(bar.seconds, bar.start):
            return []

        setups: list[Setup] = []
        if self.cfg.use_break_retest:
            setups += self._break_retest(st, bar, vwap)
        if self.cfg.use_fib_pullbacks:
            setups += self._fib(st, bar, vwap)
        if self.cfg.use_level_flags:
            setups += self._flag(st, bar, vwap)

        out = []
        for s in setups:
            key = (s.kind, s.side, round(s.trigger_level, 1))
            if key in self.fired or not self.entries_allowed(bar.start):
                continue
            if self.cfg.block_inside_ntz and self.levels.in_ntz(bar.close):
                continue
            self.fired.add(key)
            if self.first2m_note:
                s.notes.append(self.first2m_note)
            out.append(s)
        return out

    # ---------------------------------------------------------------- setups
    def _lines(self, vwap):
        lv = self.levels
        if lv.ntz_top is not None:
            yield "NTZ", lv.ntz_top, Side.CALL
            yield "NTZ", lv.ntz_bottom, Side.PUT
        if lv.orb_done:
            yield "ORB", lv.orb_high, Side.CALL
            yield "ORB", lv.orb_low, Side.PUT
        if self.cfg.use_vwap_setups and vwap is not None:
            yield "VWAP", vwap, Side.CALL
            yield "VWAP", vwap, Side.PUT
        if self.cfg.use_level_setups:
            skip = {round(x, 1) for x in (lv.ntz_top, lv.ntz_bottom, lv.orb_high, lv.orb_low) if x}
            for x in lv.key_hourly() + lv.intraday_levels:
                if round(x, 1) not in skip:
                    yield "LEVEL", x, Side.CALL
                    yield "LEVEL", x, Side.PUT

    def _break_retest(self, st: TFState, bar: Bar, vwap) -> list[Setup]:
        prev = st.bars[-2]
        vol_avg = st.ind.prev_vol_ma or 0.0
        out = []
        for kind, line, side in self._lines(vwap):
            key = (kind, side, round(line, 2) if kind != "VWAP" else 0)
            arm = st.arms.get(key)
            up = side is Side.CALL
            tol = line * self.cfg.retest_tol_pct / 100
            if arm is None:
                crossed = (bar.close > line >= prev.close) if up else (bar.close < line <= prev.close)
                if crossed and vol_avg > 0 and bar.volume >= vol_avg * self.cfg.breakout_vol_mult:
                    st.arms[key] = _Arm(line, st.n, bar.volume)
                continue
            ref = line if kind == "VWAP" else arm.line
            failed = (bar.close < ref - tol) if up else (bar.close > ref + tol)
            if failed or st.n - arm.bar_index > self.cfg.retest_timeout_bars:
                del st.arms[key]
                if failed and kind == "ORB":
                    self.failed_orb += 1
                    if self.failed_orb >= self.cfg.chop_max_failed_orb:
                        self.benched = True   # "the stock's nature today" is chop: skip it
                continue
            if st.n == arm.bar_index:
                continue
            touched = (bar.low <= ref + tol) if up else (bar.high >= ref - tol)
            held = (bar.close > ref) if up else (bar.close < ref)
            if touched and held and bar.volume < arm.breakout_volume:
                del st.arms[key]
                buf = ref * 0.0005
                stop = min(bar.low, ref) - buf if up else max(bar.high, ref) + buf
                note = f"breakout vol {arm.breakout_volume:,.0f} > retest vol {bar.volume:,.0f}"
                out.append(self._setup(f"{kind}_BREAK_RETEST", side, ref, bar, stop, [], [note], st, vwap))
        return out

    def _fib(self, st: TFState, bar: Bar, vwap) -> list[Setup]:
        ind = st.ind
        if not (ind.ema8.ready and ind.ema21.ready and ind.atr.value):
            return []
        out = []
        recent = list(st.bars)[-30:]
        for side in (Side.CALL, Side.PUT):
            up = side is Side.CALL
            leg = st.legs[side]
            new_extreme = leg.hi is None or (bar.high > leg.hi if up else bar.low < leg.lo)
            if new_extreme:
                # Leg starts at the last swing point (2-bar pivot) before this extreme.
                start = _last_pivot(recent[:-1], low=up)
                if up:
                    leg.hi, leg.lo = bar.high, start if start is not None else min(b.low for b in recent[-12:])
                else:
                    leg.lo, leg.hi = bar.low, start if start is not None else max(b.high for b in recent[-12:])
                leg.invalid = False
                continue
            size = leg.hi - leg.lo
            if size < self.cfg.fib_min_leg_atr * ind.atr.value:
                continue
            ext = leg.hi if up else leg.lo
            sgn = 1 if up else -1
            f236, f382, f50 = (ext - sgn * r * size for r in (0.236, 0.382, 0.5))
            if (bar.low <= f50) if up else (bar.high >= f50):
                leg.invalid = True          # gave back half the move: skip until a new extreme
            if leg.invalid:
                continue
            trend = (ind.ema8.value > ind.ema21.value) if up else (ind.ema8.value < ind.ema21.value)
            if vwap is not None:
                trend = trend and ((bar.close > vwap) if up else (bar.close < vwap))
            in_zone = (bar.low <= f236 and bar.close >= f382) if up else (bar.high >= f236 and bar.close <= f382)
            patience = (bar.close > bar.open) if up else (bar.close < bar.open)
            if not (trend and in_zone and patience):
                continue
            zlo, zhi = sorted((f236, f382))
            tol = bar.close * self.cfg.retest_tol_pct / 100
            lines = dict(ind.lines())
            if vwap is not None:
                lines["VWAP"] = vwap
            lv = self.levels
            for i, x in enumerate(lv.all_levels()):
                lines[f"L{i}"] = x
            conf = sorted({("level" if k.startswith("L") else k) for k, v in lines.items() if zlo - tol <= v <= zhi + tol})
            if len(conf) < self.cfg.fib_min_confluence:
                continue
            buf = bar.close * 0.0005
            stop = min(bar.low, f382) - buf if up else max(bar.high, f382) + buf
            notes = [f"Fib leg {leg.lo:.2f}->{leg.hi:.2f}; 0.236={f236:.2f} 0.382={f382:.2f}",
                     "confluence: " + ", ".join(conf)]
            out.append(self._setup("FIB_PULLBACK", side, round(ext, 2), bar, stop, [round(ext, 2)], notes, st, vwap))
        return out

    def _flag(self, st: TFState, bar: Bar, vwap) -> list[Setup]:
        k = self.cfg.flag_bars
        atr = st.ind.atr.value
        vol_avg = st.ind.prev_vol_ma or 0.0
        if len(st.bars) < k + 2 or not atr or vol_avg <= 0:
            return []
        flag = list(st.bars)[-k - 1:-1]
        fh, fl = max(b.high for b in flag), min(b.low for b in flag)
        if fh - fl > self.cfg.flag_max_range_atr * atr or bar.volume < vol_avg * self.cfg.breakout_vol_mult:
            return []
        lv = self.levels
        cands = lv.all_levels() + ([vwap] if vwap else [])
        tol = bar.close * self.cfg.retest_tol_pct / 100
        out = []
        if bar.close > fh:
            on = [x for x in cands if fl - tol <= x <= fl + 0.5 * atr]
            if on:
                L = max(on)
                stop = min(fl, L) - bar.close * 0.0005
                out.append(self._setup("LEVEL_FLAG", Side.CALL, L, bar, stop, [], [f"flag {fl:.2f}-{fh:.2f} on {L}"], st, vwap))
        elif bar.close < fl:
            on = [x for x in cands if fh - 0.5 * atr <= x <= fh + tol]
            if on:
                L = min(on)
                stop = max(fh, L) + bar.close * 0.0005
                out.append(self._setup("LEVEL_FLAG", Side.PUT, L, bar, stop, [], [f"flag {fl:.2f}-{fh:.2f} under {L}"], st, vwap))
        return out

    # ---------------------------------------------------------------- build
    def _setup(self, kind, side, line, bar, stop, first_targets, notes, st: TFState, vwap) -> Setup:
        up = side is Side.CALL
        entry = bar.close
        ind = st.ind.lines()
        extra = [ind.get("SMA200"), ind.get("SMA400"), vwap] + first_targets
        targets = self.levels.next_levels(entry, up, extra=extra)
        notes = [f"{bar.seconds // 60}m chart"] + notes
        return Setup(symbol=self.symbol, kind=kind, side=side, ts=bar.start, trigger_level=round(line, 2),
                     entry_underlying=round(entry, 2), stop_underlying=round(stop, 2),
                     targets_underlying=[round(t, 2) for t in targets], timeframe_s=bar.seconds, notes=notes)


def _last_pivot(bars: list[Bar], low: bool, k: int = 2) -> float | None:
    """Most recent k-bar swing low (low=True) or swing high in bars."""
    for i in range(len(bars) - 1 - k, k - 1, -1):
        win = bars[i - k:i + k + 1]
        if low and all(bars[i].low <= b.low for b in win):
            return bars[i].low
        if not low and all(bars[i].high >= b.high for b in win):
            return bars[i].high
    return None
