import { MEBlockData, MEOutlineItem } from "../types";

export function regexWithKey(key: string) {
    const words = [];
    for (let i = 0; i < key.length; i++) {
        words.push(`(${key.charAt(i)})`)
    }
    return new RegExp(`(.*)${words.join('(.*)')}(.*)`)
}

function flattenIteration(result: MEOutlineItem[], data: MEBlockData) {
    let match;
    if(/(heading\d|paragraph|code|td|tr)$/.test(data.type)) {
        result.push({
            id: data.id,
            text: data.text||'',
            type: data.type,
            match
        })
    }

    const children = data.children || []
    children.forEach((child)=>{
        flattenIteration(result, child)
    })
}

export function flattenToOutline(data: MEBlockData) {
    const result: MEOutlineItem[] = [];
    flattenIteration(result, data);
    return result;
}

export function filterOutline(outline: MEOutlineItem[], {filterKey, filterTypeRegex}: {filterKey?: string; filterTypeRegex?: RegExp}) {
    const filterRegex = filterKey ? regexWithKey(filterKey) : null;
    if(!filterRegex && !filterTypeRegex) {
        return outline;
    }
    return outline.filter((it)=>{
        const match = filterRegex ? it.text.match(filterRegex) : null
        it.match = match
        return (!filterRegex || match) && (!filterTypeRegex || filterTypeRegex.test(it.type));
    })
}