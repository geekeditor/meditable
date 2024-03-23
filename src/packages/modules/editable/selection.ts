import dom from "@/packages/utils/domUtils";
import env from "@/packages/utils/env";
import MERange from "./range";
import MEModule from "../module";
import { MECursorState, MEInstance } from "@/packages/types";
import { getNodeAndOffset, getOffsetOfParent, compareParagraphsOrder } from "../content/utils/dom";

export default class MESelection extends MEModule {
    private _document!: HTMLDocument;
    private _root!: HTMLElement;
    private _rootDocNode!: Node;
    private _ranges!: MERange[];
    private _cachedRange!: MERange | null;
    private _cachedStartElement!: Node | null;
    private _cachedStartElementPath!: Node[] | null;
    private _cachedCursor!: MECursorState | null;
    private _bakRange!: MERange;

    constructor(document: HTMLDocument, root: HTMLElement, instance: MEInstance) {
        super(instance)
        this._document = document;
        this._root = root;
        this._rootDocNode = root.getRootNode();

        this._ranges = [];
        this._cachedRange = null;
        this._cachedCursor = null;
    }

    private get nativeSelection() {
        const doc = (this._rootDocNode || this._document) as Document;
        return doc.getSelection();
    }

    private getCacheRange() {

        if (this._cachedRange) {
            return this._cachedRange;
        }

        const range = this.getRange()

        return (this._bakRange = this._ranges[0] = range);
    }

    public getRange() {
        const optimize = (range: MERange) => {
            let child = this._root.firstChild,
                collapsed = range.collapsed;
            while (child && child.firstChild) {
                range.setStart(child, 0);
                child = child.firstChild;
            }
            if (!range.startContainer) {
                range.setStart(this._root, 0);
            }
            if (collapsed) {
                range.collapse(true);
            }
        };

        const range = new MERange(this._document, this._root, this);
        if (env.ie9below) {
            // Not support
        } else {
            const sel = this.nativeSelection;
            if (sel && sel.rangeCount) {
                const firstRange = sel.getRangeAt(0),
                    lastRange = sel.getRangeAt(sel.rangeCount - 1);
                range
                    .setStart(firstRange.startContainer as Node & ParentNode, firstRange.startOffset)
                    .setEnd(lastRange.endContainer as Node & ParentNode, lastRange.endOffset);
                if (
                    range.collapsed &&
                    range.startContainer &&
                    dom.isRoot(range.startContainer) &&
                    !range.startOffset
                ) {
                    optimize(range);
                }
            } else {
                if (
                    this._bakRange &&
                    this._bakRange.startContainer &&
                    dom.inDoc(this._bakRange.startContainer, this._root)
                ) {
                    return this._bakRange;
                }
                optimize(range);
            }
        }

        return range;
    }

    cache() {
        this.clearCache();
        this._cachedRange = this.getRange();
        this._cachedCursor = this.getCursor();
    }

    restore() {
        if (this._cachedRange) {
            this._cachedRange.select(true);
        }
    }

    clearCache() {
        this._cachedRange = this._cachedCursor = null;
    }

    get cachedRange() {
        return this._cachedRange;
    }

    get cachedCursor() {
        return this._cachedCursor;
    }

    getRangeAt(index: number) {
        return this.getCacheRange();
    }

    addRange(range: MERange) {
        let nativeRange = this._document.createRange();
        range.startContainer && nativeRange.setStart(range.startContainer, range.startOffset);
        range.endContainer && nativeRange.setEnd(range.endContainer, range.endOffset);
        this.nativeSelection?.addRange(nativeRange);
    }

    removeAllRanges() {
        this.clearCache();
        this.nativeSelection && this.nativeSelection.removeAllRanges();
        this._ranges = [];
    }

    public get isCollapsed(): boolean {
        const range = this.getRangeAt(0)
        return range.collapsed;
    }

    get rangeCount() {
        return this.nativeSelection?.rangeCount;
    }

    get exists() {
        const selection = this.nativeSelection;
        return !!selection && !!selection.anchorNode;
    }

    get anchorNode() {
        return this.nativeSelection?.anchorNode;
    }

    get focusNode() {
        return this.nativeSelection?.focusNode;
    }

    get anchorElement() {
        const anchorNode = this.anchorNode;

        if (!anchorNode) {
            return null;
        }

        if (anchorNode.nodeType !== 1) {
            return anchorNode.parentElement;
        } else {
            return anchorNode;
        }
    }

    get focusOffset() {
        return this.nativeSelection?.focusOffset;
    }

    get anchorOffset() {
        return this.nativeSelection?.anchorOffset;
    }

    get rangeRect() {
        let sel: Selection = this.nativeSelection as Selection,
            range: MERange;

        let rect = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        } as DOMRect;

        if (this.rangeCount === undefined) {
            return rect;
        }

        if (sel.rangeCount === 0) {
            return rect;
        }

        range = this.getRangeAt(0).cloneRange();

