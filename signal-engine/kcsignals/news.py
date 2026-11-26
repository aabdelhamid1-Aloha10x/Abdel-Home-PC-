"""Company news: morning catalyst check + live headlines that pause entries.

Sources:
  * Alpaca news API (real-time Benzinga feed, same keys as the data feed).
  * SEC EDGAR 8-K filings (optional; set SEC_USER_AGENT="Your Name your@email" — the
    SEC requires a contact in the User-Agent; nothing is sent without it).
Each item is tagged (earnings, analyst, legal, deal, halt, ...). In the morning, a
ticker with a halt / restatement / bankruptcy-type item is blocked for the day.
During the session, a fresh market-moving headline pauses new entries on that ticker
for `pause_min` minutes (premiums spike, levels break randomly) and is pushed to you.

Keyword table, 8-K item map and tagging adapted from Jakeschincariol/day-trader-skill
(trader-news/news.py), MIT License, Copyright (c) 2026 Jake Schincariol.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import xml.etree.ElementTree as ET_XML
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

import requests

log = logging.getLogger("kcsignals.news")

ITEMS_8K = {
    "1.01": "material agreement", "1.02": "agreement ended", "1.03": "bankruptcy",
    "1.05": "cybersecurity incident", "2.01": "acquisition or sale of assets",
    "2.02": "earnings results", "2.03": "new debt", "2.04": "debt acceleration",
    "2.05": "restructuring costs", "2.06": "impairment", "3.01": "delisting notice",
    "3.02": "unregistered share sale", "3.03": "shareholder rights change",
    "4.01": "auditor change", "4.02": "past financials no longer reliable",
    "5.01": "change in control", "5.02": "director or officer change",
    "5.03": "bylaws or fiscal year change", "5.07": "shareholder vote results",
    "7.01": "Regulation FD disclosure", "8.01": "other events", "9.01": "exhibits",
}
IMPORTANT_ITEMS = {"1.03", "1.05", "2.02", "2.04", "2.06", "3.01", "4.02", "5.01", "5.02"}
SEVERE_ITEMS = {"1.03", "3.01", "4.02"}        # bankruptcy, delisting, restatement -> block the day
KEYWORDS = [
    ("earnings", r"\bearnings\b|\bresults\b|\bEPS\b|\bguidance\b|\bforecast\b"),
    ("analyst", r"\bupgrade[sd]?\b|\bdowngrade[sd]?\b|price target|\boutperform\b|\bunderperform\b"),
    ("legal", r"\blawsuit\b|\bsued\b|\bprobe\b|\binvestigation\b|\bSEC charges\b|\bantitrust\b|\bjudge\b|\bcourt\b"),
    ("deal", r"\bacqui(?:re|res|red|sition)\b|\bmerger\b|\bbuyout\b|\btakeover\b|\bdeal\b"),
    ("capital", r"\bdividend\b|\bbuyback\b|\brepurchase\b|\bstock split\b|\boffering\b"),
    ("people", r"\bCEO\b|\bCFO\b|\bresign|\bsteps down\b|\bappoint"),
    ("risk", r"\brecall\b|\bbankrupt|\bdefault\b|\bdelist|\bhack|\bbreach\b|\boutage\b"),
    ("halt", r"\bhalt(?:s|ed)?\b|\btrading (?:pause|suspen)"),
    ("regulatory", r"\bFDA\b|\bapproval\b|\bapproves\b|\bclinical\b|\bFTC\b|\bDOJ\b"),
    ("macro", r"\bFed\b|\bFOMC\b|\bCPI\b|\binflation\b|\bjobs report\b|\bpayrolls\b|\btariffs?\b"),
]
MOVING_TAGS = {"earnings", "analyst", "legal", "deal", "halt", "regulatory", "risk", "people"}
SEVERE_TAGS = {"halt"}


@dataclass
class NewsItem:
    id: str
    symbols: list[str]
    headline: str
    source: str
    time: datetime
    url: str = ""
    summary: str = ""
    items_8k: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)

    @property
    def moving(self) -> bool:
        return bool(set(self.tags) & MOVING_TAGS) or bool(set(self.items_8k) & IMPORTANT_ITEMS)

    @property
    def severe(self) -> bool:
        return bool(set(self.tags) & SEVERE_TAGS) or bool(set(self.items_8k) & SEVERE_ITEMS)


def tag(item: NewsItem) -> NewsItem:
    hay = f"{item.headline} {item.summary}"
    item.tags = [label for label, rx in KEYWORDS if re.search(rx, hay, re.I)]
    if "2.02" in item.items_8k and "earnings" not in item.tags:
        item.tags.insert(0, "earnings")
    return item


def dedupe(items: list[NewsItem]) -> list[NewsItem]:
    seen: set[str] = set()
    out = []
    for it in items:
        keys = {it.id, it.url, re.sub(r"\W+", " ", it.headline.lower()).strip() + str(it.time.date())}
        if keys & seen:
            continue
        seen |= {k for k in keys if k}
        out.append(it)
    return out


# ------------------------------------------------------------------ sources
class AlpacaNews:
    def __init__(self, key: str, secret: str):
        from alpaca.data.historical.news import NewsClient
        self.client = NewsClient(key, secret)

    async def fetch(self, symbols: list[str], since: datetime, limit: int = 50) -> list[NewsItem]:
        from alpaca.data.requests import NewsRequest
        req = NewsRequest(symbols=",".join(symbols), start=since, limit=limit, exclude_contentless=False)
        res = await asyncio.to_thread(self.client.get_news, req)
        data = getattr(res, "data", res)
        rows = data.get("news", []) if isinstance(data, dict) else []
        out = []
        for n in rows:
            g = n if isinstance(n, dict) else n.model_dump()
            ts = g.get("created_at")
            ts = ts if isinstance(ts, datetime) else datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
            out.append(tag(NewsItem(f"alpaca:{g.get('id')}", [s.upper() for s in g.get("symbols") or []],
                                    g.get("headline") or "", g.get("source") or "news", ts,
                                    g.get("url") or "", g.get("summary") or "")))
        return out


class SecFilings:
    """EDGAR 8-K Atom feed per ticker (needs SEC_USER_AGENT with your contact)."""
    TICKERS = "https://www.sec.gov/files/company_tickers.json"
    FEED = ("https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=8-K"
            "&dateb=&owner=include&count=10&output=atom")

    def __init__(self, user_agent: str):
        self.h = {"User-Agent": user_agent}
        self.ciks: dict[str, str] = {}

    def _load_ciks(self) -> None:
        if not self.ciks:
            js = requests.get(self.TICKERS, headers=self.h, timeout=10).json()
            self.ciks = {v["ticker"].upper(): str(v["cik_str"]).zfill(10) for v in js.values()}

    async def fetch(self, symbols: list[str], since: datetime) -> list[NewsItem]:
        def run():
            self._load_ciks()
            out = []
            for s in symbols:
                cik = self.ciks.get(s)
                if not cik:
                    continue
                r = requests.get(self.FEED.format(cik=cik), headers=self.h, timeout=10)
                if r.status_code == 200:
                    out += [i for i in parse_sec_atom(r.text, s) if i.time >= since]
            return out
        return await asyncio.to_thread(run)


def parse_sec_atom(xml_text: str, ticker: str) -> list[NewsItem]:
    def local(t):
        return t.rsplit("}", 1)[-1]

    def text(el, name):
        for c in el.iter():
            if local(c.tag) == name:
                return (c.text or "").strip()
        return ""

    root = ET_XML.fromstring(xml_text)
    out = []
    for entry in root.iter():
        if local(entry.tag) != "entry":
            continue
        items = re.findall(r"\d+\.\d+", text(entry, "items-desc"))
        labels = [ITEMS_8K.get(i, "item " + i) for i in items if i != "9.01"]
        link = next((c.get("href", "") for c in entry.iter() if local(c.tag) == "link"), "")
        upd = text(entry, "updated")
        ts = datetime.fromisoformat(upd) if upd else datetime.now(timezone.utc)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        title = f"{ticker} filed an 8-K" + (": " + ", ".join(labels) if labels else "")
        out.append(tag(NewsItem("sec:" + text(entry, "accession-number"), [ticker], title, "SEC EDGAR",
                                ts, link, text(entry, "form-name"), items)))
    return out


# ------------------------------------------------------------------ monitor
class NewsMonitor:
    def __init__(self, sources: list, watchlist: list[str], pause_min: int = 10):
        self.sources = sources
        self.watch = set(watchlist)
        self.pause_min = pause_min
        self.seen: set[str] = set()

    @classmethod
    def from_env(cls, s) -> "NewsMonitor | None":
        srcs = []
        key, sec = os.getenv(s.feed.alpaca_key_env), os.getenv(s.feed.alpaca_secret_env)
        if key and sec and s.news.alpaca:
            srcs.append(AlpacaNews(key, sec))
        ua = os.getenv("SEC_USER_AGENT")
        if ua and s.news.sec_8k:
            srcs.append(SecFilings(ua))
        return cls(srcs, s.watchlist, s.news.pause_min) if srcs else None

    async def poll(self, since: datetime) -> list[NewsItem]:
        items: list[NewsItem] = []
        for src in self.sources:
            try:
                items += await src.fetch(sorted(self.watch), since)
            except Exception as e:  # noqa: BLE001 - news is best effort
                log.warning("news source %s failed: %s", type(src).__name__, e)
        fresh = [i for i in dedupe(sorted(items, key=lambda i: i.time)) if i.id not in self.seen]
        self.seen |= {i.id for i in fresh}
        for i in fresh:
            i.symbols = [s for s in i.symbols if s in self.watch]
        return [i for i in fresh if i.symbols]

    async def morning(self, now: datetime, hours: int = 18) -> list[NewsItem]:
        return await self.poll(now - timedelta(hours=hours))
