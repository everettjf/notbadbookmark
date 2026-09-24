import { allNodes, BookmarkNode, BookmarkService, canContain, canEdit, messageOf } from './bookmarks';
import { TagMap, TagStore } from './tags';

export interface RecoveryRecord {
  id: string; createdAt: string; node: BookmarkNode; tags: TagMap;
  state: 'prepared' | 'deleted' | 'restoring' | 'restored';
  restoredIds: Record<string, string>;
  pendingCreate?: string;
}
const KEY = 'recovery-v1';
export async function recoveryRecords(): Promise<RecoveryRecord[]> {
  return new Promise((resolve, reject) => chrome.storage.local.get(KEY, data => {
    if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
    else resolve(data[KEY] || []);
  }));
}
async function save(record: RecoveryRecord): Promise<void> {
  const records = await recoveryRecords();
  const next = [...records.filter(r => r.id !== record.id), record];
  await new Promise<void>((resolve, reject) => chrome.storage.local.set({ [KEY]: next }, () => {
    if (chrome.runtime.lastError) reject(new Error(`Recovery record could not be saved: ${chrome.runtime.lastError.message}`));
    else resolve();
  }));
}
export async function deleteRecoverably(id: string, expected?: BookmarkNode): Promise<void> {
  const node = await BookmarkService.getNode(id);
  const fingerprint = (n: BookmarkNode): string => JSON.stringify({ id: n.id, title: n.title, url: n.url, parentId: n.parentId, children: (n.children || []).map(fingerprint) });
  if (expected && fingerprint(node) !== fingerprint(expected)) throw new Error('This item changed after the confirmation opened. Cancel, review its contents, and try again.');
  if (!canEdit(node)) throw new Error('This browser or managed item cannot be deleted.');
  const allTags = await TagStore.getAllTagsMap();
  const tags: TagMap = {};
  for (const n of allNodes([node])) if (allTags[n.id]) tags[n.id] = allTags[n.id];
  const record: RecoveryRecord = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), node, tags, state: 'prepared', restoredIds: {} };
  await save(record); // Abort before deleting if durable backup cannot be written.
  if (node.url !== undefined) await BookmarkService.removeBookmark(node.id);
  else await BookmarkService.removeTree(node.id);
  record.state = 'deleted';
  await save(record);
  const cleared: TagMap = {};
  for (const id of Object.keys(tags)) cleared[id] = [];
  await TagStore.setMany(cleared);
}
export async function restoreRecord(id: string, fallbackParentId?: string): Promise<void> {
  const record = (await recoveryRecords()).find(r => r.id === id);
  if (!record || record.state === 'restored') throw new Error('This record is already restored or unavailable.');
  if (record.pendingCreate) throw new Error('A previous restore was interrupted during creation. Inspect the destination and export this recovery record before continuing; automatic retry could create duplicates.');
  const tree = allNodes(await BookmarkService.getAllBookmarks());
  if (tree.some(n => n.id === record.node.id)) throw new Error('The original item still exists. Nothing needs to be restored.');
  const originalParent = tree.find(n => n.id === record.node.parentId);
  const parentId = fallbackParentId || (originalParent && canContain(originalParent) ? originalParent.id : undefined);
  if (!parentId || !canContain(await BookmarkService.getNode(parentId))) throw new Error('The original folder is unavailable. Choose a writable restore destination.');
  record.state = 'restoring'; await save(record);
  const walk = async (node: BookmarkNode, parent: string) => {
    let newId = record.restoredIds[node.id];
    if (newId) {
      // Never silently recreate a partially restored item removed by another window.
      await BookmarkService.getNode(newId);
    } else {
      record.pendingCreate = node.id; await save(record);
      let created: BookmarkNode;
      try {
        const siblings = await BookmarkService.getBookmarksByFolder(parent);
        created = await BookmarkService.createBookmark({ title: node.title, url: node.url, parentId: parent,
          index: Math.min(node.index ?? siblings.length, siblings.length) });
      } catch (e) { delete record.pendingCreate; await save(record); throw e; }
      newId = created.id; record.restoredIds[node.id] = newId;
      delete record.pendingCreate; await save(record);
    }
    if (node.url !== undefined) await TagStore.setTags(newId, record.tags[node.id] || []);
    for (const child of node.children || []) await walk(child, newId);
  };
  try { await walk(record.node, parentId); record.state = 'restored'; await save(record); }
  catch (e) { throw new Error(`Restore incomplete. Completed items are retained. ${messageOf(e)}`); }
}
