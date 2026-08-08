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
