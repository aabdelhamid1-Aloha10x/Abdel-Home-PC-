# Options Day-Trading Toolkit

Support/resistance, No-Trading-Zone, Opening-Range-Breakout, VWAP, and breakout+retest
alerts for a fixed options watchlist (SPY, QQQ/SPX, AMD, META, NVDA, TSLA), built as a
TradingView Pine Script indicator so alerts fire in real time off TradingView's own
alert engine — not a live-polling bot.

- `tradingview/KC-Momentum-Suite.pine` — the indicator. Paste into TradingView's Pine
  Editor and add to each watchlist chart. See `docs/installation.md`.
- `docs/strategy-playbook.md` — the trading rules the indicator encodes (source:
  distilled from the Kay Capitals / @kaycapitals YouTube channel), plus the parts that
  stay manual by design, plus the risk rules.
- `docs/installation.md` — setup steps, alert configuration, what's automatic vs. manual.

## Important context

There is no TradingView account API for third parties, and no live-execution
connection here — this indicator runs inside your TradingView account, on your own
data plan, using TradingView's native alert delivery. Nothing here places trades;
every alert is a "go look at this" signal for you to execute manually per the
playbook's entry/stop/scale-out rules.
