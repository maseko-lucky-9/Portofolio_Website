import "@testing-library/jest-dom/vitest";

// Polyfill IntersectionObserver for jsdom (used by framer-motion viewport features)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit
  ) {}

  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver;

// Polyfill ResizeObserver for jsdom (used by Radix UI components)
class MockResizeObserver {
  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Suppress matchMedia (used by useReducedMotion, next-themes, etc.)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
