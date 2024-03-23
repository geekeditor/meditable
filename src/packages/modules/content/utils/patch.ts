import { MEBlockConstructable, MEBlockData, MEBlockInstance, MECursorState, MENodeData, MENodeInstance } from "@/packages/types"
import {createRenderer} from "../blockRenderers";
import {createNode} from "../inlineRenderers";


function lis(seq: number[]) {

    const valueMax: { [value: number]: number } = {};
    let len = seq.length;
    for (let i = 0; i < len; i++) {
        valueMax[seq[i]] = 1;
    }

    let i = len - 1;
    let nextValue = seq[i];
    let currValue = seq[i - 1];
    while (typeof currValue !== 'undefined') {
        let j = i;
        while (j < len) {
            nextValue = seq[j];
            if (currValue < nextValue) {
                const curMax = valueMax[nextValue] + 1;
                valueMax[currValue] = Math.max(valueMax[currValue], curMax);
            }
            j++;
        }
        i--;
        nextValue = seq[i];
        currValue = seq[i - 1];
    }

    const lisArr: number[] = [];
    i = 1;
    while (--len >= 0) {
        const n = seq[len];
        const p = seq[len - 1];
        if (valueMax[n] !== valueMax[p] && valueMax[n] === i) {
            i++
            lisArr.unshift(len)
        }
    }

    return lisArr;

}

export function blockPatch(data: MEBlockData, cursor: MECursorState | null = null, BlockClass: MEBlockConstructable) {

    // const BlockClass = this.constructor as MEBlockConstructable;
    // Render self dom
    let newBlockRender = false;
    if (!this.renderer || this.renderer.constructor.type !== data.type) {
        this.renderer = createRenderer(this, data.type);
        newBlockRender = true;
    }

    this.renderer.render({ ...data, cursor });
    this.nodes.el = this.renderer.nodes.el;
    this.nodes.holder = this.renderer.nodes.holder;

    if (newBlockRender) {
        const children: MEBlockInstance[] = this.children || [];
        const parentEl = this.nodes.holder as HTMLElement;
        children.forEach((block) => {
            if (block.nodes.el) {
                block.nodes.el.remove();
                parentEl.appendChild(block.nodes.el);
            }
        })
    }


    // Render children
    const newChildren: (MEBlockData | MEBlockInstance)[] = [...data.children || []];
    const oldChildren: MEBlockInstance[] = this.children || [];

    let oldStart = 0, newStart = 0;
    let oldBlock = oldChildren[oldStart]
    let newBlock = newChildren[newStart]
    while (oldBlock && newBlock && oldBlock.id === newBlock.id) {
        // Renew block
        oldBlock.render({ data: newBlock as MEBlockData, parent: this });
        newChildren[newStart] = oldBlock;

        oldStart++;
        newStart++;
        // next iteration
        oldBlock = oldChildren[oldStart]
        newBlock = newChildren[newStart]
    }

    let oldEnd = oldChildren.length - 1
    let newEnd = newChildren.length - 1
    oldBlock = oldChildren[oldEnd]
    newBlock = newChildren[newEnd]
    while (oldBlock && newBlock && oldBlock.id === newBlock.id && oldEnd >= oldStart && newEnd >= newStart) {

        oldBlock.render({ data: newBlock as MEBlockData, parent: this });
        newChildren[newEnd] = oldBlock;

        oldEnd--;
        newEnd--;

        oldBlock = oldChildren[oldEnd];
        newBlock = newChildren[newEnd];
    }

    const anchorIdx = newEnd + 1;
    const anchor = anchorIdx < newChildren.length ? (newChildren[anchorIdx] as MEBlockInstance).nodes.el : null;
    if (oldStart > oldEnd && newStart <= newEnd) {

        while (newStart <= newEnd) {

            // insert
            let newBlockData = newChildren[newStart] as MEBlockData;
            const newBlock = new BlockClass(this.instance);
            newBlock.render({ data: newBlockData, parent: this });
            const parentEl = this.nodes.holder as HTMLElement;
            parentEl.insertBefore(newBlock.nodes.el, anchor);
            newChildren[newStart] = newBlock;

            newStart++;

        }
    } else if (newStart > newEnd && oldStart <= oldEnd) {
        while (oldStart <= oldEnd) {

            // unmount
            const oldBlock = oldChildren[oldStart];
            const parentEl = this.nodes.holder as HTMLElement;
            parentEl.removeChild(oldBlock.nodes.el);
            oldBlock.parent = null;
            oldStart++;
        }
    } else {
        const count = newEnd - newStart + 1;
        const source = new Array<number>(count);
        source.fill(-1)

        let moved = false;
        let pos = 0;
        const idToIndex: { [id: string]: number } = {};

        for (let j = newStart; j <= newEnd; j++) {
            const newBlockData = newChildren[j];
            idToIndex[newBlockData.id] = j;
        }

        for (let j = oldStart; j <= oldEnd; j++) {
            const oldBlock = oldChildren[j];
            const index = idToIndex[oldBlock.id];
            if (typeof index !== 'undefined') {
                const newBlockData = newChildren[index];
                oldBlock.render({ data: newBlockData as MEBlockData, parent: this });
                newChildren[index] = oldBlock;

                source[index - newStart] = j;

                if (index < pos) {
                    moved = true;
                } else {
                    pos = index;
                }
            } else {
                const parentEl = this.nodes.holder as HTMLElement;
                parentEl.removeChild(oldBlock.nodes.el);
                oldBlock.parent = null;
            }
        }

        // if(moved) {

        // }

        const seq = lis(source);

        let s = 0;
        for (let j = count - 1; j >= 0; j--) {

            const index = j + newStart;
            if (source[j] === -1) {
                let newBlockData = newChildren[index] as MEBlockData;
                const newBlock = new BlockClass(this.instance);
                newBlock.render({ data: newBlockData, parent: this });
                const parentEl = this.nodes.holder as HTMLElement;
                parentEl.insertBefore(newBlock.nodes.el, anchor);
                newChildren[index] = newBlock;

            } else if (j !== seq[s]) {

                let newBlock = newChildren[index] as MEBlockInstance;
                const parentEl = this.nodes.holder as HTMLElement;
                parentEl.removeChild(newBlock.nodes.el);
                parentEl.insertBefore(newBlock.nodes.el, anchor);

            } else {
                s++;
            }
        }

    }

    this.children = newChildren;
}


