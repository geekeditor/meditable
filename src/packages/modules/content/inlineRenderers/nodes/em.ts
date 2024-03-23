import { MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEEm extends MENode {
    static type: MENodeType = "em";
    static tagName: string = "em";
    static async staticRender({innerHTML}:MENodeRendererStaticRenderOptions) {
        return `<${this.tagName} class="${this.type}">${innerHTML}</${this.tagName}>`
    }

    get dirty() {
        const marker = this.data?.marker
        if(marker && (marker !== this.nodes.el.firstChild?.textContent || marker !== this.nodes.el.lastChild?.textContent)){
            return true;
        }
        return super.dirty;
    }

    renderSelf(data: MENodeData) {
        if(!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}">${data.marker}</span><span class="${CLASS_NAMES.ME_MARKER}">${data.marker}</span>`
            this.nodes.el.dataset.nodeType = this.type;

            this.nodes.holder = this.make(this.tagName);
            this.nodes.el.insertBefore(this.nodes.holder, this.nodes.el.lastChild);
        }

        const marker = data.marker;
        if(this.nodes.el.firstChild && marker !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = marker || '*'
        }

        if(this.nodes.el.lastChild && marker !== this.nodes.el.lastChild.textContent) {
            this.nodes.el.lastChild.textContent = marker || '*'
        }
    }
}