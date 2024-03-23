
import MEPluginBase from "../base";

export default class MEPluginContextMenu extends MEPluginBase {
    static pluginName = "contextMenu"
    async prepare(): Promise<boolean> {
        const { layout } = this.instance.context;
        this.mutableListeners.on(layout.nodes.wrapper, 'contextmenu', (event: Event) => {
            event.preventDefault()
            event.stopPropagation()
        })
        return true;
    }
}