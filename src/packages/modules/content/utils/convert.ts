import { MEBlockData, MEBlockInstance, MEBlockRendererInstance, MEBlockType } from "@/packages/types"
import { generateId } from "@/packages/utils/utils";

const INLINE_UPDATE_FRAGMENTS = [
  '(?:^|\n) {0,3}([*+-] {1,4})', // Bullet list
  '^(\\[[x ]{1}\\] {1,4})', // Task list **match from beginning**
  '(?:^|\n) {0,3}(\\d{1,9}(?:\\.|\\)) {1,4})', // Order list
  '(?:^|\n) {0,3}(#{1,6})(?=\\s{1,}|$)', // ATX headings
  '^(?:[\\s\\S]+?)\\n {0,3}(\\={3,}|\\-{3,})(?= {1,}|$)', // Setext headings **match from beginning**
  '(?:^|\n) {0,3}(>).+', // Block quote
  '^( {4,})', // Indent code **match from beginning**
  // '^(\\[\\^[^\\^\\[\\]\\s]+?(?<!\\\\)\\]: )', // Footnote **match from beginning**
  '(?:^|\n) {0,3}((?:\\* *\\* *\\*|- *- *-|_ *_ *_)[ \\*\\-\\_]*)(?=\n|$)' // Thematic break
]

export const INLINE_UPDATE_REG = new RegExp(INLINE_UPDATE_FRAGMENTS.join('|'), 'i')
export const TABLE_BLOCK_REG = /^\|.*?(\\*)\|.*?(\\*)\|/
export const MATH_BLOCK_REG = /^\$\$/
export const CODE_BLOCK_REG = /(^ {0,3}`{3,})([^` ]*)/
export const HTML_BLOCK_REG = /^<([a-zA-Z\d-]+)(?=\s|>)[^<>]*?>$/
export function convertIfNeeded(text: string, focusOffset?: number) {

  const blockRenderer = this as MEBlockRendererInstance;

  const [
    match,
    bulletList,
    taskList,
    orderList,
    atxHeading,
    setextHeading,
    blockquote,
    indentedCodeBlock,
    thematicBreak
  ] = text.match(INLINE_UPDATE_REG) || []

  let converted:MEBlockInstance|null = null;
  switch (true) {
    case (!!thematicBreak && new Set(thematicBreak.split('').filter(i => /\S/.test(i))).size === 1):
      converted = convertToThematicBreak.call(blockRenderer, text, focusOffset)
      break

    case !!bulletList:
      converted = convertToList.call(blockRenderer, text, focusOffset)
      break

    case !!orderList:
      converted = convertToList.call(blockRenderer, text, focusOffset)
      break

    case !!taskList:
      converted = convertToTaskList.call(blockRenderer, text, focusOffset)
      break

    case !!atxHeading:
      converted = convertToAtxHeading.call(blockRenderer, atxHeading, text, focusOffset)
      break

    case !!setextHeading:
      converted = convertToSetextHeading.call(blockRenderer, setextHeading, text, focusOffset)
      break

    case !!blockquote:
      converted = convertToBlockQuote.call(blockRenderer, text, focusOffset)
      break

    case !!indentedCodeBlock:
      converted = convertToIndentedCodeBlock.call(blockRenderer, text, focusOffset)
      break

    case !match:
    default:
      converted = convertToParagraph.call(blockRenderer, text, false, focusOffset)
      break
  }

  return converted;
}

