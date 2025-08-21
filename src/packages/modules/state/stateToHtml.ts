
import { MEBlockData, MEBlockRendererStaticRenderOptions, MEDiagramHtmlType, MENodeData, MENodeRendererStaticRenderOptions } from "@/packages/types";
import { tokenizer } from "../content/inlineRenderers/tokenizer";
import { collectReferenceDefinitions } from "./utils";
import { blockStaticRender } from "../content/blockRenderers";
import { nodeStaticRender } from "../content/inlineRenderers";

export default class StateToHtml {
    private diagramHtmlType: MEDiagramHtmlType | { mermaid?: MEDiagramHtmlType; flowchart?: MEDiagramHtmlType; sequence?: MEDiagramHtmlType; "vega-lite"?: MEDiagramHtmlType; plantuml?: MEDiagramHtmlType } = 'svg';
    private staticNodeHtmlRenderer?: (options: MENodeRendererStaticRenderOptions, renderedHtml: string)=>Promise<string>;
    private staticBlockHtmlRenderer?: (options: MEBlockRendererStaticRenderOptions, renderedHtml: string)=>Promise<string>;
    private labels: Map<string, { href: string; title: string }>;

    constructor(options?: { staticNodeHtmlRenderer?: (options: MENodeRendererStaticRenderOptions, renderedHtml: string)=>Promise<string>, staticBlockHtmlRenderer?: (options: MEBlockRendererStaticRenderOptions, renderedHtml: string)=>Promise<string>, diagramHtmlType?: MEDiagramHtmlType | { mermaid?: MEDiagramHtmlType; flowchart?: MEDiagramHtmlType; sequence?: MEDiagramHtmlType; "vega-lite"?: MEDiagramHtmlType; plantuml?: MEDiagramHtmlType } }) {
        if (options) {
            this.diagramHtmlType = options.diagramHtmlType || 'svg'
            this.staticNodeHtmlRenderer = options.staticNodeHtmlRenderer
            this.staticBlockHtmlRenderer = options.staticBlockHtmlRenderer
        }
    }

    async generate(states: MEBlockData[], asFile?: boolean) {
        this.labels = collectReferenceDefinitions(states);
        const html = await this.convertStatesToHtml(states);
        return html;
    }

    async convertStatesToHtml(states: MEBlockData[]) {
        const result: string[] = [];
        for (const state of states) {
            const innerHTML = /(code|html-block|math-block|diagram-block|language)$/.test(state.type) ? '' : (state.children && state.children.length) ? await this.convertStatesToHtml(state.children) : await this.stateToHtml(state);

            let diagramHtmlType: MEDiagramHtmlType = 'svg'
            if (/diagram-block/.test(state.type)) {
                if (typeof this.diagramHtmlType === 'string') {
                    diagramHtmlType = this.diagramHtmlType
                } else if (this.diagramHtmlType && this.diagramHtmlType[state.meta.type]) {
                    diagramHtmlType = this.diagramHtmlType[state.meta.type]
                }
            }

            let html = await blockStaticRender(state.type, { innerHTML, diagramHtmlType, data: state })
            if(this.staticBlockHtmlRenderer) {
                html = await this.staticBlockHtmlRenderer({ innerHTML, diagramHtmlType, data: state }, html)
            }
            result.push(html)
        }

        return result.join("");
    }

    async stateToHtml(state: MEBlockData) {
        if (!state.text) {
            return ''
        }
        const { labels } = this
        const hasBeginRules = /thematic-break|paragraph|atx-heading/.test(state.type)
        const tokens = tokenizer(state.text, { hasBeginRules, labels });
        return this.tokensToHtml(tokens)
    }

    async tokensToHtml(tokens: MENodeData[]) {
        const { labels } = this
        const result: string[] = [];
        for (const token of tokens) {
            const innerHTML = (token.children && token.children.length) ? await this.tokensToHtml(token.children) : token.content || "";
            let html = await nodeStaticRender(token.type, { innerHTML, data: token, labels })
            if(this.staticNodeHtmlRenderer) {
                html = await this.staticNodeHtmlRenderer({ innerHTML, data: token, labels }, html)
            }
            result.push(html)
        }

        return result.join("")
    }

}
