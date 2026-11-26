"""Command line.

  python -m kcsignals daemon         # always-on: starts the engine 9:00 ET every trading day
  python -m kcsignals run            # start the engine right now (stops after the close)
  python -m kcsignals demo           # offline synthetic day + dashboard, no keys needed
  python -m kcsignals replay FILE    # offline: replay a trades CSV (ts,symbol,price,size)
  python -m kcsignals backtest       # replay the last 60 sessions of real Alpaca history
  python -m kcsignals today          # print today's calendar restrictions + overnight news
  python -m kcsignals probe-alpaca   # check keys, real-time data, and the trading account
  python -m kcsignals probe-webull   # print raw Webull responses to verify field names
"""
from __future__ import annotations

import argparse
import asyncio
import logging
from datetime import date, datetime, time, timedelta, timezone

from .config import Settings, load_settings
from .dashboard import serve
from .engine import Engine, run_engine
from .models import Side
from .timeutil import ET

log = logging.getLogger("kcsignals")


def load_dotenv(path: str = ".env") -> None:
    """Read KEY=VALUE lines from .env (no extra dependency; real env vars win)."""
    import os
    try:
        lines = open(path).read().splitlines()
    except OSError:
        return
    for ln in lines:
        ln = ln.strip()
        if not ln or ln.startswith("#") or "=" not in ln:
            continue
        k, v = ln.split("=", 1)
        v = v.strip().strip('"').strip("'")
        if v:
            os.environ.setdefault(k.strip(), v)


def make_feed(settings: Settings, provider: str | None = None):
    p = provider or settings.feed.provider
    if p == "alpaca":
        from .feeds.alpaca import AlpacaFeed
        return AlpacaFeed(settings.feed)
    if p == "webull":
        from .feeds.webull import WebullFeed
        return WebullFeed(settings.feed)
    raise SystemExit(f"unknown provider {p}")


def make_executor(settings: Settings):
    if settings.execution.mode == "off":
        return None
    from .executor import AlpacaExecutor
    return AlpacaExecutor(settings.execution, settings.feed)


class Holder:
    """Lets one dashboard server follow a fresh engine each day."""
    engine: Engine | None = None

    def snapshot(self):
        if self.engine is None:
            return {"day": "waiting for the 9:00 ET start", "equity": 0, "day_pnl": 0, "trades": 0, "losers": 0,
                    "rung": 0, "mode": "-", "symbols": {}, "open": [], "events": []}
        return self.engine.snapshot()

    def chart(self, sym, tf):
        return self.engine.chart(sym, tf) if self.engine else {"bars": []}


def session_for(settings: Settings, d: date) -> tuple[datetime, datetime] | None:
    """(open, close) in ET from Alpaca's market calendar (holidays, half days)."""
    import os
    key, sec = os.getenv(settings.feed.alpaca_key_env), os.getenv(settings.feed.alpaca_secret_env)
    try:
        from alpaca.trading.client import TradingClient
        from alpaca.trading.requests import GetCalendarRequest
        cal = TradingClient(key, sec, paper=False).get_calendar(GetCalendarRequest(start=d, end=d))
        if not cal:
            return None
        c = cal[0]
        o, cl = c.open, c.close
        o = o.replace(tzinfo=ET) if o.tzinfo is None else o.astimezone(ET)
        cl = cl.replace(tzinfo=ET) if cl.tzinfo is None else cl.astimezone(ET)
        return o, cl
    except Exception as e:  # noqa: BLE001 - fall back to a plain weekday schedule
        log.warning("calendar lookup failed (%s); assuming a normal weekday session", e)
        if d.weekday() >= 5:
            return None
        return datetime.combine(d, time(9, 30), tzinfo=ET), datetime.combine(d, time(16, 0), tzinfo=ET)


async def _sleep_until(t: datetime, why: str) -> None:
    secs = (t - datetime.now(ET)).total_seconds()
    if secs > 0:
        log.info("sleeping %.0f min until %s ET (%s)", secs / 60, f"{t:%a %H:%M}", why)
        await asyncio.sleep(secs)


