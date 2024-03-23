import { MEBlockData, MEContentType, MECursorState, MEStateScene } from "@/packages/types";
import MEModule from "../module";
import MarkdownToState from './markdownToState';
import StateToMarkdown from './stateToMarkdown';
import HtmlToMarkdown from "./htmlToMarkdown";
import StateToHtml from "./stateToHtml";
import StateToPlainText from "./stateToPlainText";
import { collectReferenceDefinitions } from "./utils";




class MEState extends MEModule {


  markdownToState: MarkdownToState;
  stateToMarkdown: StateToMarkdown;
  htmlToMarkdown: HtmlToMarkdown;
  stateToHtml: StateToHtml;
  stateToPlainText: StateToPlainText;
  state: MEBlockData;
  labels: Map<string, { href: string; title: string }>;

  constructor(instance) {
    super(instance)

    this.markdownToState = new MarkdownToState();
    this.stateToMarkdown = new StateToMarkdown();
    this.htmlToMarkdown = new HtmlToMarkdown();
    this.stateToHtml = new StateToHtml({diagramHtmlType: instance.options.diagramHtmlType});
    this.stateToPlainText = new StateToPlainText();
  }


  async prepare(): Promise<boolean> {
    return true
  }


  setContent(text: string, type: MEContentType = "md") {
    if (type === 'html') {
      text = this.htmlToMarkdown.generate(text)
    }
    const { content, stack, event } = this.instance.context;
    const data = this.markdownToState.generate(text);
    this.labels = collectReferenceDefinitions(data.children);
    content.render({ data });
    content.setCursorAtBegin();
    stack.reset();
    requestAnimationFrame(()=>{
      const currentScene = this.getScene();
      event.trigger("aftersetcontent", currentScene);
    })
    
  }

  async getContent(type: MEContentType = "md") {

    const { content } = this.instance.context;
    const data = content.data;

    if (type === 'text') {
      const text = this.stateToPlainText.generate(data.children || [])
      return text;
    } else if (type === 'html') {
      const html = await this.stateToHtml.generate(data.children || [])
      return html;
    } else {
      const markdown = this.stateToMarkdown.generate(data.children || [])
      return markdown;
    }
  }

  getWordCount() {
    const { content } = this.instance.context;
    const data = content.data;
    const text = this.stateToPlainText.generate(data.children || []);
    const pattern = /[a-zA-Z0-9_\u0392-\u03c9]+|[\u4E00-\u9FFF\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;
    const match = text.match(pattern);
    let count = 0;
    if (match == null) { return count; }
    for (var i = 0; i < match.length; i++) {
      if (match[i].charCodeAt(0) >= 0x4E00) {
        count += match[i].length;
      } else {
        count += 1;
      }
    }
    return count;
  }



  getScene() {
    const { content, editable } = this.instance.context;
    const { anchorBlock, focusBlock, ...cursor } = editable.selection.cursor;
    const state = content.data;
    

    return {
      state,
      cursor
    }

  }

  setScene({ state, cursor }: MEStateScene) {
    try {
      const data = state
      this.labels = collectReferenceDefinitions(data.children)
      const { content, editable } = this.instance.context
      content.render({ data, cursor })
      editable.selection.setCursor(cursor)
    } catch (error) {

    }
  }
}

export default MEState;