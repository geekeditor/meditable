import { MENodeData, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEEmojiValid extends MENode {
    static type: MENodeType = "emoji_valid";
    renderSelf(data: MENodeData) {

        const { raw } = data;

        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_EMOJI_VALID}" spellcheck="false">`
            this.nodes.el.dataset.nodeType = this.type;
        }

        if (raw !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = raw || ''
        }
    }
}