import { MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { sanitizeHyperlink } from "@/packages/utils/url";

export default class MEReferenceLink extends MENode {
    static type: MENodeType = "reference_link";
    static async staticRender({data, innerHTML}:MENodeRendererStaticRenderOptions) {
        const { href, title } = data;
        const hyperlink = sanitizeHyperlink(encodeURI(href));
        return `<${this.tagName} class="${this.type}" target="_blank" href="${hyperlink}" title="${title}">${innerHTML||''}</${this.tagName}>`
    }
    get dirty() {
        const { raw, anchor } = this.data;
        const startMarker = "["
        const endMarker = raw.substring(1+anchor.length)
        if((startMarker !== this.nodes.el.firstChild?.textContent || endMarker !== this.nodes.el.lastChild?.textContent) || (anchor !== this.nodes.holder.textContent)){
            return true;
        }
        return super.dirty;
    }
    get tagName() {
        return 'a'
    }
    renderSelf(data: MENodeData) {

        const { raw, href, title, anchor } = data;
        const {start, end} = data.range;
        const dataset = {
            start,
            end,
            raw
        }
        const hyperlink = sanitizeHyperlink(encodeURI(href));
        if(!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}"></span><span class="${CLASS_NAMES.ME_MARKER}"></span>`
            this.nodes.el.dataset.nodeType = this.type;

            this.nodes.holder = this.make(this.tagName, [CLASS_NAMES.ME_REFERENCE_LINK], {spellcheck: "false", target: "_blank", href: hyperlink, title}, dataset);
            this.nodes.el.insertBefore(this.nodes.holder, this.nodes.el.lastChild);
        } else {
            const el = this.nodes.holder as HTMLAnchorElement;
            el.href = hyperlink;

            for (const key in dataset) {
                if (Object.prototype.hasOwnProperty.call(dataset, key)) {
                    el.dataset[key] = dataset[key]
                }
            }

        }


        const startMarker = "["
        const endMarker = raw.substring(1+anchor.length);

        if(startMarker !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = startMarker
        }

        if(endMarker !== this.nodes.el.lastChild.textContent) {
            this.nodes.el.lastChild.textContent = endMarker
        }
    }
}