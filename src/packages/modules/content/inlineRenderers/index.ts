import MENode from "./nodes/node";
import MEStrong from "./nodes/strong";
import MEEm from "./nodes/em";
import MEHeader from "./nodes/header";
import { MEBlockRendererInstance, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MEHr from "./nodes/hr";
import MECodeFense from "./nodes/codeFense";
import MEDel from "./nodes/del";
import MESoftLineBreak from "./nodes/softLineBreak";
import MEHardLineBreak from "./nodes/hardLineBreak";
import MESubScript from "./nodes/subScript";
import MESuperScript from "./nodes/superScript";
import MEHtmlTag from "./nodes/htmlTag";
import MEHtmlBr from "./nodes/htmlBr";
import MEHtmlValidTag from "./nodes/htmlValidTag";
import MEHtmlRuby from "./nodes/htmlRuby";
import MEHtmlEscape from "./nodes/htmlEscape";
import MEEmoji from "./nodes/emoji";
import MEEmojiValid from "./nodes/emojiValid";
import MEInlineCode from "./nodes/inlineCode";
import METailHeader from "./nodes/tailHeader";
import MEAutoLink from "./nodes/autoLink";
import MEAutoLinkExtension from "./nodes/autoLinkExtension";
import MEBacklash from "./nodes/backlash";
import MELink from "./nodes/link";
import MELinkNoText from "./nodes/linkNoText";
import MEHtmlComment from "./nodes/htmlComment";
import MEFootnoteIdentifier from "./nodes/footnoteIdentifier";
import MEReferenceDefinition from "./nodes/referenceDefinition";
import MEReferenceLink from "./nodes/referenceLink";
import MEReferenceImage from "./nodes/referenceImage";
import MEHtmlImg from "./nodes/htmlImg";
import MEImage from "./nodes/image";
import MEInlineMath from "./nodes/inlineMath";
import MEMultipleMath from "./nodes/multipleMath";

MENode.register(MEStrong)
MENode.register(MEEm)
MENode.register(MEHeader)
MENode.register(METailHeader)
MENode.register(MEHr)
MENode.register(MECodeFense)
MENode.register(MEDel)
MENode.register(MESoftLineBreak)
MENode.register(MEHardLineBreak)
MENode.register(MESubScript)
MENode.register(MESuperScript)
MENode.register(MEHtmlTag)
MENode.register(MEHtmlBr)
MENode.register(MEHtmlValidTag)
MENode.register(MEHtmlComment)
MENode.register(MEHtmlRuby)
MENode.register(MEHtmlEscape)
MENode.register(MEEmoji)
MENode.register(MEEmojiValid)
MENode.register(MEInlineCode)
MENode.register(MEAutoLink)
MENode.register(MEAutoLinkExtension)
MENode.register(MELink)
MENode.register(MELinkNoText)
MENode.register(MEBacklash)
MENode.register(MEFootnoteIdentifier)
MENode.register(MEReferenceDefinition)
MENode.register(MEReferenceLink)
MENode.register(MEReferenceImage)
MENode.register(MEHtmlImg)
MENode.register(MEImage)
MENode.register(MEInlineMath)
MENode.register(MEMultipleMath)

export function createNode(instance: MEBlockRendererInstance, type: MENodeType) {
    const Constructable = MENode.nodes[type] || MENode;
    return new Constructable(instance);
}

export async function nodeStaticRender(type: MENodeType, { innerHTML, data, labels }: MENodeRendererStaticRenderOptions) {
    const Constructable = MENode.nodes[type] || MENode
    return Constructable.staticRender({ innerHTML, data, labels })
}

/*
export function render(el: HTMLElement, hasBeginRules?: boolean) {
    const text = el['BLOCK_RENDERER_INSTANCE'].text || getTextContent(el, [CLASS_NAMES.ME_INLINE_RENDER, CLASS_NAMES.ME_INLINE_RENDER]);
    const tokens = tokenizer(text, { hasBeginRules })

}
*/