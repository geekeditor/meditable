import { MEInstance, MENodeData } from "@/packages/types";
import { generator } from "../inlineRenderers/tokenizer";

export const FORMAT_MARKER_MAP = {
    em: "*",
    inline_code: "`",
    strong: "**",
    del: "~~",
    inline_math: "$",
    sub: "~",
    sup: "^",
    u: {
        open: "<u>",
        close: "</u>",
    },
    // sub: {
    //     open: "<sub>",
    //     close: "</sub>",
    // },
    // sup: {
    //     open: "<sup>",
    //     close: "</sup>",
    // },
    mark: {
        open: "<mark>",
        close: "</mark>",
    },
};

export const FORMAT_TYPES = [
    "strong",
    "em",
    "del",
    "sub",
    "sup",
    "inline_code",
    "link",
    "image",
    "inline_math",
];

export const getOffset = (offset, { range: { start, end }, type, tag, anchor, alt }) => {
    const dis = offset - start
    const len = end - start
    switch (type) {
        case 'strong':
        case 'del':
        case 'em':
        case 'inline_code':
        case 'inline_math': {
            const MARKER_LEN = (type === 'strong' || type === 'del') ? 2 : 1
            if (dis < 0) return 0
            if (dis >= 0 && dis < MARKER_LEN) return -dis
            if (dis >= MARKER_LEN && dis <= len - MARKER_LEN) return -MARKER_LEN
            if (dis > len - MARKER_LEN && dis <= len) return len - dis - 2 * MARKER_LEN
            if (dis > len) return -2 * MARKER_LEN
            break
        }

        case 'html_tag': { // handle underline, sup, sub
            const OPEN_MARKER_LEN = FORMAT_MARKER_MAP[tag].open.length
            const CLOSE_MARKER_LEN = FORMAT_MARKER_MAP[tag].close.length
            if (dis < 0) return 0
            if (dis >= 0 && dis < OPEN_MARKER_LEN) return -dis
            if (dis >= OPEN_MARKER_LEN && dis <= len - CLOSE_MARKER_LEN) return -OPEN_MARKER_LEN
            if (dis > len - CLOSE_MARKER_LEN && dis <= len) return len - dis - OPEN_MARKER_LEN - CLOSE_MARKER_LEN
            if (dis > len) return -OPEN_MARKER_LEN - CLOSE_MARKER_LEN
            break
        }

        case 'link': {
            const MARKER_LEN = 1
            if (dis < MARKER_LEN) return 0
            if (dis >= MARKER_LEN && dis <= MARKER_LEN + anchor.length) return -1
            if (dis > MARKER_LEN + anchor.length) return anchor.length - dis
            break
        }

        case 'image': {
            const MARKER_LEN = 1
            if (dis < MARKER_LEN) return 0
            if (dis >= MARKER_LEN && dis < MARKER_LEN * 2) return -1
            if (dis >= MARKER_LEN * 2 && dis <= MARKER_LEN * 2 + alt.length) return -2
            if (dis > MARKER_LEN * 2 + alt.length) return alt.length - dis
            break
        }
    }
}

export const clearFormat = (token, { start, end }) => {
    if (start) {
        const deltaStart = getOffset(start.offset, token)
        start.delata += deltaStart
    }

    if (end) {
        const delataEnd = getOffset(end.offset, token)
        end.delata += delataEnd
    }

    switch (token.type) {
        case 'strong':
        case 'del':
        case 'em':
        case 'link':
        case 'html_tag': { // underline, sub, sup
            const { parent } = token
            const index = parent.indexOf(token)
            parent.splice(index, 1, ...token.children)
            break
        }

        case 'image': {
            token.type = 'text'
            token.raw = token.alt
            delete token.marker
            delete token.src
            break
        }

        case 'inline_math':
        case 'inline_code': {
            token.type = 'text'
            token.raw = token.content
            delete token.marker
            break
        }
    }
}
export const addFormat = (type, text, { start, end }) => {
    switch (type) {
        case 'em':
        case 'del':
        case 'inline_code':
        case 'strong':
        case 'sub':
        case 'sup':
        case 'inline_math': {
            const MARKER = FORMAT_MARKER_MAP[type]
            const oldText = text
            text = oldText.substring(0, start.offset) +
                MARKER + oldText.substring(start.offset, end.offset) +
                MARKER + oldText.substring(end.offset)
            start.offset += MARKER.length
            end.offset += MARKER.length
            break
        }

        // case 'sub':
        // case 'sup':
        case 'mark':
        case 'u': {
            const MARKER = FORMAT_MARKER_MAP[type]
            const oldText = text
            text = oldText.substring(0, start.offset) +
                MARKER.open + oldText.substring(start.offset, end.offset) +
                MARKER.close + oldText.substring(end.offset)
            start.offset += MARKER.open.length
            end.offset += MARKER.open.length
            break
        }

        case 'link':
        case 'image': {
            const oldText = text
            const anchorTextLen = end.offset - start.offset
            text = oldText.substring(0, start.offset) +
                (type === 'link' ? '[' : '![') +
                oldText.substring(start.offset, end.offset) + ']()' +
                oldText.substring(end.offset)
            // put cursor between `()`
            start.offset += type === 'link' ? 3 + anchorTextLen : 4 + anchorTextLen
            end.offset = start.offset
            break
        }
    }

    return text;
}