export function inlinePatch(datas: MENodeData[]) {

    // Render nodes
    const newChildren: (MENodeData | MENodeInstance)[] = [...datas];
    const oldChildren: MENodeInstance[] = this.children || [];

    // Remove wild nodes
    const parentEl = this.nodes.holder as HTMLElement;
    const wildNodes = Array.from(parentEl.childNodes).filter((node) => !oldChildren.some((c) => c.nodes.el === node))
    wildNodes.forEach((n) => {
        parentEl.removeChild(n);
    })

    let oldStart = 0, newStart = 0;
    let oldNode = oldChildren[oldStart]
    let newNode = newChildren[newStart]
    while (oldNode && newNode && oldNode.type === newNode.type) {
        // Renew block
        oldNode.render(newNode as MENodeData);
        newChildren[newStart] = oldNode;

        oldStart++;
        newStart++;
        // next iteration
        oldNode = oldChildren[oldStart]
        newNode = newChildren[newStart]
    }

    let oldEnd = oldChildren.length - 1
    let newEnd = newChildren.length - 1
    oldNode = oldChildren[oldEnd]
    newNode = newChildren[newEnd]
    while (oldNode && newNode && oldNode.type === newNode.type && oldEnd >= oldStart && newEnd >= newStart) {

        oldNode.render(newNode as MENodeData);
        newChildren[newEnd] = oldNode;

        oldEnd--;
        newEnd--;

        oldNode = oldChildren[oldEnd];
        newNode = newChildren[newEnd];
    }

    const anchorIdx = newEnd + 1;
    const anchor = anchorIdx < newChildren.length ? (newChildren[anchorIdx] as MENodeInstance).nodes.el : null;
    if (oldStart > oldEnd && newStart <= newEnd) {

        while (newStart <= newEnd) {

            // insert
            let newNodeData = newChildren[newStart] as MENodeData;
            const newNode = createNode(this.blockRenderer || this, newNodeData.type);
            newNode.render(newNodeData);
            const parentEl = this.nodes.holder as HTMLElement;
            parentEl.insertBefore(newNode.nodes.el, anchor);
            newChildren[newStart] = newNode;

            newStart++;

        }
    } else if (newStart > newEnd && oldStart <= oldEnd) {
        while (oldStart <= oldEnd) {

            // unmount
            const oldNode = oldChildren[oldStart];
            oldNode.nodes.el.remove()
            // const parentEl = this.nodes.holder as HTMLElement;
            // parentEl.removeChild(oldNode.nodes.el);
            oldNode.blockRenderer = null;
            oldStart++;
        }
    } else {

        // unmount
        for (let j = oldStart; j <= oldEnd; j++) {
            const oldNode = oldChildren[j];
            oldNode.nodes.el.remove();
            // const parentEl = this.nodes.holder as HTMLElement;
            // parentEl.removeChild(oldNode.nodes.el);
            oldNode.blockRenderer = null;
        }

        // mount
        for (let j = newStart; j <= newEnd; j++) {
            const newNodeData = newChildren[j] as MENodeData;
            const newNode = createNode(this.blockRenderer || this, newNodeData.type);
            newNode.render(newNodeData);
            const parentEl = this.nodes.holder as HTMLElement;
            parentEl.insertBefore(newNode.nodes.el, anchor);
            newChildren[j] = newNode;
        }

    }

    this.children = newChildren;
}

function cacheTypes(cache, datas) {
    for (const { type, children } of datas) {
        if (cache[type]) {
            cache[type]++
        } else {
            cache[type] = 1
        }

        if (children) {
            cacheTypes(cache, children);
        }
    }
}


export function checkNotSameDatas(datas1: MENodeData[], datas2: MENodeData[]) {

    const oldCache = {}
    const cache = {}

    cacheTypes(oldCache, datas1);
    cacheTypes(cache, datas2);

    if (Object.keys(oldCache).length !== Object.keys(cache).length) {
        return true
    }

    for (const key of Object.keys(oldCache)) {
        if (!cache[key] || oldCache[key] !== cache[key]) {
            return true
        }
    }

    return false
}
