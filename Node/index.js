const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const Matrix = require('./classes/matrix');
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

let path1;
let path2;
let nCanaliX = $("#nCanaliX").val() || 1000;
let nCanaliY = $("#nCanaliY").val() || 1000;

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
let matrix = new Matrix(dataVis, xPlotVis, yPlotVis, executablePath, myColorScale, myInvertedColorScale);

// Create data button importing from files
$("#createDataButton").on("click", function (e) {
  // frist load and reset logic
  nCanaliX = $("#nCanaliX").val() || 1000;
  nCanaliY = $("#nCanaliY").val() || 1000;
  if (document.getElementById("file1").files && document.getElementById("file2").files) {
    path1 = document.getElementById("file1").files[0] ? document.getElementById("file1").files[0].path : null;
    path2 = document.getElementById("file2").files[0] ? document.getElementById("file2").files[0].path : null;
    if (!path1 || !path2) return;
    console.log(path1, path2);
    matrix.import(nCanaliX, nCanaliY, path1, path2);
  }
})

// Clcik on create
$("#drawButton").on("click", function (e) {
  // frist load and reset logic
  nCanaliX = $("#nCanaliX").val() || 1000;
  nCanaliY = $("#nCanaliY").val() || 1000;
  if (document.getElementById("file1").files && document.getElementById("file2").files) {
    path1 = document.getElementById("file1").files[0] ? document.getElementById("file1").files[0].path : null;
    path2 = document.getElementById("file2").files[0] ? document.getElementById("file2").files[0].path : null;
  }
  console.log(path1, path2);
  matrix.create(nCanaliX, nCanaliY, path1, path2);
})

// Update the current image channel resolution
$("#updateChannels").on("click", function (e) {
  nCanaliX = $("#nCanaliX").val() || 1000;
  nCanaliY = $("#nCanaliY").val() || 1000;
  if (matrix.x1 && matrix.x2 && matrix.y1 && matrix.y2 && !matrix.wasResetted)
    matrix.updateMatrix(nCanaliX, nCanaliY, path1, path2);
  else
    matrix.updateMatrix(nCanaliX, nCanaliY, path1, path2, false);
});

// Invert colors
let inverted = false;
$("#invertColor").change(function (e) {
  if (inverted) {
    $(".nsewdrag").css('fill', 'transparent');
    matrix.colorscale();
    $(".modebar").addClass("hidden");
  } else {
    $(".nsewdrag").css('fill', 'darkblue');
    matrix.invertColorscale();
    $(".modebar").addClass("hidden");
  }
  inverted = !inverted;
});

// Invert axis
$("#invertAxes").change(function (e) {
  matrix.invertAxes();
  $(".modebar").addClass("hidden");
});



// Selezione picchi
$("#pickSelector").on("click", function (e) {
  let self = $(this);
  if (self.html() == "Select peaks") {
    matrix.isPickingAllowed = true;
    self.html("Stop selecting peaks");
    $("#selectedPeaksBox").removeClass("hidden");
  } else {
    matrix.isPickingAllowed = false;
    self.html("Select peaks");
    $("#selectedPeaksBoxTitle").children().remove();
    $("#selectedPeaksBox").addClass("hidden");
  }
});

$("#startGatingX").on("click", function (e) {
  matrix.gatingX = true;
  alert("Select the area");
});

$("#startGatingY").on("click", function (e) {
  matrix.gatingY = true;
  alert("Select the area");
});

