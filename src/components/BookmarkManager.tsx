import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useTags } from '@/hooks/useTags';
import { usePersistedState } from '@/hooks/usePersistedState';
import { BookmarkNode, BookmarkService, allNodes, canEdit, folderPath, messageOf, mutation, parentChoices } from '@/lib/bookmarks';
import { BookmarkExport, ImportExportService } from '@/lib/import-export';
import { RecoveryRecord, deleteRecoverably, recoveryRecords, restoreRecord } from '@/lib/recovery';
import { ImportHistory, readImportHistory } from '@/lib/import-history';
import { TagStore } from '@/lib/tags';
import { queryBookmarks } from '@/lib/query';
import { DraggableBookmarkItem } from './DraggableBookmarkItem';
import { FolderItem } from './FolderItem';
import { FolderTree } from './FolderTree';
import { SearchBar } from './SearchBar';
import { BookmarkDialog } from './BookmarkDialog';
import { FolderDialog } from './FolderDialog';
import { ImportDialog } from './ImportDialog';
import { VirtualBookmarkGrid } from './VirtualBookmarkGrid';
import { SortDropdown, SortOption } from './SortDropdown';
import { TagFilter } from './TagFilter';
import { ThemeToggle } from './ThemeToggle';
import { ExportDropdown } from './ExportDropdown';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from './ui/dialog';
import { toast } from '@/hooks/use-toast';

