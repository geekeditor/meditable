import dom from "@/packages/utils/domUtils";
import env from "@/packages/utils/env";
import dtd from "@/packages/utils/dtd";
import { MEAddress, MEBookmark, MEIndexedNode, MENativeNode } from "./dom";
import MESelection from "./selection";


enum RangeContentsAction {
    RangeContentsActionClone = 0,
    RangeContentsActionDelete,
    RangeContentsActionExtract
}

let gmid = 0,
    fillData: MENativeNode | null;


const getTagName = (node: MENativeNode | null) => {
    if (!node) return '';

    const tagName = (node as HTMLElement).tagName;
    return tagName;
}

const execContentsAction = (range: MERange, action: RangeContentsAction) => {
    let start = range.startContainer,
        end = range.endContainer,
        startOffset = range.startOffset,
        endOffset = range.endOffset,
        doc = range.document(),
        frag = doc.createDocumentFragment(),
        tmpStart,
        tmpEnd;

    if (start && start.nodeType === 1) {
        start =
            start.childNodes[startOffset] ||
            (tmpStart = start.appendChild(doc.createTextNode("")));
    }

    if (end && end.nodeType === 1) {
        end =
            end.childNodes[endOffset] ||
            (tmpEnd = end.appendChild(doc.createTextNode("")));
    }

    if (start === end && start && start.nodeType === 3) {
        frag.appendChild(
            doc.createTextNode(
                (start as Text).substringData(startOffset, endOffset - startOffset)
            )
        );

        if (action) {
            (start as Text).deleteData(startOffset, endOffset - startOffset);
            range.collapse(true);
        }

        return frag;
    }

    let current,
        currentLevel,
        clone: any = frag,
        startParents = dom.findParents(start, true),
        endParents = dom.findParents(end, true),
        i = 0;
    while (startParents[i] === endParents[i]) i++;

    for (let j = i, si;
        (si = startParents[j]); j++) {
        current = si.nextSibling;
        if (si === start && start) {
            if (!tmpStart) {
                if (range.startContainer && range.startContainer.nodeType === 3 && start.nodeValue) {
                    clone.appendChild(
                        doc.createTextNode(start.nodeValue.slice(startOffset))
                    );

                    if (action) {
                        (start as Text).deleteData(startOffset, start.nodeValue.length - startOffset);
                    }
                } else {
                    clone.appendChild(!action ? start.cloneNode(true) : start);
                }
            }
        } else {
            currentLevel = si.cloneNode(false);
            clone.appendChild(currentLevel);
        }

        while (current) {
            if (current === end || current === endParents[j]) {
                break;
            }

            si = current.nextSibling;
            clone.appendChild(!action ? current.cloneNode(true) : current);

            current = si;
        }

        clone = currentLevel;
    }

    clone = frag;
    if (!startParents[i]) {
        clone.appendChild(startParents[i - 1].cloneNode(false));
        clone = clone.firstChild;
    }

    for (let j = i, ei;
        (ei = endParents[j]); j++) {
        current = ei.previousSibling;
        if (ei === end) {
            if (!tmpEnd && range.endContainer && range.endContainer.nodeType === 3) {
                clone.appendChild(doc.createTextNode((end as Text).substringData(0, endOffset)));
                if (action) {
                    (end as Text).deleteData(0, endOffset);
                }
            }
        } else {
            currentLevel = ei.cloneNode(false);
            clone.appendChild(currentLevel);
        }

        if (j !== i || !startParents[i]) {
            while (current) {
                if (current === start) {
                    break;
                }

                ei = current.previousSibling;
                clone.insertBefore(!action ? current.cloneNode(true) : current,
                    clone.firstChild
                );
                current = ei;
            }
        }
        clone = currentLevel;
    }

    if (action) {
        range.setStartBefore(!endParents[i] ? endParents[i - 1] : !startParents[i] ? startParents[i - 1] : endParents[i]).collapse(true);
    }

    tmpStart && dom.remove(tmpStart);
    tmpEnd && dom.remove(tmpEnd);

    return frag;
};
const setBoundaryPoint = (toStart: boolean, node: MENativeNode | null, offset: number, range: MERange) => {

    const tagName = getTagName(node);
    if (
        node &&
        node.nodeType === 1 &&
        (dtd.$empty[tagName] || dtd.$nonChild[tagName])
    ) {
        offset = dom.getNodeIndex(node) + (toStart ? 0 : 1);
        node = node.parentNode;
    }

    if (toStart) {
        range.startContainer = node;
        range.startOffset = offset;

        if (!range.endContainer) {
            range.collapse(true);
        }
    } else {
        range.endContainer = node;
        range.endOffset = offset;

        if (!range.startContainer) {
            range.collapse(false);
        }
    }
    updateCollapse(range);
    return range;
};
const updateCollapse = (range: MERange) => {
    range.collapsed =
        !!range.startContainer &&
        !!range.endContainer &&
        range.startContainer === range.endContainer &&
        range.startOffset === range.endOffset;
};
const isSelectOneNode = (range: MERange) => {
    return (!range.collapsed &&
        !!range.startContainer &&
        range.startContainer.nodeType === 1 &&
        range.startContainer === range.endContainer &&
        range.endOffset - range.startOffset === 1
    );
};

