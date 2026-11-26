"""Settings, loaded from config.yaml. Every rule you might want to tune lives here."""
from __future__ import annotations

from datetime import time
from pathlib import Path

import yaml
from pydantic import BaseModel, Field, field_validator


class AccountCfg(BaseModel):
    size: float = 10_000.0
    # Share of the account put into one trade (your style: 0.50-1.00).
    allocation_pct: float = Field(1.0, ge=0.05, le=1.0)
    # Premium stop: the option is sold if it loses this much (your rule: 0.10-0.20).
    max_premium_stop_pct: float = Field(0.20, ge=0.05, le=0.50)
    min_premium_stop_pct: float = Field(0.10, ge=0.02, le=0.50)
    min_risk_reward: float = Field(2.0, ge=1.0)
    # Day guard-rails. Set to large numbers to disable, but they exist for a reason.
    max_trades_per_day: int = 4
    max_losing_trades_per_day: int = 2
    daily_max_loss_pct: float = Field(0.35, gt=0, le=1.0)


class OptionsCfg(BaseModel):
    max_dte: int = 5            # 0 = 0DTE only; 5 = up to a week
    prefer_dte: int = 0         # nearest expiry at or after this many days
    target_delta: float = 0.45  # slightly OTM; strong gamma for intraday moves
    min_delta: float = 0.30
    max_delta: float = 0.65
    max_spread_pct: float = 0.08  # skip contracts wider than 8% of mid
    min_open_interest: int = 500
    min_volume: int = 100
    max_premium: float = 15.0     # $ per share; keeps 10k accounts out of $30 contracts


class StrategyCfg(BaseModel):
    orb_minutes: int = 15
    hunt_start: time = time(9, 30)
    hunt_end: time = time(11, 0)      # the 90-minute rule
    allow_afternoon: bool = False     # True lets new entries 11:00-15:00
    no_new_entries_after: time = time(15, 0)  # power hour is off-limits for new entries
    flat_by_0dte: time = time(15, 45)  # time exit: be flat before the close
    hold_overnight: bool = False       # True = multi-day contracts may be held; 0DTE always exits
    volume_len: int = 20
    breakout_vol_mult: float = 1.2
    retest_tol_pct: float = 0.15       # how close (in % of price) the pullback must come
    retest_timeout_bars: int = 20
    pivot_left: int = 5
    pivot_right: int = 5
    block_inside_ntz: bool = True      # "No trade in the NTZ, period."
    use_vwap_setups: bool = True
    use_level_setups: bool = True
    # Timeframe by time of day (Kay Capitals): 2m -> 5m -> 10m
    timeframes: list[tuple[time, int]] = [(time(9, 30), 120), (time(10, 0), 300), (time(11, 0), 600)]
    trim_fraction: float = 0.5


class FeedCfg(BaseModel):
    provider: str = "alpaca"        # alpaca | webull | replay
    alpaca_key_env: str = "ALPACA_API_KEY"
    alpaca_secret_env: str = "ALPACA_API_SECRET"
    alpaca_stock_feed: str = "sip"  # sip = real-time all exchanges (paid); iex = free, partial
    alpaca_option_feed: str = "opra"  # opra = real-time (paid); indicative = free, delayed
    webull_app_key_env: str = "WEBULL_APP_KEY"
    webull_app_secret_env: str = "WEBULL_APP_SECRET"
    webull_region: str = "us"
    replay_file: str | None = None
    replay_speed: float = 0.0       # 0 = as fast as possible


class AlertCfg(BaseModel):
    console: bool = True
    ntfy_topic_env: str = "NTFY_TOPIC"   # phone push via the free ntfy app
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
    alerts: AlertCfg = AlertCfg()
    dashboard_port: int = 8787

    @field_validator("watchlist")
    @classmethod
    def upper(cls, v: list[str]) -> list[str]:
        return [s.strip().upper() for s in v if s.strip()]


def load_settings(path: str | Path | None) -> Settings:
    if path is None or not Path(path).exists():
        return Settings()
    raw = yaml.safe_load(Path(path).read_text()) or {}
    strat = raw.get("strategy", {})
    if "timeframes" in strat:
        strat["timeframes"] = [
            (time.fromisoformat(t), int(s)) for t, s in (x.split("=") for x in strat["timeframes"])
        ]
    return Settings.model_validate(raw)
