import React, { useState, useEffect, useRef } from 'react';
import { BookmarkNode, parentChoices, folderPath, messageOf } from '@/lib/bookmarks';
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

interface FolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folder: { title: string; parentId?: string }) => Promise<void>;
  folder?: BookmarkNode | null;
  folders: BookmarkNode[];
  defaultParentId?: string;
}

export function FolderDialog({ isOpen, onClose, onSave, folder, folders, defaultParentId }: FolderDialogProps) {
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);

  useEffect(() => {
    setError('');
    if (folder) {
      setTitle(folder.title || '');
      setParentId(folder.parentId || '');
    } else {
      setTitle('');
      setParentId(defaultParentId || parentChoices(folders)[0]?.id || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder?.id, isOpen, defaultParentId]);

  const handleSave = async () => {
    if (saving.current || !title.trim()) return;

    if (!parentId) { setError('Choose a writable folder.'); return; }
    setError('');
    saving.current = true; setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        parentId: parentId || undefined,
      });
      onClose();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      saving.current = false; setIsLoading(false);
    }
  };

  const isEdit = !!folder;
  const availableFolders = parentChoices(folders, folder);

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open && !isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Folder' : 'Add Folder'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Make changes to your folder.'
              : 'Create a new folder to organize your bookmarks.'}
          </DialogDescription>
        </DialogHeader>
        
        <form id="edit-form" onSubmit={e => { e.preventDefault(); void handleSave(); }} className="grid gap-3 py-3">
          <fieldset disabled={isLoading} className="contents">
          <div className="grid gap-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Folder Name
            </label>
            <Input
              id="title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter folder name"
            />
          </div>
          
          <div className="grid gap-1.5">
            <label htmlFor="folder" className="text-sm font-medium">
              Parent Folder
            </label>
            <select
              id="folder"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Choose a writable folder…</option>
              {availableFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folderPath(folder.id, folders)}
                </option>
              ))}
            </select>
          </div>
          </fieldset>
        </form>
        
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="edit-form" disabled={isLoading || !title.trim()}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}