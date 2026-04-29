// 16x16 inline SVGs for the 9 default toolbar buttons.
// Stroke-based, currentColor, so CSS controls color.

const SVG = (path: string) =>
  `<svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`

export const ICONS: Record<string, string> = {
  bold: SVG('<path d="M4 3h4a2.5 2.5 0 0 1 0 5H4z"/><path d="M4 8h5a2.5 2.5 0 0 1 0 5H4z"/>'),
  italic: SVG('<line x1="10" y1="3" x2="14" y2="3"/><line x1="2" y1="13" x2="6" y2="13"/><line x1="9" y1="3" x2="7" y2="13"/>'),
  underline: SVG('<path d="M4 3v6a4 4 0 0 0 8 0V3"/><line x1="3" y1="14" x2="13" y2="14"/>'),
  strikethrough: SVG('<line x1="2" y1="8" x2="14" y2="8"/><path d="M5 5a3 3 0 0 1 6 0"/><path d="M5 11a3 3 0 0 0 6 0"/>'),
  inline_code: SVG('<polyline points="5 4 2 8 5 12"/><polyline points="11 4 14 8 11 12"/>'),
  inline_math: SVG('<path d="M2 13l4-10h2"/><line x1="9" y1="6" x2="14" y2="11"/><line x1="14" y1="6" x2="9" y2="11"/>'),
  mark: SVG('<rect x="2" y="6" width="12" height="6" rx="1"/><line x1="2" y1="14" x2="14" y2="14"/>'),
  subscript: SVG('<polyline points="3 4 7 8 3 12"/><polyline points="9 4 13 8 9 12" opacity="0.4"/><text x="11" y="14" font-size="5" fill="currentColor" stroke="none">2</text>'),
  superscript: SVG('<polyline points="3 4 7 8 3 12"/><polyline points="9 4 13 8 9 12" opacity="0.4"/><text x="11" y="6" font-size="5" fill="currentColor" stroke="none">2</text>'),
}
