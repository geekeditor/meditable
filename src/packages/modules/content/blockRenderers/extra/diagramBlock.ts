import { MEBlockRendererStaticRenderOptions, MEBlockType } from "@/packages/types";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import MEHtmlBlockRenderer from "../commonMark/htmlBlock";
import renderDiagram from "@/packages/utils/diagram";
import { md5 } from "js-md5";
import { svgToDataURI } from "@/packages/utils/convert";

export default class MEDiagramBlockRenderer extends MEHtmlBlockRenderer {
    static type: MEBlockType = "diagram-block";
    static htmlMap: Map<string, string> = new Map();
    static async staticRender({data, diagramHtmlType}:MEBlockRendererStaticRenderOptions):Promise<string> {
        const code = data.text;
        const type = data.meta?.type;
        const key = md5(`${type}_${data.text}`);
        let innerHTML = "";
        if(this.htmlMap.has(key)) {
            innerHTML = this.htmlMap.get(key);
        } else {
            try {
                innerHTML = await renderDiagram({type, code, theme: 'hand'})
            } catch (error) {
                
            }
        }

        innerHTML = innerHTML && diagramHtmlType === 'img' ? `<img style="max-width: 100%" src="${svgToDataURI(innerHTML)}" />` : innerHTML||''
        return `<${this.tagName} class="${this.type} ${type}">${innerHTML}</${this.tagName}>`
    }

    get preview() {
        return this.nodes.el.firstElementChild as HTMLElement;
    }

    get type() {
        return this.meta.type;
    }

     updateContent() {
        const htmlMap = MEDiagramBlockRenderer.htmlMap;
        const code = this.text;
        const key = md5(`${this.type}_${this.text}`);
        let diagramHtml;
        
        if (code) {
            let renderErr = false;
            if (htmlMap.has(key)) {
                diagramHtml = htmlMap.get(key);
            } else {

                (async () => {
                    try {
                        diagramHtml = this.t("Loading...");
                        this.updatePreview(diagramHtml);
                        const html = await renderDiagram({type: this.type, code, target: this.preview, theme: 'hand'});
                        htmlMap.set(key, html)
    
                        // htmlMap.set(key, diagramHtml);
                    } catch (err) {
                        renderErr = true;
                        diagramHtml = this.t("Invalid Diagram Code");
                    }
                })()
                
            }
        } else {
            diagramHtml = this.t("Empty Diagram")
        }


        this.updatePreview(diagramHtml)
        this.nodes.holder.dataset.role = this.type;
        return true;
    }
}