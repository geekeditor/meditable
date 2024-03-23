import { MEBlockRendererRenderOptions, MEBlockType, MECursorState } from "@/packages/types";
import MEBlockRenderer from "../renderer";

export default class MEBulletListRenderer extends MEBlockRenderer {
    static type: MEBlockType = "bullet-list";
    static tagName: string = 'ul';

    render({text, meta, cursor}: MEBlockRendererRenderOptions): boolean {
    
        const rendered = super.render({text, meta, cursor});
        if(rendered && meta) {
            this.nodes.el.dataset.marker = meta.marker;
        }

        return rendered;
    }
}