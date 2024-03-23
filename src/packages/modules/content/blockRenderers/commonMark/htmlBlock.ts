import { MEBlockRendererStaticRenderOptions, MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../renderer";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class MEHtmlBlockRenderer extends MEBlockRenderer {
    static type: MEBlockType = "html-block";
    static tagName: string = 'figure';
    static async staticRender({data}:MEBlockRendererStaticRenderOptions):Promise<string> {
        const innerHTML = data.text
        const lang = data.children[0]?.meta?.lang
        return `<${this.tagName} class="${this.type} ${lang}">${innerHTML||''}</${this.tagName}>`
    }

    get preview() {
        return this.nodes.el.firstElementChild;
    }

    clickPreviewHandler(event) {
        event.preventDefault()
        event.stopPropagation()

        const cursorBlock = this.block.firstContentInDescendant()
        cursorBlock.renderer.setCursor()
    }

    mouseDownPreviewHandler(event) {
        event.preventDefault()
    }


    updatePreview(html: string) {
        if (!this.nodes.el) {
            this.nodes.el = this.make(this.tagName);
            this.nodes.el.appendChild(this.make('div', [CLASS_NAMES.ME_PREVIEW], {
                spellcheck: 'false',
                contenteditable: 'false'
            }))
            this.nodes.holder = this.make('pre', [CLASS_NAMES.ME_CONTAINER]);
            this.nodes.el.appendChild(this.nodes.holder);
            this.mutableListeners.on(this.preview, 'mousedown', this.mouseDownPreviewHandler.bind(this))
            this.mutableListeners.on(this.preview, 'click', this.clickPreviewHandler.bind(this))
        }
        this.preview.innerHTML = html;
    }

    updateContent() {
        this.updatePreview(this.text);
        return true;
    }

    forceUpdate() {
        const codeRendererer = this.block.lastContentInDescendant().renderer;
        const text = codeRendererer.text;
        this.render({ text })
    }
}