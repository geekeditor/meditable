import { MEBlockType } from "@/packages/types";
import MEParagraphRenderer from "./paragraph";

export default class METhematicBreakRenderer extends MEParagraphRenderer {
    static type: MEBlockType = "thematic-break";
    static async staticRender():Promise<string> {
        return `<hr class="${this.type}"/>`
    }

    updateContent(checkUpdate) {
        const isFirstRender = !this.nodes.el;
        const isRendered = super.updateContent(checkUpdate);
        if(isFirstRender) {
            this.nodes.el.appendChild(this.make('hr'))
        }

        return isRendered;
    }

    mouseDownHandler(event: Event) {
        if(event.target === this.nodes.el || (event.target as Element).tagName === 'HR') {
            event.preventDefault();
            this.setCursor({focus: {offset: this.text.length}})
        } else {
            super.clickHandler(event);
        }
    }
}