const removeFillData = (doc: HTMLDocument, excludeNode: Node) => {
    try {
        if (fillData && dom.inDoc(fillData, doc)) {
            if (fillData.nodeValue && !fillData.nodeValue.replace(dom.fillCharReg, "").length) {
                let tmpNode = fillData.parentNode;
                dom.remove(fillData);
                while (
                    tmpNode && (dom.isEmptyInlineElement(tmpNode) && env.safari ?
                        !(dom.getPosition(tmpNode, excludeNode) & dom.POSITION_CONTAINS) :
                        !tmpNode.contains(excludeNode))
                ) {
                    fillData = tmpNode.parentNode;
                    dom.remove(tmpNode);
                    tmpNode = fillData as Node & ParentNode;
                }
            } else if (fillData.nodeValue) {
                fillData.nodeValue = fillData.nodeValue.replace(dom.fillCharReg, "");
            }
        }
    } catch (e) {
        console.log(e);
    }
};

const mergeSiblingFillChar = (node: MEIndexedNode, dir: string) => {
    let tmpNode;
    node = node[dir];
    while (node && dom.isFillChar(node as Node)) {
        tmpNode = node[dir];
        dom.remove(node as Node);
        node = tmpNode;
    }
};

class MERange {
    private _document!: HTMLDocument;
    private _root!: HTMLElement;
    private _selection!: MESelection;
    collapsed!: boolean;
    startContainer!: MENativeNode | null;
    endContainer!: MENativeNode | null;
    startOffset!: number;
    endOffset!: number;
    constructor(document: HTMLDocument, root: HTMLElement, selection: MESelection) {
        this._document = document;
        this._root = root;
        this._selection = selection;
        this.collapsed = true;
        this.startContainer = this.endContainer = null;
        this.startOffset = this.endOffset = 0;
    }

    document() {
        return this._document;
    }


    cloneRange() {
        return new MERange(this._document, this._root, this._selection)
            .setStart(this.startContainer, this.startOffset)
            .setEnd(this.endContainer, this.endOffset);
    }

    // Contents methods
    cloneContents() {
        return this.collapsed ? null : execContentsAction(this, RangeContentsAction.RangeContentsActionClone);
    }

    deleteContents() {
        if (!this.collapsed) {
            execContentsAction(this, RangeContentsAction.RangeContentsActionDelete);
        }

        if (env.webkit) {
            let txt = this.startContainer;
            if (txt && txt.nodeType === 3 && !txt.nodeValue) {
                this.setStartBefore(txt).collapse(true);
                dom.remove(txt);
            }
        }
        return this;
    }

    extractContents() {
        return this.collapsed ? null : execContentsAction(this, RangeContentsAction.RangeContentsActionExtract);
    }


    // Modify selection range methods
    setStart(node: MENativeNode | null, offset: number) {
        return setBoundaryPoint(true, node, offset, this);
    }

    setEnd(node: MENativeNode | null, offset: number) {
        return setBoundaryPoint(false, node, offset, this);
    }

    setStartAfter(node: Node) {
        return node.parentNode ? this.setStart(node.parentNode, dom.getNodeIndex(node) + 1) : this;
    }

    setStartBefore(node: Node) {
        return node.parentNode ? this.setStart(node.parentNode, dom.getNodeIndex(node)) : this;
    }

    setEndAfter(node: Node) {
        return node.parentNode ? this.setEnd(node.parentNode, dom.getNodeIndex(node) + 1) : this;
    }

    setEndBefore(node: Node) {
        return node.parentNode ? this.setEnd(node.parentNode, dom.getNodeIndex(node)) : this;
    }

    setStartAtFirst(node: MENativeNode) {
        return node.parentNode ? this.setStart(node, 0) : this;
    }

    setStartAtLast(node: MENativeNode) {
        return this.setStart(
            node,
            node.nodeType === 3 ? (node.nodeValue ? node.nodeValue.length : 0) : node.childNodes.length
        );
    }

    setEndAtFirst(node: MENativeNode) {
        return this.setEnd(node, 0);
    }

    setEndAtLast(node: MENativeNode) {
        return this.setEnd(
            node,
            node.nodeType === 3 ? (node.nodeValue ? node.nodeValue.length : 0) : node.childNodes.length
        );
    }

    selectNode(node: Node) {
        return this.setStartBefore(node).setEndAfter(node);
    }

    selectNodeContents(node: MENativeNode) {
        return this.setStartAtFirst(node).setEndAtLast(node);
    }

    getCommonAncestor(includeSelf?: boolean, ignoreTextNode?: boolean) {
        let start = this.startContainer,
            end = this.endContainer;
        if (!!start && start === end) {
            if (includeSelf && isSelectOneNode(this)) {
                start = start.childNodes[this.startOffset] as (Node & ChildNode & ParentNode);
                if (start.nodeType === 1) {
                    return start;
                }
            }

            return ignoreTextNode && start.nodeType === 3 ? start.parentNode : start;
        }

        return start && end ? dom.getCommonAncestor(start, end) : null;
    }

