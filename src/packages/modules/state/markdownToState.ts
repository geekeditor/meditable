import { MEBlockData } from "@/packages/types";
import { Lexer } from "@/packages/utils/marked";
import { generateId } from "@/packages/utils/utils";

const restoreTableEscapeCharacters = (text) => {
    // NOTE: markedjs replaces all escaped "|" ("\|") characters inside a cell with "|".
    //       We have to re-escape the character to not break the table.
    return text.replace(/\|/g, "\\|");
};

export interface IMarkdownToStateOptions {
    footnote: boolean;
    isGitlabCompatibilityEnabled: boolean;
    superSubScript: boolean;
    trimUnnecessaryCodeBlockEmptyLines: boolean;
    frontMatter: boolean;
}

class MarkdownToState {
    private options: IMarkdownToStateOptions;

    constructor(options = {}) {
        this.options = options as IMarkdownToStateOptions;
    }

    generate(markdown: string): MEBlockData {
        return this.convertMarkdownToState(markdown);
    }

    convertMarkdownToState(markdown: string): MEBlockData {
        const states = [];
        const {
            footnote = false,
            isGitlabCompatibilityEnabled = false,
            superSubScript = false,
            trimUnnecessaryCodeBlockEmptyLines = false,
            frontMatter = true,
        } = this.options;

        const tokens = new Lexer({
            disableInline: true,
            footnote,
            isGitlabCompatibilityEnabled,
            superSubScript,
            frontMatter,
        }).lex(markdown);

        let token;
        let state;
        let value;
        const parentList = [states];

        while ((token = tokens.shift())) {
            switch (token.type) {
                case "frontmatter": {
                    const { lang, style, text } = token;
                    value = text.replace(/^\s+/, "").replace(/\s$/, "");

                    state = {
                        id: generateId(),
                        type: "frontmatter",
                        meta: {
                            lang,
                            style,
                        },
                        text: value,
                        children: [
                            {
                                id: generateId(),
                                type: 'code',
                                text: value,
                                meta: {
                                    lang,
                                }
                            }
                        ]
                    };

                    parentList[0].push(state);
                    break;
                }

                case "hr": {
                    state = {
                        id: generateId(),
                        type: "thematic-break",
                        text: token.marker,
                    };

                    parentList[0].push(state);
                    break;
                }

                case "heading": {
                    const { headingStyle, depth, text, marker } = token;
                    const name =
                        headingStyle === "atx" ? "atx-heading" : "setext-heading";
                    const meta: any = {
                        // level: depth,
                    };
                    if (name === "setext-heading") {
                        meta.underline = marker;
                    }
                    value =
                        name === "atx-heading" ? "#".repeat(+depth) + ` ${text}` : text;

                    state = {
                        id: generateId(),
                        type: `${name}${depth}`,
                        meta,
                        text: value,
                    };

                    parentList[0].push(state);
                    break;
                }

                case "code": {
                    const { codeBlockStyle, text, lang: infostring = "" } = token;

                    // GH#697, markedjs#1387
                    const lang = (infostring || "").match(/\S*/)[0];

                    value = text;
                    // Fix: #1265.
                    if (
                        trimUnnecessaryCodeBlockEmptyLines &&
                        (value.endsWith("\n") || value.startsWith("\n"))
                    ) {
                        value = value.replace(/\n+$/, "").replace(/^\n+/, "");
                    }

                    if (/mermaid|flowchart|vega-lite|sequence|plantuml/.test(lang)) {
                        state = {
                            id: generateId(),
                            type: "diagram-block",
                            meta: {
                                type: lang,
                            },
                            text: value,
                            children: [
                                {
                                    id: generateId(),
                                    type: 'code',
                                    text: value,
                                    meta: {
                                        lang: lang === "vega-lite" ? "json" : "yaml",
                                    }
                                }
                            ]
                        };
                    } else {
                        state = {
                            id: generateId(),
                            type: "code-block",
                            meta: {
                                type: codeBlockStyle === "fenced" ? "fenced" : "indented",
                                lang
                            },
                            text: value,
                            children: [
                                {
                                    id: generateId(),
                                    type: 'code',
                                    text: value,
                                    meta: {
                                        lang,
                                    }
                                }
                            ]
                        };
                        if (codeBlockStyle === "fenced") {
                            state.children.unshift({
                                id: generateId(),
                                type: 'language',
                                text: lang,
                                meta: {
                                }
                            })
                        }
                    }
                    parentList[0].push(state);
                    break;
                }

                case "table": {
                    const { header, align, cells } = token;

                    state = {
                        id: generateId(),
                        type: "table",
                        children: [],
                    };

                    state.children.push({
                        id: generateId(),
                        type: "table-thead",
                        children: [
                            {
                                id: generateId(),
                                type: "table-tr",
                                children: header.map((h, i) => ({
                                    id: generateId(),
                                    type: "table-th",
                                    meta: { align: align[i] || "none" },
                                    text: restoreTableEscapeCharacters(h),
                                }))
                            }
                        ],
                    });

                    state.children.push(
                        {
                            id: generateId(),
                            type: "table-tbody",
                            children: [
                                ...cells.map((row) => ({
                                    id: generateId(),
                                    type: "table-tr",
                                    children: row.map((c, i) => ({
                                        id: generateId(),
                                        type: "table-td",
                                        meta: { align: align[i] || "none" },
                                        text: restoreTableEscapeCharacters(c),
                                    })),
                                }))
                            ]
                        }
                    );

                    parentList[0].push(state);
                    break;
                }

                case "html": {
                    const text = token.text.trim();
                    // TODO: Treat html state which only contains one img as paragraph, we maybe add image state in the future.
                    const isSingleImage = /^<img[^<>]+>$/.test(text);
                    if (isSingleImage) {
                        state = {
                            id: generateId(),
                            type: "paragraph",
                            text,
                        };
                        parentList[0].push(state);
                    } else {
                        state = {
                            id: generateId(),
                            type: "html-block",
                            text,
                            children: [{
                                id: generateId(),
                                type: 'code',
                                meta: {
                                    lang: 'html'
                                },
                                text
                            }]
                        };
                        parentList[0].push(state);
                    }
                    break;
                }

                case "multiplemath": {
                    const text = token.text.trim();
                    const { mathStyle = "" } = token;
                    const state = {
                        id: generateId(),
                        type: "math-block",
                        text,
                        meta: { mathStyle },
                        children: [{
                            id: generateId(),
                            type: 'code',
                            meta: {
                                lang: 'latex'
                            },
                            text
                        }]
                    };
                    parentList[0].push(state);
                    break;
                }

                case "text": {
                    value = token.text;
                    while (tokens[0].type === "text") {
                        token = tokens.shift();
                        value += `\n${token.text}`;
                    }
                    state = {
                        id: generateId(),
                        type: "paragraph",
                        text: value,
                    };
                    parentList[0].push(state);
                    break;
                }

                case "paragraph": {
                    value = token.text;
                    state = {
                        id: generateId(),
                        type: "paragraph",
                        text: value,
                    };
                    parentList[0].push(state);
                    break;
                }

                case "blockquote_start": {
                    state = {
                        id: generateId(),
                        type: "block-quote",
                        children: [],
                    };
                    parentList[0].push(state);
                    parentList.unshift(state.children);
                    break;
                }

                case "blockquote_end": {
                    // the blockquote maybe empty.
                    if (parentList[0].length === 0) {
                        state = {
                            id: generateId(),
                            type: "paragraph",
                            text: "",
                        };
                        parentList[0].push(state);
                    }
                    parentList.shift();
                    break;
                }

                case "list_start": {
                    const { listType, start } = token;
                    const { bulletMarkerOrDelimiter, type } = tokens.find(
                        (t) => t.type === "loose_item_start" || t.type === "list_item_start"
                    );
                    const meta: any = {
                        loose: type === "loose_item_start",
                    };
                    if (listType === "order") {
                        meta.start = /^\d+$/.test(start) ? start : 1;
                        meta.delimiter = bulletMarkerOrDelimiter || ".";
                    } else {
                        meta.marker = bulletMarkerOrDelimiter || "-";
                    }

                    state = {
                        id: generateId(),
                        type: `${listType}-list`,
                        meta,
                        children: [],
                    };

                    parentList[0].push(state);
                    parentList.unshift(state.children);
                    break;
                }

                case "list_end": {
                    parentList.shift();
                    break;
                }

                case "loose_item_start":

                case "list_item_start": {
                    const { checked } = token;

                    state = {
                        id: generateId(),
                        type: checked !== undefined ? "task-list-item" : "list-item",
                        children: [],
                    };

                    if (checked !== undefined) {
                        state.meta = { checked };
                    }

                    parentList[0].push(state);
                    parentList.unshift(state.children);
                    break;
                }

                case "list_item_end": {
                    parentList.shift();
                    break;
                }

                case "space": {
                    break;
                }

                default:
                    break;
            }
        }

        return {
            id: 'root',
            type: 'document',
            children: states.length ? states : [{ id: generateId(), type: "paragraph", text: "" }]
        }

    }
}

export default MarkdownToState;
