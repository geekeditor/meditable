import { MENodeType } from "@/packages/types";
import MEEm from "./em";

export default class MEStrong extends MEEm {
    static type: MENodeType = "strong";
    static tagName: string = "strong";
}