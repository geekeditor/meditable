import { MEBlockData, MEBlockInstance, MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../../renderer";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { generateId } from "@/packages/utils/utils";

export class METableTheadRenderer extends MEBlockRenderer {
    static type: MEBlockType = "table-thead";
    static tagName: string = 'thead';
    get anchor() {
        return this.block.parent;
    }
}

export class METableTbodyRenderer extends MEBlockRenderer {
    static type: MEBlockType = "table-tbody";
    static tagName: string = 'tbody';
    get anchor() {
        return this.block.parent;
    }
}

export class METableTrRenderer extends MEBlockRenderer {
    static type: MEBlockType = "table-tr";
    static tagName: string = 'tr';

    get isEmpty() {
        const state = this.block.data;
        return state.children.every(cell => cell.text === '');
    }

    get anchor() {
        return this.block.parent.parent;
    }
}

export default class METableRenderer extends MEBlockRenderer {
    static type: MEBlockType = "table";
    updateContent(checkUpdate?: boolean): boolean {
        if (!this.nodes.el) {
            this.nodes.el = this.make('figure');
            this.nodes.holder = this.make('table', [CLASS_NAMES.ME_TASK_LIST_ITEM_CONTENT]);
            this.nodes.el.appendChild(this.nodes.holder);
        }
        return true;
    }

    get isEmpty() {
        const state = this.block.data;
        return state.children.every((section) => section.children.every(row => row.children.every(cell => cell.text === '')));
    }

    get rowCount() {
        return this.block.firstChild.children.length + this.block.lastChild.children.length;
    }

    get columnCount() {
        return this.block.firstChild.firstChild.children.length;
    }

    get body() {
        return this.block.lastChild;
    }

    get head() {
        return this.block.firstChild;
    }

    empty() {
        const { isEmpty } = this
        if (isEmpty) {
            return
        }

        const table = this.block
        table.children.forEach(section => {
            section.children.forEach(row => {
                row.children.forEach(cell => {
                    cell.renderer.render({ text: "" })
                })
            })
        })
    }

    insertRow(offset: number) {
        const { columnCount } = this
        const firstRowState = this.head.children[0].data;
        const rowData: MEBlockData = {
            id: generateId(),
            type: 'table-tr',
            children: [...new Array(columnCount)].map((_, i) => {
                return {
                    id: generateId(),
                    type: 'table-td',
                    meta: {
                        align: firstRowState.children[i].meta.align
                    },
                    text: ''
                }
            })
        }

        const rowBlock = this.body.insert({data: rowData, index: offset})
        return rowBlock.firstContentInDescendant()
    }

    insertColumn(offset: number, align = 'none') {
        const cells: MEBlockInstance[] = []
        this.head.children.forEach(row => {
            const cellData: MEBlockData = {
                id: generateId(),
                type: 'table-th',
                meta: { align },
                text: ''
            }

            const cell = row.insert({data: cellData, index: offset})
            cells.push(cell)
        })

        this.body.children.forEach(row => {
            const cellData: MEBlockData = {
                id: generateId(),
                type: 'table-td',
                meta: { align },
                text: ''
            }

            const cell = row.insert({data: cellData, index: offset})
            cells.push(cell)
        })

        return cells
    }

    removeRow(offset: number) {
        const row = this.body.children[offset]
        row?.remove()
    }

    removeColumn(offset: number) {
        const { columnCount } = this
        if (offset < 0 || offset >= columnCount) {
            return
        }

        if (this.columnCount === 1) {
            return this.block.remove()
        }

        this.head.children.forEach(row => {
            const cell = row.children[offset]
            cell?.remove()
        })

        this.body.children.forEach(row => {
            const cell = row.children[offset]
            cell?.remove()
        })
    }

    alignColumn(offset, value) {
        const { columnCount } = this
        if (offset < 0 || offset >= columnCount) {
            return
        }
        
        this.head.children.forEach(row => {
            const cell = row.children[offset]
            if (cell) {
                let renderer = cell.renderer as any;
                const { align: oldValue } = renderer;
                renderer.align = oldValue === value ? 'none' : value;
            }
        })

        this.body.children.forEach(row => {
            const cell = row.children[offset]
            if (cell) {
                let renderer = cell.renderer as any;
                const { align: oldValue } = renderer;
                renderer.align = oldValue === value ? 'none' : value;
            }
        })
    }
}

