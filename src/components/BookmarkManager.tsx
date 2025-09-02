import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useBookmarks } from '@/hooks/useBookmarks';
import { DraggableBookmarkItem } from '@/components/DraggableBookmarkItem';
import { SearchBar } from '@/components/SearchBar';
import { BookmarkDialog } from '@/components/BookmarkDialog';
import { FolderTree } from '@/components/FolderTree';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookmarkNode } from '@/lib/bookmarks';
import { ImportExportService } from '@/lib/import-export';
import { Plus, Settings, Download, Upload, Grid, List, Folder, Trash2, CheckSquare } from 'lucide-react';

export function BookmarkManager() {
  const {
    bookmarks,
    folders,
    isLoading,
    error,
    searchBookmarks,
    addBookmark,
    updateBookmark,
    removeBookmark,
    moveBookmark,
    refreshBookmarks,
  } = useBookmarks();

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkNode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredBookmarks = selectedFolder
    ? bookmarks.filter(bookmark => bookmark.parentId === selectedFolder)
    : bookmarks;

  const handleSearch = async (query: string) => {
    await searchBookmarks(query);
    setSelectedFolder(null);
  };

  const handleEditBookmark = (bookmark: BookmarkNode) => {
    setEditingBookmark(bookmark);
    setIsDialogOpen(true);
  };

  const handleDeleteBookmark = async (bookmark: BookmarkNode) => {
    if (confirm(`Delete "${bookmark.title}"?`)) {
      await removeBookmark(bookmark.id);
    }
  };

  const handleAddBookmark = () => {
    setEditingBookmark(null);
    setIsDialogOpen(true);
  };

  const handleSaveBookmark = async (bookmarkData: { title: string; url: string; parentId?: string }) => {
    if (editingBookmark) {
      await updateBookmark(editingBookmark.id, {
        title: bookmarkData.title,
        url: bookmarkData.url,
      });
    } else {
      await addBookmark(bookmarkData);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBookmark(null);
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
    setSelectedBookmarks(new Set());
    setIsSelectionMode(false);
  };

  const handleToggleSelection = (bookmarkId: string) => {
    const newSelected = new Set(selectedBookmarks);
    if (newSelected.has(bookmarkId)) {
      newSelected.delete(bookmarkId);
    } else {
      newSelected.add(bookmarkId);
    }
    setSelectedBookmarks(newSelected);
    setIsSelectionMode(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedBookmarks.size === filteredBookmarks.length) {
      setSelectedBookmarks(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedBookmarks(new Set(filteredBookmarks.map(b => b.id)));
      setIsSelectionMode(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (confirm(`Delete ${selectedBookmarks.size} selected bookmarks?`)) {
      for (const bookmarkId of selectedBookmarks) {
        await removeBookmark(bookmarkId);
      }
      setSelectedBookmarks(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleExport = async () => {
    try {
      await ImportExportService.downloadBookmarks();
    } catch (error) {
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.html';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          if (file.name.endsWith('.html')) {
            await ImportExportService.importNetscapeBookmarks(file, selectedFolder || undefined);
          } else {
            await ImportExportService.importFromFile(file, selectedFolder || undefined);
          }
          alert('Import successful!');
          await refreshBookmarks();
        } catch (error) {
          alert('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      }
    };
    input.click();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = filteredBookmarks.findIndex(bookmark => bookmark.id === active.id);
      const newIndex = filteredBookmarks.findIndex(bookmark => bookmark.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Move bookmark to new position
        await moveBookmark(active.id as string, {
          parentId: selectedFolder || undefined,
          index: newIndex,
        });
      }
    }
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-destructive text-lg mb-2">Failed to load bookmarks</div>
          <div className="text-muted-foreground text-sm">{error}</div>
          <Button onClick={refreshBookmarks} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex bg-background">
      {/* Sidebar */}
      {sidebarOpen && (
        <motion.div
          className="w-64 border-r bg-card flex flex-col"
          initial={{ x: -264 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Folders
            </h2>
          </div>
          <div className="flex-1 overflow-auto">
            <FolderTree
              folders={folders}
              selectedFolder={selectedFolder}
              onFolderSelect={handleFolderSelect}
            />
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.div
          className="p-6 border-b bg-gradient-to-r from-card to-card/80"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Folder className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                NotBadBookmark Manager
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              {isSelectionMode && (
                <>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {selectedBookmarks.size === filteredBookmarks.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteSelected}
                    disabled={selectedBookmarks.size === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedBookmarks.size})
                  </Button>
                </>
              )}
              
              {!isSelectionMode && (
                <>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={handleImport}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  
                  <Button onClick={handleAddBookmark}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bookmark
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <SearchBar 
              onSearch={handleSearch} 
              className="flex-1 max-w-md"
              placeholder="Search bookmarks and folders..."
            />
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {filteredBookmarks.length} bookmarks
                {selectedFolder && ' in current folder'}
              </div>
              
              {filteredBookmarks.length > 0 && !isSelectionMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSelectionMode(true)}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading bookmarks...</div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredBookmarks.map(b => b.id)}
                strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
              >
                <div className={`${
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                    : 'space-y-2'
                }`}>
                  {filteredBookmarks.length === 0 ? (
                    <BlurFade delay={0.3} className="col-span-full">
                      <Card className="p-12 text-center">
                        <div className="text-muted-foreground mb-4">
                          {selectedFolder ? 'No bookmarks in this folder' : 'No bookmarks found'}
                        </div>
                        <Button onClick={handleAddBookmark}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Bookmark
                        </Button>
                      </Card>
                    </BlurFade>
                  ) : (
                    filteredBookmarks.map((bookmark, index) => (
                      <BlurFade key={bookmark.id} delay={index * 0.02}>
                        <DraggableBookmarkItem
                          bookmark={bookmark}
                          onEdit={handleEditBookmark}
                          onDelete={handleDeleteBookmark}
                          className={viewMode === 'list' ? 'w-full' : ''}
                          isSelected={selectedBookmarks.has(bookmark.id)}
                          isSelectionMode={isSelectionMode}
                          onToggleSelection={handleToggleSelection}
                        />
                      </BlurFade>
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}
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