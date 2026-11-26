"""Backtest: replay real history through the *same* engine, day by day.

  python -m kcsignals backtest --days 60            # last 60 sessions, whole watchlist
  python -m kcsignals backtest --from 2026-09-01 --to 2026-11-25 --symbols TSLA NVDA

Data: Alpaca 1-minute bars (SIP, extended hours) + hourly bars, cached in .cache/.
Each minute bar is replayed as 4 prints (open, low/high in candle order, close), so
levels, volume filters, setups, stops and targets fire exactly as they would live,
just at 15-second granularity. Options are priced with Black-Scholes at IV = 20-day
realized volatility x iv_hv_mult (no historical option quotes needed), so results
measure the *setups*, not real fills — real 0DTE fills, especially stops, are worse.

Outputs:
  backtest_report.md  — per setup and ticker: trades, win rate, avg R, T1-before-stop rate, P&L
  backtest_trades.csv — every simulated trade
  backtest_stats.json — read by the live engine, which adds "backtest FIB_PULLBACK on TSLA:
                        23 trades, 57% win, avg +0.41R, T1 before stop 61%" to each alert
Inspired by the history replay in Jakeschincariol/day-trader-skill (trader-timemachine), MIT.
"""
from __future__ import annotations

import asyncio
import csv
import gzip
import json
import logging
import math
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from pathlib import Path

from .alerts import Alerter
from .config import Settings
from .engine import Engine, run_engine
from .feeds.replay import ReplayFeed
from .models import Bar, Trade
from .timeutil import ET, et_date, is_rth

log = logging.getLogger("kcsignals.backtest")


def bars_to_trades(bars: list[Bar]) -> list[Trade]:
    out = []
    for b in bars:
        path = [b.open, b.low, b.high, b.close] if b.close >= b.open else [b.open, b.high, b.low, b.close]
        v = b.volume / 4
        for i, px in enumerate(path):
            out.append(Trade(b.symbol, b.start + timedelta(seconds=i * 15), px, v))
    return out


def realized_iv(bars1m: list[Bar], day: date, mult: float, floor: float) -> float:
    closes: dict[date, float] = {}
    for b in bars1m:
        d = et_date(b.start)
        if d < day and is_rth(b.start):
            closes[d] = b.close
    px = [closes[d] for d in sorted(closes)][-21:]
    if len(px) < 6:
        return max(floor, 0.45)
    rets = [math.log(px[i] / px[i - 1]) for i in range(1, len(px))]
    mu = sum(rets) / len(rets)
    sd = math.sqrt(sum((r - mu) ** 2 for r in rets) / (len(rets) - 1))
    return max(floor, sd * math.sqrt(252) * mult)


async def run_backtest(settings: Settings, bars1m: dict[str, list[Bar]], bars60: dict[str, list[Bar]],
                       days: list[date], plan_fn=None, progress=None) -> list[dict]:
    s = settings.model_copy(deep=True)
    s.alerts.console = False
    s.alerts.log_file = ""
    s.execution.mode = "off"
    equity = s.account.size
    trades: list[dict] = []
    for i, d in enumerate(days):
        syms = [x for x in s.watchlist if any(et_date(b.start) == d for b in bars1m.get(x, []))]
        if not syms:
            continue
        day_bars = {x: [b for b in bars1m[x] if et_date(b.start) == d] for x in syms}
        tape = [t for x in syms for t in bars_to_trades(day_bars[x])]
        if not tape:
            continue
        iv = {x: realized_iv(bars1m[x], d, s.backtest.iv_hv_mult, s.backtest.min_iv) for x in syms}
        s.watchlist = syms
        feed = ReplayFeed(tape, bars1m, iv=iv, history60=bars60)
        eng = Engine(s, feed, alerter=Alerter(s.alerts, push=False),
                     plan_fn=plan_fn or (lambda _d, _w: None), news=None, stats={})
        eng.book.start_equity = equity
        await run_engine(eng)
        equity = eng.book.equity
        for t in eng.trade_log:
            t["equity_after"] = round(equity, 2)
        trades += eng.trade_log
        if progress:
            progress(i + 1, len(days), d, len(eng.trade_log), equity)
        s.watchlist = list(settings.watchlist)
    return trades


def summarize(trades: list[dict]) -> dict:
    groups: dict[str, list[dict]] = defaultdict(list)
    for t in trades:
        groups[f"{t['kind']}|{t['symbol']}"].append(t)
        groups[f"{t['kind']}|*"].append(t)
        groups[f"*|{t['symbol']}"].append(t)
        groups["*|*"].append(t)
    out = {}
    for k, ts in groups.items():
        n = len(ts)
        out[k] = {
            "n": n,
            "win_rate": round(sum(1 for t in ts if t["pnl"] > 0) / n, 3),
            "avg_r": round(sum(t["r"] for t in ts) / n, 3),
            "t1_rate": round(sum(1 for t in ts if t["t1_first"]) / n, 3),
            "pnl": round(sum(t["pnl"] for t in ts), 2),
        }
    return out


