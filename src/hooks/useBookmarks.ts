import { useState, useEffect } from 'react';
import { BookmarkNode, BookmarkService } from '@/lib/bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [folders, setFolders] = useState<BookmarkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipAnimation, setSkipAnimation] = useState(false);

  const loadBookmarks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const tree = await BookmarkService.getAllBookmarks();
      const flatBookmarks = BookmarkService.flattenBookmarks(tree);
      const bookmarkFolders = BookmarkService.getFolders(tree);
      
      setBookmarks(flatBookmarks);
      setFolders(bookmarkFolders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  };

  const searchBookmarks = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!query.trim()) {
        await loadBookmarks();
        return;
      }
      
      // Get all bookmarks first
      const tree = await BookmarkService.getAllBookmarks();
      const allBookmarks = BookmarkService.flattenBookmarks(tree);
      
      // Filter by title and URL
      const searchQuery = query.toLowerCase();
      const filteredResults = allBookmarks.filter(bookmark => {
        if (!bookmark.url) return false; // Only include actual bookmarks
        
        const titleMatch = bookmark.title.toLowerCase().includes(searchQuery);
        const urlMatch = bookmark.url.toLowerCase().includes(searchQuery);
        
        return titleMatch || urlMatch;
      });
      
      setBookmarks(filteredResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const addBookmark = async (bookmark: {
    parentId?: string;
    title: string;
    url?: string;
    index?: number;
  }) => {
    try {
      await BookmarkService.createBookmark(bookmark);
      await loadBookmarks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bookmark');
    }
  };

  const updateBookmark = async (id: string, changes: { title?: string; url?: string }) => {
    try {
      setSkipAnimation(true);
      await BookmarkService.updateBookmark(id, changes);
      await loadBookmarks();
      setTimeout(() => setSkipAnimation(false), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
      setSkipAnimation(false);
    }
  };

  const removeBookmark = async (id: string) => {
    try {
      setSkipAnimation(true);
      await BookmarkService.removeBookmark(id);
      await loadBookmarks();
      setTimeout(() => setSkipAnimation(false), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove bookmark');
      setSkipAnimation(false);
    }
  };

  const moveBookmark = async (
    id: string,
    destination: { parentId?: string; index?: number }
  ) => {
    try {
      await BookmarkService.moveBookmark(id, destination);
      await loadBookmarks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move bookmark');
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  return {
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
    refreshBookmarks: loadBookmarks,
  };
}