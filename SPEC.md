MarketLens — SPEC

A browser-only stock analysis web app. Plain HTML/CSS/JS, no framework, no build step. Deployed on GitHub Pages. Works fully offline for five bundled tickers; optional live lookup for others via Alpha Vantage.

Live URL: https://jib1010.github.io/marketlens/

Goal

A deployed, working stock analysis dashboard with a public URL, a clean README, and a 60-second walkthrough. MVP shipped before the July 30 trip; August is polish.

Constraints (locked — do not relitigate mid-build)
Plain HTML/CSS/JS. No framework, no bundler, no npm, no build step.
Every file is hand-editable or uploadable in the GitHub web editor.
The live URL is the only preview — deploy after every session or you're building blind.
Bundled data first; the live API is a bonus, never a dependency.
Charts: Chart.js from CDN (line + volume bars). Candlesticks are a stretch goal.
Data
Source: Alpha Vantage TIME_SERIES_DAILY, outputsize=full (20+ years per call). Free tier: 25 requests/day, 5/min.
Bundled tickers (committed as static JSON, zero API calls): AAPL, MSFT, NVDA, SPY, JPM.
API key lives in localStorage only (entered in a Settings field) — never committed to the repo.
Rate-limit trap: Alpha Vantage returns HTTP 200 with a JSON Note/Information message when throttled, and an Error Message for a bad symbol. Code must detect these and fail cleanly, never treat them as price data.
Raw shape (Alpha Vantage)
json
{
  "Meta Data": { "2. Symbol": "AAPL", "3. Last Refreshed": "2026-07-23" },
  "Time Series (Daily)": {
    "2026-07-23": { "1. open": "...", "2. high": "...", "3. low": "...", "4. close": "...", "5. volume": "..." }
  }
}
Normalized shape (what the app uses)

data.js converts the above into an array sorted oldest → newest:

js
[
  { date: "2005-01-03", open: 1.15, high: 1.16, low: 1.11, close: 1.13, volume: 691366000 }
]
Tabs (five)
Overview — ticker selector, latest price, day change, 52-week high/low, quick stats.
Chart — Chart.js line chart of close + volume bars; timeframe toggles (1M / 6M / 1Y / 5Y) that slice the already-loaded array (no new API calls).
Indicators — RSI (14), MACD (12/26/9), Bollinger Bands (20, 2σ), all computed from scratch, overlaid on the chart via toggles.
Backtest — pick a strategy, simulate over history, show the equity curve vs buy-and-hold. Strategies: MA crossover, RSI oversold/overbought, MACD signal cross, Bollinger mean reversion. Metrics: total return, Sharpe ratio, max drawdown, win rate.
Watchlist — add/remove tickers, persisted in localStorage.
File structure
marketlens/
├── index.html        # single page, five tabs
├── styles.css        # styling
├── data.js           # data layer (contract below) — Day 2
├── indicators.js     # RSI / MACD / Bollinger — Day 4
├── backtest.js       # engine + strategies + metrics — Days 5–6
├── app.js            # UI wiring, tabs, charts, watchlist
├── data/
│   └── AAPL.json  MSFT.json  NVDA.json  SPY.json  JPM.json
├── SPEC.md
└── README.md
data.js contract
MLData.BUNDLED_TICKERS → ['AAPL','MSFT','NVDA','SPY','JPM']
MLData.getData(ticker, { live }) → { ticker, source, bars }, where bars is the normalized array. Bundled tickers load instantly with no key; others check the localStorage cache, then do a live fetch if live is true and a key is set.
MLData.setApiKey(key) / MLData.getApiKey() — key stored in localStorage, never in the repo.
Live fetches cached in localStorage for 24h.
Roadmap

Day 2 data layer · Day 3 chart · Day 4 indicators · Days 5–6 backtest · Days 7–8 dashboard + watchlist · then edge cases, README, deploy polish.

Content
