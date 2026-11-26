"""Turns a chart setup + chosen contract into a sized signal, or rejects it.

Sizing (Kay Capitals "bell curve", default):
  position $ = ladder rung x tier base. Rungs default to 5% / 10% / 15% / 20%.
  The first trade of the day is on the first rung ($500 on $10k). A win moves up one rung,
  a loss moves down one. The top rung is the cap: $2k until the account reaches $20k,
  then the base doubles. 3 losses in a row ends the day.
Stop: chart stop (back through the line / beyond the trigger candle), priced on the
  option and clamped to 10-20%. A setup that needs >30% is skipped as noise-prone.
Targets: levels only. Anything paying < 2R on the option is dropped. No targets left = no trade.
"""
from __future__ import annotations

import math
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime

from .config import AccountCfg
from .models import OptionQuote, Setup, Signal
from .options import project_premium


@dataclass
class DayBook:
    day: date | None = None
    start_equity: float = 0.0
    realized: float = 0.0
    trades: int = 0
    losers: int = 0
    loss_streak: int = 0
    rung: int = 0
    open_ids: set[str] = field(default_factory=set)

    def roll(self, day: date, equity: float) -> None:
        if day != self.day:
            self.day, self.start_equity, self.realized = day, equity, 0.0
            self.trades = self.losers = self.loss_streak = self.rung = 0

    @property
    def equity(self) -> float:
        return self.start_equity + self.realized

    def record(self, pnl: float, ladder_len: int) -> None:
        if pnl < 0:
            self.losers += 1
            self.loss_streak += 1
            self.rung = max(0, self.rung - 1)
        else:
            self.loss_streak = 0
            self.rung = min(ladder_len - 1, self.rung + 1)


def tier_base(equity: float, cfg: AccountCfg) -> float:
    if not cfg.grow_tiers or equity < cfg.size * 2:
        return cfg.size
    return cfg.size * 2 ** int(math.log2(equity / cfg.size))


def position_dollars(book: DayBook, cfg: AccountCfg) -> tuple[float, float]:
    """(this trade's $ size, the $ cap)"""
    if cfg.sizing_mode == "fixed":
        d = book.equity * cfg.allocation_pct
        return d, d
    base = tier_base(book.equity, cfg)
    return base * cfg.size_ladder[book.rung], base * cfg.size_ladder[-1]


def day_guard(book: DayBook, cfg: AccountCfg) -> str | None:
    if book.open_ids:
        return "already in a trade"
    if book.trades >= cfg.max_trades_per_day:
        return f"max {cfg.max_trades_per_day} trades/day reached"
    if book.loss_streak >= cfg.max_consecutive_losses:
        return f"{book.loss_streak} losses in a row — done for the day"
    if book.realized <= -cfg.daily_max_loss_pct * book.start_equity:
        return f"daily max loss ({cfg.daily_max_loss_pct:.0%}) hit — done for the day"
    return None


def build_signal(setup: Setup, q: OptionQuote, spot: float, now: datetime,
                 book: DayBook, cfg: AccountCfg) -> tuple[Signal | None, str]:
    blocked = day_guard(book, cfg)
    if blocked:
        return None, blocked
    if not setup.targets_underlying:
        return None, "no level to target in the trade direction"

    entry = round(min(q.ask, q.mid + 0.25 * (q.ask - q.bid)), 2)
    if entry <= 0:
        return None, "no valid price"

    at_stop = project_premium(q, spot, setup.stop_underlying, now, entry)
    struct_pct = max(0.0, (entry - at_stop) / entry)
    if struct_pct > cfg.max_premium_stop_pct * 1.5:
        return None, (f"chart stop needs {struct_pct:.0%} of premium (> {cfg.max_premium_stop_pct:.0%} max) — skipped")
    stop_pct = min(max(struct_pct, cfg.min_premium_stop_pct), cfg.max_premium_stop_pct)
    stop_prem = round(entry * (1 - stop_pct), 2)
    risk = entry - stop_prem

    pairs = []
    for lvl in setup.targets_underlying:
        p = round(project_premium(q, spot, lvl, now, entry), 2)
        if (p - entry) / risk >= cfg.min_risk_reward:
            pairs.append((lvl, p))
    if not pairs:
        best = max((project_premium(q, spot, l, now, entry) - entry) / risk for l in setup.targets_underlying)
        return None, f"nearest levels pay only {best:.1f}R (< {cfg.min_risk_reward:.0f}R) — skipped"
    pairs = pairs[:3]
    setup.targets_underlying = [u for u, _ in pairs]

    dollars, cap = position_dollars(book, cfg)
    cost = entry * 100
    if cost > cap:
        return None, f"1 contract costs ${cost:,.0f}, over the ${cap:,.0f} position cap"
    contracts = max(1, int(dollars // cost))

    sig = Signal(
        id=uuid.uuid4().hex[:8], setup=setup, contract=q, contracts=contracts,
        entry_premium=entry, stop_premium=stop_prem, targets_premium=[p for _, p in pairs],
        risk_reward=round((pairs[0][1] - entry) / risk, 2), stop_pct=round(stop_pct, 3),
        capital_used=round(contracts * cost, 2), max_loss_dollars=round(contracts * risk * 100, 2), created=now,
    )
    return sig, "ok"
