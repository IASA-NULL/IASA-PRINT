const {app, Notification, Tray, ipcMain, shell} = require('electron')
const path = require('path')
const setting = require('electron-settings')
const {BrowserWindow} = require('electron-acrylic-window')
const {autoUpdater} = require("electron-updater")
const {version} = require('./package.json')
const {download} = require("electron-dl")


let mainWindow
let tray


const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
}

app.on('second-instance', createMainWindow)

app.setLoginItemSettings({openAtLogin: true})

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    })
}

function getFramePath() {
    return `file://${__dirname}/index.html`
}

function createMainWindow() {
    autoUpdater.checkForUpdates()
    if (mainWindow) {
        mainWindow.focus()
        return
    }
    mainWindow = new BrowserWindow({
        width: 900, height: 600, minWidth: 650, minHeight: 300, vibrancy: 'light', webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            enableRemoteModule: true
        }, icon: path.join(__dirname, 'res/logo.ico'), frame: false
    })
    mainWindow.setMenu(null)
    mainWindow.loadURL(getFramePath())

    //mainWindow.webContents.openDevTools({mode: "detach"})

    mainWindow.on('close', (e) => {
        e.preventDefault()
        mainWindow.minimize()
    })
}

function init() {
    app.setAppUserModelId('iasa.null.print')
    tray = new Tray(path.join(__dirname, 'res/logo.ico'))
    tray.setToolTip('IASA 프린터')
    tray.on('click', createMainWindow)
    if (setting.getSync('ver') && setting.getSync('ver') !== version) sendNotification('프로그램을 자동으로 업데이트했어요.')
    setting.setSync('ver', version)

    autoUpdater.checkForUpdates()
    setInterval(() => {
        autoUpdater.checkForUpdates()
    }, 60000)

    ipcMain.on("download", (event, info) => {
        download(mainWindow, info.url, {directory: path.join(app.getPath("temp"), uuidv4())}).then(dl => {
            shell.openExternal(dl.getSavePath())
            mainWindow.webContents.send("showDialog", '파일이 다운로드됐어요.')
        }).catch(() => {
            mainWindow.webContents.send("showDialog", '코드가 올바르지 않아요.')
        })
    })

    createMainWindow()
}

app.on('ready', init)


app.on('window-all-closed', (e) => {
    e.preventDefault()
})

function sendNotification(title, msg) {
    const myNotification = new Notification({
        title: title,
        icon: path.join(__dirname, 'res/logo.ico'),
        body: msg
    })
    myNotification.show()
}

autoUpdater.on('update-available', () => {
    mainWindow.close()
    sendNotification('업데이트를 다운받고 있어요.')
})

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
})