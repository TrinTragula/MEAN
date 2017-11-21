const remote = require('electron').remote
const main = remote.require('./main.js')
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const d3 = Plotly.d3;
const formatter = d3.format('.2f');

// Salva db attuale
$("#saveDb").on("click", function (e) {
  let content = fs.readFileSync("coincidenze_vere.sqlite");
  main.saveDatabase(content);
});

// Apro nudat
$("#nudat").on("click", function (e) {
  e.preventDefault();
  main.openNudat();
});

// Apro interfaccia toi scraper
$("#toi").on("click", function (e) {
  e.preventDefault();
  main.openToi();
});


// Importa vecchio db
$("#importDbButton").on("click", function (e) {
  let dbPath;
  if (document.getElementById("dbFile"))
    dbPath = document.getElementById("dbFile").files[0] ? document.getElementById("dbFile").files[0].path : null;
  if (dbPath) {
    let contents = fs.readFileSync(dbPath);
    console.log(contents);
    fs.writeFileSync("coincidenze_vere.sqlite", contents);
    alert("Done!");
  }
});

// Salvataggio immagini
$("#saveMatrix").on("click", function (e) {
  $("[data-title='Download plot as a png']")[0].click();
});
$("#saveX").on("click", function (e) {
  $("[data-title='Download plot as a png']")[1].click();
});
$("#saveY").on("click", function (e) {
  $("[data-title='Download plot as a png']")[2].click();
});