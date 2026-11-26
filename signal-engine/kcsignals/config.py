"""Settings, loaded from config.yaml. Every rule you might want to tune lives here."""
from __future__ import annotations

from datetime import time
from pathlib import Path

import yaml
from pydantic import BaseModel, Field, field_validator


class AccountCfg(BaseModel):
    size: float = 10_000.0
    # Kay Capitals "bell curve" sizing (default) or a fixed share of the account.
    sizing_mode: str = "bell_curve"          # bell_curve | fixed
    # bell_curve: position = rung x tier base. Start each day on the first rung; a win
    # moves up one rung, a loss moves down one. Top rung is the cap (20% = $2k on $10k).
    size_ladder: list[float] = [0.05, 0.10, 0.15, 0.20]
    # The tier base doubles each time equity doubles ($10k -> $20k raises the cap to $4k).
    grow_tiers: bool = True
    allocation_pct: float = Field(1.0, ge=0.05, le=1.0)   # only for sizing_mode: fixed
    max_premium_stop_pct: float = Field(0.20, ge=0.05, le=0.50)
    min_premium_stop_pct: float = Field(0.10, ge=0.02, le=0.50)
    min_risk_reward: float = Field(2.0, ge=1.0)
    max_trades_per_day: int = 6
    max_consecutive_losses: int = 3          # "3 losses in a row = done for the day"
    daily_max_loss_pct: float = Field(0.10, gt=0, le=1.0)
    afternoon_only_if_red: bool = True       # "if you're up by 11:00, call it a day"


class OptionsCfg(BaseModel):
    max_dte: int = 5
    prefer_dte: int = 0
    target_delta: float = 0.50   # at the money ("just stick with at the money")
    min_delta: float = 0.35
    max_delta: float = 0.65
    max_spread_pct: float = 0.08
    min_open_interest: int = 500
    min_volume: int = 100
    max_premium: float = 20.0


class StrategyCfg(BaseModel):
    orb_minutes: int = 15
    hunt_start: time = time(9, 45)            # no trades during the first 15 min (price discovery)
    hunt_end: time = time(11, 0)              # 90-minute rule
    allow_afternoon: bool = False
    no_new_entries_after: time = time(15, 0)
    flat_by_0dte: time = time(15, 45)
    hold_overnight: bool = False
    # Charts evaluated, with the window each one is active (ET). The 5-min runs all day.
    timeframes: list[tuple[int, time, time]] = [
        (120, time(9, 30), time(10, 0)),
        (300, time(9, 30), time(16, 0)),
        (600, time(11, 0), time(16, 0)),
    ]
    volume_len: int = 5                       # 5-period volume MA, as in the video
    breakout_vol_mult: float = 1.2
    retest_tol_pct: float = 0.15
    retest_timeout_bars: int = 20
    block_inside_ntz: bool = True
    use_break_retest: bool = True
    use_vwap_setups: bool = True
    use_level_setups: bool = True
    use_fib_pullbacks: bool = True
    use_level_flags: bool = True
    fib_min_leg_atr: float = 1.5              # leg must be >= 1.5 ATR to draw a Fib on it
    fib_min_confluence: int = 1               # EMA8 / VWAP / level / SMA inside the 0.236-0.382 zone
    flag_bars: int = 4
    flag_max_range_atr: float = 0.8
    chop_max_failed_orb: int = 2              # symbol benched for the day after N failed ORB breaks
    hourly_pivot_bars: int = 2
    levels_each_side: int = 3                 # 3 levels above PM high, 3 below PM low
    trim_fraction: float = 0.5
    trail_after_t2: bool = True               # after T2, runner stop moves from breakeven to T1
    allow_adds: bool = True                   # re-add on a new setup once the stop is at breakeven
    news_blackouts: list[str] = []            # "2026-12-10 13:55-14:30" (ET) — no entries inside


class FeedCfg(BaseModel):
    provider: str = "alpaca"
    alpaca_key_env: str = "ALPACA_API_KEY"
    alpaca_secret_env: str = "ALPACA_API_SECRET"
    alpaca_stock_feed: str = "sip"
    alpaca_option_feed: str = "opra"
    webull_app_key_env: str = "WEBULL_APP_KEY"
    webull_app_secret_env: str = "WEBULL_APP_SECRET"
    webull_region: str = "us"


class ExecutionCfg(BaseModel):
    # off   = signals only (you trade on Webull)
    # paper = engine places every trade in your Alpaca PAPER account
    # live  = engine places REAL orders in your Alpaca account (also needs KC_LIVE_TRADING=I_UNDERSTAND)
    mode: str = "off"
    paper_key_env: str = "ALPACA_PAPER_API_KEY"
    paper_secret_env: str = "ALPACA_PAPER_API_SECRET"
    entry_timeout_s: float = 10.0             # cancel an unfilled entry after this
    entry_slippage: float = 0.05              # pay up to +5 cents over the signal limit
    max_order_dollars: float = 4_000.0        # hard cap on any single order, whatever the sizing says

    @field_validator("mode")
    @classmethod
    def ok_mode(cls, v: str) -> str:
        if v not in ("off", "paper", "live"):
            raise ValueError("execution.mode must be off, paper or live")
        return v


class ScheduleCfg(BaseModel):
    start: time = time(9, 0)                  # daemon starts the engine at 9:00 ET on trading days
    stop_after_close_min: int = 5


class AlertCfg(BaseModel):
    console: bool = True
    ntfy_topic_env: str = "NTFY_TOPIC"
    discord_webhook_env: str = "DISCORD_WEBHOOK_URL"
    telegram_token_env: str = "TELEGRAM_BOT_TOKEN"
    telegram_chat_env: str = "TELEGRAM_CHAT_ID"
    log_file: str = "signals.jsonl"


class Settings(BaseModel):
    watchlist: list[str] = ["TSLA", "NVDA", "MSFT", "AMD", "META", "AAPL", "AMZN", "SPY", "QQQ"]
    account: AccountCfg = AccountCfg()
    options: OptionsCfg = OptionsCfg()
    strategy: StrategyCfg = StrategyCfg()
    feed: FeedCfg = FeedCfg()
    execution: ExecutionCfg = ExecutionCfg()
    schedule: ScheduleCfg = ScheduleCfg()
    alerts: AlertCfg = AlertCfg()
    dashboard_port: int = 8787

    @field_validator("watchlist")
    @classmethod
    def upper(cls, v: list[str]) -> list[str]:
        return [s.strip().upper() for s in v if s.strip()]


def _parse_tf(x: str) -> tuple[int, time, time]:
    # "300@09:30-16:00"
    secs, win = x.split("@")
    a, b = win.split("-")
    return int(secs), time.fromisoformat(a), time.fromisoformat(b)


def load_settings(path: str | Path | None) -> Settings:
    if path is None or not Path(path).exists():
        return Settings()
    raw = yaml.safe_load(Path(path).read_text()) or {}
    strat = raw.get("strategy", {})
    if "timeframes" in strat:
        strat["timeframes"] = [_parse_tf(x) for x in strat["timeframes"]]
    return Settings.model_validate(raw)
