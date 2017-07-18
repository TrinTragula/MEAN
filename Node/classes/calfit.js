const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

var Calfit = class Calfit {

    constructor() {
        this.fileName = "calibrating"
    }

    populatePeaks() {
        let self = this;
        let dataFile = fs.readFileSync(`${self.fileName}_peaks.txt`, 'ascii');
        let dataLines = dataFile.split("\n");
        let peaks = [];
        for (var line of dataLines) {
            var xValue = line.split(" ")[0];
            var yValue = line.split(" ")[1];
            if (xValue && yValue)
                peaks.push([xValue * 1, yValue.split("\n")[0] * 1]);
        }
        let peaksString = "<th></th>";
        for (var peak of peaks) {
            peaksString += `<th class="boxth">x: ${peak[0]} - y:${peak[1]}</th>`;
        }
        $("#peaks").html(peaksString);

        let fittingString = "<tr>";
        fittingString += `<td id="ClikToFit-all" class="btn btn-fitting">Fit all</td>`
        for (var index in peaks) {
            fittingString += `<td id="ClikToFit-${index}" class="btn btn-fitting">Click to fit</td>`;
        }        
        fittingString += "</tr><tr>";
        fittingString += `<td class="box">Area</td>`
        for (var index in peaks) {
            fittingString += `<td id="Area-${index}" class="box"></td>`;
        }
        fittingString += "</tr><tr>";
        fittingString += `<td class="box">Centroid</td>`
        for (var index in peaks) {
            fittingString += `<td id="Centroid-${index}" class="box"></td>`;
        }
        fittingString += "</tr><tr>";
        fittingString += `<td class="box">Sigma</td>`
        for (var index in peaks) {
            fittingString += `<td id="Sigma-${index}" class="box"></td>`;
        }
        fittingString += "</tr>";
        console.log(fittingString);
        $("#peaks").after(fittingString);
    }
}

module.exports = Calfit;