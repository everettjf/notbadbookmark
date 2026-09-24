export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  children?: BookmarkNode[];
  dateAdded?: number;
  dateGroupModified?: number;
  index?: number;
  unmodifiable?: string;
  folderType?: string;
}

function call<T>(invoke: (done: (value: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    invoke(value => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message || 'Bookmark operation failed'));
      else resolve(value);
    });
  });
}

export class BookmarkService {
  static getAllBookmarks(): Promise<BookmarkNode[]> { return call(done => chrome.bookmarks.getTree(done)); }
  static searchBookmarks(query: string): Promise<BookmarkNode[]> { return call(done => chrome.bookmarks.search(query, done)); }
  static getBookmarksByFolder(id: string): Promise<BookmarkNode[]> { return call(done => chrome.bookmarks.getChildren(id, done)); }
  static async getNode(id: string): Promise<BookmarkNode> {
    const nodes = await call<BookmarkNode[]>(done => chrome.bookmarks.getSubTree(id, done));
    if (!nodes[0]) throw new Error('This item no longer exists. Refresh and try again.');
    return nodes[0];
  }
  static createBookmark(bookmark: { parentId?: string; title: string; url?: string; index?: number }): Promise<BookmarkNode> {
    return call(done => chrome.bookmarks.create(bookmark, done));
  }
  static updateBookmark(id: string, changes: { title?: string; url?: string }): Promise<BookmarkNode> {
    return call(done => chrome.bookmarks.update(id, changes, done));
  }
  static removeBookmark(id: string): Promise<void> { return call(done => chrome.bookmarks.remove(id, () => done(undefined))); }
  static removeTree(id: string): Promise<void> { return call(done => chrome.bookmarks.removeTree(id, () => done(undefined))); }
  static moveBookmark(id: string, destination: { parentId?: string; index?: number }): Promise<BookmarkNode> {
    return call(done => chrome.bookmarks.move(id, destination, done));
  }
  static flattenBookmarks(nodes: BookmarkNode[]): BookmarkNode[] { return allNodes(nodes).filter(n => n.url !== undefined); }
  static getFolders(nodes: BookmarkNode[]): BookmarkNode[] { return allNodes(nodes).filter(n => n.url === undefined); }
}
export function allNodes(nodes: BookmarkNode[]): BookmarkNode[] {
  return nodes.flatMap(n => [n, ...allNodes(n.children || [])]);
}
export function canEdit(node: BookmarkNode): boolean {
  return !!node.parentId && node.parentId !== '0' && !node.folderType && !node.unmodifiable;
}
export function canContain(node: BookmarkNode): boolean {
  return node.url === undefined && node.id !== '0' && !node.unmodifiable;
}
export function folderPath(id: string | undefined, folders: BookmarkNode[]): string {
  const names: string[] = [], seen = new Set<string>();
  while (id && !seen.has(id)) {
    seen.add(id);
    const node = folders.find(f => f.id === id);
    if (!node) break;
    if (node.title) names.unshift(node.title);
    id = node.parentId;
  }
  return names.join(' / ');
}
export function parentChoices(folders: BookmarkNode[], current?: BookmarkNode | null): BookmarkNode[] {
  const excluded = new Set(current ? allNodes([current]).map(n => n.id) : []);
  return folders.filter(f => canContain(f) && !excluded.has(f.id));
}
export function validURL(value: string): boolean {
  try { return !!new URL(value).protocol; } catch { return false; }
}
export function domainOf(value?: string): string {
  try { const u = new URL(value || ''); return u.hostname || u.protocol; } catch { return value || ''; }
}
export async function mutation<T>(work: () => Promise<T>): Promise<T> {
  // Serializes writes made by this extension across manager tabs.
  return navigator.locks.request('notbadbookmark-write', work);
}
export function messageOf(error: unknown): string { return error instanceof Error ? error.message : String(error); }
