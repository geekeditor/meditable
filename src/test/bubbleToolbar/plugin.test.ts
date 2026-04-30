/**
 * @jest-environment jsdom
 */
import MEditable from '@/packages/index'
import MEPlugin from '@/packages/modules/plugin'
import MEPluginBubbleToolbar from '@/packages/plugins/bubbleToolbar'

const flush = () => new Promise(r => setTimeout(r, 200))

describe('MEPluginBubbleToolbar — show/hide', () => {
  let editor: MEditable
  let container: HTMLDivElement

  beforeEach(async () => {
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
    MEditable.use(MEPluginBubbleToolbar, { showDelay: 50 })
    editor = new MEditable({ container })
    await editor.prepare()
    editor.setContent('hello world')
  })

  afterEach(() => {
    editor.destroy()
    ;(MEPlugin as any).plugins = []
  })

  test('toolbar root is created on document.body', () => {
    expect(document.querySelector('.me-bubble-toolbar')).toBeTruthy()
  })

  test('toolbar starts hidden after setContent (no selection)', async () => {
    await flush()
    const root = document.querySelector('.me-bubble-toolbar') as HTMLElement
    expect(root.style.visibility).toBe('hidden')
  })

  test('plugin handleSelectionChange with no real selection → toolbar hidden', async () => {
    // Bypass the event bus (MEContent handler is fragile under jsdom)
    // and call the plugin's handler directly. With no selection range, it should hide.
    const plugin: any = editor.context.plugin.plugins.bubbleToolbar
    plugin.handleSelectionChange()
    const root = document.querySelector('.me-bubble-toolbar') as HTMLElement
    expect(root.style.visibility).toBe('hidden')
  })
})

describe('MEPluginBubbleToolbar — show on real selection', () => {
  let editor: MEditable
  let container: HTMLDivElement

  beforeEach(async () => {
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
    MEditable.use(MEPluginBubbleToolbar, { showDelay: 0 })
    editor = new MEditable({ container })
    await editor.prepare()
    editor.setContent('hello world')
  })

  afterEach(() => {
    editor.destroy()
    ;(MEPlugin as any).plugins = []
  })

  const setRangeOverFirstText = () => {
    const tw = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    const t = tw.nextNode()
    if (!t) return null
    const range = document.createRange()
    range.setStart(t, 0)
    range.setEnd(t, (t as Text).data.length)
    // jsdom's Range.getBoundingClientRect returns all-zero; pretend selection has a real rect
    range.getBoundingClientRect = () =>
      ({ x: 100, y: 100, top: 100, left: 100, right: 200, bottom: 120, width: 100, height: 20, toJSON: () => ({}) }) as DOMRect
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)
    return t
  }

  test('non-collapsed selection → toolbar visible with all 9 buttons', () => {
    const t = setRangeOverFirstText()
    expect(t).toBeTruthy()
    const plugin: any = editor.context.plugin.plugins.bubbleToolbar
    plugin.handleSelectionChange()
    const root = document.querySelector('.me-bubble-toolbar') as HTMLElement
    expect(root.style.visibility).toBe('visible')
    expect(root.querySelectorAll('button').length).toBe(9)
  })

  test('clicking bold button calls command.execCommand("bold")', () => {
    setRangeOverFirstText()
    const plugin: any = editor.context.plugin.plugins.bubbleToolbar
    plugin.handleSelectionChange()
    const spy = jest.spyOn(editor.context.command, 'execCommand')
    const boldBtn = document.querySelector('.me-bubble-toolbar button[data-cmd="bold"]') as HTMLButtonElement
    boldBtn.click()
    expect(spy).toHaveBeenCalledWith('bold')
    spy.mockRestore()
  })
})
