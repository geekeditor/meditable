
import MEModule from "./module";
import { MEBlockData, MECursorState, MEStateScene } from "../types";
import { debounce } from "../utils/utils";

function compareCursors(cursorA: MECursorState, cursorB: MECursorState) {
    return cursorA.anchorBlockId === cursorB.anchorBlockId &&
    cursorA.focusBlockId === cursorB.focusBlockId &&
    cursorA.anchor.offset === cursorB.anchor.offset &&
    cursorA.focus.offset === cursorB.focus.offset;
}

function compareObjects(objectA, objectB) {
    if(!objectA && !objectB) {
        return true;
    }

    objectA = objectA || {}
    objectB = objectB || {}

    if(Object.keys(objectA).length !== Object.keys(objectB).length) {
        return false;
    }

    for (const key in objectA) {
        if (!objectB.hasOwnProperty(key)) return false;
        
        if (typeof objectA[key] === 'object' && typeof objectB[key] === 'object') {
            const result = compareObjects(objectA[key], objectB[key]); 
            
            if (!result) return false;
        } else if (objectA[key] !== objectB[key]) {
            return false; 
        }
    }
    
    return true; 
}


function compareStates(stateA: MEBlockData, stateB: MEBlockData) {
    if(stateA.id !== stateB.id || stateA.type !== stateB.type || stateA.text !== stateB.text || !compareObjects(stateA.meta, stateB.meta)) {
        return false
    }

    const lenA = stateA.children?.length
    const lenB = stateB.children?.length
    if(lenA !== lenB) {
        return false
    }

    if(lenA) {
        for(let i = 0; i < lenA; i ++) {
            if(!compareStates(stateA.children[i], stateB.children[i])) {
                return false
            }
        }
    }

    
    return true;
}

function isInvalidCursor(cursor: MECursorState) {
    return (!cursor.anchorBlockId && !cursor.focusBlockId);
}

const keys: { [key: number]: number } = {
    /*Shift*/
    16: 1,
    /*Ctrl*/
    17: 1,
    /*Alt*/
    18: 1,
    37: 1,
    38: 1,
    39: 1,
    40: 1,
}
export default class MEStack extends MEModule {
    private _list: MEStateScene[] = [];
    private _index: number = 0;
    private _canUndo: boolean = false;
    private _canRedo: boolean = false;
    private _maxStackCount!: number;
    private _maxInputCount!: number;
    private _keyCount!: number;
    private _compositing!: boolean;
    private _isCollapsed!: boolean;
    private _saveFn!: Function;
    private _mutationObserver!: MutationObserver;


    async prepare(): Promise<boolean> {
        this._maxStackCount = 50;
        this._maxInputCount = 20;
        this._keyCount = 0;
        this._compositing = false;
        this._isCollapsed = true;
        this._saveFn = debounce(this.save, 200);
        // this._mutationObserver = new MutationObserver(()=>{
        //     this._saveFn(true);
        // });
        // this.reset();
        this.bindEvents();
        const commands = [
            {
                cmdName: 'undo',
                notNeedUndo: true,
                execCommand: (cmdName: string) => {
                    this.undo();
                },
                queryCommandState: () => {
                    return this.canUndo() ?
                        0 :
                        -1;
                },
                shortcutKeys: {
                    "Ctrl+Z": {}
                }
            },
            {
                cmdName: 'redo',
                notNeedUndo: true,
                execCommand: (cmdName: string) => {
                    this.redo();
                },
                queryCommandState: () => {
                    return this.canRedo() ?
                        0 :
                        -1;
                },
                shortcutKeys: {
                    "Ctrl+Y": {},
                    "Ctrl+Shift+Z": {}
                }
            }
        ]
        for (let key in commands) {
            this.instance.context.command.registerCommand(commands[key])
        }
        return true;
    }

