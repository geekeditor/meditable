import { MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../../renderer";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MELanguageRenderer extends MEBlockRenderer {
    static type: MEBlockType = "language";
    static tagName: string = 'span';

    static async staticRender():Promise<string> {
        return ``
    }

    get anchor() {
        return this.block.parent
    }

    updateContent() {
        if (!this.nodes.el) {
            this.nodes.el = this.make(this.tagName, [CLASS_NAMES.ME_EDITABLE, CLASS_NAMES.ME_LANGUAGE], { contenteditable: 'true', hint: this.t("Input code language") });
            this.nodes.holder = this.nodes.el;
        }

        this.nodes.holder.textContent = this.text;


        return true;
    }

    forceUpdate() {
        const cursor = this.getCursor();
        if (!cursor) {
            return null;
        }

        const { start, end } = cursor
        const textContent = this.nodes.holder.textContent
        const lang = textContent.split(/\s+/)[0]
        const startOffset = Math.min(lang.length, start.offset)
        const endOffset = Math.min(lang.length, end.offset)
        this.render({text: lang})
        this.setCursor({anchor: {offset: startOffset}, focus: {offset: endOffset}})
        this.block.parent.renderer.forceUpdate();
    }

    enterHandler(event: KeyboardEvent) {
        event.preventDefault()

        this.block.parent.lastContentInDescendant().renderer.setCursor()
        
    }

    backspaceHandler(event: KeyboardEvent) {
        const cursor = this.getCursor();
        if (!cursor) {
            return null;
        }

        const { start } = cursor

        if (start.offset === 0) {
            event.preventDefault()
            const cursorBlock = this.block.parent.previousContentInContext()
            if(cursorBlock) {
                const offset = cursorBlock.renderer.text.length
                cursorBlock.renderer.setCursor({focus: {offset}})
            }
        }
    }
}