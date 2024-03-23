
import { MEBlockData, MEDiagramHtmlType, MENodeData } from "@/packages/types";
import { tokenizer } from "../content/inlineRenderers/tokenizer";
import { collectReferenceDefinitions } from "./utils";
import { blockStaticRender } from "../content/blockRenderers";
import { nodeStaticRender } from "../content/inlineRenderers";

export default class StateToHtml {
    private diagramHtmlType: MEDiagramHtmlType | { mermaid?: MEDiagramHtmlType; flowchart?: MEDiagramHtmlType; sequence?: MEDiagramHtmlType; "vega-lite"?: MEDiagramHtmlType; plantuml?: MEDiagramHtmlType } = 'svg';
    private labels: Map<string, { href: string; title: string }>;

    constructor(options?: { diagramHtmlType?: MEDiagramHtmlType | { mermaid?: MEDiagramHtmlType; flowchart?: MEDiagramHtmlType; sequence?: MEDiagramHtmlType; "vega-lite"?: MEDiagramHtmlType; plantuml?: MEDiagramHtmlType } }) {
        if (options) {
            this.diagramHtmlType = options.diagramHtmlType || 'svg'
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

            const html = await blockStaticRender(state.type, { innerHTML, diagramHtmlType, data: state })
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
            const html = await nodeStaticRender(token.type, { innerHTML, data: token, labels })
            result.push(html)
        }

        return result.join("")
    }

}
