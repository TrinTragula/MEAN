const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

var path1 = "C:\\Users\\Daniele\\Desktop\\Tesi Magistrale\\Dati\\Matrice152Eu_ch000.txt"
var path2 = "C:\\Users\\Daniele\\Desktop\\Tesi Magistrale\\Dati\\Matrice152Eu_ch001.txt"
const nCanali = 1000;

// logica di primo caricamento
let executablePath = "DataCruncher/DataCruncher.exe"
let params = [];
child(executablePath, params, function (err, data) {
  dataFile = fs.readFileSync("result.txt", 'ascii');
  if (err) console.log("ERRORE: " + err)
  console.log("Loaded");
  dataLines = dataFile.split("\n");
  metaData = dataLines.shift().split(" ");
  interval = metaData[0];
  min = metaData[1];
  xData = dataLines.map(x => x.split(" ")[0] * 1);
  yData = dataLines.map(x => x.split(" ")[1] * 1);
  zData = dataLines.map(x => x.split(" ")[2] * 1);
  dataVis.data[0].x = xData;
  dataVis.data[0].y = yData;
  dataVis.data[0].z = zData;
  Plotly.redraw(dataVis);
});

var dataFile = fs.readFileSync("result.txt", 'ascii');
console.log("Loaded");
var dataLines = dataFile.split("\n");
var metaData = dataLines.shift().split(" ");
var interval = metaData[0] * 1;
var min = metaData[1] * 1;
var xData = dataLines.map(x => x.split(" ")[0] * 1);
var yData = dataLines.map(x => x.split(" ")[1] * 1);
var zData = dataLines.map(x => x.split(" ")[2] * 1);
var data = [{
  x: xData,
  y: yData,
  z: zData,
  type: 'heatmap'
}];
var xAxisTemplate = {
  range: [0,nCanali],
  showgrid: true,
  zeroline: true,
  linecolor: 'black',
  showticklabels: true,
  ticks: ''
};

var yAxisTemplate = {
  showgrid: true,
  zeroline: true,
  linecolor: 'black',
  showticklabels: true,
  ticks: ''
};
var layout = {
  xaxis: xAxisTemplate,
  yaxis: yAxisTemplate,
  dragmode: 'select'
};
var dataVis = document.getElementById('dataVis');
Plotly.newPlot(dataVis, data, layout, {
  displayModeBar: false
});

// Logica di selezione
dataVis.on('plotly_selected', (eventData) => {
  let xRange = eventData.range.x.map(x => toChannel(x, interval, min));
  let yRange = eventData.range.y.map(x => toChannel(x, interval, min));
  console.log(xRange, yRange);
  let executablePath = "DataCruncher/DataCruncher.exe"
  let parameters = [path1, path2, xRange[0], xRange[1], yRange[0], yRange[1], nCanali, false];
  child(executablePath, parameters, function (err, data) {
    dataFile = fs.readFileSync("result.txt", 'ascii');
    if (err) console.log("ERRORE: " + err)
    console.log("Loaded");
    dataLines = dataFile.split("\n");
    metaData = dataLines.shift().split(" ");
    interval = metaData[0] * 1;
    min = metaData[1] * 1;
    xData = dataLines.map(x => x.split(" ")[0] * 1);
    yData = dataLines.map(x => x.split(" ")[1] * 1);
    zData = dataLines.map(x => x.split(" ")[2] * 1);
    dataVis.data[0].x = xData;
    dataVis.data[0].y = yData;
    dataVis.data[0].z = zData;
    Plotly.redraw(dataVis);
  });
});

function toChannel(x, interval, min) {
  return Math.floor(x * interval + min);
}