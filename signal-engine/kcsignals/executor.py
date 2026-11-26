"""Optional auto-trading through Alpaca (paper or live).

execution.mode:
  off   -> nothing is sent anywhere; you place trades yourself (Webull)
  paper -> orders go to your Alpaca PAPER account (ALPACA_PAPER_API_KEY / SECRET)
  live  -> REAL orders in your Alpaca account. Refuses to start unless the environment
           variable KC_LIVE_TRADING=I_UNDERSTAND is set as well.

Entries are limit orders (signal price + small slippage), cancelled if not filled
within entry_timeout_s; the trade is then voided. Exits are market orders, and never
sell more contracts than the account actually holds.
"""
from __future__ import annotations

import asyncio
import logging
import os

from .config import ExecutionCfg, FeedCfg

log = logging.getLogger("kcsignals.exec")


class ExecError(RuntimeError):
    pass


class AlpacaExecutor:
    def __init__(self, cfg: ExecutionCfg, feed_cfg: FeedCfg):
        from alpaca.trading.client import TradingClient

        self.cfg = cfg
        self.paper = cfg.mode == "paper"
        if cfg.mode == "live" and os.getenv("KC_LIVE_TRADING") != "I_UNDERSTAND":
            raise SystemExit("execution.mode is 'live' but KC_LIVE_TRADING=I_UNDERSTAND is not set. Refusing to "
                             "place real orders.")
        if self.paper:
            key = os.getenv(cfg.paper_key_env) or os.getenv(feed_cfg.alpaca_key_env)
            sec = os.getenv(cfg.paper_secret_env) or os.getenv(feed_cfg.alpaca_secret_env)
        else:
            key, sec = os.getenv(feed_cfg.alpaca_key_env), os.getenv(feed_cfg.alpaca_secret_env)
        if not key or not sec:
            raise SystemExit("Alpaca trading keys missing (see .env.example).")
        self.client = TradingClient(key, sec, paper=self.paper)
        self.lock = asyncio.Lock()

    @property
    def label(self) -> str:
        return "PAPER" if self.paper else "LIVE"

    async def preflight(self) -> str:
        acct = await asyncio.to_thread(self.client.get_account)
        lvl = acct.options_trading_level or acct.options_approved_level or 0
        if int(lvl) < 2:
            raise SystemExit(f"Alpaca {self.label} account options level is {lvl}; buying calls/puts needs level 2+.")
        pos = await asyncio.to_thread(self.client.get_all_positions)
        opts = [p.symbol for p in pos if len(p.symbol) > 10]
        return (f"Alpaca {self.label}: equity ${float(acct.equity):,.0f}, options BP ${float(acct.options_buying_power or 0):,.0f}, "
                f"options level {lvl}, PDT={acct.pattern_day_trader}, open option positions: {opts or 'none'}")

    async def _wait(self, order_id, timeout: float):
        from alpaca.trading.enums import OrderStatus
        done = {OrderStatus.FILLED, OrderStatus.CANCELED, OrderStatus.REJECTED, OrderStatus.EXPIRED}
        loop = asyncio.get_running_loop()
        end = loop.time() + timeout
        o = None
        while loop.time() < end:
            o = await asyncio.to_thread(self.client.get_order_by_id, order_id)
            if o.status in done:
                return o
            await asyncio.sleep(0.5)
        return o

    async def buy(self, occ: str, qty: int, limit: float) -> tuple[int, float]:
        """Returns (filled qty, avg price). Unfilled remainder is cancelled."""
        from alpaca.trading.enums import OrderSide, TimeInForce
        from alpaca.trading.requests import LimitOrderRequest

        px = round(limit + self.cfg.entry_slippage, 2)
        if qty * px * 100 > self.cfg.max_order_dollars:
            raise ExecError(f"order ${qty * px * 100:,.0f} exceeds max_order_dollars ${self.cfg.max_order_dollars:,.0f}")
        async with self.lock:
            req = LimitOrderRequest(symbol=occ, qty=qty, side=OrderSide.BUY, time_in_force=TimeInForce.DAY,
                                    limit_price=px)
            o = await asyncio.to_thread(self.client.submit_order, req)
            o = await self._wait(o.id, self.cfg.entry_timeout_s)
            if o is not None and float(o.filled_qty or 0) < qty:
                try:
                    await asyncio.to_thread(self.client.cancel_order_by_id, o.id)
                except Exception:  # noqa: BLE001 - may have filled meanwhile
                    pass
                o = await asyncio.to_thread(self.client.get_order_by_id, o.id)
            filled = int(float(o.filled_qty or 0)) if o else 0
            avg = float(o.filled_avg_price or px) if filled else 0.0
            return filled, avg

    async def sell(self, occ: str, qty: int) -> tuple[int, float]:
        from alpaca.trading.enums import OrderSide, TimeInForce
        from alpaca.trading.requests import MarketOrderRequest

        async with self.lock:
            try:
                pos = await asyncio.to_thread(self.client.get_open_position, occ)
                held = int(float(pos.qty))
            except Exception:  # noqa: BLE001 - no position
                held = 0
            qty = min(qty, held)
            if qty <= 0:
                return 0, 0.0
            req = MarketOrderRequest(symbol=occ, qty=qty, side=OrderSide.SELL, time_in_force=TimeInForce.DAY)
            o = await asyncio.to_thread(self.client.submit_order, req)
            o = await self._wait(o.id, 15)
            filled = int(float(o.filled_qty or 0)) if o else 0
            return filled, float(o.filled_avg_price or 0) if filled else 0.0
