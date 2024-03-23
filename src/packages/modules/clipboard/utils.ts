import { MEBlockData, MEBlockInstance } from "@/packages/types";
import { deepCopy, generateId } from "@/packages/utils/utils";

function removeBlockOrContent(block: MEBlockInstance) {
    if (/(table-td|table-th)$/.test(block.type)) {
        block.renderer.render({ text: "" })
    } else if (/table-tr|table-thead|table-tbody/.test(block.type)) {
        block.children.forEach((child) => {
            removeBlockOrContent(child)
        })
    } else {
        block.remove()
    }
}

export function cutBlocks(startBlock: MEBlockInstance, startOffset: number, endBlock: MEBlockInstance, endOffset: number) {
    let nextBlock = startBlock.nextInContext()
    while (nextBlock) {
        if (nextBlock.id === endBlock.id || nextBlock.contains(endBlock)) {
            break;
        }

        const toRemoveBlock = nextBlock;
        nextBlock = nextBlock.nextInContext();
        removeBlockOrContent(toRemoveBlock);
    }

    if (nextBlock) {
        while (nextBlock.id !== endBlock.id) {
            let child = nextBlock.firstChild
            while (child) {
                if (child.id === endBlock.id || child.contains(endBlock)) {
                    nextBlock = child
                    break;
                }

                const toRemoveBlock = child;
                child = child.next;
                removeBlockOrContent(toRemoveBlock);
            }
        }
    }

    const { text: startText } = startBlock.renderer;
    const { text: endText } = endBlock.renderer;
    const text = startText.substring(0, startOffset) + (!/language|table-td|table-th/.test(endBlock.type) ? endText.substring(endOffset) : "");
    const focus = { offset: startOffset }

    if (/language|table-td|table-th/.test(endBlock.type)) {
        const text = endText.substring(endOffset)
        endBlock.renderer.render({ text })
    } else {
        let toRemoveBlock = endBlock;
        while (toRemoveBlock.isOnlyChild && toRemoveBlock.parent && !toRemoveBlock.parent.isRoot) {
            toRemoveBlock = toRemoveBlock.parent
        }
        removeBlockOrContent(toRemoveBlock);
    }

    if (/language/.test(startBlock.type)) {
        const data: MEBlockData = {
            id: generateId(),
            type: "paragraph",
            text
        }
        startBlock.renderer.anchor.replaceWith({ data, needToFocus: true, focus })
    } else {
        startBlock.renderer.render({ text, cursor: { anchor: focus, focus, focusBlock: startBlock, anchorBlock: startBlock } })
        startBlock.renderer.setCursor({ focus })
    }

}



export function copyBlocks(startBlock: MEBlockInstance, startOffset: number, endBlock: MEBlockInstance, endOffset: number) {

    const { text: startText } = startBlock.renderer;
    const { text: endText } = endBlock.renderer;
    const text = startText.substring(startOffset);

    let datas: MEBlockData[] = [{
        ...deepCopy(startBlock.data),
        text
    }]

    if (/code$/.test(startBlock.type)) {
        const previousBlock = startBlock.previous
        if (previousBlock && previousBlock.type === "language") {
            datas.unshift(deepCopy(previousBlock.data))
        }
    }

    let nextBlock = startBlock
    if (!nextBlock.next) {

        let parent = nextBlock.parent
        const meta = parent.renderer.meta
        datas = [{
            id: parent.id,
            type: parent.type,
            meta: meta ? deepCopy(meta) : meta,
            children: datas
        }]

        while (!parent.next) {
            parent = parent.parent
            const meta = parent.renderer.meta
            datas = [{
                id: parent.id,
                type: parent.type,
                meta: meta ? deepCopy(meta) : meta,
                children: datas
            }]
        }

        nextBlock = parent.next

    } else {
        nextBlock = nextBlock.next;
    }
    while (nextBlock && nextBlock.id !== endBlock.id && !nextBlock.contains(endBlock)) {
        datas.push(deepCopy(nextBlock.data))
        if (!nextBlock.next) {

            let parent = nextBlock.parent
            const meta = parent.renderer.meta
            datas = [{
                id: parent.id,
                type: parent.type,
                meta: meta ? deepCopy(meta) : meta,
                children: datas
            }]

            while (!parent.next) {
                parent = parent.parent
                const meta = parent.renderer.meta
                datas = [{
                    id: parent.id,
                    type: parent.type,
                    meta: meta ? deepCopy(meta) : meta,
                    children: datas
                }]
            }

            nextBlock = parent.next

        } else {
            nextBlock = nextBlock.next;
        }

    }


    let head = datas;
    if (nextBlock) {

        const ancestors = nextBlock.getCommonAncestors(startBlock)
        if (ancestors.length) {
            const targetAncestor = ancestors.find((a) => /table|bullet-list|order-list|code-block|task-list/.test(a.type));
            if (targetAncestor && targetAncestor.contains(nextBlock)) {
                let parent = nextBlock.parent
                while (!parent.isRoot && parent.id !== targetAncestor.id) {
                    const meta = parent.renderer.meta
                    head = [{
                        id: parent.id,
                        type: parent.type,
                        meta: meta ? deepCopy(meta) : meta,
                        children: head
                    }]
                    parent = parent.parent
                }
                const meta = parent.renderer.meta
                head = [{
                    id: parent.id,
                    type: parent.type,
                    meta: meta ? deepCopy(meta) : meta,
                    children: head
                }]
            }
        }

        while (nextBlock.id !== endBlock.id) {

            const meta = nextBlock.renderer.meta
            const nextData = {
                id: nextBlock.id,
                type: nextBlock.type,
                meta: meta ? deepCopy(meta) : meta,
                children: []
            }
            datas.push(nextData)
            datas = nextData.children

            let child = nextBlock.firstChild
            while (child) {
                if (child.id === endBlock.id || child.contains(endBlock)) {
                    nextBlock = child
                    break;
                }

                const toAddBlock = child;
                child = child.next;
                datas.push(deepCopy(toAddBlock.data))
            }
        }

        const newEndText = endText.substring(0, endOffset)
        datas.push({
            ...deepCopy(endBlock.data),
            text: newEndText
        })

        if (/language/.test(endBlock.type)) {
            nextBlock = endBlock.next
            if (nextBlock && nextBlock.type === "code") {
                datas.push({
                    id: nextBlock.id,
                    type: "code",
                    meta: {
                        lang: newEndText,
                    },
                    text: ""
                })
            }
        } else if ((/table-td|table-th/.test(endBlock.type))) {
            while ((nextBlock = endBlock.next)) {
                datas.push({
                    ...deepCopy(nextBlock.data),
                    text: ""
                })
            }
        }


    }



    return head;
}