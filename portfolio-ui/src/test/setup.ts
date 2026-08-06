import "@testing-library/jest-dom/vitest";

// Polyfill IntersectionObserver for jsdom (used by framer-motion viewport features)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
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

// jsdom does not implement scrollIntoView at all — it throws rather than
// no-opping, so any component that scrolls on click blows up under test.
Element.prototype.scrollIntoView = function scrollIntoView() {};

// Same story for element-level scrollTo (ChatWidget pins its log to the
// bottom on every streamed token).
Element.prototype.scrollTo = function scrollTo() {} as Element["scrollTo"];

// Polyfill localStorage / sessionStorage for jsdom — recent jsdom releases
// expose these as host objects whose methods are non-callable in some
// configurations. ThemeContext + AuthContext call getItem/setItem at module
// load, so a reliable replacement keeps the suite green across jsdom upgrades.
function createStorage(): Storage {
  let store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store = new Map();
    },
    getItem: (key: string) => (store.has(key) ? (store.get(key) ?? null) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
}
Object.defineProperty(window, "localStorage", {
  value: createStorage(),
  writable: false,
  configurable: true,
});
Object.defineProperty(window, "sessionStorage", {
  value: createStorage(),
  writable: false,
  configurable: true,
});

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
