import '@testing-library/jest-dom/vitest';

// jsdom lacks matchMedia (used by useViewport for the adaptive layout — feature 002).
// Provide a default non-matching stub; individual tests may override window.matchMedia
// with a controllable implementation to exercise wide/landscape behaviour.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom lacks a PointerEvent constructor, so fireEvent.pointer* would synthesize an
// event without clientX/clientY/pointerId — breaking the swipe gesture's dx/dy math.
// Polyfill it as a MouseEvent subclass so pointer coordinates flow through.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.PointerEvent = PointerEventPolyfill as any;
}

// jsdom does not implement pointer capture; the swipe-to-delete gesture calls these.
// Make them no-ops so component tests can drive pointer events without throwing.
const elementProto = Element.prototype as unknown as Record<string, unknown>;
if (typeof elementProto.setPointerCapture !== 'function') {
  elementProto.setPointerCapture = () => {};
}
if (typeof elementProto.releasePointerCapture !== 'function') {
  elementProto.releasePointerCapture = () => {};
}
if (typeof elementProto.hasPointerCapture !== 'function') {
  elementProto.hasPointerCapture = () => false;
}
