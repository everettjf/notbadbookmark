import 'fake-indexeddb/auto';
import { vi } from 'vitest';
class Channel { onmessage: unknown; postMessage() {} close() {} }
vi.stubGlobal('BroadcastChannel', Channel);
Object.defineProperty(navigator, 'locks', { value: { request: async (_name: string, cb: () => unknown) => cb() }, configurable: true });
Object.defineProperty(Element.prototype, 'scrollTo', { value: () => {}, configurable: true });
class Observer { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', Observer);
Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }), configurable: true });
