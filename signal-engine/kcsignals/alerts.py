"""Delivers events: terminal, JSONL log, and phone push (ntfy / Discord / Telegram)."""
from __future__ import annotations

import asyncio
import json
import logging
import os
from datetime import datetime

import requests

from .config import AlertCfg
from .models import Event, EventType
from .timeutil import to_et

log = logging.getLogger("kcsignals.alerts")

PRIORITY = {EventType.ENTRY: "urgent", EventType.STOP: "urgent", EventType.TRIM: "high",
            EventType.TARGET_FINAL: "high", EventType.TIME_EXIT: "high", EventType.BREAKEVEN_EXIT: "high",
            EventType.ADD: "high", EventType.ORDER: "default", EventType.NEWS: "default",
            EventType.CALENDAR: "default"}
COLORS = {EventType.ENTRY: "\033[1;32m", EventType.STOP: "\033[1;31m", EventType.TRIM: "\033[1;33m",
          EventType.TARGET_FINAL: "\033[1;36m", EventType.ADD: "\033[1;32m", EventType.ORDER: "\033[1;35m", EventType.NEWS: "\033[1;34m", EventType.CALENDAR: "\033[1;34m", EventType.RISK_BLOCK: "\033[2m", EventType.INFO: "\033[2m"}


class Alerter:
    def __init__(self, cfg: AlertCfg, push: bool = True):
        self.cfg = cfg
        self.recent: list[dict] = []   # for the dashboard
        self.ntfy = os.getenv(cfg.ntfy_topic_env) if push else None
        self.discord = os.getenv(cfg.discord_webhook_env) if push else None
        self.tg_token = os.getenv(cfg.telegram_token_env) if push else None
        self.tg_chat = os.getenv(cfg.telegram_chat_env) if push else None

    async def send(self, ev: Event) -> None:
        rec = {"type": ev.type.value, "ts": ev.ts.isoformat(), "symbol": ev.symbol,
               "message": ev.message, "signal_id": ev.signal_id, "data": ev.data,
               "sent": datetime.now().astimezone().isoformat()}
        self.recent.append(rec)
        del self.recent[:-200]
        if self.cfg.console:
            c = COLORS.get(ev.type, "")
            print(f"{c}[{to_et(ev.ts):%H:%M:%S}] {ev.type.value:<14} {ev.symbol:<5}\033[0m {ev.message}\n", flush=True)
        if self.cfg.log_file:
            with open(self.cfg.log_file, "a") as f:
                f.write(json.dumps(rec) + "\n")
        if ev.type in PRIORITY:
            await asyncio.to_thread(self._push, ev)

    def _push(self, ev: Event) -> None:
        title = f"{ev.type.value} {ev.symbol}"
        try:
            if self.ntfy:
                requests.post(f"https://ntfy.sh/{self.ntfy}", data=ev.message.encode(),
                              headers={"Title": title, "Priority": PRIORITY[ev.type], "Tags": "chart_with_upwards_trend"},
                              timeout=5)
            if self.discord:
                requests.post(self.discord, json={"content": f"**{title}**\n```{ev.message}```"}, timeout=5)
            if self.tg_token and self.tg_chat:
                requests.post(f"https://api.telegram.org/bot{self.tg_token}/sendMessage",
                              json={"chat_id": self.tg_chat, "text": f"{title}\n{ev.message}"}, timeout=5)
        except requests.RequestException as e:  # never let a push failure kill the engine
            log.warning("push failed: %s", e)
