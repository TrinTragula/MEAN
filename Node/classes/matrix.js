const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

var Matrix = class Matrix {

    constructor(element, elementX, elementY, elementGate, executablePath, myColorScale, myInvertedColorScale) {
        // Local variables
        this.dataVis = element;
        this.xPlotVis = elementX;
        this.yPlotVis = elementY;
        this.gatePlotVis = elementGate;
        this.executablePath = executablePath;
        this.wasResetted = false;
        this.myColorScale = myColorScale;
        this.myInvertedColorScale = myInvertedColorScale;
        this.isPickingAllowed = false;
        this.gatingX = false;
        this.gatingY = false;
        this.interval;
        this.min;
        this.x1;
        this.x2;
        this.y1;
        this.y2;
        this.backupVis;
        this.gatePeaks = [];
        this.xPeaks = [];
        this.yPeaks = [];
    }

    // Create the matrix from an already built dataset
    create(nCanaliX, nCanaliY, path1, path2) {
        let self = this;
        let params = ["matrix", nCanaliX, nCanaliY];
        child(this.executablePath, params, function (err, fileData) {
            self.wasResetted = true;
            let dataFile = fs.readFileSync("result.txt", 'ascii');
            if (err) console.log("ERRORE: " + err)
            console.log("Loaded");
            let dataLines = dataFile.split("\n");
            let metaData = dataLines.shift().split(" ");
            self.interval = metaData[0];
            self.min = metaData[1];
            let xData = dataLines.map(x => x.split(" ")[0] * 1);
            let yData = dataLines.map(x => x.split(" ")[1] * 1);
            let zData = dataLines.map(x => x.split(" ")[2] * 1);
            let xFitData = {};
            let yFitData = {};
            for (let i = 0; i <= nCanaliX; i++) {
                xFitData[i] = 0;
            }
            for (let i = 0; i <= nCanaliY; i++) {
                yFitData[i] = 0;
            }
            for (let i = 0; i < dataLines.length; i++) {
                let xValue = dataLines[i].split(" ")[0] * 1;
                let yValue = dataLines[i].split(" ")[1] * 1;
                let zValue = dataLines[i].split(" ")[2] * 1;
                if (!isNaN(zValue)) {
                    xFitData[xValue] += zValue;
                    yFitData[yValue] += zValue;
                }
            }
            let xString = "";
            for (let key in xFitData) {
                let value = xFitData[key];
                xString = xString.concat(`${key} ${value}\r\n`);
            }
            let yString = "";
            for (let key in yFitData) {
                let value = yFitData[key];
                yString = yString.concat(`${key} ${value}\r\n`);
            }
            fs.writeFile("xResult.txt", xString, function (err) {
                if (err)
                    return console.log(err);
            });
            fs.writeFile("yResult.txt", yString, function (err) {
                if (err)
                    return console.log(err);
            });
            // Draw the fit for x data
            self.drawFitGraph(xFitData, "x");
            self.drawFitGraph(yFitData, "y");
            // I'll draw the matrix
            let data = [{
                x: xData,
                y: yData,
                z: zData,

                /*type: 'histogram2dcontour',
                line: {
                	width: 0
                },
                contours: {
                	coloring: 'heatmap'
                },*/
                type: 'heatmap',
                colorscale: self.myColorScale
            }];

            let layout = self.giveLayout(nCanaliX, nCanaliY);
            Plotly.newPlot(self.dataVis, data, layout, {
                displayModeBar: true
            });
            $(".modebar").addClass("hidden");
            // Logica di selezione
            self.dataVis.on('plotly_selected', (eventData) => {
                self.selecting(eventData, path1, path2)
            });
            self.dataVis.on('plotly_selecting', (eventData) => {
                $(".zoomlayer").removeClass("hidden");
            });
            $("#drawButton").html("Reset")
            $("#pickSelector").removeClass("hidden");
        });
    }

    // create the matrix from 2 txt files, which will build the dataset
    import (nCanaliX, nCanaliY, path1, path2, window = 5) {
        let self = this;
        let params = ["matrix", nCanaliX * 1, nCanaliY * 1, path1, path2, 0, 999999999, 0, 999999999, true, window];
        // Loading bar
        $("#loadingBar").removeClass("hidden");
        $(".progress-bar").animate({
            width: "100%",
        }, 120000);
        // Lancio il programma
        child(this.executablePath, params, function (err, fileData) {
            self.wasResetted = true;
            let dataFile = fs.readFileSync("result.txt", 'ascii');
            if (err) console.log("ERRORE: " + err)
            console.log("Loaded");
            let dataLines = dataFile.split("\n");
            let metaData = dataLines.shift().split(" ");
            self.interval = metaData[0];
            self.min = metaData[1];
            let xData = dataLines.map(x => x.split(" ")[0] * 1);
            let yData = dataLines.map(x => x.split(" ")[1] * 1);
            let zData = dataLines.map(x => x.split(" ")[2] * 1);
            // I'll draw the matrix
            let data = [{
                x: xData,
                y: yData,
                z: zData,

                /*type: 'histogram2dcontour',
                line: {
                	width: 0
                },
                contours: {
                	coloring: 'heatmap'
                },*/
                type: 'heatmap',
                colorscale: self.myColorScale
            }];

            let layout = self.giveLayout(nCanaliX, nCanaliY);
            Plotly.newPlot(dataVis, data, layout, {
                displayModeBar: true
            });
            $(".modebar").addClass("hidden");
            // Loading bar
            $("#loadingBar").addClass("hidden");
            $(".progress-bar").animate({
                width: "0%",
            }, 1);
            // Logica di selezione
            self.dataVis.on('plotly_selected', (eventData) => {
                self.selecting(eventData, path1, path2)
            });
            self.dataVis.on('plotly_selecting', (eventData) => {
                $(".zoomlayer").removeClass("hidden");
            });
            $("#drawButton").html("Reset");
            alert("Done!");
        });
    }

    // Draw the linear plots
    drawFitGraph(fitData, id) {
        let self = this;
        fitData = Object.keys(fitData).map(key => fitData[key]);
        let trace = {
            x: [...Array(fitData.length).keys()],
            y: fitData,
            type: 'scatter'
        };

        let xAxisTemplate = {
            title: 'Channel',
            showgrid: true,
            zeroline: true,
            showticklabels: true,
            ticks: '',
            dtick: Math.round(fitData.length / 16)
        };
        let yAxisTemplate = {
            title: 'Counts',
            showgrid: true,
            zeroline: true,
            showticklabels: true,
            ticks: '',
            dtick: Math.max.apply(null, fitData) / 16
        };
        let layout = {
            xaxis: xAxisTemplate,
            yaxis: yAxisTemplate,
            autosize: false,
            height: self.getDimensions()[0] * 80 / 100,
            width: self.getDimensions()[1] - 300
        };
        let data = [trace];
        if (id == "x") {
            Plotly.newPlot(self.xPlotVis, data, layout, {
                displayModeBar: true
            });
            $(".modebar").addClass("hidden");
            self.xPlotVis.on('plotly_click', (eventData) => {
                self.newPeakPoint(eventData.points[0].x, eventData.points[0].y, "xResult");
            });
        } else if (id == "y") {
            Plotly.newPlot(self.yPlotVis, data, layout, {
                displayModeBar: true
            });
            $(".modebar").addClass("hidden");
            self.yPlotVis.on('plotly_click', (eventData) => {
                self.newPeakPoint(eventData.points[0].x, eventData.points[0].y, "yResult");
            });
        }
    }

    // Give the layout to the graphs
    giveLayout(numeroCanaliX, numeroCanaliY) {
        let self = this;
        let xAxisTemplate = {
            title: 'ADC1',
            range: [0, numeroCanaliX],
            showgrid: true,
            zeroline: true,
            linecolor: 'black',
            showticklabels: true,
            ticks: ''
        };
        let yAxisTemplate = {
            title: 'ADC2',
            range: [0, numeroCanaliY],
            showgrid: true,
            zeroline: true,
            linecolor: 'black',
            showticklabels: true,
            ticks: ''
        };
        return {
            xaxis: xAxisTemplate,
            yaxis: yAxisTemplate,
            dragmode: 'select',
            autosize: false,
            height: self.getDimensions()[0] * 80 / 100,
            width: self.getDimensions()[1] - 300
        };
    }

    // Update the matrix plot
    updateMatrix(numeroCanaliX, numeroCanaliY, primoPath, secondoPath, useParameters = true, overwrite = false) {
        let self = this;
        let parameters;
        if (useParameters)
            parameters = ["matrix", numeroCanaliX, numeroCanaliY, primoPath, secondoPath, self.x1, self.x2, self.y1, self.y2, overwrite];
        else
            parameters = ["matrix", numeroCanaliX, numeroCanaliY];
        child(self.executablePath, parameters, function (err, data) {
            let dataFile = fs.readFileSync("result.txt", 'ascii');
            if (err) console.log("ERRORE: " + err)
            console.log("Loaded");
            let dataLines = dataFile.split("\n");
            let metaData = dataLines.shift().split(" ");
            let graphX1 = self.fromChannel(self.x1, self.interval, self.min);
            let graphX2 = self.fromChannel(self.x2, self.interval, self.min);
            let graphY1 = self.fromChannel(self.y1, self.interval, self.min);
            let graphY2 = self.fromChannel(self.y2, self.interval, self.min);
            self.interval = metaData[0] * 1;
            self.min = metaData[1] * 1;
            let xData = dataLines.map(x => x.split(" ")[0] * 1);
            let yData = dataLines.map(x => x.split(" ")[1] * 1);
            let zData = dataLines.map(x => x.split(" ")[2] * 1);
            self.dataVis.data[0].x = xData;
            self.dataVis.data[0].y = yData;
            self.dataVis.data[0].z = zData;
            self.dataVis.layout = self.giveLayout(numeroCanaliX, numeroCanaliY);
            Plotly.redraw(self.dataVis);
            $(".modebar").addClass("hidden");
        });
    }

    // Selecting the matrix zoom it with new values (don't lose precision)
    selecting(eventData, path1, path2) {
        let self = this;
        let nCanaliX = $("#nCanaliX").val() || 1000;
        let nCanaliY = $("#nCanaliY").val() || 1000;
        path1 = $("#path1").val() || path1;
        path2 = $("#path2").val() || path2;
        let xRange = eventData.range.x.map(x => this.toChannel(x, self.interval, self.min));
        let yRange = eventData.range.y.map(x => this.toChannel(x, self.interval, self.min));
        self.x1 = xRange[0];
        self.x2 = xRange[1];
        self.y1 = yRange[0];
        self.y2 = yRange[1];
        console.log(xRange, yRange);
        if (this.gatingX) {
            let canaliGating = Math.min($("#nCanaliGating").val(), $("#nCanaliX").val()) || 1000;
            self.doGating("x", canaliGating);
            self.gatingX = false;
            return;
        }
        if (this.gatingY) {
            let canaliGating = Math.min($("#nCanaliGating").val(), $("#nCanaliY").val()) || 1000;
            self.doGating("y", canaliGating);
            self.gatingY = false;
            return;
        }
        this.updateMatrix(nCanaliX, nCanaliY, path1, path2);
        $(".zoomlayer").addClass("hidden");
        self.wasResetted = false;
    }

    // Perform the gate on the selected interval
    doGating(id, nCanali) {
        let self = this;
        let params;
        if (id == "x")
            params = ["gate", id, self.x1, self.x2, nCanali];
        else if (id == "y")
            params = ["gate", id, self.y1, self.y2, nCanali];
        child(self.executablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err)
            let dataFile = fs.readFileSync("gating.txt", 'ascii');
            console.log("Loaded gating");
            let dataLines = dataFile.split("\n");
            let metaData = dataLines.shift().split(" ");
            self.interval = metaData[0];
            self.min = metaData[1];

            let gateData = {};
            for (let i = 0; i < nCanali; i++) {
                gateData[i] = 0;
            }
            for (let i = 0; i < dataLines.length; i++) {
                let value = dataLines[i].split(" ")[0] * 1;
                let count = dataLines[i].split(" ")[1] * 1;
                if (!isNaN(count)) {
                    gateData[value] += count;
                }
            }

            self.drawGatePlot(gateData);

        });
    }

    drawGatePlot(gateData) {
        let self = this;
        gateData = Object.keys(gateData).map(key => gateData[key])
        // Draw the fit for x data
        let trace = {
            x: [...Array(gateData.length).keys()],
            y: gateData,
            type: 'scatter'
        };

        let xAxisTemplate = {
            range: [0, gateData.length],
            title: 'Channel',
            showgrid: true,
            zeroline: true,
            showticklabels: true,
            ticks: '',
            dtick: Math.round(gateData.length / 16)
        };
        let yAxisTemplate = {
            range: [0, Math.max.apply(null, gateData)],
            title: 'Counts',
            showgrid: true,
            zeroline: true,
            showticklabels: true,
            ticks: '',
            dtick: Math.max.apply(null, gateData) / 16
        };
        let layout = {
            xaxis: xAxisTemplate,
            yaxis: yAxisTemplate,
            autosize: false,
            height: self.getDimensions()[0] * 80 / 100,
            width: self.getDimensions()[1] - 300
        };
        let data = [trace];
        Plotly.newPlot(self.gatePlotVis, data, layout, {
            displayModeBar: true
        });
        $("#gateTab").removeClass("hidden");
        $(".active").removeClass("active");
        $("#gateTab").addClass("active");
        $("#gate").addClass("in active");
        $(".modebar").addClass("hidden");
        $("#gatingSlider").addClass("hidden");
        self.gatePlotVis.on('plotly_click', (eventData) => {
            self.newPeakPoint(eventData.points[0].x, eventData.points[0].y, "gating");
        });
    }

    // Reset the colorscale of the matrix
    colorscale() {
        this.dataVis.data[0].colorscale = this.myColorScale;
        Plotly.redraw(dataVis);
    }
    // Invert the colorscale of the matrix
    invertColorscale() {
        this.dataVis.data[0].colorscale = this.myInvertedColorScale;
        Plotly.redraw(dataVis);
    }

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
            let vis = self.getVis(fileName);
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
                type: 'scatter'
            };
            let data = [trace];
            let vis = self.getVis(fileName);
            // Redraw the fit
            vis.data = data;
            Plotly.redraw(vis);
        });
    }

    // Get peaks list by file name
    getListByFilename(fileName, reset = false) {
        var self = this;
        switch (fileName) {
            case "xResult":
                if (reset)
                    self.xPeaks = [];
                return self.xPeaks;
                break;
            case "yResult":
                if (reset)
                    self.yPeaks = [];
                return self.yPeaks;
                break;
            case "gating":
                if (reset)
                    self.gatePeaks = [];
                return self.gatePeaks;
                break;
            default:
                return;
                break;
        }
    }

    // Update  alist of peaks by file name
    updateListByfileName(fileName, peakList) {
        let self = this;
        switch (fileName) {
            case "xResult":
                self.xPeaks = peakList;
                break;
            case "yResult":
                self.yPeaks = peakList;
                break;
            case "gating":
                self.gatePeaks = peakList;
                break;
            default:
                return;
                break;
        }
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
            let peaks = [];
            for (var line of dataLines) {
                var xValue = line.split(" ")[0];
                var yValue = line.split(" ")[1];
                if (xValue && yValue)
                    peaks.push([xValue * 1, yValue.split("\n")[0] * 1]);
            }
            console.log(peaks);
            $("#foundPeaksBox" + fileName).empty();
            $("#foundPeaksBox" + fileName).removeClass("hidden");
            let index = 1;
            let list = self.getListByFilename(fileName, true);
            $("#foundPeaksBox" + fileName).append(`<div type="button" data-filename="${fileName}" class="btn btn-default btn-sm pickSelector">Add more peaks manually</div></br></br>`);
            for (var peak of peaks) {

                let string =
                    `<div class="peakColor" data-filename="${fileName}" data-x="${peak[0]}" data-y="${peak[1]}"><b>x:</b> ${peak[0]} <b>y:</b>${peak[1]}</div>`
                $("#foundPeaksBox" + fileName).append(string);
                list.push([peak[0], peak[1]]);
                index++;
            }
            $(".peakColor").mouseover(function () {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                var fileName = selfSelector.data("filename");
                self.highlightPoint(x, y, fileName);
                console.log(self.getListByFilename(fileName));
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
                let peakList = self.getListByFilename(fileName);
                peakList = peakList.filter(function (i) {
                    return i[0] != x && i[1] != y;
                });
                self.updateListByfileName(fileName, peakList);
                selfSelector.remove();
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
    newPeakPoint(x, y, fileName) {
        let self = this;
        let list = self.getListByFilename(fileName);
        console.log(self.isPickingAllowed);
        if (self.isPickingAllowed) {
            list.push([x, y]);
            let string =
                `<div class="peakColor" data-filename="${fileName}" data-x="${x}" data-y="${y}"><b>x:</b> ${x} <b>y:</b>${y}</div>`
            $("#foundPeaksBox" + fileName).append(string);
            $(".peakColor").mouseover(function () {
                var selfSelector = $(this);
                var x = selfSelector.data("x");
                var y = selfSelector.data("y");
                var fileName = selfSelector.data("filename");
                self.highlightPoint(x, y, fileName);
                console.log(self.getListByFilename(fileName));
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
                let peakList = self.getListByFilename(fileName);
                peakList = peakList.filter(function (i) {
                    return i[0] != x && i[1] != y;
                });
                self.updateListByfileName(fileName, peakList);
                selfSelector.remove();
            });
        } else return;
    }

    // binning
    plotBinning(fileName, binningNo) {
        let self = this;
        let params = ["binning", fileName, binningNo];
        child(self.executablePath, params, function (err, fileData) {
            if (err) console.log("ERRORE: " + err)
            let dataFile = fs.readFileSync(`${fileName}.txt`, 'ascii');
            console.log("Loaded gating");
            let dataLines = dataFile.split("\n");

            let binData = {};
            for (let i = 0; i < dataLines.length; i++) {
                binData[i] = 0;
            }
            for (let i = 0; i < dataLines.length; i++) {
                let value = dataLines[i].split(" ")[0] * 1;
                let count = dataLines[i].split(" ")[1] * 1;
                if (!isNaN(count)) {
                    binData[value] += count;
                }
            }
            if (fileName == "xResult") {
                self.drawFitGraph(binData, "x")
            } else if (fileName == "yResult") {
                self.drawFitGraph(binData, "y")
            } else if (fileName == "gating") {
                self.drawGatePlot(binData)
            }
        });
    }

    highlightPoint(x, y, fileName) {
        let vis = this.getVis(fileName);
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
        let vis = this.getVis(fileName);
        vis = this.backupVis;
        vis.layout.shapes = [];
        Plotly.redraw(vis);
    }

    getVis(fileName) {
        let vis;
        //determine the vis
        switch (fileName) {
            case "xResult":
                vis = self.xPlotVis;
                break;
            case "yResult":
                vis = self.yPlotVis;
                break;
            case "gating":
                vis = self.gatePlotVis;
                break;
            default:
                break;
        }
        return vis;
    }

    getDimensions() {
        let h = $(window).height();
        let w = $(window).width();
        return [h, w];
    }

    prepareCalibrating(fileName){
        fs.createReadStream(`${fileName}.txt`).pipe(fs.createWriteStream('calibrating.txt'));
        fs.createReadStream(`${fileName}_peaks.txt`).pipe(fs.createWriteStream('calibrating_peaks.txt'));
    }
}

module.exports = Matrix;