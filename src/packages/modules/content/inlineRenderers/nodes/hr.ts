import { MENodeData, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEHr extends MENode {
    static type: MENodeType = "hr";
    get dirty() {
        const marker = this.data?.marker
        if(marker && (marker !== this.nodes.el.firstChild?.textContent || marker !== this.nodes.el.lastChild?.textContent)){
            return true;
        }
        return false;
    }
    renderSelf(data: MENodeData) {
        if(!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}">${data.marker}</span>`
            this.nodes.el.dataset.nodeType = this.type;
        }

        const marker = data.marker;
        if(this.nodes.el.firstChild && marker !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = marker || '***'
        }
    }
}