# KC Signals: live options signal engine

The engine watches your stocks second by second and runs the Kay Capitals
breakout-and-retest playbook (`../docs/strategy-playbook.md`). When a setup triggers,
it picks a 0–5 DTE option, applies your risk rules and pushes the trade to your phone:
**contract, entry limit, stop, targets and size**. It then manages the trade
live: **sell half at T1 and move the stop to breakeven, sell more at T2 and T3, or exit at the stop or the time limit.**

You place the orders yourself on Webull. The engine never trades.

```
live trades (SIP) ─► 1-min / 2-min / 5-min / 10-min bars ─► NTZ · ORB · VWAP · S/R levels
                                                              │
                         breakout on volume ─► quieter retest that holds = SETUP
                                                              │
   live option chain (OPRA) ─► pick contract (0–5 DTE, ~0.45 Δ, tight spread)
                                                              │
   your rules: stop 10–20% · first target ≥ 2R · size 50–100% · day limits
                                                              │
        ENTRY push ─► option quotes tick by tick ─► TRIM / STOP / BREAKEVEN / TIME EXIT pushes
```

## Your rules, and where they live (`config.yaml`)

| Your rule | Setting | Default |
|---|---|---|
| 50–100% of the account per trade | `account.allocation_pct` | 1.0 |
| Stop loss 10–20% | `min_premium_stop_pct` / `max_premium_stop_pct` | 0.10 / 0.20 |
| Risk:reward at least 1:2 | `min_risk_reward` (measured to the **first** target) | 2.0 |
| 0DTE up to a week | `options.max_dte`, `prefer_dte` | 5, 0 |
| TSLA, NVDA, MSFT, AMD… | `watchlist` | 9 names |

**How the stop is set.** The chart decides where the idea is wrong: back through the
broken line, beyond the retest candle. The engine projects what the option would be
worth at that price, using Black-Scholes at the live IV, and clamps the result into
your 10–20% band. You get stopped by **whichever hits first**: the option's stop
price or the stock trading through the line. If the chart needs more than 30% of
premium (1.5 × your max), the trade is **skipped**, because a 20% stop on that setup
would get hit by normal noise.

**How targets are set.** These are the next support/resistance levels in the trade's direction:
prior-day high/low, pre-market range, ORB, and swing levels from the last two weeks.
When no level is close, it uses 2R/3R/4R measured moves. Any target paying less than
2R on the option is dropped. If none are left, there's no trade.

**Guard rails (defaults; you can change them).** One position at a time. Max 4 trades a day.
**Two losing trades and you're done for the day.** Stop at a −35% day. At
100% allocation with a 20% stop, one full loss is about −$2,000, so two losers is about −40%.
These limits keep one bad morning from ending the account.

## Live data, the important part

The engine needs **real-time** tape and option quotes. Delayed data puts the levels and
volume filters in the wrong places (Sumesh says this on the channel too).

| Option | Stocks | Options | Cost | Notes |
|---|---|---|---|---|
| **Alpaca "Algo Trader Plus"** (recommended) | Real-time SIP stream (all exchanges) | Real-time OPRA stream | ~$99/mo | One API key covers both. You don't have to trade at Alpaca. Open a free account (paper is fine) and buy the data plan. |
| Webull OpenAPI | Real-time tick stream (MQTT) | **Not streamed**; polled about once a second | Separate "OpenAPI Advanced Quotes" plan: Nasdaq Basic + OPRA Non-display (price not published) | Data you pay for in the Webull app **does not** carry over to the API. See below. |
| Alpaca free plan | IEX only (~2–3% of volume) | Indicative/delayed | $0 | **Not good enough**: volume filters and levels will be wrong. Use it only for testing the setup. |

### Connecting Webull

Webull's official API ("OpenAPI") can supply the data, and later could place orders.
1. Apply on the Webull website for OpenAPI access (developer.webull.com → *Getting Started*).
   Review usually takes 1–2 business days.
2. Once approved, create an **App Key and App Secret** at webull.com → *OpenAPI Management → App
   Management*. If 2FA is on, the first run asks you to approve in the Webull app.
3. Buy real-time API data: log in at webullapp.com/quote → avatar → *Advanced Quotes* →
   **OpenAPI Advanced Quotes** → *Nasdaq Basic* (stocks) and *OPRA Real-Time Non-display*
   (options).
4. `pip install webull-openapi-python-sdk`, put the keys in `.env`, set
   `feed.provider: webull`, and run `python -m kcsignals probe-webull` once. The Webull
   feed is written against SDK v3.1.2 but **hasn't run against a live account yet**. The probe
   prints the raw responses so field names can be confirmed before you rely on it.

**My recommendation:** use Alpaca for data and keep charting and placing orders on Webull. Option
quotes stream live from Alpaca but not from Webull, and that's what the second-by-second exits need.

## Setup (on your own Mac or PC; it must be on during market hours)

```bash
cd signal-engine
python3 -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp config.example.yaml config.yaml                       # edit watchlist / rules
cp .env.example .env                                     # add your keys
set -a; source .env; set +a                              # Windows: set each variable

python -m kcsignals demo            # 10-second offline demo, no keys needed
python -m pytest -q                 # 11 tests
python -m kcsignals probe-alpaca    # checks keys + that option quotes are ~0-2s old
python -m kcsignals run             # live; open http://localhost:8787
```

**Phone alerts.** Install the free **ntfy** app, subscribe to a long random topic name
(for example `abdel-kc-8f3k2q9x`), and put that name in `NTFY_TOPIC`. ENTRY and STOP arrive as
urgent pushes. Discord and Telegram also work (see `.env.example`).

Start it before **9:00 ET**. It loads two weeks of 1-minute bars for the levels and
builds the pre-market range live.

## What an alert looks like

```
ENTRY NVDA
BUY 126x NVDA 11/24 182.5C [NVDA261124C00182500] limit 0.79 (bid 0.77/ask 0.79, Δ 0.47)
Setup: NTZ_BREAK_RETEST @ 182.08 on 2m; stock 182.2
STOP: option 0.64 (-19%) or stock through 181.99
TARGETS: 1.17 (stock 183.04) / 1.45 (stock 183.47) / 1.74 (stock 183.89)  (R:R 2.5 to T1)
Size: $9,954 in, max loss ≈ $1,890. Plan: sell half at T1, stop to breakeven.

TRIM NVDA
TARGET 1 hit (~1.12, underlying 183.04): SELL 63 of 126 ... Move stop on the rest to BREAKEVEN 0.79.
```

That alert is from `python -m kcsignals demo`, a synthetic, textbook breakout day.
It shows the mechanics. **It is not evidence the strategy makes money.**

## What's verified and what isn't

- ✅ The strategy, contract picker, risk sizing, scale-out and stop logic all pass 11 tests,
  including a failed breakout that stops out and both call and put days.
- ⚠️ The Alpaca and Webull live feeds are written against the real SDKs (alpaca-py 0.45,
  Webull SDK 3.1.2) but **haven't streamed a live session yet**. Run the probes first.
- ⚠️ Replays price options with Black-Scholes at a fixed IV. Real fills on fast 0DTE
  moves are worse, especially stops.
- ⚠️ The engine assumes you took every ENTRY so its day-loss guard stays conservative.
  If you skip one, restart it or raise the limits.

## Before real money: paper-trade it for 2–4 weeks

Run it live and take every signal in Webull's **paper trading** account, or just log them.
`signals.jsonl` records every entry and exit. After 20 or more trades, check the win rate,
the average R, and whether real fills match the alerts. Only then trade it with money, and
start with `allocation_pct: 0.5`.
