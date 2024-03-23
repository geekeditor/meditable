import { MEBlockRendererStaticRenderOptions, MEBlockType } from "@/packages/types";
import MEBlockRenderer from "../../renderer";
import { CLASS_NAMES } from "@/packages/utils/classNames";

export default class METaskListItemRenderer extends MEBlockRenderer {
    static type: MEBlockType = "task-list-item";
    static async staticRender({data, innerHTML}:MEBlockRendererStaticRenderOptions):Promise<string> {
        const checked = !!data.meta.checked
        const checkBoxClassName = `${this.type}-checkbox`
        const contentClassName = `${this.type}-content`
        const checkBoxCheckedClassName = `${this.type}-checkbox-checked`
        const classNames = [checkBoxClassName]
        if(checked) {
            classNames.push(checkBoxCheckedClassName)
        }
        return `<${this.tagName} class="${this.type}"><span class="${classNames.join(" ")}"></span><${this.tagName} class="${contentClassName}">${innerHTML||''}</${this.tagName}></${this.tagName}>`
    }


    get checkbox() {
        return this.nodes.el.firstElementChild;
    }

    updateContent(checkUpdate?: boolean): boolean {
        if (!this.nodes.el) {
            this.nodes.el = this.make(this.tagName);
            this.nodes.el.appendChild(this.make('span', [CLASS_NAMES.ME_TASK_LIST_ITEM_CHECKBOX], {
                spellcheck: 'false',
                contenteditable: 'false'
            }))
            this.nodes.holder = this.make(this.tagName, [CLASS_NAMES.ME_TASK_LIST_ITEM_CONTENT]);
            this.nodes.el.appendChild(this.nodes.holder);

            this.mutableListeners.on(this.checkbox, 'click', this.clickCheckboxHandler.bind(this))
        }

        this.checkbox.classList.toggle(CLASS_NAMES.ME_TASK_LIST_ITEM_CHECKBOX__CHECKED, !!this.meta.checked);
        return true;
    }

    clickCheckboxHandler(event) {
        event.preventDefault();
        this.meta.checked = !this.meta.checked;
        this.checkbox.classList.toggle(CLASS_NAMES.ME_TASK_LIST_ITEM_CHECKBOX__CHECKED, !!this.meta.checked);
    }
}