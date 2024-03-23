const keymap: { [key: string]: number } = {
    Backspace: 8,
    Tab: 9,
    Enter: 13,

    Shift: 16,
    Control: 17,
    Alt: 18,
    CapsLock: 20,

    Esc: 27,

    Spacebar: 32,

    PageUp: 33,
    PageDown: 34,
    End: 35,
    Home: 36,

    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40,

    Insert: 45,

    Del: 46,

    NumLock: 144,

    Cmd: 91,

    "=": 187,
    "-": 189,
    '.': 190,
    ',': 188,
    "'": 222,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,

    u: 85,
    v: 86,
    w: 87,

    x: 88,
    y: 89,
    z: 90, //回退
};

export function isPrintableKey(keyCode: number): boolean {
    return (keyCode > 47 && keyCode < 58) || // number keys
        keyCode === 32 || keyCode === 13 || // Spacebar & return key(s)
        keyCode === 229 || // processing key input for certain languages — Chinese, Japanese, etc.
        (keyCode > 64 && keyCode < 91) || // letter keys
        (keyCode > 95 && keyCode < 112) || // Numpad keys
        (keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
        (keyCode > 218 && keyCode < 223); // [\]' (in order)
}

export default keymap;