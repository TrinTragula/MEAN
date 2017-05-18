const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

//let path1 = "C:\\Users\\Daniele\\Desktop\\Tesi Magistrale\\Dati\\Matrice152Eu_ch000.txt"
//let path2 = "C:\\Users\\Daniele\\Desktop\\Tesi Magistrale\\Dati\\Matrice152Eu_ch001.txt"
let path1;
let path2;
let nCanali = $("#nCanali").val() || 1000;
const executablePath = "DataCruncher/DataCruncher.exe"

const myColorScale = [
  [0, 'rgb(200,200,255)'],
  [0.01, 'rgb(0, 0, 255)'],
  [0.25, 'rgb(0, 255, 0)'],
  [0.5, 'rgb(200,55,0)'],
  [1, 'rgb(255,0,0)']
];

const myInvertedColorScale = [
  [0, 'rgb(255,0,0)']
  [0.01, 'rgb(200,55,0)'],
  [0.25, 'rgb(0, 255, 0)'],
  [0.5, 'rgb(0, 0, 255)'],
  [1, 'rgb(200,200,255)']
];

const dataVis = document.getElementById('dataVis');
const xPlotVis = document.getElementById('xPlotVis');
const yPlotVis = document.getElementById('yPlotVis');
let firstTime = true;
let x1, x2, y1, y2, interval, min;
let isPickingAllowed = false;

// Importa vecchio db
$("#importDbButton").on("click", function (e) {
  let dbPath;
  if (document.getElementById("dbFile"))
    dbPath = document.getElementById("dbFile").files[0] ? document.getElementById("dbFile").files[0].path : null;
  if (dbPath) {
    let contents = fs.readFileSync(dbPath);
    console.log(contents);
    fs.writeFileSync("coincidenze_vere.sqlite", contents);
    alert("Done!");
  }
});

// Salva db attuale
$("#saveDb").on("click", function (e) {
  let content = fs.readFileSync("coincidenze_vere.sqlite");
  main.saveFile(content);
});

// Create data button importing from files
$("#createDataButton").on("click", function (e) {
  // frist load and reset logic
  nCanali = $("#nCanali").val() || 1000;
  if (document.getElementById("file1").files && document.getElementById("file2").files) {
    path1 = document.getElementById("file1").files[0] ? document.getElementById("file1").files[0].path : null;
    path2 = document.getElementById("file2").files[0] ? document.getElementById("file2").files[0].path : null;
    if (!path1 || !path2) return;
    console.log(path1, path2);
    let params = [nCanali * 1, path1, path2, 0, 999999999, 0, 999999999, true];
    // Loading bar
    $("#loadingBar").removeClass("hidden");
    $(".progress-bar").animate({
      width: "100%",
    }, 120000);
    // Lancio il programma
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
        colorscale: myColorScale
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
        displayModeBar: true
      });
      $(".modebar").addClass("hidden");
      // Loading bar
      $("#loadingBar").addClass("hidden");
      $(".progress-bar").animate({
        width: "0%",
      }, 1);
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
        $(".zoomlayer").addClass("hidden");
      });
      dataVis.on('plotly_selecting', (eventData) => {
        $(".zoomlayer").removeClass("hidden");
      });
      $("#drawButton").html("Reset");
      alert("Done!");
    });
  }
})

// Clcik on create
$("#drawButton").on("click", function (e) {
  // frist load and reset logic
  nCanali = $("#nCanali").val() || 1000;
  if (document.getElementById("file1").files && document.getElementById("file2").files) {
    path1 = document.getElementById("file1").files[0] ? document.getElementById("file1").files[0].path : null;
    path2 = document.getElementById("file2").files[0] ? document.getElementById("file2").files[0].path : null;
  }
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
    let xFitData = {};
    let yFitData = {};
    for (let i = 0; i < dataLines.length; i++) {
      let xValue = dataLines[i].split(" ")[0] * 1;
      let yValue = dataLines[i].split(" ")[1] * 1;
      let zValue = dataLines[i].split(" ")[2] * 1;
      if (!xFitData.hasOwnProperty(xValue)) {
        xFitData[xValue] = 0;
      }
      if (!yFitData.hasOwnProperty(yValue)) {
        yFitData[yValue] = 0;
      }
      if (!isNaN(zValue)) {
        xFitData[xValue] += zValue;
        yFitData[yValue] += zValue;
      }
    }
    // Draw the fit for x data
    drawFitGraph(xFitData, "x");
    drawFitGraph(yFitData, "y");
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
      colorscale: myColorScale
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
      displayModeBar: true
    });
    $(".modebar").addClass("hidden");
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
      $(".zoomlayer").addClass("hidden");
    });
    dataVis.on('plotly_selecting', (eventData) => {
      $(".zoomlayer").removeClass("hidden");
    });
    $("#drawButton").html("Reset")
    $("#pickSelector").removeClass("hidden");
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

