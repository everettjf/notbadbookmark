import { BookmarkNode, BookmarkService, canContain, messageOf, validURL } from './bookmarks';
import { TagMap, TagStore } from './tags';

export interface PortableNode { title: string; url?: string; children?: PortableNode[]; tags?: string[]; dateAdded?: number; }
export interface BookmarkExport { version: string; exportDate: string; scope?: string; bookmarks: PortableNode[]; }
export type DuplicatePolicy = 'keep' | 'folder' | 'global';
export interface ImportResult { imported: number; folders: number; skipped: number; errors: string[]; cancelled: boolean; createdIds: string[]; }
export interface ImportProgress { completed: number; total: number; }
export function countNodes(nodes: PortableNode[]): number { return nodes.reduce((n, b) => n + 1 + countNodes(b.children || []), 0); }
const escapeHTML = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]!));

// Export browser root containers as ordinary folders so their grouping is retained.
export function exportTree(nodes: BookmarkNode[], tags: TagMap): PortableNode[] {
  return nodes.flatMap(n => n.id === '0' ? exportTree(n.children || [], tags) : [{
    title: n.title, dateAdded: n.dateAdded,
    ...(n.url !== undefined ? { url: n.url, tags: tags[n.id] || [] } : { children: exportTree(n.children || [], tags) })
  }]);
}
export function validateNodes(input: unknown, depth = 0, budget = { count: 0 }): PortableNode[] {
  if (!Array.isArray(input)) throw new Error('Bookmarks must be an array.');
  if (depth > 64) throw new Error('Folder nesting exceeds 64 levels.');
  return input.map((raw: unknown) => {
    if (++budget.count > 100000) throw new Error('Import exceeds 100,000 items. Split the file first.');
    if (!raw || typeof raw !== 'object') throw new Error('Invalid bookmark entry.');
    const n = raw as Record<string, unknown>;
    if (typeof n.title !== 'string') throw new Error('Every item needs a text title.');
    if (n.url !== undefined && (typeof n.url !== 'string' || !validURL(n.url))) throw new Error(`Invalid URL in “${n.title}”.`);
    if (n.url !== undefined && n.children !== undefined) throw new Error('An item cannot be both a folder and a bookmark.');
    if (n.tags !== undefined && (!Array.isArray(n.tags) || n.tags.some(t => typeof t !== 'string'))) throw new Error('Invalid tag list.');
    return { title: n.title, ...(n.url !== undefined ? { url: n.url as string, tags: (n.tags as string[]) || [] }
      : { children: validateNodes(n.children || [], depth + 1, budget) }),
      ...(typeof n.dateAdded === 'number' && Number.isFinite(n.dateAdded) ? { dateAdded: n.dateAdded } : {}) };
  });
}

export interface ImportPreview { bookmarks: number; folders: number; duplicates: number; }
export function previewImport(nodes: PortableNode[], existing: BookmarkNode[], parentId: string, policy: DuplicatePolicy, separate: boolean): ImportPreview {
  const global = new Set(BookmarkService.flattenBookmarks(existing).map(n => n.url!.trim()));
  const folders = BookmarkService.getFolders(existing);
  const report = { bookmarks: 0, folders: 0, duplicates: 0 };
  const walk = (items: PortableNode[], children: BookmarkNode[]) => {
    const urls = new Set(children.filter(c => c.url !== undefined).map(c => c.url!.trim()));
    // Simulate newly created folders too, so repeated folder names match execution.
    const virtual = children.map(c => ({ ...c, children: c.children ? [...c.children] : undefined }));
    for (const n of items) {
      if (n.url !== undefined) {
        report.bookmarks++;
        if (policy === 'global' ? global.has(n.url.trim()) : policy === 'folder' && urls.has(n.url.trim())) report.duplicates++;
        urls.add(n.url.trim()); global.add(n.url.trim());
      } else {
        report.folders++;
        const matches = virtual.filter(c => c.url === undefined && c.title === n.title && canContain(c));
        const target = policy !== 'keep' && matches.length === 1 ? matches[0] : {id: `preview-${report.folders}`, title:n.title, children: []};
        if (!virtual.includes(target)) virtual.push(target);
        walk(n.children || [], target.children || []);
        // Populate simulated children for subsequent occurrences of the same folder.
        target.children = [...(target.children || []), ...(n.children || []).map((c,i) => ({id:`virtual-${i}`, ...c}) as BookmarkNode)];
      }
    }
  };
  walk(nodes, separate ? [] : folders.find(f => f.id === parentId)?.children || []);
  return report;
}

