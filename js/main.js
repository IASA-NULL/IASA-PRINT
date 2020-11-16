let snackbar, uidText, paperCountText

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
    fetch(`https://api.iasa.kr/print/register?uid=${uid}&paperCount=${paperCount}`).then(() => {
        showSnackbar('명부에 정상적으로 등록됐어요.')
    }).catch(() => {
        showSnackbar('잠시 후 다시 시도해 주세요.')
    })
}

document.addEventListener('DOMContentLoaded', () => {
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
})