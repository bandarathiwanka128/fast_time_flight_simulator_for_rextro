const XLSX = require('xlsx');
const fs = require('fs');

function timeToSeconds(time) {
  const [hours, minutes, seconds] = time.split('.');
  return (+hours * 3600) + (+minutes * 60) + (+seconds);
}

function secondsToTime(seconds) {
  const pad = (num) => (num < 10 ? '0' : '') + num;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${pad(hours)}.${pad(minutes)}.${pad(secs)}`;
}

function generateTimeIntervals(startTime, endTime, intervalSeconds) {
  const timeIntervals = [];
  let currentTime = startTime;
  const startTimeSeconds = timeToSeconds(startTime);
  const endTimeSeconds = timeToSeconds(endTime);

  while (timeToSeconds(currentTime) <= endTimeSeconds) {
    timeIntervals.push(currentTime);
    const nextTimeSeconds = timeToSeconds(currentTime) + intervalSeconds;
    currentTime = secondsToTime(nextTimeSeconds);
  }

  return timeIntervals;
}

// Start and end time in HH.MM.SS format
const startTime = '05.00.00';
const endTime = '07.00.00';
const intervalSeconds = 20;

const timeIntervals = generateTimeIntervals(startTime, endTime, intervalSeconds);

// Create a new workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(timeIntervals.map(interval => [interval]));

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Intervals');

// Generate an Excel file
const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
const filename = 'time_intervals.xlsx';
fs.writeFileSync(filename, excelBuffer);
console.log('Excel file generated successfully: ' + filename);
