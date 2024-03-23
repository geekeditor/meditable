import { MEBlockInstance, MEBlockRendererStaticRenderOptions, MEBlockType } from "@/packages/types";
import MEBlockRenderer from "./renderer";
import MEDocumentRenderer from "./document";
import MEParagraphRenderer from "./commonMark/paragraph";
import { MEAtxHeading1Renderer, MEAtxHeading2Renderer, MEAtxHeading3Renderer, MEAtxHeading4Renderer, MEAtxHeading5Renderer, MEAtxHeading6Renderer } from "./commonMark/atxHeading";
import { MESetextHeading1Renderer, MESetextHeading2Renderer } from "./commonMark/setextHeading";
import MEBlockQuoteRenderer from './commonMark/blockQuote';
import MEBulletListRenderer from "./commonMark/bulletList";
import MEOrderListRenderer from "./commonMark/orderList";
import MEListItemRenderer from "./commonMark/listItem";
import METhematicBreakRenderer from "./commonMark/thematicBreak";
import MELanguageRenderer from "./commonMark/codeBlock/language";
import MECodeRenderer from "./commonMark/codeBlock/code";
import MECodeBlockRenderer from "./commonMark/codeBlock";
import MEHtmlBlockRenderer from "./commonMark/htmlBlock";
import MEMathBlockRenderer from "./extra/mathBlock";
import MEDiagramBlockRenderer from "./extra/diagramBlock";
import METaskListRenderer from "./gfm/taskList";
import METaskListItemRenderer from "./gfm/taskList/item";
import METableRenderer, { METableTbodyRenderer, METableTheadRenderer, METableTrRenderer } from "./gfm/table";
import METableTdRenderer from "./gfm/table/td";
import METableThRenderer from "./gfm/table/th";
import MEFrontmatterRenderer from "./extra/frontmatter";

MEBlockRenderer.register(MEDocumentRenderer)
MEBlockRenderer.register(MEParagraphRenderer)
MEBlockRenderer.register(MEAtxHeading1Renderer)
MEBlockRenderer.register(MEAtxHeading2Renderer)
MEBlockRenderer.register(MEAtxHeading3Renderer)
MEBlockRenderer.register(MEAtxHeading4Renderer)
MEBlockRenderer.register(MEAtxHeading5Renderer)
MEBlockRenderer.register(MEAtxHeading6Renderer)
MEBlockRenderer.register(MESetextHeading1Renderer)
MEBlockRenderer.register(MESetextHeading2Renderer)
MEBlockRenderer.register(MEBlockQuoteRenderer)
MEBlockRenderer.register(MEBulletListRenderer)
MEBlockRenderer.register(MEOrderListRenderer)
MEBlockRenderer.register(MEListItemRenderer)
MEBlockRenderer.register(METhematicBreakRenderer)
MEBlockRenderer.register(MELanguageRenderer)
MEBlockRenderer.register(MECodeRenderer)
MEBlockRenderer.register(MECodeBlockRenderer)
MEBlockRenderer.register(MEHtmlBlockRenderer)
MEBlockRenderer.register(MEMathBlockRenderer)
MEBlockRenderer.register(MEDiagramBlockRenderer)
MEBlockRenderer.register(METaskListRenderer)
MEBlockRenderer.register(METaskListItemRenderer)
MEBlockRenderer.register(METableRenderer)
MEBlockRenderer.register(METableTheadRenderer)
MEBlockRenderer.register(METableTbodyRenderer)
MEBlockRenderer.register(METableTrRenderer)
MEBlockRenderer.register(METableTdRenderer)
MEBlockRenderer.register(METableThRenderer)
MEBlockRenderer.register(MEFrontmatterRenderer)

export function createRenderer(instance: MEBlockInstance, type: MEBlockType) {
    const Constructable = MEBlockRenderer.renders[type] || MEBlockRenderer;
    return new Constructable(instance);
}

export async function blockStaticRender(type: MEBlockType, options:MEBlockRendererStaticRenderOptions):Promise<string> {
    const Constructable = MEBlockRenderer.renders[type] || MEBlockRenderer
    return Constructable.staticRender(options)
}