import domUtils from "@/packages/utils/domUtils";
import MEModule from "../../module";

export default class MEEventHandler extends MEModule<{ el: HTMLElement; holder: HTMLElement }> {


    isComposing: boolean = false;

    backspaceHandler(event: KeyboardEvent) {}
    deleteHandler(event: KeyboardEvent) {}
    enterHandler(event: KeyboardEvent) {}
    arrowHandler(event: KeyboardEvent) {}
    tabHandler(event: KeyboardEvent) {}

    mouseDownHandler(event: Event) {}
    clickHandler(event: Event) {}
    keydownHandler(event: KeyboardEvent) {
        switch (event.key) {
            case domUtils.keys.Backspace:
                this.backspaceHandler(event);
                break;

            case domUtils.keys.Delete:
                this.deleteHandler(event);
                break;

            case domUtils.keys.Enter:
                if (!this.isComposing) {
                    this.enterHandler(event);
                }
                break;

            case domUtils.keys.ArrowUp:
            case domUtils.keys.ArrowDown:
            case domUtils.keys.ArrowLeft:
            case domUtils.keys.ArrowRight:
                if (!this.isComposing) {
                    this.arrowHandler(event);
                }
                break;

            case domUtils.keys.Tab:
                this.tabHandler(event);
                break;
            default:
                break;
        }
    }
    keyupHandler(event: KeyboardEvent) {}
    composeHandler(event: CompositionEvent) {
        this.isComposing = event.type === 'compositionstart';
        if (event.type === 'compositionend') {
            this.forceUpdate(event);
        }
    }
    inputHandler(event: InputEvent) {
        if (this.isComposing || event.isComposing || /historyUndo|historyRedo/.test(event.inputType)) {
            return;
        }
        this.forceUpdate(event);
    }
    forceUpdate(event?: InputEvent|CompositionEvent) {
        throw (new Error('Inherit in subclasses'))
    }
}