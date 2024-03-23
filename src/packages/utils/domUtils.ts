import env from "./env";
import dtd from "./dtd";

function listToMap(list: string[] | string) {
    if (!list || !list.length) return {};
    list = Array.isArray(list) ? list : list.split(",");
    let obj: any = {};
    for (let i = 0, ci;
        (ci = list[i++]);) {
        obj[ci.toUpperCase()] = obj[ci] = 1;
    }
    return obj;
}

function fixColor(name: string, value: string) {
    if (/color/i.test(name) && /rgba?/.test(value)) {
        let array = value.split(",");
        if (array.length > 3) return "";
        value = "#";
        for (let i = 0, color;
            (color = array[i++]);) {
            color = parseInt(color.replace(/[^\d]/gi, ""), 10).toString(16);
            value += color.length === 1 ? "0" + color : color;
        }
        value = value.toUpperCase();
    }
    return value;
}

function transUnitToPx(val: string) {
    if (!/(pt|cm)/.test(val)) {
        return val;
    }
    let unit, value;
    val.replace(/([\d.]+)(\w+)/, function (str, v, u) {
        value = v;
        unit = u;
        return str;
    });
    if (value && unit) {
        switch (unit) {
            case "cm":
                value = parseFloat(value) * 25;
                break;
            case "pt":
                value = Math.round((parseFloat(value) * 96) / 72);
        }
    }
    return value + (value ? "px" : "");
}

function getDomNode(node: any, start: string, ltr: string, startFromChild?: boolean, fn?: Function | null, guard?: Function): any {

    let tmpNode = startFromChild && node[start],
        parent: any | null = null;
    !tmpNode && (tmpNode = node[ltr]);
    while (!tmpNode && (parent = (parent || node).parentNode)) {
        if (parent.tagName === "BODY" || (guard && !guard(parent))) {
            return null;
        }
        tmpNode = parent[ltr];
    }
    if (tmpNode && fn && !fn(tmpNode)) {
        return getDomNode(tmpNode, start, ltr, false, fn);
    }
    return tmpNode;
}
const attrFix: any =
    env.ie && env.version < 9 ? {
        tabindex: "tabIndex",
        readonly: "readOnly",
        for: "htmlFor",
        class: "className",
        maxlength: "maxLength",
        cellspacing: "cellSpacing",
        cellpadding: "cellPadding",
        rowspan: "rowSpan",
        colspan: "colSpan",
        usemap: "useMap",
        frameborder: "frameBorder",
    } : {
        tabindex: "tabIndex",
        readonly: "readOnly",
    },
    styleBlock = listToMap([
        "-webkit-box",
        "-moz-box",
        "block",
        "list-item",
        "table",
        "table-row-group",
        "table-header-group",
        "table-footer-group",
        "table-row",
        "table-column-group",
        "table-column",
        "table-cell",
        "table-caption",
    ]);

