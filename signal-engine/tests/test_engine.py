import asyncio
from datetime import date, datetime, time

import pytest

from kcsignals.config import Settings, load_settings
from kcsignals.engine import Engine, run_engine
from kcsignals.feeds.replay import ReplayFeed, synthetic_day
from kcsignals.models import OptionQuote, Setup, Side
from kcsignals.options import bs_greeks, bs_price, implied_vol, select_contract
from kcsignals.risk import DayBook, build_signal, position_dollars, tier_base
from kcsignals.timeutil import ET

DAY = date(2026, 11, 24)


def settings(**acct):
    s = Settings(watchlist=["NVDA"])
    s.alerts.log_file = ""
    s.alerts.console = False
    for k, v in acct.items():
        setattr(s.account, k, v)
    return s


def run_day(side=Side.CALL, s=None, executor=None, **kw):
    s = s or settings()
    trades, hist = synthetic_day("NVDA", direction=side, **kw)
    eng = Engine(s, ReplayFeed(trades, {"NVDA": hist}), executor=executor)
    asyncio.run(run_engine(eng))
    return eng


def types(eng):
    return [e["type"] for e in eng.alerter.recent]


# ---------------------------------------------------------------- full-day replays
@pytest.mark.parametrize("side", [Side.CALL, Side.PUT])
def test_breakout_retest_signal_follows_the_rules(side):
    eng = run_day(side)
    assert types(eng).count("ENTRY") == 1
    sig = eng.signals[0]
    assert sig.setup.side is side and sig.setup.kind == "NTZ_BREAK_RETEST"
    assert 0.10 <= sig.stop_pct <= 0.20                      # 10-20% stop
    assert sig.risk_reward >= 2.0                            # >= 1:2
    assert 0 <= (sig.contract.expiry - DAY).days <= 5        # 0DTE .. a week
    assert sig.capital_used <= 0.05 * 10_000 + 1 or sig.contracts == 1   # first trade on the small rung
    assert "TRIM" in types(eng)
    assert not eng.manager.positions                          # flat by the end of the day
    assert eng.book.realized > 0 and eng.book.rung == 1       # a win moves sizing up a rung


def test_fib_pullback_adds_to_the_winner_and_cannot_turn_red():
    eng = run_day(fib_pullback=True)
    adds = [e for e in eng.alerter.recent if e["type"] == "ADD"]
    assert adds and "FIB_PULLBACK" in adds[0]["message"]
    assert eng.book.realized > 0


def test_failed_breakout_stops_out_and_stays_on_small_size():
    eng = run_day(fail=True)
    assert "STOP" in types(eng)
    assert eng.book.losers == 1 and eng.book.loss_streak == 1 and eng.book.rung == 0
    assert -eng.book.realized <= eng.signals[0].max_loss_dollars * 1.05


def test_no_signal_when_breakout_volume_is_weak():
    s = settings()
    s.strategy.breakout_vol_mult = 50
    s.strategy.use_fib_pullbacks = s.strategy.use_level_flags = False
    assert not run_day(s=s).signals


def test_no_entries_after_the_90_minute_window():
    s = settings()
    s.strategy.hunt_end = time(9, 50)
    assert not run_day(s=s).signals


def test_first_15_minutes_are_off_limits():
    eng = run_day()
    st = eng.state["NVDA"].strategy
    assert not st.entries_allowed(datetime(2026, 11, 24, 9, 40, tzinfo=ET))
    assert st.entries_allowed(datetime(2026, 11, 24, 9, 50, tzinfo=ET))


def test_news_blackout_blocks_entries():
    s = settings()
    s.strategy.news_blackouts = ["2026-11-24 09:30-11:00"]
    assert not run_day(s=s).signals


# ---------------------------------------------------------------- auto-trading
class FakeExecutor:
    label = "PAPER"

    def __init__(self, fill=True):
        self.fill = fill
        self.buys, self.sells = [], []

    async def preflight(self):
        return "fake paper account"

    async def buy(self, occ, qty, limit):
        self.buys.append((occ, qty, limit))
        return (qty, limit) if self.fill else (0, 0.0)

    async def sell(self, occ, qty):
        self.sells.append((occ, qty))
        return qty, 1.0


