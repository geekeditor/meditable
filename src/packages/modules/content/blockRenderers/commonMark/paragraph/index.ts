import { MEBlockType, MENodeData } from "@/packages/types";
import MEBlockRenderer from "../../renderer";
import { checkNotSameDatas, inlinePatch } from "../../../utils/patch";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { checkCursorAtEndFormat, indentListItem, insertTab, isIndentableListItem, isUnindentableListItem, unindentListItem } from "./tab";
import { handleBackspaceInBlockQuote, handleBackspaceInList, handleBackspaceInParagraph } from "./backspace";
import { enterConvert, enterInBlockQuote, enterInListItem } from "./enter";

export default class MEParagraphRenderer extends MEBlockRenderer {
    static type: MEBlockType = "paragraph";
    static tagName: string = 'p';
    protected _datas: MENodeData[] = [];
    protected _isInlineRendered: boolean = false;


    get dirty() {
        const childNodes = Array.from(this.nodes.holder.childNodes)
        return childNodes.some((node)=>node.nodeType===3) || (this.children || []).some((node) => node.dirty)
    }

    updateContent(checkUpdate?: boolean) {
        if (!this.nodes.el) {
            this.nodes.el = this.make(this.tagName);
            this.nodes.holder = this.make('span', [CLASS_NAMES.ME_EDITABLE], { contenteditable: 'true' });
            this.nodes.el.appendChild(this.nodes.holder);
        }

        this.updateChildren(checkUpdate);
        return this._isInlineRendered;
    }

    protected updateChildren(checkUpdate?: boolean) {
        const datas: MENodeData[] = this.tokenizer()
        this._isInlineRendered = false;
        if (!checkUpdate || (checkNotSameDatas(this._datas, datas) || this.dirty || this.nodes.holder.childNodes.length !== datas.length)) {
            const cursor = this.renderCursor;
            if (cursor?.anchorBlock === this.block || cursor?.anchorBlockId === this.block.id) {
                const anchorOffset = cursor.anchor.offset;
                datas.forEach((d) => {
                    if (d.range.start <= anchorOffset && anchorOffset <= d.range.end) {
                        d.actived = true;
                    }
                })
            }
            if ((cursor?.focusBlock === this.block || cursor?.focusBlockId === this.block.id) && (cursor.focusBlock !== cursor.anchorBlock || cursor.focus.offset !== cursor.anchor.offset)) {
                const focusOffset = cursor.focus.offset;
                datas.forEach((d) => {
                    if (d.range.start <= focusOffset && focusOffset <= d.range.end) {
                        d.actived = true;
                    }
                })
            }
            inlinePatch.call(this, datas);
            this._isInlineRendered = true;

        }
        this._datas = datas;
    }

    paragraphParentType() {
        if (this.block.type !== 'paragraph') {
            return
        }

        let { parent } = this.block
        let type = 'paragraph'

        while (parent && parent.parent) {
            if (
                parent.type === 'block-quote' ||
                parent.type === 'list-item' ||
                parent.type === 'task-list-item'
            ) {
                type = parent.type
                break
            }

            parent = parent.parent
        }

        return type
    }

    enterHandler(event: KeyboardEvent) {
        this.scrollToView()
        if (event.shiftKey) {
            return this.shiftEnterHandler(event)
        }

        const type = this.paragraphParentType()
        let handled = enterConvert.call(this, event);
        if(!handled) {
            if (type === 'block-quote') {
                handled = enterInBlockQuote.call(this, event)
            } else if (type === 'list-item' || type === 'task-list-item') {
                handled = enterInListItem.call(this, event)
            }
        }

        if(!handled) {
            super.enterHandler(event);
        }
    }

    backspaceHandler(event: KeyboardEvent) {
        const cursor = this.getCursor();
        if (!cursor) {
            return null;
        }

        const { start, end } = cursor

        if (start.offset === 0 && end.offset === 0) {
            event.preventDefault()
            const type = this.paragraphParentType()

            switch (type) {
                case 'paragraph':
                    return handleBackspaceInParagraph.call(this)

                case 'block-quote':
                    return handleBackspaceInBlockQuote.call(this)

                case 'list-item':

                case 'task-list-item':
                    return handleBackspaceInList.call(this)

                default:
                    break
            }
        } else {
            super.backspaceHandler(event)
        }
    }

    tabHandler(event: KeyboardEvent) {
        // disable tab focus
        event.preventDefault()

        const cursor = this.getCursor();
        if (!cursor) {
            return null;
        }

        const { start, end } = cursor

        if (event.shiftKey) {
            const unindentType = isUnindentableListItem.call(this)

            if (unindentType) {
                unindentListItem.call(this, unindentType)
            }

            return
        }

        // Handle `tab` to jump to the end of format when the cursor is at the end of format content.
        if (start.offset === end.offset) {
            const atEnd = checkCursorAtEndFormat.call(this)

            if (atEnd) {
                const offset = start.offset + atEnd.offset

                return this.setCursor({ focus: { offset } })
            }
        }

        if (isIndentableListItem.call(this)) {
            return indentListItem.call(this)
        }

        return insertTab.call(this)
    }
}