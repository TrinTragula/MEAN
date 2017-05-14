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
        width: 1200,
        height: 850,
        icon: './icon.ico'
    });
    //win.maximize()
    win.loadURL(`file://${__dirname}/index.html`);
    win.webContents.openDevTools();
})

app.on('window-all-closed', app.quit);

const saveFile = function (content) {
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

exports.saveFile = saveFile;