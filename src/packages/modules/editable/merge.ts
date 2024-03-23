import { MEIndexedNode } from "./dom";
import domUtils from '@/packages/utils/domUtils';
import dtd from '@/packages/utils/dtd';
import env from '@/packages/utils/env';
import MERange from "./range";

const dom = domUtils;

const fonts: { [key: string]: string } = {
    fontcolor: "color",
    backcolor: "background-color",
    fontsize: "font-size",
    fontfamily: "font-family",
    fontborder: "border",
};
const needDelStyle: { [key: string]: number } = {
    fontcolor: 1,
    backcolor: 1,
    fontsize: 1,
    fontfamily: 1,
};
const mergeToParentSpan = (node: MEIndexedNode) => {
    let parentNode;
    while ((parentNode = node.parentNode)) {
        if (
            parentNode.tagName === "SPAN" &&
            dom.getChildCount(
                parentNode,
                (child: any) => !dom.isBookmarkNode(child) && !dom.isBr(child)
            ) === 1
        ) {
            parentNode.style.cssText += node.style.cssText;
            dom.remove(node as Node, true);
            node = parentNode;
        } else {
            break;
        }
    }
};
const mergeChildSpan = (rng: MERange, cmdName: string, value: string) => {
    if (needDelStyle[cmdName]) {
        rng.shrinkBoundarySuitably();
        if (!rng.collapsed && rng.startContainer && rng.startContainer.nodeType === 1) {
            const start = rng.startContainer.childNodes[rng.startOffset];
            if (start && dom.isTagNode(start, "span")) {
                const bookmark = rng.createBookmark();
                const list = dom.getElementsByTagName(start as HTMLElement, "span");
                list.forEach((span: any) => {
                    if (!span.parentNode || dom.isBookmarkNode(span)) return;
                    if (
                        cmdName === "backcolor" &&
                        dom
                            .getComputedStyle(span, "background-color")
                            .toLowerCase() === value
                    ) {
                        return;
                    }

                    dom.removeStyle(span, fonts[cmdName]);

                    if (span.style.cssText.replace(/^\s+$/, "").length === 0) {
                        dom.remove(span, true);
                    }
                });
                rng.moveToBookmark(bookmark);
            }
        }
    }
};
const mergeSiblingSpan = (rng: MERange, cmdName: string, value: string) => {
    const bookmark = rng.createBookmark();
    let common: any;
    if (rng.collapsed) {
        common = (bookmark.start as HTMLSpanElement).parentNode as HTMLElement;
        while (common && dtd.$inline[common.tagName]) {
            common = common.parentNode;
        }
    } else {
        common = dom.getCommonAncestor(bookmark.start as Node, bookmark.end as Node);
    }

    const list = dom.getElementsByTagName(common, "span");
    list.forEach((span: any) => {
        if (!span.parentNode || dom.isBookmarkNode(span as HTMLElement)) return;
        if (/\s*border\s*:\s*none;?\s*/i.test(span.style.cssText)) {
            if (/^\s*border\s*:\s*none;?\s*$/.test(span.style.cssText)) {
                dom.remove(span, true);
            } else {
                dom.removeStyle(span, "border");
            }
            return;
        }

        if (
            /border/i.test(span.style.cssText) &&
            span.parentNode.tagName === "SPAN" &&
            /border/i.test(span.parentNode.style.cssText)
        ) {
            span.style.cssText = span.style.cssText.replace(
                /border[^:]*:[^;]+;?/gi,
                ""
            );
        }

        if (!(cmdName === "fontborder" && value === "none")) {
            let next = span.nextSibling;
            while (next && next.nodeType === 1 && next.tagName === "SPAN") {
                if (dom.isBookmarkNode(next) && cmdName === "fontborder") {
                    span.appendChild(next);
                    next = span.nextSibling;
                    continue;
                }
                if (next.style.cssText === span.style.cssText) {
                    dom.moveChild(next, span);
                    dom.remove(next);
                }
                if (span.nextSibling === next) break;
                next = span.nextSibling;
            }
        }

        mergeToParentSpan(span);

        if (env.ie && env.version > 8) {
            const parentNode: HTMLElement | null = dom.findParent(span, (n: HTMLElement) => {
                return (
                    n.tagName === "SPAN" &&
                    /background-color/.test(n.style.cssText)
                );
            }) as HTMLElement;
            if (parentNode && !/background-color/.test(span.style.cssText)) {
                span.style.backgroundColor = parentNode.style.backgroundColor;
            }
        }
    })
    rng.moveToBookmark(bookmark);
    mergeChildSpan(rng, cmdName, value);
};