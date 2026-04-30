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
