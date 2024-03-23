import { debounce } from '@/packages/utils/utils';
import $ from '@/packages/utils/domUtils';
import MEModule from './module'
import { CLASS_NAMES } from '@/packages/utils/classNames';
import { MELayoutNodes } from '../types';


export default class MELayout extends MEModule {

    readonly nodes: MELayoutNodes = {} as any;

    private containerRectCache!: DOMRect | null;

    private resizeDebouncer: () => void = debounce(() => {
        this.containerResize();
    }, 200);

    /**
     * Resize handler
     */
    private containerResize(): void {
        /**
         * Invalidate scroll zone size cached, because it may be changed
         */
        this.containerRectCache = null;
    }

    public get containerRect(): DOMRect {
        if (this.containerRectCache) {
            return this.containerRectCache;
        }
        this.containerRectCache = this.nodes.scroller.getBoundingClientRect() as DOMRect;
        return this.containerRectCache;
    }

    public async prepare() {

        /**
         * Make main MELayout elements
         */
        await this.make();

        const observer = new ResizeObserver(entries => {
            this.resizeDebouncer()
        });
        observer.observe(this.nodes.scroller);
        return true;
    }

    public toggleFocusMode(focusMode: boolean) {
        this.instance.setOption("focusMode", focusMode);
        this.nodes.editor.classList.toggle(`${CLASS_NAMES.MEUI_EDITOR__FOCUS_MODE}`, focusMode);
    }

    public destroy(): void {
        this.nodes.holder.innerHTML = '';
    }

    private async make(): Promise<void> {

        this.nodes.holder = this.instance.container;

        await this.makeWithCommonMode();

    }

    private makeEditor() {

        this.nodes.wrapper = $.make('div', [
            CLASS_NAMES.MEUI_WRAPPER,
        ])
        this.nodes.scroller = $.make('div', [
            CLASS_NAMES.MEUI_SCROLLER,
        ])
        this.nodes.presentation = $.make('div', [
            CLASS_NAMES.MEUI_PRESENTATION,
        ]);

        this.nodes.holder.appendChild(this.nodes.wrapper);
        this.nodes.wrapper.appendChild(this.nodes.scroller);
        this.nodes.wrapper.appendChild(this.nodes.presentation);

        const classes = [
            CLASS_NAMES.MEUI_EDITOR,
        ]
        if (this.instance.options.focusMode) {
            classes.push(CLASS_NAMES.MEUI_EDITOR__FOCUS_MODE)
        }

        this.nodes.editor = $.make('div', classes);
        this.nodes.scroller.appendChild(this.nodes.editor);

        this.mutableListeners.on(this.nodes.scroller, 'scroll', (event: Event) => {
            const scrollerState = this.scrollerState;
            this.nodes.presentation.classList.toggle(`${CLASS_NAMES.MEUI_SCROLLER_DECORATION}`, scrollerState.scrollTop > 4);
            this.instance.context.event.trigger('scroll', scrollerState)
        })
    }

    get scrollerState() {
        const { scrollTop, scrollHeight } = this.nodes.scroller;
        const containerRect = this.containerRect;
        this.nodes.presentation.classList.toggle(`${CLASS_NAMES.MEUI_SCROLLER_DECORATION}`, scrollTop > 4);

        const pointX = containerRect.x + containerRect.width / 2.0;
        const pointY = containerRect.y;

        const elements = this.instance.context.editable.document.elementsFromPoint(pointX, pointY);
        const targetBlock = elements.find((el) => el.classList.contains(`${CLASS_NAMES.ME_BLOCK}`));
        return {
            scrollTop, scrollTopBlockId: targetBlock && (targetBlock as HTMLElement).dataset.id
        }

    }

    private async makeWithCommonMode() {

        this.makeEditor();

        this.nodes.zone = $.make('div', CLASS_NAMES.MEUI_EDITOR_ZONE);
        this.nodes.editor.appendChild(this.nodes.zone);
        this.nodes.content = $.make('div', [CLASS_NAMES.MEUI_EDITOR_CONTENT, CLASS_NAMES.ME_CONTENT]);
        this.nodes.content.dataset.typeset = 'default'
        this.nodes.zone.appendChild(this.nodes.content);
        this.instance.context.editable.mount(this.nodes.content, this.nodes.content.ownerDocument.getSelection());
    }

}