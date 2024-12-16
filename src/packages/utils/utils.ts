import env from "./env";


let gFactor = Date.now()
export function generateId(factor?: number): string {
  factor = factor || (gFactor++)
  // tslint:disable-next-line:no-bitwise
  return `${Number(Math.random().toString().substr(2,10) + factor).toString(36)}`;
}

export function debounce(func: () => void, wait?: number, immediate?: boolean): () => void {
    let timeout:any;
  
    return function(){
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const context = this,
          // eslint-disable-next-line prefer-rest-params
          args = arguments;
  
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const later = () => {
        timeout = null;
        if (!immediate) {
          func.apply(context, args as any);
        }
      };
  
      const callNow = immediate && !timeout;
  
      window.clearTimeout(timeout);
      timeout = window.setTimeout(later, wait);
      if (callNow) {
        func.apply(context, args as any);
      }
    };
}

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
          derivedCtor.prototype[name] = baseCtor.prototype[name];
      });
  });
}

export const deepCopyArray = (array) => {
  const result = [];
  const len = array.length;
  let i;

  for (i = 0; i < len; i++) {
    if (typeof array[i] === "object" && array[i] !== null) {
      if (Array.isArray(array[i])) {
        result.push(deepCopyArray(array[i]));
      } else {
        result.push(deepCopy(array[i]));
      }
    } else {
      result.push(array[i]);
    }
  }

  return result;
};

export const deepCopy = (object) => {
  const obj = {};
  Object.keys(object).forEach((key) => {
    if (typeof object[key] === "object" && object[key] !== null) {
      if (Array.isArray(object[key])) {
        obj[key] = deepCopyArray(object[key]);
      } else {
        obj[key] = deepCopy(object[key]);
      }
    } else {
      obj[key] = object[key];
    }
  });

  return obj as any;
};

export const identity = (i) => i;


declare var ClipboardItem: any;
export const copyContent = (content: Blob | string | { [type: string]: string }, types?: string[]) => {
    return new Promise((resolve) => {
        const copyContent = async (e: any) => {
            e = e || window.event;

            if (content instanceof Blob) {
                const text = await content.text()
                e.clipboardData.setData(content.type, text);
            } else if (typeof content !== 'string' && Object.keys(content).length) {

                Object.entries(content).forEach(([type, value]) => {
                    e.clipboardData.setData(type, value);
                })

            } else {
                if (types) {
                    types.forEach((type) => {
                        e.clipboardData.setData(type, content.toString());
                    })
                }
            }

            e.preventDefault();
            document.removeEventListener('copy', copyContent);
            resolve(true);
        }

        document.addEventListener('copy', copyContent);
        document.execCommand('copy');
    })

}

export function canCopyBlob() {
    return typeof ClipboardItem !== 'undefined' && !env.safari;
}

export async function copyBlob(blob: Blob) {
    if (canCopyBlob()) {
        const data = [
            new ClipboardItem({
                [blob.type]: blob
            })
        ]
        return (navigator.clipboard as any).write(data)
    }
}

export function download(filename: string, content: string | Blob, contentType?: string) {
    contentType = contentType || (content instanceof Blob ? (content as Blob).type : 'application/octet-stream')
    const a = document.createElement('a');
    const blob = new Blob([content], { 'type': contentType });

    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

export async function saveToDisk(filename: string, content: string | Blob, down?: boolean) {
    const supportFSA = typeof (window as any).showSaveFilePicker === 'function';
    if (!down && supportFSA) {

        const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename
        });

        // Create a FileSystemWritableFileStream to write to.
        const writable = await (fileHandle as any).createWritable();
        // Write the contents of the file to the stream.
        await writable.write(content);
        // Close the file and write the contents to disk.
        writable.close();

    } else {
        download(filename, content);
    }
}

export async function print(content: string, title?: string) {
    const iframe = document.createElement('iframe') as HTMLIFrameElement;
    iframe.setAttribute("width", "100%");
    iframe.setAttribute("height", "100%");
    iframe.setAttribute("frameborder", "0");
    iframe.style.cssText = "display: none;";
    // iframe.src = './core.html';

    iframe.onload = (e: any) => {
        const contentWindow = e.target?.contentWindow as Window;
        const originalTitle = document.title;

        const removeIframe = () => {
            document.title = originalTitle;
            setTimeout(() => {
                iframe.remove()
            }, 1000)
        }
        if (!contentWindow) {
            removeIframe()
            return;
        }

        let doc = contentWindow.document as Document;
        doc.open();
        doc.domain = document.domain;
        doc.write(content);
        doc.close();

        contentWindow.onafterprint = () => {
            removeIframe()
        };
        if (title) {
            document.title = title;
        }
        contentWindow.print();

    };
    iframe.onerror = () => {
        iframe.remove()
    }

    document.body.appendChild(iframe);
}

export function getFileFullname(filename: string, type: 'html' | 'markdown' | 'pdf' | string) {
    const exts: { [key: string]: string } = {
        'html': '.html',
        'markdown': '.md',
        'pdf': '.pdf',
        'docx': '.docx',
        'image': '.png'
    }

    return `${filename}${exts[type] || ''}`
}

export async function selectFSADirectory(): Promise<{ fsaId: string; dirHandle: any } | undefined> {
    const supportFSA = typeof (window as any).showDirectoryPicker === 'function';
    const fsaId = `fsa_${Date.now()}`
    if (!supportFSA) return undefined;
    const dirHandle = await (window as any).showDirectoryPicker({
        id: fsaId,
    })

    if (!dirHandle) {
        return undefined;
    }

    return {
        fsaId,
        dirHandle
    }
}

export const getNowFormatDate = () => {
    const date = new Date();
    const seperator1 = "-";
    let year = date.getFullYear();
    let month: any = date.getMonth() + 1;
    let strDate: any = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    let currentdate = year + seperator1 + month + seperator1 + strDate;
    return currentdate;
}

export const getImageRatio = (src: string) => {
    return new Promise<any>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            resolve(h > 0 ? w / h : NaN);
        };
        img.onerror = () => {
            resolve(NaN)
        }

    })
}

export const getImageSize = (src: string) => {
    return new Promise<any>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            resolve({ w, h });
        };
        img.onerror = () => {
            resolve({})
        }
    })
}

export function regexWithSearchKey(key: string) {
    const words = [];
    for (let i = 0; i < key.length; i++) {
        words.push(`(${key.charAt(i)})`)
    }
    return new RegExp(`(.*)${words.join('(.*)')}(.*)`)
}


export function getFileExtension(file: File): string {
    return file.name.split('.').pop() || '';
  }
