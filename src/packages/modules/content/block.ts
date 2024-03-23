import { MEBlockData, MEBlockInstance, MEBlockRenderOptions, MEBlockType, MECursorState, MEInstance } from "@/packages/types";
import MEModule from "../module";
import MEBlockRenderer from "./blockRenderers/renderer";
import { blockPatch } from "./utils/patch";
import { generateId } from "@/packages/utils/utils";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { findBlockByElement } from "./utils/find";

export default class MEBlock extends MEModule<{ el: HTMLElement; holder: HTMLElement }> {

    parent: MEBlockInstance | null = null;

    id!: string;
    type!: MEBlockType;
    children: MEBlockInstance[] = [];
    renderer!: MEBlockRenderer;

    constructor(instance: MEInstance) {
        super(instance);
        this.dragOver = this.dragOver.bind(this);
        this.dragLeave = this.dragLeave.bind(this);
    }

    get root() {
        let root: MEBlockInstance = this;
        while (root.parent) root = root.parent;
        return root;
    }

    get path() {
        const path = this.parent?.path || []
        return [...path, this.index];
    }

    get index() {
        if (this.parent) {
            return this.parent.children.findIndex((b) => b.id === this.id)
        }

        return -1;
    }

    get previous() {
        if (this.parent) {
            return this.parent.children[this.index - 1] || null;
        }

        return null;
    }

    get next() {
        if (this.parent) {
            return this.parent.children[this.index + 1] || null;
        }

        return null;
    }

    get isFirstChild() {
        return this.index === 0;
    }

    get isLastChild() {
        if (this.parent) {
            return this.index === this.parent.children.length - 1
        }

        return false;
    }

    get isOnlyChild() {
        return this.parent?.children.length === 1;
    }

    get firstChild() {
        return this.children[0];
    }

    get lastChild() {
        return this.children[this.children.length - 1];
    }

    get isOutMostBlock() {
        return this.parent === this.instance.context.content;
    }

    get isRoot() {
        return !this.parent || (this as MEBlockInstance) === this.instance.context.content;
    }

    get outMostBlock() {
        let block: MEBlockInstance | null = this;

        while (block) {
            if (block.isOutMostBlock) {
                return block;
            }
            block = block.parent;
        }

        return null;
    }

    get data(): MEBlockData {
        return {
            id: this.id,
            meta: this.renderer.meta,
            text: this.renderer.text,
            type: this.type,
            children: this.children.map((block) => block.data)
        };
    }

    public get hasMedia() {
        const mediaTags = [
            'img',
            'iframe',
            'video',
            'audio',
            'source',
            'input',
            'textarea',
            'twitterwidget',
        ];

        return !!this.nodes.el.querySelector(mediaTags.join(','));
    }

    public set actived(state: boolean) {
        this.nodes.el.classList.toggle(CLASS_NAMES.ME_BLOCK__ACTIVED, state);
    }

    public get actived(): boolean {
        return this.nodes.el.classList.contains(CLASS_NAMES.ME_BLOCK__ACTIVED);
    }

    public set focused(state: boolean) {
        this.nodes.el.classList.toggle(CLASS_NAMES.ME_BLOCK__FOCUSED, state);
    }

    public get focused(): boolean {
        return this.nodes.el.classList.contains(CLASS_NAMES.ME_BLOCK__FOCUSED);
    }

    public set selected(state: boolean) {
        this.nodes.el.classList.toggle(CLASS_NAMES.ME_BLOCK__SELECTED, state);
    }

    public get selected(): boolean {
        return this.nodes.el.classList.contains(CLASS_NAMES.ME_BLOCK__SELECTED);
    }

    public set dropTarget(state: boolean) {
        this.nodes.el.classList.toggle(CLASS_NAMES.ME_BLOCK__DROP_TARGET, state);
    }

    public get dropTarget() {
        return this.nodes.el.classList.contains(CLASS_NAMES.ME_BLOCK__DROP_TARGET);
    }

