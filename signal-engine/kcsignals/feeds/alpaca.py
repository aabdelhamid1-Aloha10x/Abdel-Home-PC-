"""Alpaca live feed: SIP stock trades + OPRA option quotes over WebSocket.

Real-time (not delayed) needs Alpaca's "Algo Trader Plus" market-data plan
(feed=sip for stocks, feed=opra for options). The free plan gives IEX-only stock
trades (a small slice of volume — bad for volume filters) and delayed/indicative
options. You do NOT need to trade at Alpaca; a data subscription is enough.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
from datetime import date, datetime

from ..config import FeedCfg
from ..models import Bar, OptionQuote, Side, Trade
from .base import Feed

log = logging.getLogger("kcsignals.alpaca")
OCC_RE = re.compile(r"^([A-Z.]+)(\d{6})([CP])(\d{8})$")


def parse_occ(code: str) -> tuple[str, date, Side, float]:
    m = OCC_RE.match(code)
    if not m:
        raise ValueError(code)
    sym, ymd, cp, k = m.groups()
    return sym, datetime.strptime(ymd, "%y%m%d").date(), Side.CALL if cp == "C" else Side.PUT, int(k) / 1000


class AlpacaFeed(Feed):
    def __init__(self, cfg: FeedCfg):
        from alpaca.data.enums import DataFeed, OptionsFeed
        from alpaca.data.historical import StockHistoricalDataClient
        from alpaca.data.historical.option import OptionHistoricalDataClient
        from alpaca.data.live import OptionDataStream, StockDataStream

        key, secret = os.getenv(cfg.alpaca_key_env), os.getenv(cfg.alpaca_secret_env)
        if not key or not secret:
            raise SystemExit(f"Set {cfg.alpaca_key_env} and {cfg.alpaca_secret_env} (see README).")
        self.stock_feed = DataFeed(cfg.alpaca_stock_feed)
        self.opt_feed = OptionsFeed(cfg.alpaca_option_feed)
        self.hist = StockHistoricalDataClient(key, secret)
        self.opt_hist = OptionHistoricalDataClient(key, secret)
        self.stocks = StockDataStream(key, secret, feed=self.stock_feed)
        self.options = OptionDataStream(key, secret, feed=self.opt_feed)
        self.subs: set[str] = set()
        if cfg.alpaca_stock_feed != "sip" or cfg.alpaca_option_feed != "opra":
            log.warning("Not on SIP/OPRA: data is partial or delayed. Signals will be late/wrong.")

    async def history_1m(self, symbol, start, end):
        from alpaca.data.requests import StockBarsRequest
        from alpaca.data.timeframe import TimeFrame

        req = StockBarsRequest(symbol_or_symbols=symbol, timeframe=TimeFrame.Minute, start=start, end=end,
                               feed=self.stock_feed)
        res = await asyncio.to_thread(self.hist.get_stock_bars, req)
        out = []
        for b in res.data.get(symbol, []):
            vw = (b.vwap or b.close) * b.volume
            out.append(Bar(symbol, b.timestamp, 60, b.open, b.high, b.low, b.close, b.volume, vw))
        return out

    async def option_chain(self, symbol, side, exp_from, exp_to, spot):
        from alpaca.data.enums import ContractType
        from alpaca.data.requests import OptionChainRequest

        req = OptionChainRequest(
            underlying_symbol=symbol, feed=self.opt_feed,
            type=ContractType.CALL if side is Side.CALL else ContractType.PUT,
            expiration_date_gte=exp_from, expiration_date_lte=exp_to,
            strike_price_gte=round(spot * 0.94, 2), strike_price_lte=round(spot * 1.06, 2),
        )
        snaps = await asyncio.to_thread(self.opt_hist.get_option_chain, req)
        out = []
        for code, s in snaps.items():
            q = s.latest_quote
            if q is None:
                continue
            sym, exp, sd, k = parse_occ(code)
            g = s.greeks
            out.append(OptionQuote(code, sym, sd, k, exp, q.bid_price, q.ask_price,
                                   g.delta if g else None, g.gamma if g else None, s.implied_volatility,
                                   volume=-1, open_interest=-1, ts=q.timestamp))
        return out

    async def subscribe_option(self, occ_symbol):
        if occ_symbol in self.subs:
            return
        self.subs.add(occ_symbol)
        self.options.subscribe_quotes(self._on_quote, occ_symbol)

    async def unsubscribe_option(self, occ_symbol):
        if occ_symbol in self.subs:
            self.subs.discard(occ_symbol)
            self.options.unsubscribe_quotes(occ_symbol)

    async def _on_trade(self, t) -> None:
        self.engine.on_trade(Trade(t.symbol, t.timestamp, float(t.price), float(t.size)))

    async def _on_quote(self, q) -> None:
        sym, exp, sd, k = parse_occ(q.symbol)
        self.engine.on_option_quote(OptionQuote(q.symbol, sym, sd, k, exp, q.bid_price, q.ask_price, ts=q.timestamp))

    async def run(self):
        self.stocks.subscribe_trades(self._on_trade, *self.engine.symbols)
        await asyncio.gather(self.stocks._run_forever(), self.options._run_forever())
