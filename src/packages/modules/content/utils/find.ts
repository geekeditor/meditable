import { MEBlockInstance } from "@/packages/types";
import { getOffsetOfParent, getTextContent } from "@/packages/modules/content/utils/dom";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import domUtils from "@/packages/utils/domUtils";

export function findBlock(block: MEBlockInstance, el: HTMLElement): MEBlockInstance|undefined {
    if(block.nodes.el === el) {
        return block;
    }
    return block.children.find((child)=>findBlock(child, el));
}

export function findBlockByElement(el: HTMLElement|Node): MEBlockInstance|null {
    if (!domUtils.isElement(el)) {
        el = el.parentNode as HTMLElement;
    }

    if (!el) {
        return null;
    }

    const blockEl = (el as HTMLElement).closest(`.${CLASS_NAMES.ME_BLOCK}`)
    const find = blockEl && blockEl['BLOCK_INSTANCE'];
    return find;
}

export function findDropBlock(block: MEBlockInstance): MEBlockInstance|undefined {

    const target = block.nodes.el.querySelector(`.${CLASS_NAMES.ME_BLOCK__DROP_TARGET}`);
    if(target) {
        return target['BLOCK_INSTANCE']
    }

    return;
}

export function clearDropBlock(block: MEBlockInstance): MEBlockInstance|undefined {
    block.dropTarget = false;
    if(!block.children) {
        return;
    }
    block.children.forEach((child)=>clearDropBlock(child));
}


export const findInlineNode = (node) => {
    if (node.nodeType === 3) {
        node = node.parentNode;
    }

    if (!node) return null;

    let target:Element|null = null;
    while((node = node.closest(`.${CLASS_NAMES.ME_NODE}`))) {
        target = node;
        node = node.parentNode;
    }

    return target;
};

export const findActivedNodes = (node, offset) => {
    const activedNodes: Element[] = [];
    const target = findInlineNode(node);
    if (target) {
        const tOffset = getOffsetOfParent(node, target) + offset;
        const text = getTextContent(target, [CLASS_NAMES.ME_INLINE_RENDER])
        // console.log(node, focusNode, offset, text, text.length);
        activedNodes.push(target)
        if (tOffset === 0 && target.previousElementSibling) {
            activedNodes.push(target.previousElementSibling);
        }
        if (tOffset === text.length && target.nextElementSibling) {
            activedNodes.push(target.nextElementSibling);
        }
    }
    return activedNodes;
}