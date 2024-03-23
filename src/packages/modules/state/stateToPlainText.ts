
import { MEBlockData, MENodeData } from "@/packages/types";
import { tokenizer } from "../content/inlineRenderers/tokenizer";
import { collectReferenceDefinitions } from "./utils";

export default class StateToPlainText {
    private labels: Map<string, { href: string; title: string }>;

    generate(states: MEBlockData[], asFile?: boolean) {
        this.labels = collectReferenceDefinitions(states);
        const plainText = this.convertStatesToPlainText(states);
        return plainText;
    }

    convertStatesToPlainText(states: MEBlockData[]) {
        const result: string[] = [];
        for (const state of states) {
            const plainText = /(code|html-block|math-block|diagram-block|language)$/.test(state.type) ? state.text || '' : (state.children && state.children.length) ? this.convertStatesToPlainText(state.children) : this.stateToPlainText(state);
            result.push(plainText)
        }

        return result.join("\n");
    }

    stateToPlainText(state: MEBlockData) {
        if (!state.text) {
            return ''
        }
        const { labels } = this
        const hasBeginRules = /thematicbreak|paragraph|atxheading/.test(state.type)
        const tokens = tokenizer(state.text, { hasBeginRules, labels });
        return this.tokensToPlainText(tokens)
    }

    tokensToPlainText(tokens: MENodeData[]) {
        const { labels } = this
        const result: string[] = [];
        for (const token of tokens) {
            const plainText = (token.children && token.children.length) ? this.tokensToPlainText(token.children) : token.content || "";
            result.push(plainText)
        }

        return result.join("")
    }

}
