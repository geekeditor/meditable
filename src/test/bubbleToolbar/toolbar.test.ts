/**
 * @jest-environment jsdom
 */
import Toolbar, { ToolbarItem } from '@/packages/plugins/bubbleToolbar/toolbar'

const items: ToolbarItem[] = [
  { cmdName: 'bold', tooltip: 'Bold', icon: '<svg id="bi"></svg>' },
  { cmdName: '|', tooltip: '', icon: '' },
  { cmdName: 'italic', tooltip: 'Italic', icon: '<svg id="ii"></svg>' },
]

const fakeRect = { left: 100, top: 100, right: 200, bottom: 120, width: 100, height: 20 } as DOMRect

describe('Toolbar lifecycle', () => {
  let onClick: jest.Mock
  beforeEach(() => {
    onClick = jest.fn()
    document.body.innerHTML = ''
  })

  test('show() mounts root to document.body and is visible', () => {
    const tb = new Toolbar(items, { offset: 8, onClick })
    tb.show(fakeRect, { bold: false, italic: false })
    expect(tb.rootEl.parentElement).toBe(document.body)
    expect(tb.visible).toBe(true)
    tb.destroy()
  })

  test('hide() makes invisible but DOM stays in body', () => {
    const tb = new Toolbar(items, { offset: 8, onClick })
    tb.show(fakeRect, { bold: false, italic: false })
    tb.hide()
    expect(tb.visible).toBe(false)
    expect(tb.rootEl.parentElement).toBe(document.body)
    tb.destroy()
  })

  test('destroy() removes root from DOM and detaches listeners', () => {
    const tb = new Toolbar(items, { offset: 8, onClick })
    tb.show(fakeRect, { bold: false, italic: false })
    tb.destroy()
    expect(tb.rootEl.parentElement).toBeNull()
  })

  test('renders one button per non-separator item with icon HTML', () => {
    const tb = new Toolbar(items, { offset: 8, onClick })
    tb.show(fakeRect, { bold: false, italic: false })
    const buttons = tb.rootEl.querySelectorAll('button')
    expect(buttons.length).toBe(2)
    expect(tb.rootEl.querySelector('#bi')).toBeTruthy()
    expect(tb.rootEl.querySelector('#ii')).toBeTruthy()
    tb.destroy()
  })
})

describe('Toolbar positioning', () => {
  let onClick: jest.Mock
  let tb: Toolbar
  beforeEach(() => {
    onClick = jest.fn()
    document.body.innerHTML = ''
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
    tb = new Toolbar(items, { offset: 8, onClick })
    Object.defineProperty(tb.rootEl, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, right: 200, bottom: 40, width: 200, height: 40 }),
      configurable: true,
    })
  })
  afterEach(() => tb.destroy())

  const rectAt = (left: number, top: number, w = 100, h = 20): DOMRect =>
    ({ left, top, right: left + w, bottom: top + h, width: w, height: h }) as DOMRect

  test('mid-viewport selection → toolbar above (rect.top - height - offset)', () => {
    tb.show(rectAt(400, 300), {})
    expect(tb.rootEl.style.transform).toBe('translate3d(350px, 252px, 0)')
  })

  test('selection near top of viewport → flips below', () => {
    tb.show(rectAt(400, 10), {})
    expect(tb.rootEl.style.transform).toBe('translate3d(350px, 38px, 0)')
  })

  test('selection at left edge → x clamped to 8', () => {
    tb.show(rectAt(0, 300), {})
    expect(tb.rootEl.style.transform).toContain('translate3d(8px,')
  })

  test('selection at right edge → x clamped to viewport - width - 8', () => {
    tb.show(rectAt(1020, 300), {})
    expect(tb.rootEl.style.transform).toContain('translate3d(816px,')
  })
})

describe('Toolbar.update', () => {
  let onClick: jest.Mock
  let tb: Toolbar
  beforeEach(() => {
    onClick = jest.fn()
    document.body.innerHTML = ''
    tb = new Toolbar(items, { offset: 8, onClick })
    Object.defineProperty(tb.rootEl, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, right: 200, bottom: 40, width: 200, height: 40 }),
      configurable: true,
    })
  })
  afterEach(() => tb.destroy())

  test('update flips active class on/off', () => {
    tb.show(fakeRect, { bold: false, italic: false })
    const boldBtn = tb.rootEl.querySelector('button[data-cmd="bold"]')!
    expect(boldBtn.classList.contains('me-bubble-toolbar__btn--active')).toBe(false)

    tb.update({ bold: true, italic: false })
    expect(boldBtn.classList.contains('me-bubble-toolbar__btn--active')).toBe(true)
    expect(boldBtn.getAttribute('aria-pressed')).toBe('true')

    tb.update({ bold: false, italic: false })
    expect(boldBtn.classList.contains('me-bubble-toolbar__btn--active')).toBe(false)
  })

  test('update does not call position()', () => {
    tb.show(fakeRect, { bold: false, italic: false })
    const before = tb.rootEl.style.transform
    tb.update({ bold: true })
    expect(tb.rootEl.style.transform).toBe(before)
  })
})

describe('Toolbar keyboard navigation', () => {
  let onClick: jest.Mock
  let tb: Toolbar
  let buttons: HTMLButtonElement[]
  beforeEach(() => {
    onClick = jest.fn()
    document.body.innerHTML = ''
    tb = new Toolbar(items, { offset: 8, onClick })
    Object.defineProperty(tb.rootEl, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, right: 200, bottom: 40, width: 200, height: 40 }),
      configurable: true,
    })
    tb.show(fakeRect, {})
    buttons = Array.from(tb.rootEl.querySelectorAll('button'))
  })
  afterEach(() => tb.destroy())

  const press = (key: string) => {
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    tb.rootEl.dispatchEvent(ev)
    return ev
  }

  test('initial: first button tabindex=0, others -1', () => {
    expect(buttons[0].tabIndex).toBe(0)
    expect(buttons[1].tabIndex).toBe(-1)
  })

  test('ArrowRight moves focus to next button', () => {
    buttons[0].focus()
    press('ArrowRight')
    expect(document.activeElement).toBe(buttons[1])
    expect(buttons[0].tabIndex).toBe(-1)
    expect(buttons[1].tabIndex).toBe(0)
  })

  test('ArrowRight on last wraps to first', () => {
    buttons[1].focus()
    press('ArrowRight')
    expect(document.activeElement).toBe(buttons[0])
  })

  test('ArrowLeft on first wraps to last', () => {
    buttons[0].focus()
    press('ArrowLeft')
    expect(document.activeElement).toBe(buttons[1])
  })

  test('Home jumps to first, End to last', () => {
    buttons[1].focus()
    press('Home')
    expect(document.activeElement).toBe(buttons[0])
    press('End')
    expect(document.activeElement).toBe(buttons[1])
  })

  test('Enter triggers onClick(cmdName) for focused button', () => {
    buttons[0].focus()
    press('Enter')
    expect(onClick).toHaveBeenCalledWith('bold')
  })

  test('Space triggers onClick', () => {
    buttons[1].focus()
    press(' ')
    expect(onClick).toHaveBeenCalledWith('italic')
  })

  test('navigation keys preventDefault to stop page scroll', () => {
    buttons[0].focus()
    const ev = press('ArrowRight')
    expect(ev.defaultPrevented).toBe(true)
  })
})
