import { MENodeData, MEBlockData, MECursorState } from '@/packages/types'
import { tokenizer } from '@/packages/modules/content/inlineRenderers/tokenizer'
import { getFormatsInRange } from '@/packages/modules/content/commands/format'
import { ICONS } from './icons'

export const DEFAULT_ITEMS: string[] = [
  'bold', 'italic', 'underline', 'strikethrough',
  '|',
  'inline_code', 'inline_math',
  '|',
  'mark', 'subscript', 'superscript',
]

export const BLACKLIST_BLOCK_TYPES: ReadonlySet<string> = new Set([
  'code_block', 'math_block', 'diagram_block', 'html_block', 'frontmatter',
])

export interface CustomButtonItem {
  cmdName: string
  tooltip?: string
  icon: string
  isActive?: (ctx: ActiveCtx) => boolean
  isEnabled?: (ctx: ActiveCtx) => boolean
}

export interface ActiveCtx {
  formats: MENodeData[]
}

export interface ResolvedItem {
  cmdName: string                                  // '|' marks a separator
  tooltip: string
  icon: string
  isActive: (ctx: ActiveCtx) => boolean
  isEnabled: (ctx: ActiveCtx) => boolean
}

const COMMAND_TYPE_MAP: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  inline_code: 'inline_code',
  subscript: 'sub',
  superscript: 'sup',
  underline: 'u',
  strikethrough: 'del',
  mark: 'mark',
  inline_math: 'inline_math',
}

export function defaultIsActive(cmdName: string): (ctx: ActiveCtx) => boolean {
  const target = COMMAND_TYPE_MAP[cmdName] ?? cmdName
  return ({ formats }) => formats.some(f =>
    f.type === target ||
    f.type === cmdName ||
    (f.type === 'html_tag' && f.tag === target)
  )
}

const alwaysEnabled = () => true

const SEPARATOR: ResolvedItem = {
  cmdName: '|',
  tooltip: '',
  icon: '',
  isActive: () => false,
  isEnabled: alwaysEnabled,
}

type RawItem = string | '|' | CustomButtonItem

export function resolveItems(
  raw: RawItem[] | undefined,
  registeredCmds: Set<string>,
): ResolvedItem[] {
  const source = raw ?? DEFAULT_ITEMS
  const out: ResolvedItem[] = []
  for (const item of source) {
    if (item === '|') {
      out.push(SEPARATOR)
      continue
    }
    if (typeof item === 'string') {
      if (!registeredCmds.has(item)) {
        console.warn(`[bubbleToolbar] unknown cmdName "${item}", skipped`)
        continue
      }
      out.push({
        cmdName: item,
        tooltip: item,
        icon: ICONS[item] ?? '',
        isActive: defaultIsActive(item),
        isEnabled: alwaysEnabled,
      })
      continue
    }
    out.push({
      cmdName: item.cmdName,
      tooltip: item.tooltip ?? item.cmdName,
      icon: item.icon,
      isActive: item.isActive ?? defaultIsActive(item.cmdName),
      isEnabled: item.isEnabled ?? alwaysEnabled,
    })
  }
  return out
}

function findBlock(root: MEBlockData, id: string | undefined): MEBlockData | null {
  if (!id) return null
  if (root.id === id) return root
  for (const c of root.children ?? []) {
    const hit = findBlock(c, id)
    if (hit) return hit
  }
  return null
}

function flattenLeafBlocksBetween(
  root: MEBlockData,
  startId: string,
  endId: string,
): MEBlockData[] {
  const out: MEBlockData[] = []
  let started = false
  let done = false
  ;(function walk(node: MEBlockData) {
    if (done) return
    const isLeaf = !node.children || node.children.length === 0
    if (isLeaf && typeof node.text === 'string') {
      if (node.id === startId) started = true
      if (started) out.push(node)
      if (node.id === endId) done = true
      return
    }
    for (const c of node.children ?? []) walk(c)
  })(root)
  return out
}

function formatsForBlock(block: MEBlockData, start: number, end: number) {
  const tokens = tokenizer(block.text ?? '')
  return getFormatsInRange(
    { offset: start },
    { offset: end },
    tokens,
  ).formats
}

export function getActiveMap(
  items: ResolvedItem[],
  cursor: MECursorState,
  contentData: MEBlockData,
): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  if (!cursor.anchorBlockId || !cursor.focusBlockId) {
    for (const it of items) if (it.cmdName !== '|') map[it.cmdName] = false
    return map
  }

  const sameBlock = cursor.anchorBlockId === cursor.focusBlockId
  let perBlockFormats: MENodeData[][] = []

  try {
    if (sameBlock) {
      const block = findBlock(contentData, cursor.anchorBlockId)
      if (!block) throw new Error('block not found')
      const start = Math.min(cursor.anchor.offset, cursor.focus.offset)
      const end = Math.max(cursor.anchor.offset, cursor.focus.offset)
      perBlockFormats = [formatsForBlock(block, start, end)]
    } else {
      const blocks = flattenLeafBlocksBetween(
        contentData,
        cursor.anchorBlockId,
        cursor.focusBlockId,
      )
      perBlockFormats = blocks.map((b, i) => {
        const txt = b.text ?? ''
        const start = i === 0 ? cursor.anchor.offset : 0
        const end = i === blocks.length - 1 ? cursor.focus.offset : txt.length
        return formatsForBlock(b, Math.min(start, end), Math.max(start, end))
      })
    }
  } catch (e) {
    console.warn('[bubbleToolbar] getActiveMap failed', e)
    for (const it of items) if (it.cmdName !== '|') map[it.cmdName] = false
    return map
  }

  for (const it of items) {
    if (it.cmdName === '|') continue
    try {
      // Multi-block intersection: every block must be active.
      map[it.cmdName] = perBlockFormats.length > 0
        && perBlockFormats.every(formats => it.isActive({ formats }))
    } catch (e) {
      console.warn(`[bubbleToolbar] isActive("${it.cmdName}") threw`, e)
      map[it.cmdName] = false
    }
  }
  return map
}

const SCOPED_INLINE = new Set(['inline_code', 'inline_math'])

export function getEnabledMap(
  items: ResolvedItem[],
  cursor: MECursorState,
  contentData: MEBlockData,
): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  if (!cursor.anchorBlockId) {
    for (const it of items) if (it.cmdName !== '|') map[it.cmdName] = true
    return map
  }

  let scoped: string | null = null
  try {
    const block = findBlock(contentData, cursor.anchorBlockId)
    if (block && cursor.anchorBlockId === cursor.focusBlockId) {
      const start = Math.min(cursor.anchor.offset, cursor.focus.offset)
      const end = Math.max(cursor.anchor.offset, cursor.focus.offset)
      const formats = formatsForBlock(block, start, end)
      const hit = formats.find(f => SCOPED_INLINE.has(f.type))
      if (hit) scoped = hit.type
    }
  } catch (e) {
    console.warn('[bubbleToolbar] getEnabledMap failed', e)
  }

  for (const it of items) {
    if (it.cmdName === '|') continue
    map[it.cmdName] = !scoped || it.cmdName === scoped
  }
  return map
}
