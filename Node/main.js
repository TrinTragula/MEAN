const electron = require('electron');
const {
    app,
    BrowserWindow
} = electron;
const dialog = electron.dialog;
const fs = require('fs');

var win = null;

app.on('ready', () => {
    win = new BrowserWindow({
        width: 1033,
        height: 450,
        icon: './icon.ico'
    });
    //win.maximize()
    win.loadURL(`file://${__dirname}/choose.html`);
    //win.webContents.openDevTools();
})

app.on('window-all-closed', app.quit);

// Main coincidence window
const coincidence = function () {
    let newWin = new BrowserWindow({
        width: 1200,
        height: 850,
        icon: './icon.ico'
    });
    //win.maximize()
    newWin.loadURL(`file://${__dirname}/index.html`);
    //newWin.webContents.openDevTools();
    win.close();
    win = newWin;
}

// Main single window
const single = function () {
    let newWin = new BrowserWindow({
        width: 1200,
        height: 850,
        icon: './icon.ico'
    });
    //win.maximize()
    newWin.loadURL(`file://${__dirname}/indexSingle.html`);
    //newWin.webContents.openDevTools();
    win.close();
    win = newWin;
}

// Window to save a database copy
const saveDatabase = function (content) {
    var fileName = dialog.showSaveDialog(win, {
        title: 'Save database',
        defaultPath: "*/coincidenze_vere.sqlite",
        filters: [{
            name: 'Sqlite Database(s)',
            extensions: ['sqlite']
        }]
    });
    if (!fileName) {
        return;
    }
    fs.writeFileSync(fileName, content);
};

// Window to save a generic data file
const saveData = function (content) {
    var fileName = dialog.showSaveDialog(win, {
        title: 'Save file',
        defaultPath: "*",
    });
    if (!fileName) {
        return;
    }
    fs.writeFileSync(fileName, content);
};

const openNudat = function () {
    var nudatWin = new BrowserWindow({
        width: 950,
        height: 875,
        icon: './icon.ico'
    });
    nudatWin.loadURL(`http://www.nndc.bnl.gov/nudat2/`);
}

const openToi = function () {
    var toiWin = new BrowserWindow({
        width: 1033,
        height: 875,
        icon: './icon.ico'
    });
    toiWin.loadURL(`file://${__dirname}/toi.html`);
    //toiWin.webContents.openDevTools();
}

const openCalibration = function () {
    var openCalibrationWin = new BrowserWindow({
        width: 950,
        height: 875,
        icon: './icon.ico'
    });
    openCalibrationWin.loadURL(`file://${__dirname}/calibration.html`);
    //openCalibrationWin.webContents.openDevTools();
}

function calibrateAllData(q, m, m2) {
    let isMatrix = win.getTitle() != "Single spectrum";
    let filesToChange = isMatrix ? [
        "data/gating.txt",
        "data/xResult.txt",
        "data/yResult.txt"
    ] : [
        "data/spectrum.txt"
    ];
    let matricesToChange = [
        "data/result.txt"
    ];
    q = q * 1;
    m = m * 1;
    m2 = m2 * 1;

    let folder = dialog.showOpenDialog(win, {
        properties: ['openDirectory']
    });
    let folderPath = folder[0] || "calibration";

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
    let files = [];
    let filesDict = {};
    for (let f of filesToChange) {
        if (fs.existsSync(f)) {
            files.push(f);
            filesDict[f] = f.replace("data/", "");
        }
    }
    for (let f of files) {
        fs.readFile(f, 'ascii', function (err, data) {
            if (err) throw err;
            let newData = "";
            let lines = data.split("\n");
            for (let line of lines) {
                if (!line || line == "" || line == "\n" || line == "\r\n" || line == " ") continue;
                let splitted = line.split(" ");
                let firstHalf = splitted[0];
                let remainder = line.substring(firstHalf.length);

                let split = f.split("/");
                let value = parseInt(firstHalf);
                value = value * value * m2 + value * m + q;
                value = value.toFixed(2);
                let newString = `${value}${remainder}\n`;
                if (newString != "NaN") newData += newString;
            }
            let newF = `${folderPath}/${filesDict[f]}`;
            newData.replace()
            fs.writeFile(newF, newData, 'utf-8', function (err) {
                if (err) throw err;
                console.log("Successfully calibrated");
            });
        });
    }

    let buttons = ['OK'];
    dialog.showMessageBox({
        type: 'info',
        buttons: buttons,
        message: `Calibrated data has been saved in the folder '${folderPath}'`
    });

    if (isMatrix) {
        for (let matrix of matricesToChange) {
            fs.readFile(matrix, 'ascii', function (err, data) {
                if (err) throw err;
                let newData = "0 0 0 0\r\n";
                let lines = data.split("\n");
                lines.shift();
                for (let line of lines) {
                    if (!line || line == "" || line == "\n" || line == "\r\n" || line == " ") continue;
                    let splitted = line.split(" ");
                    let first = splitted[0];
                    let second = splitted[1];
                    let remainder = line.substring(first.length + second.length + 2);

                    let valueX = parseInt(first);
                    let valueY = parseInt(second);
                    let X = q + m * valueX + m2 * valueX * valueX;
                    let Y = q + m * valueY + m2 * valueY * valueY;
                    let newString = `${X.toFixed(2)} ${Y} ${remainder}\n`;
                    if (newString != "NaN") newData += newString;
                }
                let newMatrix = `${folderPath}/${matrix.txt}`;
                fs.writeFile(newMatrix, newData, 'utf-8', function (err) {
                    if (err) throw err;
                    console.log("Matrix calibrated");
                });
            });
        }
    }
}

exports.coincidence = coincidence;
exports.single = single;
exports.saveDatabase = saveDatabase;
exports.saveData = saveData;
exports.openNudat = openNudat;
exports.openToi = openToi;
exports.openCalibration = openCalibration;
exports.calibrateAllData = calibrateAllData;