import { MEBlockData, MEBlockType } from "@/packages/types";
import MEParagraphRenderer from "../../commonMark/paragraph";
import { generateId } from "@/packages/utils/utils";
import domUtils from "@/packages/utils/domUtils";

export default class METableTdRenderer extends MEParagraphRenderer {
    static type: MEBlockType = "table-td";
    static tagName: string = 'td';

    get anchor() {
        return this.table
    }

    get table() {
        return this.block.closestBlock('table')
    }

    get head() {
        return this.table.firstChild
    }

    get body() {
        return this.table.lastChild
    }

    get row() {
        return this.block.closestBlock('table-tr')
    }

    get cell() {
        return this.block
    }

    get rowOffset() {
        return this.head.children.length + this.row.index
    }

    get columnOffset() {
        return this.cell.index
    }

    get align() {
        return this.meta.align
    }

    set align(value) {
        this.nodes.el.dataset.align = value
        this.meta.align = value
    }

    get isAtTop(): boolean {
        const { selection } = this.instance.context.editable;
        const currentInput = this.nodes.holder;
        if(!currentInput) {
            return false;
        }

        const cursorRect = selection.rangeRect;
        const cursorMid = cursorRect.top + cursorRect.height / 2;
        const inputRect = currentInput.getBoundingClientRect();
        const style = window.getComputedStyle(currentInput);
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const lineHeight = parseFloat(style.lineHeight) || 0;
        
        const offsetY = cursorMid - inputRect.top - paddingTop;
        const cursorLine = Math.ceil(offsetY / lineHeight);
        return cursorLine <= 1;
    }

    get isAtBottom(): boolean {
        const { selection } = this.instance.context.editable;
        const currentInput = this.nodes.holder;
        if(!currentInput) {
            return false;
        }

        /**
         * Todo: There is a deviation: when the cursor is displayed on the far left, the obtained value is the far right value of the previous line
         */
        const cursorRect = selection.rangeRect; 
        const cursorMid = cursorRect.top + cursorRect.height / 2;

        const inputRect = currentInput.getBoundingClientRect();
        const style = window.getComputedStyle(currentInput);
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const paddingBottom = parseFloat(style.paddingBottom) || 0;
        const lineHeight = parseFloat(style.lineHeight) || 0;
        const lineCount =  Math.round((inputRect.height - paddingTop - paddingBottom) / lineHeight) ;
        
        const offsetY = cursorMid - inputRect.top - paddingTop;
        const cursorLine = Math.ceil(offsetY / lineHeight);
        return cursorLine >= lineCount;
    }

    findNextRow() {
        const { row } = this
        return row.next || null
    }

    findPreviousRow() {
        const { row } = this
        return row.previous || row.parent.previous?.lastChild
    }

    shiftEnter(event) {
        const { start, end, anchor } = this.getCursor()
        const { text: oldText } = this

        const br = '<br/>'
        const text = oldText.substring(0, start.offset) + br + oldText.substring(end.offset)
        anchor.offset = start.offset + br.length;
        const focus = anchor;
        this.render({ text, cursor: { anchor, focus, focusBlock: this.block, anchorBlock: this.block } });
        this.setCursor({ anchor })
    }

    commandEnter(event) {
        const { row, table } = this
        const rowRenderer = row.renderer as any;
        const tableRenderer = table.renderer as any;

        if (!row.isLastChild || !rowRenderer.isEmpty) {
            const cell = tableRenderer.insertRow(row.index + 1)
            cell.renderer.setCursor()
        } else {
            const newBlockData: MEBlockData = {
                id: generateId(),
                type: "paragraph",
                text: ""
            }
            const newBlockOptions = { data: newBlockData, needToFocus: true, focus: { offset: 0 } }
            table.insertAdjacent("afterend", newBlockOptions)
            row.remove()
        }
    }

    normalEnter(event) {
        const nextRow = this.findNextRow()
        const { row, table } = this
        let cursorBlock = null
        if (nextRow) {
            cursorBlock = nextRow.firstContentInDescendant()
        } else {
            const lastCellContent = row.lastContentInDescendant()
            const nextContent = lastCellContent.nextContentInContext()
            if (nextContent) {
                cursorBlock = nextContent
            } else {

                const newBlockData: MEBlockData = {
                    id: generateId(),
                    type: "paragraph",
                    text: ""
                }
                const newBlockOptions = { data: newBlockData, needToFocus: true, focus: { offset: 0 } }
                cursorBlock = table.insertAdjacent("afterend", newBlockOptions)
            }
        }

        cursorBlock.renderer.setCursor()
    }

