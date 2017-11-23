const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const Spectrum = require('./classes/spectrum');
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

let path1;

const executablePath = "DataCruncher/DataCruncher.exe"
const dataVis = document.getElementById('dataVis');

let spectrum = new Spectrum(dataVis, executablePath);

function createSpectrum() {
    // frist load and reset logic
    if (document.getElementById("file1").files) {
        path1 = document.getElementById("file1").files[0] ? document.getElementById("file1").files[0].path : null;
        if (!path1) alert("No data input file was selected!");
        console.log(path1);
        spectrum.create(path1);
        $(".backgroundRemoval").removeClass("hidden");
        $(".autoPeaks").removeClass("hidden");
        $(".calibration").removeClass("hidden");
    }
}

// Clcik on create
$(".drawButton").on("change", function (e) {
    createSpectrum();
})

$("#saveSpectrumData").on("click", function (e) {
    spectrum.saveData();
});

// Invert colors
let inverted = false;
$("#invertColor").change(function (e) {
    if (inverted) {
        $(".nsewdrag").css('fill', 'transparent');
        // Nasc
        $(".modebar").addClass("hidden");
    } else {
        $(".nsewdrag").css('fill', 'darkblue');
        $(".modebar").addClass("hidden");
    }
    inverted = !inverted;
});

// Invert axis
$("#invertAxes").change(function (e) {
    spectrum.invertAxes();
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
    spectrum.prepareCalibrating(fileName);
    spectrum.openCalibration();
});

// Background
$("#backgroundRemovalConfirm").on("click", function (e) {
    let self = $(this);
    let fileName = self.data("filename");
    let randomPoints = $("#bgPoints").val();
    let iterations = $("#bgIterations").val();
    spectrum.background(fileName, randomPoints, iterations);
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
    spectrum.autoPeaks(fileName, epsilon, treshold);
    $("#autoPeaksDiv").addClass("hidden");
});