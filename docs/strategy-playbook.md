# Options Day-Trading Playbook

Distilled from the Kay Capitals / Sumesh YouTube channel (@kaycapitals) and adapted
for a $17k account trading SPY, QQQ/SPX, AMD, META, NVDA, TSLA. This is the rules
document the `KC-Momentum-Suite.pine` indicator encodes mechanically wherever it can,
and flags as a manual judgment call wherever it can't.

**Source honesty check:** this method is reconstructed from a creator whose channel is
also a funnel for a paid mentorship, and his P&L figures are self-reported, not audited.
The mechanics below (breakout+retest, no-trading-zone, volume-confirmed retests, scale
out with breakeven stops) are standard, sound price-action structure independent of his
specific claims — that's the part worth trusting. Treat "$450k/month" style titles as
marketing, not a track record.

## 1. Pre-market routine (do this ~30-60 min before the open)

1. Hourly chart, **Extended Trading Hours ON** (Settings → Symbol → Session). Confirm
   your data feed isn't the free delayed feed — Sumesh calls this out directly: delayed
   data draws wicks that don't exist and puts your levels in the wrong place. If you see
   two small red dots/lines on the price scale, your data is delayed; get the
   ARCA/NYSE/NASDAQ real-time bundle.
2. Mark support/resistance from the **last 1-2 weeks only** — not old levels. Fastest
   method: switch to a line chart, mark every bend (3-4 up, 3-4 down), switch back to
   candles, and nudge each line until it touches the most wicks/bodies.
3. Mark the **NTZ (No-Trading-Zone)**: a box from `max(yesterday's high, pre-market
   high)` down to `min(yesterday's low, pre-market low)`.
4. Note the **ORB** will be the first 15 minutes of regular-session price action —
   nothing to mark yet, it forms at 9:30.
5. Check only market-moving news: CPI, FOMC, PMI, non-farm payrolls, or earnings from
   the mega-caps you actually trade (Apple/Nvidia/Tesla-tier). Ignore stray analyst
   commentary. Set phone alarms 2 minutes before any scheduled release.

## 2. Timeframes used intraday

| Time (ET)      | Chart          |
|----------------|----------------|
| 9:30 – 10:00   | 2-minute       |
| 10:00 – 11:00  | 5-minute       |
| 11:00 onward   | 10-minute      |
| Anytime        | 30-second — **only to time adding to an already-working trade, never for initial entries** |

Avoid new entries 3:00-4:00pm. Power hour (last hour) is when "smart money" closes
the market and Sumesh personally avoids new entries there.

**Conflict with your own habit:** you trade the last hour of the day; Sumesh's stated
rule avoids it. The indicator shades power hour in red as a caution zone, not a hard
block — decide deliberately whether you're overriding the rule there, not by default.

## 3. The 90-Minute Rule

