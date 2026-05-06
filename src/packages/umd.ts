import MEditable from ".";
import { MEPluginContextMenu, MEPluginBubbleToolbar } from "./plugins";
require('./styles/index.less')

Object.assign(MEditable, {
    MEPluginContextMenu,
    MEPluginBubbleToolbar
});

export default MEditable;