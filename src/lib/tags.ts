// Tag metadata store. Chrome's bookmarks API has no concept of tags, so tags
// are kept in IndexedDB keyed by bookmark id. This module is the data layer
// only — read/write API plus pure filtering logic, no UI.

const DB_NAME = 'notbadbookmark';
const DB_VERSION = 1;
const STORE = 'bookmarkTags';

interface TagRecord {
  bookmarkId: string;
  tags: string[];
}

export interface TagSummary {
  tag: string;
  count: number;
}

export type TagMap = Record<string, string[]>;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'bookmarkId' });
        store.createIndex('tags', 'tags', { multiEntry: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = null; reject(request.error); };
  });
  return dbPromise;
}

function store(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function toPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Trim, drop blanks, and de-duplicate case-insensitively while preserving the
// first-seen display casing.
function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
}

export class TagStore {
  static async getTags(bookmarkId: string): Promise<string[]> {
    const db = await openDb();
    const record = await toPromise<TagRecord | undefined>(store(db, 'readonly').get(bookmarkId));
    return record?.tags ?? [];
  }

  static async setTags(bookmarkId: string, tags: string[]): Promise<void> {
    await TagStore.setMany({ [bookmarkId]: tags });
  }

  static async setMany(map: TagMap): Promise<void> {
    if (!Object.keys(map).length) return;
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => { announceTags(); resolve(); };
      tx.onabort = () => reject(tx.error || new Error('Tag changes could not be saved'));
      tx.onerror = () => reject(tx.error || new Error('Tag changes could not be saved'));
      for (const [bookmarkId, tags] of Object.entries(map)) {
        const normalized = normalizeTags(tags);
        if (normalized.length) tx.objectStore(STORE).put({ bookmarkId, tags: normalized });
        else tx.objectStore(STORE).delete(bookmarkId);
      }
    });
  }

  static async renameTag(oldName: string, newName: string): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => { announceTags(); resolve(); };
      tx.onabort = () => reject(tx.error || new Error('Tag rename failed'));
      tx.onerror = () => reject(tx.error || new Error('Tag rename failed'));
      const cursor = tx.objectStore(STORE).openCursor();
      cursor.onsuccess = () => {
        const row = cursor.result;
        if (!row) return;
        const record = row.value as TagRecord;
        const tags = normalizeTags(record.tags.map(t => t.toLowerCase() === oldName.toLowerCase() ? newName : t));
        if (tags.length) row.update({ ...record, tags }); else row.delete();
        row.continue();
      };
    });
  }

  static async addTag(bookmarkId: string, tag: string): Promise<void> {
    const current = await TagStore.getTags(bookmarkId);
    await TagStore.setTags(bookmarkId, [...current, tag]);
  }

  static async removeTag(bookmarkId: string, tag: string): Promise<void> {
    const current = await TagStore.getTags(bookmarkId);
    const key = tag.trim().toLowerCase();
    await TagStore.setTags(bookmarkId, current.filter((t) => t.toLowerCase() !== key));
  }

  static async getAllTagsMap(): Promise<TagMap> {
    const db = await openDb();
    const records = await toPromise<TagRecord[]>(store(db, 'readonly').getAll());
    const map: TagMap = {};
    for (const record of records) {
      map[record.bookmarkId] = record.tags;
    }
    return map;
  }

  static async getAllTags(): Promise<TagSummary[]> {
    const map = await TagStore.getAllTagsMap();
    const counts = new Map<string, TagSummary>();
    for (const tags of Object.values(map)) {
      for (const tag of tags) {
        const key = tag.toLowerCase();
        const entry = counts.get(key);
        if (entry) {
          entry.count += 1;
        } else {
          counts.set(key, { tag, count: 1 });
        }
      }
    }
    return Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || a.tag.localeCompare(b.tag)
    );
  }

  static async getBookmarkIdsByTag(tag: string): Promise<string[]> {
    const db = await openDb();
    const ids = await toPromise<IDBValidKey[]>(
      store(db, 'readonly').index('tags').getAllKeys(tag.trim())
    );
    return ids.map((id) => String(id));
  }

  static async removeBookmark(bookmarkId: string): Promise<void> { await TagStore.setTags(bookmarkId, []); }

  static async pruneTags(validIds: string[]): Promise<void> {
    const map = await TagStore.getAllTagsMap();
    const valid = new Set(validIds);
    const stale: TagMap = {};
    for (const id of Object.keys(map)) if (!valid.has(id)) stale[id] = [];
    if (Object.keys(stale).length) await TagStore.setMany(stale);
  }

}

/**
 * Pure tag filter. Returns bookmarks carrying the selected tags — all of them
 * when `matchAll` (the default), any of them otherwise. Matching is
 * case-insensitive. An empty selection passes everything through.
 */
export function filterByTags<T extends { id: string }>(
  bookmarks: T[],
  selectedTags: string[],
  tagMap: TagMap,
  matchAll = true
): T[] {
  if (selectedTags.length === 0) return bookmarks;
  const selected = selectedTags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (selected.length === 0) return bookmarks;

  return bookmarks.filter((bookmark) => {
    const tags = (tagMap[bookmark.id] ?? []).map((t) => t.toLowerCase());
    return matchAll
      ? selected.every((tag) => tags.includes(tag))
      : selected.some((tag) => tags.includes(tag));
  });
}

function announceTags() {
  window.dispatchEvent(new Event('notbadbookmark-tags'));
  const channel = new BroadcastChannel('notbadbookmark-tags');
  channel.postMessage('changed');
  channel.close();
}
