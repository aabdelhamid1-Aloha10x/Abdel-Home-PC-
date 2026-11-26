"""Calendar blackouts, earnings restrictions, news pauses, backtest + stats."""
import asyncio
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from kcsignals.backtest import bars_to_trades, run_backtest, summarize, write_outputs
from kcsignals.calendar import (DayPlan, Restriction, build_day_plan, classify_impact, earnings_on,
                                economic_events)
from kcsignals.config import Settings
from kcsignals.engine import Engine, run_engine, stats_note
from kcsignals.feeds.replay import ReplayFeed, synthetic_day
from kcsignals.models import Bar, Side
from kcsignals.news import NewsItem, NewsMonitor, parse_sec_atom, tag
from kcsignals.timeutil import ET

FIX = Path(__file__).parent / "fixtures"
DAY = date(2026, 11, 24)


def fixture_fetch(files: dict[str, str]):
    """Fake Nasdaq: maps the request's date param to a saved response."""
    def fetch(url, params):
        name = files.get(f"{'earn' if 'earnings' in url else 'econ'}:{params['date']}")
        return json.loads((FIX / name).read_text()) if name else {"data": None}
    return fetch


def settings():
    s = Settings(watchlist=["NVDA"])
    s.alerts.log_file = ""
    s.alerts.console = False
    return s


def run(plan=None, news=None, stats=None, s=None, **kw):
    s = s or settings()
    trades, hist = synthetic_day("NVDA", **kw)
    eng = Engine(s, ReplayFeed(trades, {"NVDA": hist}), plan_fn=(lambda d, w: plan) if plan else None,
                 news=news, stats=stats or {})
    asyncio.run(run_engine(eng))
    return eng


def types(eng):
    return [e["type"] for e in eng.alerter.recent]


# ---------------------------------------------------------------- economic calendar
def test_feed_off_by_one_is_corrected_with_real_nasdaq_data():
    # date=2026-11-07 on the feed serves Friday 11-06 (jobs report) — target day 11-06 asks D+1 first
    ev, verified = economic_events(date(2026, 11, 6), fixture_fetch({"econ:2026-11-07": "nasdaq-econ-2026-11-07.json"}))
    names = {e["event"] for e in ev}
    assert "Nonfarm Payrolls" in names
    nfp = next(e for e in ev if e["event"] == "Nonfarm Payrolls")
    assert nfp["time"] == "08:30" and nfp["impact"] == "high"


def test_fomc_day_is_injected_and_blacked_out():
    plan = build_day_plan(date(2026, 12, 9), ["NVDA"], Settings().calendar, 5, fixture_fetch({}))
    assert "2026-12-09 13:55-15:00" in plan.blackouts


def test_speeches_only_high_for_the_chair():
    assert classify_impact("Fed Chair Warsh Speaks") == "high"
    assert classify_impact("Fed Vice Chair for Supervision Barr Speaks") == "medium"
    assert classify_impact("Core PPI") == "high"


def test_blackout_window_blocks_entries_in_the_engine():
    eng = run(plan=DayPlan(blackouts=["2026-11-24 09:50-10:30"]))
    assert "ENTRY" not in types(eng)
    assert any("blackout" in e["message"] for e in eng.alerter.recent)


# ---------------------------------------------------------------- earnings
def test_earnings_parse_real_nasdaq_rows():
    rep = earnings_on(date(2026, 10, 28), fixture_fetch({"earn:2026-10-28": "nasdaq-earnings-2026-10-28.json"}))
    assert rep["MSFT"] == "unknown" and "GOOGL" in rep


def _earn_fetch(table):
    def fetch(url, params):
        if "earnings" not in url:
            return {"data": None}
        rows = [{"symbol": s, "time": t} for (d, s, t) in table if d == params["date"]]
        return {"data": {"rows": rows}}
    return fetch


def test_upcoming_earnings_caps_expiry_and_reaction_day_halves_size():
    cal = Settings().calendar
    cal.economic = False
    # MSFT reports after the close on Wed 11-25; Tue 11-24 contracts must expire by 11-25
    plan = build_day_plan(DAY, ["MSFT", "NVDA"], cal, 5, _earn_fetch([("2026-11-25", "MSFT", "time-after-hours")]))
    assert plan.per_symbol["MSFT"].max_expiry == date(2026, 11, 25) and "NVDA" not in plan.per_symbol
    # NVDA reported after yesterday's close -> today is the reaction day
    plan = build_day_plan(DAY, ["NVDA"], cal, 5, _earn_fetch([("2026-11-23", "NVDA", "time-after-hours")]))
    assert plan.per_symbol["NVDA"].size_mult == 0.5


