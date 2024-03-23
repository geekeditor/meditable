import { MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import sanitize, { isValidAttribute } from "@/packages/utils/dompurify";
import { BLOCK_TYPE6 } from "@/packages/utils/nodeTypes";

export default class MEHtmlTag extends MENode {
    static type: MENodeType = "html_tag";
    static async staticRender({data, innerHTML}:MENodeRendererStaticRenderOptions) {
        const { tag, openTag, closeTag, attrs } = data;
        const tagName = BLOCK_TYPE6.includes(tag) || !sanitize(`<${tag}>`) ? "span" : tag;
        const classNames = [this.type]
        const attributes = {}

        if (attrs.class && /\S/.test(attrs.class)) {
            const names = attrs.class.split(/\s+/)
            classNames.push(...names)
        }

        if (tagName === "code" || tagName === "kbd") {
            Object.assign(attributes, { spellcheck: "false" });
        }

        for (const attr of Object.keys(attrs)) {
            if (attr !== "class") {
                const attrData = attrs[attr];
                if (isValidAttribute(tag, attr, attrData)) {
                    attributes[attr] = attrData;
                }
            }
        }
        const attrString = Object.entries(attributes).map(([key, value])=>(`${key}="${value}"`)).join(" ")
        return `<${tagName} class="${classNames.join(" ")}" ${attrString}>${innerHTML}</${tagName}>`
    }

    get dirty() {
        const closeTag = this.data?.closeTag
        const openTag = this.data?.openTag
        const content = this.data?.content
        if (openTag !== this.nodes.el.firstChild?.textContent || closeTag !== this.nodes.el.lastChild?.textContent || content !== this.nodes.holder.textContent) {
            return true;
        }

        return false;
    }
    renderSelf(data: MENodeData) {

        const { tag, openTag, closeTag, attrs } = data;
        const { start, end } = data.range;
        const tagName = BLOCK_TYPE6.includes(tag) || !sanitize(`<${tag}>`) ? "span" : tag;
        const classNames = [CLASS_NAMES.ME_HTML_TAG]
        const attributes = {}
        const dataset = {
            start,
            end,
            raw: data.raw,
        }

        if (attrs.class && /\S/.test(attrs.class)) {
            const names = attrs.class.split(/\s+/)
            classNames.push(...names)
        }

        if (tagName === "code" || tagName === "kbd") {
            Object.assign(attributes, { spellcheck: "false" });
        }

        for (const attr of Object.keys(attrs)) {
            if (attr !== "class") {
                const attrData = attrs[attr];
                if (isValidAttribute(tag, attr, attrData)) {
                    attributes[attr] = attrData;
                }
            }
        }

        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}" spellcheck="false"></span><span class="${CLASS_NAMES.ME_MARKER}" spellcheck="false"></span>`
            this.nodes.el.dataset.nodeType = this.type;

            this.nodes.holder = this.make(tagName, classNames, attributes, dataset);
            this.nodes.el.insertBefore(this.nodes.holder, this.nodes.el.lastChild);
        } else {
            if (tagName !== this.nodes.holder.tagName.toLowerCase()) {
                const docFrame = document.createDocumentFragment()
                let node
                while ((node = this.nodes.holder.firstChild)) {
                    docFrame.appendChild(node)
                }
                const holder = this.make(tagName, classNames, attributes, dataset);
                holder.appendChild(docFrame);

                this.nodes.holder.replaceWith(holder);
                this.nodes.holder = holder;
            } else {

                const el = this.nodes.holder;
                classNames.forEach((className)=>{
                    el.classList.toggle(className, true);
                })
                el.classList.forEach((className)=>{
                    el.classList.toggle(className, classNames.includes(className))
                })

                for(let key in el.attributes) {
                    const value = attributes[key]
                    if(value) {
                        el.setAttribute(key, value)
                        delete attributes[key]
                    } else {
                        el.removeAttribute(key)
                    }
                }

                for(let key in attributes) {
                    el.setAttribute(key, attributes[key])
                }
        
                for (const key in dataset) {
                    if (Object.prototype.hasOwnProperty.call(dataset, key)) {
                        el.dataset[key] = dataset[key]
                    }
                }

            }
        }

        if (openTag !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = openTag || ''
        }

        if (closeTag !== this.nodes.el.lastChild.textContent) {
            this.nodes.el.lastChild.textContent = closeTag || ''
        }
    }
}