def write_outputs(trades: list[dict], stats: dict, settings: Settings, days: list[date], out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / settings.backtest.stats_file).write_text(json.dumps(stats, indent=1, sort_keys=True))
    with open(out_dir / "backtest_trades.csv", "w", newline="") as f:
        cols = ["day", "symbol", "kind", "side", "entry_time", "exit", "pnl", "risk", "r", "t1_first", "equity_after"]
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(trades)
    tot = stats.get("*|*", {"n": 0})
    lines = [f"# Backtest {days[0] if days else ''} → {days[-1] if days else ''} ({len(days)} sessions)", "",
             f"Start ${settings.account.size:,.0f} · end ${trades[-1]['equity_after']:,.0f}" if trades else "No trades.",
             "", "Simulated option prices (Black-Scholes at realized vol). Measures the setups, not real fills.", "",
             "| Setup | Ticker | Trades | Win % | Avg R | T1 before stop | P&L |", "|---|---|---:|---:|---:|---:|---:|"]
    for k in sorted(stats, key=lambda k: (k.split("|")[0] == "*", k)):
        st = stats[k]
        kind, sym = k.split("|")
        lines.append(f"| {kind if kind != '*' else 'ALL'} | {sym if sym != '*' else 'all'} | {st['n']} | "
                     f"{st['win_rate']:.0%} | {st['avg_r']:+.2f} | {st['t1_rate']:.0%} | ${st['pnl']:,.0f} |")
    if tot.get("n"):
        lines += ["", f"**Overall:** {tot['n']} trades, {tot['win_rate']:.0%} win, {tot['avg_r']:+.2f}R per trade."]
    path = out_dir / "backtest_report.md"
    path.write_text("\n".join(lines) + "\n")
    return path


# ------------------------------------------------------------------ data
def _cache_path(sym: str, minutes: int, start: date, end: date) -> Path:
    return Path(".cache") / f"{sym}-{minutes}m-{start}-{end}.json.gz"


def _dump(bars: list[Bar], p: Path) -> None:
    p.parent.mkdir(exist_ok=True)
    with gzip.open(p, "wt") as f:
        json.dump([[b.start.isoformat(), b.open, b.high, b.low, b.close, b.volume, b.vwap_num] for b in bars], f)


def _load(sym: str, minutes: int, p: Path) -> list[Bar]:
    with gzip.open(p, "rt") as f:
        return [Bar(sym, datetime.fromisoformat(r[0]), minutes * 60, *r[1:]) for r in json.load(f)]


async def load_history(feed, symbols: list[str], start: date, end: date) -> tuple[dict, dict]:
    b1, b60 = {}, {}
    s_dt = datetime.combine(start - timedelta(days=35), time(0), tzinfo=ET)
    h_dt = datetime.combine(start - timedelta(days=60), time(0), tzinfo=ET)
    e_dt = datetime.combine(end + timedelta(days=1), time(0), tzinfo=ET)
    for sym in symbols:
        for minutes, frm, store in ((1, s_dt, b1), (60, h_dt, b60)):
            p = _cache_path(sym, minutes, start, end)
            if p.exists():
                store[sym] = _load(sym, minutes, p)
            else:
                log.info("downloading %s %sm bars %s..%s", sym, minutes, frm.date(), end)
                store[sym] = await feed.history_bars(sym, frm, e_dt, minutes)
                _dump(store[sym], p)
    return b1, b60


def session_days(bars1m: dict[str, list[Bar]], start: date, end: date) -> list[date]:
    return sorted({et_date(b.start) for bs in bars1m.values() for b in bs
                   if is_rth(b.start) and start <= et_date(b.start) <= end})


async def main_backtest(settings: Settings, days: int | None, start: date | None, end: date | None,
                        symbols: list[str] | None, with_calendar: bool) -> None:
    from .__main__ import make_feed
    if symbols:
        settings.watchlist = [s.upper() for s in symbols]
    end = end or (datetime.now(ET).date() - timedelta(days=1))
    start = start or (end - timedelta(days=int((days or 60) * 1.5) + 3))
    feed = make_feed(settings, "alpaca")
    b1, b60 = await load_history(feed, settings.watchlist, start, end)
    sess = session_days(b1, start, end)
    if days:
        sess = sess[-days:]
    plan_fn = None
    if with_calendar:
        from .calendar import build_day_plan
        plan_fn = lambda d, w: build_day_plan(d, w, settings.calendar, settings.options.max_dte)  # noqa: E731

    def progress(i, n, d, k, eq):
        print(f"  {d}  {k} trade(s)  equity ${eq:,.0f}   [{i}/{n}]", flush=True)

    trades = await run_backtest(settings, b1, b60, sess, plan_fn, progress)
    stats = summarize(trades)
    path = write_outputs(trades, stats, settings, sess, Path("."))
    print(path.read_text())
    print(f"Saved {path}, backtest_trades.csv and {settings.backtest.stats_file} "
          f"(the live engine now quotes these stats in each alert).")


def run_cli(settings: Settings, args) -> None:
    asyncio.run(main_backtest(settings, args.days, args.date_from, args.date_to, args.symbols, args.with_calendar))
