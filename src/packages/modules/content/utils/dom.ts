import { CLASS_NAMES } from "@/packages/utils/classNames";

export const isEditableDOM = (element) => {
    return (
        element &&
        element.nodeType === 1 &&
        element.contentEditable === 'true'
    );
};

export const findEditableDOM = (node) => {
    if (!node) {
        return null;
    }

    do {
        if (isEditableDOM(node)) {
            return node;
        }
        node = node.parentNode;
    } while (node);
};

export const getTextContent = (node, blackList) => {
    if (node.nodeType === 3) {
        return node.textContent;
    } else if (!blackList) {
        return node.textContent;
    }

    let text = "";
    if (
        blackList.some(
            (className) => node.classList && node.classList.contains(className)
        )
    ) {
        return text;
    }

    if (node.nodeType === 3) {
        text += node.textContent;
    } else if (
        node.nodeType === 1 &&
        node.classList.contains(`${CLASS_NAMES.ME_INLINE_IMAGE}`)
    ) {
        // handle inline image
        const raw = node.getAttribute("data-raw");
        const imageContainer = node.querySelector(
            `.${CLASS_NAMES.ME_IMAGE_CONTAINER}`
        );
        const hasImg = imageContainer.querySelector("img");
        const childNodes = imageContainer.childNodes;
        if (childNodes.length && hasImg) {
            for (const child of childNodes) {
                if (child.nodeType === 1 && child.nodeName === "IMG") {
                    text += raw;
                } else if (child.nodeType === 3) {
                    text += child.textContent;
                }
            }
        } else {
            text += raw;
        }
    } else {
        const childNodes = node.childNodes;

        for (const n of childNodes) {
            text += getTextContent(n, blackList);
        }
    }

    return text;

    // return text.replace(/\u00a0/g, ' ');
};

export const getOffsetOfParent = (node, parent) => {
    let offset = 0;
    let preSibling = node;

    if (node === parent || !parent.contains(node)) return offset;

    do {
        preSibling = preSibling.previousSibling;
        if (preSibling) {
            offset += getTextContent(preSibling, [
                CLASS_NAMES.ME_INLINE_RENDER
            ]).length;
        }
    } while (preSibling);

    return node === parent || node.parentNode === parent
        ? offset
        : offset + getOffsetOfParent(node.parentNode, parent);
};

export const getNodeAndOffset = (node, offset) => {
    if (node.nodeType === 3) {
        return {
            node,
            offset,
        };
    }

    const childNodes = node.childNodes;
    const len = childNodes.length;
    let i;
    let count = 0;

    for (i = 0; i < len; i++) {
        const child = childNodes[i];
        const textContent = getTextContent(child, [
            CLASS_NAMES.ME_INLINE_RENDER
        ]);
        const textLength = textContent.length;

        //put the cursor at the next text node or element if it can be put at the last of /^\n$/ or the next text node/element.
        if (
            /^\n$/.test(textContent) && i !== len - 1
                ? count + textLength > offset
                : count + textLength >= offset
        ) {
            if (
                child.classList &&
                child.classList.contains(`${CLASS_NAMES.ME_INLINE_IMAGE}`)
            ) {
                const imageContainer = child.querySelector(
                    `.${CLASS_NAMES.ME_IMAGE_CONTAINER}`
                );
                const hasImg = imageContainer.querySelector("img");

                if (!hasImg) {
                    return {
                        node: child,
                        offset: 0,
                    };
                }

                if (count + textLength === offset) {
                    if (child.nextElementSibling) {
                        return {
                            node: child.nextElementSibling,
                            offset: 0,
                        };
                    } else {
                        return {
                            node: imageContainer,
                            offset: 1,
                        };
                    }
                } else if (count === offset && count === 0) {
                    return {
                        node: imageContainer,
                        offset: 0,
                    };
                } else {
                    return {
                        node: child,
                        offset: 0,
                    };
                }
            } else {
                return getNodeAndOffset(child, offset - count);
            }
        } else {
            count += textLength;
        }
    }

    return { node, offset };
};

export const compareParagraphsOrder = (paragraph1, paragraph2) => {
    return (
      paragraph1.compareDocumentPosition(paragraph2) &
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  };