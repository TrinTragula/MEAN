const electron = require('electron');
const {
    app,
    BrowserWindow
} = electron;


app.on('ready', () => {
    let win = new BrowserWindow({width: 1200, height:850});
    //win.maximize()
    win.loadURL(`file://${__dirname}/index.html`);
    win.webContents.openDevTools();
})

exports.openWindow = () => {
    let win = new BrowserWindow({
        width: 400,
        height: 200
    });
    win.loadURL(`file://${__dirname}/bear.html`);
}