    public render({ data, parent, cursor }: MEBlockRenderOptions) {
        this.type = data.type;
        this.id = data.id;
        this.parent = parent || null;
        blockPatch.call(this, data, cursor, MEBlock);
        this.nodes.el.classList.toggle(CLASS_NAMES.ME_BLOCK, true);
        this.nodes.el.dataset.id = data.id;
        this.nodes.el['BLOCK_INSTANCE'] = this;
        this.nodes.el.dataset.blockType = this.type;
        this.nodes.holder['BLOCK_RENDERER_INSTANCE'] = this.renderer;
        if (cursor?.focusBlock === this) {
            this.focused = true;
        }
        if(!this.isRoot) {
            this.mutableListeners.on(this.nodes.el, 'dragover', this.dragOver);
            this.mutableListeners.on(this.nodes.el, 'dragleave', this.dragLeave);
        }
        return this.nodes.el;
    }

    public queryBlock(path: number[]|string) {

        if(typeof path === 'string') {
            if(path === this.id) {
                return this;
            }

            let find;
            for(let i = 0; i < this.children.length; i++) {
                const child = this.children[i]
                find = child.queryBlock(path)
                if(find) {
                    break;
                }
            }
            return find;
        }

        const index = path.shift()
        if (typeof index === 'undefined') {
            return this
        }

        const block = this.children[index];
        return block && path.length ? block.queryBlock(path) : block
    }

    public findBlock(el: HTMLElement | Node) {
        return findBlockByElement(el)
    }

    public insert(options: {
        data?: MEBlockData;
        index?: number;
        needToFocus?: boolean;
        focus?: { offset: number };
        replace?: boolean;
    } = {}): MEBlock | null {

        if (!this.nodes.holder) {
            return null;
        }

        let { data, index, needToFocus, focus, replace } = options;
        needToFocus = typeof needToFocus === 'undefined' ? false : needToFocus;
        focus = focus || { offset: 0 }


        let newIndex = typeof index === 'undefined' ? this.children.length : index;

        data = data || { type: "paragraph", id: generateId() }

        const newBlock = new MEBlock(this.instance);
        let cursor: MECursorState | null = null;
        if (needToFocus) {
            //TODO: focus
            cursor = {
                anchor: focus,
                focus,
                anchorBlock: newBlock as MEBlockInstance,
                focusBlock: newBlock as MEBlockInstance
            }
        }


        newBlock.render({ data, parent: this, cursor });
        const parentEl = this.nodes.holder as HTMLElement;

        if (!this.children.length || newIndex >= this.children.length) {
            this.children.push(newBlock);
            parentEl.insertBefore(newBlock.nodes.el, null);
        } else {

            if (replace) {
                const replaceBlock = this.children[newIndex];
                replaceBlock.nodes.el.remove();
                replaceBlock.parent = null;
                this.children.splice(newIndex, 1, newBlock);
            } else {
                this.children.splice(newIndex, 0, newBlock);
            }

            if (newIndex > 0) {
                const previousBlock = this.children[newIndex - 1];
                previousBlock.nodes.el.insertAdjacentElement("afterend", newBlock.nodes.el);
            } else {
                const nextBlock = this.children[newIndex + 1];
                if (nextBlock) {
                    nextBlock.nodes.el.insertAdjacentElement("beforebegin", newBlock.nodes.el);
                } else {
                    parentEl.insertBefore(newBlock.nodes.el, null);
                }
            }
        }


        if (cursor) {
            //TODO: focus
            const { selection } = this.instance.context.editable;
            selection.setCursor(cursor);
        }

        return newBlock;
    }

    public append(options: {
        data?: MEBlockData;
        needToFocus?: boolean;
        focus?: { offset: number };
    } = {}) {
        return this.insert({ ...options, index: this.children.length })
    }

