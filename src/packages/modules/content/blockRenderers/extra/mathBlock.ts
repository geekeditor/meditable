import { MEBlockRendererStaticRenderOptions, MEBlockType } from "@/packages/types";
import katex from 'katex';
import MEHtmlBlockRenderer from "../commonMark/htmlBlock";
import { md5 } from "js-md5";
import { tex2svgPromise } from "@/packages/utils/math";
import { svgToBlob } from "@/packages/utils/convert";
import { copyBlob, saveToDisk } from "@/packages/utils/utils";
import { CLASS_NAMES } from "@/packages/utils/classNames";
export default class MEMathBlockRenderer extends MEHtmlBlockRenderer {
    static type: MEBlockType = "math-block";
    static mathMap: Map<string, string> = new Map();
    static mathMap2: Map<string, string> = new Map();
    static async staticRender({data}:MEBlockRendererStaticRenderOptions):Promise<string> {
        const math = data.text;
        const key = md5(math);
        let mathHtml = "";
        if(this.mathMap2.has(key)) {
            mathHtml = this.mathMap2.get(key);
        } else {
            try {
                mathHtml = await tex2svgPromise(math);
                this.mathMap2.set(math, mathHtml)
            } catch (error) {
                
            }
        }
        return `<${this.tagName} class="${this.type}">${mathHtml||''}</${this.tagName}>`
    }

    get canExportImage() {
        return true;
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

    async getSVG() {
        const math = this.text;
        let svg = "";
        try {
            svg = await tex2svgPromise(math);
        } catch (error) {
            
        }

        return svg;
    }

    async copyImage(event) {
        const svg = await this.getSVG();
        if (svg) {
            svgToBlob(svg).then((blob) => {
                if (blob) {
                    copyBlob(blob).then(() => {
                        event.target.classList.toggle(CLASS_NAMES.ME_TOOL__SUCCESS, true)
                        setTimeout(() => {
                            event.target.classList.toggle(CLASS_NAMES.ME_TOOL__SUCCESS, false)
                        }, 1000)
                    });
;
                }
            });
        }
    }

    async downloadImage() {
        const svg = await this.getSVG();
        if (svg) {
            svgToBlob(svg).then((blob) => {
                if (blob) {
                    saveToDisk("math-" + Date.now() + ".png", blob);
                }
             });
        }
    }
}