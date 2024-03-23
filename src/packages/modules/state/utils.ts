import { MEBlockData } from "@/packages/types";
import { beginRules } from "../content/inlineRenderers/tokenizer/rules";

export function collectReferenceDefinitions(state: MEBlockData[]) {
    
    const labels = new Map()

    const travel = sts => {
      if (Array.isArray(sts) && sts.length) {
        for (const st of sts) {
          if (st.name === 'paragraph') {
            const { label, info } = getLabelInfo(st)
            if (label && info) {
              labels.set(label, info)
            }
          } else if (st.children) {
            travel(st.children)
          }
        }
      }
    }

    travel(state)

    return labels
  }

export function  getLabelInfo(block: MEBlockData) {
    const { text } = block
    const tokens = beginRules.reference_definition.exec(text)
    let label = null
    let info = null
    if (tokens) {
      label = (tokens[2] + tokens[3]).toLowerCase()
      info = {
        href: tokens[6],
        title: tokens[10] || ''
      }
    }

    return { label, info }
  }