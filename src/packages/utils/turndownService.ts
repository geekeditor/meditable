
import { identity } from "./utils";
const turndownPluginGfm = require("joplin-turndown-plugin-gfm");
import TurndownService from "turndown";

export const addPluginAddRules = (turndownService, keeps) => {
  // Use the gfm plugin
  const { gfm } = turndownPluginGfm;
  turndownService.use(gfm);

  // We need a extra strikethrough rule because the strikethrough rule in gfm is single `~`.
  turndownService.addRule("strikethrough", {
    filter: ["del", "s", "strike"],
    replacement(content) {
      return "~~" + content + "~~";
    },
  });

  turndownService.addRule("paragraph", {
    filter: "p",

    replacement: function (content, node) {
      const isTaskListItemParagraph =
        node.previousElementSibling &&
        node.previousElementSibling.tagName === "INPUT";

      return isTaskListItemParagraph
        ? content + "\n\n"
        : "\n\n" + content + "\n\n";
    },
  });

  turndownService.addRule("listItem", {
    filter: "li",

    replacement: function (content, node, options) {
      content = content
        .replace(/^\n+/, "") // remove leading newlines
        .replace(/\n+$/, "\n") // replace trailing newlines with just a single one
        .replace(/\n/gm, "\n  "); // indent

      let prefix = options.bulletListMarker + " ";
      const parent = node.parentNode;
      if (parent.nodeName === "OL") {
        const start = parent.getAttribute("start");
        const index = Array.prototype.indexOf.call(parent.children, node);
        prefix = (start ? Number(start) + index : index + 1) + ". ";
      }

      return (
        prefix +
        content +
        (node.nextSibling && !/\n$/.test(content) ? "\n" : "")
      );
    },
  });

  // Handle multiple math lines
  turndownService.addRule("multiplemath", {
    filter(node, options) {
      return (
        node.nodeName === "PRE" && node.classList.contains("multiple-math")
      );
    },
    replacement(content, node, options) {
      return `$$\n${content}\n$$`;
    },
  });

  turndownService.escape = identity;
  turndownService.keep(keeps);
};

export const LINE_BREAK = "\n";
export const DEFAULT_TURNDOWN_CONFIG = {
    headingStyle: "atx", // setext or atx
    hr: "---",
    bulletListMarker: "-", // -, +, or *
    codeBlockStyle: "fenced", // fenced or indented
    fence: "```", // ``` or ~~~
    emDelimiter: "*", // _ or *
    strongDelimiter: "**", // ** or __
    linkStyle: "inlined",
    linkReferenceStyle: "full",
    blankReplacement(content, node, options) {
      if (node && node.classList.contains("mu-soft-line-break")) {
        return LINE_BREAK;
      } else if (node && node.classList.contains("mu-hard-line-break")) {
        return "  " + LINE_BREAK;
      } else if (node && node.classList.contains("mu-hard-line-break-sapce")) {
        return "";
      } else {
        return node.isBlock ? "\n\n" : "";
      }
    },
  };

export default TurndownService;
