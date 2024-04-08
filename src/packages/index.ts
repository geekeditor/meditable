import { MEContentType, MEContext, MECursorState, MEInstance, MEOptions, MEPluginConstructable, MEPluginOptions, MESearchOptions } from "./types";
import EventListeners from "./utils/listeners";
import Modules from "./modules";
import HTMLParser from "./modules/editable/parser";
import MarkdownToState from "./modules/state/markdownToState";
import StateToMarkdown from "./modules/state/stateToMarkdown";
import HtmlToMarkdown from "./modules/state/htmlToMarkdown";
import StateToHtml from "./modules/state/stateToHtml";
import StateToPlainText from "./modules/state/stateToPlainText";
import { tokenizer } from "./modules/content/inlineRenderers/tokenizer";
import { flattenToOutline, filterOutline} from "./utils/outline";
import MEPlugin from "./modules/plugin";


export { HTMLParser, MarkdownToState, StateToMarkdown, HtmlToMarkdown, StateToHtml, StateToPlainText, tokenizer, filterOutline, flattenToOutline }


export const DEFAULT_OPTIONS: MEOptions = {
    // Whether to trim the beginning and ending empty line in code block when open markdown.
    trimUnnecessaryCodeBlockEmptyLines: false,
    preferLooseListItem: true,
    autoPairBracket: true,
    autoPairMarkdownSyntax: true,
    autoPairQuote: true,
    bulletListMarker: "-",
    orderListDelimiter: ".",
    tabSize: 4,
    // bullet/list marker width + listIndentation, tab or Daring Fireball Markdown (4 spaces) --> list indentation
    listIndentation: 1,
    frontMatter: true, // Whether to support frontmatter.
    frontmatterType: "-",
    sequenceTheme: "hand", // hand or simple
    mermaidTheme: "default", // dark / forest / default
    vegaTheme: "latimes", // excel / ggplot2 / quartz / vox / fivethirtyeight / dark / latimes
    hideQuickInsertHint: false,
    hideLinkPopup: false,
    autoCheck: false,
    // Whether we should set spellcheck attribute on our container to highlight misspelled words.
    // NOTE: The browser is not able to correct misspelled words words without a custom
    // implementation like in MarkText.
    spellcheckEnabled: false,

    // Markdown extensions
    superSubScript: true,
    footnote: true,
    isGitlabCompatibilityEnabled: false,
    // Move checked task list item to the end of task list.
    autoMoveCheckedToEnd: true,
};

const apis = {
    layout: ["toggleFocusMode"],
    i18n: ["addLocales", "t", "changeLanguage"],
    state: ["setContent", "getContent", "getWordCount"],
    search: ["search", "replace", "searchJumpNext", "searchJumpPrev", "searchJumpIndex", "searchClear"],
    stack: ["undo", "redo", "canRedo", "canUndo"],
    clipboard: ["copyAsMarkdown", "copyAsHtml", "copyAsPlainText", "pasteAsPlainText"],
    event: ["on", "off", "trigger"]
};
class MEditable implements MEInstance {

    static defaultOptions: MEOptions = DEFAULT_OPTIONS;
    static instancesSet: Set<MEInstance> = new Set();
    static configDefaultOptions(options: MEOptions) {
        this.defaultOptions = { ...DEFAULT_OPTIONS, ...this.defaultOptions, ...options };
        if(typeof options.focusMode !== "undefined") {
            for(let instance of this.instancesSet) {
                instance.toggleFocusMode(options.focusMode)
            }
        }
    }
    static use(Plugin: MEPluginConstructable, options?: MEPluginOptions) {
        MEPlugin.use(Plugin, options);
    }

    readonly context: MEContext = {} as any;
    readonly eventListeners = new EventListeners();
    readonly container: HTMLElement;

    get selection() { return this.context.editable.selection }
    get actived() { return this.context.editable.actived }
    set actived(actived: boolean) { this.context.editable.actived = actived }
    public addLocales(resources: { [lang: string]: { [key: string]: string } }, lang?: string) {}
    public t(key: string) {return key}
    public changeLanguage(lang: string) {}
    public getCursor() { return this.context.editable.selection.getCursor() }
    public setCursor(cursor: MECursorState) { this.context.editable.selection.setCursor(cursor) }
    public scrollBlockIntoView(blockPathOrId: number[] | string) {
        const block = this.context.content.queryBlock(blockPathOrId);
        if(block) {
            block.renderer.nodes.el.scrollIntoView();
        }
    }
    public toggleFocusMode(focusMode: boolean) {}
    public setContent(text: string, type: MEContentType = "md") { }
    public getContent(type?: MEContentType) { return Promise.resolve('') }
    public getWordCount() { return 0 }
    public search(options: MESearchOptions) { return { list: [], index: 0 } }
    public replace(options: MESearchOptions) { return { list: [], index: 0 } }
    public searchJumpNext() { return { list: [], index: 0 } }
    public searchJumpPrev() { return { list: [], index: 0 } }
    public searchJumpIndex() { return { list: [], index: 0 } }
    public searchClear() { return { list: [], index: 0 } }
    public undo() { }
    public redo() { }
    public canUndo() { return false }
    public canRedo() { return false }
    public copyAsMarkdown() { }
    public copyAsHtml() { }
    public copyAsPlainText() { }
    public pasteAsPlainText() { }
    public on(types: string | string[], handler: Function) { }
    public off(types: string | string[], handler: Function) { }
    public trigger(types: string | string[], ...args: any[]) { }

    readonly options: MEOptions;
    constructor(options: MEOptions) {
        this.options = { ...MEditable.defaultOptions, ...options };
        this.container = options.container || document.createElement('div');
        // Init
        Object.entries(Modules).forEach(([moduleName, moduleClass]) => {
            this.context[moduleName] = new moduleClass(this)
        });

        MEditable.instancesSet.add(this)

    }

    setOption(key: string, value: any) {
        this.options[key] = value;
    }
    
    getOption(key: string) {
        return this.options[key];
    }

    // Call modules to prepare
    async prepare() {
        await Object.keys(this.context).reduce(
            (promise, module) => promise.then(async () => {
                try {
                    await this.context[module].prepare();
                } catch (e) {
                }
            }),
            Promise.resolve()
        )

        this.exportAPI()
    }

    private exportAPI() {
        Object.keys(apis).forEach((key) => {
            for (const api of apis[key]) {
                this[api] = this.context[key][api].bind(this.context[key]);
            }
        });
    }

    destroy() {
        MEditable.instancesSet.delete(this);
        Object.keys(apis).forEach((key) => {
            for (const api of apis[key]) {
                this[api] = ()=>{
                    throw new Error("[MEditable] MEditable instance is destroyed")
                };
            }
        });
        Object.keys(this.context).reverse().forEach((module)=>{
            this.context[module].destroy()
        })
    }
}

export default MEditable;