"""Contract selection and option-price projection (Black-Scholes)."""
from __future__ import annotations

import math
from datetime import date, datetime, time

from .config import OptionsCfg
from .models import OptionQuote, Side
from .timeutil import ET, et_date, to_et

RATE = 0.04


def _ncdf(x: float) -> float:
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def _npdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / math.sqrt(2 * math.pi)


def years_to_expiry(expiry: date, now: datetime) -> float:
    close = datetime.combine(expiry, time(16, 0), tzinfo=ET)
    secs = max((close - to_et(now)).total_seconds(), 60.0)
    return secs / (365 * 24 * 3600)


def bs_price(side: Side, s: float, k: float, t: float, iv: float) -> float:
    if t <= 0 or iv <= 0:
        return max(0.0, s - k) if side is Side.CALL else max(0.0, k - s)
    d1 = (math.log(s / k) + (RATE + 0.5 * iv * iv) * t) / (iv * math.sqrt(t))
    d2 = d1 - iv * math.sqrt(t)
    if side is Side.CALL:
        return s * _ncdf(d1) - k * math.exp(-RATE * t) * _ncdf(d2)
    return k * math.exp(-RATE * t) * _ncdf(-d2) - s * _ncdf(-d1)


def bs_greeks(side: Side, s: float, k: float, t: float, iv: float) -> tuple[float, float]:
    """(delta, gamma)"""
    d1 = (math.log(s / k) + (RATE + 0.5 * iv * iv) * t) / (iv * math.sqrt(t))
    delta = _ncdf(d1) if side is Side.CALL else _ncdf(d1) - 1
    gamma = _npdf(d1) / (s * iv * math.sqrt(t))
    return delta, gamma


def implied_vol(side: Side, price: float, s: float, k: float, t: float) -> float | None:
    lo, hi = 0.01, 5.0
    if price <= bs_price(side, s, k, t, lo) or price >= bs_price(side, s, k, t, hi):
        return None
    for _ in range(60):
        mid = (lo + hi) / 2
        if bs_price(side, s, k, t, mid) > price:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def fill_greeks(q: OptionQuote, spot: float, now: datetime) -> OptionQuote:
    """Fill delta/gamma/iv from the mid price when the feed didn't supply them."""
    t = years_to_expiry(q.expiry, now)
    if q.iv is None and q.mid > 0:
        q.iv = implied_vol(q.side, q.mid, spot, q.strike, t)
    if q.iv and (q.delta is None or q.gamma is None):
        q.delta, q.gamma = bs_greeks(q.side, spot, q.strike, t, q.iv)
    return q


def project_premium(q: OptionQuote, spot_now: float, spot_then: float, now: datetime, premium_now: float) -> float:
    """Estimate the option's mid if the underlying moves to spot_then shortly (same IV)."""
    t = years_to_expiry(q.expiry, now)
    if q.iv:
        model_now = bs_price(q.side, spot_now, q.strike, t, q.iv)
        model_then = bs_price(q.side, spot_then, q.strike, t, q.iv)
        return max(0.01, premium_now + (model_then - model_now))
    d = spot_then - spot_now
    delta = q.delta or (0.5 if q.side is Side.CALL else -0.5)
    gamma = q.gamma or 0.0
    return max(0.01, premium_now + delta * d + 0.5 * gamma * d * d)


def select_contract(chain: list[OptionQuote], side: Side, spot: float, now: datetime,
                    cfg: OptionsCfg) -> tuple[OptionQuote | None, list[str]]:
    """Nearest allowed expiry, delta closest to target, liquid, tight spread."""
    today = et_date(now)
    why: list[str] = []
    cands = [q for q in chain if q.side is side and 0 <= (q.expiry - today).days <= cfg.max_dte
             and q.bid > 0 and q.ask > 0]
    if not cands:
        return None, ["no quoted contracts within max DTE"]
    expiries = sorted({q.expiry for q in cands})
    preferred = [e for e in expiries if (e - today).days >= cfg.prefer_dte] or expiries
    for exp in preferred:
        pool = [fill_greeks(q, spot, now) for q in cands if q.expiry == exp]
        ok = []
        for q in pool:
            if q.delta is None:
                continue
            ad = abs(q.delta)
            if not (cfg.min_delta <= ad <= cfg.max_delta):
                continue
            if q.spread_pct > cfg.max_spread_pct:
                continue
            known = q.open_interest >= 0 or q.volume >= 0   # -1 = feed doesn't report it
            if known and q.open_interest < cfg.min_open_interest and q.volume < cfg.min_volume:
                continue
            if q.mid > cfg.max_premium:
                continue
            ok.append(q)
        if ok:
            return min(ok, key=lambda q: abs(abs(q.delta) - cfg.target_delta)), why
        why.append(f"{exp}: nothing passed delta/spread/liquidity/premium filters")
    return None, why