async def _session(settings: Settings, holder: Holder, close: datetime) -> None:
    from .news import NewsMonitor
    engine = Engine(settings, make_feed(settings), executor=make_executor(settings),
                    news=NewsMonitor.from_env(settings))
    holder.engine = engine
    await run_engine(engine, until=close + timedelta(minutes=settings.schedule.stop_after_close_min))


async def _daemon(settings: Settings, dashboard: bool) -> None:
    holder = Holder()
    if dashboard:
        asyncio.create_task(serve(holder, settings.dashboard_port))
        print(f"Dashboard: http://localhost:{settings.dashboard_port}")
    while True:
        now = datetime.now(ET)
        sess = session_for(settings, now.date())
        if sess and now < sess[1]:
            await _sleep_until(datetime.combine(now.date(), settings.schedule.start, tzinfo=ET), "pre-market start")
            log.info("session %s: open %s close %s", now.date(), f"{sess[0]:%H:%M}", f"{sess[1]:%H:%M}")
            try:
                await _session(settings, holder, sess[1])
            except Exception:  # noqa: BLE001 - log, then try again tomorrow
                log.exception("engine crashed; restarting in 60s")
                await asyncio.sleep(60)
                continue
        tomorrow = datetime.combine(now.date() + timedelta(days=1), time(0, 5), tzinfo=ET)
        await _sleep_until(tomorrow, "next day")


async def _run_now(settings: Settings, dashboard: bool) -> None:
    holder = Holder()
    if dashboard:
        asyncio.create_task(serve(holder, settings.dashboard_port))
        print(f"Dashboard: http://localhost:{settings.dashboard_port}")
    now = datetime.now(ET)
    sess = session_for(settings, now.date())
    close = sess[1] if sess else datetime.combine(now.date(), time(16, 0), tzinfo=ET)
    await _session(settings, holder, close)


async def _demo(settings: Settings, direction: str, dashboard: bool):
    from .feeds.replay import ReplayFeed, synthetic_day
    side = Side.PUT if direction == "put" else Side.CALL
    trades, hist = synthetic_day("NVDA", direction=side, fib_pullback=True)
    settings.watchlist = ["NVDA"]
    engine = Engine(settings, ReplayFeed(trades, {"NVDA": hist}))
    await run_engine(engine)
    print(f"Demo day P&L: ${engine.book.realized:,.0f} on ${settings.account.size:,.0f}")
    if dashboard:
        print(f"Charts of the demo day: http://localhost:{settings.dashboard_port}  (Ctrl+C to quit)")
        await serve(engine, settings.dashboard_port)


async def _replay(settings: Settings, path: str):
    from .feeds.replay import ReplayFeed, load_trades_csv
    trades = load_trades_csv(path)
    settings.watchlist = sorted({t.symbol for t in trades})
    engine = Engine(settings, ReplayFeed(trades))
    await run_engine(engine)
    print(f"Replay P&L (simulated option prices): ${engine.book.realized:,.0f}")


async def _probe_alpaca(settings: Settings):
    feed = make_feed(settings, "alpaca")
    sym = settings.watchlist[0]
    now = datetime.now(timezone.utc)
    bars = await feed.history_bars(sym, now - timedelta(days=3), now, 1)
    print(f"{sym}: {len(bars)} 1-min bars; newest {bars[-1].start if bars else None}")
    h = await feed.history_bars(sym, now - timedelta(days=45), now, 60)
    print(f"{sym}: {len(h)} hourly bars (need ~200 for the hourly 200 SMA)")
    chain = await feed.option_chain(sym, Side.CALL, now.date(), now.date() + timedelta(days=7),
                                    bars[-1].close if bars else 100)
    print(f"{len(chain)} call contracts near the money")
    lag = [(now - q.ts).total_seconds() for q in chain if q.ts]
    if lag:
        print(f"freshest option quote is {min(lag):.0f}s old (in market hours this should be ~0-2s on OPRA)")
    if settings.execution.mode != "off":
        print(await make_executor(settings).preflight())


