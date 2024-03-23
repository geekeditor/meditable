import { MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { sanitizeHyperlink } from "@/packages/utils/url";

export default class MEAutoLink extends MENode {
    static type: MENodeType = "auto_link";
    static tagName: string = "a";
    static async staticRender({data}:MENodeRendererStaticRenderOptions) {
        const { isLink, href, email, content } = data;
        const hyperlink = sanitizeHyperlink(isLink ? encodeURI(href) : `mailto:${email}`);
        return `<${this.tagName} class="${this.type}" target="_blank" href="${hyperlink}">${content}</${this.tagName}>`
    }
    get dirty() {
        const content = this.data?.url || this.data?.email;
        if(("<" !== this.nodes.el.firstChild?.textContent || ">" !== this.nodes.el.lastChild?.textContent) || (content !== this.nodes.holder.textContent)){
            return true;
        }
        return false;
    }
    renderSelf(data: MENodeData) {

        const { isLink, href, email } = data;
        const hyperlink = sanitizeHyperlink(isLink ? encodeURI(href) : `mailto:${email}`);
        if(!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}"><</span><span class="${CLASS_NAMES.ME_MARKER}">></span>`
            this.nodes.el.dataset.nodeType = this.type;

            this.nodes.holder = this.make(this.tagName, [CLASS_NAMES.ME_AUTO_LINK], {spellcheck: "false", target: "_blank", href: hyperlink});
            this.nodes.el.insertBefore(this.nodes.holder, this.nodes.el.lastChild);
        } else {
            const el = this.nodes.holder as HTMLAnchorElement;
            el.href = hyperlink;
        }

        if("<" !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = "<"
        }

        if(">" !== this.nodes.el.lastChild.textContent) {
            this.nodes.el.lastChild.textContent = ">"
        }
    }
}