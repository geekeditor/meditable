import { MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { validEmoji } from "@/packages/utils/emoji";

export default class MEEmoji extends MENode {
    static type: MENodeType = "emoji";
    static async staticRender({data}:MENodeRendererStaticRenderOptions) {
        const { content, marker, raw } = data;
        const validation = validEmoji(content)
        return validation.emoji
    }
    get dirty() {
        const raw = this.data?.raw
        if (raw !== this.nodes.el.firstChild?.textContent) {
            return true;
        }

        return false;
    }
    renderSelf(data: MENodeData) {

        const { content, marker, raw } = data;
        const validation = validEmoji(content)
        const { start, end } = data.range;
        const dataset = {
            start: start + marker.length,
            end: end - marker.length,
        }

        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE, CLASS_NAMES.ME_EMOJI]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}" spellcheck="false">`
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

        if (validation && validation.emoji !== this.nodes.el.lastChild.textContent) {
            this.nodes.el.lastChild.textContent = validation.emoji
        }

        if (raw !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = raw;
        }
    }
}