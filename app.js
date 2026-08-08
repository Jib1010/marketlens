let priceChart, volumeChart, indicatorChart;
let currentTicker = 'AAPL';
let currentTimeframe = '1Y';
let activeIndicator = null;

function filterByTimeframe(bars, tf) {
  const days = { "1M": 21, "6M": 126, "1Y": 252, "5Y": 1260 };
  const n = days[tf] || 252;
  return bars.slice(-n);
}

async function renderCharts(ticker, timeframe) {
  const data = await MLData.getData(ticker);
  const allBars = data.bars;
  const bars = filterByTimeframe(allBars, timeframe);
  const startIdx = allBars.length - bars.length;

  const labels = bars.map(b => b.date);
  const closes = bars.map(b => b.close);
  const volumes = bars.map(b => b.volume);

  if (priceChart) priceChart.destroy();
  if (volumeChart) volumeChart.destroy();
  if (indicatorChart) indicatorChart.destroy();

  const priceDatasets = [{
    label: ticker + ' Close',
    data: closes,
    borderColor: '#2563eb',
    borderWidth: 1.5,
    pointRadius: 0,
    tension: 0.1
  }];

  if (activeIndicator === 'BB') {
    const bb = calcBollingerBands(allBars, 20, 2);
    priceDatasets.push(
      { label: 'Upper Band', data: bb.upper.slice(startIdx), borderColor: '#94a3b8', borderWidth: 1, pointRadius: 0, borderDash: [4,4] },
      { label: 'Middle (SMA20)', data: bb.middle.slice(startIdx), borderColor: '#f59e0b', borderWidth: 1, pointRadius: 0 },
      { label: 'Lower Band', data: bb.lower.slice(startIdx), borderColor: '#94a3b8', borderWidth: 1, pointRadius: 0, borderDash: [4,4] }
    );
  }

  const priceCanvas = document.getElementById('price-chart');
  if (priceCanvas) {
    priceChart = new Chart(priceCanvas.getContext('2d'), {
      type: 'line',
      data: { labels: labels, datasets: priceDatasets },
      options: { responsive: true, scales: { x: { ticks: { maxTicksLimit: 8 } } } }
    });
  }

  const volCanvas = document.getElementById('volume-chart');
  if (volCanvas) {
    volumeChart = new Chart(volCanvas.getContext('2d'), {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: 'Volume', data: volumes, backgroundColor: '#94a3b8' }] },
      options: { responsive: true, scales: { x: { ticks: { maxTicksLimit: 8 } } } }
    });
  }

  const indCanvas = document.getElementById('indicator-chart');
  if (indCanvas) {
    if (activeIndicator === 'RSI') {
      const rsiFull = calcRSI(allBars, 14);
      indicatorChart = new Chart(indCanvas.getContext('2d'), {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'RSI(14)', data: rsiFull.slice(startIdx), borderColor: '#7c3aed', borderWidth: 1.5, pointRadius: 0 }] },
        options: { responsive: true, scales: { y: { min: 0, max: 100 }, x: { ticks: { maxTicksLimit: 8 } } } }
      });
    } else if (activeIndicator === 'MACD') {
      const macd = calcMACD(allBars, 12, 26, 9);
      indicatorChart = new Chart(indCanvas.getContext('2d'), {
        data: {
          labels: labels,
          datasets: [
            { type: 'line', label: 'MACD', data: macd.macdLine.slice(startIdx), borderColor: '#2563eb', borderWidth: 1.5, pointRadius: 0 },
            { type: 'line', label: 'Signal', data: macd.signalLine.slice(startIdx), borderColor: '#f59e0b', borderWidth: 1.5, pointRadius: 0 },
            { type: 'bar', label: 'Histogram', data: macd.histogram.slice(startIdx), backgroundColor: '#94a3b8' }
          ]
        },
        options: { responsive: true, scales: { x: { ticks: { maxTicksLimit: 8 } } } }
      });
    }
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'chart' || tabName === 'indicators') {
    renderCharts(currentTicker, currentTimeframe);
  }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.getElementById('ticker-select').addEventListener('change', (e) => {
  currentTicker = e.target.value;
  renderCharts(currentTicker, currentTimeframe);
});

document.querySelectorAll('.tf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTimeframe = btn.dataset.tf;
    renderCharts(currentTicker, currentTimeframe);
  });
});

document.querySelectorAll('.ind-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const wasActive = btn.classList.contains('active');
    document.querySelectorAll('.ind-btn').forEach(b => b.classList.remove('active'));
    activeIndicator = wasActive ? null : btn.dataset.ind;
    if (!wasActive) btn.classList.add('active');
    renderCharts(currentTicker, currentTimeframe);
  });
});

function renderEquityCurve(equityCurve) {
  const equityCanvas = document.getElementById('equity-chart');
  if (!equityCanvas) return;

  if (window.equityChart) window.equityChart.destroy();

  // Sample down if there are a lot of points, for performance
  const step = Math.max(1, Math.floor(equityCurve.length / 500));
  const sampled = equityCurve.filter((_, i) => i % step === 0);

  window.equityChart = new Chart(equityCanvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: sampled.map(p => p.date),
      datasets: [{
        label: 'Equity ($)',
        data: sampled.map(p => p.equity),
        borderColor: '#16a34a',
        borderWidth: 1.5,
        pointRadius: 0
      }]
    },
    options: { responsive: true, scales: { x: { ticks: { maxTicksLimit: 8 } } } }
  });
}

async function runSelectedBacktest() {
  const strategyKey = document.getElementById('strategy-select').value;
  const data = await MLData.getData(currentTicker);
  const bars = data.bars;

  let signals;
  if (strategyKey === 'MA') signals = strategyMACrossover(bars);
  else if (strategyKey === 'RSI') signals = strategyRSI(bars);
  else if (strategyKey === 'MACD') signals = strategyMACD(bars);
  else if (strategyKey === 'BB') signals = strategyBollinger(bars);

  const result = runBacktest(bars, signals, 10000, 0.001);
  const metrics = calcMetrics(bars, result, 10000);

  const resultsDiv = document.getElementById('backtest-results');
  resultsDiv.innerHTML = `
    <p><strong>Total Return:</strong> ${(metrics.totalReturn * 100).toFixed(1)}%</p>
    <p><strong>Buy & Hold Return:</strong> ${(metrics.buyHoldReturn * 100).toFixed(1)}%</p>
    <p><strong>Sharpe Ratio:</strong> ${metrics.sharpe.toFixed(2)}</p>
    <p><strong>Max Drawdown:</strong> ${(metrics.maxDrawdown * 100).toFixed(1)}%</p>
    <p><strong>Win Rate:</strong> ${(metrics.winRate * 100).toFixed(1)}%</p>
    <p><strong>Number of Trades:</strong> ${metrics.numTrades}</p>
  `;

  renderEquityCurve(result.equityCurve);
}

const backtestBtn = document.getElementById('run-backtest-btn');
if (backtestBtn) {
  backtestBtn.addEventListener('click', runSelectedBacktest);
}
