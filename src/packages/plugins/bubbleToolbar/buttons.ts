import { MENodeData } from '@/packages/types'
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
  return ({ formats }) => formats.some(f => f.type === target || f.type === cmdName)
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