    enlargeBoundarySuitably() {
        let child,
            collapsed = this.collapsed;

        while(!!this.startContainer && (this.startContainer.nodeType === 3 || !dom.isBlockElm(this.startContainer as HTMLElement))) {
            if(this.startOffset === 0) {
                this.setStartBefore(this.startContainer)
            } else if(this.startOffset === (this.startContainer.nodeType === 3 ? this.startContainer.nodeValue?.length : this.startContainer.childNodes.length)) {
                this.setStartAfter(this.startContainer)
            } else {
                break;
            }
        }

        if(collapsed) {
            return this.collapse(true)
        }

        while(!!this.endContainer && (this.endContainer.nodeType === 3 || !dom.isBlockElm(this.endContainer as HTMLElement))) {
            if(this.endOffset === 0) {
                this.setEndBefore(this.endContainer)
            } else if(this.endOffset === (this.endContainer.nodeType === 3 ? this.endContainer.nodeValue?.length : this.endContainer.childNodes.length)) {
                this.setEndAfter(this.endContainer)
            } else {
                break;
            }
        }

        return this;
    }

    // Adjust boundary methods
    shrinkBoundaryMinimality(ingoreEnd?: boolean) {
        let child,
            collapsed = this.collapsed;

        function check(node: MEIndexedNode) {
            return (
                node.nodeType === 1 &&
                !dom.isBookmarkNode(node as HTMLSpanElement) &&
                !dtd.$empty[node.tagName] &&
                !dtd.$nonChild[node.tagName]
            );
        }

        while (
            !!this.startContainer &&
            this.startContainer.nodeType === 1 &&
            (child = this.startContainer.childNodes[this.startOffset]) &&
            check(child)
        ) {
            this.setStart(child, 0);
        }

        if (collapsed) {
            return this.collapse(true);
        }

        if (!ingoreEnd) {
            while (
                !!this.endContainer &&
                this.endContainer.nodeType === 1 &&
                this.endOffset > 0 &&
                (child = this.endContainer.childNodes[this.endOffset - 1]) &&
                check(child)
            ) {
                this.setEnd(child, child.childNodes.length);
            }
        }

        return this;
    }

    shrinkBoundarySuitably() {
        if (!this.collapsed) {
            while (!!this.startContainer &&
                !!this.startOffset &&
                !dom.isRoot(this.startContainer) &&
                this.startOffset === (this.startContainer.nodeType === 3 ? this.startContainer.nodeValue?.length : this.startContainer.childNodes.length)

            ) {
                this.setStartAfter(this.startContainer);
            }

            while (
                !this.endOffset &&
                !!this.endContainer &&
                !dom.isRoot(this.endContainer) &&
                (this.endContainer.nodeType === 3 ? this.endContainer.nodeValue?.length : this.endContainer.childNodes.length)
            ) {
                this.setEndBefore(this.endContainer);
            }
        }
        return this;
    }

    txtToElmBoundary(ignoreCollapsed?: boolean) {
        function adjust(r: MERange, c: string) {
            const isStart = c === 'start'
            const container = isStart ? r.startContainer : r.endContainer,
                offset = isStart ? r.startOffset : r.endOffset;
            const setBefore = isStart ? r.setStartBefore.bind(r) : r.setEndBefore.bind(r);
            const setAfter = isStart ? r.setStartAfter.bind(r) : r.setEndAfter.bind(r);
            if (container && container.nodeType === 3) {
                if (!offset) {
                    setBefore(container);
                } else if (container.nodeValue && offset >= container.nodeValue.length) {
                    setAfter(container);
                }
            }
        }

        if (ignoreCollapsed || !this.collapsed) {
            adjust(this, "start");
            adjust(this, "end");
        }
        return this;
    }



    trimBoundary(ignoreEnd?: boolean) {
        this.txtToElmBoundary();
        let start = this.startContainer,
            offset = this.startOffset,
            collapsed = this.collapsed,
            end = this.endContainer;
        if (start && start.nodeType === 3) {
            if (offset === 0) {
                this.setStartBefore(start);
            } else {
                if (start.nodeValue && offset >= start.nodeValue.length) {
                    this.setStartAfter(start);
                } else {
                    let textNode = dom.split(start as Text, offset);

                    if (start === end && textNode) {
                        this.setEnd(textNode, this.endOffset - offset);
                    } else if (start.parentNode === end) {
                        this.endOffset += 1;
                    }
                    textNode && this.setStartBefore(textNode);
                }
            }
            if (collapsed) {
                return this.collapse(true);
            }
        }

        if (!ignoreEnd) {
            offset = this.endOffset;
            end = this.endContainer;

            if (end && end.nodeType === 3) {
                if (offset === 0) {
                    this.setEndBefore(end);
                } else {
                    end.nodeValue && offset < end.nodeValue.length && dom.split(end as Text, offset);
                    this.setEndAfter(end);
                }
            }
        }

        return this;
    }