def test_paper_executor_mirrors_every_entry_add_and_exit():
    ex = FakeExecutor()
    eng = run_day(executor=ex, fib_pullback=True)
    bought = sum(q for _, q, _ in ex.buys)
    sold = sum(q for _, q in ex.sells)
    assert bought == sold > 0          # everything bought was sold by the end of the day
    assert "ORDER" in types(eng)


def test_unfilled_entry_voids_the_signal():
    ex = FakeExecutor(fill=False)
    eng = run_day(executor=ex)
    assert ex.buys and not ex.sells
    assert "ENTRY" not in types(eng) and eng.book.trades == 0


# ---------------------------------------------------------------- dashboard data
def test_chart_payload_has_candles_overlays_levels_and_markers():
    eng = run_day(fib_pullback=True)
    c = eng.chart("NVDA", 300)
    assert len(c["bars"]) > 50 and c["ema8"] and c["vwap"]
    assert c["levels"]["ntz"][0] is not None
    assert any(m["text"].startswith("NTZ") for m in c["markers"])


# ---------------------------------------------------------------- sizing + risk units
NOW = datetime(2026, 11, 24, 10, 0, tzinfo=ET)


def test_bell_curve_ladder_and_tiers():
    cfg = Settings().account
    book = DayBook()
    book.roll(DAY, 10_000)
    assert position_dollars(book, cfg) == (500, 2_000)
    book.record(+100, 4)
    assert position_dollars(book, cfg)[0] == 1_000
    book.record(-50, 4)
    assert book.rung == 0
    assert tier_base(19_999, cfg) == 10_000 and tier_base(21_000, cfg) == 20_000


def test_three_losses_in_a_row_ends_the_day():
    setup = Setup("NVDA", "ORB_BREAK_RETEST", Side.CALL, NOW, 182, 182.2, 181.9, [184, 186], 300)
    book = DayBook()
    book.roll(DAY, 10_000)
    book.loss_streak = 3
    sig, why = build_signal(setup, quote(182.5, 0.48, 0.80, 0.84), 182.2, NOW, book, Settings().account)
    assert sig is None and "in a row" in why


def quote(k, delta, bid, ask, oi=1000):
    return OptionQuote(f"NVDA261124C{int(k * 1000):08d}", "NVDA", Side.CALL, k, DAY, bid, ask, delta, 0.1, 0.5,
                       volume=500, open_interest=oi)


def test_select_contract_goes_at_the_money_and_skips_wide_or_illiquid():
    chain = [quote(180, 0.62, 1.50, 1.56), quote(182.5, 0.49, 0.80, 0.84), quote(185, 0.30, 0.30, 0.50),
             quote(182, 0.51, 0.70, 0.72, oi=1)]
    chain[-1].volume = 1
    q, _ = select_contract(chain, Side.CALL, 182.4, NOW, Settings().options)
    assert q.strike == 182.5


def test_build_signal_needs_a_level_and_2R():
    book = DayBook()
    book.roll(DAY, 10_000)
    cfg = Settings().account
    s1 = Setup("NVDA", "ORB_BREAK_RETEST", Side.CALL, NOW, 182, 182.2, 181.9, [], 300)
    assert build_signal(s1, quote(182.5, 0.48, 0.80, 0.84), 182.2, NOW, book, cfg)[0] is None
    s2 = Setup("NVDA", "ORB_BREAK_RETEST", Side.CALL, NOW, 182, 182.2, 181.9, [182.3], 300)
    sig, why = build_signal(s2, quote(182.5, 0.48, 0.80, 0.84), 182.2, NOW, book, cfg)
    assert sig is None and "R" in why


def test_black_scholes_round_trip():
    p = bs_price(Side.CALL, 180, 182.5, 0.002, 0.5)
    assert implied_vol(Side.CALL, p, 180, 182.5, 0.002) == pytest.approx(0.5, abs=1e-3)
    d, g = bs_greeks(Side.PUT, 180, 180, 0.01, 0.4)
    assert -0.6 < d < -0.4 and g > 0


def test_example_config_loads():
    s = load_settings("config.example.yaml")
    assert s.account.sizing_mode == "bell_curve" and s.execution.mode == "off"
    assert (300, time(9, 30), time(16, 0)) in s.strategy.timeframes
