"""Economic-event and earnings calendars -> automatic trading restrictions.

Economic events (CPI, PPI, jobs, GDP, ISM, retail sales, FOMC, Fed-chair speeches):
  Nasdaq's public, keyless calendar. Every high-impact release during the session
  becomes a no-new-entries window (default 5 min before to 30 min after; FOMC 60 min
  after for the press conference). Pre-open releases (8:30 CPI/jobs) are reported as
  a "news day" note since entries don't start until 9:45 anyway.
Earnings (Nasdaq earnings calendar, keyless):
  * Reaction day (reported before today's open, or after yesterday's close):
    size is cut (default half) or the ticker is blocked, per config.
  * Upcoming report inside the 0-5 DTE window: contracts may not expire after the
    report, so the IV crush can't hit you (usually forces 0DTE).

Portions adapted from staskh/trading_skills (calendar_nasdaq.py), MIT License,
Copyright (c) 2026 staskh — the feed's off-by-one dates, its fixed-offset clock
measured from fixed-time releases, impact classification and FOMC table.
"""
from __future__ import annotations

import logging
from collections import Counter
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta, timezone
from typing import Callable

import requests

from .timeutil import ET

log = logging.getLogger("kcsignals.calendar")

ECON_URL = "https://api.nasdaq.com/api/calendar/economicevents"
EARN_URL = "https://api.nasdaq.com/api/calendar/earnings"
HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}

# FOMC rate-decision days (statement 14:00 ET). federalreserve.gov/monetarypolicy/fomccalendars.htm
# 2027 = revised tentative schedule released 2026-11-12 (Oct 2027 meeting is strategy-only, no decision).
FOMC_DAYS = {
    "2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17", "2026-07-29", "2026-09-16", "2026-10-28", "2026-12-09",
    "2027-01-27", "2027-03-17", "2027-04-28", "2027-06-09", "2027-07-28", "2027-09-15", "2027-11-17",
}

HIGH_IMPACT = ("fomc", "federal funds", "interest rate decision", "cpi", "consumer price", "ppi",
               "producer price", "core pce", "pce price", "nonfarm", "non-farm", "payrolls",
               "unemployment rate", "gdp", "retail sales", "ism ")

# Look like high impact by name but don't move markets.
NOT_HIGH = ("gdpnow", "cleveland", "productivity", "unit labor", "kansas city", "chicago fed")

_FEED_CLOCKS = (timezone(timedelta(hours=-4)), timezone(timedelta(hours=-5)))
_FEED_OFFSETS = (1, 0)   # date=D serves D-1's releases: try D+1 first
_WEEKDAY_ANCHORS = {"redbook": 1, "api weekly crude": 1, "mba mortgage applications": 2,
                    "crude oil inventories": 2, "initial jobless claims": 3, "continuing jobless claims": 3,
                    "natural gas storage": 3, "fed's balance sheet": 3}
_TIME_ANCHORS = {"initial jobless claims": "08:30", "continuing jobless claims": "08:30",
                 "nonfarm payrolls": "08:30", "unemployment rate": "08:30", "cpi": "08:30",
                 "core cpi": "08:30", "ppi": "08:30", "core ppi": "08:30", "retail sales": "08:30",
                 "gdp": "08:30", "ism manufacturing pmi": "10:00", "ism non-manufacturing pmi": "10:00",
                 "jolts job openings": "10:00", "michigan consumer sentiment": "10:00"}

Fetcher = Callable[[str, dict], dict | None]


def http_fetch(url: str, params: dict) -> dict | None:
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=10)
        return r.json() if r.status_code == 200 else None
    except (requests.RequestException, ValueError):
        return None


# ------------------------------------------------------------------ economic events
def classify_impact(name: str) -> str:
    n = name.lower()
    if "speaks" in n or "speech" in n or "testifies" in n:
        return "high" if ("powell" in n or "chair " in n or n.startswith("fed chair")) and "vice" not in n else "medium"
    if any(k in n for k in NOT_HIGH):
        return "medium"
    return "high" if any(k in n for k in HIGH_IMPACT) else "medium"


def parse_events(rows: list[dict]) -> list[dict]:
    out = []
    for r in rows or []:
        if (r.get("country") or "").strip() != "United States":
            continue
        name = (r.get("eventName") or "").replace("&nbsp;", " ").strip()
        gmt = (r.get("gmt") or "").strip()
        if not name:
            continue
        t = None
        if ":" in gmt:
            hh, _, mm = gmt.partition(":")
            if hh.isdigit() and mm.isdigit():
                t = f"{int(hh):02d}:{int(mm):02d}"
        out.append({"event": name, "time": t, "impact": classify_impact(name)})
    return out


def _to_et(day: date, hhmm: str, clock: timezone) -> str:
    return datetime.combine(day, time(int(hhmm[:2]), int(hhmm[3:5])), clock).astimezone(ET).strftime("%H:%M")


def _measure_clock(events: list[dict], day: date) -> timezone | None:
    votes: Counter = Counter()
    for e in events:
        canon = _TIME_ANCHORS.get(e["event"].lower())
        if canon and e["time"]:
            for c in _FEED_CLOCKS:
                if _to_et(day, e["time"], c) == canon:
                    votes[c] += 1
    ranked = votes.most_common(2)
    if ranked and (len(ranked) == 1 or ranked[0][1] > ranked[1][1]):
        return ranked[0][0]
    return None


def _verify_day(events: list[dict], day: date) -> str:
    match = mismatch = 0
    for e in events:
        n = e["event"].lower()
        for frag, wd in _WEEKDAY_ANCHORS.items():
            if frag in n:
                match, mismatch = (match + 1, mismatch) if wd == day.weekday() else (match, mismatch + 1)
                break
    return "rejected" if mismatch > match else "verified" if match > mismatch else "unverifiable"


