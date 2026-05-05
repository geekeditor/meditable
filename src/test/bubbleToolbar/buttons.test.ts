import { resolveItems, DEFAULT_ITEMS } from '@/packages/plugins/bubbleToolbar/buttons'

describe('resolveItems', () => {
  const allCmds = new Set([
    'bold', 'italic', 'underline', 'strikethrough',
    'inline_code', 'inline_math', 'mark', 'subscript', 'superscript',
  ])

  test('undefined input falls back to DEFAULT_ITEMS and resolves all', () => {
    const out = resolveItems(undefined, allCmds)
    const cmds = out.map(i => i.cmdName)
    for (const d of DEFAULT_ITEMS) {
      expect(cmds).toContain(d)
    }
  })

  test("'|' becomes a separator entry with cmdName === '|'", () => {
    const out = resolveItems(['bold', '|', 'italic'], allCmds)
    expect(out.map(i => i.cmdName)).toEqual(['bold', '|', 'italic'])
  })

  test('string cmdName auto-fills tooltip, icon, isActive', () => {
    const out = resolveItems(['bold'], allCmds)
    expect(out[0].tooltip).toBe('bold')
    expect(out[0].icon).toContain('<svg')
    expect(typeof out[0].isActive).toBe('function')
    expect(typeof out[0].isEnabled).toBe('function')
  })

  test('unknown cmdName is filtered with a warn', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const out = resolveItems(['bold', 'nope', 'italic'], allCmds)
    expect(out.map(i => i.cmdName)).toEqual(['bold', 'italic'])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  test('custom item passes isActive through', () => {
    const isActive = jest.fn(() => true)
    const out = resolveItems(
      [{ cmdName: 'link', icon: '<svg/>', tooltip: 'Link', isActive }],
      allCmds,
    )
    expect(out[0].isActive({ formats: [] })).toBe(true)
    expect(isActive).toHaveBeenCalled()
  })
})

import { getActiveMap } from '@/packages/plugins/bubbleToolbar/buttons'
import { MEBlockData, MECursorState } from '@/packages/types'

// Helper: build a fake content tree with one paragraph block of given text.
const buildContent = (paragraphs: { id: string; text: string }[]): MEBlockData => ({
  id: 'root',
  type: 'document',
  children: paragraphs.map(p => ({
    id: p.id,
    type: 'paragraph',
    text: p.text,
  })),
}) as any

const items = (cmd: string) => [
  {
    cmdName: cmd,
    tooltip: cmd,
    icon: '',
    isActive: ({ formats }: { formats: any[] }) => formats.some(f => f.type === ({
      bold: 'strong', italic: 'em', inline_code: 'inline_code',
    }[cmd] ?? cmd)),
    isEnabled: () => true,
  },
]

describe('getActiveMap', () => {
  test('selection fully inside <strong> → bold:true', () => {
    const content = buildContent([{ id: 'b1', text: 'hello **world** rest' }])
    const cursor: MECursorState = {
      anchor: { offset: 8 }, focus: { offset: 13 },  // inside the bolded text
      anchorBlockId: 'b1', focusBlockId: 'b1',
      isSameBlock: true, isCollapsed: false,
    }
    const map = getActiveMap(items('bold'), cursor, content)
    expect(map.bold).toBe(true)
  })

  test('selection spans two blocks where only first is bold → bold:false (intersection)', () => {
    const content = buildContent([
      { id: 'b1', text: '**all bold here**' },
      { id: 'b2', text: 'plain text here' },
    ])
    const cursor: MECursorState = {
      anchor: { offset: 2 }, focus: { offset: 5 },
      anchorBlockId: 'b1', focusBlockId: 'b2',
      isSameBlock: false, isCollapsed: false,
    }
    const map = getActiveMap(items('bold'), cursor, content)
    expect(map.bold).toBe(false)
  })

  test('empty selection → all false', () => {
    const content = buildContent([{ id: 'b1', text: 'plain' }])
    const cursor: MECursorState = {
      anchor: { offset: 0 }, focus: { offset: 0 },
      anchorBlockId: 'b1', focusBlockId: 'b1',
      isSameBlock: true, isCollapsed: true,
    }
    const map = getActiveMap(items('bold'), cursor, content)
    expect(map.bold).toBe(false)
  })

  test('selection inside <u>...</u> → underline:true (defaultIsActive matches html_tag.tag)', () => {
    const content = buildContent([{ id: 'b1', text: 'a <u>under</u> b' }])
    const cursor: MECursorState = {
      anchor: { offset: 5 }, focus: { offset: 10 },  // inside the <u>under</u>
      anchorBlockId: 'b1', focusBlockId: 'b1',
      isSameBlock: true, isCollapsed: false,
    }
    const resolved = resolveItems(['underline'], new Set(['underline']))
    const map = getActiveMap(resolved, cursor, content)
    expect(map.underline).toBe(true)
  })

  test('selection inside <mark>...</mark> → mark:true', () => {
    const content = buildContent([{ id: 'b1', text: 'a <mark>hi</mark> b' }])
    const cursor: MECursorState = {
      anchor: { offset: 8 }, focus: { offset: 10 },  // inside the <mark>hi</mark>
      anchorBlockId: 'b1', focusBlockId: 'b1',
      isSameBlock: true, isCollapsed: false,
    }
    const resolved = resolveItems(['mark'], new Set(['mark']))
    const map = getActiveMap(resolved, cursor, content)
    expect(map.mark).toBe(true)
  })

  test('selection inside ^sup^ → superscript:true', () => {
    const content = buildContent([{ id: 'b1', text: 'a ^sup^ b' }])
    const cursor: MECursorState = {
      anchor: { offset: 3 }, focus: { offset: 6 },  // inside ^sup^
      anchorBlockId: 'b1', focusBlockId: 'b1',
      isSameBlock: true, isCollapsed: false,
    }
    const resolved = resolveItems(['superscript'], new Set(['superscript']))
    const map = getActiveMap(resolved, cursor, content)
    expect(map.superscript).toBe(true)
  })

  test('isActive throwing → that entry false + warn', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const content = buildContent([{ id: 'b1', text: 'hello' }])
    const cursor: MECursorState = {
      anchor: { offset: 0 }, focus: { offset: 5 },
      anchorBlockId: 'b1', focusBlockId: 'b1',
      isSameBlock: true, isCollapsed: false,
    }
    const bad = [{
      cmdName: 'crash',
      tooltip: '',
      icon: '',
      isActive: () => { throw new Error('boom') },
      isEnabled: () => true,
    }]
    const map = getActiveMap(bad, cursor, content)
    expect(map.crash).toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

import { getEnabledMap } from '@/packages/plugins/bubbleToolbar/buttons'

describe('getEnabledMap', () => {
  const items2 = [
    { cmdName: 'bold',        tooltip: '', icon: '', isActive: () => false, isEnabled: () => true },
    { cmdName: 'inline_code', tooltip: '', icon: '', isActive: () => false, isEnabled: () => true },
  ]

  test('selection NOT inside scoped inline → all enabled', () => {
    const content = buildContent([{ id: 'b1', text: 'plain text' }])
    const cursor: any = {
      anchor: { offset: 0 }, focus: { offset: 5 },
      anchorBlockId: 'b1', focusBlockId: 'b1',
      isSameBlock: true, isCollapsed: false,
    }
    const map = getEnabledMap(items2, cursor, content)
    expect(map.bold).toBe(true)
    expect(map.inline_code).toBe(true)
  })

  test('selection inside `code` → only inline_code enabled', () => {
    const content = buildContent([{ id: 'b1', text: 'see `code` here' }])
    const cursor: any = {
      anchor: { offset: 5 }, focus: { offset: 9 },          // inside the backticks
      anchorBlockId: 'b1', focusBlockId: 'b1',
      isSameBlock: true, isCollapsed: false,
    }
    const map = getEnabledMap(items2, cursor, content)
    expect(map.bold).toBe(false)
    expect(map.inline_code).toBe(true)
  })
})
