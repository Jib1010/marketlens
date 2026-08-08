// Relative Strength Index (14-period, Wilder's smoothing)
function calcRSI(bars, period = 14) {
  const closes = bars.map(b => b.close);
  const rsi = new Array(closes.length).fill(null);

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += -change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  }

  return rsi;
}

// Exponential Moving Average helper
function calcEMA(values, period) {
  const k = 2 / (period + 1);
  const ema = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  ema[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    ema[i] = values[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

// MACD (12, 26, 9)
function calcMACD(bars, fast = 12, slow = 26, signalPeriod = 9) {
  const closes = bars.map(b => b.close);
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);

  const macdLine = closes.map((_, i) =>
    (emaFast[i] !== null && emaSlow[i] !== null) ? emaFast[i] - emaSlow[i] : null
  );

  const macdValues = macdLine.filter(v => v !== null);
  const signalRaw = calcEMA(macdValues, signalPeriod);

  const signalLine = new Array(closes.length).fill(null);
  const firstMacdIdx = macdLine.findIndex(v => v !== null);
  for (let i = 0; i < signalRaw.length; i++) {
    if (signalRaw[i] !== null) signalLine[firstMacdIdx + i] = signalRaw[i];
  }

  const histogram = closes.map((_, i) =>
    (macdLine[i] !== null && signalLine[i] !== null) ? macdLine[i] - signalLine[i] : null
  );

  return { macdLine, signalLine, histogram };
}


// Bollinger Bands (20-period SMA, 2 standard deviations)
function calcBollingerBands(bars, period = 20, numStdDev = 2) {
  const closes = bars.map(b => b.close);
  const middle = new Array(closes.length).fill(null);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;

    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle[i] = mean;
    upper[i] = mean + numStdDev * stdDev;
    lower[i] = mean - numStdDev * stdDev;
  }

  return { middle, upper, lower };
}
