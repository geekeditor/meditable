import domUtils from "@/packages/utils/domUtils";
import { MEBlockData, MEBlockInstance, MEBlockRendererConstructable, MEBlockRendererRenderOptions, MEBlockRendererStaticRenderOptions, MEBlockType, MECursorState, MEInstance, MENodeData, MENodeInstance, MENodeType } from "@/packages/types";
import { findEditableDOM, getOffsetOfParent, getTextContent } from "../utils/dom";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { convertIfNeeded } from "../utils/convert";
import MEEventHandler from "./eventHandler";
import { generateId } from "@/packages/utils/utils";
import { generator, tokenizer } from "../inlineRenderers/tokenizer";
import { adjustOffset, getCursorYOffset } from "./utils";

export const BRACKET_HASH = {
    "{": "}",
    "[": "]",
    "(": ")",
    "*": "*",
    _: "_",
    '"': '"',
    "'": "'",
    $: "$",
    "~": "~",
};

export const BACK_HASH = {
    "}": "{",
    "]": "[",
    ")": "(",
    "*": "*",
    _: "_",
    '"': '"',
    "'": "'",
    $: "$",
    "~": "~",
};


export default class MEBlockRenderer extends MEEventHandler {

    static renders: { [type: string]: MEBlockRendererConstructable } = {}
    static type: MEBlockType = "staff";
    static tagName: string = "section";
    block!: MEBlockInstance;
    children: MENodeInstance[] = [];

    renderCursor: MECursorState | null = null;
    isComposing: boolean = false;
    protected _text: string = '';
    protected _meta!: any;

    static register(render: MEBlockRendererConstructable) {
        this.renders[render.type] = render;
    }

    static async staticRender({ innerHTML }: MEBlockRendererStaticRenderOptions): Promise<string> {
        return `<${this.tagName} class="${this.type}">${innerHTML || ''}</${this.tagName}>`
    }

    constructor(instance: MEBlockInstance) {
        super(instance.instance);
        this.block = instance;
    }

    get tagName() {
        return this.constructor['tagName']
    }

    get text() {
        return this._text;
    }

    get datas() {
        return this.tokenizer();
    }

    get meta() {
        return this._meta;
    }

    get anchor() {
        return this.block;
    }

    tokenizer(): MENodeData[] {
        const text = this._text || ''
        if (!text) {
            return []
        }
        const { labels } = this.instance.context.state
        const hasBeginRules = /thematic-break|paragraph|atx-heading/.test(this.block.type)
        return tokenizer(text, { hasBeginRules, labels });
    }

    setCursor({ anchor, focus, scrollToView }: { anchor?: { offset: number }, focus?: { offset: number }, scrollToView?: boolean } = {}) {
        const cursor = {
            anchor: anchor || focus || { offset: 0 },
            focus: focus || anchor || { offset: 0 },
            anchorBlock: this.block,
            focusBlock: this.block
        }
        const { selection } = this.instance.context.editable;
        selection.setCursor(cursor);

        if(scrollToView) {
            this.scrollToView()
        }
    }

    getCursor(): { anchor: { offset: number }, focus: { offset: number }, start: { offset: number }, end: { offset: number }, direction: string } | null {
        const { selection } = this.instance.context.editable;
        const { cursor } = selection
        if (cursor.anchorBlock !== this.block || cursor.focusBlock !== this.block) {
            return null;
        }

        const { anchor, focus, direction } = cursor;
        const start = { offset: Math.min(anchor.offset, focus.offset) };
        const end = { offset: Math.max(anchor.offset, focus.offset) };

        return {
            anchor,
            focus,
            start,
            end,
            direction: direction || 'none'
        }
    }

    render(options: MEBlockRendererRenderOptions): boolean {
        const { text, meta, cursor } = options;
        this._text = text || '';
        this._meta = meta || this._meta;
        this.renderCursor = cursor || null;
        const rendered = this.updateContent(options.checkUpdate);
        this.renderCursor = null;
        return rendered;
    }

    updateContent(checkUpdate?: boolean) {
        if (!this.nodes.el) {
            this.nodes.el = this.make(this.tagName);
            this.nodes.holder = this.nodes.el;
        }

        return true;
    }

    make(tagName: string, classNames: string | string[] | null = null, attributes: any = {}) {
        return domUtils.make(tagName, classNames, attributes)
    }

