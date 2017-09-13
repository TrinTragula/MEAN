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

    $("#calibrate-btn").on("click", function(e) {
        e.preventDefault();
        var self = $(this);
        calfit.calibrate();
    });


});