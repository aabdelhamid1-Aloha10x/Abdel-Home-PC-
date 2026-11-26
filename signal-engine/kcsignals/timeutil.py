from __future__ import annotations

from datetime import date, datetime, time
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
PREMARKET_START = time(4, 0)
RTH_OPEN = time(9, 30)
RTH_CLOSE = time(16, 0)


def to_et(ts: datetime) -> datetime:
    return ts.astimezone(ET)


def et_time(ts: datetime) -> time:
    return to_et(ts).time()


def is_premarket(ts: datetime) -> bool:
    return PREMARKET_START <= et_time(ts) < RTH_OPEN


def is_rth(ts: datetime) -> bool:
    return RTH_OPEN <= et_time(ts) < RTH_CLOSE


def et_date(ts: datetime) -> date:
    return to_et(ts).date()
