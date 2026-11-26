# KC Signals: live options signal engine (Kay Capitals method)

This app wakes up at **9:00 ET every trading day** and pulls the pre-market from Alpaca.
It draws the day's levels and watches your stocks second by second with real-time data. When a setup
from the Kay Capitals playbook triggers, it gives you the **contract, entry, stop, targets and size**.
It then manages the trade live: trims, adds, breakeven stops and exits. Signals reach you
three ways: phone push, terminal, and a **local dashboard with live charts**.

You choose who places the orders:
| `execution.mode` | What happens |
|---|---|
| `off` (default) | Signals only. You place trades yourself on **Webull**. |
| `paper` | The engine places every entry, trim, add and exit in your **Alpaca paper account**. |
| `live` | Same, with **real money** in your Alpaca account. It won't start unless you also set `KC_LIVE_TRADING=I_UNDERSTAND`. |

## The rules it trades (from the Kay Capitals videos)

**Levels, redrawn every morning**
- Hourly chart with extended hours: 3 levels above the pre-market high and 3 below the pre-market low.
- Pre-market high and low, yesterday's high and low, today's open, and the hourly 200 SMA.
- **NTZ** (No Trading Zone): yesterday's range combined with the pre-market range.
- **ORB**: the first 15 minutes.
- Intraday rejection levels.

**Indicators**
- VWAP using HLC/3.
- EMA 8 and EMA 21.
- SMA 200 and SMA 400.
- 5-period volume average.

**Timing**
- No trades in the first 15 minutes, and none inside the NTZ.
- New entries from 9:45 to 11:00.
- 2-minute chart until 10:00, 5-minute chart all day, 10-minute chart after 11:00.
- If you're green at 11:00, you're done for the day.

**Entries**
1. **Break and retest** of the NTZ, ORB, VWAP or a key level. The break needs above-average volume. The retest has to come back to the line, hold, and trade lighter volume than the break. Never chase the breakout candle.
2. **Fib pullback**, the main LTP setup: in a trend (EMA 8 above EMA 21 and price on the right side of VWAP), price pulls back into 0.236–0.382 of the leg. A green "patience" candle closes back in trend, and the zone lines up with EMA 8, VWAP, a level or the 200/400 SMA. A touch of 0.5 cancels it until a new high.
3. **Level flag**: a tight flag sitting on a level, then a break on volume.

**Contract**: at the money (about 0.50 delta), 0–5 days to expiry, nearest expiry first.

**Exits**
- **Stop**: the stock breaks back through the line, or the option falls 10–20%, whichever comes first.
- **Targets**: levels only, and the first one must be at least 2× the risk.
- Sell half at T1, rounded up, and move the stop to breakeven.
- Sell half of what's left at T2. The runner's stop then moves up to the T1 price.
- **Adds**: once the stop is at breakeven, a new setup in the same direction re-buys what you sold. The stop then moves so the whole trade can't go red.

**Sizing (his "bell curve")**
- First trade of the day is $500, which is 5% of $10k.
- Move up a step after a win and down a step after a loss: $500, $1,000, $1,500, $2,000.
- The cap is $2,000 until the account reaches $20,000. Then every step doubles.
- **3 losses in a row means you're done for the day.**

**Chop filter**: after 2 failed ORB breaks, that stock is benched for the day.

All of these settings are in `config.yaml`.

## Automatic news, earnings and economic-calendar protection

At 9:00 ET the engine prints and pushes the day's restrictions. They also show in the dashboard's
**Today** panel. To see them any time, run `python -m kcsignals today`.
- **Economic calendar** (Nasdaq, free): CPI, PPI, jobs, GDP, ISM, retail sales, Fed-chair
  speeches and FOMC.
  - Any release during market hours blocks new entries from **5 minutes before to 30 minutes after**.
  - FOMC blocks 13:55–15:00, which covers the 14:00 statement and the 14:30 press conference.
  - 8:30 releases are flagged as "expect a volatile open".
- **Earnings** (Nasdaq, free):
  - If a report falls inside the option's life, only contracts that **expire before the report** are allowed. This avoids the overnight IV crush and usually means 0DTE.
  - On the **day after** a report, size is cut in half. You can set this to `block` instead.
- **Company news** (Alpaca's real-time feed, same keys as the data; SEC 8-K filings too if you set `SEC_USER_AGENT`):
  - Each headline is tagged: earnings, analyst, legal, deal, halt, and so on.
  - A fresh market-moving headline **pauses new entries on that stock for 10 minutes** and is pushed to you.
  - A halt, bankruptcy, delisting or restated-financials filing **blocks the stock for the day**.

## Backtest on real history

```bash
python -m kcsignals backtest                       # last 60 sessions, whole watchlist
python -m kcsignals backtest --days 120 --symbols TSLA NVDA
python -m kcsignals backtest --from 2026-09-01 --to 2026-11-25 --with-calendar
```
This replays real Alpaca 1-minute bars (cached in `.cache/`) through **the same engine**, with the same
levels, setups, sizing and exits. Options are priced at the stock's recent realized volatility.
- It writes `backtest_report.md`, with win rate, average R, how often T1 hit before the stop, and P&L per setup and per stock.
- It writes `backtest_trades.csv` with every trade.
- It writes `backtest_stats.json`. After that, **every live alert quotes its setup's history**, for example
  `backtest FIB_PULLBACK on TSLA: 23 trades, 57% win, avg +0.41R, T1 before stop 61%`.

Option prices in the backtest are modeled, not historical quotes. Treat it as a test of the *setups*. Real 0DTE fills, especially on stops, are worse.

## Live data: Alpaca

Buy Alpaca's **"Algo Trader Plus"** market-data plan, about $99/month. It gives you **SIP** (every US
exchange, real time) for stocks and **OPRA** (real time) for options.
1. Sign up at alpaca.markets. The paper account is free, and you don't need to fund anything to get data.
2. Subscribe to Algo Trader Plus, then create API keys under **Live → API Keys**.
3. For `paper` mode, also create keys in the **Paper** dashboard. Paper accounts have their own keys.

