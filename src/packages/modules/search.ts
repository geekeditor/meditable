

import { MEEditableModuleInstance, MENodeData, MESearchOptions } from "../types";
import { CLASS_NAMES } from "../utils/classNames";
import domUtils from "../utils/domUtils";
import dtd from "../utils/dtd";
import { addFormat, clearFormat, getFormatsInRange } from "./content/commands/format";
import { COMMAND_TYPE_MAP } from "./content/commands/inline";
import { generator } from "./content/inlineRenderers/tokenizer";
import { getNodeAndOffset, getOffsetOfParent, getTextContent } from "./content/utils/dom";
import { findBlockByElement } from "./content/utils/find";
import MERange from "./editable/range";
import MEModule from "./module";




const blockElm: { [key: string]: number } = {
    table: 1,
    tbody: 1,
    tr: 1,
    ol: 1,
    ul: 1
};

function getText(node: Node | null) {
    if (!node) return '';
    const text = getTextContent(node, [CLASS_NAMES.ME_INLINE_RENDER, CLASS_NAMES.ME_MARKER])
    return text.replace(domUtils.fillCharReg, "")
}

function findTextInString(textContent: string, options: MESearchOptions, currentIndex: number) {
    let str = options.searchKey;
    const reg = new RegExp(str, "g" + (options.caseSensitive ? "" : "i"));

    if (options.dir === -1) {
        textContent = textContent.substr(0, currentIndex);
        textContent = textContent.split("").reverse().join("");
        str = str.split("").reverse().join("");
        const match = reg.exec(textContent);
        if (match) {
            return currentIndex - match.index - str.length;
        }
    } else {
        textContent = textContent.substr(currentIndex);
        const match = reg.exec(textContent);
        if (match) {
            return match.index + currentIndex;
        }
    }
    return -1;
}

function findTextBlockElm(node: Node, currentIndex: number, options: MESearchOptions) {
    let textContent,
        index,
        methodName = options.all || options.dir == 1 ? domUtils.getNextDomNode : domUtils.getPreDomNode;
    if (domUtils.isRoot(node)) {
        node = node.firstChild as Node;
    }
    while (node) {
        textContent = getText(node);
        index = findTextInString(textContent, options, currentIndex);
        if (index != -1) {
            return {
                node: node,
                index: index
            };
        }
        node = methodName(node);
        while (node && blockElm[node.nodeName.toLowerCase()]) {
            node = methodName(node, true);
        }
        if (node) {
            currentIndex = options.dir == -1 ? getText(node).length : 0;
        }
    }
}

function findNTextInBlockElm(node: Node, index: number, str: string): { node: Node; index: number } | undefined {
    let currentIndex = 0,
        currentNode = node.firstChild,
        currentNodeLength = 0,
        result;
    while (currentNode) {
        if (currentNode.nodeType == 3) {
            currentNodeLength = getText(currentNode).replace(
                /(^[\t\r\n]+)|([\t\r\n]+$)/,
                ""
            ).length;
            currentIndex += currentNodeLength;
            if (currentIndex >= index) {
                return {
                    node: currentNode,
                    index: currentNodeLength - (currentIndex - index)
                };
            }
        } else if (!dtd.$empty[currentNode.nodeName]) {
            currentNodeLength = getText(currentNode).replace(
                /(^[\t\r\n]+)|([\t\r\n]+$)/,
                ""
            ).length;
            currentIndex += currentNodeLength;
            if (currentIndex >= index) {
                result = findNTextInBlockElm(
                    currentNode,
                    currentNodeLength - (currentIndex - index),
                    str
                );
                if (result) {
                    return result;
                }
            }
        }
        currentNode = domUtils.getNextDomNode(currentNode);
    }
}

function searchReplaceAction(editable: MEEditableModuleInstance, options: MESearchOptions, rng: MERange) {
    rng = rng || editable.selection.getRangeAt(0).cloneRange();
    const searchIndexKey = `${Number(Math.random().toString().substr(2, 10)).toString(36)}`
    let startBlockNode,
        searchKey = options.searchKey,
        span = editable.document.createElement("span");
    span.innerHTML = searchIndexKey;

    rng.shrinkBoundaryMinimality(true);
    let markerNode;
    if (rng.startContainer.nodeType === 1 && (markerNode = (rng.startContainer as Element).closest(`.${CLASS_NAMES.ME_MARKER}`))) {
        rng.setStartBefore(markerNode);
    }

    rng.insertNode(span);
    rng.enlargeToBlockElm(true);
    startBlockNode = rng.startContainer;
    let currentIndex = getText(startBlockNode).indexOf(
        searchIndexKey
    );
    rng.setStartBefore(span);
    domUtils.remove(span);
    let result = startBlockNode && findTextBlockElm(startBlockNode, currentIndex, options);
    if (result) {
        let rngStart = findNTextInBlockElm(result.node, result.index, searchKey);
        let rngEnd = findNTextInBlockElm(
            result.node,
            result.index + searchKey.length,
            searchKey
        );
        if (rngStart) {
            rng.setStart(rngStart.node, rngStart.index)
        }
        if (rngEnd) {
            rng.setEnd(rngEnd.node, rngEnd.index);
        }

        if (options.replaceKey !== undefined && options.replace) {
            replaceText(rng, options);
        }
        return true;
    } else {
    }
}

