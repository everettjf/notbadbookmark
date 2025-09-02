import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookmarks } from '@/hooks/useBookmarks';
import { BookmarkItem } from '@/components/BookmarkItem';
import { SearchBar } from '@/components/SearchBar';
import { BookmarkDialog } from '@/components/BookmarkDialog';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookmarkNode } from '@/lib/bookmarks';
import { Plus, Settings, Loader2, AlertCircle } from 'lucide-react';

export function App() {
  const {
    bookmarks,
    folders,
    isLoading,
    error,
    searchBookmarks,
    addBookmark,
    updateBookmark,
    removeBookmark,
    refreshBookmarks,
  } = useBookmarks();

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkNode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  const handleSearch = async (query: string) => {
    await searchBookmarks(query);
  };

  const handleEditBookmark = (bookmark: BookmarkNode) => {
    setEditingBookmark(bookmark);
    setIsAddMode(false);
    setIsDialogOpen(true);
  };

  const handleDeleteBookmark = async (bookmark: BookmarkNode) => {
    if (confirm(`Delete "${bookmark.title}"?`)) {
      await removeBookmark(bookmark.id);
    }
  };

  const handleAddBookmark = () => {
    setEditingBookmark(null);
    setIsAddMode(true);
    setIsDialogOpen(true);
  };

  const handleSaveBookmark = async (bookmarkData: { title: string; url: string; parentId?: string }) => {
    if (editingBookmark) {
      await updateBookmark(editingBookmark.id, {
        title: bookmarkData.title,
        url: bookmarkData.url,
      });
      if (bookmarkData.parentId && bookmarkData.parentId !== editingBookmark.parentId) {
        await updateBookmark(editingBookmark.id, { title: bookmarkData.title, url: bookmarkData.url });
      }
    } else {
      await addBookmark(bookmarkData);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBookmark(null);
    setIsAddMode(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading bookmarks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <motion.div 
        className="p-4 border-b bg-gradient-to-r from-card to-card/80 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            NotBadBookmark
          </h1>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-primary/10 transition-all duration-200" 
              onClick={handleAddBookmark}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 transition-all duration-200">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <SearchBar onSearch={handleSearch} />
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Quick Stats */}
        <motion.div 
          className="p-4 border-b"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="text-xs text-muted-foreground font-medium">
            {bookmarks.length} bookmarks • {folders.length} folders
          </div>
        </motion.div>

        {/* Bookmarks List */}
        <div className="p-4">
          <div className="space-y-2">
            {bookmarks.length === 0 ? (
              <BlurFade delay={0.3}>
                <div className="text-center py-8">
                  <div className="text-muted-foreground text-sm">
                    No bookmarks found
                  </div>
                </div>
              </BlurFade>
            ) : (
              bookmarks.map((bookmark, index) => (
                <BlurFade key={bookmark.id} delay={0.1 + index * 0.05}>
                  <BookmarkItem
                    bookmark={bookmark}
                    onEdit={handleEditBookmark}
                    onDelete={handleDeleteBookmark}
                  />
                </BlurFade>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-card text-center">
        <div className="text-xs text-muted-foreground">
          NotBadBookmark v1.0.0
        </div>
      </div>

      {/* Bookmark Dialog */}
      <BookmarkDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveBookmark}
        bookmark={editingBookmark}
        folders={folders}
      />
    </div>
  );
}