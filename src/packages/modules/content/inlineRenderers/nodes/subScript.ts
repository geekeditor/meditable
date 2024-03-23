import { MENodeType } from "@/packages/types";
import MEEm from "./em";

export default class MESubScript extends MEEm {
    static type: MENodeType = "sub";
    static tagName: string = "sub";
}