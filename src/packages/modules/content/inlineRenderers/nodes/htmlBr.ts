import { MENodeData, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEHtmlBr extends MENode {
    static type: MENodeType = "html_br";
    static async staticRender() {
        return `<br class="${this.type}"/>`
    }
    renderSelf(data: MENodeData) {

        const { tag, openTag } = data;
        const classNames = [CLASS_NAMES.ME_HTML_TAG]

        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}" spellcheck="false">`
            this.nodes.el.dataset.nodeType = this.type;

            this.nodes.holder = this.make(tag, classNames);
            this.nodes.el.appendChild(this.nodes.holder);
        }

        if (openTag !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = openTag || ''
        }
    }
}