    autoPair(
        event,
        text,
        start,
        end,
        isInInlineMath = false,
        isInInlineCode = false,
        type = "format"
    ) {
        
        const { anchor, focus } = this.instance.context.editable.selection.cachedCursor || {anchor: start, focus: end};
        const oldStart = anchor.offset <= focus.offset ? anchor : focus;
        let needRender = false;

        if (this.text !== text) {
            if (start.offset === end.offset && event.type === "input") {
                const { offset } = start;
                const { autoPairBracket, autoPairMarkdownSyntax, autoPairQuote } = { autoPairBracket: true, autoPairMarkdownSyntax: true, autoPairQuote: true };
                const inputChar = text.charAt(+offset - 1);
                const preInputChar = text.charAt(+offset - 2);
                const prePreInputChar = text.charAt(+offset - 3);
                const postInputChar = text.charAt(+offset);

                if (/^delete/.test(event.inputType)) {
                    // handle `deleteContentBackward` or `deleteContentForward`
                    const deletedChar = this.text[offset];
                    if (
                        event.inputType === "deleteContentBackward" &&
                        postInputChar === BRACKET_HASH[deletedChar]
                    ) {
                        needRender = true;
                        text = text.substring(0, offset) + text.substring(offset + 1);
                    }

                    if (
                        event.inputType === "deleteContentForward" &&
                        inputChar === BACK_HASH[deletedChar]
                    ) {
                        needRender = true;
                        start.offset -= 1;
                        end.offset -= 1;
                        text = text.substring(0, offset - 1) + text.substring(offset);
                    }
                    /* eslint-disable no-useless-escape */
                } else if (
                    event.inputType.indexOf("delete") === -1 &&
                    inputChar === postInputChar &&
                    ((autoPairQuote && /[']{1}/.test(inputChar)) ||
                        (autoPairQuote && /["]{1}/.test(inputChar)) ||
                        (autoPairBracket && /[\}\]\)]{1}/.test(inputChar)) ||
                        (autoPairMarkdownSyntax && /[$]{1}/.test(inputChar)) ||
                        (autoPairMarkdownSyntax &&
                            /[*$`~_]{1}/.test(inputChar) &&
                            /[_*~]{1}/.test(prePreInputChar)))
                ) {
                    needRender = true;
                    text = text.substring(0, offset) + text.substring(offset + 1);
                } else {
                    /* eslint-disable no-useless-escape */
                    // Not Unicode aware, since things like \p{Alphabetic} or \p{L} are not supported yet

                    if (
                        !/\\/.test(preInputChar) &&
                        ((autoPairQuote &&
                            /[']{1}/.test(inputChar) &&
                            !/[a-zA-Z\d]{1}/.test(preInputChar)) ||
                            (autoPairQuote && /["]{1}/.test(inputChar)) ||
                            (autoPairBracket && /[\{\[\(]{1}/.test(inputChar)) ||
                            (type === "format" &&
                                !isInInlineMath &&
                                !isInInlineCode &&
                                autoPairMarkdownSyntax &&
                                !/[a-z0-9]{1}/i.test(preInputChar) &&
                                /[*$`~_]{1}/.test(inputChar)))
                    ) {
                        needRender = true;
                        text = BRACKET_HASH[event.data]
                            ? text.substring(0, offset) +
                            BRACKET_HASH[inputChar] +
                            text.substring(offset)
                            : text;
                    }

                    /* eslint-enable no-useless-escape */
                    // Delete the last `*` of `**` when you insert one space between `**` to create a bullet list.
                    if (
                        type === "format" &&
                        /\s/.test(event.data) &&
                        /^\* /.test(text) &&
                        preInputChar === "*" &&
                        postInputChar === "*"
                    ) {
                        text = text.substring(0, offset) + text.substring(offset + 1);
                        needRender = true;
                    }
                }
            }

            // Just work for `Shift + Enter` to create a soft and hard line break.
            if (
                this.text.endsWith("\n") &&
                start.offset === text.length &&
                (event.inputType === "insertText" || event.type === "compositionend")
            ) {
                text = this.text + event.data;
                start.offset++;
                end.offset++;
            } else if (
                this.text.length === oldStart.offset &&
                this.text[oldStart.offset - 2] === "\n" &&
                event.inputType === "deleteContentBackward"
            ) {
                text = this.text.substring(0, oldStart.offset - 1);
                start.offset = text.length;
                end.offset = text.length;
            }
        }

        return { text, needRender };
    }

