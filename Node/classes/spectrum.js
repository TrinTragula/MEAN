const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

var Spectrum = class Spectrum {

    constructor(element, executablePath) {
        // Local variables
        this.dataVis = element;
        this.executablePath = executablePath;
        this.wasResetted = false;
        this.isPickingAllowed = false;
        this.fileName = "data/spectrum";
        this.x1;
        this.x2;
        this.y1;
        this.y2;
        this.backupVis;
        this.peaks = [];

        if (!fs.existsSync("data")){
            fs.mkdirSync(dir);
        }
    }

    // Create the spectrum
    create(path1) {
        let self = this;
        let dataFile = fs.readFileSync(path1, 'ascii');
        console.log("Loaded");
        let dataLines = dataFile.split("\n");
        dataLines = dataLines.filter(x => x && x != "" && x != " ");

        //let newStringFile = self.buildFile(dataLines);
        let newStringFile = dataLines.join("\n");
        
        fs.writeFileSync(`${self.fileName}.txt`, newStringFile);
        dataLines = newStringFile.split("\n");

        let xData = dataLines.map(x => x.split(" ")[0] * 1);
        let yData = dataLines.map(x => x.split(" ")[1] * 1);
        let xString = "";
        // Draw the fit for x data
        self.drawFitGraph(xData, yData);

    }

    // Obsoleto, funzionava solo coi canali
    buildFile(dataLines) {
        let xData = dataLines.map(x => x.split(" ")[0] * 1);
        let yData = dataLines.map(x => x.split(" ")[1] * 1);
        let length = Math.max.apply(null, xData) + 1;
        let string = "";
        let fileCursor = 0;
        for (let i = 0; i < length; i++) {
            if (xData[fileCursor] == i) {
                string += `${i} ${yData[fileCursor]}`;
                fileCursor++;
            } else {
                string += `${i} 0`;
            }
            string += "\r\n";
        }
        return string;
    }

    saveData() {
        let self = this;
        let data = self.dataVis.data[0];
        let i = 0;
        let dataFile = data.x.reduce((p, c) => {
            p += `${c} ${data.y[i]}\r\n`;
            ++i;
            return p;
        }, "");
        main.saveData(dataFile);
    }

    // Draw the linear plots
    drawFitGraph(xData, yData) {
        let self = this;
        let trace = {
            x: xData,
            y: yData,
            type: 'bar'
        };

        let xAxisTemplate = {
            title: 'X',
            showgrid: true,
            zeroline: true,
            showticklabels: true,
            ticks: '',
            dtick: Math.max.apply(null, xData) / 16
        };
        let yAxisTemplate = {
            title: 'Counts',
            showgrid: true,
            zeroline: true,
            showticklabels: true,
            ticks: '',
            dtick: Math.max.apply(null, yData) / 16
        };
        let layout = {
            xaxis: xAxisTemplate,
            yaxis: yAxisTemplate,
            autosize: false,
            height: self.getDimensions()[0] * 80 / 100,
            width: self.getDimensions()[1] - 300
        };
        let data = [trace];
        Plotly.newPlot(self.dataVis, data, layout, {
            displayModeBar: true
        });
        $(".modebar").addClass("hidden");

        self.dataVis.on('plotly_click', (eventData) => {
            self.newPeakPoint(eventData.points[0].x, eventData.points[0].y);
        });
    }

    // Function which behaves like python's Range()
    range(start, stop, step) {
        if (typeof stop == 'undefined') {
            stop = start;
            start = 0;
        }
        if (typeof step == 'undefined') {
            step = 1;
        }
        if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
            return [];
        }
        var result = [];
        for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
            result.push(i);
        }
        return result;
    };

    // preview the background to remove

    previewBackground(randomPoints, iterations) {
        let self = this;
        let params;
        let fileName = self.fileName;
        params = ["previewBackgroundSpectrum", fileName, randomPoints, iterations];
        child(self.executablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err);
            let dataFile = fs.readFileSync(`${fileName}_bgpreview.txt`, 'ascii');
            console.log("Loaded background removal");
            let dataLines = dataFile.split("\n");
            dataLines = dataLines.filter(x => x && x != "" && x != " ");
            let xData = dataLines.map(x => x.split(" ")[0] * 1);
            let yData = dataLines.map(x => x.split(" ")[1] * 1);
            // Draw the fit for x data
            let trace = {
                x: xData,
                y: yData,
                type: 'scatter',
                name: 'background',
                marker: {
                    color: 'rgb(179, 0, 0)'
                },
                fill: 'tozeroy'
            };
            let vis = self.dataVis;
            // Redraw the fit
            vis.data = [vis.data[0], trace];
            Plotly.redraw(vis);
        });
    }
    // remove the background from a plot
    background(randomPoints, iterations) {
        let self = this;
        let params;
        let fileName = self.fileName;
        params = ["backgroundSpectrum", fileName, randomPoints, iterations];
        child(self.executablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err);
            let dataFile = fs.readFileSync(`${fileName}.txt`, 'ascii');
            console.log("Loaded background removal");
            let dataLines = dataFile.split("\n");
            dataLines = dataLines.filter(x => x && x != "" && x != " ");
            let xData = dataLines.map(x => x.split(" ")[0] * 1);
            let yData = dataLines.map(x => x.split(" ")[1] * 1);
            // Draw the fit for x data
            let trace = {
                x: xData,
                y: yData,
                type: 'bar'
            };
            let data = [trace];
            let vis = self.dataVis;
            // Redraw the fit
            vis.data = data;
            Plotly.redraw(vis);
        });
    }

    // Get peaks list by file name
    getPeaksList(reset = false) {
        var self = this;
        if (reset)
            self.peaks = [];
        return self.peaks;
    }

    // Update  alist of peaks by file name
    updatePeakList(peakList) {
        let self = this;
        self.xPeaks = peakList;
    }

    // Automatically get peaks from a plot
    autoPeaks(epsilon, treshold) {
        let self = this;
        let params;
        let fileName = self.fileName;
        params = ["peaksSpectrum", fileName, epsilon, treshold];
        child(self.executablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err);
            let dataFile = fs.readFileSync(`${fileName}_peaks.txt`, 'ascii');
            console.log("Loaded peaks");
            let dataLines = dataFile.split("\n");
            dataLines = dataLines.filter(x => x && x != "" && x != " ");
            let peaks = [];
            for (var line of dataLines) {
                var xValue = line.split(" ")[0];
                var yValue = line.split(" ")[1];
                if (xValue && yValue)
                    peaks.push([xValue * 1, yValue.split("\n")[0] * 1]);
            }
            console.log(peaks);
            $("#foundPeaksBox").empty();
            $("#foundPeaksBox").removeClass("hidden");
            let index = 1;
            let list = self.getPeaksList(true);
            $("#foundPeaksBox").append(`<div type="button" class="btn btn-default btn-sm pickSelector">Add more peaks manually</div></br></br>`);
            for (var peak of peaks) {

                let string =
                    `<div class="peakColor" data-x="${peak[0]}" data-y="${peak[1]}"><b>x:</b> ${peak[0]} <b>y:</b>${peak[1]}</div>` +
                    `<div class="fitThisPeak" data-x="${peak[0]}" data-y="${peak[1]}">Fit</div>`;
                $("#foundPeaksBox").append(string);
                list.push([peak[0], peak[1]]);
                index++;
            }
            $(".peakColor").mouseover(function () {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                self.highlightPoint(x, y);
            });
            $(".peakColor").mouseout(function () {
                var selfSelector = $(this);
                self.stopHighlight();
            });
            $(".peakColor").on("click", function (e) {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                let peakList = self.getPeaksList();
                peakList = peakList.filter(function (i) {
                    return i[0] != x && i[1] != y;
                });
                self.updatePeakList(peakList);
                selfSelector.remove();
                $(`.fitThisPeak[data-x="${x}"][data-y="${y}"]`).remove();
            });
            $(".fitThisPeak").on("click", function (e) {
                let selfSelector = $(this);
                let x = selfSelector.data("x");
                let y = selfSelector.data("y");
                self.prepareSingleCalibrating(x, y);
                main.openCalibration();
            });

            // Selezione picchi
            $(".pickSelector").on("click", function (e) {
                let selfSelector = $(this);
                if (selfSelector.html() == "Add more peaks manually") {
                    self.isPickingAllowed = true;
                    selfSelector.html("Stop adding peaks");
                } else {
                    self.isPickingAllowed = false;
                    selfSelector.html("Add more peaks manually");
                }
            });
        });
    }

    // adds a peak point to the list
    newPeakPoint(x, y) {
        let self = this;
        let list = self.getPeaksList();
        console.log(self.isPickingAllowed);
        if (self.isPickingAllowed) {
            list.push([x, y]);
            let string =
                `<div class="peakColor" data-x="${x}" data-y="${y}"><b>x:</b> ${x} <b>y:</b>${y}</div>` +
                `<div class="fitThisPeak" data-x="${x}" data-y="${y}">Fit</div>`;
            $("#foundPeaksBox").append(string);

            $(".peakColor").mouseover(function () {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                self.highlightPoint(x, y);
                console.log(self.getPeaksList(fileName));
            });
            $(".peakColor").mouseout(function () {
                self.stopHighlight();
            });
            $(".peakColor").on("click", function (e) {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                let peakList = self.getPeaksList();
                peakList = peakList.filter(function (i) {
                    return i[0] != x && i[1] != y;
                });
                self.updatePeakList(peakList);
                selfSelector.remove();
                $(`.fitThisPeak[data-x="${x}"][data-y="${y}"]`).remove();
            });
            $(".fitThisPeak").on("click", function (e) {
                let selfSelector = $(this);
                let x = selfSelector.data("x");
                let y = selfSelector.data("y");
                self.prepareSingleCalibrating(x, y);
                main.openCalibration();
            });
        } else return;
    }

    highlightPoint(x, y) {
        let vis = this.dataVis;
        let fileName = this.fileName;
        console.log(x, y, fileName);
        let backupVis = vis;
        /*
        vis.layout.shapes = [{
            type: 'square',
            xref: 'x',
            yref: 'y',
            x0: x - 2,
            y0: 1,
            x1: x + 2,
            y1: y,
            fillcolor: '#ffff00',
            opacity: 1,
            line: {
                width: 1
            }
        }]*/

        var trace = {
            x: [x],
            y: [y],
            mode: 'markers+text',
            name: 'Peaks',
            text: [`x:${x} y:${y}`],
            textposition: 'top',
            type: 'scatter',
            textfont: {
                size: 15
            }
        };

        vis.data = [vis.data[0], trace];
        Plotly.redraw(vis);
        this.backupVis = backupVis;
    }

    stopHighlight() {
        let vis = this.dataVis;
        vis = this.backupVis;
        vis.layout.shapes = [];
        Plotly.redraw(vis);
    }

    getDimensions() {
        let h = $(window).height();
        let w = $(window).width();
        return [h, w];
    }

    /**
     * Aggiorna il file dei picchi da cui poi fare la calibrazione
     */
    prepareCalibrating() {
        let self = this;
        let list = self.getPeaksList();
        let str = "";
        let fileName = self.fileName;
        for (var l of list) {
            str += `${l[0]} ${l[1]}\n`
        }
        fs.writeFile(`${fileName}_peaks.txt`, str, function (err) {
            if (err) {
                return console.log(err);
            }
            fs.createReadStream(`${fileName}.txt`).pipe(fs.createWriteStream('data/calibrating.txt'));
            fs.createReadStream(`${fileName}_peaks.txt`).pipe(fs.createWriteStream('data/calibrating_peaks.txt'));
        });
    }

    /**
     * Aggiorna il file dei picchi da cui poi fare la calibrazione per picchi singoli
     */
    prepareSingleCalibrating(x, y) {
        let self = this;
        let str = "";
        let fileName = self.fileName;
        str += `${x} ${y}\n`
        fs.writeFile(`${fileName}_peaks.txt`, str, function (err) {
            if (err) {
                return console.log(err);
            }
            fs.createReadStream(`${fileName}.txt`).pipe(fs.createWriteStream('data/calibrating.txt'));
            fs.createReadStream(`${fileName}_peaks.txt`).pipe(fs.createWriteStream('data/calibrating_peaks.txt'));
        });
    }

    /**
     * Pulisce lo stato della fienstra
     */
    reset() {
        $("#foundPeaksBox").empty();
        $("#foundPeaksBox").addClass("hidden");
    }
}

module.exports = Spectrum;