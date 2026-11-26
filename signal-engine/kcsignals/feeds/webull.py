"""Webull OpenAPI feed (official SDK: pip install webull-openapi-python-sdk).

What Webull's API can and can't do for this engine (from developer.webull.com):
  * Stock trades: real-time TICK stream over MQTT (max ~3 pushes/sec per connection).
  * Option quotes: NOT streamed. Polled via the option snapshot endpoint (<=20 symbols
    per call, 300 calls/min), here once per second for the contract you're in.
  * Real-time data needs an OpenAPI market-data subscription bought in Webull's
    "Advanced Quotes" center under "OpenAPI Advanced Quotes": Nasdaq Basic (stocks)
    and "OPRA Real-Time Non-display" (options). App/desktop subscriptions do NOT carry
    over. Without them calls return 403 or data is delayed.

STATUS: written against SDK v3.1.2 source, but not yet run against a live Webull
account. Response field names for bars/snapshots are parsed defensively; run
`python -m kcsignals probe-webull` first and check the printed raw JSON.
"""
from __future__ import annotations

import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone

from ..config import FeedCfg
from ..models import Bar, OptionQuote, Side, Trade
from .alpaca import parse_occ
from .base import Feed

log = logging.getLogger("kcsignals.webull")
HOSTS = {"api": "api.webull.com", "mqtt": "data-api.webull.com"}


def _pick(d: dict, *names, default=None):
    for n in names:
        if n in d and d[n] not in (None, ""):
            return d[n]
    return default


def _rows(js) -> list[dict]:
    if isinstance(js, list):
        return js
    if isinstance(js, dict):
        for k in ("data", "result", "list", "bars", "items"):
            if isinstance(js.get(k), list):
                return js[k]
    return []


def _ts(v) -> datetime:
    v = float(v)
    if v > 1e12:
        v /= 1000.0
    return datetime.fromtimestamp(v, tz=timezone.utc)


