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
    import (nCanaliX, nCanaliY, path1, path2) {
        let self = this;
        let params = ["matrix", nCanaliX * 1, nCanaliY * 1, path1, path2, 0, 999999999, 0, 999999999, true];
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
                self.selecting(eventdata, path1, path2)
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
            type: 'bar'
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
            yaxis: yAxisTemplate
        };
        let data = [trace];
        if (id == "x") {
            Plotly.newPlot(self.xPlotVis, data, layout, {
                displayModeBar: true
            });
            $(".modebar").addClass("hidden");
            self.xPlotVis.on('plotly_click', (eventData) => {
                self.newPeakPoint(eventData.points[0].x, eventData.points[0].x);
            });
        } else if (id == "y") {
            Plotly.newPlot(self.yPlotVis, data, layout, {
                displayModeBar: true
            });
            $(".modebar").addClass("hidden");
        }
    }
    // adds a peak point to the list
    newPeakPoint(x, y) {
        if (this.isPickingAllowed) {
            $("#selectedPeaksBoxTitle").append("<div>X: " + x + " Y: " + y + "</div>");
        } else return;
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
            dragmode: 'select'
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
            self.doGating("x", nCanaliX);
            self.gatingX = false;
            return;
        }
        if (this.gatingY) {
            self.doGating("y", nCanaliY);
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
            gateData = Object.keys(gateData).map(key => gateData[key])
            // Draw the fit for x data
            let trace = {
                x: [...Array(gateData.length).keys()],
                y: gateData,
                type: 'bar'
            };

            let xAxisTemplate = {
                range: [0, nCanali],
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
                yaxis: yAxisTemplate
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
            dragmode: 'select'
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
                type: 'bar'
            };
            let data = [trace];
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
            // Redraw the fit
            vis.data = data;
            Plotly.redraw(vis);
        });
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
                    peaks.push([xValue, yValue]);
            }
            console.log(peaks);
            $("#foundPeaksBox" + fileName).empty();
            $("#foundPeaksBox" + fileName).removeClass("hidden");
            var index = 1;
            for (var peak of peaks) {
                $("#foundPeaksBox" + fileName).append(`<b>${index})</b>   <b>x:</b> ${peak[0]} <b>y:</b>${peak[1]} </br>`);
                index++;
            }
        });
    }
}

module.exports = Matrix;