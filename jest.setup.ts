class ResizeObserverPolyfill {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = ResizeObserverPolyfill
}

// jsdom doesn't implement layout, so Range.getBoundingClientRect / getClientRects
// don't exist. Provide stubs so MEditable's selection code doesn't crash.
if (typeof Range !== 'undefined') {
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = function () {
      return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) } as DOMRect
    }
  }
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function () {
      return [] as unknown as DOMRectList
    }
  }
}

if (typeof document !== 'undefined' && !(document as any).elementsFromPoint) {
  ;(document as any).elementsFromPoint = () => [] as Element[]
}
