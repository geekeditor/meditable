export type MENativeNode = Node | Node & ParentNode | ChildNode | Text
export type MEIndexedNode = MENativeNode & {
    [index: string]: any
}

export interface MEEnv {
    ie?: boolean;
    ie11Compat?: boolean;
    ie9Compat?: boolean;
    ie8?: boolean;
    ie8Compat?: boolean;
    ie7Compat?: boolean;
    ie6Compat?: boolean;
    ie9above?: boolean;
    ie9below?: boolean;
    ie11above?: boolean;
    ie11below?: boolean;
    opera?: boolean;
    webkit?: boolean;
    mac?: boolean;
    quirks?: boolean;
    gecko?: boolean;
    safari?: number;
    chrome?: number;
    version: number;
    isCompatible?: boolean;
}

export interface MEBookmark {
    start: string | HTMLSpanElement;
    end: string | HTMLSpanElement | null;
    id: string | undefined;
}

export interface MEAddress {
    startAddress: number[];
    endAddress?: number[];
    collapsed: boolean;
}