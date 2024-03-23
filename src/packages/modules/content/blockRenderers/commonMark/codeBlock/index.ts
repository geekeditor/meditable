import { MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../../renderer";

export default class MECodeBlockRenderer extends MEBlockRenderer {
    static type: MEBlockType = "code-block";
    static tagName: string = 'pre';

    updateContent() {
        super.updateContent()
        this.nodes.el.dataset.codeType = this.meta.type;
        return true;
    }

    forceUpdate() {
        const languageRenderer = this.block.firstContentInDescendant().renderer;
        const codeRendererer = this.block.lastContentInDescendant().renderer;
        codeRendererer.render({meta: {lang: languageRenderer.text}, text: codeRendererer.text});
        if(languageRenderer.text.length) {
            this.meta.type = 'fenced';
            this.updateContent();
        }
        
    }
}