async def _probe_webull(settings: Settings):
    from webull.data.common.category import Category
    from webull.data.common.timespan import Timespan
    feed = make_feed(settings, "webull")
    sym = settings.watchlist[0]
    r = feed.data.market_data.get_history_bar(sym, Category.US_STOCK.name, Timespan.M1.name, "3")
    print("BARS", r.status_code, r.text[:800])
    r = feed.data.instrument.list_option_contracts(underlying_symbols=sym, option_type="CALL")
    print("CONTRACTS", r.status_code, r.text[:800])


async def _today(settings: Settings):
    from .calendar import build_day_plan
    from .news import NewsMonitor
    d = datetime.now(ET).date()
    plan = await asyncio.to_thread(build_day_plan, d, settings.watchlist, settings.calendar, settings.options.max_dte)
    print(f"== {d}")
    for n in plan.notes:
        print("  calendar:", n)
    for w in plan.blackouts:
        print("  no new entries:", w)
    for sym, r in plan.per_symbol.items():
        print(f"  {sym}: {'; '.join(r.notes)}")
    mon = NewsMonitor.from_env(settings)
    if mon is None:
        print("  news: set ALPACA_API_KEY/SECRET (and optionally SEC_USER_AGENT) for headlines")
        return
    for it in await mon.morning(datetime.now(ET)):
        if it.moving or it.severe:
            print(f"  NEWS {','.join(it.symbols)} [{', '.join(it.tags)}] {it.headline}")


def main():
    ap = argparse.ArgumentParser(prog="kcsignals")
    ap.add_argument("cmd", choices=["daemon", "run", "demo", "replay", "backtest", "today", "probe-alpaca",
                                    "probe-webull"])
    ap.add_argument("file", nargs="?")
    ap.add_argument("-c", "--config", default="config.yaml")
    ap.add_argument("--no-dashboard", action="store_true")
    ap.add_argument("--side", choices=["call", "put"], default="call", help="demo direction")
    ap.add_argument("-v", "--verbose", action="store_true")
    ap.add_argument("--days", type=int, help="backtest: number of recent sessions (default 60)")
    ap.add_argument("--from", dest="date_from", type=date.fromisoformat, help="backtest start YYYY-MM-DD")
    ap.add_argument("--to", dest="date_to", type=date.fromisoformat, help="backtest end YYYY-MM-DD")
    ap.add_argument("--symbols", nargs="+", help="backtest: subset of the watchlist")
    ap.add_argument("--with-calendar", action="store_true", help="backtest: apply historical econ/earnings rules")
    a = ap.parse_args()
    logging.basicConfig(level=logging.DEBUG if a.verbose else logging.INFO,
                        format="%(asctime)s %(name)s %(levelname)s %(message)s")
    load_dotenv()
    s = load_settings(a.config)
    try:
        if a.cmd == "daemon":
            asyncio.run(_daemon(s, not a.no_dashboard))
        elif a.cmd == "run":
            asyncio.run(_run_now(s, not a.no_dashboard))
        elif a.cmd == "demo":
            s.alerts.log_file = ""
            asyncio.run(_demo(s, a.side, not a.no_dashboard))
        elif a.cmd == "replay":
            if not a.file:
                raise SystemExit("replay needs a CSV path")
            asyncio.run(_replay(s, a.file))
        elif a.cmd == "backtest":
            from .backtest import run_cli
            if not (a.days or a.date_from):
                a.days = 60
            run_cli(s, a)
        elif a.cmd == "today":
            asyncio.run(_today(s))
        elif a.cmd == "probe-alpaca":
            asyncio.run(_probe_alpaca(s))
        else:
            asyncio.run(_probe_webull(s))
    except KeyboardInterrupt:
        print("stopped")


if __name__ == "__main__":
    main()