def test_engine_applies_earnings_restrictions():
    r = Restriction(size_mult=0.5, max_expiry=DAY, notes=["earnings 2026-11-24 (AMC)"])
    eng = run(plan=DayPlan(per_symbol={"NVDA": r}))
    sig = eng.signals[0]
    assert sig.contract.expiry == DAY                       # forced to 0DTE
    assert sig.capital_used <= 250 + 80                      # half of the $500 first rung (1 contract min)
    assert any("earnings" in n for n in sig.setup.notes)
    blocked = run(plan=DayPlan(per_symbol={"NVDA": Restriction(block=True, notes=["reaction day — blocked"])}))
    assert not blocked.signals


# ---------------------------------------------------------------- news
def test_tagging_and_sec_8k_items():
    it = tag(NewsItem("x", ["NVDA"], "Nvidia downgraded to Underperform; price target cut", "Benzinga",
                      datetime.now(timezone.utc)))
    assert "analyst" in it.tags and it.moving
    atom = """<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry>
      <content><accession-number>0001-26-1</accession-number><filing-type>8-K</filing-type>
      <items-desc>items 4.02 9.01</items-desc><form-name>Current report</form-name></content>
      <link href="https://sec.gov/x"/><updated>2026-11-24T07:01:00-05:00</updated></entry></feed>"""
    [f] = parse_sec_atom(atom, "NVDA")
    assert f.items_8k == ["4.02", "9.01"] and f.severe and "past financials" in f.headline


class FakeNews:
    def __init__(self, items):
        self.items = items

    async def fetch(self, symbols, since):
        return [i for i in self.items if i.time >= since]


def test_morning_severe_news_blocks_the_ticker():
    halt = tag(NewsItem("n1", ["NVDA"], "NVDA trading halted pending news", "Benzinga",
                        datetime(2026, 11, 24, 7, 0, tzinfo=ET)))
    eng = run(news=NewsMonitor([FakeNews([halt])], ["NVDA"]))
    assert "NEWS" in types(eng) and not eng.signals


def test_fresh_headline_pauses_entries():
    eng = run()   # baseline: an entry fires
    assert eng.signals
    mon = NewsMonitor([FakeNews([])], ["NVDA"], pause_min=10)
    eng2 = run(news=mon)
    it = tag(NewsItem("n2", ["NVDA"], "Nvidia upgraded at Morgan Stanley", "Benzinga",
                      datetime(2026, 11, 24, 9, 50, tzinfo=ET)))
    eng2._on_news(it, datetime(2026, 11, 24, 9, 50, tzinfo=ET))
    r = eng2.restrict["NVDA"]
    assert r.pause_until == datetime(2026, 11, 24, 10, 0, tzinfo=ET)


# ---------------------------------------------------------------- backtest
def _bars_from_synthetic(side=Side.CALL, **kw):
    trades, hist = synthetic_day("NVDA", direction=side, **kw)
    bars: dict[datetime, Bar] = {}
    for t in trades:
        k = t.ts.replace(second=0, microsecond=0)
        b = bars.get(k)
        if b is None:
            bars[k] = Bar("NVDA", k, 60, t.price, t.price, t.price, t.price, t.size, t.price * t.size)
        else:
            b.update(t.price, t.size)
    return hist + sorted(bars.values(), key=lambda b: b.start)


def test_backtest_replays_real_style_bars_and_writes_stats(tmp_path):
    s = settings()
    b1 = {"NVDA": _bars_from_synthetic(fib_pullback=True)}
    trades = asyncio.run(run_backtest(s, b1, {}, [DAY]))
    assert trades and trades[0]["kind"] == "NTZ_BREAK_RETEST" and trades[0]["pnl"] > 0
    stats = summarize(trades)
    assert stats["NTZ_BREAK_RETEST|NVDA"]["n"] == 1 and stats["*|*"]["win_rate"] == 1.0
    path = write_outputs(trades, stats, s, [DAY], tmp_path)
    assert "NTZ_BREAK_RETEST" in path.read_text() and (tmp_path / "backtest_trades.csv").exists()


def test_bars_to_trades_orders_the_candle_path():
    b = Bar("X", datetime(2026, 11, 24, 10, 0, tzinfo=ET), 60, 10, 11, 9, 10.5, 400)
    assert [t.price for t in bars_to_trades([b])] == [10, 9, 11, 10.5]
    assert bars_to_trades([b])[-1].ts - b.start == timedelta(seconds=45)


def test_live_alerts_quote_backtest_stats():
    stats = {"NTZ_BREAK_RETEST|NVDA": {"n": 12, "win_rate": 0.58, "avg_r": 0.42, "t1_rate": 0.66, "pnl": 900}}
    assert "12 trades, 58% win" in stats_note(stats, "NTZ_BREAK_RETEST", "NVDA", 8)
    eng = run(stats=stats)
    assert any("backtest NTZ_BREAK_RETEST on NVDA" in n for n in eng.signals[0].setup.notes)
