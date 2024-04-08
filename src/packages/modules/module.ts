import { MEInstance, MEModuleInstance } from "../types";

export type ModuleNodes = object;
export default abstract class MEModule<T extends ModuleNodes = {}> implements MEModuleInstance {

    public readonly nodes: T = {} as any;
    public readonly mutableListeners = {
        on: (
            element: EventTarget,
            eventType: string,
            handler: (event: Event) => void,
            options: boolean | AddEventListenerOptions = false
        ) => {
            const id = this.instance.eventListeners.on(element, eventType, (event: Event)=>{
                const {editable} = this.instance.context;
                if(!editable.actived) return;
                handler(event);
            }, options)

            if(id) {
                this.mutableListenerIds.push(id);
            }
            
            return id;
        },
        clearAll: (): void => {
            for (const id of this.mutableListenerIds) {
                this.instance.eventListeners.off(id);
            }

            this.mutableListenerIds = [];
        },
    };

    private mutableListenerIds: string[] = [];

    instance: MEInstance;
    constructor(instance: MEInstance) {
        this.instance = instance;
    }

    t(key: string) {
        return this.instance.t(key);
    }

    async prepare() {
        return true;
    };

    destroy() {
        this.mutableListeners.clearAll();
    }

}