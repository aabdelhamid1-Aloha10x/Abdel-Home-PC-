"""Streaming indicators for one symbol on one timeframe: EMA 8/21, SMA 200/400, ATR, volume MA."""
from __future__ import annotations

from collections import deque

from .models import Bar


class EMA:
    def __init__(self, n: int):
        self.k = 2 / (n + 1)
        self.n = n
        self.value: float | None = None
        self.count = 0

    def update(self, x: float) -> float:
        self.count += 1
        self.value = x if self.value is None else self.value + self.k * (x - self.value)
        return self.value

    @property
    def ready(self) -> bool:
        return self.count >= self.n


class SMA:
    def __init__(self, n: int):
        self.n = n
        self.q: deque[float] = deque(maxlen=n)
        self.total = 0.0

    def update(self, x: float) -> float | None:
        if len(self.q) == self.n:
            self.total -= self.q[0]
        self.q.append(x)
        self.total += x
        return self.value

    @property
    def value(self) -> float | None:
        return self.total / len(self.q) if len(self.q) == self.n else None


class Indicators:
    """Feed closed bars (extended hours included, like TradingView with ETH on)."""

    def __init__(self, volume_len: int = 5):
        self.ema8, self.ema21 = EMA(8), EMA(21)
        self.sma200, self.sma400 = SMA(200), SMA(400)
        self.atr = EMA(14)
        self.vol = SMA(volume_len)
        self.prev_close: float | None = None
        self.prev_vol_ma: float | None = None   # volume MA *before* the latest bar

    def update(self, b: Bar) -> None:
        tr = b.high - b.low if self.prev_close is None else max(
            b.high - b.low, abs(b.high - self.prev_close), abs(b.low - self.prev_close))
        self.atr.update(tr)
        self.ema8.update(b.close)
        self.ema21.update(b.close)
        self.sma200.update(b.close)
        self.sma400.update(b.close)
        self.prev_vol_ma = self.vol.value
        self.vol.update(b.volume)
        self.prev_close = b.close

    def lines(self) -> dict[str, float]:
        out = {}
        for name, v in (("EMA8", self.ema8.value), ("EMA21", self.ema21.value),
                        ("SMA200", self.sma200.value), ("SMA400", self.sma400.value)):
            if v is not None:
                out[name] = v
        return out