Only hunt **new** entries 9:30-11:00am ET — this is the highest-volume, highest-follow-
through window. If nothing clean has triggered by 11:00, stop looking for new setups
(you can still manage/hold a runner that's already on). After 90 minutes, chop
increases and most of what looks like a setup is a trap.

## 4. Entry logic — breakout + retest (three equivalent flavors)

Never enter on the initial breakout. Wait for:

1. Price closes decisively outside the NTZ / ORB / a marked S&R level.
2. **Volume filter**: that breakout candle's volume should be visibly above average.
3. Price pulls back to retest that same line.
4. **The retest pullback shows LOWER volume than the breakout candle** → continuation,
   entry in the breakout direction. If the retest shows HIGHER volume than the
   breakout → treat it as a fakeout/trap; consider the reversal instead.

Confluence that raises confidence (stack these, don't require all of them):
- VWAP: use `HLC/3` source, no bands. "Advanced VWAP" setup = a candle closes back
  above/below VWAP after being on the other side, then retests VWAP and holds.
- 200 SMA on the 5-minute and/or 60-minute chart as dynamic support/resistance.
- Fibonacci 0.236 / 0.382 (not 0.618) drawn from the swing start to the pullback —
  strong moves barely retrace; if it's giving back past 0.5, skip it.
- "Picasso" trendlines during chop: draw a line, require **3 touches minimum** before
  it counts, then trade the break-and-retest of that line.

## 5. Execution — the scale-out plan (matches your bell-curve method)

1. Enter full size once (e.g., 10 contracts).
2. At the first target/level: **sell ~50%**, move stop on the remainder to **breakeven**.
3. If price comes back and retests that same level again, you can re-add the size you
   sold — risk-free, since the stop on the core position is already breakeven.
4. Repeat: sell another ~50% of what's left at each subsequent level.
5. Let a small final runner ride with a breakeven stop.
6. Timing *adds* to an already-working trade: drop to a 30-second chart and look for
   small flag pull-ins — this is for sizing up a winner, never for a fresh entry.
7. Stop loss on the original at-risk contracts sits on the other side of whatever
   structure triggered the entry (NTZ/ORB/level/trendline). Never widen a stop. If it
   hits, take the loss and move on — no revenge trades.

## 6. Watchlist

SPY, QQQ / SPX, AMD, META, NVDA, TSLA. Avoid trading names outside this list on
instinct — Sumesh is explicit that trading unfamiliar tickers (in his case PLTR) is
where his own worst trades come from.

## 7. Risk rules (non-negotiable regardless of how good the setup looks)

- Decide your **max loss for the day** before the open, in dollars, as a fixed
  percentage of the $17k account — not a "we'll see" number. A stated day-stop is the
  difference between a bad day and an account-ending day.
- Take 3-5 clean setups a day, not "trade all day." No trade in the NTZ, period.
- Don't change the rules mid-trade (don't widen a stop, don't keep counting losses
  past a preset limit and trade anyway).
- Trade the chart, not the P&L number — cover the unrealized P&L display if it's
  making you second-guess a still-valid setup.
- On an easy/trending day, size up within your risk plan. On a choppy/hard day, size
  down or sit out — most account blowups happen from forcing size on a bad day, not a
  good one.

## 8. Reality check on account growth expectations

Compounding 30-50%/day is not a sustainable target — mechanically, it turns $17k into
seven figures within weeks, which is not what happens to real accounts trading real
size over time. Use this system to find good, disciplined setups and manage risk well;
don't treat a daily-percent target as a rule you trade around, or it will pressure you
into oversizing on marginal setups. The day-stop in section 7 matters more than any
upside target.

## 9. LTP system from the free course video (youtu.be/0Kq61FY6PTY)

Added after reading the full transcript of his ~3-hour free course. These rules are
now encoded in `signal-engine/`. Where they differ from sections above, the video wins
for the engine's defaults.

- **Tickers:** blue chips + SPY/QQQ only (AAPL, NVDA, TSLA, AMD, AMZN, META, MSFT). No small caps.
- **Contract:** at the money. Nearest expiry.
- **Indicators:** volume with a 5-period MA, EMA 8 + EMA 21, SMA 200 (+ SMA 400 on the
  5-min), VWAP (HLC/3, no bands), 15-min ORB, daily open, Fib 0.236 / 0.382.
- **Levels:** 60-min chart, extended hours ON. Line-chart bends → candles → adjust to wicks,
  delete levels that are too close. Pre-market high/low, yesterday's high/low, hourly 200
  SMA, then 3 levels above the PM high and 3 below the PM low. Redraw daily; add intraday
  rejection levels.
- **Time:** no trades in the first 15 minutes (price discovery). 2-min chart 9:30–10:00,
  **5-min all day**, 10-min after 11:00. If you're green by 11:00, call it a day.
- **First 2-min candle:** if it breaks the PM high or low, that ticker is the priority.
- **Breakout volume** must beat the volume before it. A break on normal volume is a trap.
- **Setups:** (a) Fib pullback with confluence: after the first counter-trend candle, Fib
  from where the trend started to the extreme; enter in 0.236–0.382 where it lines up with
  EMA 8, VWAP, a level, ORB or the 200/400 SMA. A touch of 0.5 = skip until a new high.
  (b) Level flag: a flag on top of a key level, enter on the flag break. (c) ORB failure
  after a pullback. Never chase the breakout candle.
- **Stop:** the other side of the Fib / the trigger candle's low (≈20% of premium).
- **Exits:** targets are levels (hourly levels first, then indicators like the 200 SMA).
  Sell 50% at T1 and stop to breakeven, sell 50% of the rest (round up) at T2, let runners ride.
- **Adds:** add on each new Fib retest of a working trade ("additions is where the money is made").
- **Sizing (bell curve):** small first trade ($400–600 on $10k), size up after a win, down
  after a loss, max position ≈ $2k until the account reaches $20k. **3 losses in a row = done.**
- **R:R:** win at least twice what you risk.
- His win-rate and monthly P&L numbers are self-reported; treat them as marketing.
