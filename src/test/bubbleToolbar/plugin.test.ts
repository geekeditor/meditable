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
