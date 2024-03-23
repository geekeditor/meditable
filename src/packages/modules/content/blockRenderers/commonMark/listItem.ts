import { MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../renderer";

export default class MEListItemRenderer extends MEBlockRenderer {
    static type: MEBlockType = "list-item";
    static tagName: string = 'li';
}