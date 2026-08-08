let priceChart, volumeChart;

function filterByTimeframe(bars, tf) {
  const days = { "1M": 21, "6M": 126, "1Y": 252, "5Y": 1260 };
  const n = days[tf] || 252;
  return bars.slice(-n);
}

function renderCharts(ticker, timeframe) {
  const data = MLData.getData(ticker);
  const bars = filterByTimeframe(data.bars, timeframe);

  const labels = bars.map(b => b.date);
  const closes = bars.map(b => b.close);
  const volumes = bars.map(b => b.volume);

  if (priceChart) priceChart.destroy();
  if (volumeChart) volumeChart.destroy();

  const priceCtx = document.getElementById('price-chart').getContext('2d');
  priceChart = new Chart(priceCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: ticker + ' Close',
        data: closes,
        borderColor: '#2563eb',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { maxTicksLimit: 8 } }
      }
    }
  });

  const volCtx = document.getElementById('volume-chart').getContext('2d');
  volumeChart = new Chart(volCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Volume',
        data: volumes,
        backgroundColor: '#94a3b8'
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { maxTicksLimit: 8 } }
      }
    }
  });
}

let currentTicker = 'AAPL';
let currentTimeframe = '1Y';

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

renderCharts(currentTicker, currentTimeframe);