    enlargeBoundary(toBlock: boolean, stopFn?: Function) {
        let pre,
            node,
            tmp = this._document.createTextNode("");
        if (toBlock && this.startContainer) {
            node = this.startContainer;
            if (node.nodeType === 1) {
                if (node.childNodes[this.startOffset]) {
                    pre = node = node.childNodes[this.startOffset];
                } else {
                    node.appendChild(tmp);
                    pre = node = tmp;
                }
            } else {
                pre = node;
            }

            while (node) {
                if (dom.isBlockElm(node as HTMLElement)) {
                    node = pre;
                    while ((pre = node.previousSibling) && !dom.isBlockElm(pre as HTMLElement)) {
                        node = pre;
                    }
                    this.setStartBefore(node);
                    break;
                }
                pre = node;
                node = node.parentNode;
            }

            node = this.endContainer;
            if (node && node.nodeType === 1) {
                if ((pre = node.childNodes[this.endOffset])) {
                    node.insertBefore(tmp, pre);
                } else {
                    node.appendChild(tmp);
                }
                pre = node = tmp;
            } else {
                pre = node;
            }
            while (node) {
                if (dom.isBlockElm(node as HTMLElement)) {
                    node = pre;
                    while (node && (pre = node.nextSibling) && !dom.isBlockElm(pre as HTMLElement)) {
                        node = pre;
                    }
                    node && this.setEndAfter(node);
                    break;
                }
                pre = node;
                node = node.parentNode;
            }
            if (tmp.parentNode === this.endContainer) {
                this.endOffset--;
            }
            dom.remove(tmp);
        }

        if (!this.collapsed) {
            while (this.startOffset === 0 && this.startContainer) {
                if (stopFn && stopFn(this.startContainer)) {
                    break;
                }

                if (dom.isRoot(this.startContainer)) {
                    break;
                }

                this.setStartBefore(this.startContainer);
            }

            while (
                this.endContainer &&
                this.endOffset ===
                (this.endContainer.nodeType === 3 ? this.endContainer.nodeValue?.length : this.endContainer.childNodes.length)
            ) {
                if (stopFn && stopFn(this.endContainer)) {
                    break;
                }

                if (dom.isRoot(this.endContainer)) {
                    break;
                }

                this.setEndAfter(this.endContainer);
            }
        }

        return this;
    }

    enlargeToBlockElm(ignoreEnd: boolean) {
        while (this.startContainer && !dom.isBlockElm(this.startContainer as HTMLElement)) {
            this.setStartBefore(this.startContainer);
        }

        if (!ignoreEnd) {
            while (this.endContainer && !dom.isBlockElm(this.endContainer as HTMLElement)) {
                this.setEndAfter(this.endContainer);
            }
        }

        return this;
    }

    insertNode(node: MENativeNode) {
        let first = node,
            length = 1;
        if (node.nodeType === 11 && node.firstChild) {
            first = node.firstChild;
            length = node.childNodes.length;
        }

        this.trimBoundary(true);
        const start = this.startContainer,
            offset = this.startOffset;
        if (start) {
            const nextNode = start.childNodes[offset];
            if (nextNode) {
                start.insertBefore(node, nextNode);
            } else {
                start.appendChild(node);
            }
        }


        if (first.parentNode === this.endContainer) {
            this.endOffset = this.endOffset + length;
        }

        return this.setStartBefore(first);
    }

    applyInlineStyle(tagName: string, attrs?: any, list?: Node[]) {
        if (this.collapsed) return this;
        this.trimBoundary()
            .enlargeBoundary(false, function (node: Node) {
                return node.nodeType === 1 && dom.isBlockElm(node as HTMLElement);
            })
            .shrinkBoundarySuitably();

        let bookmark = this.createBookmark(),
            end = bookmark.end,
            filterFn = function (node: MEIndexedNode) {
                return node.nodeType === 1 ?
                    node.tagName.toLowerCase() !== "br" :
                    !dom.isWhitespace(node as Text);
            },
            current = dom.getNextDomNode(bookmark.start as HTMLSpanElement, false, filterFn),
            node,
            pre,
            range = this.cloneRange(),
            top: any;
        while (current && dom.getPosition(current, end as HTMLSpanElement) & dom.POSITION_PRECEDING) {
            if (current.nodeType === 3 || dtd[tagName][current.tagName]) {
                range.setStartBefore(current);
                node = current;
                while (
                    node &&
                    (node.nodeType === 3 || dtd[tagName][node.tagName]) &&
                    node !== end
                ) {
                    pre = node;
                    node = dom.getNextDomNode(node, node.nodeType === 1, null, function (
                        parent: MEIndexedNode
                    ) {
                        return dtd[tagName][parent.tagName];
                    });
                }
                let frag = range.setEndAfter(pre).extractContents(),
                    elm: any;
                if (list && list.length > 0) {
                    let level;
                    top = level = list[0].cloneNode(false);
                    for (let i = 1, ci;
                        (ci = list[i++]);) {
                        if (level) {
                            level.appendChild(ci.cloneNode(false));
                            level = level.firstChild;
                        }

                    }
                    elm = level;
                } else {
                    elm = range._document.createElement(tagName);
                }

                if (attrs) {
                    dom.setAttributes(elm, attrs);
                }

                if (elm) {
                    elm.appendChild(frag);

                    if (elm.tagName === "SPAN" && attrs && attrs.style) {
                        const spans = elm.querySelectorAll("span");
                        spans.forEach((s: HTMLElement) => {
                            s.style.cssText = s.style.cssText + ";" + attrs.style;
                        })
                    }
                }


                if ((list && top) || elm) {
                    range.insertNode(list ? top : elm);
                }


                let aNode;
                if (
                    tagName === "span" &&
                    attrs.style &&
                    /text-decoration/.test(attrs.start) &&
                    (aNode = dom.findParentByTagName(elm, "a", true))
                ) {
                    dom.setAttributes(aNode as HTMLElement, attrs);
                    dom.remove(elm, true);
                    elm = aNode;
                } else {
                    dom.mergeSibling(elm);
                    dom.clearEmptySibling(elm);
                }

                dom.mergeChild(elm, attrs);
                dom.mergeToParent(elm);
                if (node === end) {
                    break;
                }
                current = dom.getNextDomNode(elm, false, filterFn);
            } else {
                current = dom.getNextDomNode(current, true, filterFn);
            }
        }

        return this.moveToBookmark(bookmark);
    }

