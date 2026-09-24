import { allNodes, BookmarkNode, domainOf } from './bookmarks';
import { filterByTags, TagMap } from './tags';
import { SortOption } from '../components/SortDropdown';
export interface Query { text: string; folderId: string | null; descendants: boolean; tags: string[]; matchAll: boolean; domain: string; sort: SortOption; }
export function queryBookmarks(tree: BookmarkNode[], tagMap: TagMap, q: Query): { bookmarks: BookmarkNode[]; folders: BookmarkNode[] } {
  const nodes = allNodes(tree), folders = nodes.filter(n => n.url === undefined);
  const byId = new Map(folders.map(f => [f.id, f]));
  const paths = new Map<string, string>();
  const path = (id?: string, seen = new Set<string>()): string => {
    if (!id || seen.has(id)) return '';
    if (paths.has(id)) return paths.get(id)!;
    seen.add(id); const n = byId.get(id);
    const result = n ? `${path(n.parentId, seen)} / ${n.title}` : ''; paths.set(id, result); return result;
  };
  const selected = folders.find(f => f.id === q.folderId);
  const ids = new Set(selected ? allNodes(selected.children || []).map(n => n.id) : []);
  const text = q.text.trim().toLocaleLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const scope = (n: BookmarkNode) => !q.folderId || (q.descendants ? ids.has(n.id) : n.parentId === q.folderId);
  const matches = (n: BookmarkNode) => words.every(w => `${n.title}\n${n.url || ''}\n${path(n.parentId)}`.toLocaleLowerCase().includes(w));
  const results = filterByTags(nodes.filter(n => n.url !== undefined && scope(n) && matches(n) &&
    (!q.domain.trim() || domainOf(n.url).toLocaleLowerCase().includes(q.domain.trim().toLocaleLowerCase()))), q.tags, tagMap, q.matchAll);
  const sort = (a: BookmarkNode, b: BookmarkNode): number => {
    let difference = 0;
    switch (q.sort) {
      case 'title-asc': difference = a.title.localeCompare(b.title); break;
      case 'title-desc': difference = b.title.localeCompare(a.title); break;
      case 'domain-asc': difference = domainOf(a.url).localeCompare(domainOf(b.url)); break;
      case 'domain-desc': difference = domainOf(b.url).localeCompare(domainOf(a.url)); break;
      case 'oldest-first': difference = (a.dateAdded || 0) - (b.dateAdded || 0); break;
      case 'newest-first': difference = (b.dateAdded || 0) - (a.dateAdded || 0); break;
      case 'manual': difference = (a.parentId || '').localeCompare(b.parentId || '') || (a.index || 0) - (b.index || 0); break;
    }
    return difference || a.id.localeCompare(b.id);
  };
  return { bookmarks: results.sort(sort), folders: q.tags.length || q.domain.trim() ? [] : folders.filter(n =>
    n.id !== '0' && scope(n) && (text ? matches(n) : n.parentId === (q.folderId || '0'))) };
}
