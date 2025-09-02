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

interface BookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: { title: string; url: string; parentId?: string }) => Promise<void>;
  bookmark?: BookmarkNode | null;
  folders: BookmarkNode[];
}

export function BookmarkDialog({ isOpen, onClose, onSave, bookmark, folders }: BookmarkDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title || '');
      setUrl(bookmark.url || '');
      setParentId(bookmark.parentId || '');
    } else {
      setTitle('');
      setUrl('');
      setParentId('');
    }
  }, [bookmark, isOpen]);

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return;

    setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        url: url.trim(),
        parentId: parentId || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEdit = !!bookmark;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Bookmark' : 'Add Bookmark'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Make changes to your bookmark.'
              : 'Add a new bookmark to your collection.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bookmark title"
            />
          </div>
          
          <div className="grid gap-2">
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
          
          <div className="grid gap-2">
            <label htmlFor="folder" className="text-sm font-medium">
              Folder
            </label>
            <select
              id="folder"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select folder...</option>
              {folders.map((folder) => (
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
          <Button onClick={handleSave} disabled={isLoading || !title.trim() || !url.trim()}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}