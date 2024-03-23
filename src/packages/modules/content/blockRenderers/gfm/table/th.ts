import { MEBlockData, MEBlockType } from "@/packages/types";
import METableTdRenderer from "./td";
import { generateId } from "@/packages/utils/utils";

export default class METableThRenderer extends METableTdRenderer {
    static type: MEBlockType = "table-th";
    static tagName: string = 'th';

    get rowOffset() {
        return this.row.index
    }

    findNextRow() {
        const { row } = this
        return row.next || row.parent.next?.firstChild
    }

    findPreviousRow() {
        const { row } = this
        return row.previous || null
    }

    commandEnter(event) {
        const { table } = this
        const tableRenderer = table.renderer as any;

        const cell = tableRenderer.insertRow(0)
        cell.renderer.setCursor()
    }

    commandDelete(event) {
        const {table, cell, row} = this
        const focusRow = this.findNextRow()
        if(focusRow) {
            const index = cell.index;
            const data: MEBlockData = {
                id: generateId(),
                type: 'table-tr', 
                children: focusRow.data.children.map((c)=>{
                    return {
                        ...c,
                        type: 'table-th'
                    }
                })
            }

            const newRow = row.replaceWith({data})
            const focusBlock = newRow.children[index].firstContentInDescendant()
            focusRow.remove()
            focusBlock.renderer.setCursor()
        } else {
            event.preventDefault()
            const data: MEBlockData = {
                id: generateId(),
                type: 'paragraph',
                text: ''
            }
            table.replaceWith({data, needToFocus: true})
        } 
    }
}