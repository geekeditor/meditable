import purify from "dompurify";

const { sanitize, isValidAttribute } = purify;

export { isValidAttribute };

export const PREVIEW_DOMPURIFY_CONFIG = {
    // do not forbid `class` because `code` element use class to present language
    FORBID_ATTR: ["style", "contenteditable"],
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: {
        html: true,
        svg: true,
        svgFilters: true,
        mathMl: false,
    },
    RETURN_TRUSTED_TYPE: false,
};

export const EXPORT_DOMPURIFY_CONFIG = {
    FORBID_ATTR: ["contenteditable"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["data-align"],
    USE_PROFILES: {
        html: true,
        svg: true,
        svgFilters: true,
        mathMl: false,
    },
    RETURN_TRUSTED_TYPE: false,
    // Allow "file" protocol to export images on Windows (#1997).
    ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

export default sanitize;
