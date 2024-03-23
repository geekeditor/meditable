import MEModule from "@/packages/modules/module";
import { MEInstance, MEPluginInstance, MEPluginOptions } from "@/packages/types";

export default class MEPluginBase extends MEModule implements MEPluginInstance {
    protected options: MEPluginOptions;
    constructor(instance: MEInstance, options?: MEPluginOptions) {
        super(instance)
        this.options = options || {}
    }
}