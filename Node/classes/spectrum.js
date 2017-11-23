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
    }

    // Create the spectrum
    create(path1) {
        let self = this;
        let dataFile = fs.readFileSync(path1, 'ascii');
        fs.writeFileSync(`${self.fileName}.txt`, dataFile)
        console.log("Loaded");
        let dataLines = dataFile.split("\n");
        dataLines = dataLines.filter( x => x && x != "" && x != " ");
        let xData = dataLines.map(x => x.split(" ")[0] * 1);
        let yData = dataLines.map(x => x.split(" ")[1] * 1);
        let xString = "";
        // Draw the fit for x data
        self.drawFitGraph(xData, yData);

    }

    saveData() {
        let self = this;
        let dataFile = fs.readFileSync(`${self.fileName}.txt`, 'ascii');
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
            dtick: Math.round(xData.length / 16)
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

        // SCOMMENTARE
        // SCOMMENTARE
        // SCOMMENTARE
        // SCOMMENTARE
        // SCOMMENTARE
        // SCOMMENTARE
        // SCOMMENTARE
        // SCOMMENTARE
        // SCOMMENTARE
        // self.dataVis.on('plotly_click', (eventData) => {
        //     self.newPeakPoint(eventData.points[0].x, eventData.points[0].y);
        // });

    }

    ///////////////////////////////////////////
    // SONO ARRIVATO QUI
    // SONO ARRIVATO QUI
    // SONO ARRIVATO QUI
    // SONO ARRIVATO QUI
    // SONO ARRIVATO QUI
    // SONO ARRIVATO QUI
    // SONO ARRIVATO QUI
    // SONO ARRIVATO QUI
    // SONO ARRIVATO QUI
    ////////////////////////////////////////////

    // Invert the axes of the matrix
    invertAxes() {
        let numeroCanaliX = $("#nCanaliX").val() || 1000;
        let numeroCanaliY = $("#nCanaliY").val() || 1000;
        let xAxisTemplate = {
            range: [0, numeroCanaliX],
            showgrid: true,
            zeroline: true,
            linecolor: 'black',
            showticklabels: true,
            ticks: ''
        };
        let yAxisTemplate = {
            range: [0, numeroCanaliY],
            showgrid: true,
            zeroline: true,
            linecolor: 'black',
            showticklabels: true,
            ticks: ''
        };
        let placeholder = this.dataVis.data[0].x;
        this.dataVis.data[0].x = this.dataVis.data[0].y;
        this.dataVis.data[0].y = placeholder;
        this.dataVis.layout = {
            xaxis: yAxisTemplate,
            yaxis: xAxisTemplate,
            dragmode: 'select',
            autosize: false,
            height: this.getDimensions()[0] * 80 / 100,
            width: this.getDimensions()[1] - 300
        };
        Plotly.redraw(dataVis);
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

    // reutrn the real channel
    toChannel(x, interval, min) {
        return Math.floor(x * interval + min);
    }
    // return the graph channel
    fromChannel(x, interval, min) {
        return Math.floor((x - min) / interval);
    }

    // preview the background to remove

    previewBackground(fileName, randomPoints, iterations) {
        let self = this;
        let params;
        params = ["previewBackground", fileName, randomPoints, iterations];
        child(self.executablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err);
            let dataFile = fs.readFileSync(`${fileName}_bgpreview.txt`, 'ascii');
            console.log("Loaded background removal");
            let dataLines = dataFile.split("\n");
            dataLines = dataLines.filter( x => x && x != "" && x != " ");
            let plotData = {};
            for (let i = 0; i < dataLines.length; i++) {
                plotData[i] = 0;
            }
            for (let i = 0; i < dataLines.length; i++) {
                let value = dataLines[i].split(" ")[0] * 1;
                let count = dataLines[i].split(" ")[1] * 1;
                if (!isNaN(count)) {
                    plotData[value] += count;
                }
            }
            plotData = Object.keys(plotData).map(key => plotData[key])
            // Draw the fit for x data
            let trace = {
                x: [...Array(plotData.length).keys()],
                y: plotData,
                type: 'bar',
                name: 'background',
                marker: {
                    color: 'rgb(179, 0, 0)'
                }
            };
            let vis = self.getVis();
            // Redraw the fit
            vis.data = [vis.data[0], trace];
            Plotly.redraw(vis);
        });
    }
    // remove the background from a plot
    background(fileName, randomPoints, iterations) {
        let self = this;
        let params;
        params = ["background", fileName, randomPoints, iterations];
        child(self.executablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err);
            let dataFile = fs.readFileSync(`${fileName}.txt`, 'ascii');
            console.log("Loaded background removal");
            let dataLines = dataFile.split("\n");
            dataLines = dataLines.filter( x => x && x != "" && x != " ");
            let plotData = {};
            for (let i = 0; i < dataLines.length; i++) {
                plotData[i] = 0;
            }
            for (let i = 0; i < dataLines.length; i++) {
                let value = dataLines[i].split(" ")[0] * 1;
                let count = dataLines[i].split(" ")[1] * 1;
                if (!isNaN(count)) {
                    plotData[value] += count;
                }
            }
            plotData = Object.keys(plotData).map(key => plotData[key])
            // Draw the fit for x data
            let trace = {
                x: [...Array(plotData.length).keys()],
                y: plotData,
                type: 'bar'
            };
            let data = [trace];
            let vis = self.getVis();
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
    autoPeaks(fileName, epsilon, treshold) {
        let self = this;
        let params;
        params = ["peaks", fileName, epsilon, treshold];
        child(self.executablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err);
            let dataFile = fs.readFileSync(`${fileName}_peaks.txt`, 'ascii');
            console.log("Loaded peaks");
            let dataLines = dataFile.split("\n");
            dataLines = dataLines.filter( x => x && x != "" && x != " ");
            let peaks = [];
            for (var line of dataLines) {
                var xValue = line.split(" ")[0];
                var yValue = line.split(" ")[1];
                if (xValue && yValue)
                    peaks.push([xValue * 1, yValue.split("\n")[0] * 1]);
            }
            console.log(peaks);
            $("div[id='foundPeaksBox" + fileName + "']").empty();
            $("div[id='foundPeaksBox" + fileName + "']").removeClass("hidden");
            let index = 1;
            let list = self.getPeaksList(true);
            $("div[id='foundPeaksBox" + fileName + "']").append(`<div type="button" data-filename="${fileName}" class="btn btn-default btn-sm pickSelector">Add more peaks manually</div></br></br>`);
            for (var peak of peaks) {

                let string =
                    `<div class="peakColor" data-filename="${fileName}" data-x="${peak[0]}" data-y="${peak[1]}"><b>x:</b> ${peak[0]} <b>y:</b>${peak[1]}</div>` +
                    `<div class="fitThisPeak" data-filename="${fileName}" data-x="${peak[0]}" data-y="${peak[1]}">Fit</div>`;
                $("div[id='foundPeaksBox" + fileName + "']").append(string);
                list.push([peak[0], peak[1]]);
                index++;
            }
            $(".peakColor").mouseover(function () {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                var fileName = selfSelector.data("filename");
                self.highlightPoint(x, y, fileName);
                console.log(self.getPeaksList());
            });
            $(".peakColor").mouseout(function () {
                var selfSelector = $(this);
                var fileName = selfSelector.data("filename");
                self.stopHighlight(fileName);
            });
            $(".peakColor").on("click", function (e) {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                var fileName = selfSelector.data("filename");
                let peakList = self.getPeaksList();
                peakList = peakList.filter(function (i) {
                    return i[0] != x && i[1] != y;
                });
                self.updatePeakList(peakList);
                selfSelector.remove();
                $(`.fitThisPeak[data-x="${x}"][data-y="${y}"][data-filename="${fileName}"]`).remove();
            });
            $(".fitThisPeak").on("click", function (e) {
                let selfSelector = $(this);
                let fileName = selfSelector.data("filename");
                let x = selfSelector.data("x");
                let y = selfSelector.data("y");
                self.prepareSingleCalibrating(fileName, x, y);
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
            $("div[id='foundPeaksBox']").append(string);

            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME            // TODO
            // TOGLIERE OGNI RIFERIMENTO A FILENAME

            $(".peakColor").mouseover(function () {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                var fileName = selfSelector.data("filename");
                self.highlightPoint(x, y, fileName);
                console.log(self.getPeaksList(fileName));
            });
            $(".peakColor").mouseout(function () {
                var selfSelector = $(this);
                var fileName = selfSelector.data("filename");
                self.stopHighlight(fileName);
            });
            $(".peakColor").on("click", function (e) {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                var fileName = selfSelector.data("filename");
                let peakList = self.getPeaksList();
                peakList = peakList.filter(function (i) {
                    return i[0] != x && i[1] != y;
                });
                self.updatePeakList(peakList);
                selfSelector.remove();
                $(`.fitThisPeak[data-x="${x}"][data-y="${y}"][data-filename="${fileName}"]`).remove();
            });
            $(".fitThisPeak").on("click", function (e) {
                let selfSelector = $(this);
                let fileName = selfSelector.data("filename");
                let x = selfSelector.data("x");
                let y = selfSelector.data("y");
                self.prepareSingleCalibrating(fileName, x, y);
                main.openCalibration();
            });
        } else return;
    }

    highlightPoint(x, y, fileName) {
        let vis = this.getVis();
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

    stopHighlight(fileName) {
        let vis = this.getVis();
        vis = this.backupVis;
        vis.layout.shapes = [];
        Plotly.redraw(vis);
    }

    getVis() {
        let vis;
        vis = self.dataVis;
        return vis;
    }

    getDimensions() {
        let h = $(window).height();
        let w = $(window).width();
        return [h, w];
    }

    /**
     * Aggiorna il file dei picchi da cui poi fare la calibrazione
     */
    prepareCalibrating(fileName) {
        let self = this;
        let list = self.getPeaksList();
        let str = "";
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
    prepareSingleCalibrating(fileName, x, y) {
        let self = this;
        let str = "";
        str += `${x} ${y}\n`
        fs.writeFile(`${fileName}_peaks.txt`, str, function (err) {
            if (err) {
                return console.log(err);
            }
            fs.createReadStream(`${fileName}.txt`).pipe(fs.createWriteStream('data/calibrating.txt'));
            fs.createReadStream(`${fileName}_peaks.txt`).pipe(fs.createWriteStream('data/calibrating_peaks.txt'));
        });
    }
}

module.exports = Spectrum;