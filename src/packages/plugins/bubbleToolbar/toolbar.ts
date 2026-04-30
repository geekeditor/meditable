export interface ToolbarItem {
  cmdName: string                          // '|' marks a separator
  tooltip: string
  icon: string
}

export interface ToolbarOpts {
  offset: number
  onClick: (cmdName: string) => void
}

const ROOT_CLS = 'me-bubble-toolbar'
const BTN_CLS = 'me-bubble-toolbar__btn'
const SEP_CLS = 'me-bubble-toolbar__sep'
const ACTIVE_CLS = 'me-bubble-toolbar__btn--active'
const DISABLED_CLS = 'me-bubble-toolbar__btn--disabled' // eslint-disable-line @typescript-eslint/no-unused-vars

export default class Toolbar {
  readonly rootEl: HTMLDivElement
  private buttonEls: Map<string, HTMLButtonElement> = new Map()
  private focusableButtons: HTMLButtonElement[] = []
  private focusedIndex = 0 // eslint-disable-line @typescript-eslint/no-unused-vars
  private offset: number
  private onClick: (cmdName: string) => void
  private _visible = false

  constructor(items: ToolbarItem[], opts: ToolbarOpts) {
    this.offset = opts.offset
    this.onClick = opts.onClick
    this.rootEl = document.createElement('div')
    this.rootEl.className = ROOT_CLS
    this.rootEl.setAttribute('role', 'toolbar')
    this.rootEl.setAttribute('aria-label', 'Formatting')
    this.rootEl.style.position = 'fixed'
    this.rootEl.style.top = '0'
    this.rootEl.style.left = '0'
    this.rootEl.style.visibility = 'hidden'
    this.rootEl.style.zIndex = '9999'
    this.renderItems(items)
  }

  private renderItems(items: ToolbarItem[]) {
    for (const it of items) {
      if (it.cmdName === '|') {
        const sep = document.createElement('span')
        sep.className = SEP_CLS
        sep.setAttribute('role', 'separator')
        sep.setAttribute('aria-orientation', 'vertical')
        this.rootEl.appendChild(sep)
        continue
      }
      const btn = document.createElement('button')
      btn.className = BTN_CLS
      btn.type = 'button'
      btn.dataset.cmd = it.cmdName
      btn.title = it.tooltip
      btn.setAttribute('aria-label', it.tooltip)
      btn.setAttribute('aria-pressed', 'false')
      btn.tabIndex = this.focusableButtons.length === 0 ? 0 : -1
      btn.innerHTML = it.icon
      btn.addEventListener('click', () => this.onClick(it.cmdName))
      this.rootEl.appendChild(btn)
      this.buttonEls.set(it.cmdName, btn)
      this.focusableButtons.push(btn)
    }
  }

  get visible() { return this._visible }

  show(rect: DOMRect, activeMap: Record<string, boolean>) {
    if (!this.rootEl.parentElement) document.body.appendChild(this.rootEl)
    this.applyActive(activeMap)
    this.rootEl.style.visibility = 'visible'
    this._visible = true
    this.position(rect)
  }

  update(activeMap: Record<string, boolean>) {
    this.applyActive(activeMap)
  }

  hide() {
    this.rootEl.style.visibility = 'hidden'
    this._visible = false
  }

  destroy() {
    this.rootEl.parentElement?.removeChild(this.rootEl)
    this.buttonEls.clear()
    this.focusableButtons = []
    this._visible = false
  }

  private position(rect: DOMRect) {
    const tb = this.rootEl.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let x = rect.left + rect.width / 2 - tb.width / 2
    x = Math.max(8, Math.min(x, vw - tb.width - 8))

    let y = rect.top - tb.height - this.offset
    if (y < 8) y = rect.bottom + this.offset
    if (y + tb.height > vh - 8) y = Math.max(8, vh - tb.height - 8)

    this.rootEl.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  private applyActive(activeMap: Record<string, boolean>) {
    for (const [cmd, btn] of this.buttonEls) {
      const isActive = !!activeMap[cmd]
      btn.classList.toggle(ACTIVE_CLS, isActive)
      btn.setAttribute('aria-pressed', String(isActive))
    }
  }
}