const fillChar = env.ie && env.version === 6 ? "\ufeff" : "\u200B";
const domUtils = {
    //节点常量
    NODE_ELEMENT: 1,
    NODE_DOCUMENT: 9,
    NODE_TEXT: 3,
    NODE_COMMENT: 8,
    NODE_DOCUMENT_FRAGMENT: 11,

    //位置关系
    POSITION_IDENTICAL: 0,
    POSITION_DISCONNECTED: 1,
    POSITION_FOLLOWING: 2,
    POSITION_PRECEDING: 4,
    POSITION_IS_CONTAINED: 8,
    POSITION_CONTAINS: 16,
    //ie6使用其他的会有一段空白出现
    fillChar,
    fillCharReg: new RegExp(fillChar, "g"),
    bookmarkFillChar: "‍",
    bookmarkFillCharEncdoe: "&zwj;",
    bookmarkFillCharReg: new RegExp("‍", "g"),
    //-------------------------Node部分--------------------------------
    // keys: {
    //     /*Backspace*/
    //     8: 1,
    //     /*Delete*/
    //     46: 1,
    //     /*Shift*/
    //     16: 1,
    //     /*Ctrl*/
    //     17: 1,
    //     /*Alt*/
    //     18: 1,
    //     37: 1,
    //     38: 1,
    //     39: 1,
    //     40: 1,
    //     13: 1 /*enter*/,
    // },
    keyCodes: {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        ESC: 27,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        DOWN: 40,
        RIGHT: 39,
        INSERT: 45,
        DELETE: 46,
        META: 91,

        CAPSLOCK: 20,
        PAGEUP: 33,
        PAGEDOWN: 34,
        END: 35,
        HOME: 36,
        NUMLOCK: 144,

        "=": 187,
        "-": 189,
        '.': 190,
        ',': 188,
        "'": 222,
        a: 65,
        b: 66,
        c: 67,
        d: 68,
        e: 69,
        f: 70,
        g: 71,
        h: 72,
        i: 73,
        j: 74,
        k: 75,
        l: 76,
        m: 77,
        n: 78,
        o: 79,
        p: 80,
        q: 81,
        r: 82,
        s: 83,
        t: 84,

        u: 85,
        v: 86,
        w: 87,

        x: 88,
        y: 89,
        z: 90, //回退
    },
    keys: {
        Enter: "Enter",
        Backspace: "Backspace",
        Space: "Space",
        Delete: "Delete",
        ArrowUp: "ArrowUp",
        ArrowDown: "ArrowDown",
        ArrowLeft: "ArrowLeft",
        ArrowRight: "ArrowRight",
        Tab: "Tab",
        Escape: "Escape",
    },
    /**
     * 获取节点A相对于节点B的位置关系
     * @method getPosition
     * @param { Node } nodeA 需要查询位置关系的节点A
     * @param { Node } nodeB 需要查询位置关系的节点B
     * @return { Number } 节点A与节点B的关系
     * @example
     * ```javascript
     * //output: 20
     * let position = UE.dom.dom.getPosition( document.documentElement, document.body );
     *
     * switch ( position ) {
     *
     *      //0
     *      case UE.dom.dom.POSITION_IDENTICAL:
     *          console.log('元素相同');
     *          break;
     *      //1
     *      case UE.dom.dom.POSITION_DISCONNECTED:
     *          console.log('两个节点在不同的文档中');
     *          break;
     *      //2
     *      case UE.dom.dom.POSITION_FOLLOWING:
     *          console.log('节点A在节点B之后');
     *          break;
     *      //4
     *      case UE.dom.dom.POSITION_PRECEDING;
     *          console.log('节点A在节点B之前');
     *          break;
     *      //8
     *      case UE.dom.dom.POSITION_IS_CONTAINED:
     *          console.log('节点A被节点B包含');
     *          break;
     *      case 10:
     *          console.log('节点A被节点B包含且节点A在节点B之后');
     *          break;
     *      //16
     *      case UE.dom.dom.POSITION_CONTAINS:
     *          console.log('节点A包含节点B');
     *          break;
     *      case 20:
     *          console.log('节点A包含节点B且节点A在节点B之前');
     *          break;
     *
     * }
     * ```
     */
    getPosition(nodeA: any, nodeB: any) {
        // 如果两个节点是同一个节点
        if (nodeA === nodeB) {
            // dom.POSITION_IDENTICAL
            return 0;
        }
        let node,
            parentsA = [nodeA],
            parentsB = [nodeB];
        node = nodeA;
        while (node && (node = node.parentNode)) {
            // 如果nodeB是nodeA的祖先节点
            if (node === nodeB) {
                // dom.POSITION_IS_CONTAINED + dom.POSITION_FOLLOWING
                return 10;
            }
            parentsA.push(node);
        }
        node = nodeB;
        while (node && (node = node.parentNode)) {
            // 如果nodeA是nodeB的祖先节点
            if (node === nodeA) {
                // dom.POSITION_CONTAINS + dom.POSITION_PRECEDING
                return 20;
            }
            parentsB.push(node);
        }
        parentsA.reverse();
        parentsB.reverse();
        if (parentsA[0] !== parentsB[0]) {
            // dom.POSITION_DISCONNECTED
            return 1;
        }
        let i = -1;
        while ((i++, parentsA[i] === parentsB[i]));
        nodeA = parentsA[i];
        nodeB = parentsB[i];
        while (nodeA && nodeA.nextSibling && (nodeA = nodeA.nextSibling)) {
            if (nodeA === nodeB) {
                // dom.POSITION_PRECEDING
                return 4;
            }
        }
        // dom.POSITION_FOLLOWING
        return 2;
    },
    getNodeIndex(node: any, ignoreTextNode?: boolean) {
        let preNode = node,
            i = 0;
        while (preNode.previousSibling && (preNode = preNode.previousSibling)) {
            if (ignoreTextNode && preNode.nodeType === 3) {
                if (preNode.nextSibling && preNode.nodeType !== preNode.nextSibling.nodeType) {
                    i++;
                }
                continue;
            }
            i++;
        }
        return i;
    },
    inDoc(node: any, doc: HTMLDocument | HTMLElement) {
        return domUtils.getPosition(node, doc) === 10;
    },
    findParent(node: any | null, filterFn?: Function | null, includeSelf?: boolean) {
        if (node && !domUtils.isRoot(node)) {
            node = includeSelf ? node : node.parentNode;
            while (node) {
                if (!filterFn || filterFn(node) || domUtils.isRoot(node)) {
                    return filterFn && !filterFn(node) && domUtils.isRoot(node) ? null : node;
                }
                node = node.parentNode;
            }
        }
        return null;
    },
    findParentByTagName(node: any, tagNames: string | Array<string>, includeSelf?: boolean, excludeFn?: Function) {
        const map = listToMap(tagNames);
        return domUtils.findParent(
            node,
            function (node: any) {
                return map[node.tagName] && !(excludeFn && excludeFn(node));
            },
            includeSelf
        );
    },
    findParents(node: any | null, includeSelf?: boolean, filterFn?: Function | null, closerFirst?: boolean) {
        let parents =
            includeSelf && node && ((filterFn && filterFn(node)) || !filterFn) ? [node] : [];
        while ((node = domUtils.findParent(node, filterFn))) {
            parents.push(node);
        }
        return closerFirst ? parents : parents.reverse();
    },
    insertAfter(node: any, newNode: any) {
        if (!node.parentNode) return;
        return node.nextSibling ?
            node.parentNode.insertBefore(newNode, node.nextSibling) :
            node.parentNode.appendChild(newNode);
    },
    remove(node: any, keepChildren?: boolean) {
        let parent = node.parentNode,
            child;
        if (parent) {
            if (keepChildren && node.hasChildNodes()) {
                while ((child = node.firstChild)) {
                    parent.insertBefore(child, node);
                }
            }
            parent.removeChild(node);
        }
        return node;
    },
    removeBlockChildren(el: Element) {
        for (let i = 0; i < el.children.length; i++) {
            const child = el.children[i];
            if (domUtils.isBlockElm(child as HTMLElement)) {
                domUtils.remove(child, true)
            }
        }
        return el;
    },
    getNextDomNode(node: any, startFromChild?: boolean, filterFn?: Function | null, guard?: Function) {
        return getDomNode(
            node,
            "firstChild",
            "nextSibling",
            startFromChild,
            filterFn,
            guard
        );
    },
    getPreDomNode(node: any, startFromChild?: boolean, filterFn?: Function | null, guard?: Function) {
        return getDomNode(
            node,
            "lastChild",
            "previousSibling",
            startFromChild,
            filterFn,
            guard
        );
    },
    isBookmarkNode(node: HTMLSpanElement) {
        return node.nodeType === 1 && node.id && /^_ge_bookmark_/i.test(node.id);
    },
    createBookmarkNode(doc: Document | undefined, id: string | number) {
        id = id || ""
        const bookmark = (doc = doc || document).createElement("span")
        bookmark.style.cssText = "display:none;line-height:0px;"
        bookmark.appendChild(doc.createTextNode("‍"));
        bookmark.id = "_ge_bookmark_" + "start_" + id
        return bookmark
    },
    getBookmarkReg() {
        return new RegExp("<span[^>]*" + '_ge_bookmark_' + "[^>]*>[^<]*<\\/span>", "g")
    },
    getWindow(node: HTMLElement | HTMLDocument) {
        let doc: any = node.ownerDocument || node;
        return doc.defaultView || doc.parentWindow;
    },
    getCommonAncestor(nodeA: any, nodeB: any) {
        if (nodeA === nodeB) return nodeA;
        let parentsA = [nodeA],
            parentsB = [nodeB],
            parent = nodeA,
            i = -1;
        while (parent.parentNode && (parent = parent.parentNode)) {
            if (parent === nodeB) {
                return parent;
            }
            parentsA.push(parent);
        }
        parent = nodeB;
        while (parent.parentNode && (parent = parent.parentNode)) {
            if (parent === nodeA) return parent;
            parentsB.push(parent);
        }
        parentsA.reverse();
        parentsB.reverse();
        while ((i++, parentsA[i] === parentsB[i]));
        return i === 0 ? null : parentsA[i - 1];
    },
    clearEmptySibling(node: any, ignoreNext?: boolean, ignorePre?: boolean) {
        function clear(next: any | null, dir: string) {
            let tmpNode;
            while (
                next &&
                !domUtils.isBookmarkNode(next as HTMLSpanElement) &&
                (domUtils.isEmptyInlineElement(next as HTMLElement) ||
                    //这里不能把空格算进来会吧空格干掉，出现文字间的空格丢掉了
                    (next.nodeValue !== null && !new RegExp("[^\t\n\r" + domUtils.fillChar + "]").test(next.nodeValue)))
            ) {
                tmpNode = dir === 'nextSibling' ? next.nextSibling : next.previousSibling;
                domUtils.remove(next);
                next = tmpNode;
            }
        }
        !ignoreNext && clear(node.nextSibling, "nextSibling");
        !ignorePre && clear(node.previousSibling, "previousSibling");
    },
    split(node: Text, offset: number) {
        let doc = node.ownerDocument;
        if (env.ie && node.nodeValue && offset === node.nodeValue.length) {
            let next = doc.createTextNode("");
            return domUtils.insertAfter(node, next);
        }
        let retval = node.splitText(offset);
        //ie8下splitText不会跟新childNodes,我们手动触发他的更新
        if (env.ie8) {
            let tmpNode = doc.createTextNode("");
            domUtils.insertAfter(retval, tmpNode);
            domUtils.remove(tmpNode);
        }
        return retval;
    },
    isWhitespace: function (node: Text) {
        return !new RegExp("[^ \t\n\r" + domUtils.fillChar + "]").test((node.textContent || ''));
    },
    getXY(element: HTMLElement) {
        let x = 0,
            y = 0;
        while (element.offsetParent) {
            y += element.offsetTop;
            x += element.offsetLeft;
            element = element.offsetParent as HTMLElement;
        }
        return {
            x: x,
            y: y,
        };
    },
    on(element: HTMLElement | Document, type: string[] | string, handler: (evt: any) => any) {
        let types = Array.isArray(type) ? type : type.trim().split(/\s+/),
            k = types.length;
        if (k) {
            while (k--) {
                type = types[k];
                if (element.addEventListener) {
                    element.addEventListener(type as any, handler, false);
                }
            }
        }

    },
    un(element: HTMLElement, type: string[] | string, handler: (evt: any) => any) {
        let types = Array.isArray(type) ? type : type.trim().split(/\s+/),
            k = types.length;
        if (k) {
            while (k--) {
                type = types[k];
                if (element.removeEventListener) {
                    element.removeEventListener(type, handler, false);
                }
            }
        }
    },
    isSameElement(nodeA: HTMLElement, nodeB: HTMLElement) {
        if (nodeA.tagName !== nodeB.tagName) {
            return false;
        }
        let thisAttrs = nodeA.attributes,
            otherAttrs = nodeB.attributes;
        if (!env.ie && thisAttrs.length !== otherAttrs.length) {
            return false;
        }
        let attrA,
            attrB,
            al = 0,
            bl = 0;
        for (let i = 0;
            (attrA = thisAttrs[i++]);) {
            if (attrA.nodeName === "style") {
                if (attrA.specified) {
                    al++;
                }
                if (domUtils.isSameStyle(nodeA, nodeB)) {
                    continue;
                } else {
                    return false;
                }
            }
            if (env.ie) {
                if (attrA.specified) {
                    al++;
                    attrB = otherAttrs.getNamedItem(attrA.nodeName);
                } else {
                    continue;
                }
            } else {
                attrB = nodeB.attributes[(attrA as any).nodeName];
            }
            if (!attrB || !attrB.specified || attrA.nodeValue !== attrB.nodeValue) {
                return false;
            }
        }
        // 有可能attrB的属性包含了attrA的属性之外还有自己的属性
        if (env.ie) {
            for (let i = 0;
                (attrB = otherAttrs[i++]);) {
                if (attrB.specified) {
                    bl++;
                }
            }
            if (al !== bl) {
                return false;
            }
        }
        return true;
    },
    isSameStyle(nodeA: HTMLElement, nodeB: HTMLElement) {
        let styleA: any = nodeA.style.cssText
            .replace(/( ?; ?)/g, ";")
            .replace(/( ?: ?)/g, ":");
        let styleB: any = nodeB.style.cssText
            .replace(/( ?; ?)/g, ";")
            .replace(/( ?: ?)/g, ":");
        if (env.opera) {
            styleA = nodeA.style;
            styleB = nodeB.style;
            if (styleA.length !== styleB.length) return false;
            for (let p in styleA) {
                if (/^(\d+|csstext)$/i.test(p)) {
                    continue;
                }
                if (styleA[p] !== styleB[p]) {
                    return false;
                }
            }
            return true;
        }
        if (!styleA || !styleB) {
            return styleA === styleB;
        }
        styleA = styleA.split(";");
        styleB = styleB.split(";");
        if (styleA.length !== styleB.length) {
            return false;
        }
        for (let i = 0, ci: string;
            (ci = styleA[i++]);) {
            if (styleB.findIndex((c: string) => c === ci) === -1) {
                return false;
            }
        }
        return true;
    },
    isBlockElm(node: HTMLElement) {
        return (
            node.nodeType === 1 &&
            (dtd.$block[node.tagName] ||
                styleBlock[domUtils.getComputedStyle(node, "display")]) &&
            !dtd.$nonChild[node.tagName]
        );
    },
    isRoot(node: any) {
        // return node && node.nodeType === 1 && node.tagName.toLowerCase() === "body";
        const parentNode = node ? node.parentNode : null;
        return (
            parentNode &&
            node.nodeType === 1 &&
            ((node as HTMLElement).dataset.root || parentNode.nodeType === 9 || parentNode.nodeType === 11 /*|| (parentNode as HTMLElement).contentEditable === 'true'*/)
        );
    },
    breakParent(node: any, parent: any) {
        let tmpNode,
            parentClone: any = node,
            clone = node,
            leftNodes,
            rightNodes;
        do {
            parentClone = parentClone.parentNode;
            if (leftNodes) {
                parentClone && (tmpNode = parentClone.cloneNode(false));
                tmpNode && tmpNode.appendChild(leftNodes);
                leftNodes = tmpNode;
                parentClone && (tmpNode = parentClone.cloneNode(false));
                rightNodes && tmpNode && tmpNode.appendChild(rightNodes);
                rightNodes = tmpNode;
            } else if (parentClone) {
                leftNodes = parentClone.cloneNode(false);
                rightNodes = leftNodes.cloneNode(false);
            }
            while (clone.previousSibling && (tmpNode = clone.previousSibling) && leftNodes) {
                leftNodes.insertBefore(tmpNode, leftNodes.firstChild);
            }
            while (clone.nextSibling && (tmpNode = clone.nextSibling) && rightNodes) {
                rightNodes.appendChild(tmpNode);
            }
            clone = parentClone;
        } while (parent !== parentClone);
        tmpNode = parent.parentNode;
        if (tmpNode) {
            tmpNode.insertBefore(leftNodes, parent);
            tmpNode.insertBefore(rightNodes, parent);
            tmpNode.insertBefore(node, rightNodes);
        }
        domUtils.remove(parent);
        return node;
    },
    isEmptyInlineElement(node: any | null) {
        if (!node || node.nodeType !== 1 || !dtd.$removeEmpty[node.tagName]) {
            return false;
        }
        node = node.firstChild;
        while (node) {
            //如果是创建的bookmark就跳过
            if (domUtils.isBookmarkNode(node as HTMLSpanElement)) {
                return false;
            }
            if (
                (node.nodeType === 1 && !domUtils.isEmptyInlineElement(node)) ||
                (node.nodeType === 3 && !domUtils.isWhitespace(node as Text))
            ) {
                return false;
            }
            node = node.nextSibling;
        }
        return true;
    },
    trimWhiteTextNode(node: any) {
        function remove(dir: string) {
            let child;
            while (
                (child = node[dir]) &&
                child.nodeType === 3 &&
                domUtils.isWhitespace(child)
            ) {
                node.removeChild(child);
            }
        }
        remove("firstChild");
        remove("lastChild");
    },

    removeEmptyNode: function (node: any) {
        if (!node) return;

        for (let i = 0; i < node.childNodes.length; i++) {
            this.removeEmptyNode(node.childNodes[i]);
        }

        this.trimWhiteTextNode(node);

        if (
            node.nodeType === 1 &&
            !node.childNodes.length &&
            (this.isBr(node) || !dtd.$empty[node.tagName])
        ) {
            this.remove(node);
        }
    },

    /**
     * 合并node节点下相同的子节点
     */
    mergeChild(node: HTMLElement, attrs: any) {
        let list = domUtils.getElementsByTagName(node, node.tagName.toLowerCase());
        for (let i = 0, ci;
            (ci = list[i++] as HTMLElement);) {
            if (!ci.parentNode || domUtils.isBookmarkNode(ci)) {
                continue;
            }
            //span单独处理
            if (ci.tagName.toLowerCase() === "span") {
                if (node === ci.parentNode) {
                    domUtils.trimWhiteTextNode(node);
                    if (node.childNodes.length === 1) {
                        node.style.cssText = ci.style.cssText + ";" + node.style.cssText;
                        domUtils.remove(ci, true);
                        continue;
                    }
                }
                ci.style.cssText = node.style.cssText + ";" + ci.style.cssText;
                if (attrs) {
                    let style = attrs.style;
                    if (style) {
                        style = style.split(";");
                        for (let j = 0, s;
                            (s = style[j++]);) {
                            ci.style[domUtils.cssStyleToDomStyle(s.split(":")[0])] = s.split(
                                ":"
                            )[1];
                        }
                    }
                }
                if (domUtils.isSameStyle(ci, node)) {
                    domUtils.remove(ci, true);
                }
                continue;
            }
            if (domUtils.isSameElement(node, ci)) {
                domUtils.remove(ci, true);
            }
        }
    },

    /**
     * 原生方法getElementsByTagName的封装
     */
    getElementsByTagName(node: HTMLElement, name: string, filter?: string | Function) {
        let filterFn;
        if (filter && typeof filter === 'string') {
            let className = filter;
            filterFn = function (node: HTMLElement) {
                return domUtils.hasClass(node, className);
            };
        }
        const names = name.trim().replace(/[ ]{2,}/g, " ")
            .split(" ");
        let arr: HTMLElement[] = [];
        for (let n = 0, ni;
            (ni = names[n++]);) {
            let list = node.getElementsByTagName(ni);
            for (let i = 0, ci;
                (ci = list[i++]);) {
                if (!filterFn || filterFn(ci as HTMLElement)) arr.push(ci);
            }
        }

        return arr;
    },
    mergeToParent(node: HTMLElement) {
        let parent: any = node.parentNode;
        while (parent && dtd.$removeEmpty[parent.tagName]) {
            if (parent.tagName === node.tagName || parent.tagName === "A") {
                //针对a标签单独处理
                domUtils.trimWhiteTextNode(parent);
                //span需要特殊处理  不处理这样的情况 <span stlye="color:#fff">xxx<span style="color:#ccc">xxx</span>xxx</span>
                if (
                    (parent.tagName === "SPAN" && !domUtils.isSameStyle(parent, node)) ||
                    (parent.tagName === "A" && node.tagName === "SPAN")
                ) {
                    if (parent.childNodes.length > 1 || parent !== node.parentNode) {
                        node.style.cssText =
                            parent.style.cssText + ";" + node.style.cssText;
                        parent = parent.parentNode;
                        continue;
                    } else {
                        parent.style.cssText += ";" + node.style.cssText;
                        //trace:952 a标签要保持下划线
                        if (parent.tagName === "A") {
                            // parent.style.textDecoration = "underline";
                        }
                    }
                }
                if (parent.tagName !== "A") {
                    parent === node.parentNode && domUtils.remove(node, true);
                    break;
                }
            }
            parent = parent.parentNode;
        }
    },
    mergeSibling(node: HTMLElement, ignorePre?: boolean, ignoreNext?: boolean) {
        function merge(rtl: string, start: string, node: any) {
            let next;
            if (
                (next = node[rtl]) &&
                !domUtils.isBookmarkNode(next) &&
                next.nodeType === 1 &&
                domUtils.isSameElement(node as HTMLElement, next)
            ) {
                while (next.firstChild) {
                    if (start === "firstChild") {
                        node.insertBefore(next.lastChild, node.firstChild);
                    } else {
                        node.appendChild(next.firstChild);
                    }
                }
                domUtils.remove(next);
            }
        }
        !ignorePre && merge("previousSibling", "firstChild", node);
        !ignoreNext && merge("nextSibling", "lastChild", node);
    },
    unSelectable:
        (env.ie && env.ie9below) || env.opera ?

            function (node: any) {
                //for ie9
                node.onselectstart = function () {
                    return false;
                };
                node.onclick = node.onkeyup = node.onkeydown = function () {
                    return false;
                };
                node.unselectable = "on";
                node.setAttribute("unselectable", "on");
                for (let i = 0, ci;
                    (ci = node.all[i++]);) {
                    switch (ci.tagName.toLowerCase()) {
                        case "iframe":
                        case "textarea":
                        case "input":
                        case "select":
                            break;
                        default:
                            ci.unselectable = "on";
                            node.setAttribute("unselectable", "on");
                    }
                }
            } : function (node: any) {
                node.style.MozUserSelect = node.style.webkitUserSelect = node.style.msUserSelect = node.style.KhtmlUserSelect =
                    "none";
            },
    removeAttributes(node: HTMLElement, attrNames: string[] | string) {
        attrNames = Array.isArray(attrNames) ?
            attrNames :
            attrNames
                .trim()
                .replace(/[ ]{2,}/g, " ")
                .split(" ");
        for (let i = 0, ci;
            (ci = attrNames[i++]);) {
            ci = attrFix[ci] || ci;
            let val;
            switch (ci) {
                case "className":
                    node.className = "";
                    break;
                case "style":
                    node.style.cssText = "";
                    val = node.getAttributeNode("style");
                    !env.ie && val && node.removeAttributeNode(val);
            }
            node.removeAttribute(ci);
        }
    },
    createElement(doc: Document, tag: string, attrs: any) {
        return domUtils.setAttributes(doc.createElement(tag), attrs);
    },
    setAttributes(node: HTMLElement, attrs: any) {
        for (let attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
                let value = attrs[attr];
                switch (attr) {
                    case "class":
                        //ie下要这样赋值，setAttribute不起作用
                        node.className = value;
                        break;
                    case "style":
                        node.style.cssText = node.style.cssText + ";" + value;
                        break;
                    case "innerHTML":
                        node[attr] = value;
                        break;
                    case "value":
                        (node as HTMLInputElement).value = value;
                        break;
                    default:
                        node.setAttribute(attrFix[attr] || attr, value);
                }
            }
        }
        return node;
    },
    getComputedStyle(element: any, styleName: string) {
        //一下的属性单独处理
        let pros = "width height top left";

        if (pros.indexOf(styleName) > -1) {
            return (
                element[
                "offset" +
                styleName.replace(/^\w/, function (s) {
                    return s.toUpperCase();
                })
                ] + "px"
            );
        }
        //忽略文本节点
        if (element.nodeType === 3) {
            element = element.parentNode;
        }
        //ie下font-size若body下定义了font-size，则从currentStyle里会取到这个font-size. 取不到实际值，故此修改.
        if (
            env.ie &&
            env.version < 9 &&
            styleName === "font-size" &&
            !element.style.fontSize &&
            !dtd.$empty[element.tagName] &&
            !dtd.$nonChild[element.tagName]
        ) {
            let span = element.ownerDocument.createElement("span");
            span.style.cssText = "padding:0;border:0;font-family:simsun;";
            span.innerHTML = ".";
            element.appendChild(span);
            let result = span.offsetHeight;
            element.removeChild(span);
            span = null;
            return result + "px";
        }
        let value;
        try {
            if (env.webkit && styleName === "text-decoration") {
                value = domUtils.getWindow(element).getComputedStyle(element)[
                    "webkitTextDecorationsInEffect"
                ];
            } else {
                value =
                    domUtils.getStyle(element, styleName) ||
                    (!!window.getComputedStyle ?
                        domUtils
                            .getWindow(element)
                            .getComputedStyle(element, "")
                            .getPropertyValue(styleName) :
                        (element.currentStyle || element.style)[
                        domUtils.cssStyleToDomStyle(styleName)
                        ]);
            }
        } catch (e) {
            return "";
        }
        // console.log(element); console.log(styleName+":"+value);
        return transUnitToPx(fixColor(styleName, value));
    },

    removeClasses: function (elm: HTMLElement, classNames: string[] | string) {
        classNames = Array.isArray(classNames) ?
            classNames :
            classNames
                .trim()
                .replace(/[ ]{2,}/g, " ")
                .split(" ");
        let cls, i, ci;
        for (i = 0, ci, cls = elm.className;
            (ci = classNames[i++]);) {
            cls = cls.replace(new RegExp("\\b" + ci + "\\b"), "");
        }
        cls = cls.trim().replace(/[ ]{2,}/g, " ");
        if (cls) {
            elm.className = cls;
        } else {
            domUtils.removeAttributes(elm, ["class"]);
        }
    },
    addClass: function (elm: HTMLElement, classNames: string) {
        if (!elm) return;
        const names = classNames
            .trim()
            .replace(/[ ]{2,}/g, " ")
            .split(" ");
        let cls, i, ci;
        for (i = 0, ci, cls = elm.className;
            (ci = names[i++]);) {
            if (!new RegExp("\\b" + ci + "\\b").test(cls)) {
                cls += " " + ci;
            }
        }
        if (cls) {
            elm.className = cls.trim();
        }
    },
    hasClass(element: HTMLElement, className: string | RegExp) {
        if (typeof className !== 'string') {
            return className.test(element.className);
        }
        const names = className.trim()
            .replace(/[ ]{2,}/g, " ")
            .split(" ");
        let i, ci, cls;
        for (i = 0, ci, cls = element.className;
            (ci = names[i++]);) {
            if (!new RegExp("\\b" + ci + "\\b", "i").test(cls)) {
                return false;
            }
        }
        return i - 1 === names.length;
    },
    preventDefault: function (evt: Event) {
        evt.preventDefault ? evt.preventDefault() : (evt.returnValue = false);
    },
    stopPropagation: function(evt: Event) {
        env.stopPropagation ?? env.stopPropagation() 
    },
    cssStyleToDomStyle: (function () {
        const test = document.createElement("div").style as any,
            cache: any = {
                float: test.cssFloat !== undefined ?
                    "cssFloat" : test.styleFloat !== undefined ?
                        "styleFloat" : "float",
            };

        return function (cssName: string) {
            return (
                cache[cssName] ||
                (cache[cssName] = cssName
                    .toLowerCase()
                    .replace(/-./g, function (match) {
                        return match.charAt(1).toUpperCase();
                    }))
            );
        };
    })(),
    removeStyle: function (element: HTMLElement, name: string) {
        if (!element.style) return;
        if (env.ie) {
            //针对color先单独处理一下
            if (name === "color") {
                name = "(^|;)" + name;
            }
            element.style.cssText = element.style.cssText.replace(
                new RegExp(name + "[^:]*:[^;]+;?", "ig"),
                ""
            );
        } else {
            if (element.style.removeProperty) {
                element.style.removeProperty(name);
            } else {
                // element.style.removeAttribute(domUtils.cssStyleToDomStyle(name));
            }
        }

        if (!element.style.cssText) {
            domUtils.removeAttributes(element, ["style"]);
        }
    },
    getStyle(element: HTMLElement, name: string) {
        if (!element.style) return;
        let value = element.style[domUtils.cssStyleToDomStyle(name)];
        return fixColor(name, value);
    },

    getCSSText(element: HTMLElement) {
        let cssText = element.style.cssText,
            css: any;
        if (cssText) {
            css = {};
            let styles = cssText.split(";");
            for (let i = 0, ci;
                (ci = styles[i]); i++) {
                ci = ci.trim();
                let style = ci.match(/(?:(.+)?\:)\s(.+)/);
                if (style) {
                    css[style[1]] = style[2];
                }
            }
        }
        return css;
    },
    setStyle(element: HTMLElement, name: string, value: string) {
        //console.log(name); console.log(value);
        if (!element.style) return;
        element.style[domUtils.cssStyleToDomStyle(name)] = value;
        if (!element.style.cssText.trim()) {
            this.removeAttributes(element, "style");
        }
    },
    setStyles: function (element: HTMLElement, styles: any) {
        //console.log(styles);
        for (let name in styles) {
            if (styles.hasOwnProperty(name)) {
                domUtils.setStyle(element, name, styles[name]);
            }
        }
    },
    /**
     * 删除_moz_dirty属性
     * @private
     * @method removeDirtyAttr
     */
    removeDirtyAttr: function (node: HTMLElement) {
        for (
            let i = 0, ci, nodes = node.getElementsByTagName("*");
            (ci = nodes[i++]);

        ) {
            ci.removeAttribute("_moz_dirty");
        }
        node.removeAttribute("_moz_dirty");
    },
    getChildCount(node: HTMLElement, fn?: Function) {
        let count = 0,
            first = node.firstChild;
        fn =
            fn ||
            function () {
                return true;
            };
        while (first) {
            if (fn(first)) {
                count++;
            }
            first = first.nextSibling;
        }
        return count;
    },
    isEmptyNode(node: HTMLElement) {
        return (!node.firstChild ||
            domUtils.getChildCount(node, function (node: any) {
                return (!domUtils.isBr(node) &&
                    !domUtils.isBookmarkNode(node) &&
                    !domUtils.isWhitespace(node)
                );
            }) === 0
        );
    },
    clearSelectedArr(nodes: HTMLElement[]) {
        let node;
        while ((node = nodes.pop())) {
            domUtils.removeAttributes(node, ["class"]);
        }
    },
    scrollToView(node: HTMLElement, win: Window, offsetTop: number) {
        function getViewPaneSize() {
            let doc = win.document,
                mode = doc.compatMode === "CSS1Compat";
            return {
                width:
                    (mode ? doc.documentElement.clientWidth : doc.body.clientWidth) ||
                    0,
                height:
                    (mode ? doc.documentElement.clientHeight : doc.body.clientHeight) ||
                    0,
            };
        }
        function getScrollPosition(win: any) {
            if ("pageXOffset" in win) {
                return {
                    x: win.pageXOffset || 0,
                    y: win.pageYOffset || 0,
                };
            } else {
                let doc = win.document;
                return {
                    x: doc.documentElement.scrollLeft || doc.body.scrollLeft || 0,
                    y: doc.documentElement.scrollTop || doc.body.scrollTop || 0,
                };
            }
        };
        let winHeight = getViewPaneSize().height,
            offset = winHeight * -1 + offsetTop;
        offset += node.offsetHeight || 0;
        let elementPosition = domUtils.getXY(node);
        offset += elementPosition.y;
        let currentScroll = getScrollPosition(win).y;
        // offset += 50;
        if (offset > currentScroll || offset < currentScroll - winHeight) {
            win.scrollTo({
                left: 0,
                top: offset + (offset < 0 ? -20 : 20),
                behavior: "smooth",
            });
        }
    },
    isBr(node: HTMLElement) {
        return node && node.nodeType === 1 && node.tagName === "BR";
    },
    isFillChar(node: Node, isInStart?: boolean) {
        if (node.nodeType !== 3) return false;
        let text = node.nodeValue;
        if (isInStart && text) {
            return new RegExp("^" + domUtils.fillChar).test(text);
        }
        return text && !text.replace(new RegExp(domUtils.fillChar, "g"), "").length;
    },
    isStartInblock: function (range: any) {
        let tmpRange = range.cloneRange(),
            flag = 0,
            start: any = tmpRange.startContainer,
            tmp;
        if (start && start.nodeType === 1 && start.childNodes[tmpRange.startOffset]) {
            start = start.childNodes[tmpRange.startOffset];
            let pre = start.previousSibling;
            while (pre && domUtils.isFillChar(pre)) {
                start = pre;
                pre = pre.previousSibling;
            }
        }
        if (this.isFillChar(start, true) && tmpRange.startOffset === 1) {
            tmpRange.setStartBefore(start);
            start = tmpRange.startContainer;
        }

        while (start && domUtils.isFillChar(start)) {
            tmp = start;
            start = start.previousSibling;
        }
        if (tmp) {
            tmpRange.setStartBefore(tmp);
            start = tmpRange.startContainer;
        }
        if (
            start.nodeType === 1 &&
            domUtils.isEmptyNode(start) &&
            tmpRange.startOffset === 1
        ) {
            tmpRange.setStart(start, 0).collapse(true);
        }
        while (!tmpRange.startOffset) {
            start = tmpRange.startContainer;
            if (domUtils.isBlockElm(start) || domUtils.isRoot(start)) {
                flag = 1;
                break;
            }
            let pre = tmpRange.startContainer && tmpRange.startContainer.previousSibling,
                tmpNode;
            if (!pre) {
                tmpRange.startContainer && tmpRange.setStartBefore(tmpRange.startContainer);
            } else {
                while (pre && domUtils.isFillChar(pre)) {
                    tmpNode = pre;
                    pre = pre.previousSibling;
                }
                if (tmpNode) {
                    tmpRange.setStartBefore(tmpNode);
                } else {
                    tmpRange.startContainer && tmpRange.setStartBefore(tmpRange.startContainer);
                }
            }
        }
        return flag && tmpRange.startContainer && !domUtils.isRoot(tmpRange.startContainer) ? true : false;
    },
    isEmptyBlock: function (node: any, reg?: RegExp) {
        if (node.nodeType !== 1) return false;
        reg = reg || new RegExp("[ \xa0\t\r\n" + domUtils.fillChar + "]", "g");

        if (
            node[env.ie ? "innerText" : "textContent"].replace(reg, "").length > 0
        ) {
            return false;
        }
        for (let n in dtd.$isNotEmpty) {
            if (node.getElementsByTagName(n).length) {
                return false;
            }
        }
        return true;
    },
    setViewportOffset: function (element: HTMLElement, offset: { left: number; top: number; }) {
        let left = parseInt(element.style.left) | 0;
        let top = parseInt(element.style.top) | 0;
        let rect = element.getBoundingClientRect();
        let offsetLeft = offset.left - rect.left;
        let offsetTop = offset.top - rect.top;
        if (offsetLeft) {
            element.style.left = left + offsetLeft + "px";
        }
        if (offsetTop) {
            element.style.top = top + offsetTop + "px";
        }
    },
    fillNode: function (doc: Document, node: HTMLElement) {
        let tmpNode = env.ie ?
            doc.createTextNode(domUtils.fillChar) :
            doc.createElement("br");
        node.innerHTML = "";
        node.appendChild(tmpNode);
    },
    moveChild: function (src: Node, dst: Node, first?: boolean) {
        while (src.firstChild) {
            if (first && dst.firstChild) {
                src.lastChild && dst.insertBefore(src.lastChild, dst.firstChild);
            } else {
                dst.appendChild(src.firstChild);
            }
        }
    },
    hasNoAttributes: function (node: HTMLElement) {
        return env.ie ?
            /^<\w+\s*?>/.test(node.outerHTML) :
            node.attributes.length === 0;
    },
    isCustomNode(node: HTMLElement) {
        return node.nodeType === 1 && node.getAttribute("_ge_custom_node_");
    },
    isTagNode(node: any, tagName: string) {
        return (
            node.nodeType === 1 &&
            new RegExp("\\b" + node.tagName + "\\b", "i").test(tagName)
        );
    },
    filterNodeList: function (nodelist: Node[], filter: Function | string | string[], forAll?: boolean) {
        let results: Node[] = [];
        let filterFn: Function;
        if (typeof filter !== 'function') {
            let str = filter;
            const tagNames = Array.isArray(str) ? str : str.split(" ")
            filterFn = function (n: HTMLElement) {
                if (n && n.tagName) {
                    return (
                        tagNames.findIndex((t) => n.tagName.toLowerCase() === t) !== -1
                    );
                } else {
                    return false;
                }
            };
        } else {
            filterFn = filter
        }
        nodelist.forEach((n) => {
            filterFn(n) && results.push(n);
        })

        return results.length === 0 ?
            null :
            results.length === 1 || !forAll ?
                results[0] :
                results;
    },
    isInNodeEndBoundary: function (rng: any, node: Node) {
        let start = rng.startContainer;
        if (start && start.nodeType === 3 && start.nodeValue && rng.startOffset !== start.nodeValue.length) {
            return false;
        }
        if (start && start.nodeType === 1 && rng.startOffset !== start.childNodes.length) {
            return false;
        }
        while (start && start !== node) {
            if (start.nextSibling) {
                return false;
            }
            start = start.parentNode;
        }
        return true;
    },
    isBoundaryNode: function (node: any, dir: string) {
        let tmp;
        while (!domUtils.isRoot(node as HTMLElement)) {
            tmp = node;
            node = node.parentNode;
            if (tmp !== node[dir]) {
                return false;
            }
        }
        return true;
    },
    isNativeInput: function (target: any): target is HTMLInputElement | HTMLTextAreaElement {
        const nativeInputs = [
            'INPUT',
            'TEXTAREA',
        ];

        return target && target.tagName ? nativeInputs.includes(target.tagName) : false;
    },

    canSetCursor: function (target: HTMLElement): boolean {
        let result = true;

        if (domUtils.isNativeInput(target)) {
            switch (target.type) {
                case 'file':
                case 'checkbox':
                case 'radio':
                case 'hidden':
                case 'submit':
                case 'button':
                case 'image':
                case 'reset':
                    result = false;
                    break;
            }
        } else {
            result = domUtils.isContentEditable(target);
        }

        return result;
    },
    isContentEditable: function (element: HTMLElement): boolean {
        return element.contentEditable === 'true';
    },
    isLeaf: function (node: Node): boolean {
        if (!node) {
            return false;
        }

        return node.childNodes.length === 0;
    },
    isElement: function (node: any): node is Element {
        return node && node.nodeType && node.nodeType === Node.ELEMENT_NODE;
    },
    make: function (tagName: string, classNames: string | string[] | null = null, attributes: any = {}, dataset: any = {}): HTMLElement {
        const el = document.createElement(tagName);

        if (Array.isArray(classNames)) {
            el.classList.add(...classNames);
        } else if (classNames) {
            el.classList.add(classNames);
        }

        for (const attrName in attributes) {
            if (Object.prototype.hasOwnProperty.call(attributes, attrName)) {
                el.setAttribute(attrName, attributes[attrName]);
            }
        }

        for (const key in dataset) {
            if (Object.prototype.hasOwnProperty.call(dataset, key)) {
                el.dataset[key] = dataset[key]
            }
        }

        return el;
    },
    isEditableElement: function (el: HTMLElement | Node) {
        if (!domUtils.isElement(el)) {
            el = el.parentNode as HTMLElement;
        }

        if (!el) {
            return null;
        }

        return (el as HTMLElement).closest(`.editable`)
    },
    isSingleTag: function (tag: HTMLElement): boolean {
        return !!tag.tagName && [
            'AREA',
            'BASE',
            'BR',
            'COL',
            'COMMAND',
            'EMBED',
            'HR',
            'IMG',
            'INPUT',
            'KEYGEN',
            'LINK',
            'META',
            'PARAM',
            'SOURCE',
            'TRACK',
            'WBR',
        ].includes(tag.tagName);
    },
    isLineBreakTag: function (element: HTMLElement) {
        return !!element && !!element.tagName && ['BR', 'WBR'].includes(element.tagName);
    },
    getDeepestNode: function (node: Node, atLast = false): Node {
        const child = atLast ? 'lastChild' : 'firstChild',
            sibling = atLast ? 'previousSibling' : 'nextSibling';

        if (node && node.nodeType === Node.ELEMENT_NODE && node[child]) {
            let nodeChild = node[child] as any;

            if (
                domUtils.isSingleTag(nodeChild as HTMLElement) &&
                !domUtils.isNativeInput(nodeChild) &&
                !domUtils.isLineBreakTag(nodeChild as HTMLElement)
            ) {
                if (nodeChild[sibling]) {
                    nodeChild = nodeChild[sibling];
                } else {
                    return nodeChild.parentNode;
                }
            }

            return this.getDeepestNode(nodeChild, atLast);
        }

        return node;
    },
    isPrintableKey(keyCode: number): boolean {
        return (keyCode > 47 && keyCode < 58) || // number keys
            keyCode === 32 || keyCode === 13 || // Spacebar & return key(s)
            keyCode === 229 || // processing key input for certain languages — Chinese, Japanese, etc.
            (keyCode > 64 && keyCode < 91) || // letter keys
            (keyCode > 95 && keyCode < 112) || // Numpad keys
            (keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
            (keyCode > 218 && keyCode < 223); // [\]' (in order)
    },
    fillHtml: env.ie11below ? "&nbsp;" : "<br/>",
}
export default domUtils;