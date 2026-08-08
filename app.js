let priceChart, volumeChart, indicatorChart;
let currentTicker = 'AAPL';
let currentTimeframe = '1Y';
let activeIndicator = null; // 'RSI', 'MACD', 'BB', or null

function filterByTimeframe(bars, tf) {
  const days = { "1M": 21, "6M": 126, "1Y": 252, "5Y": 1260 };
  const n = days[tf] || 252;
  return bars.slice(-n);
}

function renderCharts(ticker, timeframe) {
  const data = MLData.getData(ticker);
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

  // Bollinger Bands overlay on price chart
  if (activeIndicator === 'BB') {
    const bb = calcBollingerBands(allBars, 20, 2);
    const upperSlice = bb.upper.slice(startIdx);
    const lowerSlice = bb.lower.slice(startIdx);
    const middleSlice = bb.middle.slice(startIdx);

    priceDatasets.push(
      { label: 'Upper Band', data: upperSlice, borderColor: '#94a3b8', borderWidth: 1, pointRadius: 0, borderDash: [4,4] },
      { label: 'Middle (SMA20)', data: middleSlice, borderColor: '#f59e0b', borderWidth: 1, pointRadius: 0 },
      { label: 'Lower Band', data: lowerSlice, borderColor: '#94a3b8', borderWidth: 1, pointRadius: 0, borderDash: [4,4] }
    );
  }

  const priceCtx = document.getElementById('price-chart').getContext('2d');
  priceChart = new Chart(priceCtx, {
    type: 'line',
    data: { labels: labels, datasets: priceDatasets },
    options: { responsive: true, scales: { x: { ticks: { maxTicksLimit: 8 } } } }
  });

  const volCtx = document.getElementById('volume-chart').getContext('2d');
  volumeChart = new Chart(volCtx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: 'Volume', data: volumes, backgroundColor: '#94a3b8' }] },
    options: { responsive: true, scales: { x: { ticks: { maxTicksLimit: 8 } } } }
  });

  // RSI or MACD in the separate indicator chart
  const indCtx = document.getElementById('indicator-chart').getContext('2d');
  if (activeIndicator === 'RSI') {
    const rsiFull = calcRSI(allBars, 14);
    const rsiSlice = rsiFull.slice(startIdx);
    indicatorChart = new Chart(indCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{ label: 'RSI(14)', data: rsiSlice, borderColor: '#7c3aed', borderWidth: 1.5, pointRadius: 0 }]
      },
      options: {
        responsive: true,
        scales: { y: { min: 0, max: 100 }, x: { ticks: { maxTicksLimit: 8 } } }
      }
    });
  } else if (activeIndicator === 'MACD') {
    const macd = calcMACD(allBars, 12, 26, 9);
    const macdSlice = macd.macdLine.slice(startIdx);
    const signalSlice = macd.signalLine.slice(startIdx);
    const histSlice = macd.histogram.slice(startIdx);
    indicatorChart = new Chart(indCtx, {
      data: {
        labels: labels,
        datasets: [
          { type: 'line', label: 'MACD', data: macdSlice, borderColor: '#2563eb', borderWidth: 1.5, pointRadius: 0 },
          { type: 'line', label: 'Signal', data: signalSlice, borderColor: '#f59e0b', borderWidth: 1.5, pointRadius: 0 },
          { type: 'bar', label: 'Histogram', data: histSlice, backgroundColor: '#94a3b8' }
        ]
      },
      options: { responsive: true, scales: { x: { ticks: { maxTicksLimit: 8 } } } }
    });
  } else {
    indicatorChart = null;
  }
}

document.getElementById('ticker-select').addEventListener('change', (e) => {
  currentTicker = e.target.value;
  renderCharts(currentTicker, currentTimeframe);
});

document.querySelectorAll('.tf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentTimeframe = btn.dataset.tf;
    renderCharts(currentTicker, currentTimeframe);
  });
});

document.querySelectorAll('.ind-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeIndicator = (activeIndicator === btn.dataset.ind) ? null : btn.dataset.ind;
    renderCharts(currentTicker, currentTimeframe);
  });
});

renderCharts(currentTicker, currentTimeframe);