    removeInlineStyle(tagNames: (string[]) | string) {
        if (this.collapsed) return this;
        tagNames = Array.isArray(tagNames) ? tagNames : [tagNames];
        this.shrinkBoundaryMinimality().shrinkBoundarySuitably();
        let start: MEIndexedNode | null = this.startContainer,
            end: MEIndexedNode | null = this.endContainer;
        while (!!start) {
            if (start.nodeType === 1) {
                const tag = start.tagName.toLowerCase()
                if (tagNames.findIndex((tagName) => tagName.toLowerCase() === tag) > -1) {
                    break;
                }

                if (dom.isRoot(start as Node)) {
                    start = null;
                    break;
                }
            }
            start = start.parentNode;
        }
        while (end) {
            if (end.nodeType === 1) {
                const tag = end.tagName.toLowerCase()
                if (tagNames.findIndex((tagName) => tagName.toLowerCase() === tag) > -1) {
                    break;
                }

                if (dom.isRoot(end as Node)) {
                    end = null;
                    break;
                }
            }

            end = end.parentNode;
        }
        let bookmark = this.createBookmark(),
            frag,
            tmpRange;
        if (start) {
            tmpRange = this.cloneRange()
                .setEndBefore(bookmark.start as HTMLSpanElement)
                .setStartBefore(start as Node);
            frag = tmpRange.extractContents();
            tmpRange.insertNode(frag as Node);
            dom.clearEmptySibling(start as Node, true);
            start.parentNode && start.parentNode.insertBefore(bookmark.start as HTMLSpanElement, start);
        }
        if (end && bookmark.end) {
            tmpRange = this.cloneRange().setStartAfter(bookmark.end as HTMLSpanElement).setEndAfter(end as Node);
            frag = tmpRange.extractContents();
            tmpRange.insertNode(frag as Node);
            dom.clearEmptySibling(end as Node, false, true);
            end.parentNode && end.parentNode.insertBefore(bookmark.end as HTMLSpanElement, end.nextSibling);
        }
        let current = dom.getNextDomNode(bookmark.start as HTMLElement, false, function (node: Node) {
            return node.nodeType === 1;
        }),
            next;
        while (current && current !== bookmark.end) {
            next = dom.getNextDomNode(current, true, function (node: Node) {
                return node.nodeType === 1;
            });
            if (tagNames.findIndex((tagName) => tagName.toLowerCase() === current.tagName.toLowerCase()) > -1) {
                dom.remove(current, true);
            }
            current = next;
        }
        return this.moveToBookmark(bookmark);
    }

