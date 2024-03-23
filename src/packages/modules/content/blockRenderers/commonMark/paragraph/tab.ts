import { MEBlockData, MEBlockRendererInstance } from "@/packages/types";
import { generateId } from "@/packages/utils/utils";

const BOTH_SIDES_FORMATS = [
  'strong',
  'em',
  'inline_code',
  'image',
  'link',
  'reference_image',
  'reference_link',
  'emoji',
  'del',
  'html_tag',
  'inline_math'
]


export function isUnindentableListItem() {
  const renderer = this as MEBlockRendererInstance;
  const { block } = renderer;
  const listItem = block.parent
  const list = listItem?.parent
  const listParent = list?.parent
  const { isCollapsed } = block.instance.context.editable.selection.cursor

  if (!isCollapsed) {
    return false
  }

  if (listParent && (listParent.type === 'list-item' || listParent.type === 'task-list-item')) {
    return list.previous ? 'INDENT' : 'REPLACEMENT'
  }

  return false
}


export function isIndentableListItem() {
  const renderer = this as MEBlockRendererInstance;
  const { block } = renderer;
  if (block.type !== 'paragraph' || !block.parent) {
    return false
  }

  const listItem = block.parent
  // Now we know it's a list item. Check whether we can indent the list item.
  const list = listItem?.parent

  const { isCollapsed } = block.instance.context.editable.selection.cursor

  if ((listItem.type !== 'list-item' && listItem.type !== 'task-list-item') || !isCollapsed) {
    return false
  }

  return list && /ol|ul/i.test(list.nodes.el.tagName) && listItem.previous
}


export function unindentListItem(type) {
  const renderer = this as MEBlockRendererInstance;
  const { block } = renderer;
  const listItem = block.parent
  const list = listItem?.parent
  const listParent = list?.parent
  const cursor = renderer.getCursor();
  if (!cursor || !listItem || !list || !listParent) {
    return;
  }

  const { anchor, focus } = cursor
  const cursorParagraphOffset = block.index;

  if (type === 'REPLACEMENT') {
    const paragraph = block.data
    list.insertAdjacent("beforebegin", { data: paragraph })

    if (listItem.isOnlyChild) {
      list.remove()
    } else {
      listItem.remove()
    }
  } else if (type === 'INDENT') {
    const newListItemData = listItem.data
    const newListItem = listParent.insertAdjacent("afterend", { data: newListItemData })

    if ((listItem.next || list.next) && newListItem?.lastChild?.type !== list.type) {
      const data: MEBlockData = {
        id: generateId(),
        type: list.type,
        meta: { ...list.renderer.meta },
        children: []
      }
      newListItem?.append({ data })
    }

    if (listItem.next) {
      const offset = listItem.index;
      for (let i = offset + 1; i < list.children.length; i++) {
        const block = list.children[i];
        newListItem?.lastChild?.append({ data: block.data });
        block.remove();
      }
    }

    if (list.next) {
      const offset = list.index
      for (let i = offset + 1; i < listParent.children.length; i++) {
        const block = listParent.children[i];
        newListItem?.lastChild?.append({ data: block.data });
        block.remove();
      }

    }

    if (listItem.isOnlyChild) {
      list.remove()
    } else {
      listItem.remove()
    }

    const cursorBlock = newListItem?.children[cursorParagraphOffset].firstContentInDescendant()
    cursorBlock?.renderer.setCursor({ anchor, focus })
  }
}


export function indentListItem() {
  const renderer = this as MEBlockRendererInstance;
  const { block } = renderer;
  const cursor = renderer.getCursor();
  const listItem = block?.parent
  const list = listItem?.parent
  const prevListItem = listItem?.previous
  if(!cursor || !listItem || !list) {
    return;
  }
  const { anchor, focus } = cursor
  const offset = block.index;

  // Search for a list in previous block
  let newList = prevListItem?.lastChild

  if (!newList || !/ol|ul/i.test(newList.nodes.el.tagName)) {
    const data: MEBlockData = {
      id: generateId(),
      type: list.type,
      meta: { ...list.renderer.meta },
      children: [listItem.data]
    }
    newList = prevListItem?.append({data})
  } else {
    newList.append({data: listItem.data})
  }

  listItem.remove()

  const cursorBlock = newList?.lastChild?.children[offset].firstContentInDescendant()
  cursorBlock?.renderer.setCursor({anchor, focus})
}


export function insertTab() {
  const renderer = this as MEBlockRendererInstance;
  const { block } = renderer;
  const cursor = renderer.getCursor();
  if(!cursor) {
    return;
  }
  const { text: oldText } = renderer
  const tabSize = 4;
  const tabCharacter = String.fromCharCode(32).repeat(tabSize)
  const { start, end } = cursor

  if (start.offset === end.offset) {
    const text = oldText.substring(0, start.offset) + tabCharacter + oldText.substring(end.offset)
    const offset = start.offset + tabCharacter.length

    renderer.render({text, cursor: {focus: {offset}, anchor: {offset}, focusBlock: block, anchorBlock: block}})
    renderer.setCursor({focus: {offset}})
  }
}


export function checkCursorAtEndFormat() {
  const renderer = this as MEBlockRendererInstance;
  const cursor = renderer.getCursor();
  if(!cursor) {
    return null;
  }
  const { offset } = cursor.start;
  const tokens = renderer.datas;
  let result:any = null
  const walkTokens = tkns => {
    for (const token of tkns) {
      const { marker, type, range, children, srcAndTitle, hrefAndTitle, backlash, closeTag, isFullLink, label } = token
      const { start, end } = range

      if (BOTH_SIDES_FORMATS.includes(type) && offset > start && offset < end) {
        switch (type) {
          case 'strong':

          case 'em':

          case 'inline_code':

          case 'emoji':

          case 'del':

          case 'inline_math': {
            if (marker && offset === end - marker.length) {
              result = {
                offset: marker.length
              }

              return
            }
            break
          }

          case 'image':

          case 'link': {
            const linkTitleLen = (srcAndTitle || hrefAndTitle).length
            const secondLashLen = backlash && backlash.second ? backlash.second.length : 0
            if (offset === end - 3 - (linkTitleLen + secondLashLen)) {
              result = {
                offset: 2
              }

              return
            } else if (offset === end - 1) {
              result = {
                offset: 1
              }

              return
            }
            break
          }

          case 'reference_image':

          case 'reference_link': {
            const labelLen = label ? label.length : 0
            const secondLashLen = backlash && backlash.second ? backlash.second.length : 0
            if (isFullLink) {
              if (offset === end - 3 - labelLen - secondLashLen) {
                result = {
                  offset: 2
                }

                return
              } else if (offset === end - 1) {
                result = {
                  offset: 1
                }

                return
              }
            } else if (offset === end - 1) {
              result = {
                offset: 1
              }

              return
            }
            break
          }

          case 'html_tag': {
            if (closeTag && offset === end - closeTag.length) {
              result = {
                offset: closeTag.length
              }

              return
            }
            break
          }
          default:
            break
        }
      }

      if (children && children.length) {
        walkTokens(children)
      }
    }
  }
  walkTokens(tokens)

  return result
}