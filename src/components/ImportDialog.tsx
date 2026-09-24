import React, { useRef, useState } from 'react';
import { BookmarkNode, folderPath, messageOf, mutation, parentChoices, BookmarkService } from '@/lib/bookmarks';
import { BookmarkExport, countNodes, DuplicatePolicy, ImportExportService, ImportProgress, ImportResult, previewImport } from '@/lib/import-export';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { saveImportHistory, ImportHistory } from '@/lib/import-history';
export function ImportDialog({ data, folders, defaultParent, onClose, onChanged }: {
  data: BookmarkExport; folders: BookmarkNode[]; defaultParent?: string; onClose: () => void; onChanged: () => void;
}) {
  const [parent, setParent] = useState(defaultParent || parentChoices(folders)[0]?.id || '');
  const [separate, setSeparate] = useState(true);
  const [policy, setPolicy] = useState<DuplicatePolicy>('folder');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController>();
  const running = useRef(false);
  const total = countNodes(data.bookmarks);
  const preview = previewImport(data.bookmarks, folders.filter(f => f.parentId === '0'), parent, policy, separate);
  const start = async () => {
    if (running.current) return;
    running.current = true; setBusy(true); setError(''); controller.current = new AbortController();
    try {
      await mutation(async () => {
        let target = parent;
        if (separate) target = (await BookmarkService.createBookmark({ parentId: parent, title: `Imported ${new Date().toLocaleString()}` })).id;
        const entry: ImportHistory = { id: crypto.randomUUID(), startedAt: new Date().toISOString(), targetId: target, total };
        await saveImportHistory(entry);
        const report = await ImportExportService.importBookmarks(data, target, policy, setProgress, controller.current?.signal);
        setResult(report);
        try { await saveImportHistory({ ...entry, result: report }); }
        catch (e) { setError(`Import finished, but its report could not be saved: ${messageOf(e)}`); }
      });
    } catch (e) { setError(messageOf(e)); setResult({ imported: 0, folders: 0, skipped: 0, errors: ['Import stopped. Inspect the destination before retrying.'], cancelled: false, createdIds: [] }); }
    finally { running.current = false; setBusy(false); onChanged(); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[85vh] overflow-auto">
    <DialogHeader><DialogTitle>Import bookmarks</DialogTitle><DialogDescription>Review before adding data. Existing bookmarks will not be deleted.</DialogDescription></DialogHeader>
    <p>{preview.bookmarks} bookmarks · {preview.folders} folders · {preview.duplicates} expected duplicate skips · 0 invalid entries. Counts are rechecked during import.</p>
    <p className="text-sm text-muted-foreground">JSON restores tags; HTML exchanges folders and links.</p>
    <fieldset disabled={busy || !!result} className="space-y-3">
      <label className="block">Destination<select aria-label="Import destination" className="block w-full border rounded p-2 bg-background" value={parent} onChange={e => setParent(e.target.value)}>{parentChoices(folders).map(f => <option key={f.id} value={f.id}>{folderPath(f.id, folders)}</option>)}</select></label>
      <label className="flex gap-2"><input type="checkbox" checked={separate} onChange={e => setSeparate(e.target.checked)} />Create a separate import folder</label>
      <label className="block">Duplicate URLs<select aria-label="Duplicate policy" className="block w-full border rounded p-2 bg-background" value={policy} onChange={e => setPolicy(e.target.value as DuplicatePolicy)}>
        <option value="folder">Skip same URL in the same destination folder</option><option value="global">Skip same URL anywhere</option><option value="keep">Keep all copies</option></select></label>
      <p className="text-sm text-muted-foreground">Matching uses exact URLs after trimming whitespace. Skip policies merge uniquely named folders; skipped bookmarks keep their existing titles and tags.</p>
    </fieldset>
    {progress && <p role="status">Processed {progress.completed} of {progress.total} items</p>}
    {error && <p role="alert">{error}</p>}
    {result && <div role="status"><p>{result.cancelled ? 'Stopped' : 'Finished'}: {result.imported} bookmarks added, {result.folders} folders created, {result.skipped} duplicates skipped, {result.errors.length} errors.</p>
      <p>Completed changes remain in the destination. Do not repeat the whole import without reviewing them.</p>
      {result.errors.length > 0 && <ul className="text-destructive text-sm max-h-40 overflow-auto">{result.errors.map((e,i) => <li key={i}>{e}</li>)}</ul>}</div>}
    <div className="flex justify-end gap-2">{busy ? <Button variant="outline" onClick={() => controller.current?.abort()}>Stop after current item</Button> : <Button variant="outline" onClick={onClose}>Close</Button>}
      {!result && <Button disabled={busy || !parent || !total} onClick={() => void start()}>{busy ? 'Importing…' : 'Import'}</Button>}</div>
  </DialogContent></Dialog>;
}
