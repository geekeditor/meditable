import { MEBlockType } from "@/packages/types";
import MEParagraphRenderer from "./paragraph";
import { handleBackspaceInParagraph } from "./paragraph/backspace";

export class MEAtxHeading1Renderer extends MEParagraphRenderer {
    static type: MEBlockType = "atx-heading1";
    static tagName: string = 'h1';

    backspaceHandler(event: KeyboardEvent) {
        const cursor = this.getCursor();
        if (!cursor) {
            return null;
        }

        const { start, end } = cursor
        if (start.offset === 0 && end.offset === 0) {
            event.preventDefault()
            handleBackspaceInParagraph.call(this)
        } else {
            super.backspaceHandler(event)
        }
    }
}

export class MEAtxHeading2Renderer extends MEAtxHeading1Renderer {
    static type: MEBlockType = "atx-heading2";
    static tagName: string = 'h2';
}

export class MEAtxHeading3Renderer extends MEAtxHeading1Renderer {
    static type: MEBlockType = "atx-heading3";
    static tagName: string = 'h3';
}

export class MEAtxHeading4Renderer extends MEAtxHeading1Renderer {
    static type: MEBlockType = "atx-heading4";
    static tagName: string = 'h4';
}

export class MEAtxHeading5Renderer extends MEAtxHeading1Renderer {
    static type: MEBlockType = "atx-heading5";
    static tagName: string = 'h5';
}

export class MEAtxHeading6Renderer extends MEAtxHeading1Renderer {
    static type: MEBlockType = "atx-heading6";
    static tagName: string = 'h6';
}