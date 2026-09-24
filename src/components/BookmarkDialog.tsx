import React, { useState, useEffect, useRef } from 'react';
import { BookmarkNode, parentChoices, folderPath, messageOf, validURL } from '@/lib/bookmarks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagInput } from '@/components/TagInput';
import { TagStore } from '@/lib/tags';

interface BookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: { title: string; url: string; parentId?: string; tags: string[] }) => Promise<void>;
  bookmark?: BookmarkNode | null;
  folders: BookmarkNode[];
  defaultParentId?: string;
}

export function BookmarkDialog({ isOpen, onClose, onSave, bookmark, folders, defaultParentId }: BookmarkDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagsReady, setTagsReady] = useState(false);
  const saving = useRef(false);

  useEffect(() => {
    let active = true;
    setError('');
    if (bookmark) {
      setTitle(bookmark.title || '');
      setUrl(bookmark.url || '');
      setParentId(bookmark.parentId || '');
      setTags([]); setTagsReady(false);
      TagStore.getTags(bookmark.id).then(value => { if (active) { setTags(value); setTagsReady(true); } }).catch(e => { if (active) setError(messageOf(e)); });
    } else {
      setTitle('');
      setUrl('');
      setParentId(defaultParentId || parentChoices(folders)[0]?.id || '');
      setTags([]); setTagsReady(true);
    }
    return () => { active = false; };
  // Folder tree updates must not reset an in-progress edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmark?.id, isOpen, defaultParentId]);

  const handleSave = async () => {
    if (saving.current || !tagsReady || !title.trim() || !url.trim()) return;

    if (!parentId) { setError('Choose a writable folder.'); return; }
    if (!validURL(url.trim())) { setError('Enter a complete URL, including its scheme (for example https://).'); return; }
    setError('');
    saving.current = true; setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        url: url.trim(),
        parentId: parentId || undefined,
        tags,
      });
      onClose();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      saving.current = false; setIsLoading(false);
    }
  };

  const isEdit = !!bookmark;

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open && !isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Bookmark' : 'Add Bookmark'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Make changes to your bookmark.'
              : 'Add a new bookmark to your collection.'}
          </DialogDescription>
        </DialogHeader>
        
        <form id="edit-form" onSubmit={e => { e.preventDefault(); void handleSave(); }} className="grid gap-3 py-3">
          <fieldset disabled={isLoading} className="contents">
          <div className="grid gap-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bookmark title"
            />
          </div>
          
          <div className="grid gap-1.5">
            <label htmlFor="url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          
          <div className="grid gap-1.5">
            <label htmlFor="folder" className="text-sm font-medium">
              Folder
            </label>
            <select
              id="folder"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select folder...</option>
              {parentChoices(folders).map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folderPath(folder.id, folders)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
          </fieldset>
        </form>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="edit-form" disabled={isLoading || !tagsReady || !title.trim() || !url.trim()}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}