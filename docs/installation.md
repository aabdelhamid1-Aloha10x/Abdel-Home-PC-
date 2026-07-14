# Setup: KC Momentum Suite on TradingView

There is no API connection between this repo/Claude and your TradingView account —
none exists for third parties. This script runs entirely inside your own TradingView
account; you install it once per chart and it re-arms itself every trading day.

## Install (one-time per ticker)

1. Open TradingView, open a chart for the first ticker (e.g. SPY).
2. Chart Settings → Symbol → Session → set to **Extended Trading Hours**. Do this for
   every ticker you add the indicator to — the NTZ/pre-market levels need it.
3. Confirm your data plan is real-time/extended-hours for that exchange (NYSE/NASDAQ/
   ARCA), not the free delayed feed. TradingView will show two small marks on the
   price axis if the feed is delayed.
4. Open Pine Editor (bottom toolbar) → New blank script → delete the placeholder →
   paste in the full contents of `tradingview/KC-Momentum-Suite.pine` → **Save** →
   **Add to Chart**.
5. Repeat step 4 for QQQ (or SPX), AMD, META, NVDA, TSLA — Pine indicators attach per
   chart/symbol, so add the same script to each ticker's chart (or each tab in a
   multi-chart layout).

## Turn on real-time alerts

For each ticker's chart:

1. Right-click the chart → **Add Alert**.
2. Under "Condition," pick the indicator (`KC Momentum Suite...`) and choose one of
   the eleven built-in conditions (e.g. "NTZ Retest Entry — LONG/CALLS").
3. Set "Alert actions" to however you want to be notified — push notification to the
   TradingView mobile app is the closest thing to your requested "instant alert."
4. Repeat for the conditions you care about, per ticker. You can set them all to
   "Once Per Bar Close" so you're not pinged mid-candle on noise.

If you want alerts routed somewhere other than the TradingView app (Discord, SMS, a
spreadsheet), TradingView Premium+ plans support a webhook URL per alert — that's the
one outbound automation channel TradingView actually exposes. Tell me if you want help
setting up a receiving endpoint for that; it's a separate piece of infrastructure, not
something this script needs.

## What updates automatically vs. what you still do by hand

Automatic, every session, no daily setup:
- NTZ box, ORB lines, VWAP, both SMAs, the eleven alert conditions, the status table.

Still manual, by design (Sumesh's own method is subjective here, and so is the
approximation this script uses):
- The auto pivot lines (dashed red/green) are a mechanical stand-in for his hand-drawn
  levels — refine them by eye in your 30-second pre-market pass per the playbook.
  Don't treat the auto lines as equal-confidence to a level you drew yourself.
- News calendar check and the day's max-loss decision (section 7/8 of the playbook)
  aren't things a chart script can do for you.

## First-run check

Pine Script here was written without a live TradingView compiler to test against. Add
it to a chart and check the small error indicator next to Save. If it flags a syntax
error, paste the exact message back and I'll fix it — Pine's compiler is picky about
things like this and a first-pass script sometimes needs one correction round.
