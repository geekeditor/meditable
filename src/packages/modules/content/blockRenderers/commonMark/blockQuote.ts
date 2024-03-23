import { MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../renderer";

export default class MEBlockQuoteRenderer extends MEBlockRenderer {
    static type: MEBlockType = "block-quote";
    static tagName: string = 'blockquote';
}