The free plan is IEX-only, which is about 2–3% of volume, with delayed options. Volume filters and levels come out wrong on it, so don't use it for real signals.

## Install (Mac or Windows; the computer must be on and awake on trading days)

```bash
cd signal-engine
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp config.example.yaml config.yaml # Windows: copy config.example.yaml config.yaml
cp .env.example .env               # put your Alpaca keys + ntfy topic in .env

python -m kcsignals demo           # offline demo day + charts at http://localhost:8787
python -m pytest -q                # 30 tests
python -m kcsignals probe-alpaca   # checks keys, real-time data, hourly history (and your account if mode != off)
```

**Run it every day automatically**
- Any OS: `python -m kcsignals daemon`. Leave it running. It sleeps until 9:00 ET, runs through
  the close, then sleeps until the next trading day. It reads Alpaca's market calendar, so holidays and half days are handled.
- **Mac auto-start at login**: edit the path in `scripts/com.kcsignals.daemon.plist`, then
  `cp scripts/com.kcsignals.daemon.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.kcsignals.daemon.plist`.
  Logs go to `/tmp/kcsignals.log`.
- **Windows auto-start**: Task Scheduler → *Create Basic Task* → trigger *When I log on* →
  action: start `scripts\start-daemon.bat`.
- Starting the engine now instead of waiting for 9:00: `python -m kcsignals run`.

**Dashboard**: open **http://localhost:8787**. Choose a stock and a timeframe (1m/2m/5m/10m). You get
candles with VWAP, EMA 8/21, SMA 200, the NTZ, ORB, PM/PD high and low, hourly levels, and every
entry, add and exit marker. The page also shows the open position and a live feed of signals.

**Phone alerts**: install the free **ntfy** app, subscribe to a long random topic name, and put it in
`NTFY_TOPIC`. Discord and Telegram also work.

## What an alert looks like (from the demo)

```
ENTRY NVDA
BUY 6x NVDA 11/24 182.5C [NVDA261124C00182500] limit 0.79 (bid 0.77/ask 0.79, Δ 0.47)
Setup: NTZ_BREAK_RETEST @ 182.08; stock 182.2
STOP: option 0.64 (-19%) or stock through 181.99
TARGETS: 1.74 (stock 183.88)  (R:R 6.3 to T1)
Size: $474, max loss ≈ $90. Sell half at T1, stop to breakeven.

TRIM NVDA   TARGET 1 hit (~1.68, stock 183.88): SELL 3 of 6 ...; stop on the rest to BREAKEVEN 0.79.
ADD NVDA    ADD 3x ... at ~2.94 (FIB_PULLBACK @ 185.74). Now 6 contracts, stop 1.42 (whole trade stays green at worst).
```

The demo is a synthetic, textbook day. It shows the mechanics. **It is not evidence the strategy makes money.**

## Auto-trading safeguards (paper/live)
- Entries are limit orders at the signal price + $0.05. If an order doesn't fill within 10 seconds, it's cancelled and the signal is dropped.
- Exits are market orders, and the engine never sells more contracts than the account holds.
- `max_order_dollars` (default $4,000) hard-caps any single order, whatever the sizing says.
- On startup it prints your Alpaca equity, options level (you need level 2+), PDT flag and any open option positions.
- If a sell fails, you get a push that says **CLOSE IT MANUALLY**.

## Verified vs. not yet
- ✅ 30 tests pass. They include real Nasdaq calendar samples (jobs report, earnings), automatic FOMC blackouts, the earnings expiry limit and half size, news pauses and blocks, and a backtest replay with stats quoted in alerts. They cover call and put days, a failed breakout that stops out, a Fib pullback with an add, bell-curve sizing, 3 losses in a row ending the day, news blackouts, the first 15 minutes being blocked, the paper executor mirroring every buy and sell, unfilled entries being voided, and the chart data.
- ⚠️ The Alpaca data feed and order executor are written against alpaca-py 0.45 but **haven't run against a live market or a real account yet**. Run `probe-alpaca` first, then a paper week.
- ⚠️ Replays price options with Black-Scholes. Real fills on fast 0DTE moves are worse, especially on stops.
- ⚠️ Some of his rules are discretionary (trend reading, "the stock's nature that day", trendlines). The engine encodes the mechanical parts only.

## Recommended path
1. `demo` → `probe-alpaca` → run the daemon in `off` mode for a week and watch the signals against your Webull charts.
2. Switch to `paper` for 2–4 weeks. Review `signals.jsonl`: win rate, average R, and whether fills match the alerts.
3. Only then consider `live`, or keep taking the signals by hand on Webull.

The Webull data feed (`feeds/webull.py`) still exists as an alternative. It's not needed with Alpaca.
