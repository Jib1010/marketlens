# MarketLens

A browser-only stock analysis and backtesting tool — built from scratch with plain HTML/CSS/JS, no frameworks or build step.

**Live site:** https://jib1010.github.io/marketlens/

## What it does

MarketLens lets you explore historical price data for 5 stocks (AAPL, MSFT, NVDA, SPY, JPM), overlay technical indicators, and backtest four different trading strategies against 20+ years of daily data.

- **Chart tab** — interactive price + volume chart with 1M/6M/1Y/5Y timeframes
- **Indicators tab** — RSI, MACD, and Bollinger Bands, all implemented from scratch (no indicator library), validated against TradingView
- **Backtest tab** — run any of 4 strategies against full price history and see total return, Sharpe ratio, max drawdown, win rate, and an equity curve
- **Watchlist tab** — save tickers you're tracking, persisted in your browser via localStorage

## Strategies implemented

1. **Moving Average Crossover** (50/200) — classic golden cross / death cross
2. **RSI Oversold/Overbought** (30/70) — mean-reversion on momentum extremes
3. **MACD Signal Line Cross** — trend-following on momentum shifts
4. **Bollinger Band Mean Reversion** — buy dips below the lower band, sell back at the mean

Every backtest executes trades on the **next day's open**, never the same-day close the signal came from — this avoids look-ahead bias, a common mistake in naive backtests. Each trade also includes a 0.1% transaction cost.

## Tech stack

- Plain HTML/CSS/JavaScript — no framework, no build step
- [Chart.js](https://www.chartjs.org/) for all charting
- Data sourced from [Stooq](https://stooq.com/) (20+ years of free daily OHLCV data), bundled directly into the repo as CSVs
- Deployed on GitHub Pages, built entirely in the GitHub web editor (no local dev environment)

## What I learned

- How to implement RSI, MACD, and Bollinger Bands from the underlying math, not a library — and how to validate them against a real trading platform (TradingView)
- Why look-ahead bias is such a common and serious mistake in backtesting, and how to structure a simulation loop to avoid it
- The tradeoffs behind Sharpe ratio, max drawdown, and win rate as ways to evaluate a strategy beyond raw return
- Debugging real-world caching issues (GitHub Pages CDN + browser cache) that can make a correct code change look broken
