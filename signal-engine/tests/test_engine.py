import asyncio
from datetime import date, datetime, time, timedelta

import pytest

from kcsignals.config import Settings
from kcsignals.engine import Engine, run_engine
from kcsignals.feeds.replay import ReplayFeed, synthetic_day
from kcsignals.models import Bar, EventType, OptionQuote, Setup, Side
from kcsignals.options import bs_greeks, bs_price, implied_vol, select_contract
from kcsignals.risk import DayBook, build_signal
from kcsignals.timeutil import ET


def settings(**acct):
    s = Settings(watchlist=["NVDA"])
    s.alerts.log_file = ""
    s.alerts.console = False
    for k, v in acct.items():
        setattr(s.account, k, v)
    return s


def run_day(side=Side.CALL, s=None):
    s = s or settings()
    trades, hist = synthetic_day("NVDA", direction=side)
    eng = Engine(s, ReplayFeed(trades, {"NVDA": hist}))
    asyncio.run(run_engine(eng))
    return eng


@pytest.mark.parametrize("side", [Side.CALL, Side.PUT])
def test_breakout_retest_produces_one_signal_and_exits(side):
    eng = run_day(side)
    types = [e["type"] for e in eng.alerter.recent]
    assert types.count("ENTRY") == 1
    sig = eng.signals[0]
    assert sig.setup.side is side
    assert sig.setup.kind == "NTZ_BREAK_RETEST"
    # user's rules: 10-20% premium stop, >= 1:2 R:R, 0-5 DTE
    assert 0.10 <= sig.stop_pct <= 0.20
    assert sig.risk_reward >= 2.0
    assert 0 <= (sig.contract.expiry - date(2026, 11, 24)).days <= 5
    assert sig.capital_used <= 10_000
    assert any(t in types for t in ("TRIM", "TARGET_FINAL"))
    assert not eng.manager.positions  # flat by the end of the day
    assert eng.book.realized > 0


def test_allocation_controls_size():
    half = run_day(s=settings(allocation_pct=0.5)).signals[0]
    full = run_day(s=settings(allocation_pct=1.0)).signals[0]
    assert half.capital_used <= 5_000 < full.capital_used


def test_scale_out_trims_then_moves_stop_to_breakeven():
    eng = run_day()
    trims = [e for e in eng.alerter.recent if e["type"] == "TRIM"]
    assert trims and "BREAKEVEN" in trims[0]["message"]


def test_no_signal_when_breakout_volume_is_weak():
    s = settings()
    s.strategy.breakout_vol_mult = 50  # impossible volume filter
    eng = run_day(s=s)
    assert not eng.signals


def test_no_entries_after_the_90_minute_window():
    s = settings()
    s.strategy.hunt_end = time(9, 40)
    assert not run_day(s=s).signals


# ---------------------------------------------------------------- unit pieces
NOW = datetime(2026, 11, 24, 10, 0, tzinfo=ET)


def test_black_scholes_round_trip():
    p = bs_price(Side.CALL, 180, 182.5, 0.002, 0.5)
    assert implied_vol(Side.CALL, p, 180, 182.5, 0.002) == pytest.approx(0.5, abs=1e-3)
    d, g = bs_greeks(Side.PUT, 180, 180, 0.01, 0.4)
    assert -0.6 < d < -0.4 and g > 0


def quote(k, delta, bid, ask, exp=date(2026, 11, 24), oi=1000):
    return OptionQuote(f"NVDA261124C{int(k*1000):08d}", "NVDA", Side.CALL, k, exp, bid, ask, delta, 0.1, 0.5,
                       volume=500, open_interest=oi)


def test_select_contract_prefers_target_delta_and_skips_wide_or_illiquid():
    chain = [quote(180, 0.55, 1.50, 1.56), quote(182.5, 0.45, 0.80, 0.84), quote(185, 0.30, 0.30, 0.50),
             quote(183, 0.44, 0.70, 0.72, oi=1)]
    q, _ = select_contract(chain, Side.CALL, 182, NOW, Settings().options)
    assert q.strike == 182.5


def test_build_signal_rejects_poor_reward():
    setup = Setup("NVDA", "ORB_BREAK_RETEST", Side.CALL, NOW, 182, 182.2, 181.9, [182.3], 120)
    book = DayBook()
    book.roll(NOW.date(), 10_000)
    sig, why = build_signal(setup, quote(182.5, 0.45, 0.80, 0.84), 182.2, NOW, book, Settings().account)
    assert sig is None and "R" in why


def test_day_guard_stops_after_two_losers():
    setup = Setup("NVDA", "ORB_BREAK_RETEST", Side.CALL, NOW, 182, 182.2, 181.9, [184, 186], 120)
    book = DayBook()
    book.roll(NOW.date(), 10_000)
    book.losers = 2
    sig, why = build_signal(setup, quote(182.5, 0.45, 0.80, 0.84), 182.2, NOW, book, Settings().account)
    assert sig is None and "losing" in why


def test_failed_breakout_hits_stop_and_counts_loser():
    trades, hist = synthetic_day("NVDA", direction=Side.CALL, fail=True)
    eng = Engine(settings(), ReplayFeed(trades, {"NVDA": hist}))
    asyncio.run(run_engine(eng))
    types = [e["type"] for e in eng.alerter.recent]
    assert "ENTRY" in types and "STOP" in types
    assert eng.book.losers == 1
    sig = eng.signals[0]
    # loss capped near the premium stop (structural stop can fire first, never later)
    assert -eng.book.realized <= sig.max_loss_dollars * 1.05
