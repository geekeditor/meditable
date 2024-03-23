import { MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEAutoLinkExtension extends MENode {
    static type: MENodeType = "auto_link_extension";
    static tagName: string = "a";
    static async staticRender({data}:MENodeRendererStaticRenderOptions) {
        const { linkType, www, url, email, raw } = data;
        const hyperlink =
            linkType === "www"
                ? encodeURI(`http://${www}`)
                : linkType === "url"
                    ? encodeURI(url)
                    : `mailto:${email}`;
        return `<${this.tagName} class="${this.type}" target="_blank" href="${hyperlink}">${raw}</${this.tagName}>`
    }
    get dirty() {
        const content = this.data?.www || this.data.url || this.data?.email
        if (content && (content !== this.nodes.el.textContent)) {
            return true;
        }
        return false;
    }
    renderSelf(data: MENodeData) {
        const { linkType, www, url, email, raw } = data;
        const hyperlink =
            linkType === "www"
                ? encodeURI(`http://${www}`)
                : linkType === "url"
                    ? encodeURI(url)
                    : `mailto:${email}`;

        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.dataset.nodeType = this.type;
            this.nodes.holder = this.make(this.tagName, [CLASS_NAMES.ME_AUTO_LINK_EXTENSION], { spellcheck: "false", target: "_blank", href: hyperlink });
            this.nodes.el.appendChild(this.nodes.holder);
        }

        const el = this.nodes.holder as HTMLAnchorElement;
        if(hyperlink !== el.href) {
            el.href = hyperlink;
        }
        if(raw !== el.textContent) {
            el.textContent = raw;
        }
    }
}