    applyParagraphStyle(tagName: string, attrs: any, override?: boolean) {

        let txt;
        if (this.collapsed) {
            txt = this._document.createTextNode('p');
            this.insertNode(txt);

            if (env.ie) {
                let node = txt.previousSibling;
                if (node && dom.isWhitespace(node as Text)) {
                    dom.remove(node);
                }

                node = txt.nextSibling;
                if (node && dom.isWhitespace(node as Text)) {
                    dom.remove(node);
                }
            }
        }

        const notExchange = ['TD', 'LI', 'PRE'];
        const bookmark = this.createBookmark();
        const filterFn = (node: MEIndexedNode) => {
            return node.nodeType === 1 ? node.tagName.toLowerCase() !== 'br' && !dom.isBookmarkNode(node as HTMLSpanElement) : !dom.isWhitespace(node as Text);
        };

        this.enlargeBoundary(true);
        const bookmark2 = this.createBookmark();

        let para, current = dom.getNextDomNode(bookmark2.start as Node, false, filterFn),
            tmpRange = this.cloneRange(),
            tmpNode;
        while (current && !(dom.getPosition(current, bookmark2.end as Node) & dom.POSITION_FOLLOWING)) {
            if (current.nodeType === 3 || !dom.isBlockElm(current)) {
                tmpRange.setStartBefore(current);
                while (current && current !== bookmark2.end && !dom.isBlockElm(current)) {
                    tmpNode = current;
                    current = dom.getNextDomNode(current, false, null, (node: Node) => !dom.isBlockElm(node as HTMLSpanElement));
                }
                tmpRange.setEndAfter(tmpNode);

                para = this._document.createElement(tagName);
                if (attrs) {
                    dom.setAttributes(para, attrs);
                    if (override && attrs.style) {
                        para.style.cssText = attrs.style;
                    }
                }
                const contents = tmpRange.extractContents();
                contents && para.appendChild(contents);

                // fill
                if (dom.isEmptyNode(para)) {
                    dom.fillNode(this._document, para);
                }

                tmpRange.insertNode(para);

                let parentNode = para.parentNode as HTMLElement;
                if (parentNode && dom.isBlockElm(parentNode) && !dom.isRoot(parentNode) && notExchange.findIndex((tagName) => tagName.toLowerCase() === parentNode.tagName) === -1) {

                    if (!override) {
                        parentNode.getAttribute('dir') && para.setAttribute('dir', parentNode.getAttribute('dir') || '');

                        parentNode.style.cssText && (para.style.cssText = parentNode.style.cssText + ';' + para.style.cssText);
                        parentNode.style.textAlign && !para.style.textAlign && (para.style.textAlign = parentNode.style.textAlign);
                        parentNode.style.textIndent && !para.style.textIndent && (para.style.textIndent = parentNode.style.textIndent);
                        parentNode.style.padding && !para.style.padding && (para.style.padding = parentNode.style.padding);
                    }

                    if (attrs && /h\d/i.test(parentNode.tagName) && !/h\d/i.test(para.tagName)) {
                        dom.setAttributes(parentNode, attrs);
                        if (attrs.style && override) {
                            parentNode.style.cssText = attrs.style;
                        }

                        dom.remove(para, true);
                        para = parentNode;
                    } else {
                        para.parentNode && dom.remove(para.parentNode, true);
                    }
                }


                if (notExchange.findIndex((tagName) => tagName.toLowerCase() === parentNode.tagName) !== -1) {
                    current = parentNode;
                } else {
                    current = para;
                }

                current = dom.getNextDomNode(current, false, filterFn);
            } else {
                current = dom.getNextDomNode(current, true, filterFn);
            }
        }

        this.moveToBookmark(bookmark2).moveToBookmark(bookmark);

        if (txt) {
            this.setStartBefore(txt).collapse(true);
            const pNode = txt.parentNode;

            dom.remove(txt);

            if (pNode && dom.isBlockElm(pNode as HTMLSpanElement) && dom.isEmptyNode(pNode as HTMLElement)) {
                dom.fillNode(this._document, pNode as HTMLElement);
            }
        }

        if (env.gecko && this.collapsed && this.startContainer && this.startContainer.nodeType === 1) {
            const child: any = this.startContainer.childNodes[this.startOffset];
            if (child && child.nodeType === 1 && child.tagName.toLowerCase() === tagName.toLowerCase()) {
                this.setStart(child, 0).collapse(true);
            }
        }

        // range.select();
        return this;
    }

    applyJustify(align: any) {
        let txt;
        if (this.collapsed) {
            txt = this._document.createTextNode("p");
            this.insertNode(txt);
        }

        const bookmark = this.createBookmark();
        const filterFn = (node: MEIndexedNode) => {
            return node.nodeType === 1 ? node.tagName.toLowerCase() !== 'br' && !dom.isBookmarkNode(node as HTMLSpanElement) : !dom.isWhitespace(node as Text);
        };

        this.enlargeBoundary(true);
        const bookmark2 = this.createBookmark();

        let current = dom.getNextDomNode(bookmark2.start as Node, false, filterFn),
            tmpRange = this.cloneRange(),
            tmpNode;
        while (current && !(dom.getPosition(current, bookmark2.end as Node) & dom.POSITION_FOLLOWING)) {
            if (current.nodeType === 3 || !dom.isBlockElm(current)) {
                tmpRange.setStartBefore(current);
                while (current && current !== bookmark2.end && !dom.isBlockElm(current)) {
                    tmpNode = current;
                    current = dom.getNextDomNode(current, false, null, (node: Node) => !dom.isBlockElm(node as HTMLElement));
                }
                tmpRange.setEndAfter(tmpNode);

                const ancestor = tmpRange.getCommonAncestor();
                if (ancestor && !dom.isRoot(ancestor) && dom.isBlockElm(ancestor as HTMLElement)) {
                    dom.setStyles(ancestor as HTMLElement, typeof align === 'string' ? {
                        'text-align': align
                    } : align);
                    current = ancestor;
                } else {
                    const p = this._document.createElement('p');
                    dom.setStyles(p, typeof align === 'string' ? {
                        'text-align': align
                    } : align);
                    const frag = tmpRange.extractContents();
                    p.appendChild(frag as Node);
                    tmpRange.insertNode(p);
                    current = p;
                }

                current = dom.getNextDomNode(current, false, filterFn);
            } else {
                current = dom.getNextDomNode(current, true, filterFn);
            }
        }

        this.moveToBookmark(bookmark2).moveToBookmark(bookmark);

        if (txt) {
            this.setStartBefore(txt).collapse(true);
            dom.remove(txt);
        }

        return this;
    }

