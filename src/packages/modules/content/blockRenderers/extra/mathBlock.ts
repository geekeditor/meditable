import { MEBlockRendererStaticRenderOptions, MEBlockType } from "@/packages/types";
import katex from 'katex';
import MEHtmlBlockRenderer from "../commonMark/htmlBlock";
import { md5 } from "js-md5";
import { tex2svgPromise } from "@/packages/utils/math";
export default class MEMathBlockRenderer extends MEHtmlBlockRenderer {
    static type: MEBlockType = "math-block";
    static mathMap: Map<string, string> = new Map();
    static mathMap2: Map<string, string> = new Map();
    static async staticRender({data}:MEBlockRendererStaticRenderOptions):Promise<string> {
        const math = data.text;
        const key = md5(math);
        let mathHtml = "";
        if(this.mathMap2.has(key)) {
            mathHtml = this.mathMap.get(key);
        } else {
            try {
                mathHtml = await tex2svgPromise(math);
                this.mathMap2.set(math, mathHtml)
            } catch (error) {
                
            }
        }
        return `<${this.tagName} class="${this.type}">${mathHtml||''}</${this.tagName}>`
    }

    get preview() {
        return this.nodes.el.firstElementChild;
    }

    updateContent() {
        const mathMap = MEMathBlockRenderer.mathMap;
        const math = this.text;
        const key = md5(math);
        let mathHtml;
        let renderErr = false;
        if (mathMap.has(key)) {
            mathHtml = mathMap.get(key);
        } else {
            try {
                mathHtml = katex.renderToString(math, {
                    displayMode: false,
                });
                mathMap.set(key, mathHtml);
            } catch (err) {
                renderErr = true;
                mathHtml = "Invalid Mathematical Formula";
            }
        }

        this.updatePreview(mathHtml)
        return true;
    }
}