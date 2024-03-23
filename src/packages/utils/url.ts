import { isValidAttribute } from "./dompurify";

export const URL_REG =
  /^http(s)?:\/\/([a-z0-9\-._~]+\.[a-z]{2,}|[0-9.]+|localhost|\[[a-f0-9.:]+\])(:[0-9]{1,5})?\/[\S]+/i;

export const sanitizeHyperlink = (rawLink) => {
  if (
    rawLink &&
    typeof rawLink === "string" &&
    isValidAttribute("a", "href", rawLink)
  ) {
    return rawLink;
  }

  return "";
};