export function BookmarkManager() {
  const { tree, bookmarks, folders, error, isLoading, refreshBookmarks } = useBookmarks();
  const tags = useTags();
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [descendants, setDescendants] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matchAll, setMatchAll] = useState(true);
  const [viewMode, setViewMode] = usePersistedState<'grid' | 'list'>('viewMode', 'list');
  const [sortOption, setSortOption] = usePersistedState<SortOption>('sortOption', 'newest-first');
  const [sidebarOpen, setSidebarOpen] = usePersistedState('sidebarOpen', true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkNode | null>(null);
  const createdDraftId = useRef<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<BookmarkNode | null>(null);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [deleteItems, setDeleteItems] = useState<BookmarkNode[]>([]);
  const [operationError, setOperationError] = useState('');
  const [importData, setImportData] = useState<BookmarkExport | null>(null);
  const [exportScope, setExportScope] = useState<'all' | 'folder' | 'selected'>('all');
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [records, setRecords] = useState<RecoveryRecord[]>([]);
  const [restoreParent, setRestoreParent] = useState('');
  const [tagOpen, setTagOpen] = useState(false);
  const [oldTag, setOldTag] = useState('');
  const [newTag, setNewTag] = useState('');
  const visibleTags = useMemo(() => {
    const counts = new Map<string, {tag:string; count:number}>();
    for (const b of bookmarks) for (const tag of tags.tagMap[b.id] || []) {
      const key = tag.toLowerCase(), previous = counts.get(key);
      counts.set(key, {tag:previous?.tag || tag, count:(previous?.count || 0) + 1});
    }
    return Array.from(counts.values()).sort((a,b) => a.tag.localeCompare(b.tag));
  }, [bookmarks, tags.tagMap]);
  const contentRef = useRef<HTMLDivElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const results = useMemo(() => queryBookmarks(tree, tags.tagMap, { text: query, folderId: selectedFolder, descendants,
    tags: selectedTags, matchAll, domain, sort: sortOption }), [tree, tags.tagMap, query, selectedFolder, descendants, selectedTags, matchAll, domain, sortOption]);
  const activeFilter = !!(query.trim() || domain.trim() || selectedTags.length);
  const currentFolder = folders.find(f => f.id === selectedFolder);
  const defaultParent = selectedFolder || parentChoices(folders)[0]?.id;
  const clearSelection = () => { setSelected(new Set()); setSelecting(false); };
  useEffect(() => { setSelected(new Set()); setSelecting(false); contentRef.current?.scrollTo({ top: 0 }); }, [query, domain, selectedTags, matchAll, selectedFolder, descendants]);
  useEffect(() => {
    const ids = new Set(results.bookmarks.filter(canEdit).map(b => b.id));
    setSelected(old => new Set([...old].filter(id => ids.has(id))));
  }, [results]);
  useEffect(() => { if (selectedFolder && !isLoading && !folders.some(f => f.id === selectedFolder)) setSelectedFolder(null); }, [folders, selectedFolder, isLoading]);
  const refresh = async () => { await Promise.all([refreshBookmarks(), tags.refresh()]); };
  const run = async (work: () => Promise<void>): Promise<boolean> => {
    if (guard.current) return false;
    guard.current = true; setBusy(true); setOperationError('');
    try { await mutation(work); await refresh(); return true; }
    catch (e) { setOperationError(messageOf(e)); await refresh(); return false; }
    finally { guard.current = false; setBusy(false); }
  };
  const navigate = (id: string | null) => { clearSelection(); setSelectedFolder(id); };
  const resetFilters = () => { setQuery(''); setDomain(''); setSelectedTags([]); };
  const editableResults = results.bookmarks.filter(canEdit);
  const allSelected = editableResults.length > 0 && editableResults.every(b => selected.has(b.id));
  const toggle = (id: string) => { setSelecting(true); setSelected(old => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };

  const saveBookmark = async (data: { title: string; url: string; parentId?: string; tags: string[] }) => {
    await mutation(async () => {
      let id = editingBookmark?.id || createdDraftId.current;
      if (id) {
        const live = await BookmarkService.getNode(id);
        if (!canEdit(live)) throw new Error('This item is read-only.');
        await BookmarkService.updateBookmark(id, { title: data.title, url: data.url });
        if (data.parentId && data.parentId !== live.parentId) {
          try { await BookmarkService.moveBookmark(id, { parentId: data.parentId }); }
          catch (e) { throw new Error(`Title and URL saved, but move failed: ${messageOf(e)}`); }
        }
      } else {
        const created = await BookmarkService.createBookmark({ title: data.title, url: data.url, parentId: data.parentId });
        id = created.id; createdDraftId.current = id; // Retry partial saves without resetting the form or creating another item.
      }
      try { await TagStore.setTags(id, data.tags); }
      catch (e) { throw new Error(`Bookmark saved, but tags failed. Retry saving: ${messageOf(e)}`); }
    });
    await refresh();
  };
  const saveFolder = async (data: { title: string; parentId?: string }) => {
    await mutation(async () => {
      if (editingFolder) {
        const live = await BookmarkService.getNode(editingFolder.id);
        const choices = parentChoices(BookmarkService.getFolders(await BookmarkService.getAllBookmarks()), live);
        if (!canEdit(live) || !choices.some(f => f.id === data.parentId)) throw new Error('Choose a writable folder outside this subtree.');
        await BookmarkService.updateBookmark(live.id, { title: data.title });
        if (data.parentId !== live.parentId) {
          try { await BookmarkService.moveBookmark(live.id, { parentId: data.parentId }); }
          catch (e) { throw new Error(`Name saved, but move failed: ${messageOf(e)}`); }
        }
      } else await BookmarkService.createBookmark(data);
    });
    await refresh();
  };
  const deleteConfirmed = async () => {
    const failures: BookmarkNode[] = [], errors: string[] = [];
    await run(async () => {
      for (const node of deleteItems) {
        try { await deleteRecoverably(node.id, node); }
        catch (e) { failures.push(node); errors.push(`${node.title}: ${messageOf(e)}`); }
      }
      setDeleteItems(failures); clearSelection();
      if (errors.length) throw new Error(errors.join('\n'));
      toast({ title: 'Deleted', description: 'Open Recovery to restore these items.' });
    });
  };
  const exportBookmarks = async (format: 'json' | 'html' | 'markdown') => {
    try {
      const nodes = exportScope === 'all' ? tree : exportScope === 'folder' ? currentFolder ? [currentFolder] : [] : bookmarks.filter(b => selected.has(b.id));
      if (!nodes.length) throw new Error('Choose a nonempty export scope.');
      await ImportExportService.downloadBookmarks(format, nodes, exportScope);
      toast({ title: 'Download prepared', description: 'JSON includes folders and tags. Browser IDs are not portable.' });
    } catch (e) { setOperationError(messageOf(e)); }
  };
  const dragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || busy) return;
    const overId = String(over.id);
    await run(async () => {
      const node = await BookmarkService.getNode(String(active.id));
      if (!canEdit(node)) throw new Error('This item cannot be moved.');
      if (overId.startsWith('folder:')) {
        const target = overId.slice(7);
        if (!parentChoices(BookmarkService.getFolders(await BookmarkService.getAllBookmarks())).some(f => f.id === target)) throw new Error('This folder is read-only.');
        await BookmarkService.moveBookmark(node.id, { parentId: target });
      } else {
        if (!selectedFolder || activeFilter || descendants || sortOption !== 'manual') throw new Error('To reorder, open one folder, clear filters, and choose Manual order.');
        const target = await BookmarkService.getNode(overId);
        if (node.parentId !== selectedFolder || target.parentId !== selectedFolder) throw new Error('The folder changed. Refresh and retry.');
        await BookmarkService.moveBookmark(node.id, { parentId: selectedFolder, index: target.index });
      }
    });
  };
  const renderBookmark = (bookmark: BookmarkNode) => <DraggableBookmarkItem bookmark={bookmark} tags={tags.tagMap[bookmark.id]}
    path={folderPath(bookmark.parentId, folders)} query={query} onLocate={() => { resetFilters(); navigate(bookmark.parentId || null); }}
    onEdit={b => { setEditingBookmark(b); setBookmarkOpen(true); }} onDelete={b => { setOperationError(''); setDeleteItems([b]); }}
    onCopy={async b => { try { await navigator.clipboard.writeText(b.url || ''); toast({ title: 'Link copied' }); } catch (e) { setOperationError(messageOf(e)); } }}
    isSelected={selected.has(bookmark.id)} isSelectionMode={selecting} onToggleSelection={toggle} disabled={busy || !canEdit(bookmark)} />;

  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
    <div className="h-full flex bg-background text-foreground">
      {sidebarOpen && <aside aria-label="Folders" className="folder-sidebar w-56 min-w-40 max-w-[35vw] border-r overflow-auto resize-x"><h2 className="p-3 text-sm font-semibold">Folders</h2><FolderTree folders={folders} selectedFolder={selectedFolder} onFolderSelect={navigate}
        onEditFolder={f => { setEditingFolder(f); setFolderOpen(true); }} onDeleteFolder={f => { setOperationError(''); setDeleteItems([f]); }} /></aside>}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="workspace-header border-b p-3 space-y-3">
          <div className="flex flex-wrap gap-2 items-center"><Button variant="ghost" aria-label="Toggle folder sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</Button><h1 className="font-semibold mr-auto">NotBadBookmark</h1><ThemeToggle /></div>
          <div className="flex flex-wrap gap-2"><SearchBar value={query} onSearch={setQuery} /><input className="rounded border border-input bg-background px-2 min-w-0 placeholder:text-muted-foreground" aria-label="Filter by domain" placeholder="Domain filter…" value={domain} onChange={e => setDomain(e.target.value)} />
            <TagFilter allTags={visibleTags} selected={selectedTags} onChange={setSelectedTags} />
            {selectedTags.length > 0 && <select aria-label="Tag matching" className="border rounded bg-background" value={matchAll ? 'all' : 'any'} onChange={e => setMatchAll(e.target.value === 'all')}><option value="all">All tags</option><option value="any">Any tag</option></select>}
          </div>
          <div className="flex flex-wrap gap-2 items-center text-sm"><span>Scope:</span><Button variant="link" onClick={() => navigate(null)}>All bookmarks</Button>{currentFolder && <><span>/</span><span title={folderPath(currentFolder.id, folders)} className="truncate max-w-xs">{folderPath(currentFolder.id, folders)}</span><label className="flex gap-1"><input type="checkbox" checked={descendants} onChange={e => setDescendants(e.target.checked)} />Include subfolders</label></>}
            <span role="status" className="text-muted-foreground">{results.bookmarks.length} bookmarks · {results.folders.length} folders</span>
            {activeFilter && <Button variant="link" onClick={resetFilters}>Clear all filters</Button>}
            {selectedTags.map(tag => <Button key={tag} variant="outline" size="sm" aria-label={`Remove filter ${tag}`} onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}>{tag} ×</Button>)}
          </div>
          <fieldset disabled={busy} className="flex flex-wrap gap-2 items-center">
            <Button size="sm" onClick={() => { createdDraftId.current = null; setEditingBookmark(null); setBookmarkOpen(true); }}>Add bookmark</Button><Button size="sm" variant="outline" onClick={() => { setEditingFolder(null); setFolderOpen(true); }}>Add folder</Button>
            <Button size="sm" variant="outline" onClick={() => importInput.current?.click()}>Import…</Button>
            <input ref={importInput} type="file" accept=".json,.html,.htm" hidden onChange={async e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) { try { setImportData(await ImportExportService.readFile(file)); } catch (e) { setOperationError(messageOf(e)); } } }} />
            <select aria-label="Export scope" className="border rounded bg-background text-sm py-1" value={exportScope} onChange={e => setExportScope(e.target.value as typeof exportScope)}><option value="all">Export all</option><option value="folder" disabled={!currentFolder}>Current folder + children</option><option value="selected" disabled={!selected.size}>Selected bookmarks</option></select><ExportDropdown onExport={exportBookmarks} />
            <Button size="sm" variant="outline" onClick={() => { setRecoveryOpen(true); setOperationError(''); void Promise.all([recoveryRecords().then(setRecords), readImportHistory().then(setImportHistory)]).catch(e => setOperationError(messageOf(e))); }}>Recovery</Button>
            <Button size="sm" variant="outline" onClick={() => { setOldTag(visibleTags[0]?.tag || ''); setNewTag(''); setTagOpen(true); setOperationError(''); }}>Manage tags</Button>
            <SortDropdown currentSort={sortOption} onSortChange={setSortOption} /><Button size="sm" variant="ghost" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>{viewMode === 'list' ? 'Grid view' : 'List view'}</Button>
          </fieldset>
          <div className="flex flex-wrap gap-2 items-center">{selecting ? <><span>{selected.size} selected in current results</span><Button size="sm" variant="outline" onClick={() => setSelected(allSelected ? new Set() : new Set(editableResults.map(b => b.id)))}>{allSelected ? 'Deselect all' : 'Select all results'}</Button><Button disabled={!selected.size || busy} size="sm" variant="destructive" onClick={() => { setOperationError(''); setDeleteItems(bookmarks.filter(b => selected.has(b.id))); }}>Delete selected…</Button><Button size="sm" variant="ghost" onClick={clearSelection}>Cancel selection</Button></> : <Button disabled={!editableResults.length} size="sm" variant="ghost" onClick={() => setSelecting(true)}>Select bookmarks</Button>}</div>
        </header>
        {(error || tags.error || operationError) && <div role="alert" className="border-b p-3 text-destructive text-sm whitespace-pre-wrap">{operationError || error || tags.error}<Button variant="link" onClick={() => { setOperationError(''); void refresh(); }}>Refresh</Button></div>}
        <div ref={contentRef} className="flex-1 overflow-auto p-3">
          {isLoading ? <p role="status">Loading bookmarks…</p> : <>
            {results.folders.length > 0 && <section aria-label="Folder results" className="grid gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>{results.folders.map(f => <FolderItem key={f.id} folder={f} onFolderSelect={f => navigate(f.id)} onEdit={f => { setEditingFolder(f); setFolderOpen(true); }} onDelete={f => { setOperationError(''); setDeleteItems([f]); }} />)}</section>}
            <SortableContext items={results.bookmarks.map(b => b.id)} strategy={viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy}>
              {results.bookmarks.length > 150 ? <VirtualBookmarkGrid count={results.bookmarks.length} viewMode={viewMode} scrollRef={contentRef} renderItem={i => <React.Fragment key={results.bookmarks[i].id}>{renderBookmark(results.bookmarks[i])}</React.Fragment>} />
                : <div className="grid gap-1.5" style={{ gridTemplateColumns: viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))' }}>{results.bookmarks.map(b => <React.Fragment key={b.id}>{renderBookmark(b)}</React.Fragment>)}</div>}
            </SortableContext>
            {!results.bookmarks.length && !results.folders.length && <div className="text-center py-16"><h2 className="font-semibold">{activeFilter ? 'No matching items' : currentFolder ? 'This folder is empty' : 'No bookmarks yet'}</h2><p className="text-muted-foreground my-2">{activeFilter ? 'Try another search, change the scope, or clear the filters.' : 'Add a bookmark or import your collection.'}</p>{activeFilter && <Button onClick={resetFilters}>Clear filters</Button>}</div>}
          </>}
        </div>
      </main>
    </div>
    <BookmarkDialog isOpen={bookmarkOpen} onClose={() => setBookmarkOpen(false)} onSave={saveBookmark} bookmark={editingBookmark} folders={folders} defaultParentId={defaultParent} />
    <FolderDialog isOpen={folderOpen} onClose={() => setFolderOpen(false)} onSave={saveFolder} folder={editingFolder} folders={folders} defaultParentId={defaultParent} />
    {importData && <ImportDialog data={importData} folders={folders} defaultParent={defaultParent} onClose={() => setImportData(null)} onChanged={() => void refresh()} />}
    <Dialog open={deleteItems.length > 0} onOpenChange={open => { if (!open && !busy) setDeleteItems([]); }}><DialogContent><DialogHeader><DialogTitle>Delete these items?</DialogTitle><DialogDescription>A local recovery snapshot is saved before each deletion. Recovery stays in this browser profile; export JSON for an independent backup.</DialogDescription></DialogHeader>
      <p>{allNodes(deleteItems).filter(n => n.url !== undefined).length} bookmarks and {allNodes(deleteItems).filter(n => n.url === undefined).length} folders, including all descendants.</p>
      <ul className="max-h-40 overflow-auto">{deleteItems.map(n => <li key={n.id}>{n.title} — {folderPath(n.parentId, folders)}</li>)}</ul>
      {operationError && <p role="alert" className="text-destructive whitespace-pre-wrap">{operationError}</p>}
      <div className="flex gap-2 justify-end"><Button variant="outline" disabled={busy} onClick={() => setDeleteItems([])}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={() => void deleteConfirmed()}>{busy ? 'Deleting…' : 'Delete with recovery'}</Button></div>
    </DialogContent></Dialog>
    <Dialog open={recoveryOpen} onOpenChange={open => { if (!busy) setRecoveryOpen(open); }}><DialogContent className="max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>Recovery</DialogTitle><DialogDescription>Restore deleted items and tags. Restored bookmarks receive new browser IDs and creation dates.</DialogDescription></DialogHeader>
      <label>Destination<select aria-label="Restore destination" className="block w-full border rounded p-2 bg-background" value={restoreParent} onChange={e => setRestoreParent(e.target.value)}><option value="">Original parent if available</option>{parentChoices(folders).map(f => <option key={f.id} value={f.id}>{folderPath(f.id, folders)}</option>)}</select></label>
      {operationError && <p role="alert" className="text-destructive">{operationError}</p>}
      {importHistory.length > 0 && <details><summary>Recent import reports</summary>{importHistory.slice().reverse().map(h => <div key={h.id} className="text-sm border-b py-2"><p>{new Date(h.startedAt).toLocaleString()} · {folderPath(h.targetId, folders) || 'Destination unavailable'}</p>{h.result ? <><p>{h.result.imported} added · {h.result.skipped} skipped · {h.result.errors.length} errors{h.result.cancelled ? ' · Stopped' : ''}</p>{h.result.errors.map((e,i) => <p key={i}>{e}</p>)}</> : <p>Interrupted or report unavailable. Inspect the destination before importing again.</p>}</div>)}</details>}
      {!records.length && <p>No recovery records.</p>}
      {records.slice().reverse().map(r => <div key={r.id} className="border rounded p-2 space-y-1"><p>{r.node.title} · {new Date(r.createdAt).toLocaleString()} · {r.state}</p><Button size="sm" disabled={busy || r.state === 'restored'} onClick={() => void run(async () => { await restoreRecord(r.id, restoreParent || undefined); setRecords(await recoveryRecords()); })}>Restore</Button><Button size="sm" variant="link" onClick={() => void ImportExportService.downloadBookmarks('json', [r.node], 'recovery', r.tags).catch(e => setOperationError(messageOf(e)))}>Export snapshot</Button></div>)}
    </DialogContent></Dialog>
    <Dialog open={tagOpen} onOpenChange={open => { if (!busy) setTagOpen(open); }}><DialogContent><DialogHeader><DialogTitle>Rename or remove a tag</DialogTitle><DialogDescription>Renaming to an existing tag merges them. Removing a tag never deletes bookmarks.</DialogDescription></DialogHeader>
      <select aria-label="Tag to change" className="border rounded p-2 bg-background" value={oldTag} onChange={e => setOldTag(e.target.value)}><option value="">Choose a tag</option>{visibleTags.map(t => <option key={t.tag} value={t.tag}>{t.tag} ({t.count} bookmarks)</option>)}</select>
      <input aria-label="New tag name" className="border rounded p-2 bg-background" placeholder="New tag name" value={newTag} onChange={e => setNewTag(e.target.value)} />
      {operationError && <p role="alert" className="text-destructive">{operationError}</p>}
      <Button disabled={!oldTag || !newTag.trim() || busy} onClick={() => void run(async () => { await TagStore.renameTag(oldTag, newTag.trim()); setSelectedTags([]); setTagOpen(false); })}>Rename / merge tag</Button>
      <Button variant="outline" disabled={!oldTag || busy} onClick={() => void run(async () => { await TagStore.renameTag(oldTag, ''); setSelectedTags([]); setTagOpen(false); })}>Remove this tag from all bookmarks</Button>
    </DialogContent></Dialog>
  </DndContext>;
}