// Thematic Break
function convertToThematicBreak(text: string, focusOffset?: number) {
  const blockRenderer = this as MEBlockRendererInstance;
  if (blockRenderer.block.type === 'thematic-break') {
    return null;
  }

  const { editable } = blockRenderer.instance.context;
  const { selection } = editable;
  const { focus, focusBlock, isSameBlock } = selection.cursor
  const hasSelection = (blockRenderer.block === focusBlock && isSameBlock) || typeof focusOffset !== 'undefined';
  
  const lines = text.split('\n')
  const preParagraphLines: string[] = []
  let thematicLine = ''
  const postParagraphLines: string[] = []
  let thematicLineHasPushed = false

  for (const l of lines) {
    /* eslint-disable no-useless-escape */
    const THEMATIC_BREAK_REG = / {0,3}(?:\* *\* *\*|- *- *-|_ *_ *_)[ \*\-\_]*$/
    /* eslint-enable no-useless-escape */
    if (THEMATIC_BREAK_REG.test(l) && !thematicLineHasPushed) {
      thematicLine = l
      thematicLineHasPushed = true
    } else if (!thematicLineHasPushed) {
      preParagraphLines.push(l)
    } else {
      postParagraphLines.push(l)
    }
  }

  const newBlockData: MEBlockData = {
    id: generateId(),
    type: "thematic-break",
    text: thematicLine,
  }

  if (preParagraphLines.length) {
    const preParagraphData: MEBlockData = {
      id: generateId(),
      type: "paragraph",
      text: preParagraphLines.join('\n')
    }

    blockRenderer.block.insertAdjacent("beforebegin", { data: preParagraphData })
  }

  if (postParagraphLines.length) {
    const postParagraphData: MEBlockData = {
      id: generateId(),
      type: "paragraph",
      text: postParagraphLines.join('\n')
    }
    blockRenderer.block.insertAdjacent("afterend", { data: postParagraphData })
  }


  const preParagraphTextLength = preParagraphLines.reduce((acc, i) => acc + i.length + 1, 0) // Add one, because the `\n`
  const offset = typeof focusOffset !== 'undefined' ? Math.min(focusOffset, thematicLine.length) : Math.max(0, focus.offset - preParagraphTextLength)
  return blockRenderer.block.replaceWith({ data: newBlockData, needToFocus: hasSelection, focus: {offset} })
}

function convertToList(text: string, focusOffset?: number) {
  
  const blockRenderer = this as MEBlockRendererInstance;
  const { editable } = blockRenderer.instance.context;
  const { selection } = editable;
  const { focusBlock, isSameBlock } = selection.cursor
  const hasSelection = (blockRenderer.block === focusBlock && isSameBlock) || typeof focusOffset !== 'undefined';

  const matches = text.match(/^([\s\S]*?) {0,3}([*+-]|\d{1,9}(?:\.|\))) {1,4}([\s\S]*)$/)
  if(!matches) {
    return null;
  }
  const { preferLooseListItem } = blockRenderer.instance.options;
  const blockType = /\d/.test(matches[2]) ? 'order-list' : 'bullet-list'

  if (matches[1]) {
    const paragraphData: MEBlockData = {
      id: generateId(),
      type: "paragraph",
      text: matches[1].trim()
    }


    blockRenderer.block.insertAdjacent("beforebegin", { data: paragraphData })
  }

  const listData: MEBlockData = {
    id: generateId(),
    type: blockType,
    meta: {
      loose: preferLooseListItem
    },
    children: [{
      type: 'list-item',
      id: generateId(),
      children: [{
        id: generateId(),
        type: 'paragraph',
        text: matches[3]
      }]
    }]
  }

  if (blockType === 'order-list') {
    listData.meta.delimiter = matches[2].slice(-1)
    listData.meta.start = Number(matches[2].slice(0, -1))
  } else {
    listData.meta.marker = matches[2]
  }

  const list = blockRenderer.block.replaceWith({data: listData})

  if(!list) {
    return null;
  }

  const firstContent = list.firstContentInDescendant()

  if (hasSelection) {
    const textLength = firstContent.renderer.text.length
    const offset = typeof focusOffset !== 'undefined' ? Math.min(focusOffset, textLength) : 0
    firstContent.renderer.setCursor({focus: {offset}})
  }

  // convert `[*-+] \[[xX ]\] ` to task list.
  const TASK_LIST_REG = /^\[[x ]\] {1,4}/i
  if (TASK_LIST_REG.test(firstContent.renderer.text)) {
    convertToTaskList.call(firstContent.renderer, firstContent.renderer.text, focusOffset);
  }

  return list;
}