    forceUpdate(event?: InputEvent | CompositionEvent) {
        if (!event) {
            return;
        }

        const { editable } = this.instance.context;
        const { selection } = editable;
        const { start, end, focus, anchor, direction } = this.getCursor();
        // const { cursor } = selection
        const textContent = getTextContent(this.nodes.holder, [CLASS_NAMES.ME_INLINE_RENDER]);
        const { text, needRender } = this.autoPair(event, textContent, start, end);
        // console.log(textContent, text, start.offset)
        if (this.block.type !== 'table-td' && this.block.type !== 'table-th' && this.block.type !== 'language' && convertIfNeeded.call(this, text)) {
            return;
        }

        const cursor = {
            anchor: direction === 'forward' ? start : end,
            focus: direction === 'forward' ? end : start,
            anchorBlock: this.block,
            focusBlock: this.block
        }
        if (this.render({ text, cursor, checkUpdate: !needRender })) {
            selection.setCursor(cursor);
        }
    }

    shiftEnterHandler(event) {
        event.preventDefault()

        const { text: oldText } = this
        const cursor = this.getCursor();
        if (!cursor) {
            return;
        }

        const { start, end, anchor } = cursor;
        const text = oldText.substring(0, start.offset) + '\n' + oldText.substring(end.offset);
        anchor.offset = start.offset + 1;
        const focus = anchor;
        this.render({ text, cursor: { anchor, focus, focusBlock: this.block, anchorBlock: this.block } });
        this.setCursor({ anchor })
    }

    enterHandler(event) {
        event.preventDefault()
        const cursor = this.getCursor();
        if (!cursor) {
            return;
        }
        const { text: oldText } = this
        const { start, end } = cursor;
        const text = oldText.substring(0, start.offset)
        this.render({ text })
        const textOfNewNode = oldText.substring(end.offset)
        const postParagraphData: MEBlockData = {
            id: generateId(),
            type: "paragraph",
            text: textOfNewNode
        }
        const paragraphBlock = this.block.insertAdjacent("afterend", { data: postParagraphData, needToFocus: true, focus: { offset: 0 } })
        convertIfNeeded.call(paragraphBlock.renderer, textOfNewNode)
        if(this.block.type !== 'code') {
            convertIfNeeded.call(this, text)
        }
    }

    backspaceHandler(event) {
        const cursor = this.getCursor();
        if (!cursor) {
            return;
        }
        const { start, end } = cursor;
        // Let input handler to handle this case.
        if (start.offset !== end.offset) {
            return
        }

        // fix: #897 in marktext repo
        const tokens = this.datas;
        let needRender = false
        let preToken: MENodeData | null = null
        let needSelectImage = false
        const deleteUnderControl = (type: MENodeType) => {
            return type === 'inline_math' ||
                type === 'html_ruby' ||
                type === 'html_escape' ||
                type === 'emoji' ||
                type === 'image'
        }

        for (const token of tokens) {

            // handle delete the second $ in inline_math.
            if (
                token.range.end === start.offset &&
                deleteUnderControl(token.type)
            ) {
                needRender = true
                token.raw = token.raw.substr(0, token.raw.length - 1)
                break
            }


            // handle pre token is a <ruby> html tag or html escape, need preventdefault.
            if (
                token.range.start + 1 === start.offset &&
                preToken &&
                deleteUnderControl(preToken.type)
            ) {
                needRender = true
                token.raw = token.raw.substr(1)
                break
            }

            preToken = token
        }

        if (needRender) {
            event.preventDefault()
            const text = generator(tokens)
            start.offset--

            this.render({ text, cursor: { focus: start, anchor: start, focusBlock: this.block, anchorBlock: this.block } })
            this.setCursor({ focus: start })
        }

        if (needSelectImage) {
            event.stopPropagation()
        }
    }

    deleteHandler(event) {
        const cursor = this.getCursor();
        if (!cursor) {
            return;
        }
        const { start, end } = cursor;

        const { text: oldText } = this
        // Let input handler to handle this case.
        if (start.offset !== end.offset || start.offset !== oldText.length) {
            return
        }
        const nextBlock = this.block.nextContentInContext();
        if (!nextBlock || nextBlock.type !== 'paragraph') {
            // If the next block is code content or table cell, nothing need to do.
            return
        }

        const paragraphBlock = nextBlock
        let needRemovedBlock = paragraphBlock

        while (
            needRemovedBlock &&
            needRemovedBlock.isOnlyChild &&
            needRemovedBlock.parent
        ) {
            needRemovedBlock = needRemovedBlock.parent
        }

        const text = oldText + nextBlock.renderer.text;
        this.render({ text, cursor: { focus: start, anchor: start, focusBlock: this.block, anchorBlock: this.block } })
        this.setCursor({ focus: start })
        needRemovedBlock.remove()
    }

