import { MENodeData, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEHtmlRuby extends MENode {
    static type: MENodeType = "html_ruby";

    get dirty() {
        const content = this.data?.raw
        if (content !== this.textContent) {
            return true;
        }

        return false;
    }
    renderSelf(data: MENodeData) {

        const { raw, openTag, closeTag} = data;
        const { start, end } = data.range;
        const dataset = {
            start: start + openTag.length, // '<ruby>'.length
            end: end - closeTag.length, //'</ruby>'.length
        }

        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE, CLASS_NAMES.ME_RUBY]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}" spellcheck="false"></span>`
            this.nodes.el.dataset.nodeType = this.type;

            const preview = this.make('span', [CLASS_NAMES.ME_INLINE_RENDER], {
                contenteditable: "false",
                spellcheck: "false",
            }, dataset);
            this.nodes.el.appendChild(preview);
        } else {
            const el = this.nodes.el.lastElementChild as HTMLElement;
            for (const key in dataset) {
                if (Object.prototype.hasOwnProperty.call(dataset, key)) {
                    el.dataset[key] = dataset[key]
                }
            }
        }

        if (raw !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = raw
        }

        if (raw !== this.nodes.el.lastElementChild.innerHTML) {
            this.nodes.el.lastElementChild.innerHTML = raw
        }
    }
}