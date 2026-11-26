"""Command line.

  python -m kcsignals run            # live: stream data, push signals (config.yaml)
  python -m kcsignals demo           # offline: replays a synthetic breakout/retest day
  python -m kcsignals replay FILE    # offline: replay a trades CSV (ts,symbol,price,size)
  python -m kcsignals probe-alpaca   # check your Alpaca keys + data plan are real-time
  python -m kcsignals probe-webull   # print raw Webull responses to verify field names
"""
from __future__ import annotations

import argparse
import asyncio
import logging
from datetime import datetime, timedelta, timezone

from .config import load_settings
from .dashboard import serve
from .engine import Engine, run_engine
from .models import Side


def make_feed(settings, provider: str | None = None):
    p = provider or settings.feed.provider
    if p == "alpaca":
        from .feeds.alpaca import AlpacaFeed
        return AlpacaFeed(settings.feed)
    if p == "webull":
        from .feeds.webull import WebullFeed
        return WebullFeed(settings.feed)
    raise SystemExit(f"unknown provider {p}")


async def _run_live(settings, with_dashboard: bool):
    engine = Engine(settings, make_feed(settings))
    tasks = [asyncio.create_task(run_engine(engine))]
    if with_dashboard:
        tasks.append(asyncio.create_task(serve(engine, settings.dashboard_port)))
        print(f"Dashboard: http://localhost:{settings.dashboard_port}")
    await asyncio.gather(*tasks)


async def _demo(settings, direction: str):
    from .feeds.replay import ReplayFeed, synthetic_day
    side = Side.PUT if direction == "put" else Side.CALL
    trades, hist = synthetic_day("NVDA", direction=side)
    settings.watchlist = ["NVDA"]
    engine = Engine(settings, ReplayFeed(trades, {"NVDA": hist}))
    await run_engine(engine)
    print(f"Demo day P&L: ${engine.book.realized:,.0f} on ${settings.account.size:,.0f}")


async def _replay(settings, path: str):
    from .feeds.replay import ReplayFeed, load_trades_csv
    trades = load_trades_csv(path)
    settings.watchlist = sorted({t.symbol for t in trades})
    engine = Engine(settings, ReplayFeed(trades))
    await run_engine(engine)
    print(f"Replay P&L (simulated option prices): ${engine.book.realized:,.0f}")


async def _probe_alpaca(settings):
    feed = make_feed(settings, "alpaca")
    sym = settings.watchlist[0]
    now = datetime.now(timezone.utc)
    bars = await feed.history_1m(sym, now - timedelta(days=3), now)
    print(f"{sym}: {len(bars)} 1-min bars; last {bars[-1].start if bars else None}")
    chain = await feed.option_chain(sym, Side.CALL, now.date(), now.date() + timedelta(days=7),
                                    bars[-1].close if bars else 100)
    print(f"{len(chain)} call contracts; sample:", chain[:2])
    lag = [(now - q.ts).total_seconds() for q in chain if q.ts]
    if lag:
        print(f"freshest option quote is {min(lag):.0f}s old (market hours: should be ~0-2s on OPRA)")


async def _probe_webull(settings):
    from webull.data.common.category import Category
    from webull.data.common.timespan import Timespan
    feed = make_feed(settings, "webull")
    sym = settings.watchlist[0]
    r = feed.data.market_data.get_history_bar(sym, Category.US_STOCK.name, Timespan.M1.name, "3")
    print("BARS", r.status_code, r.text[:800])
    r = feed.data.instrument.list_option_contracts(underlying_symbols=sym, option_type="CALL")
    print("CONTRACTS", r.status_code, r.text[:800])


def main():
    ap = argparse.ArgumentParser(prog="kcsignals")
    ap.add_argument("cmd", choices=["run", "demo", "replay", "probe-alpaca", "probe-webull"])
    ap.add_argument("file", nargs="?")
    ap.add_argument("-c", "--config", default="config.yaml")
    ap.add_argument("--no-dashboard", action="store_true")
    ap.add_argument("--side", choices=["call", "put"], default="call", help="demo direction")
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args()
    logging.basicConfig(level=logging.DEBUG if a.verbose else logging.INFO,
                        format="%(asctime)s %(name)s %(levelname)s %(message)s")
    s = load_settings(a.config)
    if a.cmd == "run":
        asyncio.run(_run_live(s, not a.no_dashboard))
    elif a.cmd == "demo":
        s.alerts.log_file = ""
        asyncio.run(_demo(s, a.side))
    elif a.cmd == "replay":
        if not a.file:
            raise SystemExit("replay needs a CSV path")
        asyncio.run(_replay(s, a.file))
    elif a.cmd == "probe-alpaca":
        asyncio.run(_probe_alpaca(s))
    else:
        asyncio.run(_probe_webull(s))


if __name__ == "__main__":
    main()
