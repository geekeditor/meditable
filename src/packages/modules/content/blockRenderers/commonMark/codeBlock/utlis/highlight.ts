import {Languages}  from "./languages";
import hljs from 'highlight.js/lib/core';


export const Constant =  {
    block: 'be-code',
    line: 'be-code__line',
    text: 'be-code__line-text',
    langAttr: 'data-lang',
    codeBlockTagName: "pre",
    lineTagName: "code",
    lineTextTagName: "span",
    tabSize: "  ",
    classPrefix: "be-code__"
};

for (const key in Languages) {
    if (Object.prototype.hasOwnProperty.call(Languages, key)) {
        const lang = Languages[key];
        hljs.registerLanguage(key, lang);
        hljs.configure({
            // classPrefix: Constant.classPrefix,
        })
    }
}

export function highlight(lang: string, code: string) {
    return lang && Languages[lang] ? hljs.highlight(code, {language: lang}) : hljs.highlightAuto(code);
}