export class ImportExportService {
  static parseImportFile(content: string): BookmarkExport {
    let data;
    try { data = JSON.parse(content); } catch { throw new Error('This file is not valid JSON.'); }
    if (!data || !['1.0.0', '2.0.0', undefined].includes(data.version)) throw new Error('Unsupported backup version.');
    return { version: data.version || '1.0.0', exportDate: data.exportDate || '', bookmarks: validateNodes(data.bookmarks) };
  }
  static parseNetscapeTree(content: string): PortableNode[] {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    const root = doc.querySelector('dl');
    if (!root) throw new Error('No bookmark folder structure found in this HTML file.');
    const walk = (dl: Element, depth: number): PortableNode[] => {
      if (depth > 64) throw new Error('Folder nesting exceeds 64 levels.');
      const result: PortableNode[] = [];
      for (const dt of Array.from(dl.children).filter(e => e.tagName === 'DT')) {
        const h = dt.querySelector(':scope > h3'), a = dt.querySelector(':scope > a');
        if (h) {
          const child = dt.querySelector(':scope > dl') || (dt.nextElementSibling?.tagName === 'DL' ? dt.nextElementSibling : null);
          result.push({ title: h.textContent || '', children: child ? walk(child, depth + 1) : [] });
        } else if (a) result.push({ title: a.textContent || '', url: a.getAttribute('href') || '' });
      }
      return result;
    };
    const nodes = validateNodes(walk(root, 0));
    const links = (ns: PortableNode[]): number => ns.reduce((sum,n) => sum + (n.url !== undefined ? 1 : links(n.children || [])), 0);
    if (links(nodes) !== doc.querySelectorAll('a[href]').length) throw new Error('This HTML layout could not be read without losing structure. Export a standard browser bookmark HTML file.');
    return nodes;
  }
  static async readFile(file: File): Promise<BookmarkExport> {
    if (file.size > 25 * 1024 * 1024) throw new Error('Files must be smaller than 25 MB.');
    const text = await file.text();
    return /\.html?$/i.test(file.name)
      ? { version: '2.0.0', exportDate: '', bookmarks: this.parseNetscapeTree(text) }
      : this.parseImportFile(text);
  }
  static exportToHTML(nodes: PortableNode[]): string {
    const walk = (items: PortableNode[]): string => '<DL><p>\n' + items.map(n => n.url !== undefined
      ? `<DT><A HREF="${escapeHTML(n.url)}">${escapeHTML(n.title)}</A>\n`
      : `<DT><H3>${escapeHTML(n.title)}</H3>\n${walk(n.children || [])}`).join('') + '</DL><p>\n';
    return '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n' + walk(nodes);
  }
  static exportToMarkdown(nodes: PortableNode[]): string {
    const label = (s: string) => s.replace(/[\\`*_[\]<>]/g, '\\$&').replace(/[\r\n]/g, ' ');
    const walk = (ns: PortableNode[], level: number): string => ns.map(n => n.url !== undefined
      ? `${'  '.repeat(level)}- [${label(n.title)}](<${n.url.replace(/[<>\s]/g, c => encodeURIComponent(c))}>)\n`
      : `${'  '.repeat(level)}- **${label(n.title)}**\n${walk(n.children || [], level + 1)}`).join('');
    return '# NotBadBookmark Export\n\nReading copy; use JSON for a full backup.\n\n' + walk(nodes, 0);
  }
  static async downloadBookmarks(format: 'json' | 'html' | 'markdown', nodes?: BookmarkNode[], scope = 'all', snapshotTags?: TagMap): Promise<void> {
    const data = exportTree(nodes || await BookmarkService.getAllBookmarks(), snapshotTags || await TagStore.getAllTagsMap());
    const content = format === 'json' ? JSON.stringify({ version: '2.0.0', exportDate: new Date().toISOString(), scope, bookmarks: data }, null, 2)
      : format === 'html' ? this.exportToHTML(data) : this.exportToMarkdown(data);
    const url = URL.createObjectURL(new Blob([content], { type: format === 'html' ? 'text/html;charset=utf-8' : format === 'json' ? 'application/json' : 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `bookmarks-${scope}-${new Date().toISOString().slice(0,10)}.${format === 'markdown' ? 'md' : format}`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  static async importBookmarks(data: BookmarkExport, parentId: string, policy: DuplicatePolicy = 'folder',
    progress?: (p: ImportProgress) => void, signal?: AbortSignal): Promise<ImportResult> {
    const nodes = validateNodes(data.bookmarks);
    if (!canContain(await BookmarkService.getNode(parentId))) throw new Error('Choose a writable target folder.');
    const existing = BookmarkService.flattenBookmarks(await BookmarkService.getAllBookmarks());
    const globalURLs = new Set(existing.map(n => n.url!.trim()));
    const result: ImportResult = { imported: 0, folders: 0, skipped: 0, errors: [], cancelled: false, createdIds: [] };
    let pendingTags: TagMap = {};
    const flushTags = async () => {
      const batch = pendingTags; pendingTags = {};
      if (!Object.keys(batch).length) return;
      try { await TagStore.setMany(batch); }
      catch (e) { result.errors.push(`Bookmarks created, but tags were not saved for IDs ${Object.keys(batch).join(', ')}: ${messageOf(e)}`); }
    };
    let completed = 0;
    const total = countNodes(nodes);
    const walk = async (items: PortableNode[], target: string, path: string) => {
      const children = await BookmarkService.getBookmarksByFolder(target);
      const urls = new Set(children.filter(n => n.url !== undefined).map(n => n.url!.trim()));
      for (const n of items) {
        if (signal?.aborted) { result.cancelled = true; return; }
        const location = `${path}/${n.title}`;
        try {
          if (n.url !== undefined) {
            const duplicate = policy === 'global' ? globalURLs.has(n.url.trim()) : policy === 'folder' && urls.has(n.url.trim());
            if (duplicate) result.skipped++;
            else {
              const created = await BookmarkService.createBookmark({ parentId: target, title: n.title, url: n.url });
              result.imported++; result.createdIds.push(created.id); urls.add(n.url.trim()); globalURLs.add(n.url.trim());
              if (n.tags?.length) pendingTags[created.id] = n.tags;
              if (Object.keys(pendingTags).length >= 50) await flushTags();
            }
          } else {
            // Only merge a uniquely named folder; ambiguous names must not be guessed.
            const matches = children.filter(c => c.url === undefined && c.title === n.title && canContain(c));
            const folder = policy !== 'keep' && matches.length === 1 ? matches[0]
              : await BookmarkService.createBookmark({ parentId: target, title: n.title });
            if (!matches.some(m => m.id === folder.id)) { result.folders++; result.createdIds.push(folder.id); children.push(folder); }
            await walk(n.children || [], folder.id, location);
          }
        } catch (e) { result.errors.push(`${location}: ${messageOf(e)}`); }
        progress?.({ completed: ++completed, total });
      }
    };
    await walk(nodes, parentId, '');
    await flushTags();
    return result;
  }
}
