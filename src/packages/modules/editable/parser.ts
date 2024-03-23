import dtd from "@/packages/utils/dtd";
import domUtils from '@/packages/utils/domUtils'


export interface MEVNodeInstance {
    type: () => string;
    data: () => string;
    tagName: () => string;
    parentNode: () => MEVNodeInstance | null;
    attrs: () => { [key: string]: string };
    setAttrs: (attrs:{ [key: string]: string }) => void;
    children: () => MEVNodeInstance[];
    setTagName: (tagName: string) => void;
    setParentNode: (parentNode: MEVNodeInstance | null) => void;
    outerHTML: (formatter: boolean) => string;
    innerHTML: (htmlStr?: string) => string | MEVNodeInstance;
    innerText: (textStr?: string, noTrans?: boolean) => string | MEVNodeInstance;
    firstChild: () => MEVNodeInstance | undefined;
    lastChild: () => MEVNodeInstance | undefined;
    previousSibling: () => MEVNodeInstance | undefined;
    nextSibling: () => MEVNodeInstance | undefined;
    replaceChild: (target: MEVNodeInstance, source: MEVNodeInstance) => MEVNodeInstance | undefined;
    appendChild: (node: MEVNodeInstance) => MEVNodeInstance | undefined;
    removeChild: (node: MEVNodeInstance, keepChildren?: boolean) => MEVNodeInstance | undefined;
    remove: () => void;
    insertBefore: (target: MEVNodeInstance, source: MEVNodeInstance) => MEVNodeInstance | undefined;
    insertAfter: (target: MEVNodeInstance, source: MEVNodeInstance) => MEVNodeInstance | undefined;
    getNodeById: (id: string) => MEVNodeInstance | undefined;
    attr: (attrName: any, attrValue?: string) => string | undefined;
    removeAttr: (attrName?: string) => void;
    css: (name: any, val?: string) => string | undefined;
    applyStyle: (nativeNode: HTMLElement) => void;
    traversal: (fn: Function) => void;
}

export interface MEVNodeInstanceOptions {
    type: string;
    data?: string;
    tagName?: string;
    parentNode?: MEVNodeInstance;
    attrs?: { [key: string]: string };
    children?: MEVNodeInstance[];
}

function isObject(obj: any) {
    return Object.prototype.toString.apply(obj) === '[object Object]'
}

