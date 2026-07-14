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