        if (range.getBoundingClientRect) {
            rect = range.getBoundingClientRect() as DOMRect;
        }
        // Fall back to inserting a temporary element
        if (rect.x === 0 && rect.y === 0) {
            const span = document.createElement('span');

            if (span.getBoundingClientRect) {
                // Ensure span has dimensions and position by
                // adding a zero-width space character
                span.appendChild(document.createTextNode('\u200b'));
                range.insertNode(span);
                rect = span.getBoundingClientRect() as DOMRect;

                const spanParent = span.parentNode;
                if (spanParent) {
                    spanParent.removeChild(span);

                    // Glue any broken text nodes back together
                    spanParent.normalize();
                }
            }
        }

        return rect;
    }

    get textContent() {
        return this.nativeSelection?.toString() || '';
    }

    get cursor() {
        // if (this._cachedCursor) {
        //     return this._cachedCursor;
        // }

        const cursor = this.getCursor();
        return cursor;
    }

    getCursor(): MECursorState {
        const { content, layout } = this.instance.context;
        const { anchorNode, anchorOffset, focusOffset, focusNode } = this;
        const anchorBlock = anchorNode && content.findBlock(anchorNode);
        const focusBlock = focusNode && content.findBlock(focusNode);
        const aOffset = anchorBlock ? getOffsetOfParent(anchorNode, anchorBlock.nodes.holder) + anchorOffset : anchorOffset;
        const fOffset = focusBlock ? getOffsetOfParent(focusNode, focusBlock.nodes.holder) + focusOffset : focusOffset;
        const anchor = { offset: aOffset };
        const focus = { offset: fOffset };
        const isCollapsed = anchorBlock === focusBlock && anchor.offset === focus.offset;
        const isSameBlock = anchorBlock === focusBlock;
        const anchorPath =  anchorBlock?.path;
        const focusPath = focusBlock?.path;
        let direction = "none";
        if (isCollapsed) {
            direction = "none";
        } else if (isSameBlock) {
            direction = anchor.offset < focus.offset ? "forward" : "backward";
        } else {
            const aDom = anchorBlock?.nodes.holder;
            const fDom = focusBlock?.nodes.holder;
            const order = compareParagraphsOrder(aDom, fDom);
            direction = !!order ? "forward" : "backward";
        }
        const {scrollTop, scrollTopBlockId} = layout.scrollerState;
        return {
            anchor,
            focus,
            anchorBlock,
            anchorBlockId: anchorBlock?.id,
            focusBlock,
            focusBlockId: focusBlock?.id,
            isCollapsed,
            isSameBlock,
            direction,
            scrollTop,
            scrollTopBlockId,
            anchorPath,
            focusPath
        }
    }

    setCursor(cursor: MECursorState) {
        const { content, layout } = this.instance.context;
        const selection = this;
        let { anchor, focus, anchorBlock, anchorPath, anchorBlockId, focusBlockId, focusBlock, focusPath, scrollTop } = cursor;
        anchorBlock = anchorBlock || (anchorBlockId && content.queryBlock(anchorBlockId)) || (anchorPath && content.queryBlock(anchorPath));
        focusBlock = focusBlock || (focusBlockId && content.queryBlock(focusBlockId)) || (focusPath && content.queryBlock(focusPath));
        if (!anchorBlock || !focusBlock) {
            return;
        }

        if(typeof scrollTop !== 'undefined') {
            layout.nodes.scroller.scrollTop = scrollTop;
        }

        const { node: anchorNode, offset: anchorOffset } = getNodeAndOffset(anchorBlock.nodes.holder, anchor.offset);
        const { node: focusNode, offset: focusOffset } = getNodeAndOffset(focusBlock.nodes.holder, focus.offset);

        selection.setAnchor(anchorNode, anchorOffset);
        selection.setFocus(focusNode, focusOffset);
        // selection.select(anchorNode, anchorOffset, focusNode, focusOffset);
    }

    setAnchor(node: Node, offset = 0) {
        const range = this.getRangeAt(0);

        /** if found deepest node is native input */
        if (dom.isNativeInput(node)) {
            if (!dom.canSetCursor(node)) {
                return;
            }

            node.focus();
            node.selectionStart = node.selectionEnd = offset;

            return node.getBoundingClientRect();
        }

        range.setStart(node, offset).collapse(true);
        range.setCursor(true, true);

        return range.getBoundingClientRect();
    }

    setFocus(node: Node, offset = 0) {
        this.nativeSelection?.extend(node, offset);
    }

    selectNode(node: Node) {
        const range = this.getRangeAt(0);
        range.selectNode(node).select(true);
        return range.getBoundingClientRect();
    }

    select(startNode: Node, startOffset: number, endNode?: Node, endOffset: number = 0) {
        const range = this.getRangeAt(0);
        range.setStart(startNode, startOffset);
        if (endNode) {
            range.setEnd(endNode, endOffset);
        } else {
            range.collapse(true);
        }
        range.select(true);
        return range.getBoundingClientRect();
    }
}