function convertToTaskList(text: string, focusOffset?: number) {
  const blockRenderer = this as MEBlockRendererInstance;
  const { editable } = blockRenderer.instance.context;
  const { selection } = editable;
  const { focusBlock, isSameBlock } = selection.cursor
  const hasSelection = (blockRenderer.block === focusBlock && isSameBlock) || typeof focusOffset !== 'undefined';
  
  const listItem = blockRenderer.block.parent;
  const list = listItem?.parent;
  const matches = text.match(/^\[([x ]{1})\] {1,4}([\s\S]*)$/i)

  if (!matches || !list || list.type !== 'bullet-list' || !blockRenderer.block.isFirstChild) {
    return null;
  }

  const { preferLooseListItem } = blockRenderer.instance.options;

  const listData: MEBlockData = {
    type: 'task-list',
    id: generateId(),
    meta: {
      loose: preferLooseListItem,
      marker: list.renderer.meta.marker
    },
    children: [{
      id: generateId(),
      type: 'task-list-item',
      meta: {
        checked: matches[1] !== ' '
      },
      children: listItem.children.map(block => {
        if (block === blockRenderer.block) {
          return {
            ...blockRenderer.block.data,
            type: 'paragraph',
            text: matches[2]
          }
        } else {
          return block.data
        }
      })
    }]
  }

  let newTaskList: MEBlockInstance|null = null;

  switch (true) {
    case listItem.isOnlyChild:
      newTaskList = list.replaceWith({data: listData})
      break

    case listItem.isFirstChild:
      newTaskList = list.insertAdjacent("beforebegin", {data: listData})
      listItem.remove()
      break

    case listItem.isLastChild:
      newTaskList = list.insertAdjacent("afterend", {data: listData})
      listItem.remove()
      break

    default: {
      const bulletListData:MEBlockData = {
        id: generateId(),
        type: 'bullet-list',
        meta: {
          // loose: preferLooseListItem,
          marker: list.renderer.meta.marker
        },
        children: []
      }
      const offset = listItem.index;
      for(let i = offset + 1; i < list.children.length; i ++) {
        const block = list.children[i];
        bulletListData.children?.push(block.data);
        block.remove();
      }

      newTaskList = list.insertAdjacent("afterend", {data: listData});
      newTaskList?.insertAdjacent("afterend", {data: bulletListData});
      listItem.remove()
      break
    }
  }

  if (hasSelection && newTaskList) {
    const firstContent = newTaskList.firstContentInDescendant()
    const textLength = firstContent.renderer.text.length
    const offset = typeof focusOffset !== 'undefined' ? Math.min(focusOffset, textLength) : 0
    firstContent.renderer.setCursor({focus: {offset}})
  }

  return newTaskList;
}

