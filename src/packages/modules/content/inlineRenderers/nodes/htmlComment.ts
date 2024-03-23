import { MENodeData, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEHtmlComment extends MENode {
    static type: MENodeType = "html_comment";
    renderSelf(data: MENodeData) {

        const { openTag } = data;

        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_FIXED_MARKER}" spellcheck="false">`
            this.nodes.el.dataset.nodeType = this.type;
        }

        if (openTag !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = openTag || ''
        }
    }
}