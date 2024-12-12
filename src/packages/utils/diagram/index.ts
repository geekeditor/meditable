import sanitize, { PREVIEW_DOMPURIFY_CONFIG } from "../dompurify";
import { vega } from "vega-embed";

const rendererCache = new Map();
/**
 *
 * @param {string} name the renderer name: sequence, plantuml, flowchart, mermaid, vega-lite
 */
const loadRenderer = async (name) => {
  if (!rendererCache.has(name)) {
    let m;
    switch (name) {
      case "sequence":
        m = await import("./sequence");
        rendererCache.set(name, m.default);
        break;
        
      case "plantuml":
        m = await import("./plantuml");
        rendererCache.set(name, m.default);
        break;

      case "flowchart":
        m = await import("flowchart.js");
        rendererCache.set(name, m.default);
        break;

      case "mermaid":
        m = await import("mermaid");
        rendererCache.set(name, m.default);
        break;

      case "vega-lite":
        m = await import("vega-embed");
        rendererCache.set(name, m.default);
        break;
      default:
        throw new Error(`Unknown diagram name ${name}`);
    }
  }

  return rendererCache.get(name);
};

const observeRenderComplete = (target, renderCallback): Promise<boolean>=> {

  return new Promise((resolve)=>{
    const observer = new MutationObserver((mutations)=>{
      mutations.forEach((mutation)=>{
        if(mutation.addedNodes.length) {
          observer.disconnect()
          resolve(true)
        }
      })
    })
  
    observer.observe(target, {childList: true})
    renderCallback()
  })

}

const renderDiagram = async ({ type, code, target, theme }: {type: string; code: string; target?: HTMLElement; theme?: string}):Promise<string> => {
  const render = await loadRenderer(type)
  target = target || document.createElement('div')
  const options = {}
  if (type === 'sequence') {
    Object.assign(options, { theme })
  } else if (type === 'vega-lite') {
    Object.assign(options, {
      actions: false,
      tooltip: false,
      renderer: 'svg',
      theme
    })
  }

  if (type === 'flowchart' || type === 'sequence') {
    const diagram = render.parse(code)
    target.innerHTML = ''
    await observeRenderComplete(target, ()=>{
      diagram.drawSVG(target, options)
    })
  } else if (type === 'plantuml') {
    const diagram = render.parse(code)
    target.innerHTML = ''
    await diagram.insertElement(target)
  } else if (type === 'vega-lite') {
    await render(target, JSON.parse(code), options)
  } else if (type === 'mermaid') {
    render.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme
    })
    await render.parse(code)
    target.innerHTML = sanitize(code, PREVIEW_DOMPURIFY_CONFIG)
    target.removeAttribute('data-processed')
    await render.run({
      nodes: [target]
    })
  }

  return target.innerHTML;
}

export default renderDiagram;
