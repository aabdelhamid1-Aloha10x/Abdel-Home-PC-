"""Breakout + retest state machines (Kay Capitals entry logic).

Never enter on the breakout itself. Sequence, evaluated on closed bars:
  1. A bar CLOSES beyond the line on volume >= breakout_vol_mult x average  -> ARMED
  2. A later bar pulls back to within retest_tol_pct of the line, CLOSES back on the
     breakout side, on LOWER volume than the breakout bar                    -> ENTRY
  3. Disarm if no retest within retest_timeout_bars, or price closes back through the
     line by more than the tolerance (failed breakout / trap).
Lines watched: NTZ top/bottom, ORB high/low, VWAP, and nearby swing S/R levels.
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import datetime

from .config import StrategyCfg
from .levels import DayLevels
from .models import Bar, Setup, Side
from .timeutil import et_time


@dataclass
class _Arm:
    line: float
    bar_index: int
    breakout_volume: float
    breakout_close: float


class SymbolStrategy:
    def __init__(self, symbol: str, cfg: StrategyCfg, levels: DayLevels):
        self.symbol = symbol
        self.cfg = cfg
        self.levels = levels
        self.armed: dict[tuple[str, Side, int], _Arm] = {}
        self.fired_today: set[tuple[str, Side, float]] = set()
        self.bars: dict[int, deque[Bar]] = {}
        self.counter: dict[int, int] = {}

    # ------------------------------------------------------------------
    def active_timeframe(self, ts: datetime) -> int:
        t = et_time(ts)
        tf = self.cfg.timeframes[0][1]
        for start, secs in self.cfg.timeframes:
            if t >= start:
                tf = secs
        return tf

    def entries_allowed(self, ts: datetime) -> bool:
        t = et_time(ts)
        if t < self.cfg.hunt_start or t >= self.cfg.no_new_entries_after:
            return False
        if t >= self.cfg.hunt_end and not self.cfg.allow_afternoon:
            return False
        return True

    def reset_day(self) -> None:
        self.armed.clear()
        self.fired_today.clear()
        for d in self.bars.values():
            d.clear()

    # ------------------------------------------------------------------
    def on_bar(self, bar: Bar, vwap: float | None) -> list[Setup]:
        """Feed every closed bar of every tracked timeframe. Returns new entry setups."""
        tf = bar.seconds
        hist = self.bars.setdefault(tf, deque(maxlen=200))
        hist.append(bar)
        self.counter[tf] = self.counter.get(tf, 0) + 1
        idx = self.counter[tf]
        if tf != self.active_timeframe(bar.start) or len(hist) < 3:
            return []
        prior = list(hist)[-self.cfg.volume_len - 1:-1]
        vol_avg = sum(b.volume for b in prior) / len(prior) if prior else 0.0
        prev = hist[-2]

        setups: list[Setup] = []
        for kind, line, side in self._lines(vwap):
            key = (kind, side, tf)
            arm = self.armed.get(key)
            up = side is Side.CALL
            tol = line * self.cfg.retest_tol_pct / 100

            if arm is None:
                crossed = (bar.close > line >= prev.close) if up else (bar.close < line <= prev.close)
                if crossed and bar.volume >= vol_avg * self.cfg.breakout_vol_mult and vol_avg > 0:
                    self.armed[key] = _Arm(line, idx, bar.volume, bar.close)
                continue

            # moving lines (VWAP) follow the current value
            ref = line if kind == "VWAP" else arm.line
            failed = (bar.close < ref - tol) if up else (bar.close > ref + tol)
            if failed or idx - arm.bar_index > self.cfg.retest_timeout_bars:
                del self.armed[key]
                continue
            if idx == arm.bar_index:
                continue
            touched = (bar.low <= ref + tol) if up else (bar.high >= ref - tol)
            held = (bar.close > ref) if up else (bar.close < ref)
            quiet = bar.volume < arm.breakout_volume
            if touched and held and quiet:
                del self.armed[key]
                fired_key = (kind, side, round(ref, 1))
                if fired_key in self.fired_today or not self.entries_allowed(bar.start):
                    continue
                if self.cfg.block_inside_ntz and self.levels.in_ntz(bar.close):
                    continue  # Kay Capitals: no trades inside the No Trading Zone
                self.fired_today.add(fired_key)
                setups.append(self._build(kind, side, ref, bar, tf, arm))
        return setups

    # ------------------------------------------------------------------
    def _lines(self, vwap: float | None):
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
            for x in lv.swing_levels + lv.intraday_levels:
                if round(x, 1) in skip:
                    continue
                yield "LEVEL", x, Side.CALL
                yield "LEVEL", x, Side.PUT

    def _build(self, kind: str, side: Side, line: float, bar: Bar, tf: int, arm: _Arm) -> Setup:
        up = side is Side.CALL
        buffer = line * 0.0005
        # Structural stop: back through the broken line, beyond the retest candle.
        stop = min(bar.low, line) - buffer if up else max(bar.high, line) + buffer
        entry = bar.close
        targets = self.levels.next_levels(entry, up)
        risk = abs(entry - stop)
        # Fallback targets when no marked level is in the way: measured R multiples.
        # risk.build_signal later drops any that pay < min R:R on the option.
        far = targets[-1] if targets else entry
        for k in (2, 3, 4, 6, 8, 10):
            if len(targets) >= 5:
                break
            x = round(entry + k * risk, 2) if up else round(entry - k * risk, 2)
            if (x > far) if up else (x < far):
                targets.append(x)
        targets = sorted(set(targets), reverse=not up)
        notes = [f"{tf // 60}m chart", f"breakout vol {arm.breakout_volume:,.0f} > retest vol {bar.volume:,.0f}"]
        if self.levels.in_ntz(entry):
            notes.append("WARNING: price back inside NTZ")
        return Setup(
            symbol=self.symbol, kind=f"{kind}_BREAK_RETEST", side=side, ts=bar.start,
            trigger_level=round(line, 2), entry_underlying=round(entry, 2), stop_underlying=round(stop, 2),
            targets_underlying=[round(t, 2) for t in targets], timeframe_s=tf, notes=notes,
        )
