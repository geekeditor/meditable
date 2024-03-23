import { MENodeData, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MESoftLineBreak extends MENode {
    static type: MENodeType = "soft_line_break";
    static async staticRender() {
        return `<br class="${this.type}"/>`
    }
    renderSelf(data: MENodeData) {
        if(!this.nodes.el) {
            const classNames = [CLASS_NAMES.ME_NODE, CLASS_NAMES.ME_SOFT_LINE_BREAK]
            if(data.isAtEnd) {
                classNames.push(CLASS_NAMES.ME_LINE_END)
            }
            this.nodes.el = this.make("span", classNames)
            this.nodes.el.dataset.nodeType = this.type
            this.nodes.holder = this.nodes.el
        }
        this.nodes.el.textContent = data.lineBreak
        this.nodes.el.classList.toggle(CLASS_NAMES.ME_LINE_END, data.isAtEnd)
    }
}