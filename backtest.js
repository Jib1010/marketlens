// Core backtest engine: takes bars + a signal array, simulates trades
// signals[i] = 'BUY', 'SELL', or null for each bar i
// Execution happens on the NEXT bar's open (no look-ahead bias)
function runBacktest(bars, signals, startingCash = 10000, txCostPct = 0.001) {
  let cash = startingCash;
  let shares = 0;
  let position = false;
  const trades = [];
  const equityCurve = [];

  for (let i = 0; i < bars.length; i++) {
    const equityToday = cash + shares * bars[i].close;
    equityCurve.push({ date: bars[i].date, equity: equityToday });

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

function calcSMA(values, period) {
  const sma = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    sma[i] = sum / period;
  }
  return sma;
}

function strategyMACrossover(bars, fastPeriod = 50, slowPeriod = 200) {
  const closes = bars.map(b => b.close);
  const fastMA = calcSMA(closes, fastPeriod);
  const slowMA = calcSMA(closes, slowPeriod);
  const signals = new Array(bars.length).fill(null);

  for (let i = 1; i < bars.length; i++) {
    if (fastMA[i] === null || slowMA[i] === null || fastMA[i - 1] === null || slowMA[i - 1] === null) continue;
    const prevDiff = fastMA[i - 1] - slowMA[i - 1];
    const currDiff = fastMA[i] - slowMA[i];
    if (prevDiff <= 0 && currDiff > 0) signals[i] = 'BUY';
    else if (prevDiff >= 0 && currDiff < 0) signals[i] = 'SELL';
  }
  return signals;
}

function strategyRSI(bars, period = 14, oversold = 30, overbought = 70) {
  const rsi = calcRSI(bars, period);
  const signals = new Array(bars.length).fill(null);
  for (let i = 1; i < bars.length; i++) {
    if (rsi[i] === null || rsi[i - 1] === null) continue;
    if (rsi[i - 1] <= oversold && rsi[i] > oversold) signals[i] = 'BUY';
    else if (rsi[i - 1] >= overbought && rsi[i] < overbought) signals[i] = 'SELL';
  }
  return signals;
}

function strategyMACD(bars, fast = 12, slow = 26, signalPeriod = 9) {
  const macd = calcMACD(bars, fast, slow, signalPeriod);
  const signals = new Array(bars.length).fill(null);
  for (let i = 1; i < bars.length; i++) {
    if (macd.macdLine[i] === null || macd.signalLine[i] === null ||
        macd.macdLine[i - 1] === null || macd.signalLine[i - 1] === null) continue;
    const prevDiff = macd.macdLine[i - 1] - macd.signalLine[i - 1];
    const currDiff = macd.macdLine[i] - macd.signalLine[i];
    if (prevDiff <= 0 && currDiff > 0) signals[i] = 'BUY';
    else if (prevDiff >= 0 && currDiff < 0) signals[i] = 'SELL';
  }
  return signals;
}

function strategyBollinger(bars, period = 20, numStdDev = 2) {
  const bb = calcBollingerBands(bars, period, numStdDev);
  const closes = bars.map(b => b.close);
  const signals = new Array(bars.length).fill(null);
  for (let i = 1; i < bars.length; i++) {
    if (bb.lower[i] === null || bb.middle[i] === null ||
        bb.lower[i - 1] === null || bb.middle[i - 1] === null) continue;
    if (closes[i - 1] >= bb.lower[i - 1] && closes[i] < bb.lower[i]) signals[i] = 'BUY';
    else if (closes[i - 1] <= bb.middle[i - 1] && closes[i] > bb.middle[i]) signals[i] = 'SELL';
  }
  return signals;
}

function calcMetrics(bars, backtestResult, startingCash = 10000) {
  const { trades, equityCurve, finalEquity } = backtestResult;
  const totalReturn = (finalEquity - startingCash) / startingCash;
  const buyHoldReturn = (bars[bars.length - 1].close - bars[0].close) / bars[0].close;

  const dailyReturns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    const curr = equityCurve[i].equity;
    if (prev > 0) dailyReturns.push((curr - prev) / prev);
  }
  const meanDaily = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDaily, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev === 0 ? 0 : (meanDaily / stdDev) * Math.sqrt(252);

  let peak = equityCurve[0].equity;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const drawdown = (peak - point.equity) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  let wins = 0, completedTrades = 0;
  for (let i = 0; i < trades.length - 1; i++) {
    if (trades[i].type === 'BUY' && trades[i + 1].type === 'SELL') {
      completedTrades++;
      if (trades[i + 1].price > trades[i].price) wins++;
    }
  }
  const winRate = completedTrades === 0 ? 0 : wins / completedTrades;

  return { totalReturn, buyHoldReturn, sharpe, maxDrawdown, winRate, numTrades: trades.length, completedTrades };
}
