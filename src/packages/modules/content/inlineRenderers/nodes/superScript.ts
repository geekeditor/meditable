import { MENodeType } from "@/packages/types";
import MEEm from "./em";

export default class MESuperScript extends MEEm {
    static type: MENodeType = "sup";
    static tagName: string = "sup";
}