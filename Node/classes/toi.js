/*jshint esversion: 6 */
var fs = require('fs');
var rp = require('request-promise');
var cheerio = require('cheerio');

/**
 * Get gamma decay for elements at the specified energy, return a promise
 * @param {number} energy (integer)
 */
function getGammaAtEnergy(energy) {
    return new Promise(function (resolve, reject) {
        let url = 'http://nucleardata.nuclear.lu.se/toi/Gamma.asp';
        var options = {
            uri: url,
            qs: {
                Min: energy,
                Max: energy + 1
            },
            headers: {
                'User-Agent': 'Coincidence @2017'
            }
        };
        rp(options)
            .then(function (htmlString) {
                data = parseGammaData(htmlString, energy);
                resolve(data);
            })
            .catch(function (err) {
                reject("Failed.");
            });
    });
}

/**
 * Get gamma decay for elements at the specified energy with an error +-, return a promise
 * @param {number} energy (integer)
 * @param {number} error (integer)
 */
function getGammaAtEnergyWithError(energy, error) {
    return new Promise(function (resolve, reject) {
        let url = 'http://nucleardata.nuclear.lu.se/toi/Gamma.asp';
        var options = {
            uri: url,
            qs: {
                Min: energy - error,
                Max: energy + error
            },
            headers: {
                'User-Agent': 'Coincidence @2017'
            }
        };
        rp(options)
            .then(function (htmlString) {
                data = parseGammaData(htmlString, energy);
                resolve(data);
            })
            .catch(function (err) {
                reject("Failed.");
            });
    });
}

/**
 * Get gamma decay for elements at the specified energy range. return a promise
 * @param {number} from energy (integer)
 * @param {number} to energy (integer)
 */
function getGammaAtEnergyRange(startEnergy, endEnergy) {
    return new Promise(function (resolve, reject) {
        let url = 'http://nucleardata.nuclear.lu.se/toi/Gamma.asp';
        var options = {
            uri: url,
            qs: {
                Min: startEnergy,
                Max: endEnergy + 1
            },
            headers: {
                'User-Agent': 'toi-nuclear npm module - Email issues at dcat@protonmail.ch - Copyright 2017'
            }
        };
        rp(options)
            .then(function (htmlString) {
                data = parseGammaData(htmlString, endEnergy);
                resolve(data);
            })
            .catch(function (err) {
                reject("Failed.");
            });
    });
}

/**
 * Get all the possible elements with the specified energies within an error
 * @param {number[]} energyArray 
 * @param {number} error 
 */
function getPossibleElements(energyArray) {
    let data = [];
    let queries = [];
    for (var energy of energyArray) {
        queries.push(getGammaAtEnergy(energy));
    }
    Promise.all(queries).then(values => {
        values = values.map(x => x.map(y => y.Element));
        for (var element of values[0]) {
            //console.log(element);
            var present = true;
            for (var value of values) {
                if (value.indexOf(element) == -1) {
                    present = false;
                }
            }
            if (present) data.push(element);
        }
        console.log(data);
    });
}

/**
 * Get all the possible elements with the specified energies within an error
 * @param {number[]} energyArray 
 * @param {number} error 
 */
function getPossibleElementsWithError(energyArray, error) {
    let data = [];
    let queries = [];
    for (var energy of energyArray) {
        queries.push(getGammaAtEnergyWithError(energy, error));
    }
    Promise.all(queries).then(values => {
        values = values.map(x => x.map(y => y.Element));
        for (var element of values[0]) {
            //console.log(element);
            var present = true;
            for (var value of values) {
                if (value.indexOf(element) == -1) {
                    present = false;
                }
            }
            if (present) data.push(element);
        }
        console.log(data);
    });
}

var parseGammaData = function (htmlString, energy) {
    let $ = cheerio.load(htmlString);
    let td = $("td");
    let data = [];
    td.each(function (i, x) {
        let j = Math.floor(i / 5);
        if (!data[j])
            data[j] = {
                Energy: 0,
                Intensity: 0,
                Element: null,
                Decay: null
            };
        let pos = i % 5;
        let k = $(this).text();
        k = k.trim();
        k = k.split(/(\s+)/)[0];
        k = k.replace("*", "");
        if (pos == 0)
            data[j].Energy = parseFloat(k);
        if (pos == 1)
            data[j].Intensity = parseFloat(k);
        if (pos == 2)
            data[j].Decay = k;
        if (pos == 4)
            data[j].Element = k;
    });
    data.pop();
    data = data.filter(x => !isNaN(x.Intensity) && energy ? !(x.Energy - 1 >= energy) : true);
    return data;
};

module.exports = {
    getGammaAtEnergy,
    getGammaAtEnergyRange,
    getPossibleElements
};