class WebullFeed(Feed):
    def __init__(self, cfg: FeedCfg):
        from webull.core.client import ApiClient
        from webull.data.data_client import DataClient

        self.key, self.secret = os.getenv(cfg.webull_app_key_env), os.getenv(cfg.webull_app_secret_env)
        if not self.key or not self.secret:
            raise SystemExit(f"Set {cfg.webull_app_key_env} and {cfg.webull_app_secret_env} (see README).")
        self.region = cfg.webull_region
        api = ApiClient(self.key, self.secret, self.region)
        api.add_endpoint(self.region, HOSTS["api"])
        self.data = DataClient(api)
        self.subs: set[str] = set()
        self.loop: asyncio.AbstractEventLoop | None = None

    # ------------------------------------------------------------ history
    async def history_1m(self, symbol, start, end):
        from webull.data.common.category import Category
        from webull.data.common.timespan import Timespan

        res = await asyncio.to_thread(self.data.market_data.get_history_bar, symbol, Category.US_STOCK.name,
                                      Timespan.M1.name, "1200")
        if res.status_code != 200:
            raise RuntimeError(f"Webull bars {symbol}: HTTP {res.status_code} {res.text[:200]}")
        out = []
        for r in _rows(res.json()):
            t = _ts(_pick(r, "time", "timestamp", "t"))
            c = float(_pick(r, "close", "c"))
            v = float(_pick(r, "volume", "v", default=0))
            out.append(Bar(symbol, t, 60, float(_pick(r, "open", "o")), float(_pick(r, "high", "h")),
                           float(_pick(r, "low", "l")), c, v, c * v))
        out.sort(key=lambda b: b.start)
        return [b for b in out if start <= b.start < end]

    # ------------------------------------------------------------ options
    async def _snapshots(self, codes: list[str]) -> list[OptionQuote]:
        from webull.data.common.category import Category

        out = []
        for i in range(0, len(codes), 20):
            batch = ",".join(codes[i:i + 20])
            res = await asyncio.to_thread(self.data.option_market_data.get_option_snapshot, batch,
                                          Category.US_OPTION.name)
            if res.status_code != 200:
                raise RuntimeError(f"Webull option snapshot: HTTP {res.status_code} {res.text[:200]}")
            for r in _rows(res.json()):
                code = _pick(r, "symbol", "option_symbol")
                if not code:
                    continue
                sym, exp, side, k = parse_occ(code)
                bid = float(_pick(r, "bid", "bid_price", default=0) or 0)
                ask = float(_pick(r, "ask", "ask_price", default=0) or 0)
                d = _pick(r, "delta")
                g = _pick(r, "gamma")
                iv = _pick(r, "implied_volatility", "iv")
                out.append(OptionQuote(code, sym, side, k, exp, bid, ask,
                                       float(d) if d is not None else None, float(g) if g is not None else None,
                                       float(iv) if iv is not None else None,
                                       volume=int(_pick(r, "volume", default=-1)),
                                       open_interest=int(_pick(r, "open_interest", default=-1)),
                                       ts=datetime.now(timezone.utc)))
        return out

    async def option_chain(self, symbol, side, exp_from, exp_to, spot):
        codes, page = [], None
        while True:
            res = await asyncio.to_thread(
                self.data.instrument.list_option_contracts, underlying_symbols=symbol,
                option_type="CALL" if side is Side.CALL else "PUT",
                strike_price_gte=str(round(spot * 0.95, 2)), strike_price_lte=str(round(spot * 1.05, 2)),
                pagination_key=page)
            if res.status_code != 200:
                raise RuntimeError(f"Webull contracts: HTTP {res.status_code} {res.text[:200]}")
            js = res.json()
            for r in _rows(js):
                code = _pick(r, "symbol", "option_symbol")
                if code:
                    _, exp, _, _ = parse_occ(code)
                    if exp_from <= exp <= exp_to:
                        codes.append(code)
            page = js.get("pagination_key") if isinstance(js, dict) else None
            if not page:
                break
        return await self._snapshots(codes)

    async def subscribe_option(self, occ_symbol):
        self.subs.add(occ_symbol)

    async def unsubscribe_option(self, occ_symbol):
        self.subs.discard(occ_symbol)

    async def _poll_options(self):
        while True:
            await asyncio.sleep(1.0)
            if self.subs:
                try:
                    for q in await self._snapshots(sorted(self.subs)):
                        self.engine.on_option_quote(q)
                except Exception as e:  # noqa: BLE001
                    log.warning("option poll failed: %s", e)

    # ------------------------------------------------------------ stream
    def _start_stream(self):
        from webull.data.common.category import Category
        from webull.data.common.subscribe_type import SubscribeType
        from webull.data.data_streaming_client import DataStreamingClient

        cli = DataStreamingClient(self.key, self.secret, self.region, uuid.uuid4().hex,
                                  http_host=HOSTS["api"], mqtt_host=HOSTS["mqtt"])

        def on_connect(client, api_client, session_id):
            client.subscribe(self.engine.symbols, Category.US_STOCK.name, [SubscribeType.TICK.name])

        def on_msg(client, topic, tick):
            try:
                basic = tick.get_basic()
                price, vol = tick.get_price(), tick.get_volume()
                if price is None:
                    return
                t_raw = tick.get_time() or basic.timestamp
                tr = Trade(basic.symbol, _ts(t_raw), float(price), float(vol or 0))
                self.loop.call_soon_threadsafe(self.engine.on_trade, tr)
            except Exception as e:  # noqa: BLE001
                log.debug("tick parse %s: %s", topic, e)

        cli.on_connect_success = on_connect
        cli.on_quotes_message = on_msg
        cli.connect_and_loop_async()
        return cli

    async def run(self):
        self.loop = asyncio.get_running_loop()
        self._start_stream()
        await self._poll_options()
