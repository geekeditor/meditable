import domUtils from "@/packages/utils/domUtils";
import MEModule from "@/packages/modules/module";
import { MEBlockRendererInstance, MENodeConstructable, MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { inlinePatch } from "../../utils/patch";
import { getTextContent } from "../../utils/dom";


export default class MENode extends MEModule<{ el: HTMLElement; holder: HTMLElement }> {

    static nodes: { [type: string]: MENodeConstructable } = {}
    static type: MENodeType = "text";
    static tagName: string = "span";
    private _data: MENodeData;
    blockRenderer!: MEBlockRendererInstance;
    children: MENode[] = [];

    static register(node: MENodeConstructable) {
        this.nodes[node.type] = node;
    }

    static async staticRender({data}:MENodeRendererStaticRenderOptions) {
        const {raw} = data
        return `<${this.tagName} class="${this.type}">${raw}</${this.tagName}>`
    }

    constructor(instance: MEBlockRendererInstance) {
        super(instance.instance);
        this.blockRenderer = instance;
    }

    get type() {
        return this.constructor['type'];
    }

    get dirty() {

        const childNodes = Array.from(this.nodes.el.childNodes)
        return (childNodes.length > 1 && childNodes.some((node)=>node.nodeType===3)) || (this.children && this.children.some((child)=>child.dirty));
    }

    get data() {
        return this._data;
    }

    get tagName() {
        return this.constructor['tagName']
    }

    get textContent() {
        return getTextContent(this.nodes.el, [CLASS_NAMES.ME_INLINE_RENDER])
    }

    renderSelf(data: MENodeData) {
        if (!this.nodes.el) {
            this.nodes.el = this.make(this.tagName, [CLASS_NAMES.ME_NODE]);
            this.nodes.el.dataset.nodeType = this.type;
            this.nodes.holder = this.nodes.el;
        }
    }

    render(data: MENodeData): HTMLElement {
        this.renderSelf(data);
        // remove wild text nodes
        if(this.nodes.el.childNodes.length > 1) {
            Array.from(this.nodes.el.childNodes).forEach((node)=>{
                if(node.nodeType === 3) {
                    this.nodes.el.removeChild(node)
                }
            })
        }

        if(this.nodes.holder) {
            if (data.children) {
                inlinePatch.call(this, data.children);
            } else if(typeof data.content !== "undefined"){
                const content = data.content;
                if (content !== this.nodes.holder.textContent) {
                    this.nodes.holder.textContent = content
                }
            }
        }

        this._data = data;
        this.nodes.el.classList.toggle(CLASS_NAMES.ME_NODE__ACTIVED, !!data.actived);
        return this.nodes.el;
    }

    make(tagName: string, classNames: string | string[] | null = null, attributes: any = {}, dataset: any = {}) {
        return domUtils.make(tagName, classNames, attributes, dataset)
    }
}