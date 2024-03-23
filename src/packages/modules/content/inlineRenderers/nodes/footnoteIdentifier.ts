import { MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEFootnoteIdentifier extends MENode {
    static type: MENodeType = "footnote_identifier";
    static tagName: string = "a";
    static async staticRender({data}:MENodeRendererStaticRenderOptions) {
        const { content } = data;
        return `<sup class="${this.type}"><${this.tagName}>${content}</${this.tagName}></sup>`
    }
    get dirty() {
        const startMarker = this.data?.marker
        const endMarker = `]`
        const content = this.data?.content
        if((startMarker !== this.nodes.el.firstChild?.textContent || endMarker !== this.nodes.el.lastChild?.textContent) || (content !== this.nodes.holder.textContent)){
            return true;
        }
        return super.dirty;
    }
    renderSelf(data: MENodeData) {

        const { marker, content } = data;
        const id = `noteref-${content}`
        if(!this.nodes.el) {
            this.nodes.el = this.make("sup", [CLASS_NAMES.ME_NODE], {id});
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}"></span><span class="${CLASS_NAMES.ME_MARKER}"></span>`
            this.nodes.el.dataset.nodeType = this.type;

            this.nodes.holder = this.make(this.tagName, [CLASS_NAMES.ME_LINK], {spellcheck: "false"});
            this.nodes.el.insertBefore(this.nodes.holder, this.nodes.el.lastChild);
        } else {
            const el = this.nodes.holder as HTMLAnchorElement;
            el.id = id;
        }


        const startMarker = marker
        const endMarker = `]`

        if(startMarker !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = startMarker
        }

        if(endMarker !== this.nodes.el.lastChild.textContent) {
            this.nodes.el.lastChild.textContent = endMarker
        }
    }
}