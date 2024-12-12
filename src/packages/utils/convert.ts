import { Base64 } from "js-base64";

export function blobToDataURI(blob: Blob):Promise<string|null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = (e) => {
            if (e.target && e.target.result && typeof e.target.result === 'string') {
                resolve(e.target.result)
            } else {
                resolve(null)
            }
        }
        reader.onerror = () => {
            resolve(null)
        }
    })
}

export function dataURItoBlob(dataURI: string) {
    const dataArr = dataURI.split(',')
    const byteString = atob(dataArr[1])
    const mimeString = dataArr[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ab], { type: mimeString })
}

export function imgURLToBlob(url: string): Promise<Blob | null> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.src = url;
        img.onload = () => {
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            ctx?.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                resolve(blob)
            }, 'image/png')
        }
        img.onerror = () => {
            resolve(null)
        }
    })
}

export function svgToBlob(svg: string, scale?: number, fillColor?: string): Promise<Blob | null> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.src = `data:image/svg+xml;base64,${Base64.encode(svg)}`;
        img.onload = () => {
            canvas.width = (img.naturalWidth || img.width) * (scale || 2);
            canvas.height = (img.naturalHeight || img.height) * (scale || 2);

            if(ctx) {
                ctx.fillStyle = fillColor || 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                resolve(blob)
            }, 'image/png')
        }
        img.onerror = () => {
            resolve(null)
        }
    })
}

export function svgToDataURIWithType(svg: string, type?: string): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.src = `data:image/svg+xml;base64,${Base64.encode(svg)}`;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            resolve(canvas.toDataURL(type || 'image/png'))
        }
        img.onerror = () => {
            resolve(null)
        }
    })
}

export function dataURIToDataURIWithType(dataURI: string, type?: string): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.src = dataURI;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            resolve(canvas.toDataURL(type || 'image/png'))
        }
        img.onerror = () => {
            resolve(null)
        }
    })
}

export function svgToDataURI(svg: string) {
    return `data:image/svg+xml;base64,${Base64.encode(svg)}`
}

export function removeSVGUse(svg: string|SVGSVGElement) {
    let extract
    if(typeof svg === 'string') {
        const preview = document.createElement('div');
        preview.innerHTML = svg;
        extract = preview.querySelector('svg') as SVGSVGElement;
    } else {
        extract = svg;
    }
    
    let svgHTML = ''
    if (extract) {
        const width = extract.getAttribute('width');
        extract.style.width = width || '';
        const useList = extract.querySelectorAll('use');
        useList.forEach((node) => {
            const href = (node as SVGUseElement).getAttribute('xlink:href');
            if (href) {
                const path = extract.querySelector(href);
                if (path) {
                    const newPath = path.cloneNode(true) as SVGPathElement;
                    newPath.removeAttribute('id');
                    const attributes = node.attributes
                    const g = document.createElement('g');
                    for(let attr in attributes) {
                        const item = attributes[attr];
                        if(item.name !== 'xlink:href') {
                            g.setAttribute(item.name, item.value)
                        }
                    }
                    g.appendChild(newPath);
                    node.replaceWith(g)
                }
            }
        })
        const defs = extract.querySelector('defs')
        if (defs) {
            defs.remove();
        }
        svgHTML = extract.outerHTML;
    }
    return svgHTML;
}

export const clearEmpty = (html: string) => {
    if (!html) {
        return html;
    }

    return html.replace(
        new RegExp(
            "[\\r\\t\\n ]*</?(\\w+)\\s*(?:[^>]*)>[\\r\\t\\n ]*",
            "g"
        ),
        function (a: string, b: string) {
            // br 暂时单独处理
            if (b && b.toLowerCase() === 'br') {
                return a.replace(/(^[\n\r]+)|([\n\r]+$)/g, "");
            }

            return a
                .replace(
                    new RegExp(
                        "^[\\r\\t\\n ]+"
                    ),
                    ""
                )
                .replace(
                    new RegExp(
                        "[\\r\\t\\n ]+$"
                    ),
                    ""
                );
        }
    );
}