export const checkTokenIsInlineFormat = token => {
    const { type, tag } = token

    if (FORMAT_TYPES.includes(type)) {
        return true
    }

    if (type === 'html_tag' && /^(?:u|sub|sup|mark)$/i.test(tag)) {
        return true
    }

    return false
}

export const getFormatsInRange = (start, end, tokens: MENodeData[]) => {
    if (!start || !end) {
        return { formats: [], tokens: [], neighbors: [] }
    }

    const formats: MENodeData[] = []
    const neighbors: MENodeData[] = []

        ; (function iterator(tks) {
            for (const token of tks) {
                if (
                    checkTokenIsInlineFormat(token) &&
                    start.offset >= token.range.start &&
                    end.offset <= token.range.end
                ) {
                    formats.push(token)
                }

                if (
                    checkTokenIsInlineFormat(token) &&
                    ((start.offset >= token.range.start && start.offset <= token.range.end) ||
                        (end.offset >= token.range.start && end.offset <= token.range.end) ||
                        (start.offset <= token.range.start && token.range.end <= end.offset))
                ) {
                    neighbors.push(token)
                }

                if (token.children && token.children.length) {
                    iterator(token.children)
                }
            }
        })(tokens)

    return { formats, neighbors }
}

export const format = {
    cmdName: "format",
    execCommand(cmdName: string, {
        type
    }: { type: string; }) {
        const instance = this.instance as MEInstance;
        const { selection } = instance.context.editable;
        const { isCollapsed, focusBlock, anchorBlock, isSameBlock, focus, anchor, direction } = selection.cursor;

        if (!isCollapsed && focusBlock && isSameBlock && focusBlock.nodes.holder.contentEditable === 'true') {
            const blockRenderer = focusBlock.nodes.holder["BLOCK_RENDERER_INSTANCE"];
            const datas: MENodeData[] = blockRenderer.datas || [];
            const start = { offset: Math.min(anchor.offset, focus.offset), delata: 0 };
            const end = { offset: Math.max(anchor.offset, focus.offset), delata: 0 };

            const { formats, neighbors } = getFormatsInRange(start, end, datas);
            const [currentFormats, currentNeightbors] = [formats, neighbors].map(item => item.filter(format => {
                return format.type === type ||
                    format.type === 'html_tag' && format.tag === type
            }).reverse())

            let text = blockRenderer.text;
            if (currentFormats.length) {
                for (const token of currentFormats) {
                    clearFormat(token, { start, end })
                }
                start.offset += start.delata
                end.offset += end.delata
                text = generator(datas)
            } else {
                if (currentNeightbors.length) {
                    for (const neighbor of currentNeightbors) {
                        clearFormat(neighbor, { start, end })
                    }
                }
                start.offset += start.delata
                end.offset += end.delata
                text = generator(datas)
                text = addFormat(type, text, { start, end })
            }

            if (direction === 'backward') {
                anchor.offset = end.offset;
                focus.offset = start.offset;
            } else {
                anchor.offset = start.offset;
                focus.offset = end.offset;
            }
            const cursor = {
                anchor,
                focus,
                anchorBlock,
                focusBlock
            }
            if (blockRenderer.render({ text, cursor })) {
                selection.setCursor(cursor);
            }
        }
    }
}

export const removeformat = {
    cmdName: 'removeformat',
    execCommand(cmdName: string) {
        const instance = this.instance as MEInstance;
        const { selection } = instance.context.editable;
        const { isCollapsed, focusBlock, anchorBlock, isSameBlock, focus, anchor, direction } = selection.cursor;

        if (!isCollapsed && focusBlock && isSameBlock && focusBlock.nodes.holder.contentEditable === 'true') {
            const blockRenderer = focusBlock.nodes.holder["BLOCK_RENDERER_INSTANCE"];
            const datas: MENodeData[] = blockRenderer.datas || [];
            const start = { offset: Math.min(anchor.offset, focus.offset), delata: 0 };
            const end = { offset: Math.max(anchor.offset, focus.offset), delata: 0 };
            const { neighbors } = getFormatsInRange(start, end, datas);
            for (const neighbor of neighbors) {
                clearFormat(neighbor, { start, end })
            }
            start.offset += start.delata
            end.offset += end.delata
            if (direction === 'backward') {
                anchor.offset = end.offset;
                focus.offset = start.offset;
            } else {
                anchor.offset = start.offset;
                focus.offset = end.offset;
            }

            const text = generator(datas)
            const cursor = {
                anchor,
                focus,
                anchorBlock,
                focusBlock
            }
            if (blockRenderer.render({ text, cursor })) {
                selection.setCursor(cursor);
            }
        }
    }
};
