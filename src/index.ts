import MEditable from '@/packages/umd'
import {MEPluginContextMenu} from './packages/plugins/'
require("@/index.less")
const README = require('../README.md')

const editor = document.getElementById('editor')
const searchInput = document.querySelector('#search') as HTMLInputElement
const previousBtn = document.querySelector('#previous')
const nextBtn = document.querySelector('#next')
const replaceInput = document.querySelector('#replace') as HTMLInputElement
const singleBtn = document.querySelector('#single')
const allBtn = document.querySelector('#all')
const clearBtn = document.querySelector('#clear')

MEditable.use(MEPluginContextMenu)

const markdown = README.default
const meditable = new MEditable({ container: editor, locale: {lang: navigator.language} })
meditable.prepare().then(() => {
    meditable.setContent(markdown)
});
(window as any).meditable = meditable;
(window as any).MEditable = MEditable;

searchInput.addEventListener('input', (event) => {
    const searchKey = (event.target as HTMLInputElement).value
    if(searchKey) {
        meditable.search({ searchKey, all: true, dir: 1 })
    } else {
        meditable.searchClear()
    }
})

previousBtn.addEventListener('click', () => {
    meditable.searchJumpPrev()
})

nextBtn.addEventListener('click', () => {
    meditable.searchJumpNext()
})

singleBtn.addEventListener('click', () => {
    if(searchInput.value) {
        meditable.replace({searchKey: searchInput.value, all: false, dir: 1, replaceKey: replaceInput.value, replace: true, replaceType: 'text' })
    }  
})

allBtn.addEventListener('click', () => {
    if(searchInput.value) {
        meditable.replace({searchKey: searchInput.value, all: true, dir: 1, replaceKey: replaceInput.value, replace: true, replaceType: 'text' })
    }
})

clearBtn.addEventListener('click', () => {
    meditable.searchClear()
})

if(/(iPhone|iPad|iPod|Android)/i.test(navigator.userAgent)) {
    const VConsole = require('vconsole')
    const vConsole = new VConsole()
    vConsole.init && vConsole.init()
}