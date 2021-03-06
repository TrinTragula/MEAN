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
const gatePlotVis = document.getElementById('gatePlotVis');
let matrix = new Matrix(dataVis, xPlotVis, yPlotVis, gatePlotVis, executablePath, myColorScale, myInvertedColorScale);

// Create data button importing from files
$("#createDataButton").on("click", function (e) {
  // frist load and reset logic
  nCanaliX = $("#nCanaliX").val() || 1000;
  nCanaliY = $("#nCanaliY").val() || 1000;
  if (document.getElementById("file1").files && document.getElementById("file2").files) {
    path1 = document.getElementById("file1").files[0] ? document.getElementById("file1").files[0].path : null;
    path2 = document.getElementById("file2").files[0] ? document.getElementById("file2").files[0].path : null;
    var coincidenceWindow = $("#window").val() || 5;
    if (!path1 || !path2) return;
    console.log(path1, path2);
    matrix.import(nCanaliX, nCanaliY, path1, path2, coincidenceWindow);
    $(".backgroundRemoval").removeClass("hidden");
    $(".autoPeaks").removeClass("hidden");
    $(".plotbinning").removeClass("hidden");
    $(".calibration").removeClass("hidden");
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
  $(".backgroundRemoval").removeClass("hidden");
  $(".autoPeaks").removeClass("hidden");
  $(".plotbinning").removeClass("hidden");
  $(".calibration").removeClass("hidden");
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

// Remove background
$(".backgroundRemoval").on("click", function (e) {
  let self = $(this);
  $("#backgroundRemovalConfirm").data("filename", self.data("filename"));
  $("#backgroundPreview").data("filename", self.data("filename"));
  $("#backgroundRemovalDiv").removeClass("hidden");
});

// Calibration / Fitting
$(".calibration").on("click", function (e) {
  let self = $(this);
  let fileName = self.data("filename");
  matrix.prepareCalibrating(fileName);
  main.openCalibration();
});

// Background
$("#backgroundRemovalConfirm").on("click", function (e) {
  let self = $(this);
  let fileName = self.data("filename");
  let randomPoints = $("#bgPoints").val();
  let iterations = $("#bgIterations").val();
  matrix.background(fileName, randomPoints, iterations);
  $("#backgroundRemovalDiv").addClass("hidden");
});

$("#backgroundPreview").on("click", function (e) {
  let self = $(this);
  let fileName = self.data("filename");
  let randomPoints = $("#bgPoints").val();
  let iterations = $("#bgIterations").val();
  matrix.previewBackground(fileName, randomPoints, iterations);
});

$("#backgroundRemovalCancel").on("click", function (e) {
  $("#backgroundRemovalDiv").addClass("hidden");
});

// Find peaks from plot
$("#autoPeaksCancel").on("click", function (e) {
  $("#autoPeaksDiv").addClass("hidden");
});

$(".autoPeaks").on("click", function (e) {
  let self = $(this);
  $("#autoPeaksConfirm").data("filename", self.data("filename"));
  $("#autoPeaksDiv").removeClass("hidden");
});

$("#autoPeaksConfirm").on("click", function (e) {
  let self = $(this);
  let fileName = self.data("filename");
  let epsilon = $("#bgWindow").val();
  let treshold = $("#bgTreshold").val();
  matrix.autoPeaks(fileName, epsilon, treshold);
  $("#autoPeaksDiv").addClass("hidden");
});

// Gating
$("#startGatingX").on("click", function (e) {
  matrix.gatingX = true;
  $("#gatingSlider").removeClass("hidden");
  alert("Select the area");
});

$("#startGatingY").on("click", function (e) {
  matrix.gatingY = true;
  $("#gatingSlider").removeClass("hidden");
  alert("Select the area");
});

// Binning
$(".plotbinning").on("click", function (e) {
  let self = $(this);
  $("#binningnoConfirm").data("filename", self.data("filename"));
  $("#plotBinning").removeClass("hidden");
});

$("#binningnoConfirm").on("click", function (e) {
  let self = $(this);
  let fileName = self.data("filename");
  let binningNo = $("#binningno").val() || 2;
  matrix.plotBinning(fileName, binningNo);
  $("#plotBinning").addClass("hidden");
});

$("#binningnoCancel").on("click", function (e) {
  $("#plotBinning").addClass("hidden");
});