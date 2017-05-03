const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

//let path1 = "C:\\Users\\Daniele\\Desktop\\Tesi Magistrale\\Dati\\Matrice152Eu_ch000.txt"
//let path2 = "C:\\Users\\Daniele\\Desktop\\Tesi Magistrale\\Dati\\Matrice152Eu_ch001.txt"
let nCanali = $("#nCanali").val() || 1000;

const executablePath = "DataCruncher/DataCruncher.exe"
const dataVis = document.getElementById('dataVis');
let firstTime = true;
let x1, x2, y1, y2, interval, min;

$("#drawButton").on("click", function (e) {
  // frist load and reset logic
  nCanali = $("#nCanali").val() || 1000;
  path1 = document.getElementById("file1").files[0].path;
  path2 = document.getElementById("file2").files[0].path;
  console.log(path1, path2);
  let params = [nCanali];
  child(executablePath, params, function (err, fileData) {
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
    // I'll draw the matrix
    let data = [{
      x: xData,
      y: yData,
      z: zData,

      /*type: 'histogram2dcontour',
      line: {
      	width: 0
      },
      contours: {
      	coloring: 'heatmap'
      },*/
      type: 'heatmap',
      colorscale: [
        [0, 'rgb(200,200,255)'],
        [0.01, 'rgb(0, 0, 255)'],
        [0.25, 'rgb(0, 255, 0)'],
        [0.5, 'rgb(200,55,0)'],
        [1, 'rgb(255,0,0)']
      ]
    }];

    let xAxisTemplate = {
      range: [0, nCanali],
      showgrid: true,
      zeroline: true,
      linecolor: 'black',
      showticklabels: true,
      ticks: ''
    };
    let yAxisTemplate = {
      showgrid: true,
      zeroline: true,
      linecolor: 'black',
      showticklabels: true,
      ticks: ''
    };
    let layout = {
      xaxis: xAxisTemplate,
      yaxis: yAxisTemplate,
      dragmode: 'select'
    };
    Plotly.newPlot(dataVis, data, layout, {
      displayModeBar: false
    });
    // Logica di selezione
    dataVis.on('plotly_selected', (eventData) => {
      nCanali = $("#nCanali").val() || 1000;
      path1 = $("#path1").val() || path1;
      path2 = $("#path2").val() || path2;
      let xRange = eventData.range.x.map(x => toChannel(x, interval, min));
      let yRange = eventData.range.y.map(x => toChannel(x, interval, min));
      x1 = xRange[0];
      x2 = xRange[1];
      y1 = yRange[0];
      y2 = yRange[1];
      console.log(xRange, yRange);
      updateMatrix(x1, x2, y1, y2, nCanali, path1, path2);
    });
    $("#drawButton").html("Reset")
  });
})

// Update the current image channel resolution
$("#updateChannels").on("click", function (e) {
  nCanali = $("#nCanali").val() || 1000;
  if (x1 && x2 && y1 && y2)
    updateMatrix(x1, x2, y1, y2, nCanali, path1, path2);
  else
    updateMatrix(x1, x2, y1, y2, nCanali, path1, path2, false);
});

// Update the matrix plot
function updateMatrix(x1, x2, y1, y2, numeroCanali, primoPath, secondoPath, useParameters = true) {
  let parameters;
  if (useParameters)
    parameters = [numeroCanali, primoPath, secondoPath, x1, x2, y1, y2, false];
  else
    parameters = [numeroCanali];
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
    let xAxisTemplate = {
      range: [0, numeroCanali],
      showgrid: true,
      zeroline: true,
      linecolor: 'black',
      showticklabels: true,
      ticks: ''
    };
    let yAxisTemplate = {
      showgrid: true,
      zeroline: true,
      linecolor: 'black',
      showticklabels: true,
      ticks: ''
    };
    dataVis.layout = {
      xaxis: xAxisTemplate,
      yaxis: yAxisTemplate,
      dragmode: 'select'
    };
    Plotly.redraw(dataVis);
  });
}

// reutrn the real channel
function toChannel(x, interval, min) {
  return Math.floor(x * interval + min);
}