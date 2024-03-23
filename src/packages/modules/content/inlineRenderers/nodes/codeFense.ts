import { MENodeData, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MECodeFense extends MENode {
    static type: MENodeType = "code_fense";
    get dirty() {
        const marker = this.data?.marker
        if(marker && (marker !== this.nodes.el.firstChild?.textContent)){
            return true;
        }
        return super.dirty;
    }
    renderSelf(data: MENodeData) {
        if(!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}"></span><span></span>`
            this.nodes.el.dataset.type = this.type;

            this.nodes.holder = this.nodes.el.lastChild as HTMLElement;
        } else if(!this.nodes.holder.parentNode) {
            // fix: holer node  removed by Backspace key
            this.nodes.el.appendChild(this.nodes.holder)
        }

        const marker = data.marker||""
        if(this.nodes.el.firstChild && marker !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = marker || ''
        }

        const content = data.content || '';
        if(content !== this.nodes.holder.textContent) {
            this.nodes.holder.textContent = content
        }
    }
}