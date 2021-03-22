const {app, Notification, Tray, ipcMain, shell, BrowserWindow:eBrowserWindow, session, dialog} = require('electron')
const path = require('path')
const setting = require('electron-settings')
const {BrowserWindow} = require('electron-acrylic-window')
const {autoUpdater} = require("electron-updater")
const {version} = require('./package.json')
const fetch = require('node-fetch')
const fs = require('fs')
const iconvLite = require('iconv-lite')


let mainWindow, signinWindow
let tray
let closeMainWindow = false


const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
}

app.on('second-instance', createMainWindow)

app.setLoginItemSettings({openAtLogin: true})

async function checkValidAccount() {
    const res = await fetch('https://api.iasa.kr/account/info', {
        headers: {
            cookie: 'auth='+setting.getSync('token')+';'
        }
    }).then(res=>res.json())
    if (res.success && res.data.permission !== 5) {
        dialog.showMessageBox(null, {
            type: 'warning',
            buttons: ['확인'],
            defaultId: 2,
            title: '로그인하세요.',
            message: '계정 정보가 올바르지 않아요.',
            detail: 'NULL에 문의하세요.',
        }).then(()=>{
            session.defaultSession.clearStorageData([]).then(createSigninWindow)
        });
        if(mainWindow) {
            closeMainWindow = true
            mainWindow.close()
        }
        return false
    }
    if (res.success && res.data.expired) {
        dialog.showMessageBox(null, {
            type: 'warning',
            buttons: ['확인'],
            defaultId: 2,
            title: '로그인하세요.',
            message: '로그인 토큰이 만료됐어요.',
            detail: 'NULL에 문의하세요.',
        }).then(()=>{
            session.defaultSession.clearStorageData([]).then(createSigninWindow)
        });
        if(mainWindow) {
            closeMainWindow = true
            mainWindow.close()
        }
        return false
    }
    return true
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    })
}

function getFramePath() {
    return `file://${__dirname}/index.html`
}

async function createMainWindow() {
    autoUpdater.checkForUpdates()
    closeMainWindow = false

    if(setting.getSync('token')) {
        if(!await checkValidAccount()) return
    }
    else {
        session.defaultSession.clearStorageData([]).then(createSigninWindow)
        return
    }

    if (mainWindow) {
        mainWindow.focus()
        return
    }
    mainWindow = new BrowserWindow({
        width: 900, height: 600, minWidth: 650, minHeight: 300, vibrancy: 'light', webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            enableRemoteModule: true,
            contextIsolation:false
        }, icon: path.join(__dirname, 'res/logo.ico'), frame: false
    })
    mainWindow.setMenu(null)
    mainWindow.loadURL(getFramePath())

    //mainWindow.webContents.openDevTools({mode: "detach"})

    mainWindow.on('close', (e) => {
        if(!closeMainWindow) {
            e.preventDefault()
            mainWindow.minimize()
        }
        else mainWindow = null
    })
}

function createSigninWindow() {
    autoUpdater.checkForUpdates()
    if (signinWindow) {
        signinWindow.focus()
        return
    }
    signinWindow = new eBrowserWindow({
        width: 500, height: 700, webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            enableRemoteModule: true,
            contextIsolation:false
        }, icon: path.join(__dirname, 'res/logo.ico'), title: '로그인'
    })
    signinWindow.setMenu(null)
    signinWindow.loadURL('https://account.iasa.kr/signin')
    signinWindow.show()

    signinWindow.webContents.on('will-navigate', async()=> {
        const cookies=await session.defaultSession.cookies.get({ url: 'https://iasa.kr' })
        for(let i of cookies) {
            if(i.name==='auth') {
                setting.setSync('token', i.value)
                signinWindow.close()
                createMainWindow()
                return
            }
        }
    })

    //signinWindow.webContents.openDevTools({mode: "detach"})

    signinWindow.on('close', (e) => {
        signinWindow = null
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
        fetch('https://api.iasa.kr/share/'+info.code, {
            headers: {
                cookie: 'auth='+setting.getSync('token')+';'
            }
        }).then(res=>res.json()).then(async fres=>{
            if(!fres.success) {
                if(!await checkValidAccount()) return
                mainWindow.webContents.send("showDialog", fres.message)
                return
            }
            const target=path.join(app.getPath("temp"), uuidv4())
            if (!fs.existsSync(target)){
                fs.mkdirSync(target)
            }
            let count=0
            for(let i of fres.data) {
                fetch('https://api.iasa.kr/files/download/'+i, {
                    headers: {
                        cookie: 'auth='+setting.getSync('token')+';'
                    }
                }).then(async res=>{
                    const filename=iconvLite.decode(iconvLite.encode(res.headers.get('Content-Disposition').split('filename=').slice(1).join(''), 'ISO-8859-1'), 'UTF-8')
                    console.log(filename)
                    const fileStream = fs.createWriteStream(path.join(target, filename));
                    await new Promise((resolve, reject) => {
                        res.body.pipe(fileStream);
                        res.body.on("error", reject);
                        fileStream.on("finish", resolve);
                    })
                    count+=1
                    if(count>=fres.data.length) {
                        shell.openExternal(target)
                        mainWindow.webContents.send("showDialog", '파일이 다운로드됐어요.')
                    }
                })
            }
        })
    })


    ipcMain.on("register", (event, info) => {
        fetch(`https://api.iasa.kr/print/`, {
            method:'POST',
            body:JSON.stringify(info),
            headers: {
                cookie: 'auth='+setting.getSync('token')+';',
                'Content-Type': 'application/json'
            }
        }).then(res=>res.json()).then(async (res) => {
            if(res.success) mainWindow.webContents.send("showDialog", '명부에 정상적으로 등록됐어요.')
            else {
                if(!await checkValidAccount()) return
                mainWindow.webContents.send("showDialog", res.message)
            }
        }).catch(() => {
            mainWindow.webContents.send("showDialog", '잠시 후 다시 시도해 주세요.')
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