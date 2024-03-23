import { MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../renderer";

export default class MEOrderListRenderer extends MEBlockRenderer {
    static type: MEBlockType = "order-list";
    static tagName: string = 'ol';
}