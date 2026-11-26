"""Turns a stream of trades into 1-second bars and the 2m/5m/10m bars the strategy reads."""
from __future__ import annotations

from collections import deque
from datetime import datetime, timedelta
from typing import Callable

from .models import Bar, Trade
from .timeutil import to_et


def floor_time(ts: datetime, seconds: int) -> datetime:
    epoch = int(ts.timestamp())
    return datetime.fromtimestamp(epoch - epoch % seconds, tz=ts.tzinfo)


class BarBuilder:
    """Builds bars of one length for one symbol; calls on_close when a bar completes."""

    def __init__(self, symbol: str, seconds: int, on_close: Callable[[Bar], None], keep: int = 500):
        self.symbol = symbol
        self.seconds = seconds
        self.on_close = on_close
        self.current: Bar | None = None
        self.history: deque[Bar] = deque(maxlen=keep)

    def add(self, price: float, size: float, ts: datetime) -> None:
        start = floor_time(ts, self.seconds)
        cur = self.current
        if cur is not None and start > cur.start:
            self._close()
            cur = None
        if cur is None:
            self.current = Bar(self.symbol, start, self.seconds, price, price, price, price, size, price * size)
        else:
            cur.update(price, size)

    def flush_until(self, ts: datetime) -> None:
        """Close the open bar if the clock has moved past its end (quiet tape)."""
        if self.current and ts >= self.current.start + timedelta(seconds=self.seconds):
            self._close()

    def _close(self) -> None:
        bar = self.current
        self.current = None
        if bar is not None:
            self.history.append(bar)
            self.on_close(bar)


class SessionStats:
    """Session-anchored VWAP and running day stats for one symbol."""

    def __init__(self) -> None:
        self.day = None
        self.pv = 0.0
        self.vol = 0.0

    def add(self, t: Trade) -> None:
        d = to_et(t.ts).date()
        if d != self.day:
            self.day, self.pv, self.vol = d, 0.0, 0.0
        self.pv += t.price * t.size
        self.vol += t.size

    @property
    def vwap(self) -> float | None:
        return self.pv / self.vol if self.vol > 0 else None