export function unhtml(str: string, reg?: RegExp) {
    return str ?
        str.replace(
            reg ||
            /[&<">'](?:(amp|lt|ldquo|rdquo|quot|gt|#39|nbsp|middot|#\d+);)?/g,
            function (a, b) {
                if (b) {
                    return a;
                } else {
                    return ({
                        "<": "&lt;",
                        "&": "&amp;",
                        '"': "&quot;",
                        "“": "&ldquo;",
                        "”": "&rdquo;",
                        ">": "&gt;",
                        "'": "&#39;",
                        "·": "&middot;",
                    } as any)[a];
                }
            }
        ) :
        "";
}
export function html(str: string) {
    return str ?
        str.replace(/&((g|l|quo|ldquo|rdquo)t|amp|#39|nbsp);/g, function (m) {
            return ({
                "&lt;": "<",
                "&amp;": "&",
                "&quot;": '"',
                "&ldquo;": "“",
                "&rdquo;": "”",
                "&gt;": ">",
                "&#39;": "'",
                "&nbsp;": " ",
            } as any)[m];
        }) :
        "";
}

const notTransAttrs: any = {
    href: 1,
    src: 1,
    _src: 1,
    _href: 1,
    cdata_data: 1,
};
const notTransTagName: any = {
    style: 1,
    script: 1,
};
const INDENT_CHAR = "    ",
    BREAK_CHAR = "\n";
function insertLine(arr: string[], current: number, begin?: boolean) {
    arr.push(BREAK_CHAR);
    return current + (begin ? 1 : -1);
}
function insertIndent(arr: string[], current: number) {
    for (let i = 0; i < current; i++) {
        arr.push(INDENT_CHAR);
    }
}
function insertText(node: MEVNodeInstance, arr: string[]) {
    const parentNode = node.parentNode()
    if (parentNode && parentNode.tagName() === "pre") {
        arr.push(node.data());
    } else {
        arr.push(
            parentNode && notTransTagName[parentNode.tagName()] ?
                html(node.data()) :
                node.data().replace(/[ ]{2}/g, " &nbsp;")
        );
    }
}
function insertElement(node: MEVNodeInstance, arr: string[], formatter: boolean, current: number) {
    let attrhtml,
        attrs = node.attrs();
    if (attrs) {
        attrhtml = [];
        for (const a in attrs) {
            if (attrs.hasOwnProperty(a)) {
                const value = attrs[a];
                attrhtml.push(
                    a +
                    (value !== undefined ?
                        '="' +
                        (notTransAttrs[a] ?
                            html(value).replace(/["]/g, () => "&quot;") :
                            unhtml(value)) +
                        '"' :
                        "")
                );
            }
        }
        attrhtml = attrhtml.join(" ");
    }
    arr.push(
        "<" +
        node.tagName() +
        (attrhtml ? " " + attrhtml : "") +
        (dtd.$empty[node.tagName()] ? "/" : "") +
        ">"
    );

    const formatterByInsertLine =
        formatter &&
        !dtd.$inlineWithA[node.tagName()] &&
        node.tagName() !== "pre" &&
        node.children().length;
    if (formatterByInsertLine) {
        current = insertLine(arr, current, true);
        insertIndent(arr, current);
    }

    const children = node.children()
    for (let i = 0, ci;
        (ci = children[i++]);) {
        if (
            formatter &&
            ci.type() === "element" &&
            !dtd.$inlineWithA[ci.tagName()] &&
            i > 1
        ) {
            insertLine(arr, current);
            insertIndent(arr, current);
        }
        nodeToHtml(ci, arr, formatter, current);
    }

    if (!dtd.$empty[node.tagName()]) {
        if (formatterByInsertLine) {
            current = insertLine(arr, current, true);
            insertIndent(arr, current);
        }
        arr.push("</" + node.tagName() + ">");
    }
}
function insertComment(node: MEVNodeInstance, arr: string[]) {
    arr.push("<!--" + node.data() + "-->");
}
function getNodesById(root: MEVNodeInstance, id: string): MEVNodeInstance | undefined {
    if (root.type() === "element" && root.attr("id") === id) {
        return root;
    }

    let node;
    const children = root.children();
    for (let i = 0, ci;
        (ci = children[i++]);) {
        if ((node = getNodesById(ci, id))) {
            return node;
        }
    }
}
function getNodesByTagName(root: MEVNodeInstance, tagName: string, arr: MEVNodeInstance[]) {
    if (root.type() === "element" && root.tagName() === tagName) {
        arr.push(root);
    }

    const children = root.children();
    for (let i = 0, ci;
        (ci = children[i++]);) {
        getNodesByTagName(ci, tagName, arr);
    }
}
function nodeTraversal(root: MEVNodeInstance, fn: Function) {
    const children = root.children();
    if (children.length) {
        for (let i = 0, ci;
            (ci = children[i]);) {
            nodeTraversal(ci, fn);

            const parentNode = ci.parentNode();
            if (parentNode) {
                if (ci.children().length) {
                    fn(ci);
                }

                if (ci.parentNode()) i++;
            }
        }
    } else {
        fn(root);
    }
}
function nodeToHtml(node: MEVNodeInstance, arr: string[], formatter: boolean, current: number) {
    switch (node.type()) {
        case "root":
            const children = node.children();
            for (let i = 0, ci;
                (ci = children[i++]);) {
                if (
                    formatter &&
                    ci.type() === "element" &&
                    !dtd.$inlineWithA[ci.tagName()] &&
                    i > 1
                ) {
                    insertLine(arr, current, true);
                    insertIndent(arr, current);
                }
                nodeToHtml(ci, arr, formatter, current);
            }
            break;
        case "element":
            insertElement(node, arr, formatter, current);
            break;
        case "text":
            insertText(node, arr);
            break;
        case "comment":
            insertComment(node, arr);
            break;
    }
    return arr;
}

export class MEVNode implements MEVNodeInstance {
    private _type!: string;
    private _data!: string | undefined;
    private _tagName!: string | undefined;
    private _parentNode!: MEVNodeInstance | null;
    private _attrs!: { [key: string]: string };
    private _children!: MEVNodeInstance[];

    static createElement(htmlOrTag: string) {
        if (/[<>]/.test(htmlOrTag)) {
            return HTMLParser(htmlOrTag).children()[0];
        } else {
            return new MEVNode({
                type: "element",
                children: [],
                tagName: htmlOrTag,
            });
        }
    }

    static createText(data: string, noTrans?: boolean) {
        return new MEVNode({
            type: "text",
            data: noTrans ? data : unhtml(data || ""),
        });
    }

    static createComment(data: string) {
        return new MEVNode({
            type: "comment",
            data: data,
        });
    }


    constructor(obj: MEVNodeInstanceOptions) {
        this._type = obj.type;
        this._data = obj.data;
        this._tagName = obj.tagName;
        this._parentNode = obj.parentNode || null;
        this._attrs = obj.attrs || {};
        this._children = obj.children || [];
    }

    type() {
        return this._type;
    }
    data() {
        if (this._type === "element") return "";
        return this._data || '';
    }
    tagName() {
        return this._tagName || '';
    }
    parentNode() {
        return this._parentNode;
    }
    attrs() {
        return this._attrs;
    }
    setAttrs(attrs:{[key:string]:string}) {
        this._attrs = attrs;
    }
    children() {
        return this._children;
    }
    setTagName(tagName: string) {
        this._tagName = tagName;
    }
    setParentNode(parentNode: MEVNodeInstance | null) {
        this._parentNode = parentNode;
    }

    outerHTML(formatter?: boolean) {
        let arr: string[] = [];
        nodeToHtml(this, arr, formatter || false, 0);
        return arr.join("");
    }

    innerHTML(htmlStr?: string) {
        if (this.type() !== "element" || dtd.$empty[this.tagName()]) {
            return this;
        }

        if (typeof htmlStr === 'string') {
            this._children.forEach((child) => {
                child.setParentNode(null);
            });
            this._children = [];
            const root = HTMLParser(htmlStr);
            root.children().forEach((child) => {
                this._children.push(child);
                child.setParentNode(this);
            });
            return this;
        }

        const root = new MEVNode({ type: "root", children: this.children() });
        return root.outerHTML();
    }

    innerText(textStr?: string, noTrans?: boolean) {
        if (this.type() !== "element" || dtd.$empty[this.tagName()]) {
            return this;
        }

        if (textStr) {
            this.children().forEach((child) => {
                child.setParentNode(null);
            });
            this._children = [];
            this.appendChild(MEVNode.createText(textStr, noTrans));
            return this;
        }

        return this.outerHTML().replace(/<[^>]+>/g, "");
    }



    firstChild() {
        return this._children[0];
    }

    lastChild() {
        return this._children[this.children.length - 1];
    }

    previousSibling() {
        const parentNode = this._parentNode;
        if (parentNode) {
            const children = parentNode.children();
            for (let i = 0, ci;
                (ci = children[i]); i++) {
                if (ci === this && i !== 0) {
                    return children[i - 1];
                }
            }
        }
    }

    nextSibling() {
        const parentNode = this._parentNode;
        if (parentNode) {
            const children = parentNode.children();
            for (let i = 0, ci;
                (ci = children[i++]);) {
                if (ci === this) {
                    return children[i];
                }
            }
        }
    }

    replaceChild(target: MEVNodeInstance, source: MEVNodeInstance) {
        target.remove();
        for (let i = 0, ci;
            (ci = this._children[i]); i++) {
            if (ci === source) {
                this._children.splice(i, 1, target);
                source.setParentNode(null);
                target.setParentNode(this);
                return target;
            }

        }
    }

    appendChild(node: MEVNodeInstance) {
        if (
            this.type() === "root" ||
            (this.type() === "element" && !dtd.$empty[this.tagName()])
        ) {
            const parentNode = node.parentNode();
            if (parentNode) {
                parentNode.removeChild(node);
            }

            // for(let i = 0, ci; (ci = this.children[i]); i ++) {
            //     if(ci === node) {
            //         this.children.splice(i, 1);
            //         break;
            //     }
            // }

            this._children.push(node);
            node.setParentNode(this);
            return node;
        }
    }

    removeChild(node: MEVNodeInstance, keepChildren?: boolean) {
        const children = this._children;
        for (let i = 0, ci;
            (ci = children[i]); i++) {
            if (ci === node) {
                children.splice(i, 1);
                ci.setParentNode(null);
                if (keepChildren && ci.children().length) {
                    for (let j = 0, cj;
                        (cj = ci.children()[j]); j++) {
                        children.splice(i + j, 0, cj);
                        cj.setParentNode(this);
                    }
                }
                return ci;
            }
        }
    }

    remove() {
        if (this._parentNode) {
            this._parentNode.removeChild(this);
        }
    }

    insertBefore(target: MEVNodeInstance, source: MEVNodeInstance) {
        target.remove();
        for (let i = 0, ci;
            (ci = this._children[i]); i++) {
            if (ci === source) {
                this._children.splice(i, 0, target);
                target.setParentNode(this);
                return target;
            }
        }
    }

    insertAfter(target: MEVNodeInstance, source: MEVNodeInstance) {
        target.remove();
        for (let i = 0, ci;
            (ci = this._children[i]); i++) {
            if (ci === source) {
                this._children.splice(i + 1, 0, target);
                target.setParentNode(this);
                return target;
            }
        }
    }

    getNodeById(id: string) {
        let node;
        for (let i = 0, ci;
            (ci = this._children[i++]);) {
            if ((node = getNodesById(ci, id))) {
                return node;
            }
        }
    }

    getNodesByTagNames(tagNames: string) {
        const tagNamesArr = tagNames.trim().replace(/[ ]{2,}/g, " ")
            .split(" ");
        const arr: MEVNodeInstance[] = [];
        tagNamesArr.forEach((tagName) => {
            for (let i = 0, ci;
                (ci = this._children[i++]);) {
                getNodesByTagName(ci, tagName, arr);
            }
        });
        return arr;
    }

    index() {
        const parentNode = this._parentNode;
        if (parentNode) {
            const children = parentNode.children()
            for (let i = 0, ci;
                (ci = children[i]); i++) {
                if (ci === this) {
                    return i;
                }
            }
        }

        return -1;
    }

    attr(attrName: any, attrValue?: string | null) {

        if (
            (typeof attrName === "string" && attrValue !== undefined) ||
            isObject(attrName)
        ) {
            this._attrs = this._attrs || {};
            if (isObject(attrName)) {
                for (const key in attrName) {
                    if (attrName.hasOwnProperty(key)) {
                        const value = attrName[key];
                        if (value) {
                            this._attrs[key.toLowerCase()] = value;
                        }
                    }
                }
            } else if(typeof attrValue === "string") {
                this._attrs[attrName.toLowerCase()] = attrValue;
            } else {
                delete this._attrs[attrName.toLowerCase()];
            }
        } else if (typeof attrName === "string") {
            return this._attrs && this._attrs[attrName.toLowerCase()];
        }
    }

    removeAttr(attrName?: string) {
        if (this._attrs && attrName) {
            delete this._attrs[attrName];
        }

    }

    css(name: any, val?: string) {
        let cssText = this.attr("style");
        if (!cssText) {
            cssText = "";
        }

        const setStyleProperty = (name: string, val: string) => {
            const reg = new RegExp("(^|;)\\s*" + name + ":([^;]+;?)", "gi");
            if (cssText) {
                cssText = cssText.replace(reg, "$1");
                if (val) {
                    cssText = name + ":" + unhtml(val) + ";" + cssText;
                }
            }
        }

        if (
            (typeof name === "string" && val !== undefined) ||
            isObject(name)
        ) {
            if (isObject(name)) {
                for (const key in name) {
                    if (name.hasOwnProperty(key)) {
                        const val = name[key];
                        setStyleProperty(key, val);
                    }
                }
            } else if (val) {
                setStyleProperty(name, val);
            }
            this.attr("style", cssText);
        } else if (typeof name === "string" && cssText) {
            const reg = new RegExp("(^|;)\\s*" + name + ":([^;]+)", "i"),
                match = cssText.match(reg);
            if (match && match[0]) {
                return match[2];
            }
        }
    }

    applyStyle(nativMEVNode: HTMLElement) {
        if (!nativMEVNode) return;
        const style = this.attr("style");
        if (style) {
            nativMEVNode.setAttribute(
                "style",
                notTransAttrs["style"] ?
                    html(style.replace(/["]/g, () => "&quot;")) :
                    unhtml(style)
            )
        }

    }

    traversal(fn: Function) {
        if (this.children().length) {
            nodeTraversal(this, fn);
        }
        return this;
    }
}

//todo 原来的方式  [^"'<>\/] 有\/就不能配对上 <TD vAlign=top background=../AAA.JPG> 这样的标签了
//先去掉了，加上的原因忘了，这里先记录
const re_tag = new RegExp(
    "<(?:(?:\\/([^>]+)>)|(?:!--([\\S|\\s]*?)-->)|(?:([^\\s\\/<>]+)\\s*((?:(?:\"[^\"]*\")|(?:'[^']*')|[^\"'<>])*)\\/?>))",
    "g"
),
    re_attr = /([\w\-:.]+)(?:(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^\s>]+)))|(?=\s|$))/g;

//ie下取得的html可能会有\n存在，要去掉，在处理replace(/[\t\r\n]*/g,'');代码高亮的\n不能去除
const allowEmptyTags: any = {
    b: 1,
    code: 1,
    i: 1,
    u: 1,
    strike: 1,
    s: 1,
    tt: 1,
    strong: 1,
    q: 1,
    samp: 1,
    em: 1,
    span: 1,
    sub: 1,
    img: 1,
    sup: 1,
    font: 1,
    big: 1,
    small: 1,
    iframe: 1,
    a: 1,
    br: 1,
    pre: 1,
};
const needParentNode: any = {
    td: "tr",
    tr: ["tbody", "thead", "tfoot"],
    tbody: "table",
    th: "tr",
    thead: "table",
    tfoot: "table",
    caption: "table",
    li: ["ul", "ol"],
    dt: "dl",
    dd: "dl",
    option: "select",
}
const needChild: any = {
    ol: "li",
    ul: "li",
}

function clearWhitespace(htmlStr: string, removeBlank?: boolean) {
    htmlStr = htmlStr.replace(new RegExp(domUtils.fillChar, "g"), "");
    if (removeBlank) {
        htmlStr = htmlStr.replace(
            new RegExp(
                "[\\r\\t\\n " +
                "]*<\\/?(\\w+)\\s*(?:[^>]*)>[\\r\\t\\n " +
                "]*",
                "g"
            ),
            function (a, b) {
                //br暂时单独处理
                if (b && allowEmptyTags[b.toLowerCase()]) {
                    return a.replace(/(^[\n\r]+)|([\n\r]+$)/g, "");
                }
                return a
                    .replace(new RegExp("^[\\r\\t\\n ]+"), "")
                    .replace(
                        new RegExp("[\\r\\t\\n ]+$"),
                        ""
                    );
            }
        );
    }
    return htmlStr;
}
function appendText(parentNode: MEVNodeInstance, data: string) {
    if (needChild[parentNode.tagName()]) {
        const tmpNode = MEVNode.createElement(needChild[parentNode.tagName()]);
        parentNode.appendChild(tmpNode);
        tmpNode.appendChild(MEVNode.createText(data));
        parentNode = tmpNode;
    } else {
        parentNode.appendChild(MEVNode.createText(data));
    }
}
function appendElement(parentNode: MEVNodeInstance, tagName: string, htmlAttr?: string) {
    const needParentTag = needParentNode[tagName];
    if (needParentTag) {
        let tmpParent: MEVNodeInstance | null = parentNode,
            hasParent;
        while (tmpParent && tmpParent.type() !== "root") {
            const tagName = tmpParent.tagName();
            if (
                Array.isArray(needParentTag) ?
                    needParentTag.findIndex((tag) => tagName === tag) !== -1 :
                    needParentTag === tagName
            ) {
                parentNode = tmpParent;
                hasParent = true;
                break;
            }
            tmpParent = tmpParent.parentNode();
        }
        if (!hasParent) {
            parentNode = appendElement(
                parentNode,
                Array.isArray(needParentTag) ? needParentTag[0] : needParentTag
            );
        }
    }

    if (dtd.$nonBodyContent[tagName]) {
        return parentNode;
    }

    const elem = new MEVNode({
        type: "element",
        tagName: tagName.toLowerCase(),
        children: [],
    });
    if (htmlAttr) {
        const attrs: any = {};
        let match;
        while ((match = re_attr.exec(htmlAttr))) {
            const prop = match[1].toLowerCase();
            attrs[prop] = notTransAttrs[prop] ?
                match[2] || match[3] || match[4] :
                unhtml(match[2] || match[3] || match[4]);
        }
        elem.setAttrs(attrs);
    }

    parentNode.appendChild(elem);
    return dtd.$empty[tagName] || (dtd.$svg[tagName] && htmlAttr && /.*\//g.test(htmlAttr)) ?
        parentNode :
        elem;
}
function appendComment(parentNode: MEVNodeInstance, data: string) {
    parentNode.appendChild(MEVNode.createComment(data));
}
function HTMLParser(htmlStr: string, removeBlank?: boolean) {
    const root = new MEVNode({
        type: "root",
        children: [],
    });

    let match,
        currentIndex = 0,
        lastIndex = 0,
        currentParent: MEVNodeInstance = root;

    htmlStr = clearWhitespace(htmlStr, removeBlank);
    while ((match = re_tag.exec(htmlStr))) {
        currentIndex = match.index;
        try {
            if (currentIndex > lastIndex) {
                appendText(currentParent, htmlStr.slice(lastIndex, currentIndex));
            }
            if (match[3]) {
                if (dtd.$cdata[currentParent.tagName()]) {
                    appendText(currentParent, match[0]);
                } else {
                    currentParent = appendElement(
                        currentParent,
                        match[3].toLowerCase(),
                        match[4]
                    );
                }
            } else if (match[1]) {
                if (currentParent.type() !== "root") {
                    if (dtd.$cdata[currentParent.tagName()] && !dtd.$cdata[match[1]]) {
                        appendText(currentParent, match[0]);
                    } else {
                        let tmpParent = currentParent;
                        while (
                            currentParent.type() === "element" &&
                            currentParent.tagName() !== match[1].toLowerCase()
                        ) {
                            currentParent = currentParent.parentNode() as MEVNodeInstance;
                            if (currentParent.type() === "root") {
                                currentParent = tmpParent;
                                throw "break";
                            }
                        }
                        currentParent = currentParent.parentNode() as MEVNodeInstance;
                    }
                }
            } else if (match[2]) {
                appendComment(currentParent, match[2]);
            }
        } catch (error) {
            console.log(error);
        }

        lastIndex = re_tag.lastIndex;
    }

    if (lastIndex < htmlStr.length) {
        appendText(currentParent, htmlStr.slice(lastIndex));
    }

    return root;
}

export default HTMLParser;