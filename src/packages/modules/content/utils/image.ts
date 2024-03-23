import { tokenizer } from "../inlineRenderers/tokenizer";
import { findEditableDOM, getOffsetOfParent } from "./dom";

export const isWin =
  window &&
  window.navigator.userAgent &&
  /win32|wow32|win64|wow64/i.test(window.navigator.userAgent);

export const getImageInfo = (image) => {
  const paragraph = findEditableDOM(image);
  const raw = image.getAttribute("data-raw");
  const offset = getOffsetOfParent(image, paragraph);
  const tokens = tokenizer(raw);
  const token = tokens[0];
  token.range = {
    start: offset,
    end: offset + raw.length,
  };

  return {
    token,
    imageId: image.id,
  };
};

export const getImageSrc = (src) => {
  const EXT_REG = /\.(jpeg|jpg|png|gif|svg|webp)(?=\?|$)/i;
  // http[s] (domain or IPv4 or localhost or IPv6) [port] /not-white-space
  const URL_REG =
    /^http(s)?:\/\/([a-z0-9\-._~]+\.[a-z]{2,}|[0-9.]+|localhost|\[[a-f0-9.:]+\])(:[0-9]{1,5})?\/[\S]+/i;
  const DATA_URL_REG =
    /^data:image\/[\w+-]+(;[\w-]+=[\w-]+|;base64)*,[a-zA-Z0-9+/]+={0,2}$/;
  const BLOB_URL_REG = /^blob:http/;
  const imageExtension = EXT_REG.test(src);
  const isUrl = URL_REG.test(src);
  if (imageExtension) {
    if (isUrl) {
      return {
        isUnknownType: false,
        src,
        isBlobType: false
      };
    } else {
      return {
        isUnknownType: true,
        src,
        isBlobType: false
      };
    }
  } else if (isUrl && !imageExtension) {
    return {
      isUnknownType: true,
      src,
      isBlobType: false
    };
  } else {
    const isDataUrl = DATA_URL_REG.test(src);
    if (isDataUrl) {
      return {
        isUnknownType: false,
        src,
        isBlobType: false
      };
    } else {
      const isBlobType = BLOB_URL_REG.test(src);
      return {
        isUnknownType: true,
        src,
        isBlobType
      };
    }
  }
};


// export const checkImageContentType = async (url) => {
//   try {
//     const res = await axios.head(url);
//     const contentType = res.headers["content-type"];
//     if (
//       res.status === 200 &&
//       /^image\/(?:jpeg|png|gif|svg\+xml|webp)$/.test(contentType)
//     ) {
//       return true;
//     }

//     return false;
//   } catch (err) {
//     return false;
//   }
// };

export const correctImageSrc = (src) => {
  if (src) {
    // Fix ASCII and UNC paths on Windows (#1997).
    if (isWin && /^(?:[a-zA-Z]:\\|[a-zA-Z]:\/).+/.test(src)) {
      src = "file:///" + src.replace(/\\/g, "/");
    } else if (isWin && /^\\\\\?\\.+/.test(src)) {
      src = "file:///" + src.substring(4).replace(/\\/g, "/");
    } else if (/^\/.+/.test(src)) {
      // Also adding file protocol on UNIX.
      src = src;
    }
  }

  return src;
};


const imageMap = new Map<string, File>();
const urlMap = new Map<string, string>();
export const imageUtils = {
  createObjectURL(file: File) {
    const url = URL.createObjectURL(file)
    imageMap.set(url, file);
    return url;
  },
  getObjectURL(src: string) {
    const url = urlMap.get(src);
    return url;
  },
  setObjectURL(src, url) {
    urlMap.set(src, url)
  },
  getFileWithURL(url: string) {
    const file = imageMap.get(url);
    return file;
  },
  clearURL(url: string) {
    imageMap.set(url, null)
  }
}

export function selectFiles(config: { multiple?: boolean; accept?: string } = {}): Promise<File[]> {
  return new Promise((resolve, reject) => {
      /**
       * Create a new INPUT element
       * @type {HTMLElement}
       */
      let inputElement = document.createElement('INPUT') as HTMLInputElement;

      /**
       * Set a 'FILE' type for this input element
       * @type {string}
       */
      inputElement.type = 'file';

      if (config.multiple) {
          inputElement.setAttribute('multiple', 'multiple');
      }

      if (config.accept) {
          inputElement.setAttribute('accept', config.accept);
      }

      /**
       * Do not show element
       */
      inputElement.style.display = 'none';

      /**
       * Append element to the body
       * Fix using module on mobile devices
       */
      document.body.appendChild(inputElement);

      /**
       * Add onchange listener for «choose file» pop-up
       */
      inputElement.addEventListener('change', event => {


          /**
           * Get files from input field
           */
          const files = (event as any).target?.files;

          /**
           * Return ready to be uploaded files array
           */
          resolve(files);

          /**
           * Remove element from a DOM
           */
          document.body.removeChild(inputElement);
      }, false);

      /**
       * Fire click event on «input file» field
       */
      inputElement.click();
  });
};
