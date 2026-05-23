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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useTags } from '@/hooks/useTags';
import { DraggableBookmarkItem } from '@/components/DraggableBookmarkItem';
import { FolderItem } from '@/components/FolderItem';
import { SearchBar } from '@/components/SearchBar';
import { BookmarkDialog } from '@/components/BookmarkDialog';
import { FolderDialog } from '@/components/FolderDialog';
import { FolderTree } from '@/components/FolderTree';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { BookmarkNode, BookmarkService } from '@/lib/bookmarks';
import { ImportExportService } from '@/lib/import-export';
import { TagStore, filterByTags } from '@/lib/tags';
import { TagFilter } from '@/components/TagFilter';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SortDropdown, SortOption } from '@/components/SortDropdown';
import { ExportDropdown } from '@/components/ExportDropdown';
import { Plus, Upload, Grid, List, Folder, Trash2, CheckSquare, FolderPlus, X } from 'lucide-react';

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

  const tags = useTags();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Remove tag records for bookmarks that no longer exist (runs once on open,
  // using the full bookmark set so search-filtered views never wipe tags).
  useEffect(() => {
    (async () => {
      const tree = await BookmarkService.getAllBookmarks();
      const ids = BookmarkService.flattenBookmarks(tree).map((b) => b.id);
      await tags.prune(ids);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkNode | null>(null);
  const [editingFolder, setEditingFolder] = useState<BookmarkNode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [viewMode, setViewMode] = usePersistedState<'grid' | 'list'>('viewMode', 'grid');
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = usePersistedState('sidebarOpen', true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [sortOption, setSortOption] = usePersistedState<SortOption>('sortOption', 'newest-first');

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
      case 'manual':
        return sorted.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
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

  const sortedBookmarks = sortBookmarks(baseFilteredBookmarks, sortOption);
  const filteredBookmarks = filterByTags(sortedBookmarks, selectedTags, tags.tagMap);

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
    await TagStore.removeBookmark(bookmark.id);
    await tags.refresh();
  };

  const handleAddBookmark = () => {
    setEditingBookmark(null);
    setIsDialogOpen(true);
  };

  const handleAddFolder = () => {
    setEditingFolder(null);
    setIsFolderDialogOpen(true);
  };

  const handleSaveBookmark = async (bookmarkData: { title: string; url: string; parentId?: string; tags: string[] }) => {
    let bookmarkId = editingBookmark?.id;
    if (editingBookmark) {
      await updateBookmark(editingBookmark.id, {
        title: bookmarkData.title,
        url: bookmarkData.url,
      });
    } else {
      const created = await addBookmark({
        title: bookmarkData.title,
        url: bookmarkData.url,
        parentId: bookmarkData.parentId,
      });
      bookmarkId = created?.id;
    }
    if (bookmarkId) {
      await TagStore.setTags(bookmarkId, bookmarkData.tags);
      await tags.refresh();
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
        // alert('Bookmark URL copied to clipboard!');
      }
    }
  };

  const handleCopyBookmark = async (bookmark: BookmarkNode) => {
    if (bookmark.url) {
      try {
        await navigator.clipboard.writeText(bookmark.url);
        toast({ title: 'Link copied', description: bookmark.url });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Copy failed' });
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
      await TagStore.removeBookmark(bookmarkId);
    }
    await tags.refresh();
    setSelectedBookmarks(new Set());
    setIsSelectionMode(false);
  };

  const handleExport = async (format: 'json' | 'html' | 'markdown') => {
    try {
      await ImportExportService.downloadBookmarks(format);
      toast({ title: 'Export ready', description: `Bookmarks exported as ${format.toUpperCase()}` });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
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
          await refreshBookmarks();
          toast({ title: 'Import successful' });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Import failed',
            description: error instanceof Error ? error.message : 'Unknown error',
          });
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
        // Reordering only makes sense against the actual stored order, so pin
        // the view to manual order before persisting the move.
        setSortOption('manual');
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
          className="w-56 border-r bg-card flex flex-col"
          initial={{ x: -224 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-3 py-2 border-b">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Folder className="h-4 w-4" />
              </Button>
              <h1 className="text-sm font-semibold tracking-tight">
                NotBadBookmark
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

                  <TagFilter
                    allTags={tags.allTags}
                    selected={selectedTags}
                    onChange={setSelectedTags}
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
              <div className="text-xs text-muted-foreground">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="h-[38px] rounded-md border bg-card animate-pulse" />
              ))}
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
                <div className="space-y-2">
                  {/* Subfolders Section */}
                  {currentSubfolders.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
                        FOLDERS
                      </h3>
                      <div className={`${
                        viewMode === 'grid' 
                          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5'
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
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
                          BOOKMARKS
                        </h3>
                      )}
                      <div className={`${
                        viewMode === 'grid' 
                          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5'
                          : 'space-y-1'
                      }`}>
                        {filteredBookmarks.map((bookmark, index) => (
                          <BlurFade key={bookmark.id} delay={skipAnimation ? 0 : (currentSubfolders.length + index) * 0.01}>
                            <DraggableBookmarkItem
                              bookmark={bookmark}
                              tags={tags.tagMap[bookmark.id]}
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
                      <div className="flex flex-col items-center justify-center text-center py-16">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Folder className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          {selectedFolder ? 'This folder is empty' : 'No bookmarks found'}
                        </div>
                        <Button size="sm" className="h-8" onClick={handleAddBookmark}>
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add Your First Bookmark
                        </Button>
                      </div>
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