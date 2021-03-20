let snackbar, uidText, paperCountText
let c1, c2, c3, c4
const {machineIdSync} = require('node-machine-id')
const {ipcRenderer} = require('electron')


function showSnackbar(str) {
    document.getElementById('snackbar-text').innerText = str
    snackbar.close()
    snackbar.open()
}

function print() {
    let uid = document.getElementById('uid').value, paperCount = document.getElementById('paperCount').value
    if (uid === '') {
        showSnackbar('학번을 입력해 주세요.')
        document.getElementById('uid').focus()
        return
    }
    if (uid.length < 4 || uid.length > 5) {
        showSnackbar('학번이 올바르지 않아요.')
        document.getElementById('uid').focus()
        document.getElementById('uid').select()
        return
    }
    if (uid.length === 5) uid = uid[0] + uid[2] + uid[3] + uid[4]
    let age = parseInt(uid[0]), cl = parseInt(uid[1]), nb = parseInt(uid[2] + uid[3])
    if (age < 1 || age > 3 || cl < 1 || cl > 5 || nb < 1 || nb > 16) {
        showSnackbar('학번이 올바르지 않아요.')
        document.getElementById('uid').focus()
        document.getElementById('uid').select()
        return
    }
    if (paperCount === '') {
        showSnackbar('인쇄할 매수를 입력해 주세요.')
        document.getElementById('paperCount').focus()
        return
    }
    paperCount = parseInt(paperCount)
    if (!paperCount || paperCount < 0) {
        showSnackbar('인쇄할 매수가 올바르지 않아요.')
        document.getElementById('paperCount').focus()
        document.getElementById('paperCount').select()
        return
    }
    uidText.value = ''
    paperCountText.value = ''
    uidText.focus()
    ipcRenderer.send("register", {
        sid:uid,
        paperCount:paperCount,
        cid:machineIdSync()
    })
}

function getFile() {
    showSnackbar('파일을 다운 받고 있어요.')
    ipcRenderer.send("download", {
        code: c1.value + c2.value + c3.value + c4.value + c5.value + c6.value
    })
    c1.value = ''
    c2.value = ''
    c3.value = ''
    c4.value = ''
    c5.value = ''
    c6.value = ''
    c1.focus()
}

document.addEventListener('DOMContentLoaded', () => {
    const {ipcRenderer} = require('electron')
    uidText = mdc.textField.MDCTextField.attachTo(document.getElementById('uid-container'))
    paperCountText = mdc.textField.MDCTextField.attachTo(document.getElementById('paper-count-container'))

    document.getElementById('uid-container').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('paper-count-container').focus()
    })
    document.getElementById('paper-count-container').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') print()
    })
    const buttons = document.querySelectorAll('.mdc-button')
    for (const button of buttons) new mdc.ripple.MDCRipple(button)
    snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'))

    c1 = document.getElementById('fileCode1')
    c2 = document.getElementById('fileCode2')
    c3 = document.getElementById('fileCode3')
    c4 = document.getElementById('fileCode4')
    c5 = document.getElementById('fileCode5')
    c6 = document.getElementById('fileCode6')
    c1.addEventListener('focus', () => {
        if (c1.value) c2.focus()
    })
    c2.addEventListener('focus', () => {
        if (c1.value === '') c1.focus()
        else if (c2.value) c3.focus()
    })
    c3.addEventListener('focus', () => {
        if (c2.value === '') c2.focus()
        else if (c3.value) c4.focus()
    })
    c4.addEventListener('focus', () => {
        if (c3.value === '') c3.focus()
        else if (c4.value) c5.focus()
    })
    c5.addEventListener('focus', () => {
        if (c4.value === '') c4.focus()
        else if (c5.value) c6.focus()
    })
    c6.addEventListener('focus', () => {
        if (c5.value === '') c5.focus()
        else c6.select()
    })
    c1.addEventListener('keyup', (e) => {
        c1.value = isNaN(parseInt(c1.value[0])) ? '' : parseInt(c1.value[0])
        c2.focus()
    })
    c2.addEventListener('keyup', (e) => {
        c2.value = isNaN(parseInt(c2.value[0])) ? '' : parseInt(c2.value[0])
        c3.focus()
    })
    c2.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && c2.value === '') {
            c1.value = ''
            c1.focus()
            return
        }
    })
    c3.addEventListener('keyup', (e) => {
        c3.value = isNaN(parseInt(c3.value[0])) ? '' : parseInt(c3.value[0])
        c4.focus()
    })
    c3.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && c3.value === '') {
            c2.value = ''
            c2.focus()
            return
        }
    })
    c4.addEventListener('keyup', (e) => {
        c4.value = isNaN(parseInt(c4.value[0])) ? '' : parseInt(c4.value[0])
        c5.focus()
    })
    c4.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && c4.value === '') {
            c3.value = ''
            c3.focus()
            return
        }
    })
    c5.addEventListener('keyup', (e) => {
        c5.value = isNaN(parseInt(c5.value[0])) ? '' : parseInt(c5.value[0])
        c6.focus()
    })
    c5.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && c5.value === '') {
            c4.value = ''
            c4.focus()
            return
        }
    })
    c6.addEventListener('keyup', (e) => {
        c6.value = isNaN(parseInt(c6.value[0])) ? '' : parseInt(c6.value[0])
        if (c6.value) getFile()
    })
    c6.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && c6.value === '') {
            c5.value = ''
            c5.focus()
            return
        }
    })

    ipcRenderer.on("showDialog", (event, str) => {
        showSnackbar(str)
    })
})