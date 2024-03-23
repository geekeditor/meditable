import { MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import katex from 'katex';
import "katex/dist/contrib/mhchem.min.js";
import "katex/dist/katex.min.css";
import { tex2svgPromise } from "@/packages/utils/math";

export default class MEInlineMath extends MENode {
    static type: MENodeType = "inline_math";
    static mathMap: Map<string, string> = new Map();
    static mathMap2: Map<string, string> = new Map();
    static async staticRender({data}:MENodeRendererStaticRenderOptions) {
        const math = data.content;
        let mathHtml;
        if(this.mathMap2.has(math)) {
            mathHtml = this.mathMap2.get(math)
        } else {
            mathHtml = await tex2svgPromise(math);
            this.mathMap2.set(math, mathHtml)
        }
        return `<span class="${this.type}">${mathHtml}</span>`
    }
    get dirty() {
        const content = this.data?.raw
        if (content !== this.textContent) {
            return true;
        }

        return false;
    }

    get startMarkerNode() {
        return this.nodes.el.firstChild;
    }

    get mathNode() {
        return this.nodes.el.childNodes[1];
    }

    get endMarkerNode() {
        return this.nodes.el.childNodes[2];
    }

    get previewNode() {
        return this.nodes.el.lastElementChild as HTMLElement;
    }
    renderSelf(data: MENodeData) {

        const { marker, content: math, } = data;
        const { start, end } = data.range;
        const dataset = {
            begin: marker.length,
            length: end - marker.length - start - marker.length
        }

        const mathMap = MEInlineMath.mathMap;
        const displayMode = false;
        const key = `${math}`;
        let mathHtml = "";
        let renderErr = false;
        if (mathMap.has(key)) {
            mathHtml = mathMap.get(key);
        } else {
            try {
                mathHtml = katex.renderToString(math, {
                    displayMode,
                });
                mathMap.set(key, mathHtml);
            } catch (err) {
                renderErr = true;
                mathHtml = "Invalid Mathematical Formula";
            }
        }
        

        if (!this.nodes.el || this.nodes.el.childNodes.length !== 4) {
            this.nodes.el = this.nodes.el || this.make("span", [CLASS_NAMES.ME_NODE, CLASS_NAMES.ME_MATH]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}" spellcheck="false"></span><span class="${CLASS_NAMES.ME_MARKER} ${CLASS_NAMES.ME_TEXT}" spellcheck="false"></span><span class="${CLASS_NAMES.ME_MARKER}" spellcheck="false"></span>`
            this.nodes.el.dataset.nodeType = this.type;

            const preview = this.make('span', [CLASS_NAMES.ME_INLINE_RENDER], {
                contenteditable: "false",
                spellcheck: "false",
            }, dataset);
            this.nodes.el.appendChild(preview);

            preview.classList.toggle(CLASS_NAMES.ME_MATH_ERROR, renderErr)
        } else {

            const el = this.previewNode;
            el.classList.toggle(CLASS_NAMES.ME_MATH_ERROR, renderErr)
            for (const key in dataset) {
                if (Object.prototype.hasOwnProperty.call(dataset, key)) {
                    el.dataset[key] = dataset[key]
                }
            }
        }

        if (marker !== this.startMarkerNode.textContent) {
            this.startMarkerNode.textContent = marker
        }
        if (marker !== this.endMarkerNode.textContent) {
            this.endMarkerNode.textContent = marker
        }
        if (math !== this.mathNode.textContent) {
            this.mathNode.textContent = math
        }

        if (mathHtml !== this.previewNode.innerHTML) {
            this.previewNode.innerHTML = mathHtml
        }
    }
}