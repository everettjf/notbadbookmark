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
import { FolderItem } from '@/components/FolderItem';
import { SearchBar } from '@/components/SearchBar';
import { BookmarkDialog } from '@/components/BookmarkDialog';
import { FolderDialog } from '@/components/FolderDialog';
import { FolderTree } from '@/components/FolderTree';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookmarkNode } from '@/lib/bookmarks';
import { ImportExportService } from '@/lib/import-export';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SortDropdown, SortOption } from '@/components/SortDropdown';
import { ExportDropdown } from '@/components/ExportDropdown';
import { Plus, Settings, Download, Upload, Grid, List, Folder, Trash2, CheckSquare, FolderPlus, X } from 'lucide-react';

export function BookmarkManager() {
  const {
    bookmarks,
    folders,
    isLoading,
    error,
    skipAnimation,
    searchBookmarks,
    addBookmark,
    updateBookmark,
    removeBookmark,
    moveBookmark,
    refreshBookmarks,
  } = useBookmarks();

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkNode | null>(null);
  const [editingFolder, setEditingFolder] = useState<BookmarkNode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest-first');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentFolderData = selectedFolder
    ? folders.find(f => f.id === selectedFolder)
    : null;

  const currentSubfolders = currentFolderData?.children?.filter(child => !child.url) || [];
  const baseFilteredBookmarks = selectedFolder
    ? bookmarks.filter(bookmark => bookmark.parentId === selectedFolder)
    : bookmarks;

  const sortBookmarks = (bookmarks: BookmarkNode[], sort: SortOption): BookmarkNode[] => {
    const sorted = [...bookmarks];
    
    switch (sort) {
      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'domain-asc':
        return sorted.sort((a, b) => {
          const getDomain = (url?: string) => {
            if (!url) return '';
            try {
              return new URL(url).hostname;
            } catch {
              return '';
            }
          };
          return getDomain(a.url).localeCompare(getDomain(b.url));
        });
      case 'domain-desc':
        return sorted.sort((a, b) => {
          const getDomain = (url?: string) => {
            if (!url) return '';
            try {
              return new URL(url).hostname;
            } catch {
              return '';
            }
          };
          return getDomain(b.url).localeCompare(getDomain(a.url));
        });
      case 'newest-first':
      default:
        return sorted.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
      case 'oldest-first':
        return sorted.sort((a, b) => (a.dateAdded || 0) - (b.dateAdded || 0));
    }
  };

  const filteredBookmarks = sortBookmarks(baseFilteredBookmarks, sortOption);

  const handleSearch = async (query: string) => {
    await searchBookmarks(query);
    setSelectedFolder(null);
  };

  const handleEditBookmark = (bookmark: BookmarkNode) => {
    setEditingBookmark(bookmark);
    setIsDialogOpen(true);
  };

  const handleDeleteBookmark = async (bookmark: BookmarkNode) => {
    await removeBookmark(bookmark.id);
  };

  const handleAddBookmark = () => {
    setEditingBookmark(null);
    setIsDialogOpen(true);
  };

  const handleAddFolder = () => {
    setEditingFolder(null);
    setIsFolderDialogOpen(true);
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

  const handleShareBookmark = async (bookmark: BookmarkNode) => {
    if (bookmark.url) {
      try {
        await navigator.share({
          title: bookmark.title,
          url: bookmark.url,
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(bookmark.url);
        alert('Bookmark URL copied to clipboard!');
      }
    }
  };

  const handleCopyBookmark = async (bookmark: BookmarkNode) => {
    if (bookmark.url) {
      try {
        await navigator.clipboard.writeText(bookmark.url);
        alert('Bookmark URL copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  const handleEditFolder = (folder: BookmarkNode) => {
    setEditingFolder(folder);
    setIsFolderDialogOpen(true);
  };

  const handleDeleteFolder = async (folder: BookmarkNode) => {
    const hasContents = folder.children && folder.children.length > 0;
    
    if (hasContents) {
      const bookmarkCount = folder.children?.filter(child => child.url).length || 0;
      const folderCount = folder.children?.filter(child => !child.url).length || 0;
      
      const firstConfirm = confirm(
        `This folder contains ${bookmarkCount} bookmarks and ${folderCount} subfolders. Are you sure you want to delete "${folder.title}"?`
      );
      
      if (!firstConfirm) return;
      
      const secondConfirm = confirm(
        `This action cannot be undone. All bookmarks and subfolders will be permanently deleted. Delete "${folder.title}"?`
      );
      
      if (!secondConfirm) return;
    }
    
    await removeBookmark(folder.id);
  };

  const handleSaveFolder = async (folderData: { title: string; parentId?: string }) => {
    if (editingFolder) {
      await updateBookmark(editingFolder.id, {
        title: folderData.title,
      });
      if (folderData.parentId && folderData.parentId !== editingFolder.parentId) {
        await moveBookmark(editingFolder.id, {
          parentId: folderData.parentId,
        });
      }
    } else {
      await addBookmark({
        title: folderData.title,
        parentId: folderData.parentId,
      });
    }
  };

  const handleCloseFolderDialog = () => {
    setIsFolderDialogOpen(false);
    setEditingFolder(null);
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
    for (const bookmarkId of selectedBookmarks) {
      await removeBookmark(bookmarkId);
    }
    setSelectedBookmarks(new Set());
    setIsSelectionMode(false);
  };

  const handleExport = async (format: 'json' | 'html' | 'markdown') => {
    try {
      await ImportExportService.downloadBookmarks(format);
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
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
            />
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.div
          className="py-1 px-3 border-b bg-gradient-to-r from-card to-card/80"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
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
            
            <div className="flex items-center gap-1">
              {isSelectionMode && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setSelectedBookmarks(new Set());
                      setIsSelectionMode(false);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleSelectAll}>
                    <CheckSquare className="h-3 w-3 mr-1" />
                    {selectedBookmarks.size === filteredBookmarks.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={handleDeleteSelected}
                    disabled={selectedBookmarks.size === 0}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
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
                      className="rounded-r-none h-7 px-2"
                    >
                      <Grid className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none h-7 px-2"
                    >
                      <List className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <SortDropdown
                    currentSort={sortOption}
                    onSortChange={setSortOption}
                  />
                  
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleImport}>
                    <Upload className="h-3 w-3 mr-1" />
                    Import
                  </Button>
                  
                  <ExportDropdown onExport={handleExport} />
                  
                  <Button variant="outline" className="h-7 px-2 text-xs" onClick={handleAddFolder}>
                    <FolderPlus className="h-3 w-3 mr-1" />
                    Add Folder
                  </Button>
                  
                  <Button className="h-7 px-2 text-xs" onClick={handleAddBookmark}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Bookmark
                  </Button>
                </>
              )}
              
              <ThemeToggle />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <SearchBar 
              onSearch={handleSearch} 
              className="flex-1 max-w-md"
              placeholder="Search bookmarks and folders..."
            />
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {currentSubfolders.length > 0 && `${currentSubfolders.length} folders • `}
                {filteredBookmarks.length} bookmarks
                {selectedFolder && ' in current folder'}
              </div>
              
              {(filteredBookmarks.length > 0 || currentSubfolders.length > 0) && !isSelectionMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setIsSelectionMode(true)}
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Select
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto pt-2 px-3 pb-4">
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
                <div className="space-y-3">
                  {/* Subfolders Section */}
                  {currentSubfolders.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                        FOLDERS
                      </h3>
                      <div className={`${
                        viewMode === 'grid' 
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2' 
                          : 'space-y-1'
                      }`}>
                        {currentSubfolders.map((folder, index) => (
                          <BlurFade key={folder.id} delay={skipAnimation ? 0 : index * 0.01}>
                            <FolderItem
                              folder={folder}
                              onFolderSelect={(folder) => handleFolderSelect(folder.id)}
                              onEdit={handleEditFolder}
                              onDelete={handleDeleteFolder}
                              className={viewMode === 'list' ? 'w-full' : ''}
                            />
                          </BlurFade>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bookmarks Section */}
                  {filteredBookmarks.length > 0 && (
                    <div>
                      {currentSubfolders.length > 0 && (
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                          BOOKMARKS
                        </h3>
                      )}
                      <div className={`${
                        viewMode === 'grid' 
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2' 
                          : 'space-y-1'
                      }`}>
                        {filteredBookmarks.map((bookmark, index) => (
                          <BlurFade key={bookmark.id} delay={skipAnimation ? 0 : (currentSubfolders.length + index) * 0.01}>
                            <DraggableBookmarkItem
                              bookmark={bookmark}
                              onEdit={handleEditBookmark}
                              onDelete={handleDeleteBookmark}
                              onShare={handleShareBookmark}
                              onCopy={handleCopyBookmark}
                              className={viewMode === 'list' ? 'w-full' : ''}
                              isSelected={selectedBookmarks.has(bookmark.id)}
                              isSelectionMode={isSelectionMode}
                              onToggleSelection={handleToggleSelection}
                            />
                          </BlurFade>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {filteredBookmarks.length === 0 && currentSubfolders.length === 0 && (
                    <BlurFade delay={0.1}>
                      <Card className="p-12 text-center">
                        <div className="text-muted-foreground mb-4">
                          {selectedFolder ? 'This folder is empty' : 'No bookmarks found'}
                        </div>
                        <Button onClick={handleAddBookmark}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Bookmark
                        </Button>
                      </Card>
                    </BlurFade>
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

      {/* Folder Dialog */}
      <FolderDialog
        isOpen={isFolderDialogOpen}
        onClose={handleCloseFolderDialog}
        onSave={handleSaveFolder}
        folder={editingFolder}
        folders={folders}
      />
    </div>
  );
}