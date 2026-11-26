"""Market-data feed interface. A feed pushes trades and option quotes into the engine."""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import TYPE_CHECKING

from ..models import Bar, OptionQuote, Side

if TYPE_CHECKING:
    from ..engine import Engine


class Feed(ABC):
    engine: "Engine"

    def attach(self, engine: "Engine") -> None:
        self.engine = engine

    @abstractmethod
    async def history_1m(self, symbol: str, start: datetime, end: datetime) -> list[Bar]:
        """1-minute bars, extended hours included, oldest first."""

    async def history_bars(self, symbol: str, start: datetime, end: datetime, minutes: int) -> list[Bar]:
        """Bars of any size (extended hours included). Default: resample 1-minute bars."""
        bars = await self.history_1m(symbol, start, end)
        if minutes == 1:
            return bars
        from ..levels import resample
        return resample(bars, minutes * 60)

    @abstractmethod
    async def option_chain(self, symbol: str, side: Side, exp_from: date, exp_to: date,
                           spot: float) -> list[OptionQuote]:
        """Live snapshot of contracts near the money for the given expiries."""

    @abstractmethod
    async def subscribe_option(self, occ_symbol: str) -> None:
        """Start pushing live quotes for this contract to engine.on_option_quote."""

    async def unsubscribe_option(self, occ_symbol: str) -> None:  # optional
        return None

    @abstractmethod
    async def run(self) -> None:
        """Connect and stream trades for engine.symbols until cancelled/finished."""

    def now(self) -> datetime:
        """Clock the engine uses. Replays override this with the replay time."""
        return datetime.now().astimezone()

    @property
    def live(self) -> bool:
        return True
