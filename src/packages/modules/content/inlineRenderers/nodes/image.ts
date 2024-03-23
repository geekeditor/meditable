import { MENodeType } from "@/packages/types";
import MEHtmlImg from "./htmlImg";

export default class MEImage extends MEHtmlImg {
    static type: MENodeType = "image";
}