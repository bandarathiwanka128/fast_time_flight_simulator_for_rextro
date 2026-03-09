// your_script.js

// var xData = ['a', 'b', 'c', 'd', 'e'];
// var yData = [10, 15, 7, 8, 12];



document.addEventListener("DOMContentLoaded", function () {
    var chartInstance = null;

    document.addEventListener('click', function(e) {
      var button = e.target.closest('.tab-button');
      if (!button) return;

      var targetId = button.getAttribute('data-target');
      if (!targetId) return;

      // Update active tab button
      document.querySelectorAll('.tab-button').forEach(function(b) {
        b.classList.remove('active');
      });
      button.classList.add('active');

      // Show correct chart container
      document.querySelectorAll('.chart-container').forEach(function(c) {
        c.classList.remove('active');
      });
      var targetContainer = document.getElementById(targetId);
      if (!targetContainer) return;
      targetContainer.classList.add('active');

      // Destroy previous chart
      if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

      var xraw = targetContainer.getAttribute('data-xdata') || '';
      var yraw = targetContainer.getAttribute('data-ydata') || '';
      var waypoints = xraw ? xraw.split(',') : [];
      var yvals     = yraw ? yraw.split(',') : [];

      if (targetId === 'chart1') {
        chartInstance = createChart('canvas1', waypoints, yvals, '#3a9eff', 'Altitude (ft)', 'rgba(58,158,255,0.18)');
      } else if (targetId === 'chart2') {
        chartInstance = createChart('canvas2', waypoints, yvals, '#2ecc71', 'Speed (kts)', 'rgba(46,204,113,0.18)');
      }
    });
  });
  
  function createChart(chartId, xData, yData, color, property, rgb) {
    const data = {
      labels: xData,
      datasets: [
        {
          label: property,
          data: yData,
          borderColor: color,
          backgroundColor: rgb,
          fill: true,
          //stepped: true,
        }
      ]
    };

    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          axis: 'x'
        },
        plugins: {
          legend: { labels: { color: '#ccc' } },
          title: { display: false }
        },
        scales: {
          x: { ticks: { color: '#999', maxTicksLimit: 12 }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#999' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    };
    const steppedChartCanvas = document.getElementById(chartId);
    chartInstance = new Chart(steppedChartCanvas, config);

    return chartInstance;
  }

function processStrings(str1, str2) {
  const arr1 = str1.slice(1, -1).split(',').map(Number);
  const arr2 = str2.slice(1, -1).split(',');

  return [arr1, arr2];
}

  