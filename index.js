const {app, ipcMain, dialog, Notification, Tray, session, Menu} = require('electron')
const path = require('path')
const setting = require('electron-settings')
const fetch = require('node-fetch')
const {BrowserWindow} = require('electron-acrylic-window')
const {autoUpdater} = require("electron-updater")
const {version, description} = require('./package.json')


let mainWindow
let tray


app.setLoginItemSettings({openAtLogin: true})

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
        width: 900, height: 600, minWidth: 650, minHeight: 300, vibrancy: 'appearance-based', webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            enableRemoteModule: true
        }, icon: path.join(__dirname, 'res/logo.ico'), frame: false
    })
    mainWindow.setMenu(null)
    mainWindow.loadURL(getFramePath())

    //mainWindow.webContents.openDevTools({mode: "detach"})

    mainWindow.on('closed', () => {
        mainWindow = null
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