// data.js — MarketLens data layer (Stooq CSV edition)
const MLData = (() => {
  const BUNDLED_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'SPY', 'JPM'];
  const DATA_DIR = 'DATA';

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
    bars.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return bars;
  }

  async function loadBundled(ticker) {
    const res = await fetch(`${DATA_DIR}/${ticker}.csv`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load ${ticker} data (${res.status})`);
    return parseCSV(await res.text());
  }

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

