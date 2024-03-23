import { MEBlockRendererInstance } from "@/packages/types"
import { convertIfNeeded } from "../../../utils/convert";

export function handleBackspaceInParagraph() {
  const renderer = this as MEBlockRendererInstance;
  const {block} = renderer;
  const previousContentBlock = block.previousContentInContext();
  if (!previousContentBlock) {

    const nextContentBlock = block.nextContentInContext();
    if(nextContentBlock) {
        block.remove();
        nextContentBlock.renderer.setCursor();
        return true;
    }

    return false;
  }
  const { text: oldText } = previousContentBlock.renderer;
  const offset = oldText.length;
  const text = oldText + renderer.text;
  const focus = {offset}
  previousContentBlock.renderer.render({text, cursor: {anchor: focus, focus, focusBlock: previousContentBlock, anchorBlock: previousContentBlock}})
  renderer.block.remove()
  previousContentBlock.renderer.setCursor({focus})
  if(previousContentBlock.type === 'paragraph') {
    convertIfNeeded.call(previousContentBlock.renderer, text)
  }
  return true;
}

export function handleBackspaceInBlockQuote() {
  const renderer = this as MEBlockRendererInstance;
  const {block} = renderer;
  const blockQuote = block.parent;

  if (!block.isOnlyChild && !block.isFirstChild) {
    return handleBackspaceInParagraph.call(renderer)
  }

  if (block.isOnlyChild) {
    blockQuote?.replaceWith({data: block.data, needToFocus: true})
  } else if (block.isFirstChild) {
    const cloneParagraph = block.data
    blockQuote?.insertAdjacent("beforebegin", {data: cloneParagraph, needToFocus: true})
    block.remove()
  }

  return true;
}

export function handleBackspaceInList() {
  const renderer = this as MEBlockRendererInstance;
  const {block} = renderer;
  const listItem = block.parent
  const list = listItem?.parent

  if (!block.isFirstChild) {
    return handleBackspaceInParagraph.call(renderer);
  }

  if(!listItem || !list) {
    return false;
  }

  if (listItem.isOnlyChild) {
    listItem.children.forEach((node, i) => {
      const paragraph = node.data
      list.insertAdjacent("beforebegin", {data: paragraph, needToFocus: i === 0})
    })

    list.remove()
  } else if (listItem.isFirstChild) {
    listItem.children.forEach((node, i) => {
      const paragraph = node.data
      list.insertAdjacent("beforebegin", {data: paragraph, needToFocus: i === 0})
    })

    listItem.remove()
  } else {
    const previousListItem = listItem.previous;
    listItem.children.forEach((node, i) => {
      const paragraph = node.data
      previousListItem?.append({data: paragraph, needToFocus: i === 0})
    })

    listItem.remove()
  }

  return true;
}