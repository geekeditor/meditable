import { MEBlockInstance } from "@/packages/types";
import domUtils from "@/packages/utils/domUtils";

export function getCursorYOffset(el: HTMLElement, rangeRect: DOMRect) {

    const { y } = rangeRect;
    const { height, top } = el.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const topOffset = Math.floor((y - top) / lineHeight);
    const bottomOffset = Math.round(
        (top + height - lineHeight - y) / lineHeight
    );

    return {
        topOffset,
        bottomOffset,
    };

}

export function adjustOffset(offset: number, block: MEBlockInstance, event: KeyboardEvent) {
    if (
        block.type.includes("atx-heading") &&
        event.key === domUtils.keys.ArrowDown
    ) {
        const match = /^\s{0,3}(?:#{1,6})(?:\s{1,}|$)/.exec(block.renderer.text);
        if (match) {
            return match[0].length;
        }
    } else if (block.type === 'thematic-break' && event.key === domUtils.keys.ArrowDown) {
        return block.renderer.text.length;
    }

    return offset;
};