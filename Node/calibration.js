const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const Matrix = require('./classes/matrix');
const Calfit = require('./classes/calfit');
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

let calfit = new Calfit();

$(function () {
    calfit.populatePeaks();

    $(".clicktofit").on("click", function (e) {
        e.preventDefault();
        var self = $(this);
        var peak = self.data("peak");
        calfit.fit(peak);
    });

    $("#calibrate-btn").on("click", function (e) {
        e.preventDefault();
        var self = $(this);
        calfit.calibrate();
    });

    $("#discovery-btn").on("click", function (e) {
        e.preventDefault();
        var self = $(this);
        calfit.discovery();
    });

    $("#file-calibration").on("change", function () {
        let filePath = $("#file-calibration")[0].files[0].path;
        if (filePath && filePath != "") {
            calfit.calibrateFromFile(filePath);
        }
    });

    $("#apply-data").on("click", function () {
        calfit.applyCalibrationToData();
        window.close();
    });

    $("#save-calibration-data").on("click", function () {
        let filePath = $("#file-calibration")[0].files[0] ? $("#file-calibration")[0].files[0].path : "data/last.calibration";
        let content = fs.readFileSync(filePath);
        main.saveData(content);
    });
});