function replaceText(rng: MERange, options: MESearchOptions) {

    const block = findBlockByElement(rng.startContainer)
    if (!block) {
        return
    }
    const blockRenderer = block.renderer;
    let text = blockRenderer.text;
    const datas: MENodeData[] = blockRenderer.datas || [];

    const start = { offset: getOffsetOfParent(rng.startContainer, block.nodes.holder) + rng.startOffset, delata: 0 };
    const end = { offset: getOffsetOfParent(rng.endContainer, block.nodes.holder) + rng.endOffset, delata: 0 };

    if (!options.replaceType || options.replaceType === 'text') {
        const replaceKey = options.replaceKey || ""
        const searchKey = options.searchKey
        let repaceText = text.substring(start.offset, end.offset)
        if (repaceText === searchKey) {
            text = text.substring(0, start.offset) + replaceKey + text.substring(end.offset)
        } else {
            let i = 0, j = 0, offset = -1;
            while (j < searchKey.length) {
                let char = searchKey.charAt(j);
                while (char !== repaceText.charAt(i++));
                repaceText = repaceText.substring(0, i - 1) + repaceText.substring(i);
                i--;
                j++;
                if (offset < 0) {
                    offset = i;
                }
            }
            repaceText = repaceText.substring(0, offset) + replaceKey + repaceText.substring(offset)
            text = text.substring(0, start.offset) + repaceText + text.substring(end.offset)
        }

    } else if (options.replaceFormat) {
        const type = COMMAND_TYPE_MAP[options.replaceFormat];
        const { formats, neighbors } = getFormatsInRange(start, end, datas);
        const [currentFormats, currentNeightbors] = [formats, neighbors].map(item => item.filter(format => {
            return format.type === type ||
                format.type === 'html_tag' && format.tag === type
        }).reverse())
        if(currentFormats.length) {
            for (const token of currentFormats) {
                clearFormat(token, { start, end })
            }
        } else if(currentNeightbors.length) {
            for (const neighbor of currentNeightbors) {
                clearFormat(neighbor, { start, end })
            }
        }
        
        start.offset += start.delata
        end.offset += end.delata
        text = generator(datas)
        text = addFormat(type, text, { start, end })
    }

    blockRenderer.render({ text })
    const { node: anchorNode, offset: anchorOffset } = getNodeAndOffset(block.nodes.holder, start.offset);
    const { node: focusNode, offset: focusOffset } = getNodeAndOffset(block.nodes.holder, end.offset);
    rng.setStart(anchorNode, anchorOffset)
    rng.setEnd(focusNode, focusOffset)
}


export default class MESearch extends MEModule {
    private _resultList: MERange[] = [];
    private _currentIndex: number = 0;
    private _canvas!: HTMLCanvasElement;
    private _holder!: HTMLElement;
    private _editable!: MEEditableModuleInstance;

    async prepare(): Promise<boolean> {
        this._editable = this.instance.context.editable;
        this.makeHighlightCanvas();
        return true;
    }

    search(options: MESearchOptions) {
        if(options.searchKey) {
            const { event } = this.instance.context;
            event.trigger('beforeSearch')
            this._resultList = this.doSearch(options);
            event.trigger('afterSearch')
            this._currentIndex = 0;
        }

        return this.update();
    }

    replace(options: MESearchOptions) {
        if (options.searchKey) {
            if (!options.all) {
                if(this._resultList.length) {
                    this._currentIndex = this._currentIndex % this._resultList.length;
                    let rng = this._resultList[this._currentIndex];
                    replaceText(rng, options);
                    options.all = true;
                    this._resultList = this.doSearch(options);
                    this._currentIndex = this._currentIndex % this._resultList.length;
                }
            } else {
                this.doReplace(options);
                if (options.replaceType === 'format') {
                    this._resultList = this.doSearch(options);
                } else {
                    this._resultList = [];
                }

                this._currentIndex = 0;
            }
        }

        return this.update();
    }

    searchJumpNext() {
        const lastIndex = this._currentIndex % this._resultList.length;
        this._currentIndex = ++this._currentIndex % this._resultList.length;
        return this.update(lastIndex);
    }

    searchJumpPrev() {
        let lastIndex = this._currentIndex % this._resultList.length;
        this._currentIndex = (--this._currentIndex + this._resultList.length) % this._resultList.length;
        return this.update(lastIndex);
    }