    bindEvents() {
        const {editable, event} = this.instance.context;
        event.on('compositionstart', (type:string, evt:CompositionEvent) => {
            this._compositing = true;
        })
        event.on('compositionend', (type:string, evt:CompositionEvent) => {
            this._compositing = false;
            this._saveFn(false);
        })
        event.on('keydown', (type: string, evt: KeyboardEvent) => {
            const keyCode = evt.keyCode || evt.which;
            if (!keys[keyCode] &&
                !evt.ctrlKey &&
                !evt.metaKey &&
                !evt.shiftKey &&
                !evt.altKey) {
                if (this._compositing) return;
                if (!editable.selection.getRangeAt(0).collapsed) {
                    this._saveFn(true);
                    this._isCollapsed = false;
                    return;
                }
                if (this._list.length === 0) {
                    this.save(true);
                }
                this._saveFn(true);
                // this._keyCount++;
                // if (this._keyCount >= this._maxInputCount) {
                //     this.save(true);
                // }
            }
        })
        event.on('keyup', (type: string, evt: KeyboardEvent) => {
            const keyCode = evt.keyCode || evt.which;
            if (!keys[keyCode] &&
                !evt.ctrlKey &&
                !evt.metaKey &&
                !evt.shiftKey &&
                !evt.altKey) {
                if (this._compositing) return;
                if (!this._isCollapsed) {
                    this.save(true);
                    this._isCollapsed = true;
                }
            }
        })
        event.on('mouseup', (type: string, evt: MouseEvent) => {
            this.save(true)
        })
        event.on('beforeexeccommand', (type: string, cmdName: string) => {
            this.saveForCmd(cmdName);
        })
        event.on('afterexeccommand', (type: string, cmdName: string) => {
            this.saveForCmd(cmdName);
        })
        event.on('savescence', (type: string) => {
            this.save(true)
        })
        // this._mutationObserver.observe(
        //     editable.holder,
        //     {
        //         childList: true,
        //         subtree: true,
        //         characterData: true,
        //         attributes: true,
        //     }
        // );
    }

    saveForCmd(cmdName: string) {
        const {command} = this.instance.context;
        const com = command.command(cmdName);
        
        if (com && !com.notNeedUndo) {
            this.save(true)
        }
    }

    undo() {
        if (this._canUndo) {
            if (!this._list[this._index - 1] && this._list.length == 1) {
                this.reset();
                return;
            }
            while (this._list[this._index].state === this._list[this._index - 1].state) {
                this._index--;
                if (this._index === 0) {
                    return this.restore(0);
                }
            }
            this.restore(--this._index);
        }
    }
    redo() {
        if (this._canRedo) {
            while (this._list[this._index].state === this._list[this._index + 1].state) {
                this._index++;
                if (this._index === this._list.length - 1) {
                    return this.restore(this._index);
                }
            }
            this.restore(++this._index);
        }
    }
    restore(index: number) {
        const {state} = this.instance.context;
        const scene = this._list[index];
        state.setScene(scene);
        this.update();
        this.clearKey();
    }
    save(notCompareCursor?: boolean) {
        const {event, state} = this.instance.context;
        const currentScene = state.getScene();
        const lastScene = this._list[this._index];
        const isSame = lastScene && compareStates(lastScene.state, currentScene.state);
        if (!isSame) {
            event.trigger('contentchange', currentScene);
        }

        if (isSame && (notCompareCursor || isInvalidCursor(currentScene.cursor) || compareCursors(lastScene.cursor, currentScene.cursor))) {
            return;
        }
        
        this._list = this._list.slice(0, this._index + 1);
        this._list.push(currentScene);

        if (this._list.length > this._maxStackCount) {
            this._list.shift();
        }

        this._index = this._list.length - 1;
        this.update();
        this.clearKey();
    }
    update() {
        this._canRedo = !!this._list[this._index + 1];
        this._canUndo = !!this._list[this._index - 1];
    }
    reset() {
        const {state} = this.instance.context;
        const currentScene = state.getScene();
        this._list = [currentScene];
        this._index = 0;
        this._canRedo = false;
        this._canUndo = false;
    }
    clearKey() {
        this._keyCount = 0;
    }
    canUndo() {
        return this._canUndo;
    }
    canRedo() {
        return this._canRedo;
    }
}