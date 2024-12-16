import { CLASS_NAMES } from "../utils/classNames";
import env from "../utils/env";
import MEModule from "./module";
import { debounce } from "@/packages/utils/utils"

export interface EventEmitterInstance {
    on: (types: string | string[], handler: Function) => void;
    off: (types: string | string[], handler: Function) => void;
    trigger: (types: string | string[], ...args: any[]) => void;
}

export default class MEEvent extends MEModule {
    listeners!: { [key: string]: Function[] };
    async prepare(): Promise<boolean> {
        this.bindEvents()
        return true
    }

    private bindEvents() {
        this.proxyDomEvent = this.proxyDomEvent.bind(this);
        this.selectionChange = debounce(this.selectionChange, 20);

        const { editable, layout } = this.instance.context;
        [
            "keydown",
            "keyup",
            "keypress",
            "input",
            "compositionstart",
            "compositionend"
        ].forEach((type) => {
            this.mutableListeners.on( (env.safari && !env.isMobile) ? editable.document : editable.holder, type, this.proxyDomEvent);
        });

        [
            "selectstart",
            "focus",
            "blur",
            "copy",
            "cut",
            "paste"
        ].forEach((type) => {
            this.mutableListeners.on(editable.holder, type, this.proxyDomEvent);
        });

        [
            "click",
            "contextmenu",
            "mousedown",
            "mouseup",
            "mouseover",
            "mouseout",
            "drop",
            "dragstart",
            "dragover"
        ].forEach((type) => {
            this.mutableListeners.on(layout.nodes.scroller, type, this.proxyDomEvent);
        })

        const selectionChangeEvent = (evt: any) => {

            if (evt.button === 2) return;

            this.selectionChange(evt);
        }

        ["mouseup", "keydown"].forEach((type) => {
            this.mutableListeners.on(editable.holder, type, selectionChangeEvent);
        })
        // Maybe move mouse out of holder
        this.mutableListeners.on(editable.document, 'mouseup', selectionChangeEvent);
        this.mutableListeners.on(editable.document, 'selectionchange', selectionChangeEvent);

        const preventSelection = (event) => {
            const { target } = event
            if (target.closest(`.${CLASS_NAMES.ME_TOOL}, .${CLASS_NAMES.ME_TOOLBAR}, .${CLASS_NAMES.ME_PREVIEW}`)) {
                event.preventDefault()
                return
            }
        }
        this.mutableListeners.on(editable.document, 'mousedown', preventSelection)
    }

    private proxyDomEvent(evt: Event) {
        const type = evt.type.replace(/^on/, "").toLowerCase();
        this.trigger(type, evt);
    }

    selectionChange(evt?: Event) {
        if (!this.instance) {
            return;
        }
        const causeByUi = !!evt;
        const { selection } = this.instance.context.editable;
        selection.cache();
        if (selection.cachedRange && selection.cachedCursor) {
            this.trigger("beforeselectionchange");
            this.trigger("selectionchange", causeByUi);
            this.trigger("afterselectionchange");
            // selection.clearCache();
        }
    }
    private getListener(type: string) {
        this.listeners = this.listeners || {}
        return this.listeners[type] || (this.listeners[type] = [] as Function[])
    }
    on(types: string | string[], listener: Function) {
        if (typeof types === 'string') {
            types = types.trim().split(/\s+/);
        }

        for (const type of types) {
            const listeners = this.getListener(type),
                index = listeners.findIndex((l) => l === listener);
            if (index === -1) {
                listeners.push(listener);
            }
        }
    }
    off(types: string | string[], listener: Function) {
        if (typeof types === 'string') {
            types = types.trim().split(/\s+/);
        }

        for (const type of types) {
            const listeners = this.getListener(type),
                index = listeners.findIndex((l) => l === listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    trigger(types: string | string[], ...args: any[]) {
        if (typeof types === 'string') {
            types = types.trim().split(/\s+/);
        }

        for (const type of types) {
            const listeners = this.getListener(type);
            const tagrs = [type, ...args];
            listeners.forEach((listener) => {
                listener.apply(this, tagrs);
            })
        }
    }

}