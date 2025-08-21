import MEModule from "../module";
import StateToMarkdown from "../state/stateToMarkdown";
import StateToHtml from "../state/stateToHtml";
import { generateId } from "@/packages/utils/utils";
import { MEBlockData, MEBlockInstance } from "@/packages/types";
import { URL_REG } from "@/packages/utils/url";
import { checkCopyType, normalizePastedHTML } from "@/packages/utils/paste";
import HtmlToMarkdown from "../state/htmlToMarkdown";
import MarkdownToState from "../state/markdownToState";
import StateToPlainText from "../state/stateToPlainText";
import { imageUtils } from "../content/utils/image";
import { CODE_BLOCK_REG, HTML_BLOCK_REG, INLINE_UPDATE_REG, MATH_BLOCK_REG, TABLE_BLOCK_REG, convertIfNeeded } from "../content/utils/convert";
import { cutBlocks, copyBlocks } from "./utils";


class MEClipboard extends MEModule {

    private copyType: string = "normal";
    private pasteType: string;
    private copyText: string = "";
    private copyHtml: string = "";

    async prepare(): Promise<boolean> {

        this.bindEvents()
        return true
    }

    private bindEvents() {
        const { event, editable } = this.instance.context;
        const { selection } = editable;

        const copyCutHandler = async (type, event) => {
            event.preventDefault();

            const isCut = event.type === "cut";

            await this.copyHandler(event);

            this.copyType = "normal";

            if (isCut) {
                this.cutHandler();
            }
        };

        const keydownHandler = (type, event) => {
            const { key, metaKey, ctrlKey } = event;

            const { isSameBlock } = selection.cursor;
            if (isSameBlock) {
                return;
            }

            // TODO: Is there any way to identify these key bellow?
            if (/Alt|Option|Control|Meta|Shift|CapsLock|ArrowUp|ArrowDown|ArrowLeft|ArrowRight/.test(key)) {
                return;
            }

            if (metaKey || ctrlKey) {
                return;
            }

            if (key === "Backspace" || key === "Delete") {
                event.preventDefault();
            }

            this.cutHandler();
        };

        event.on("copy", copyCutHandler);
        event.on("cut", copyCutHandler);
        event.on("paste", this.pasteHandler.bind(this));
        event.on("keydown", keydownHandler);
    }

    private getSelectionState() {
        const { editable } = this.instance.context;
        const { selection } = editable;

        const { isSameBlock, anchor, anchorBlock, focus, focusBlock, direction } = selection.cursor;

        if (!anchorBlock) {
            return null;
        }

        // Handle copy/cut in one block.
        if (isSameBlock) {
            const begin = Math.min(anchor.offset, focus.offset);
            const end = Math.max(anchor.offset, focus.offset);

            const text = anchorBlock.renderer.text.substring(begin, end);

            const state = [];

            if (anchorBlock.type === 'code') {
                state.push({
                    ...anchorBlock.renderer.anchor.data,
                    text
                })

            } else {
                state.push({
                    ...anchorBlock.data,
                    text
                })
            }

            return { state, text };

        }

        const startBlock = direction === "forward" ? anchorBlock : focusBlock;
        const endBlock = direction === "forward" ? focusBlock : anchorBlock;
        const startOffset = direction === "forward" ? anchor.offset : focus.offset;
        const endOffset = direction === "forward" ? focus.offset : anchor.offset;
        const copyState = copyBlocks(startBlock, startOffset, endBlock, endOffset);

        return { state: copyState };
    }

    private async getClipboardData() {

        let text = "";
        let html = "";

        const mdGenerator = new StateToMarkdown();
        const htmlGenerator = new StateToHtml({ diagramHtmlType: this.instance.options.diagramHtmlType, staticNodeHtmlRenderer: this.instance.options.staticNodeHtmlRenderer, staticBlockHtmlRenderer: this.instance.options.staticBlockHtmlRenderer });
        const copyState = this.getSelectionState();
        if (!copyState) {
            return { html, text };
        }

        text = copyState.text || mdGenerator.generate(copyState.state);
        html = await htmlGenerator.generate(copyState.state);

        return { html, text };
    }

    private async copyHandler(event) {
        const { copyType } = this;

        switch (copyType) {
            case "normal": {
                const { html, text } = await this.getClipboardData();
                event.clipboardData.setData("text/html", html);
                event.clipboardData.setData("text/plain", text);
                break;
            }

            case "copyHtml": {
                event.clipboardData.setData("text/html", this.copyHtml);
                event.clipboardData.setData("text/plain", this.copyHtml);
                break;
            }

            case "copyPlainText": {
                event.clipboardData.setData("text/html", "");
                event.clipboardData.setData("text/plain", this.copyText);
                break;
            }
        }
    }

