import { MENodeData, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class METailHeader extends MENode {
    static type: MENodeType = "tail_header";
    renderSelf(data: MENodeData) {

        const { raw } = data;

        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_TAIL_HEADER}" spellcheck="false">`
            this.nodes.el.dataset.nodeType = this.type;
        }

        if (raw !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = raw || ''
        }
    }
}