import { MEBlockData, MEBlockInstance, MEBlockRendererStaticRenderOptions, MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../../renderer";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { generateId } from "@/packages/utils/utils";
import { adjustOffset } from "../../utils";
import { insertTab } from "../paragraph/tab";
import { highlight } from "./utlis/highlight";
import { HTML_TAGS, VOID_HTML_TAGS } from "@/packages/utils/tags";


const checkAutoIndent = (text, offset) => {
    const pairStr = text.substring(offset - 1, offset + 1)

    return /^(\{\}|\[\]|\(\)|><)$/.test(pairStr)
}

const getIndentSpace = text => {
    const match = /^(\s*)\S/.exec(text)

    return match ? match[1] : ''
}

/**
 * parseSelector
 * div#id.className => {tag: 'div', id: 'id', className: 'className', isVoid: false}
 */
const parseSelector = (str = '') => {
    const REG_EXP = /(#|\.)([^#.]+)/
    let tag = ''
    let id = ''
    let className = ''
    let isVoid = false
    let cap

    for (const tagName of HTML_TAGS) {
        if (str.startsWith(tagName) && (!str[tagName.length] || /#|\./.test(str[tagName.length]))) {
            tag = tagName
            if (VOID_HTML_TAGS.indexOf(tagName as any) > -1) isVoid = true
            str = str.substring(tagName.length)
        }
    }

    if (tag !== '') {
        cap = REG_EXP.exec(str)
        while (cap && str.length) {
            if (cap[1] === '#') {
                id = cap[2]
            } else {
                className = cap[2]
            }
            str = str.substring(cap[0].length)
            cap = REG_EXP.exec(str)
        }
    }

    return { tag, id, className, isVoid }
}


export default class MECodeRenderer extends MEBlockRenderer {
    static type: MEBlockType = "code";
    static tagName: string = 'code';

    static async staticRender({ data }: MEBlockRendererStaticRenderOptions): Promise<string> {
        const innerHTML = highlight(data.meta.lang, data.text)
        return `<${this.tagName} class="${this.type} lang-${data.meta.lang}"><span style="display: block;white-space: pre-wrap;word-break: break-word;">${innerHTML.value || ''}</span></${this.tagName}>`
    }

    get lang() {

        return this.meta.lang;
    }

    /**
     * Always be the `pre` element
     */
    get codeContainer() {
        return this.block.parent
    }

    get outContainer() {
        const { codeContainer } = this
        return codeContainer?.parent
    }

    get anchor() {
        return this.codeContainer;
    }

    updateContent() {
        if (!this.nodes.el) {
            this.nodes.el = this.make(this.tagName);
            this.nodes.holder = this.make('span', [CLASS_NAMES.ME_EDITABLE, CLASS_NAMES.ME_CODE], { contenteditable: 'true' });
            this.nodes.el.appendChild(this.nodes.holder);
            const copyNode = this.make('span', [CLASS_NAMES.ME_CODE_COPY], { contenteditable: 'false' });
            this.nodes.el.appendChild(copyNode);
            this.mutableListeners.on(copyNode, 'click', this.copyHandler.bind(this))
            this.mutableListeners.on(copyNode, 'mousedown', this.preventMouseDown.bind(this))
        }

        const result = highlight(this.lang, this.text);
        this.nodes.holder.innerHTML = result.value;
        const text = this.nodes.holder.textContent
        this._text = text;

        return true;
    }

    forceUpdate() {
        const cursor = this.getCursor();
        const text = this.nodes.holder.textContent
        this.render({ text })
        if (cursor) {
            this.setCursor(cursor)
        }
        if (/html-block|math-block|diagram-block/.test(this.block.parent.type)) {
            this.block.parent.renderer.forceUpdate()
        }
    }

    enterHandler(event) {
        event.preventDefault()

        // Shift + Enter to jump out of code block.
        if (event.shiftKey) {
            let cursorBlock: MEBlockInstance;
            const type = this.outContainer?.type
            const nextContentBlock = this.codeContainer?.nextContentInContext()
            if((type === 'list-item' || type === 'task-list-item' || type === 'block-quote') || !nextContentBlock) {
                const newBlockData: MEBlockData = {
                    id: generateId(),
                    type: 'paragraph',
                    text: ''
                }

                cursorBlock = this.outContainer?.append({ data: newBlockData })
            } else if (nextContentBlock) {
                cursorBlock = nextContentBlock
            }
            const offset = adjustOffset(0, cursorBlock, event)
            cursorBlock.renderer.setCursor({ focus: { offset } })

            return
        }


        const { tabSize } = this.instance.options;
        const { start } = this.getCursor()
        const { text: oldText } = this
        const autoIndent = checkAutoIndent(oldText, start.offset)
        const indent = getIndentSpace(oldText)

        const text = oldText.substring(0, start.offset) +
            '\n' +
            (autoIndent ? indent + ' '.repeat(tabSize) + '\n' : '') +
            indent +
            oldText.substring(start.offset) +
            (oldText.length === start.offset ? '\n' : '')

        let offset = start.offset + 1 + indent.length

        if (autoIndent) {
            offset += tabSize
        }

        this.render({ text })

        this.setCursor({ focus: { offset } })

    }

    tabHandler(event) {
        event.preventDefault()

        const cursor = this.getCursor();
        if (!cursor) {
            return;
        }


        const { start, end } = cursor;
        const { lang, text } = this
        const isMarkupCodeContent = /html|html|xml|svg|mathml/.test(lang)

        if (isMarkupCodeContent) {
            const lastWordBeforeCursor = text.substring(0, start.offset).split(/\s+/).pop()
            const { tag, isVoid, id, className } = parseSelector(lastWordBeforeCursor)

            if (tag) {
                const preText = text.substring(0, start.offset - lastWordBeforeCursor.length)
                const postText = text.substring(end.offset)
                let html = `<${tag}`
                let startOffset = 0
                let endOffset = 0

                switch (tag) {
                    case 'img':
                        html += ' alt="" src=""'
                        startOffset = endOffset = html.length - 1
                        break

                    case 'input':
                        html += ' type="text"'
                        startOffset = html.length - 5
                        endOffset = html.length - 1
                        break

                    case 'a':
                        html += ' href=""'
                        startOffset = endOffset = html.length - 1
                        break

                    case 'link':
                        html += ' rel="stylesheet" href=""'
                        startOffset = endOffset = html.length - 1
                        break
                }

                if (id) {
                    html += ` id="${id}"`
                }

                if (className) {
                    html += ` class="${className}"`
                }

                html += '>'

                if (startOffset === 0 && endOffset === 0) {
                    startOffset = endOffset = html.length
                }

                if (!isVoid) {
                    html += `</${tag}>`
                }

                const newText = preText + html + postText
                this.render({ text: newText })
                this.setCursor({ anchor: { offset: startOffset + preText.length }, focus: { offset: endOffset + preText.length } })
            } else {
                insertTab.call(this);
            }
        } else {
            insertTab.call(this);
        }


    }

    backspaceHandler(event) {
        const cursor = this.getCursor()
        if (!cursor) {
            return null;
        }
        const { start, end } = cursor
        if (start.offset === end.offset && start.offset === 0) {
            event.preventDefault()
            const { text } = this
            const data: MEBlockData = {
                id: generateId(),
                type: 'paragraph',
                text
            }
            this.codeContainer.replaceWith({ data, needToFocus: true, focus: { offset: 0 } })
        } else if (start.offset === end.offset && start.offset === 1 && this.text === '\n') {
            event.preventDefault()
            this.render({ text: '' })
            //TODO: render
            this.setCursor()
        }
    }

    copyHandler(event) {
        event.preventDefault()
        event.stopPropagation()
        const { clipboard } = this.instance.context
        clipboard.copyPlainText(this.text)
        event.target.classList.toggle(CLASS_NAMES.ME_CODE_COPY__SUCCESS, true)
        setTimeout(()=>{
            event.target.classList.toggle(CLASS_NAMES.ME_CODE_COPY__SUCCESS, false)
        }, 1000)
    }

    preventMouseDown(event) {
        event.preventDefault()
    }
}