    private cutHandler() {
        const { editable, content, event } = this.instance.context;
        const { selection } = editable;

        const {
            isSameBlock,
            anchor,
            anchorBlock,
            focus,
            focusBlock,
            direction,
        } = selection.cursor;

        if (!anchorBlock) {
            return;
        }

        // Handler `cut` event in the same block.
        if (isSameBlock) {
            const { text: oldText } = anchorBlock.renderer;
            const startOffset =
                direction === "forward" ? anchor.offset : focus.offset;
            const endOffset = direction === "forward" ? focus.offset : anchor.offset;

            const text =
                oldText.substring(0, startOffset) + oldText.substring(endOffset);
            anchorBlock.renderer.render({ text, cursor: { anchorBlock, focusBlock, anchor: { offset: startOffset }, focus: { offset: startOffset } } })

            return anchorBlock.renderer.setCursor({ focus: { offset: startOffset } });
        }

        const startBlock = direction === "forward" ? anchorBlock : focusBlock;
        const endBlock = direction === "forward" ? focusBlock : anchorBlock;
        const startOffset = direction === "forward" ? anchor.offset : focus.offset;
        const endOffset = direction === "forward" ? focus.offset : anchor.offset;

        event.trigger("savescence")
        cutBlocks(startBlock, startOffset, endBlock, endOffset);

        if (content.children.length === 0) {
            const newParagraphBlock = content.insertAtEnd();
            newParagraphBlock.renderer.setCursor();
        }
        event.trigger("savescence")
    }

    private async pasteHandler(type, event) {
        event.preventDefault();
        event.stopPropagation();

        const { editable, content } = this.instance.context;
        const { selection } = editable;


        const { isSameBlock, anchorBlock } = selection.cursor;

        if (!isSameBlock) {
            this.cutHandler();

            return this.pasteHandler(type, event);
        }

        if (!anchorBlock) {
            return;
        }

        return this.processDataTransfer(anchorBlock, event.clipboardData)
    }

