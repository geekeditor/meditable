import MEModule from "./module";

export default class MEDragDrop extends MEModule {
    
    async prepare(): Promise<boolean> {
        this.dispatchEvents()
        return true;
    }

    private dispatchEvents() {
        const { event, editable } = this.instance.context;
        const { selection } = editable;

        event.on("drop", async (type, event) => {
            await this.processDrop(event as DragEvent);
        })

        event.on("dragstart", (type, event) => {
            this.processDragStart()
        })

        event.on("dragover", (type, event) => {
            this.processDragOver(event as DragEvent);
        });
    }
    private async processDrop(dropEvent: DragEvent): Promise<void> {
        const {
            content,
            clipboard,
        } = this.instance.context;

        dropEvent.preventDefault();

        const targetBlock = content.dropTargetBlock || content.lastChild; 
        content.clearDropTargetBlock();

        if (targetBlock) {
            targetBlock.renderer.setCursor({focus: {offset: targetBlock.renderer.text.length}})
            await clipboard.processDataTransfer(targetBlock, dropEvent.dataTransfer, true);
        }
    }

    private processDragStart(): void {
    }

    private processDragOver(dragEvent: DragEvent): void {
        dragEvent.preventDefault();
    }
}
