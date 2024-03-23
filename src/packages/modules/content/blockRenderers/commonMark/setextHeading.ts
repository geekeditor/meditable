import { MEBlockType } from "@/packages/types";
import MEParagraphRenderer from "./paragraph";

export class MESetextHeading1Renderer extends MEParagraphRenderer {
    static type: MEBlockType = "setext-heading1";
    static tagName: string = 'h1';
}

export class MESetextHeading2Renderer extends MEParagraphRenderer {
    static type: MEBlockType = "setext-heading2";
    static tagName: string = 'h2';
}