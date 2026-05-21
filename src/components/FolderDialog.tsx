import React, { useState, useEffect } from 'react';
import { BookmarkNode } from '@/lib/bookmarks';
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
}

export function FolderDialog({ isOpen, onClose, onSave, folder, folders }: FolderDialogProps) {
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (folder) {
      setTitle(folder.title || '');
      setParentId(folder.parentId || '');
    } else {
      setTitle('');
      setParentId('');
    }
  }, [folder, isOpen]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        parentId: parentId || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEdit = !!folder;
  const availableFolders = folders.filter(f => f.id !== folder?.id); // Prevent self-parenting

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Folder' : 'Add Folder'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Make changes to your folder.'
              : 'Create a new folder to organize your bookmarks.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-3">
          <div className="grid gap-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Folder Name
            </label>
            <Input
              id="title"
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
              <option value="">Root level</option>
              {availableFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !title.trim()}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}