import { MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../renderer";

export default class MEFrontmatterRenderer extends MEBlockRenderer {
    static type: MEBlockType = "frontmatter";
    static tagName: string = 'pre';

    forceUpdate() {
        const codeRendererer = this.block.lastContentInDescendant().renderer;
        const text = codeRendererer.text;
        this.render({text})
    }
}