/*jshint esversion: 6 */
var fs = require('fs');
var rp = require('request-promise');
var cheerio = require('cheerio');

// makeRequest("152EU")
//     .then(result => {
//         console.log(result[2]);
//     });

function makeRequest(nucleus) {
    return new Promise(function (resolve, reject) {
        let url = `https://www.nndc.bnl.gov/nudat2/getdataset.jsp`;
        var options = {
            uri: url,
            qs: {
                nucleus: nucleus,
                unc: "nds"
            },
            headers: {
                'User-Agent': 'Coincidence @2017'
            }
        };
        rp(options)
            .then(function (htmlString) {
                data = parseHtml(htmlString);
                resolve(data);
            })
            .catch(function (err) {
                reject("Failed.");
            });
    });
}

var parseHtml = function (htmlString) {
    let $ = cheerio.load(htmlString);
    let td = $("td.cell, td.cellc", $("table")[1]);
    let data = [];
    td.each(function (i, x) {
        let j = Math.floor(i / 9);
        if (!data[j])
            data[j] = {
                Energy: 0,
                XREF: null,
                Jn: null,
                HalfLife: null,
                EnergyGamma: 0,
                Intensity: 0,
                M: null,
                FinalLivelEnergy: 0,
                FinalLevelJn: null
            };
        let pos = i % 9;
        let k = $(this).text();
        k = k.trim();
        if (pos == 0) {
            k = k.replace("&nbsp;", "");
            data[j].Energy = parseFloat(k);
        }
        if (pos == 1)
            data[j].XREF = k;
        if (pos == 2)
            data[j].Jn = k;
        if (pos == 3)
            data[j].HalfLife = k;
        if (pos == 4)
            data[j].EnergyGamma = parseFloat(k);
        if (pos == 5)
            data[j].Intensity = parseFloat(k);
        if (pos == 6)
            data[j].M = k;
        if (pos == 7)
            data[j].FinalLivelEnergy = parseFloat(k);
        if (pos == 8)
            data[j].FinalLevelJn = k;
    });
    return data;
};

module.exports = {
    makeRequest
};