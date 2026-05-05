import MEPluginBase from '../base'
import { MEInstance, MECursorState, MEPluginOptions } from '@/packages/types'
import { debounce } from '@/packages/utils/utils'
import Toolbar, { ToolbarItem } from './toolbar'
import {
  resolveItems, getActiveMap, getEnabledMap, ResolvedItem,
  BLACKLIST_BLOCK_TYPES, CustomButtonItem,
} from './buttons'

export interface BubbleToolbarOptions extends MEPluginOptions {
  items?: Array<string | '|' | CustomButtonItem>
  showDelay?: number
  offset?: number
}

export default class MEPluginBubbleToolbar extends MEPluginBase {
  static pluginName = 'bubbleToolbar'

  private toolbar!: Toolbar
  private items!: ResolvedItem[]
  private cachedCursor: MECursorState | null = null
  private lastActiveMap: Record<string, boolean> = {}
  private lastEnabledMap: Record<string, boolean> = {}
  private updateScheduled!: () => void
  private scrollListener?: () => void

  constructor(instance: MEInstance, options?: BubbleToolbarOptions) {
    super(instance, options)
  }

  async prepare(): Promise<boolean> {
    const opts = this.options as BubbleToolbarOptions
    const showDelay = opts.showDelay ?? 150
    const offset = opts.offset ?? 8

    const cmdRegistry = (this.instance.context.command as any).commands ?? {}
    const registeredCmds = new Set<string>(Object.keys(cmdRegistry))
    this.items = resolveItems(opts.items, registeredCmds)

    const toolbarItems: ToolbarItem[] = this.items.map(it => ({
      cmdName: it.cmdName,
      tooltip: it.tooltip,
      icon: it.icon,
    }))

    this.toolbar = new Toolbar(toolbarItems, {
      offset,
      onClick: (cmd) => this.execCmd(cmd),
    })

    this.updateScheduled = debounce(() => this.handleSelectionChange(), showDelay)

    const { event } = this.instance.context
    event.on('selectionchange', this.updateScheduled)
    event.on('mouseup', this.updateScheduled)
    event.on('keyup', this.updateScheduled)

    this.toolbar.rootEl.addEventListener('focusin', () => {
      if (!this.cachedCursor) {
        this.cachedCursor = this.instance.getCursor()
      }
    })
    this.toolbar.rootEl.addEventListener('focusout', (e) => {
      const next = (e as FocusEvent).relatedTarget as Node | null
      if (!next || !this.toolbar.rootEl.contains(next)) {
        this.cachedCursor = null
      }
    })

    this.mutableListeners.on(this.instance.context.editable.document, 'keydown', (e) => {
      const ke = e as KeyboardEvent
      if (ke.key === 'Escape' && this.toolbar.visible) {
        this.toolbar.hide()
        this.cachedCursor = null
        this.instance.context.editable.holder.focus()
      }
    })

    // Tab into the toolbar from the editor when toolbar is visible.
    // Capture phase so we run before the editor's own Tab (insertTab) handler.
    this.mutableListeners.on(this.instance.context.editable.document, 'keydown', (e) => {
      const ke = e as KeyboardEvent
      if (ke.key !== 'Tab' || ke.shiftKey) return
      if (!this.toolbar.visible) return
      if (this.toolbar.rootEl.contains(document.activeElement)) return
      this.cachedCursor = this.instance.getCursor()
      ke.preventDefault()
      ke.stopPropagation()
      this.toolbar.focusFirst()
    }, true)

    let rafId = 0
    const onScrollOrResize = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        if (this.toolbar.visible) this.handleSelectionChange()
      })
    }
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    this.scrollListener = onScrollOrResize

    return true
  }

  private handleSelectionChange() {
    const { editable, content } = this.instance.context
    if (!editable.actived) return this.toolbar.hide()

    if (
      document.activeElement &&
      this.toolbar.rootEl.contains(document.activeElement)
    ) {
      return    // keep visible while user is in the toolbar
    }

    const winSel = editable.window.getSelection()
    let range: Range | null = null
    if (winSel && winSel.rangeCount > 0) {
      try { range = winSel.getRangeAt(0) } catch { /* no range */ }
    }
    if (!range || range.collapsed) return this.toolbar.hide()

    const cursor = this.instance.getCursor()
    if (!cursor.anchorBlockId) return this.toolbar.hide()

    // Cross-block selection: format command only handles same-block, so don't
    // surface buttons that would silently no-op.
    if (cursor.focusBlockId && cursor.anchorBlockId !== cursor.focusBlockId) {
      return this.toolbar.hide()
    }

    const anchorBlock = content.queryBlock(cursor.anchorBlockId)
    if (anchorBlock && BLACKLIST_BLOCK_TYPES.has(anchorBlock.type)) {
      return this.toolbar.hide()
    }

    let rect: DOMRect
    try {
      rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        const rects = range.getClientRects()
        if (rects.length > 0) rect = rects[0] as DOMRect
        else return this.toolbar.hide()
      }
    } catch {
      return this.toolbar.hide()
    }

    this.lastActiveMap = getActiveMap(this.items, cursor, content.data)
    this.lastEnabledMap = getEnabledMap(this.items, cursor, content.data)
    this.toolbar.show(rect, this.lastActiveMap, this.lastEnabledMap)
  }

  private execCmd(cmdName: string) {
    if (cmdName === '|') return
    const inToolbar = !!(document.activeElement &&
      this.toolbar.rootEl.contains(document.activeElement))
    if (inToolbar && this.cachedCursor) {
      this.instance.setCursor(this.cachedCursor)
    }
    this.instance.context.command.execCommand(cmdName)
  }

  destroy() {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true)
      window.removeEventListener('resize', this.scrollListener)
    }
    this.toolbar?.destroy()
    super.destroy()
  }
}