// ATX Heading
function convertToAtxHeading(atxHeading:string, text: string, focusOffset?: number) {

  const blockRenderer = this as MEBlockRendererInstance;
  const type = `atx-heading${atxHeading.length}` as MEBlockType;
  if (blockRenderer.block.type === type) {
    return null;
  }

  const { editable } = blockRenderer.instance.context;
  const { selection } = editable;
  const { focus, focusBlock, isSameBlock } = selection.cursor
  const hasSelection = (blockRenderer.block === focusBlock && isSameBlock) || typeof focusOffset !== 'undefined';

  const lines = text.split('\n')
  const preParagraphLines:string[] = []
  let atxLine = ''
  const postParagraphLines:string[] = []
  let atxLineHasPushed = false

  for (const l of lines) {
    if (/^ {0,3}#{1,6}(?=\s{1,}|$)/.test(l) && !atxLineHasPushed) {
      atxLine = l
      atxLineHasPushed = true
    } else if (!atxLineHasPushed) {
      preParagraphLines.push(l)
    } else {
      postParagraphLines.push(l)
    }
  }

  if (preParagraphLines.length) {
    const preParagraphData: MEBlockData = {
      id: generateId(),
      type: "paragraph",
      text: preParagraphLines.join('\n')
    }

    blockRenderer.block.insertAdjacent("beforebegin", { data: preParagraphData })
  }

  if (postParagraphLines.length) {
    const postParagraphData: MEBlockData = {
      id: generateId(),
      type: "paragraph",
      text: postParagraphLines.join('\n')
    }
    blockRenderer.block.insertAdjacent("afterend", { data: postParagraphData })
  }

  const newBlockData = {
    id: generateId(),
    type,
    text: atxLine
  }

  const preParagraphTextLength = preParagraphLines.reduce((acc, i) => acc + i.length + 1, 0) // Add one, because the `\n`
  const offset = typeof focusOffset !== 'undefined' ? Math.min(focusOffset, atxLine.length) : Math.max(0, focus.offset - preParagraphTextLength)
  return blockRenderer.block.replaceWith({ data: newBlockData, needToFocus: hasSelection, focus: {offset} })
}

// Setext Heading
function convertToSetextHeading(setextHeading:string, text: string, focusOffset?: number) {
  const blockRenderer = this as MEBlockRendererInstance;
  const type = /=/.test(setextHeading) ? 'setext-heading2' : 'setext-heading1'
  if (blockRenderer.block.type === type) {
    return null;
  }

  const { editable } = blockRenderer.instance.context;
  const { selection } = editable;
  const { focusBlock, isSameBlock } = selection.cursor
  const hasSelection = (blockRenderer.block === focusBlock && isSameBlock) || typeof focusOffset !== 'undefined';

  
  const lines = text.split('\n')
  const setextLines:string[] = []
  const postParagraphLines:string[] = []
  let setextLineHasPushed = false

  for (const l of lines) {
    if (/^ {0,3}(?:={3,}|-{3,})(?= {1,}|$)/.test(l) && !setextLineHasPushed) {
      setextLineHasPushed = true
    } else if (!setextLineHasPushed) {
      setextLines.push(l)
    } else {
      postParagraphLines.push(l)
    }
  }

  const newBlockData:MEBlockData = {
    id: generateId(),
    type,
    meta: {
      underline: setextHeading
    },
    text: setextLines.join('\n')
  }

  if (postParagraphLines.length) {
    const postParagraphData: MEBlockData = {
      id: generateId(),
      type: "paragraph",
      text: postParagraphLines.join('\n')
    }
    blockRenderer.block.insertAdjacent("afterend", { data: postParagraphData })
  }

  const textLength = newBlockData.text?.length||0
  const offset = typeof focusOffset !== 'undefined' ? Math.min(focusOffset, textLength) : textLength
  return blockRenderer.block.replaceWith({data: newBlockData, needToFocus: hasSelection, focus: {offset}})
}

// Block Quote
function convertToBlockQuote(text: string, focusOffset?: number) {
  const blockRenderer = this as MEBlockRendererInstance;
  const { editable } = blockRenderer.instance.context;
  const { selection } = editable;
  const { focus, focusBlock, isSameBlock } = selection.cursor
  const hasSelection = (blockRenderer.block === focusBlock && isSameBlock) || typeof focusOffset !== 'undefined';

  const lines = text.split('\n')
  const preParagraphLines: string[] = []
  const quoteLines: string[] = []
  let quoteLinesHasPushed = false
  let delta = 0

  for (const l of lines) {
    if (/^ {0,3}>/.test(l) && !quoteLinesHasPushed) {
      quoteLinesHasPushed = true
      const tokens = /( *> *)(.*)/.exec(l)
      if(tokens) {
        delta = tokens[1].length
        quoteLines.push(tokens[2])
      }
      
    } else if (!quoteLinesHasPushed) {
      preParagraphLines.push(l)
    } else {
      quoteLines.push(l)
    }
  }

  let quoteParagraphData:MEBlockData = {
    id: generateId(),
    type: blockRenderer.block.type,
    meta: blockRenderer.meta,
    text: quoteLines.join('\n')
  };

  const newBlockData:MEBlockData = {
    id: generateId(),
    type: 'block-quote',
    children: [quoteParagraphData]
  }

  if (preParagraphLines.length) {
    const preParagraphData: MEBlockData = {
      id: generateId(),
      type: "paragraph",
      text: preParagraphLines.join('\n')
    }

    blockRenderer.block.insertAdjacent("beforebegin", { data: preParagraphData })
  }
  const quoteBlock = blockRenderer.block.replaceWith({data: newBlockData})
  if (hasSelection) {
    const cursorBlock = quoteBlock?.firstContentInDescendant()
    let offset = Math.max(0, focus.offset - delta)
    offset = typeof focusOffset !== undefined ? Math.min(focusOffset, cursorBlock.renderer.text.length) : offset
    cursorBlock?.renderer.setCursor({focus: {offset}})
  }

  return quoteBlock;
}