    collapse(toStart?: boolean) {
        if (toStart) {
            this.endContainer = this.startContainer;
            this.endOffset = this.startOffset;
        } else {
            this.startContainer = this.endContainer;
            this.startOffset = this.endOffset;
        }
        this.collapsed = true;
        return this;
    }

    getClosedNode() {
        let node;
        if (!this.collapsed) {
            const range = this.cloneRange().shrinkBoundarySuitably().shrinkBoundaryMinimality();
            if (isSelectOneNode(range) && range.startContainer) {
                const child = range.startContainer.childNodes[range.startOffset] as MEIndexedNode;
                if (
                    child &&
                    child.nodeType === 1 &&
                    (dtd.$empty[child.tagName] || dtd.$nonChild[child.tagName])
                ) {
                    node = child;
                }
            }
        }

        return node;
    }

    scrollToView(win: Window, offset: number) {
        win = win || dom.getWindow(this._document);
        const span = this._document.createElement("span");
        span.innerHTML = "&nbsp;";
        this.cloneRange().insertNode(span);
        dom.scrollToView(span, win, offset);
        dom.remove(span);
        return this;
    }

    inFillChar() {
        const start = this.startContainer;
        return (
            this.collapsed &&
            start &&
            start.nodeType === 3 &&
            start.nodeValue &&
            start.nodeValue.replace(new RegExp("^" + dom.fillChar), "").length + 1 ===
            start.nodeValue.length
        );
    }

    createBookmark(serialize?: string, same?: boolean) {
        let endNode: HTMLSpanElement | null = null,
            startNode = this._document.createElement("wbr");
        // startNode.style.cssText = "display:none;line-height:0px;";
        // startNode.appendChild(this._document.createTextNode("\u200D"));
        startNode.id = "_me_bookmark_start_" + (same ? "" : gmid++);

        if (!this.collapsed) {
            endNode = startNode.cloneNode(true) as HTMLSpanElement;
            endNode.id = "_me_bookmark_end_" + (same ? "" : gmid++);
        }

        this.insertNode(startNode);
        if (endNode) {
            this.collapse(false).insertNode(endNode).setEndBefore(endNode);
        }
        this.setStartAfter(startNode);
        return {
            start: serialize ? startNode.id : startNode,
            end: endNode ? (serialize ? endNode.id : endNode) : null,
            id: serialize,
        };
    }

    moveToBookmark(bookmark: MEBookmark) {

        const doc = this._root.getRootNode() as Document

        const start = !!bookmark.id ?
            doc.getElementById(bookmark.start as string) :
            bookmark.start,
            end =
                bookmark.end && bookmark.id ?
                    doc.getElementById(bookmark.end as string) :
                    bookmark.end;

        if (start) {
            this.setStartBefore(start as Node);
            dom.remove(start as Node);
        }

        if (end) {
            this.setEndBefore(end as Node);
            dom.remove(end as Node);
        } else {
            this.collapse(true);
        }
        return this;
    }

    createAddress(ignoreEnd?: boolean, ignoreTxt?: boolean) {
        const addr: MEAddress = {
            collapsed: !!this.collapsed,
            startAddress: []
        };
        const getAddress = (isStart?: boolean) => {
            let node = isStart ? this.startContainer : this.endContainer;
            const parents = dom.findParents(node, true, function (node: Node) {
                return !dom.isRoot(node);
            }),
                addrs: number[] = [];
            for (let i = 0, ci;
                (ci = parents[i++]);) {
                addrs.push(dom.getNodeIndex(ci, ignoreTxt));
            }

            let firstIndex = 0;
            if (ignoreTxt && node) {
                if (node.nodeType === 3) {
                    let tmpNode = node.previousSibling;
                    while (tmpNode && tmpNode.nodeType === 3) {
                        firstIndex += tmpNode.nodeValue ? tmpNode.nodeValue.replace(dom.fillCharReg, "").length : 0;
                        tmpNode = tmpNode.previousSibling;
                    }
                    firstIndex += isStart ? this.startOffset : this.endOffset;
                } else {
                    node = node.childNodes[isStart ? this.startOffset : this.endOffset];
                    if (node) {
                        firstIndex = dom.getNodeIndex(node, ignoreTxt);
                    } else {
                        node = isStart ? this.startContainer : this.endContainer;
                        if (node) {
                            let first = node.firstChild;
                            while (first) {
                                if (dom.isFillChar(first)) {
                                    first = first.nextSibling;
                                    continue;
                                }
                                firstIndex++;
                                if (first.nodeType === 3) {
                                    while (first && first.nodeType === 3) {
                                        first = first.nextSibling;
                                    }
                                } else {
                                    first = first.nextSibling;
                                }
                            }
                        }

                    }
                }
            } else {
                firstIndex = isStart ?
                    node && dom.isFillChar(node) ?
                        0 :
                        this.startOffset :
                    this.endOffset;
            }

            if (firstIndex < 0) {
                firstIndex = 0;
            }

            addrs.push(firstIndex);
            return addrs;
        };
        addr.startAddress = getAddress(true);
        if (!ignoreEnd) {
            addr.endAddress = this.collapsed ? Array.from(addr.startAddress) :
                getAddress();
        }

        return addr;
    }

