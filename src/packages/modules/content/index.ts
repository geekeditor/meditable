import { MEBlockInstance, MEInstance } from "@/packages/types";
import MEBlock from "./block";
import { clearDropBlock, findActivedNodes, findDropBlock } from "./utils/find";
import commands from "./commands";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import env from "@/packages/utils/env";





class MEContent extends MEBlock {

    private _cacheFocusedBlock: MEBlockInstance | null = null;
    private _cacheActivedNodes = new Set<Element>();

    constructor(instance: MEInstance) {
        super(instance);
    }

    get path() {
        return []
    }

    get focusedBlock() {
        return this._cacheFocusedBlock;
    }

    set focusedBlock(focusBlock: MEBlockInstance) {

        const { _cacheFocusedBlock: blurBlock } = this
        if (focusBlock !== blurBlock) {
            this._cacheFocusedBlock = focusBlock

            let needBlurBlocks:MEBlockInstance[] = []
            let needActiveBlocks:MEBlockInstance[] = []

            if (blurBlock && focusBlock) {
                
                needActiveBlocks = focusBlock.getAncestors()
                needActiveBlocks.push(focusBlock);
                let block = blurBlock
                while (block && !block.isRoot && !needActiveBlocks.includes(block)) {
                    needBlurBlocks.push(block)
                    block = block.parent
                }
            } else if (blurBlock) {
                needBlurBlocks = blurBlock.getAncestors()
                needBlurBlocks.push(blurBlock)
            } else if (focusBlock) {
                needActiveBlocks = focusBlock.getAncestors()
                needActiveBlocks.push(focusBlock)
            }

            if (needBlurBlocks.length) {
                needBlurBlocks.forEach(b => {
                    b.actived = false
                })
            }

            if (needActiveBlocks.length) {
                needActiveBlocks.forEach(b => {
                    b.actived = true
                })
            }

            if(blurBlock) {
                blurBlock.focused = false;
            }
            if(focusBlock) {
                focusBlock.focused = true;
            }
        }
    }

    get acitvedNodes() {
        return this._cacheActivedNodes;
    }

    get dropTargetBlock() {
        return findDropBlock(this as MEBlockInstance);
    }

    async prepare(): Promise<boolean> {
        for (let key in commands) {
            this.instance.context.command.registerCommand(commands[key])
        }

        this.dispatchEvents()
        return true
    }

    public setFocusedBlockBy(childNode: Node) {
        const block = this.findBlock(childNode);
        this.focusedBlock = block;
    }

    public clearDropTargetBlock() {
        clearDropBlock(this as MEBlockInstance);
    }

    public destroy() {

        this.children = []
        const holder = this.nodes.holder;
        if (holder) {
            holder.innerHTML = '';
        }

    }

    public dropPointer() {
        this.focusedBlock = null;
    }
    


    public updateFocusedBlock() {
        const { selection } = this.instance.context.editable;
        const node = selection.focusNode || selection.anchorNode;
        if (node) {
            this.setFocusedBlockBy(node);
        }
    }



    public setCursorAtBegin() {
        const firstContentBlock = this.firstContentInDescendant();
        if(firstContentBlock) {
            firstContentBlock.renderer.setCursor();
        }
    }

    public setCursorAtEnd() {
        const lastContentBlock = this.lastContentInDescendant();
        if(lastContentBlock) {
            lastContentBlock.renderer.setCursor({focus: {offset: lastContentBlock.renderer.text.length}});
        }
    }

    private dispatchEvents() {
        const { event, editable } = this.instance.context;
        const { selection } = editable;
        const eventHandler = (type, event) => {

            const { anchorBlock, isSameBlock, isCollapsed } = selection.cursor
            if(type === 'click') {
                if(!isCollapsed) {
                    return;
                }
                const { target } = event
                const blockEl = target.closest(`.${CLASS_NAMES.ME_BLOCK}`)
                if(blockEl) {
                    const blockInstance = blockEl['BLOCK_INSTANCE'];
                    blockInstance.renderer.clickHandler(event);
                } else {
                    this.renderer.clickHandler(event);
                }
                return
            }

            
            if (!isSameBlock || !anchorBlock) {
                if(!anchorBlock) {
                    event.preventDefault();
                }
                return
            }

            switch (type) {
                case 'click': {
                    anchorBlock.renderer.clickHandler(event)
                    break
                }
                case 'input': {
                    anchorBlock.renderer.inputHandler(event)
                    break
                }
                case 'keydown': {
                    anchorBlock.renderer.keydownHandler(event)
                    break
                }
                case 'keyup': {
                    anchorBlock.renderer.keyupHandler(event)
                    break
                }
                case 'compositionend': {
                    if(env.safari && !env.isMobile) {
                        this.instance.context.layout.nodes.content.contentEditable = 'true';
                    }
                    anchorBlock.renderer.composeHandler(event)
                    break
                }
                case 'compositionstart': {
                    if(env.safari && !env.isMobile) {
                        this.instance.context.layout.nodes.content.contentEditable = 'false';
                    }
                    anchorBlock.renderer.composeHandler(event)
                    break
                }
            }
        }
        const types = ['click', 'input', 'keydown', 'keyup', 'compositionend', 'compositionstart'];
        event.on(types, eventHandler);

        event.on("mousedown", (type, event) => {

            const anchorBlock = this.findBlock(event.target);
            if(anchorBlock) {
                anchorBlock.renderer.mouseDownHandler(event);
            }

        })


        event.on('selectionchange', () => {
            const { focusNode, focusOffset, anchorNode, anchorOffset, cachedCursor: cursor } = selection;
            const activedNodes = new Set<Element>()
            if (anchorNode) {
                findActivedNodes(anchorNode, anchorOffset).forEach((node) => {
                    activedNodes.add(node)
                })
            }

            if (focusNode && (focusNode !== anchorNode || focusOffset !== anchorOffset)) {
                findActivedNodes(focusNode, focusNode).forEach((node) => {
                    activedNodes.add(node)
                })
            }

            if (activedNodes.size) {
                this._cacheActivedNodes.forEach((node) => {
                    node.classList.toggle(CLASS_NAMES.ME_NODE__ACTIVED, activedNodes.has(node))
                })
                activedNodes.forEach((node) => {
                    node.classList.toggle(CLASS_NAMES.ME_NODE__ACTIVED, true)
                })
                this._cacheActivedNodes = activedNodes;
            } else {
                this._cacheActivedNodes.forEach((node) => {
                    node.classList.toggle(CLASS_NAMES.ME_NODE__ACTIVED, false)
                })
                this._cacheActivedNodes.clear()
            }

            const { anchorBlock, isSameBlock } = cursor;
            if (!isSameBlock || !anchorBlock) {
                this.focusedBlock = null;
            } else {
                this.focusedBlock = anchorBlock;
            }
        });
    }
}

export default MEContent;