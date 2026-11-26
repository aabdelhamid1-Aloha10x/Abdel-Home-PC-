"""Turns a chart setup + chosen contract into a sized signal, or rejects it.

Rules (from config.account):
  * Stop: whichever comes first — the underlying closes back through the structural stop,
    or the option loses its premium stop. The premium stop is the option loss projected
    at the structural stop, clamped to [min_premium_stop_pct, max_premium_stop_pct].
    If the structure needs a much wider stop than your max, the trade is skipped
    (a 20% stop on a setup that needs 40% just gets stopped out by noise).
  * Targets: the next S/R levels in the trade direction, priced as option premiums.
    Any target that pays less than min_risk_reward x risk is dropped; if none remain,
    the trade is skipped.
  * Size: allocation_pct of current equity / (premium x 100), rounded down.
  * Day guard: max trades, max losing trades, max daily loss.
"""
from __future__ import annotations

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
    open_ids: set[str] = field(default_factory=set)

    def roll(self, day: date, equity: float) -> None:
        if day != self.day:
            self.day, self.start_equity, self.realized, self.trades, self.losers = day, equity, 0.0, 0, 0

    @property
    def equity(self) -> float:
        return self.start_equity + self.realized


def day_guard(book: DayBook, cfg: AccountCfg) -> str | None:
    if book.open_ids:
        return "already in a trade (one position at a time with this allocation)"
    if book.trades >= cfg.max_trades_per_day:
        return f"max {cfg.max_trades_per_day} trades/day reached"
    if book.losers >= cfg.max_losing_trades_per_day:
        return f"{book.losers} losing trades today — done for the day"
    if book.realized <= -cfg.daily_max_loss_pct * book.start_equity:
        return f"daily max loss ({cfg.daily_max_loss_pct:.0%}) hit — done for the day"
    return None


def build_signal(setup: Setup, q: OptionQuote, spot: float, now: datetime,
                 book: DayBook, cfg: AccountCfg) -> tuple[Signal | None, str]:
    blocked = day_guard(book, cfg)
    if blocked:
        return None, blocked

    # Pay a little over mid so the limit actually fills on a fast 0DTE.
    entry = round(min(q.ask, q.mid + 0.25 * (q.ask - q.bid)), 2)
    if entry <= 0:
        return None, "no valid price"

    at_stop = project_premium(q, spot, setup.stop_underlying, now, entry)
    struct_pct = max(0.0, (entry - at_stop) / entry)
    if struct_pct > cfg.max_premium_stop_pct * 1.5:
        return None, (f"structure needs a {struct_pct:.0%} premium stop (> {cfg.max_premium_stop_pct:.0%} max); "
                      "stop would be inside the noise — skipped")
    stop_pct = min(max(struct_pct, cfg.min_premium_stop_pct), cfg.max_premium_stop_pct)
    stop_prem = round(entry * (1 - stop_pct), 2)
    risk = entry - stop_prem

    targets, rr_list = [], []
    for lvl in setup.targets_underlying:
        p = round(project_premium(q, spot, lvl, now, entry), 2)
        rr = (p - entry) / risk if risk > 0 else 0
        if rr >= cfg.min_risk_reward:
            targets.append(p)
            rr_list.append(rr)
    if not targets:
        best = max((project_premium(q, spot, l, now, entry) - entry) / risk for l in setup.targets_underlying)
        return None, f"best target pays only {best:.1f}R (< {cfg.min_risk_reward:.0f}R) — skipped"
    keep = [i for i, _ in enumerate(setup.targets_underlying)
            if round(project_premium(q, spot, setup.targets_underlying[i], now, entry), 2) in targets]
    setup.targets_underlying = [setup.targets_underlying[i] for i in keep][:3]
    targets = targets[:3]

    capital = book.equity * cfg.allocation_pct
    contracts = int(capital // (entry * 100))
    if contracts < 1:
        return None, f"1 contract costs ${entry * 100:,.0f}, more than the ${capital:,.0f} allocation"

    sig = Signal(
        id=uuid.uuid4().hex[:8], setup=setup, contract=q, contracts=contracts,
        entry_premium=entry, stop_premium=stop_prem, targets_premium=targets,
        risk_reward=round(rr_list[0], 2), stop_pct=round(stop_pct, 3),
        capital_used=round(contracts * entry * 100, 2),
        max_loss_dollars=round(contracts * risk * 100, 2), created=now,
    )
    return sig, "ok"