    handleClickInlineRuleRender(event, inlineRuleRenderEle) {
        event.preventDefault()
        event.stopPropagation()
        const node = inlineRuleRenderEle.closest(`.${CLASS_NAMES.ME_NODE}`)
        const paragraph = findEditableDOM(node);
        const offset = getOffsetOfParent(node, paragraph);
        const begin = +inlineRuleRenderEle.getAttribute('data-begin')
        const length = +inlineRuleRenderEle.getAttribute('data-length')

        const cursor = {
            anchor: { offset: offset + begin },
            focus: { offset: offset + begin + length },
        }
        return this.setCursor(cursor)
    }

    clickHandler(event) {
        // Handler click inline math and inline ruby html.
        const { target } = event
        const inlineRuleRenderEle = target.closest(`.${CLASS_NAMES.ME_INLINE_RENDER}`) ||
            (target.classList.contains(CLASS_NAMES.ME_NODE) && target.querySelector(`.${CLASS_NAMES.ME_INLINE_RENDER}`))

        if (inlineRuleRenderEle) {
            return this.handleClickInlineRuleRender(event, inlineRuleRenderEle)
        }
    }

    arrowHandler(event) {
        const previousContentBlock = this.block.previousContentInContext()
        const nextContentBlock = this.block.nextContentInContext()
        const cursor = this.getCursor();

        if (!cursor) {
            return
        }

        const { start, end } = cursor;
        const rangeRect = this.instance.context.editable.selection.rangeRect;
        const { topOffset, bottomOffset } = getCursorYOffset(this.nodes.el, rangeRect)

        // Just do nothing if the cursor is not collapsed or `shiftKey` pressed
        if (
            start.offset !== end.offset ||
            event.shiftKey
        ) {
            return
        }

        if (
            (event.key === domUtils.keys.ArrowUp && topOffset > 0) ||
            (event.key === domUtils.keys.ArrowDown && bottomOffset > 0)
        ) {
            this.scrollToView()
            return
        }

        let cursorBlock: MEBlockInstance | null = null
        let offset = 0

        if (
            (event.key === domUtils.keys.ArrowUp) ||
            (event.key === domUtils.keys.ArrowLeft && start.offset === 0)
        ) {
            event.preventDefault()

            if (!previousContentBlock) {
                if(this.block.type === 'paragraph' && this.block.outMostBlock.type !== 'paragraph') {
                    const newBlockData: MEBlockData = {
                        id: generateId(),
                        type: 'paragraph',
                        text: ''
                    }
                    cursorBlock = this.block.root.insert({ data: newBlockData, index: 0 })
                    offset = 0
                }
            } else { 
                cursorBlock = previousContentBlock
                offset = previousContentBlock.renderer.text.length
            }
        } else if (
            (event.key === domUtils.keys.ArrowDown) ||
            (event.key === domUtils.keys.ArrowRight && start.offset === this.text.length)
        ) {
            if (nextContentBlock) {
                cursorBlock = nextContentBlock
            } else {
                const newBlockData: MEBlockData = {
                    id: generateId(),
                    type: 'paragraph',
                    text: ''
                }
                cursorBlock = this.block.root.append({ data: newBlockData })
            }
            cursorBlock && (offset = adjustOffset(0, cursorBlock, event))
        } else if (event.key === domUtils.keys.ArrowLeft || event.key === domUtils.keys.ArrowRight) {
            cursorBlock = this.block;
            offset = start.offset + (event.key === domUtils.keys.ArrowLeft ? -1 : 1);
        }

        if (cursorBlock) {
            event.preventDefault()
            cursorBlock.renderer.setCursor({ focus: { offset }, scrollToView: true })
        }
    }

    scrollToView() {
        requestAnimationFrame(() => {
            const { selection } = this.instance.context.editable;
            const { layout } = this.instance.context;
            const rect = selection.rangeRect;
            if (!rect || !layout.nodes.scroller) {
                return
            }

            const scrollRect = layout.nodes.scroller.getBoundingClientRect();
            const { top, bottom } = rect;
            if (top === 0 && bottom === 0) {
                return;
            }

            if (top < scrollRect.top) {
                layout.nodes.scroller.scrollBy(0, top - scrollRect.top);
            }
            if (bottom > scrollRect.bottom) {
                layout.nodes.scroller.scrollBy(0, bottom - scrollRect.bottom + 20);
            }
        })
    }
}