def economic_events(day: date, fetch: Fetcher = http_fetch) -> tuple[list[dict], bool]:
    """(events with ET times, verified). Always includes the FOMC decision on FOMC days."""
    chosen, verified = [], False
    for off in _FEED_OFFSETS:
        js = fetch(ECON_URL, {"date": (day + timedelta(days=off)).isoformat()})
        rows = ((js or {}).get("data") or {}).get("rows") or []
        ev = parse_events(rows)
        status = _verify_day(ev, day)
        if status == "verified" or (status == "unverifiable" and ev and not chosen):
            clock = _measure_clock(ev, day) or _FEED_CLOCKS[0 if datetime.combine(day, time(12), ET).dst() else 1]
            chosen = [{**e, "time": _to_et(day, e["time"], clock) if e["time"] else None} for e in ev]
            verified = status == "verified"
            if verified:
                break
    if day.isoformat() in FOMC_DAYS and not any("fomc" in e["event"].lower() or "interest rate" in e["event"].lower()
                                                 for e in chosen):
        chosen.insert(0, {"event": "FOMC Rate Decision", "time": "14:00", "impact": "high"})
    return chosen, verified


# ------------------------------------------------------------------ earnings
def earnings_on(day: date, fetch: Fetcher = http_fetch) -> dict[str, str]:
    """{symbol: 'bmo'|'amc'|'unknown'} for companies reporting on `day`."""
    js = fetch(EARN_URL, {"date": day.isoformat()})
    rows = ((js or {}).get("data") or {}).get("rows") or []
    out = {}
    for r in rows:
        t = (r.get("time") or "").lower()
        out[(r.get("symbol") or "").upper()] = "bmo" if "pre" in t else "amc" if "after" in t else "unknown"
    return out


# ------------------------------------------------------------------ restrictions
@dataclass
class Restriction:
    block: bool = False
    size_mult: float = 1.0
    max_expiry: date | None = None
    notes: list[str] = field(default_factory=list)
    pause_until: datetime | None = None      # set intraday by breaking news


@dataclass
class DayPlan:
    blackouts: list[str] = field(default_factory=list)      # "YYYY-MM-DD HH:MM-HH:MM"
    notes: list[str] = field(default_factory=list)
    per_symbol: dict[str, Restriction] = field(default_factory=dict)


def _prev_weekday(d: date) -> date:
    d -= timedelta(days=1)
    while d.weekday() >= 5:
        d -= timedelta(days=1)
    return d


def _window(day: date, hhmm: str, before: int, after: int) -> str:
    t = datetime.combine(day, time(int(hhmm[:2]), int(hhmm[3:5])))
    return f"{day} {(t - timedelta(minutes=before)):%H:%M}-{(t + timedelta(minutes=after)):%H:%M}"


def build_day_plan(day: date, watchlist: list[str], cfg, max_dte: int, fetch: Fetcher = http_fetch) -> DayPlan:
    """cfg = Settings.calendar."""
    plan = DayPlan()
    if cfg.economic:
        events, verified = economic_events(day, fetch)
        for e in events:
            if e["impact"] != "high" or not e["time"]:
                continue
            if e["time"] < "09:30":
                plan.notes.append(f"pre-open {e['event'].split(',')[0].replace(' Index', '')} at {e['time']} ET "
                                  f"— expect a volatile open")
                continue
            if e["time"] >= "16:00":
                continue
            fomc = "fomc" in e["event"].lower() or "rate decision" in e["event"].lower()
            plan.blackouts.append(_window(day, e["time"], cfg.blackout_before_min,
                                          cfg.fomc_after_min if fomc else cfg.blackout_after_min))
            plan.notes.append(f"{e['event']} at {e['time']} ET — no new entries around it")
        if not events:
            plan.notes.append("economic calendar unavailable — check for CPI/jobs/FOMC manually")
        elif not verified:
            plan.notes.append("economic calendar day not verified by the feed — double-check times")
    if cfg.earnings:
        prev = _prev_weekday(day)
        days = [prev] + [day + timedelta(days=i) for i in range(0, max_dte + 1)]
        reports = {d: earnings_on(d, fetch) for d in days if d.weekday() < 5}
        for sym in watchlist:
            r = Restriction()
            today_t = reports.get(day, {}).get(sym)
            prev_t = reports.get(prev, {}).get(sym)
            unk = cfg.unknown_time_assume
            if (today_t and (today_t if today_t != "unknown" else unk) == "bmo") or \
                    (prev_t and (prev_t if prev_t != "unknown" else unk) == "amc"):
                if cfg.reaction_day_action == "block":
                    r.block = True
                    r.notes.append("earnings reaction day — blocked")
                elif cfg.reaction_day_action == "half_size":
                    r.size_mult = 0.5
                    r.notes.append("earnings reaction day — half size (premiums are rich)")
                else:
                    r.notes.append("earnings reaction day")
            for d in sorted(reports):
                if d < day:
                    continue
                t = reports[d].get(sym)
                if not t:
                    continue
                t = t if t != "unknown" else unk
                if d == day and t == "bmo":
                    continue   # already reported this morning (handled above)
                # contracts must expire before the report: AMC on d -> expiry <= d; BMO on d -> expiry < d
                r.max_expiry = d if t == "amc" else _prev_weekday(d)
                r.notes.append(f"earnings {d} ({t.upper()}) — contracts must expire by {r.max_expiry}")
                if r.max_expiry < day:
                    r.block = True
                break
            if r.block or r.size_mult != 1.0 or r.max_expiry or r.notes:
                plan.per_symbol[sym] = r
    plan.notes = list(dict.fromkeys(plan.notes))
    plan.blackouts = list(dict.fromkeys(plan.blackouts))
    return plan
