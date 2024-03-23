import { MENodeData, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEMultipleMath extends MENode {
    static type: MENodeType = "multiple_math";
    renderSelf(data: MENodeData) {

        const { marker } = data;

        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_FIXED_MARKER}" spellcheck="false">${marker}</span>`
            this.nodes.el.dataset.nodeType = this.type;
        }
    }
}