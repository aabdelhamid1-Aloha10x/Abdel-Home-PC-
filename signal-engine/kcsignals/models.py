"""Core data types shared across the engine."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum


class Side(str, Enum):
    CALL = "CALL"
    PUT = "PUT"


@dataclass(slots=True)
class Trade:
    """One print on the tape for an underlying stock."""
    symbol: str
    ts: datetime          # timezone-aware
    price: float
    size: float


@dataclass(slots=True)
class Bar:
    symbol: str
    start: datetime       # timezone-aware, bar open time
    seconds: int          # bar length
    open: float
    high: float
    low: float
    close: float
    volume: float
    vwap_num: float = 0.0  # sum(price*size) inside the bar, for session VWAP

    def update(self, price: float, size: float) -> None:
        self.high = max(self.high, price)
        self.low = min(self.low, price)
        self.close = price
        self.volume += size
        self.vwap_num += price * size


@dataclass(slots=True)
class OptionQuote:
    """A snapshot of one option contract (from the chain or a live quote)."""
    occ_symbol: str       # e.g. TSLA261127C00350000
    underlying: str
    side: Side
    strike: float
    expiry: date
    bid: float
    ask: float
    delta: float | None = None
    gamma: float | None = None
    iv: float | None = None
    volume: int = 0
    open_interest: int = 0
    ts: datetime | None = None

    @property
    def mid(self) -> float:
        return round((self.bid + self.ask) / 2, 4)

    @property
    def spread_pct(self) -> float:
        m = self.mid
        return (self.ask - self.bid) / m if m > 0 else 1.0


@dataclass(slots=True)
class Setup:
    """A chart setup on the underlying: what triggered, and where it is wrong/right."""
    symbol: str
    kind: str             # NTZ_BREAK_RETEST, ORB_BREAK_RETEST, VWAP_RECLAIM_RETEST, LEVEL_BREAK_RETEST
    side: Side
    ts: datetime
    trigger_level: float  # the line that broke and held
    entry_underlying: float
    stop_underlying: float
    targets_underlying: list[float]
    timeframe_s: int
    notes: list[str] = field(default_factory=list)


@dataclass(slots=True)
class Signal:
    """A fully-specified, tradeable option signal (what gets pushed to the phone)."""
    id: str
    setup: Setup
    contract: OptionQuote
    contracts: int
    entry_premium: float      # limit price to pay
    stop_premium: float
    targets_premium: list[float]
    risk_reward: float
    stop_pct: float
    capital_used: float
    max_loss_dollars: float
    created: datetime


class EventType(str, Enum):
    ENTRY = "ENTRY"
    TRIM = "TRIM"            # take partial profit, move stop to breakeven
    STOP = "STOP"
    TARGET_FINAL = "TARGET_FINAL"
    TIME_EXIT = "TIME_EXIT"
    BREAKEVEN_EXIT = "BREAKEVEN_EXIT"
    INFO = "INFO"
    RISK_BLOCK = "RISK_BLOCK"


@dataclass(slots=True)
class Event:
    type: EventType
    ts: datetime
    symbol: str
    message: str
    signal_id: str | None = None
    data: dict = field(default_factory=dict)
