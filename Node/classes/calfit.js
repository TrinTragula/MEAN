const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

var Calfit = class Calfit {

    constructor() {
        this.fileName = "calibrating";
        this.executablePath = "DataCruncher/DataCruncher.exe";
        this.peaks = [];
        this.area = [];
        this.centroid = [];
        this.sigma = [];
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

        for (var index in peaks) {
            this.area[index] = 0;
            this.centroid[index] = 0;
            this.sigma[index] = 0;
        }
        let fittingString = "<tr>";
        fittingString += `<td data-peak="all" class="clicktofit btn btn-fitting">Fit all</td>`
        for (var index in peaks) {
            fittingString += `<td data-peak="${index}" class="clicktofit btn btn-fitting">Click to fit</td>`;
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
        self.peaks = peaks;
        $("#peaks").after(fittingString);
    }

    fit(peak) {
        let self = this;
        if (peak != "all") {
            self.doFit(peak);
        } else {
            for (var index in self.peaks) {
                self.doFit(index);
            }
        }
    }

    doFit(peak) {
        let self = this;
        let params = ["fit-peak", `${self.fileName}`, `${self.fileName}_peaks`, peak * 1, 5];
        child(self.executablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err);
            let dataFile = fs.readFileSync(`${self.fileName}_${peak}_fitData.txt`, 'ascii');
            console.log("Loaded fit data");
            let dataLines = dataFile.split(":");
            let area = dataLines[0];
            let centroid = dataLines[1];
            let sigma = dataLines[2];
            $(`#Area-${peak}`).text(area);
            self.area[peak] = area;
            $(`#Centroid-${peak}`).text(centroid);
            self.centroid[peak] = centroid;
            $(`#Sigma-${peak}`).text(sigma);
            self.sigma[peak] = sigma;
        });
    }
}

module.exports = Calfit;