    moveToAddress(addr: MEAddress, ignoreEnd?: boolean) {
        const setAddress = (address: number[], isStart?: boolean) => {
            let tmpNode = this._root as MENativeNode,
                parentNode,
                offset = 0;
            for (let i = 0, ci; i < address.length; i++) {
                parentNode = tmpNode;
                ci = address[i]
                tmpNode = tmpNode.childNodes[ci];
                if (!tmpNode) {
                    offset = ci;
                    break;
                }
            }
            if (isStart) {
                tmpNode
                    ?
                    this.setStartBefore(tmpNode) :
                    this.setStart(parentNode as MENativeNode, offset);
            } else {
                tmpNode ? this.setEndAfter(tmpNode) : this.setEnd(parentNode as MENativeNode, offset);
            }
        };
        setAddress(addr.startAddress, true);
        !ignoreEnd && addr.endAddress && setAddress(addr.endAddress);
        return this;
    }

    equals(rng: MERange) {
        return this.startContainer === rng.startContainer && this.startOffset === rng.startOffset && this.endContainer === rng.endContainer && this.endOffset === rng.endOffset;
    }

    traversal(doFn: Function, filterFn: Function) {
        if (this.collapsed) return this;
        let bookmark = this.createBookmark(),
            end = bookmark.end,
            current = dom.getNextDomNode(bookmark.start as Node, false, filterFn);
        while (
            current &&
            end &&
            current !== end &&
            dom.getPosition(current, end as Node) & dom.POSITION_PRECEDING
        ) {
            let tmpNode = dom.getNextDomNode(current, false, filterFn);
            doFn(current);
            current = tmpNode;
        }
        return this.moveToBookmark(bookmark);
    }

    setCursor(toEnd: boolean = true, noFillData: boolean = true) {
        return this.collapse(!toEnd).select(noFillData);
    }

    select(notInsertFillData: boolean = true) {
        const checkOffset = (rng: MERange) => {
            const check = (node: Node, offset: number, dir: string) => {
                if (node.nodeType === 3 && node.nodeValue && node.nodeValue.length < offset) {
                    if (dir === 'start') {
                        rng.startOffset = node.nodeValue.length;
                    } else {
                        rng.endOffset = node.nodeValue.length;
                    }
                }
            };

            rng.startContainer && check(rng.startContainer, rng.startOffset, "start");
            rng.endContainer && check(rng.endContainer, rng.endOffset, "end");
        };

        let win = dom.getWindow(this._document),
            sel = this._selection /* win.getSelection()*/, // TODO:
            txtNode;

        env.gecko ? this._document.body.focus() :  (win && win.focus());
        if (sel) {
            sel.removeAllRanges();
            if (this.collapsed && !notInsertFillData) {
                let start = this.startContainer,
                    child = start;
                if (start && start.nodeType === 1) {
                    child = start.childNodes[this.startOffset];
                }

                if (start && !(start.nodeType === 3 && this.startOffset) &&
                    (child ?
                        !child.previousSibling || child.previousSibling.nodeType !== 3 :
                        !start.lastChild || start.lastChild.nodeType !== 3)
                ) {
                    txtNode = this._document.createTextNode(dom.fillChar);
                    this.insertNode(txtNode);
                    removeFillData(this._document, txtNode);
                    mergeSiblingFillChar(txtNode, "previousSibling");
                    mergeSiblingFillChar(txtNode, "nextSibling");
                    fillData = txtNode;
                    this.setStart(txtNode, env.webkit ? 1 : 0).collapse(true);
                }
            }

            
            if (
                this.collapsed &&
                env.opera &&
                this.startContainer &&
                this.startContainer.nodeType === 1
            ) {
                let child: any = this.startContainer.childNodes[this.startOffset];
                if (!child) {
                    child = this.startContainer.lastChild;
                    if (child && dom.isBr(child)) {
                        this.setStartBefore(child).collapse(true);
                    }
                } else {
                    while (child && dom.isBlockElm(child)) {
                        if (child.nodeType === 1 && child.childNodes[0]) {
                            child = child.childNodes[0];
                        } else {
                            break;
                        }
                    }
                    this.setStartBefore(child).collapse(true);
                }
            }

            checkOffset(this);
            
            // console.log(this);
            sel.addRange(this);
        }

        return this;
    }

    getBoundingClientRect() {
        const nRange = document.createRange();
        nRange.setStart(this.startContainer as Node, this.startOffset);
        nRange.setEnd(this.endContainer as Node, this.endOffset);
        return nRange.getBoundingClientRect();
    }
}

export default MERange;