    private processFiles(files: FileList) {

        let dataToInsert = Array
            .from(files)
            .map((file) => {
                const [fileType, fileSubtype] = file.type.split('/');
                if (fileType === 'image') {
                    const src = imageUtils.createObjectURL(file)
                    const name = file.name || ''
                    return `![${name}](${src})`
                }

                return ''
            }).filter((value) => !!value);
        return dataToInsert.join("\n\n")
    }
    public async processDataTransfer(anchorBlock: MEBlockInstance, dataTransfer: DataTransfer, isDragDrop = false): Promise<void> {

        const {
            bulletListMarker,
            footnote,
            isGitlabCompatibilityEnabled,
            superSubScript,
            trimUnnecessaryCodeBlockEmptyLines,
            frontMatter,
        } = this.instance.options;

        let text = dataTransfer.getData("text/plain");
        let html = dataTransfer.getData("text/html");
        const types = dataTransfer.types;
        const includesFiles = types.includes ? types.includes('Files') : (types as any).contains('Files');
        if (includesFiles) {
            text = this.processFiles(dataTransfer.files);
        }

        // Support pasted URLs from Firefox.
        if (URL_REG.test(text) && !/\s/.test(text) && !html) {
            html = `<a href="${text}">${text}</a>`;
        }

        // Remove crap from HTML such as meta data and styles.
        html = await normalizePastedHTML(html);

        // Process by pasteTransform
        if (this.instance.options.pasteTransform) {
            const transformContent = this.instance.options.pasteTransform({ html, text });
            if (transformContent) {
                html = transformContent.html;
                text = transformContent.text;
            }
        }

        const copyType = checkCopyType(html, text, this.pasteType);

        const { start, end } = anchorBlock.renderer.getCursor();
        const { text: blockText } = anchorBlock.renderer;
        let wrapperBlock = anchorBlock.renderer.anchor;
        const originWrapperBlock = wrapperBlock;

        if (/html|text/.test(copyType)) {
            let markdown =
                copyType === "html" && anchorBlock.type !== "code"
                    ? new HtmlToMarkdown({ bulletListMarker }).generate(html)
                    : text;


            if (anchorBlock.type !== "code" &&
                (/\n\n/.test(markdown) ||
                    isDragDrop ||
                    INLINE_UPDATE_REG.test(markdown) ||
                    CODE_BLOCK_REG.test(markdown) ||
                    MATH_BLOCK_REG.test(markdown) ||
                    TABLE_BLOCK_REG.test(markdown) ||
                    HTML_BLOCK_REG.test(markdown)
                )
            ) {
                if (start.offset !== end.offset) {
                    const newText =
                        blockText.substring(0, start.offset) + blockText.substring(end.offset);
                    anchorBlock.renderer.render({ text: newText });
                }
                // Has multiple paragraphs.
                const states = new MarkdownToState({
                    footnote,
                    isGitlabCompatibilityEnabled,
                    superSubScript,
                    trimUnnecessaryCodeBlockEmptyLines,
                    frontMatter,
                }).generate(markdown).children;

                for (const state of states) {
                    wrapperBlock = wrapperBlock.insertAdjacent("afterend", { data: state });
                }

                // Remove empty paragraph when paste.
                if (originWrapperBlock.type === 'paragraph' && originWrapperBlock.data.text === "") {
                    originWrapperBlock.remove();
                }

                const cursorBlock = wrapperBlock.firstContentInDescendant();
                const offset = cursorBlock.renderer.text.length;
                cursorBlock.renderer.setCursor({ focus: { offset } , scrollToView: true});
            } else {
                if (anchorBlock.type === "language") {
                    markdown = markdown.replace(/\n/g, "");
                } else if (anchorBlock.type === "table-td" || anchorBlock.type === "table-th") {
                    markdown = markdown.replace(/\n/g, "<br/>");
                }

                const newText =
                    blockText.substring(0, start.offset) +
                    markdown +
                    blockText.substring(end.offset);
                let offset = start.offset + markdown.length;
                // Convert if needed
                if (anchorBlock.type === "paragraph" && convertIfNeeded.call(anchorBlock.renderer, newText, offset)) {
                    return
                }

                anchorBlock.renderer.render({ text: newText, cursor: { anchorBlock, focusBlock: anchorBlock, anchor: { offset }, focus: { offset } } })
                offset = Math.min(offset, anchorBlock.renderer.text.length)
                anchorBlock.renderer.setCursor({ focus: { offset } });
                // Update html preview if the out container is `html-block`
                if (
                    /html-block|math-block|diagram-block/.test(
                        originWrapperBlock.type
                    )
                ) {
                    originWrapperBlock.renderer.forceUpdate();
                }
            }
        } else {
            const codeData: MEBlockData = {
                id: generateId(),
                type: "code-block",
                meta: {
                    type: "fenced",
                    lang: "html",
                },
                children: [
                    {
                        id: generateId(),
                        type: 'language',
                        text: 'html'
                    },
                    {
                        id: generateId(),
                        type: 'code',
                        meta: {
                            lang: 'html',
                        },
                        text: text
                    }
                ]
            };
            const offset = text.length;
            const codeBlock = originWrapperBlock.insertAdjacent("afterend", { data: codeData })
            const cursorBlock = codeBlock?.lastContentInDescendant()
            cursorBlock?.renderer.setCursor({ focus: { offset: Math.min(offset, cursorBlock.renderer.text.length) }, scrollToView: true })
        }

    }

    public copyAsMarkdown() {
        let text = "";
        const mdGenerator = new StateToMarkdown();
        const copyState = this.getSelectionState();
        if (copyState) {
            text = copyState.text || mdGenerator.generate(copyState.state);

        }

        this.copyPlainText(text)

    }


    public copyAsHtml() {
        const copyState = this.getSelectionState();
        if (copyState) {
            const htmlGenerator = new StateToHtml({ diagramHtmlType: this.instance.options.diagramHtmlType, staticNodeHtmlRenderer: this.instance.options.staticNodeHtmlRenderer, staticBlockHtmlRenderer: this.instance.options.staticBlockHtmlRenderer });
            htmlGenerator.generate(copyState.state).then((html) => {
                this.copy("copyHtml", "", html);
            });
        }
    }

    public async copyAsPlainText() {
        let text = "";
        const copyState = this.getSelectionState();
        if (copyState) {
            const plainTextGenerator = new StateToPlainText();
            text = plainTextGenerator.generate(copyState.state);
        }

        this.copyPlainText(text);
    }

    public pasteAsPlainText() {
        this.pasteType = "pasteAsPlainText";
        document.execCommand("paste");
        this.pasteType = "normal";
    }

    public copyPlainText(text: string) {
        this.copy("copyPlainText", text)
    }

    public copy(type, text = "", html = "") {
        this.copyText = text;
        this.copyHtml = html;
        this.copyType = type;
        document.execCommand("copy");
    }


}

export default MEClipboard;