    searchJumpIndex(index: number) {
        if (index < 0 || index >= this._resultList.length) {
            return {
                index: this._currentIndex,
                list: this._resultList
            }
        }

        let lastIndex = this._currentIndex % this._resultList.length;
        this._currentIndex = index;
        return this.update(lastIndex);
    }

    searchClear() {
        this._editable.holder.classList.toggle(CLASS_NAMES.ME_CONTENT__SEARCHING, false)
        this._resultList = [];
        this._currentIndex = 0;
        return this.update()
    }

    private update(lastIndex?: number) {
        const rect = this._canvas.getBoundingClientRect()
        let top = rect.top,
            left = rect.left;

        function renderHightlight(ctx: CanvasRenderingContext2D, rects: DOMRectList, color: string, clear?: boolean) {

            ctx.fillStyle = color;

            console.log(rects)

            for (let i = 0, rect;
                (rect = rects[i]); i++) {

                if (rect.width > 0 && rect.height > 0) {
                    let x = rect.left - left,
                        y = rect.top - top;
                    clear && ctx.clearRect(x, y, rect.width, rect.height);
                    ctx.fillRect(x, y, rect.width, rect.height);
                }
            }
        }

        const measure = this._editable.document.createRange();
        const ctx = this._canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        if (!lastIndex) {
            this._canvas.height = this._holder.offsetHeight;
            this._canvas.width = this._holder.offsetWidth;
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            for (let i = 0, rng;
                (rng = this._resultList[i]); i++) {

                measure.setStart(rng.startContainer as Node, rng.startOffset);
                measure.setEnd(rng.endContainer as Node, rng.endOffset);

                let rects = measure.getClientRects();
                renderHightlight(ctx, rects, i === this._currentIndex ? 'rgba(166,210,252,0.3)' : 'rgba(244,206,94,0.3)');
            }
        } else {
            let rng = this._resultList[lastIndex];
            measure.setStart(rng.startContainer as Node, rng.startOffset);
            measure.setEnd(rng.endContainer as Node, rng.endOffset);
            let rects = measure.getClientRects();
            renderHightlight(ctx, rects, 'rgba(244,206,94,0.3)', true);

            rng = this._resultList[this._currentIndex];
            measure.setStart(rng.startContainer as Node, rng.startOffset);
            measure.setEnd(rng.endContainer as Node, rng.endOffset);
            rects = measure.getClientRects();
            renderHightlight(ctx, rects, 'rgba(166,210,252,0.3)', true);
        }


        if (this._resultList.length) {
            let rng = this._resultList[this._currentIndex],
                el = domUtils.findParent(rng.startContainer, function (node: Node) {
                    return node.nodeType == 1;
                }, true);
            el && (el as Element).scrollIntoView({
                block: 'center',
                behavior: 'smooth'
            });
        }

        return {
            list: this._resultList,
            index: this._currentIndex
        }
    }

    private doSearch(options: MESearchOptions) {
        options.replace = false;
        return this.searchReplaceAction(options);
    }

    private doReplace(options: MESearchOptions) {
        options.replace = true;
        return this.searchReplaceAction(options);
    }

    private searchReplaceAction(options: MESearchOptions) {
        this._editable.holder.classList.toggle(CLASS_NAMES.ME_CONTENT__SEARCHING, true)
        const rng = this._editable.selection.getRangeAt(0).cloneRange(),
            first = this._editable.holder.firstChild;
        if (first && first.nodeType == 1) {
            rng.setStart(first, 0);
            rng.shrinkBoundaryMinimality(true);
        } else if (first && first.nodeType == 3) {
            rng.setStartBefore(first);
        }
        // rng.collapse(true).select(true);
        rng.collapse(true);
        // if (opt.replaceStr !== undefined) {
        //     me.fireEvent("saveScene");
        // }
        let rngs = []
        while (searchReplaceAction(this._editable, options, rng)) {
            rngs.push(rng.cloneRange());
            if (options.all) {
                rng.collapse(options.dir === 1 ? false : true);
            } else {
                break;
            }
        }

        return rngs;
    }

    private makeHighlightCanvas() {
        const anchor = this._editable.holder.parentNode;
        if (anchor) {
            const highlight = this._editable.document.createElement('div');
            highlight.setAttribute('id', 'search-highlight');
            highlight.setAttribute('class', 'search-highlight');
            highlight.style.cssText = 'position: absolute;pointer-events: none;top: 0;bottom: 0;right: 0;left: 0';
            anchor.appendChild(highlight);
            this._holder = highlight;

            let canvas = this._editable.document.createElement('canvas');
            canvas.style.maxWidth = "100%"
            highlight.appendChild(canvas);

            this._canvas = canvas;
        }
    }

}