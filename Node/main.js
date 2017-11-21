const electron = require('electron');
const {
    app,
    BrowserWindow,
    ipcMain
} = electron;
const dialog = electron.dialog;
const fs = require('fs');
const glob = require('glob');

var win = null;

app.on('ready', () => {
    win = new BrowserWindow({
        width: 1200,
        height: 850,
        icon: './icon.ico'
    });
    //win.maximize()
    win.loadURL(`file://${__dirname}/index.html`);
    //win.webContents.openDevTools();
})

app.on('window-all-closed', app.quit);

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
    // let filesToChange = [
    //     "data/gat*",
    //     "data/xRes*",
    //     "data/yRes*",
    //     "singleData/sing*"
    // ];
    let matricesToChange = [
        "data/result.txt"
    ];
    q = q * 1;
    m = m * 1;
    m2 = m2 * 1
    // let files = [];
    // for (let f of filesToChange) {
    //     let found = glob.sync(f);
    //     found.map(x => files.push(x));
    // }
    // for (let f of files) {
    //     fs.readFile(f, 'ascii', function (err, data) {
    //         if (err) throw err;
    //         let newData = "";
    //         let lines = data.split("\n");
    //         for (let line of lines) {
    //             if (!line || line == "" || line == "\n" || line == "\r\n" || line == " ") continue;
    //             let splitted = line.split(" ");
    //             let firstHalf = splitted[0];
    //             let remainder = line.substring(firstHalf.length);

    //             let value = parseInt(firstHalf);
    //             value = Math.floor(value * value * m2 + value * m + q);
    //             newData += `${value}${remainder}\n`;
    //         }
    //         fs.writeFile(f, newData, 'utf-8', function (err) {
    //             if (err) throw err;
    //             console.log("Successfully calibrated");
    //         });
    //     });
    // }

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
                let X = Math.floor(q + m * valueX + m2 * valueX * valueX);
                let Y = Math.floor(q + m * valueY + m2 * valueY * valueY);
                newData += `${X} ${Y} ${remainder}\n`;
            }
            fs.writeFile(matrix, newData, 'utf-8', function (err) {
                if (err) throw err;
                console.log("Matrix calibrated");
                win.webContents.send('redraw-all', true);
            });
        });
    }
}

exports.saveDatabase = saveDatabase;
exports.saveData = saveData;
exports.openNudat = openNudat;
exports.openToi = openToi;
exports.openCalibration = openCalibration;
exports.calibrateAllData = calibrateAllData;