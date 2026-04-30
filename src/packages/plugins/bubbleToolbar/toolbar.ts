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
  private focusedIndex = 0
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
    this.rootEl.addEventListener('keydown', this.handleKeydown)
    document.body.appendChild(this.rootEl)
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
      btn.addEventListener('mousedown', e => e.preventDefault())
      btn.addEventListener('click', () => this.onClick(it.cmdName))
      this.rootEl.appendChild(btn)
      this.buttonEls.set(it.cmdName, btn)
      this.focusableButtons.push(btn)
    }
  }

  get visible() { return this._visible }

  show(rect: DOMRect, activeMap: Record<string, boolean>) {
    if (!this.rootEl.parentElement) document.body.appendChild(this.rootEl)  // re-attach if destroyed-and-revived
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
    this.rootEl.removeEventListener('keydown', this.handleKeydown)
    this.rootEl.parentElement?.removeChild(this.rootEl)
    this.buttonEls.clear()
    this.focusableButtons = []
    this._visible = false
  }

  private handleKeydown = (e: KeyboardEvent) => {
    const key = e.key
    const navigable = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ']
    if (!navigable.includes(key)) return

    const idx = this.focusableButtons.findIndex(b => b === document.activeElement)
    if (idx < 0) return

    let next = idx
    if (key === 'ArrowRight') next = (idx + 1) % this.focusableButtons.length
    else if (key === 'ArrowLeft') next = (idx - 1 + this.focusableButtons.length) % this.focusableButtons.length
    else if (key === 'Home') next = 0
    else if (key === 'End') next = this.focusableButtons.length - 1
    else if (key === 'Enter' || key === ' ') {
      const cmd = this.focusableButtons[idx].dataset.cmd
      if (cmd) this.onClick(cmd)
      e.preventDefault()
      return
    }

    if (next !== idx) this.setFocus(next)
    e.preventDefault()
  }

  private setFocus(index: number) {
    if (this.focusableButtons[this.focusedIndex]) {
      this.focusableButtons[this.focusedIndex].tabIndex = -1
    }
    this.focusedIndex = index
    const btn = this.focusableButtons[index]
    btn.tabIndex = 0
    btn.focus()
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
