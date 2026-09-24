const vi = { fn: <T,>(fn: T): T => fn, stubGlobal: (key: string, value: unknown) => { Object.assign(globalThis, { [key]: value }); } };
import type { BookmarkNode } from '../src/lib/bookmarks';
export function mockChrome(initial?: BookmarkNode[]) {
  const tree: BookmarkNode[] = initial || [{ id: '0', title: '', children: [{ id: '1', parentId: '0', title: 'Bar', children: [] }, { id: '2', parentId: '0', title: 'Other', children: [] }] }];
  let next = 100;
  const data: Record<string, unknown> = {};
  let failMethod = '', failTimes = 0;
  const events = Object.fromEntries(['onCreated','onRemoved','onChanged','onMoved','onChildrenReordered','onImportEnded'].map(name => {
    const listeners = new Set<() => void>();
    return [name, { addListener: (cb: () => void) => listeners.add(cb), removeListener: (cb: () => void) => listeners.delete(cb), emit: () => listeners.forEach(cb => cb()) }];
  }));
  const find = (id: string, ns = tree): BookmarkNode | undefined => { for (const n of ns) { if (n.id === id) return n; const child = find(id, n.children || []); if (child) return child; } };
  const runtime: { lastError?: { message: string } } = {};
  const done = (method: string, cb: (v?: unknown) => void, work: () => unknown) => {
    try {
      if (method === failMethod && failTimes-- > 0) throw new Error(`Injected ${method} failure`);
      const result = work(); cb(structuredClone(result));
    } catch (e) { runtime.lastError = { message: String(e) }; cb(); delete runtime.lastError; }
  };
  const parent = (id: string) => { const n = find(id); if (!n || n.url !== undefined) throw new Error('Parent missing'); return n; };
  const detach = (id: string) => { const node = find(id); if (!node?.parentId) throw new Error('Missing item'); const p = parent(node.parentId); p.children = (p.children || []).filter(n => n.id !== id); return node; };
  const api = {
    runtime, bookmarks: { ...events,
      getTree: vi.fn(cb => done('getTree', cb, () => tree)),
      getSubTree: vi.fn((id, cb) => done('getSubTree', cb, () => { const n = find(id); if (!n) throw new Error('Missing item'); return [n]; })),
      getChildren: vi.fn((id, cb) => done('getChildren', cb, () => parent(id).children || [])),
      search: vi.fn((_q, cb) => done('search', cb, () => [])),
      create: vi.fn((input, cb) => done('create', cb, () => { const p = parent(input.parentId || '2'); const n = { id: String(next++), parentId: p.id, title: input.title, ...(input.url !== undefined ? { url: input.url } : { children: [] }), index: input.index ?? p.children?.length ?? 0 }; (p.children ||= []).splice(n.index, 0, n); events.onCreated.emit(); return n; })),
      update: vi.fn((id, changes, cb) => done('update', cb, () => { const n = find(id); if (!n) throw new Error('Missing item'); Object.assign(n, changes); events.onChanged.emit(); return n; })),
      move: vi.fn((id, destination, cb) => done('move', cb, () => { const p = parent(destination.parentId); const n = detach(id); n.parentId = p.id; (p.children ||= []).splice(destination.index ?? p.children.length, 0, n); events.onMoved.emit(); return n; })),
      remove: vi.fn((id, cb) => done('remove', cb, () => { if (find(id)?.children?.length) throw new Error('Folder not empty'); detach(id); events.onRemoved.emit(); })),
      removeTree: vi.fn((id, cb) => done('removeTree', cb, () => { detach(id); events.onRemoved.emit(); }))
    }, storage: { local: {
      get: vi.fn((key, cb) => done('storage.get', cb, () => ({ [key]: data[key] }))),
      set: vi.fn((value, cb = () => {}) => done('storage.set', cb, () => { Object.assign(data, structuredClone(value)); }))
    } }, tabs: { create: vi.fn() }
  };
  vi.stubGlobal('chrome', api);
  return { api, tree, find, data, fail: (method: string, times = 1) => { failMethod = method; failTimes = times; } };
}
