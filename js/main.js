let snackbar, uidText, paperCountText
let c1, c2, c3, c4
const {machineIdSync} = require('node-machine-id')


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
    fetch(`https://api.iasa.kr/print/register?uid=${uid}&paperCount=${paperCount}&cid=${machineIdSync()}`).then((res) => {
        if(res.status!==200)showSnackbar('잠시 후 다시 시도해 주세요.')
        else showSnackbar('명부에 정상적으로 등록됐어요.')
    }).catch(() => {
        showSnackbar('잠시 후 다시 시도해 주세요.')
    })
}

function getFile() {
    const {ipcRenderer} = require('electron')
    showSnackbar('파일을 다운 받고 있어요.')
    ipcRenderer.send("download", {
        url: "https://api.iasa.kr/print/download?code=" + c1.value + c2.value + c3.value + c4.value
    })
    c1.value = ''
    c2.value = ''
    c3.value = ''
    c4.value = ''
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
        else c4.select()
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
        if (c4.value) getFile()
    })
    c4.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && c4.value === '') {
            c3.value = ''
            c3.focus()
            return
        }
    })

    ipcRenderer.on("showDialog", (event, str) => {
        showSnackbar(str)
    })
})