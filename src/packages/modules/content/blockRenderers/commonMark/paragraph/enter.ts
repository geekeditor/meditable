import { MEBlockData, MEBlockRendererInstance } from '@/packages/types'
import { HTML_TAGS, VOID_HTML_TAGS } from '@/packages/utils/tags'
import { generateId } from '@/packages/utils/utils'
import { CODE_BLOCK_REG, HTML_BLOCK_REG, MATH_BLOCK_REG, TABLE_BLOCK_REG } from '../../../utils/convert'

export const isLengthEven = (str = '') => str.length % 2 === 0;

const parseTableHeader = (text) => {
    const rowHeader: string[] = []
    const len = text.length
    let i

    for (i = 0; i < len; i++) {
        const char = text[i]
        if (/^[^|]$/.test(char)) {
            rowHeader[rowHeader.length - 1] += char
        }

        if (/\\/.test(char)) {
            rowHeader[rowHeader.length - 1] += text[++i]
        }

        if (/\|/.test(char) && i !== len - 1) {
            rowHeader.push('')
        }
    }

    return rowHeader
}

export function enterConvert(event) {
    event.preventDefault()

    const renderer = this as MEBlockRendererInstance
    const { text } = this
    const codeBlockToken = text.match(CODE_BLOCK_REG)
    const tableMatch = TABLE_BLOCK_REG.exec(text)
    const htmlMatch = HTML_BLOCK_REG.exec(text)
    const mathMath = MATH_BLOCK_REG.exec(text)
    const tagName: any =
        htmlMatch && htmlMatch[1] && HTML_TAGS.find((t) => t === htmlMatch[1])

    if (mathMath) {
        const mathBlockData: MEBlockData = {
            id: generateId(),
            type: 'math-block',
            text: '',
            meta: {
                mathStyle: "",
            },
            children: [{
                id: generateId(),
                type: 'code',
                meta: {
                    lang: 'latex'
                },
                text: ''
            }]
        }
        const mathBlock = renderer.block.replaceWith({ data: mathBlockData })
        if (mathBlock) {
            mathBlock.firstContentInDescendant().renderer.setCursor({ focus: { offset: 0 } })
        }
    } else if (codeBlockToken) {
        // Convert to code block
        const lang = codeBlockToken[2]
        let codeBlockData: MEBlockData;
        if (/mermaid|flowchart|vega-lite|sequence|plantuml/.test(lang)) {
            codeBlockData = {
              id: generateId(),
              type: 'diagram-block',
              meta: {
                type: lang,
              },
              text: '',
              children: [
                {
                  id: generateId(),
                  type: 'code',
                  text: '',
                  meta: {
                    lang: lang === 'vega-lite' ? 'json' : 'yaml',
                  }
                }
              ]
            };
          } else {
            codeBlockData = {
                id: generateId(),
                type: 'code-block',
                meta: {
                    type: 'fenced'
                },
                children: [
                    {
                        id: generateId(),
                        type: 'language',
                        text: lang
                    },
                    {
                        id: generateId(),
                        meta: {
                            lang,
                        },
                        type: 'code',
                        text: ''
                    }
                ]
            }
          }
        

        const codeBlock = renderer.block.replaceWith({ data: codeBlockData })
        codeBlock?.lastContentInDescendant().renderer.setCursor({ focus: { offset: 0 } })
    } else if (
        tableMatch &&
        isLengthEven(tableMatch[1]) &&
        isLengthEven(tableMatch[2])
    ) {

        const tableHeader = parseTableHeader(this.text)

        const tableData: MEBlockData = {
            id: generateId(),
            type: 'table',
            children: [
                {
                    id: generateId(),
                    type: 'table-thead',
                    children: [
                        {
                            id: generateId(),
                            type: 'table-tr',
                            children: tableHeader.map((h) => ({
                                id: generateId(),
                                type: 'table-th',
                                meta: { align: 'none' },
                                text: h,
                            }))
                        }
                    ],
                },
                {
                    id: generateId(),
                    type: 'table-tbody',
                    children: [
                        {
                            id: generateId(),
                            type: 'table-tr',
                            children: tableHeader.map(() => ({
                                id: generateId(),
                                type: 'table-td',
                                meta: { align: 'none' },
                                text: '',
                            }))
                        }
                    ]
                }
            ],
        };

        const tableBlock = this.block.replaceWith({data: tableData})
        tableBlock.firstChild
            .firstContentInDescendant()
            .renderer
            .setCursor()

    } else if (tagName && VOID_HTML_TAGS.indexOf(tagName) === -1) {
        const text = `<${tagName}>\n\n</${tagName}>`
        const data = {
            type: 'html-block',
            id: generateId(),
            text,
            children: [{
                id: generateId(),
                type: 'code',
                meta: {
                    lang: 'html'
                },
                text
            }]
        }
        const htmlBlock = this.block.replaceWith({ data })
        const offset = tagName.length + 3
        htmlBlock.firstContentInDescendant().renderer.setCursor({ focus: { offset } })
    } else {
        return false;
    }

    return true;
}

