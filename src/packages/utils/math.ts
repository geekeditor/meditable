import "mathjax/es5/tex-mml-svg";
import { removeSVGUse } from "./convert";
const MathJax: any = (window as any).MathJax;

export function tex2svgPromise(tex: string): Promise<string> {
    return MathJax.tex2svgPromise(tex).then((node: HTMLElement) => {
        const svg = node.querySelector('svg');
        if(svg) {
            removeSVGUse(svg)
            const html = svg.outerHTML;
            return html;
        }
        
        return ''
    })
}

export async function renderMath(tex: string, target: HTMLElement): Promise<string> {
    const html = await tex2svgPromise(tex);
    target.innerHTML = html;
    return html;
}