    public insertAdjacent(position: "beforebegin" | "afterbegin" | "beforeend" | "afterend" = "afterend", options: {
        data?: MEBlockData;
        needToFocus?: boolean;
    } = {}) {
        if (position === "beforebegin" || position === "afterend") {
            if (this.parent) {
                const index = this.index;
                const insertIndex = position === 'afterend' ? index + 1 : index;
                return this.parent.insert({ ...options, index: insertIndex })
            }
        } else {
            return this.insert({ ...options, index: position === "afterbegin" ? 0 : this.children.length })
        }
        return null;
    }

    public replaceWith({ data, needToFocus, focus }: {
        data?: MEBlockData;
        needToFocus?: boolean;
        focus?: { offset: number };
    }) {
        if (this.parent) {
            return this.parent.insert({ data, replace: true, index: this.index, needToFocus, focus })
        }

        return null;
    }

    public firstContentInDescendant() {
        let firstContentBlock: MEBlockInstance = this;
        while (firstContentBlock.children && firstContentBlock.children.length) {
            firstContentBlock = firstContentBlock.children[0]
        }
        return firstContentBlock;
    }

    public lastContentInDescendant() {
        let lastContentBlock: MEBlockInstance = this;
        while (lastContentBlock.children && lastContentBlock.children.length) {
            lastContentBlock = lastContentBlock.children[lastContentBlock.children.length - 1]
        }
        return lastContentBlock;
    }

    public previousContentInContext() {
        if (this.isRoot) {
            return null;
        }

        const { parent } = this;
        if (this.previous) {
            return this.previous.lastContentInDescendant()
        } else {
            return parent.previousContentInContext();
        }
    }

    public previousInContext() {
        if (this.isRoot) {
            return null;
        }

        const { parent } = this;
        return this.previous || parent.previousInContext();
    }

    // Get next content block in block tree.
    public nextContentInContext() {
        if (this.isRoot) {
            return null;
        }

        const { parent } = this;

        if (this.next) {
            return this.next.firstContentInDescendant();
        } else {
            return parent.nextContentInContext();
        }
    }

    public nextInContext() {
        if (this.isRoot) {
            return null;
        }

        const { parent } = this;
        return this.next || parent.nextInContext();
    }

    public paste() {

    }

    public insertAtEnd() {
        return this.insert();
    }

    public mergeWith(block: MEBlockInstance) {
        //TODO: mergin block
    }

    public remove() {
        if (this.parent) {
            const index = this.index;
            this.nodes.el.remove();
            this.parent.children.splice(index, 1);
            this.parent = null;
        }
    }

    public getAncestors() {
        const ancestors: MEBlockInstance[] = [];
        let block = this.parent;

        while (block && !block.isRoot) {
            ancestors.push(block);
            block = block.parent;
        }

        return ancestors;
    }

    public getCommonAncestors(block: MEBlockInstance) {
        const myAncestors = this.getAncestors();
        const blockAncestors = block.getAncestors();
        const commonAncestors: MEBlockInstance[] = [];
        for (const a of myAncestors) {
            if (blockAncestors.includes(a)) {
                commonAncestors.push(a);
            }
        }

        return commonAncestors;
    }

    public closestBlock(blockType: MEBlockType) {
        if (this.type === blockType) {
            return this;
        }

        let parent = this.parent;

        while (parent) {
            if (parent.type === blockType) {
                return parent;
            }

            parent = parent.parent;
        }

        return null;
    }

    public farthestBlock(blockType: MEBlockType) {
        const results = [];
        if (this.type === blockType) {
            results.push(this);
        }

        let parent = this.parent;

        while (parent) {
            if (parent.type === blockType) {
                results.push(parent);
            }

            parent = parent.parent;
        }

        return results.pop();
    }

    public contains(child: MEBlockInstance) {
        const children = this.children;
        return children.some((c)=>(c.id === child.id)||c.contains(child))
    }

    private dragOver(event: Event): void {
        this.dropTarget = true
        event.stopPropagation();
    }

    private dragLeave(event: Event): void {
        this.dropTarget = false
    }

}