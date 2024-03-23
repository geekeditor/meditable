import MEModule from "@/packages/modules/module";
import { MEPluginConstructable, MEPluginInstance, MEPluginOptions } from "@/packages/types";



export default class MEPlugin extends MEModule {

    static plugins: { Plugin: MEPluginConstructable; options?: MEPluginOptions }[] = [];
    static use(Plugin: MEPluginConstructable, options?: MEPluginOptions) {
        this.plugins.push({
            Plugin,
            options
        })
    }

    plugins: { [key: string]: MEPluginInstance } = {}
    async prepare(): Promise<boolean> {
        if (MEPlugin.plugins.length) {
            for (const { Plugin, options } of MEPlugin.plugins) {
                this.plugins[Plugin.pluginName] = new Plugin(this.instance, options);
            }
        }

        await Object.keys(this.plugins).reduce(
            (promise, pluginName) => promise.then(async () => {
                try {
                    await this.plugins[pluginName].prepare();
                } catch (e) {
                }
            }),
            Promise.resolve()
        )

        return true
    }

}