export function enterInBlockQuote(event) {

    const renderer = this as MEBlockRendererInstance
    const { text, block } = renderer
    if (text.length !== 0) {
        return false;
    }

    event.preventDefault()

    const newBlockData = block.data;
    const blockQuote = block.parent;
    if (!blockQuote) {
        return false;
    }

    const newBlockOptions = { data: newBlockData, needToFocus: true, focus: { offset: 0 } }

    switch (true) {
        case block.isOnlyChild:
            blockQuote.insertAdjacent('beforebegin', newBlockOptions)
            blockQuote.remove()
            break

        case block.isFirstChild:
            blockQuote.insertAdjacent('beforebegin', newBlockOptions)
            block.remove()
            break

        case block.isLastChild:
            blockQuote.insertAdjacent('afterend', newBlockOptions)
            block.remove()
            break

        default: {
            const newBlockQuoteData: MEBlockData = {
                id: generateId(),
                type: 'block-quote',
                children: []
            }

            const offset = block.index;
            for (let i = offset + 1; i < blockQuote.children.length; i++) {
                const block = blockQuote.children[i];
                newBlockQuoteData.children?.push(block.data);
                block.remove();
            }

            const newBlock = blockQuote.insertAdjacent('afterend', newBlockOptions)
            newBlock?.insertAdjacent('afterend', { data: newBlockQuoteData })
            block.remove()
            break
        }
    }

    return true;
}

export function enterInListItem(event) {

    const renderer = this as MEBlockRendererInstance
    const { text: oldText, block } = renderer
    const cursor = renderer.getCursor();
    if (!cursor) {
        return false;
    }

    event.preventDefault()

    const { start, end } = cursor;
    const listItem = block.parent
    const list = listItem?.parent

    if (!listItem || !list) {
        return false;
    }

    if (oldText.length === 0) {


        const newParagraph = block.data;
        const newBlockOptions = { data: newParagraph, needToFocus: true, focus: { offset: 0 } }


        if (block.isOnlyChild) {
            switch (true) {
                case listItem.isOnlyChild: {
                    list.replaceWith(newBlockOptions)
                    break
                }

                case listItem.isFirstChild: {
                    listItem.remove()
                    list.insertAdjacent('beforebegin', newBlockOptions)
                    break
                }

                case listItem.isLastChild: {
                    listItem.remove()
                    list.insertAdjacent('afterend', newBlockOptions)
                    break
                }

                default: {
                    const newListData: MEBlockData = {
                        id: generateId(),
                        type: list.type,
                        meta: { ...list.renderer.meta },
                        children: []
                    }
                    const offset = listItem.index;
                    for (let i = offset + 1; i < list.children.length; i++) {
                        const block = list.children[i];
                        newListData.children?.push(block.data);
                        block.remove();
                    }

                    const newBlock = list.insertAdjacent('afterend', newBlockOptions)
                    newBlock?.insertAdjacent('afterend', { data: newListData })
                    listItem.remove()
                    break
                }
            }
        } else {
            const newListItemData: MEBlockData = {
                id: generateId(),
                type: listItem.type,
                children: []
            }

            if (listItem.type === 'task-list-item') {
                newListItemData.meta = { checked: false }
            }

            const offset = block.index;
            for (let i = offset; i < listItem.children.length; i++) {
                const block = listItem.children[i];
                newListItemData.children?.push(block.data);
                block.remove();
            }

            const newListBlock = listItem.insertAdjacent('afterend', { data: newListItemData })
            newListBlock?.firstContentInDescendant().renderer.setCursor()
        }
    } else {
        if (block.isOnlyChild) {
            const text = oldText.substring(0, start.offset)
            const newListItemData: MEBlockData = {
                id: generateId(),
                type: listItem.type,
                children: [
                    {
                        id: generateId(),
                        type: 'paragraph',
                        text: oldText.substring(end.offset)
                    }
                ]
            }

            if (listItem.type === 'task-list-item') {
                newListItemData.meta = {
                    checked: false
                }
            }

            const newListItemBlock = listItem.insertAdjacent('afterend', { data: newListItemData })
            renderer.render({ text });
            newListItemBlock?.firstContentInDescendant().renderer.setCursor()
        } else {
            return false;
        }
    }

    return true;
}