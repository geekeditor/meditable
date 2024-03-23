import { MEBlockData, MEBlockType } from "@/packages/types";
import MEBlockRenderer from "./renderer";
import { generateId } from "@/packages/utils/utils";

export default class MEDocumentRenderer extends MEBlockRenderer {
    static type: MEBlockType = "document";
    render(): boolean {
        if (!this.nodes.el) {
            const { layout } = this.instance.context;
            this.nodes.el = layout.nodes.content;
            this.nodes.holder = this.nodes.el;
        }
        return true;
    }

    clickHandler(event) {
        const lastChild = this.block.lastChild
        const lastContentBlock = lastChild.lastContentInDescendant()
        const { clientY } = event
        const lastChildDom = lastChild.nodes.el
        const { bottom } = lastChildDom.getBoundingClientRect()
        if (clientY > bottom) {
            if (lastChild.type === 'paragraph' && lastContentBlock.renderer.text === '') {
                lastContentBlock.renderer.setCursor()
            } else {
                const data: MEBlockData = {
                    id: generateId(),
                    type: 'paragraph',
                    text: ''
                }

                this.block.append({
                    data,
                    needToFocus: true,
                    focus: { offset: 0 }
                })
            }
        }
    }
}