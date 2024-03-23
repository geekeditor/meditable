
// const inlineTags = ['strong', 'b', 'del', 's', 'strike', 'em', 'i','mark','u','code','sup', 'sub', 'math', 'kbd']


export const COMMAND_TYPE_MAP = {
    bold: "strong",
    italic: "em",
    inline_code: "inline_code",
    subscript: "sub",
    superscript: "sup",
    underline: "u",
    strikethrough: "del",
    mark: "mark",
    inline_math: "inline_math",
};

const getCommand = (cmdName: string, shortcutKeys?: { [key: string]: any }) => {
    return {
        cmdName,
        execCommand(cmdName: string) {
            this.execCommand('format', {type: COMMAND_TYPE_MAP[cmdName]})
        },
        queryCommandState() {
            return 0;
        },
        shortcutKeys,
    }
}

const bold = getCommand('bold', {
    "Ctrl+B": {}
});
const italic = getCommand('italic',  {
    "Ctrl+I": {}
});
const subscript = getCommand('subscript',{
    "Ctrl+Shift+,": {}
});
const supscript = getCommand('superscript',   {
    "Ctrl+Shift+.": {}
});
const underline = getCommand('underline',  {
    "Ctrl+U": {}
});
const strikethrough = getCommand('strikethrough', {
    "Ctrl+D": {}
});
const mark = getCommand('mark', {
    "Ctrl+M": {}
});
const code = getCommand('inline_code',  {
    "Ctrl+E": {}
});
const math = getCommand('inline_math', {
    "Ctrl+Shift+M": {}
});

export {
    bold,
    italic,
    subscript,
    supscript,
    underline,
    strikethrough,
    mark,
    code,
    math
};