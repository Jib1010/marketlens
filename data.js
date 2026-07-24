// data.js — MarketLens data layer (Stooq CSV edition)
// What this does:
//   1. Loads the bundled CSV files committed in /DATA (zero API calls, no key)
//   2. Parses Stooq's CSV into a clean array of daily bars, sorted oldest -> newest
// The five bundled tickers are the whole app for now.

const MLData = (() => {
  const BUNDLED_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'SPY', 'JPM'];
  const DATA_DIR = 'DATA'; // matches the folder name in the repo (capitalized)

  // Parse a Stooq daily CSV string into normalized bars.
  // Header looks like: Date,Open,High,Low,Close,Volume  (oldest row first)
  // Columns are looked up by name, so extra/reordered columns won't break it.
  function parseCSV(text) {
    const lines = String(text).trim().split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length < 2) throw new Error('CSV has no data rows');

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const iDate = header.indexOf('date');
    const iOpen = header.indexOf('open');
    const iHigh = header.indexOf('high');
    const iLow = header.indexOf('low');
    const iClose = header.indexOf('close');
    const iVol = header.indexOf('volume');
    if (iDate === -1 || iClose === -1) {
      throw new Error('Unexpected data format (no Date/Close column)');
    }

    const bars = [];
    for (let r = 1; r < lines.length; r++) {
      const c = lines[r].split(',');
      const date = (c[iDate] || '').trim();
      if (!date) continue;
      bars.push({
        date,
        open: parseFloat(c[iOpen]),
        high: parseFloat(c[iHigh]),
        low: parseFloat(c[iLow]),
        close: parseFloat(c[iClose]),
        volume: iVol === -1 ? null : parseInt(c[iVol], 10),
      });
    }
    bars.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)); // oldest -> newest
    return bars;
  }

  // Load one bundled ticker's CSV from the repo (no API call, no key).
  async function loadBundled(ticker) {
    const res = await fetch(`${DATA_DIR}/${ticker}.csv`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load ${ticker} data (${res.status})`);
    return parseCSV(await res.text());
  }

  // Main entry point the rest of the app calls.
  //   MLData.getData('AAPL') -> { ticker, source:'bundled', bars:[ {date,open,high,low,close,volume}, ... ] }
  async function getData(tickerRaw) {
    const ticker = String(tickerRaw || '').trim().toUpperCase();
    if (!ticker) throw new Error('No ticker given');
    if (!BUNDLED_TICKERS.includes(ticker)) {
      throw new Error(`${ticker} isn't a bundled ticker (${BUNDLED_TICKERS.join(', ')}).`);
    }
    return { ticker, source: 'bundled', bars: await loadBundled(ticker) };
  }

  return { BUNDLED_TICKERS, getData, parseCSV };
})();

window.MLData = MLData;

Don't worry that nothing visibly happens after you commit it — this file works behind the scenes. We'll see it come alive next session (Day 3), when we wire it into the page and draw your first actual price chart.

Commit it and tell me "done" — I'll confirm it landed, and that's Day 2 finished.


