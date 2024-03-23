import { MENodeType } from "@/packages/types";
import MEEm from "./em";

export default class MEInlineCode extends MEEm {
    static type: MENodeType = "inline_code";
    static tagName: string = "code";
}