    enterHandler(event) {
        event.preventDefault()
        this.scrollToView()
        if (event.shiftKey) {
            return this.shiftEnter(event)
        } else if (event.metaKey || event.ctrlKey || event.commandKey) {
            return this.commandEnter(event)
        } else {
            return this.normalEnter(event)
        }
    }

    arrowHandler(event) {
        const previousRow = this.findPreviousRow()
        const nextRow = this.findNextRow()
        const { table, cell, row } = this
        const offset = cell.index
        const tablePrevContent = table.previous ? table.previous.lastContentInDescendant() : null
        const tableNextContent = table.next ? table.next.firstContentInDescendant() : null

        if (event.key === domUtils.keys.ArrowUp && this.isAtTop) {
            event.preventDefault()
            if (previousRow) {
                const cursorBlock = previousRow.children[offset].firstContentInDescendant()
                const cursorOffset = cursorBlock.renderer.text.length
                cursorBlock.renderer.setCursor({ focus: { offset: cursorOffset } })
            } else if (tablePrevContent) {
                const cursorOffset = tablePrevContent.renderer.text.length
                tablePrevContent.renderer.setCursor({ focus: { offset: cursorOffset } })
            } else {
                const data: MEBlockData = {
                    id: generateId(),
                    type: 'paragraph',
                    text: ''
                }

                table.root.insert({data, index: 0, needToFocus: true})
            }
            this.scrollToView()
        } else if (event.key === domUtils.keys.ArrowDown && this.isAtBottom) {
            event.preventDefault()

            if (nextRow) {
                const cursorBlock = nextRow.children[offset].firstContentInDescendant()
                cursorBlock.renderer.setCursor()
            } else {
                let cursorBlock = null
                if (tableNextContent) {
                    cursorBlock = tableNextContent
                } else {
                    const data: MEBlockData = {
                        id: generateId(),
                        type: 'paragraph',
                        text: ''
                    }

                    const newParagraphBlock = table.insertAdjacent('afterend', { data })
                    cursorBlock = newParagraphBlock.firstContentInDescendant()
                }

                cursorBlock.renderer.setCursor()
            }
            this.scrollToView()
        } else {
            super.arrowHandler(event)
        }
    }

    backspaceHandler(event) {
        const { table } = this
        const tableRenderer = table.renderer as any;

        const { start, end } = this.getCursor()
        const previousContentBlock = this.block.previousContentInContext()

        if (start.offset !== 0 || start.offset !== end.offset) {
            return
        }

        event.preventDefault()

        if ((!previousContentBlock || (previousContentBlock.type !== 'table-td' && previousContentBlock.type !== 'table-th')) && tableRenderer.isEmpty) {
            const data: MEBlockData = {
                id: generateId(),
                type: 'paragraph',
                text: ''
            }
            this.table.replaceWith({ data, needToFocus: true })
        } else {
            const offset = previousContentBlock.renderer.text.length
            previousContentBlock.renderer.setCursor({ focus: { offset } })
        }

        return true;
    }
    commandDelete(event) {
        event.preventDefault()
        const { table, cell, row } = this

        const focusRow = this.findNextRow() || this.findPreviousRow()
        if (focusRow) {
            const focusBlock = focusRow.children[cell.index].firstContentInDescendant()
            row.remove()
            focusBlock.renderer.setCursor()
        } else {
            const data: MEBlockData = {
                id: generateId(),
                type: 'paragraph',
                text: ''
            }
            table.replaceWith({ data, needToFocus: true })
        }
    }

    shiftCommandDelete(event) {
        event.preventDefault()
        const { table, cell } = this
        const tableRenderer = table.renderer as any

        const focusBlock = cell.next || cell.previous
        if (focusBlock) {
            tableRenderer.removeColumn(cell.index)
            focusBlock.renderer.setCursor()
        } else {
            const data: MEBlockData = {
                id: generateId(),
                type: 'paragraph',
                text: ''
            }
            table.replaceWith({ data, needToFocus: true })
        }
    }

    deleteHandler(event) {
        if (event.metaKey || event.ctrlKey) {
            if (event.shiftKey) {
                return this.shiftCommandDelete(event)
            } else {
                return this.commandDelete(event)
            }
        } else {
            return super.deleteHandler(event)
        }
    }

    shiftTab(event) {
        // Insert column
        const { columnOffset, rowOffset, table } = this
        const tableRenderer = table.renderer as any

        const cells = tableRenderer.insertColumn(columnOffset + 1)
        cells[rowOffset].renderer.setCursor()
    }

    normalTab(event) {
        const nextContentBlock = this.block.nextContentInContext()

        if (nextContentBlock) {
            nextContentBlock.renderer.setCursor()
        }
    }

    tabHandler(event) {
        event.preventDefault()

        if (event.shiftKey) {
            return this.shiftTab(event)
        } else {
            return this.normalTab(event)
        }
    }

}