// Invert colors
let inverted = false;
$("#invertColor").change(function (e) {
  if (inverted) {
    $(".nsewdrag").css('fill', 'transparent');
    dataVis.data[0].colorscale = myColorScale;
    Plotly.redraw(dataVis);
    $(".modebar").addClass("hidden");
  } else {
    $(".nsewdrag").css('fill', 'darkblue');
    dataVis.data[0].colorscale = myInvertedColorScale;
    Plotly.redraw(dataVis);
    $(".modebar").addClass("hidden");
  }
  inverted = !inverted;
});

// Invert axis
$("#invertAxes").change(function (e) {
  let numeroCanali = $("#nCanali").val() || 1000;
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
  let placeholder = dataVis.data[0].x;
  dataVis.data[0].x = dataVis.data[0].y;
  dataVis.data[0].y = placeholder;
  dataVis.layout = {
    xaxis: yAxisTemplate,
    yaxis: xAxisTemplate,
    dragmode: 'select'
  };
  Plotly.redraw(dataVis);
  $(".modebar").addClass("hidden");
});

// Salvataggio immagini
$("#saveMatrix").on("click", function (e) {
  $("[data-title='Download plot as a png']")[0].click();
});
$("#saveX").on("click", function (e) {
  $("[data-title='Download plot as a png']")[1].click();
});
$("#saveY").on("click", function (e) {
  $("[data-title='Download plot as a png']")[2].click();
});

// Selezione picchi
$("#pickSelector").on("click", function (e) {
  let self = $(this);
  if (self.html() == "Select peaks") {
    isPickingAllowed = true;
    self.html("Stop selecting peaks");
    $("#selectedPeaksBox").removeClass("hidden");
  } else {
    isPickingAllowed = false;
    self.html("Select peaks");
    $("#selectedPeaksBox").addClass("hidden");
  }
});

// Update the matrix plot
function updateMatrix(x1, x2, y1, y2, numeroCanali, primoPath, secondoPath, useParameters = true, overwrite = false) {
  let parameters;
  if (useParameters)
    parameters = [numeroCanali, primoPath, secondoPath, x1, x2, y1, y2, overwrite];
  else
    parameters = [numeroCanali];
  child(executablePath, parameters, function (err, data) {
    dataFile = fs.readFileSync("result.txt", 'ascii');
    if (err) console.log("ERRORE: " + err)
    console.log("Loaded");
    dataLines = dataFile.split("\n");
    metaData = dataLines.shift().split(" ");
    let graphX1 = fromChannel(x1, interval, min);
    let graphX2 = fromChannel(x2, interval, min);
    let graphY1 = fromChannel(y1, interval, min);
    let graphY2 = fromChannel(y2, interval, min);
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
    $(".modebar").addClass("hidden");
  });
}

// Draw the linear plots
function drawFitGraph(fitData, id) {
  fitData = Object.keys(fitData).map(key => fitData[key])
  let trace = {
    x: [...Array(fitData.length).keys()],
    y: fitData,
    type: 'scatter'
  };
  let layout = {};
  let data = [trace];
  if (id == "x") {
    Plotly.newPlot('xPlotVis', data, layout, {
      displayModeBar: true,
      margin:{
       t: 0,
       b: 0 
      },
    });
    $(".modebar").addClass("hidden");
    xPlotVis.on('plotly_click', (eventData) => {
        newPeakPoint(eventData.points[0].x, eventData.points[0].x);
      });
  } else if (id == "y"){
    Plotly.newPlot('yPlotVis', data, layout, {
      displayModeBar: true
    });
    $(".modebar").addClass("hidden");
  }
}

// reutrn the real channel
function toChannel(x, interval, min) {
  return Math.floor(x * interval + min);
}
// return the graph channel
function fromChannel(x, interval, min) {
  return Math.floor((x - min) / interval);
}

let peakPoint = []
// adds a peak point to the list
function newPeakPoint(x, y){
  if (isPickingAllowed){
    $("#selectedPeaksBoxTitle").append( "<div>X: " + x + " Y: " + y + "</div>" );
  } else return;
}