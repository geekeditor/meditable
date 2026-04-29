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
