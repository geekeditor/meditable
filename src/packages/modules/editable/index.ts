import MEModule from "@/packages/modules/module";
import MESelection from "./selection";
import { CLASS_NAMES } from "@/packages/utils/classNames";


export default class MEEditable extends MEModule {

    private _holder!: HTMLElement;
    private _rootDocNode!: Node;
    private _actived!: boolean;
    private _selection!: MESelection;
    private _document!: HTMLDocument;
    private _window!: Window;
    private _enabled!: boolean;

    get holder() {
        return this._holder;
    }

    get rootNode() {
        return this._rootDocNode;
    }

    get actived() {
        return this._actived;
    }

    set actived(actived: boolean) {
        this._actived = actived;
        const event = this.instance.context.event;
        event.trigger("actived")
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(enabled: boolean) {
        this._enabled = enabled;
    }

    get selection() {
        return this._selection;
    }

    get document() {
        return this._document;
    }

    get window() {
        return this._window;
    }

    public mount(el: HTMLElement, selection?: Selection | null) {
        this._rootDocNode = el.getRootNode();
        if (el.nodeType !== 1 || !el.ownerDocument || !this._rootDocNode || (this._rootDocNode.nodeType !== 9 && this._rootDocNode.nodeType !== 11)) throw "el is invalid!";

        const { spellcheckEnabled = false } = this.instance.options
        this._holder = el;
        this._holder.setAttribute("contenteditable", "true");
        this._holder.setAttribute("spellcheck", spellcheckEnabled ? "true" : "false");
        this._holder.style.cursor = "text";
        this._holder.dataset.root = 'root'

        this._document = el.ownerDocument;
        this._window = this._document.defaultView as Window;

        this._selection = new MESelection(
            el.ownerDocument,
            this._holder,
            this.instance
        );

        this._actived = true;

        this.mutableListeners.on(this._holder, "mousedown", (event)=>{
            const mouseEvent = event as MouseEvent;
            if(mouseEvent.ctrlKey || mouseEvent.metaKey) {
                const target = mouseEvent.target as Element;
                const anchor = target.nodeType === 3 ? target.parentElement?.closest("a") : target.closest("a");
                if(anchor && anchor.href) {
                    const {linkClick} = this.instance.options;
                    if(linkClick) {
                        linkClick(anchor.href)
                    } else {
                        this.window.open(anchor.href, "_blank")
                    }
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        }, true);
        this.mutableListeners.on(this._holder, "mousemove", (event)=>{
            const mouseEvent = event as MouseEvent;
            this._holder.classList.toggle(CLASS_NAMES.ME_CONTENT__CONTROLLING, mouseEvent.ctrlKey||mouseEvent.metaKey)
        }, true);
        this.mutableListeners.on(this._document, "keydown", (event)=>{
            const keyEvent = event as KeyboardEvent;
            if(keyEvent.key === 'Control' || keyEvent.key === 'Meta') {
                this._holder.classList.toggle(CLASS_NAMES.ME_CONTENT__CONTROLLING, true)
            }
        }, true);
        this.mutableListeners.on(this._document, "keyup", (event)=>{
            const keyEvent = event as KeyboardEvent;
            if(keyEvent.key === 'Control' || keyEvent.key === 'Meta') {
                this._holder.classList.toggle(CLASS_NAMES.ME_CONTENT__CONTROLLING, false)
            }
        }, true);

        return this;
    }

    destroy() {
        super.destroy();
        this._actived = false;
    }
    
}