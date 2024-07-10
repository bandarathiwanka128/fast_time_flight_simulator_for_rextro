// your_script.js

// var xData = ['a', 'b', 'c', 'd', 'e'];
// var yData = [10, 15, 7, 8, 12];



document.addEventListener("DOMContentLoaded", function () {
  //altitude plot and speed plot buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    const chartContainers = document.querySelectorAll('.chart-container');
    var chartInstance = null;
    chartInstance = createChart('canvas1',  [], []);
  
    tabButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        // selecting the chart
        const targetId = button.getAttribute('data-target');
        
        // Hide all chart containers
        chartContainers.forEach(function (container) {
          container.style.display = 'none';
        });

        // Destroy any active chart in the container (if exists)
        if (chartInstance) {
          chartInstance.destroy();
        }
        
        // Show the selected chart container
        const targetContainer = document.getElementById(targetId);
        targetContainer.style.display = 'block';

        const waypoints = targetContainer.getAttribute('data-xdata').split(',');
        
        // Create and update the chart in the selected container (need to modify this part)
        if (targetId === 'chart1') {
          const altitudes = targetContainer.getAttribute('data-ydata').split(',');
          const interval = targetContainer.getAttribute('data-zdata');
          console.log('altitudes = '+altitudes);
          console.log('waypoints = '+waypoints);
          console.log('interval = '+interval);
          chartInstance = createChart('canvas1',  waypoints, altitudes, 'blue', 'ALtitude', 'rgba(9, 78, 242, 0.2)');
        
          
        } else if (targetId === 'chart2') {
          const speeds = targetContainer.getAttribute('data-ydata').split(',');
          console.log('speeds = '+speeds);
          chartInstance = createChart('canvas2', waypoints, speeds, 'green', 'Speed', 'rgba(9, 173, 59, 0.2)');
        }
        // Add similar conditions for additional charts
      });
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
          title: {
            display: true,
            text: (ctx) => 'Step ' + ctx.chart.data.datasets[0].stepped + ' Interpolation',
          }
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

  