// Indented Code Block
function convertToIndentedCodeBlock(text: string, focusOffset?: number) {
  const blockRenderer = this as MEBlockRendererInstance;
  const { editable } = blockRenderer.instance.context;
  const { selection } = editable;
  const { focusBlock, isSameBlock } = selection.cursor
  const hasSelection = (blockRenderer.block === focusBlock && isSameBlock) || typeof focusOffset !== 'undefined';

  const lines = text.split('\n')
  const codeLines:string[] = []
  const paragraphLines:string[] = []
  let canBeCodeLine = true

  for (const l of lines) {
    if (/^ {4,}/.test(l) && canBeCodeLine) {
      codeLines.push(l.replace(/^ {4}/, ''))
    } else {
      canBeCodeLine = false
      paragraphLines.push(l)
    }
  }

  if (paragraphLines.length) {
    const postParagraphData: MEBlockData = {
      id: generateId(),
      type: "paragraph",
      text: paragraphLines.join('\n')
    }
    blockRenderer.block.insertAdjacent("afterend", { data: postParagraphData })
  }

  const codeData: MEBlockData = {
    id: generateId(),
    type: 'code-block',
    meta: {
      type: 'indented'
    },
    children: [
      {
        id: generateId(),
        type: 'language',
        text: ''
      },
      {
        id: generateId(),
        type: 'code',
        meta: {
          lang: '',
        },
        text: codeLines.join('\n')
      }
    ]
    
  }

  const codeBlock = blockRenderer.block.replaceWith({data: codeData})

  if (hasSelection && codeBlock) {
    const cursorBlock = codeBlock.lastContentInDescendant()
    const textLength = cursorBlock?.renderer.text.length || 0
    const offset = typeof focusOffset !== 'undefined' ? Math.min(focusOffset, textLength) : 0
    cursorBlock?.renderer.setCursor({focus: {offset}})
  }

  return codeBlock;
}

// Paragraph
function convertToParagraph(text: string, force = false, focusOffset?: number) {

  const blockRenderer = this as MEBlockRendererInstance;
  
  if (
    !force &&
    (
      blockRenderer.block.type === 'setext-heading1' ||
      blockRenderer.block.type === 'setext-heading2' ||
      blockRenderer.block.type === 'paragraph'
    )
  ) {
    return null;
  }

  const { editable } = blockRenderer.instance.context;
  const { selection } = editable;
  const { focus, focusBlock, isSameBlock } = selection.cursor
  const hasSelection = (blockRenderer.block === focusBlock && isSameBlock) || typeof focusOffset !== 'undefined';

  const newBlockData:MEBlockData = {
    id: generateId(),
    type: 'paragraph',
    text
  }

  focus.offset = typeof focusOffset !== 'undefined' ? Math.min(focusOffset, text.length) : focus.offset
  return blockRenderer.block.replaceWith({data: newBlockData, needToFocus: hasSelection, focus})
}
