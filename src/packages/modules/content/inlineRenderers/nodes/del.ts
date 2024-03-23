import { MENodeType } from "@/packages/types";
import MEEm from "./em";

export default class MEDel extends MEEm {
    static type: MENodeType = "del";
    static tagName: string = "del";
}