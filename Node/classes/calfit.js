const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

var Calfit = class Calfit {

    constructor() {
        this.fileName = "data/calibrating";
        this.pyExecutablePath = "python";
        this.executablePath = "DataCruncher/DataCruncher.exe";
        this.peaks = [];
        this.area = [];
        this.centroid = [];
        this.sigma = [];
        this.q = 0;
        this.m = 0;
        this.m2 = 0;
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
        let peaksString = peaks.length > 0 ? "<th></th>" : "";
        for (var peak of peaks) {
            peaksString += `<th class="boxth">x: ${peak[0]} - y:${peak[1]}</th>`;
        }
        $("#peaks").html(peaksString);

        let windowsString = peaks.length > 0 ? "<th class='boxth'>Window</th>" : "";
        for (var index in peaks) {
            windowsString += `<th class="boxth"><input style='width:100%;' id="${index}-calibration-window" type="number" value="10"/></th>`;
        }
        $("#windows").html(windowsString);

        for (var index in peaks) {
            this.area[index] = 0;
            this.centroid[index] = 0;
            this.sigma[index] = 0;
        }
        self.peaks = peaks;

        let fittingString = "";
        let calibrationString = "";
        if (peaks.length > 0) {
            fittingString = "<tr>";
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

            calibrationString = "<tr>";
            calibrationString += `<td class="box">Energy for calibration</td>`
            for (var index in peaks) {
                calibrationString += `<td class="box"><input id="calibration-${index}" class="calibration-energy" data-index="${index}" type="number" style="width: 100%;"/></td>`;
            }
            calibrationString += "</tr>";

            calibrationString += "<tr>";
            calibrationString += `<td class="box">Element discovery</td>`
            for (var index in peaks) {
                calibrationString += `<td class="box"><input id="discovery-${index}" class="discovery-energy" data-index="${index}" type="checkbox"/></td>`;
            }
            calibrationString += "</tr>";
        }

        // In inverse order since it's last first
        $("#windows").after(calibrationString);
        $("#windows").after(fittingString);
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
        let windowValue = $("#" + peak + "-calibration-window").val();
        let window = isNaN(windowValue) ? 5 : windowValue * 1;
        let params = ["py/gauss.py", `${self.fileName}.txt`, `${self.fileName}_peaks.txt`, peak * 1, window];
        console.log(self.pyExecutablePath + " " + params.join(" ") + " called.");
        child(self.pyExecutablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err);
            let dataFile = fs.readFileSync(`${self.fileName}_${peak}_fitData.txt`, 'ascii');
            console.log("Loaded fit data");
            let dataLines = dataFile.split(":");
            let area = dataLines[0] * 1;
            let centroid = dataLines[1] * 1;
            let sigma = dataLines[2] * 1;
            $(`#Area-${peak}`).text(area.toFixed(4));
            self.area[peak] = area;
            $(`#Centroid-${peak}`).text(centroid.toFixed(4));
            self.centroid[peak] = centroid;
            $(`#Sigma-${peak}`).text(sigma.toFixed(4));
            self.sigma[peak] = sigma;
        });
    }

    calibrate() {
        let self = this;
        let calibrationData = [];
        for (let index in self.centroid) {
            let energyVal = $(`#calibration-${index}`).val();
            let centroid = self.centroid[index];
            let area = self.area[index];
            if (!isNaN(energyVal) && !isNaN(centroid) && energyVal && energyVal != "" && centroid && centroid != "") {
                let energy = energyVal * 1;
                // console.log("Index:" + index);
                // console.log("Value:" + energy);
                // console.log("Area:" + area);
                // console.log("Centroid:" + self.centroid[index]);
                calibrationData.push(`${energy} ${area} ${centroid}`);
            }
        }
        let dtoFile = "data/calibration_dto";
        let fileString = calibrationData.reduce((p, c) => {
            p += `${c}\r\n`;
            return p;
        }, "");
        let isSecondOrder = $("#isSecondOrder").is(":checked");
        fs.writeFile(`${dtoFile}.txt`, fileString, function (err) {
            if (err)
                return console.log(err);
            let params = ["calibrate", dtoFile, `${isSecondOrder}`];
            child(self.executablePath, params, function (err, fileData) {
                if (err) console.log("ERRORE: " + err);
                let dataFile = fs.readFileSync(`data/last.calibration`, 'ascii');
                console.log("Loaded calibration data");
                let dataLines = dataFile.split(" ");
                let q = dataLines[0] * 1;
                let m = dataLines[1] * 1;
                let m2 = dataLines[2] * 1;
                self.q = q;
                self.m = m;
                self.m2 = m2;
                $("#qu").text(q.toFixed(4));
                $("#emme").text(m.toFixed(4));
                $("#emme2").text(m2.toFixed(4));
            });
        });
    }

    calibrateFromFile(filePath) {
        let self = this;
        if (filePath) {
            let dataFile = fs.readFileSync(filePath, 'ascii');
            console.log("Loaded calibration data");
            let dataLines = dataFile.split(" ");
            let q = dataLines[0] * 1;
            let m = dataLines[1] * 1;
            let m2 = dataLines[2] * 1;
            self.q = q;
            self.m = m;
            self.m2 = m2;
            $("#qu").text(q.toFixed(4));
            $("#emme").text(m.toFixed(4));
            $("#emme2").text(m2.toFixed(4));
        }
    }

    applyCalibrationToData() {
        let self = this;
        if (self.q == 0 && self.m == 0 && self.m2 == 0) {
            alert("Parametri di calibrazione non trovati");
            return;
        }
        main.calibrateAllData(self.q, self.m, self.m2);

        // Cambia i valori della tabella Matrix in SQLLite
        // let params = ["substitute", self.q, self.m, self.m2];
        // child(self.executablePath, params, function (err, fileData) {
        //     console.log("Calibration substitution done!");
        // });
    }

    discovery() {
        let self = this;
        let discoveryData = [];
        let error = 0;
        for (let index in self.centroid) {
            let isChecked = $(`#discovery-${index}`).is(":checked");
            let centroid = self.centroid[index];
            let sigma = Math.abs(self.sigma[index]);
            if (isChecked && !isNaN(centroid) && centroid && centroid != "") {
                console.log("Index:" + index);
                console.log("Sigma:" + sigma);
                console.log("Centroid:" + self.centroid[index]);
                if (sigma > error) error = sigma;
                discoveryData.push(Math.round(centroid));
            }
        }
        error = Math.ceil(error);
        console.log("Error: " + error);
        main.openToi(discoveryData, error);
    }
}
module.exports = Calfit;