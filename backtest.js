// Core backtest engine: takes bars + a signal array, simulates trades
// signals[i] = 'BUY', 'SELL', or null for each bar i
// Execution happens on the NEXT bar's open (no look-ahead bias)
function runBacktest(bars, signals, startingCash = 10000, txCostPct = 0.001) {
  let cash = startingCash;
  let shares = 0;
  let position = false; // true if currently holding
  const trades = [];
  const equityCurve = [];

  for (let i = 0; i < bars.length; i++) {
    // Mark equity at today's close (using current holdings)
    const equityToday = cash + shares * bars[i].close;
    equityCurve.push({ date: bars[i].date, equity: equityToday });

    // Check yesterday's signal, execute at TODAY's open
    if (i === 0) continue;
    const signal = signals[i - 1];

    if (signal === 'BUY' && !position) {
      const execPrice = bars[i].open;
      const cost = execPrice * (1 + txCostPct);
      shares = cash / cost;
      cash = 0;
      position = true;
      trades.push({ date: bars[i].date, type: 'BUY', price: execPrice, shares: shares });
    } else if (signal === 'SELL' && position) {
      const execPrice = bars[i].open;
      const proceeds = shares * execPrice * (1 - txCostPct);
      cash = proceeds;
      trades.push({ date: bars[i].date, type: 'SELL', price: execPrice, shares: shares });
      shares = 0;
      position = false;
    }
  }

  const finalEquity = cash + shares * bars[bars.length - 1].close;
  return { trades, equityCurve, finalEquity, startingCash };
}

// Simple Moving Average helper
function calcSMA(values, period) {
  const sma = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    sma[i] = sum / period;
  }
  return sma;
}

// Strategy 1: Moving Average Crossover (default 50/200)
// BUY when fast MA crosses above slow MA, SELL when it crosses below
function strategyMACrossover(bars, fastPeriod = 50, slowPeriod = 200) {
  const closes = bars.map(b => b.close);
  const fastMA = calcSMA(closes, fastPeriod);
  const slowMA = calcSMA(closes, slowPeriod);

  const signals = new Array(bars.length).fill(null);

  for (let i = 1; i < bars.length; i++) {
    if (fastMA[i] === null || slowMA[i] === null || fastMA[i - 1] === null || slowMA[i - 1] === null) continue;

    const prevDiff = fastMA[i - 1] - slowMA[i - 1];
    const currDiff = fastMA[i] - slowMA[i];

    if (prevDiff <= 0 && currDiff > 0) {
      signals[i] = 'BUY'; // golden cross
    } else if (prevDiff >= 0 && currDiff < 0) {
      signals[i] = 'SELL'; // death cross
    }
  }

  return signals;
}
