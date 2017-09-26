const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const Matrix = require('./classes/matrix');
const d3 = Plotly.d3;
const formatter = d3.format('.2f');
const Toi = require('./classes/toi');

function appendLineToTable(line, element) {
    var stringToAppend = `<td class="box">${line.Energy}</td><td class="box">${isNaN(line.Intensity) ? "-" : line.Intensity}</td><td class="box">${line.Element}</td><td class="box">${line.Decay}</td>`;
    element.append(stringToAppend);
}

$(function () {
    $("#searchtoi").on("click", function (e) {
        e.preventDefault();
        var self = $(this);
        var from = $("#from").val();
        var to = $("#to").val();
        if (from) {
            from = from * 1;
            $("#toiTable").empty();
            console.log(from);
            to = to ? to * 1 : from;
            Toi.getGammaAtEnergyRange(from, to).then(data => {
                var table = $("#toiTable");
                table.append("<tr><th class='boxth'>Energy</th><th class='boxth'>Intensity</th><th class='boxth'>Element</th><th class='boxth'>Decay</th></tr>")
                for (var x of data) {
                    //console.log(x);
                    table.append("<tr>");
                    appendLineToTable(x, table);
                    table.append("</tr>");
                }
            });

            Toi.getPossibleElements([438,574]);
        }
    });


});