const emptyStates = {
  paragraph: {
    type: "paragraph",
    text: "",
  },
  "thematic-break": {
    type: "thematic-break",
    text: "---", // --- or ___ or ***
  },
  frontmatter: {
    type: "frontmatter",
    text: "",
    meta: {
      lang: "yaml", // yaml | toml | json
      style: "-", // `-` for yaml | `+` for toml | `;;;` and `{}` for json
    },
  },
  "atx-heading1": {
    type: "atx-heading1",
    meta: {
    },
    text: "# ", // can not contain `\n`!
  },
  table: {
    type: "table",
    children: [
      {
        type: "table-thead",
        children: [
          {
            type: "table-tr",
            children: [
              {
                type: "table-th",
                meta: {
                  align: "none", // none left center right, cells in the same column has the same alignment.
                },
                text: "",
              },
              {
                type: "table-th",
                meta: {
                  align: "none", // none left center right, cells in the same column has the same alignment.
                },
                text: "",
              },
            ],
          },
        ]
      },
      {
        type: "table-tbody",
        children: [
          {
            type: "table-tr",
            children: [
              {
                type: "table-td",
                meta: {
                  align: "none", // none left center right, cells in the same column has the same alignment.
                },
                text: "",
              },
              {
                type: "table-td",
                meta: {
                  align: "none", // none left center right, cells in the same column has the same alignment.
                },
                text: "",
              },
            ],
          },
        ]
      },
    ],
  },
  "math-block": {
    type: "math-block",
    text: "",
    meta: {
      mathStyle: "", // '' for `$$` and 'gitlab' for ```math
    },
  },
  "html-block": {
    type: "html-block",
    text: "<div>\n\n</div>",
  },
  "code-block": {
    type: "code-block",
    meta: {
      type: "fenced", // indented or fenced
      lang: "", // lang will be enpty string if block is indented block. set language will auto change into fenced code block.
    },
    text: "",
    children: [
      {
        type: "language",
        text: ""
      },
      {
        type: "code",
        meta: {
          lang: ""
        },
        text: ""
      }
    ]
  },
  "block-quote": {
    type: "block-quote",
    children: [
      {
        // Can contains any type and number of leaf blocks.
        type: "paragraph",
        text: "",
      },
    ],
  },
  "order-list": {
    type: "order-list",
    meta: {
      start: 1, // 0 ~ 999999999
      loose: true, // true or false, true is loose list and false is tight.
      delimiter: ".", // . or )
    },
    children: [
      // List Item
      {
        type: "list-item", // Can contains any type and number of leaf blocks.
        children: [
          {
            type: "paragraph",
            text: "",
          },
        ],
      },
    ],
  },
  "bullet-list": {
    type: "bullet-list",
    meta: {
      marker: "-", // - + *
      loose: false, // true or false
    },
    children: [
      // List Item
      {
        type: "list-item", // Can contains any type and number of leaf blocks.
        children: [
          {
            type: "paragraph",
            text: "",
          },
        ],
      },
    ],
  },
  "task-list": {
    type: "task-list",
    meta: {
      marker: "-", // - + *
      loose: false,
    },
    children: [
      {
        type: "task-list-item",
        meta: {
          checked: true, // true or false
        },
        children: [
          {
            type: "paragraph",
            text: "",
          },
        ],
      },
    ],
  },
  "diagram-block": {
    type: "diagram-block",
    text: "",
    meta: {
      lang: "yaml",
      type: "mermaid",
    },
  },
};

export default emptyStates;
