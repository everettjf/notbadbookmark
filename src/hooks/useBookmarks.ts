import { useState, useEffect, useRef, useCallback } from 'react';
import { BookmarkNode, BookmarkService } from '@/lib/bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [folders, setFolders] = useState<BookmarkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Entrance animations should only play on the very first render, never on
  // subsequent data refreshes (CRUD or external bookmark changes).
  const [hasAnimated, setHasAnimated] = useState(false);
  const activeQueryRef = useRef('');

  const loadBookmarks = useCallback(async () => {
    try {
      setError(null);

      const tree = await BookmarkService.getAllBookmarks();
      setBookmarks(BookmarkService.flattenBookmarks(tree));
      setFolders(BookmarkService.getFolders(tree));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runActiveQuery = useCallback(async () => {
    const query = activeQueryRef.current;
    if (!query.trim()) {
      await loadBookmarks();
      return;
    }
    try {
      setError(null);
      const results = await BookmarkService.searchBookmarks(query);
      setBookmarks(results.filter((b) => b.url));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [loadBookmarks]);

  const searchBookmarks = useCallback(
    async (query: string) => {
      activeQueryRef.current = query;
      await runActiveQuery();
    },
    [runActiveQuery]
  );

  const addBookmark = useCallback(
    async (bookmark: { parentId?: string; title: string; url?: string; index?: number }) => {
      try {
        await BookmarkService.createBookmark(bookmark);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add bookmark');
      }
    },
    []
  );

  const updateBookmark = useCallback(
    async (id: string, changes: { title?: string; url?: string }) => {
      try {
        await BookmarkService.updateBookmark(id, changes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update bookmark');
      }
    },
    []
  );

  const removeBookmark = useCallback(async (id: string) => {
    try {
      await BookmarkService.removeBookmark(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove bookmark');
    }
  }, []);

  const moveBookmark = useCallback(
    async (id: string, destination: { parentId?: string; index?: number }) => {
      try {
        await BookmarkService.moveBookmark(id, destination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to move bookmark');
      }
    },
    []
  );

  // Initial load + live sync with Chrome's bookmark store. CRUD operations no
  // longer reload manually: the event listeners below re-sync state whenever
  // bookmarks change, whether from this UI or another window.
  useEffect(() => {
    loadBookmarks().then(() => setHasAnimated(true));

    let raf = 0;
    const scheduleSync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => runActiveQuery());
    };

    chrome.bookmarks.onCreated.addListener(scheduleSync);
    chrome.bookmarks.onChanged.addListener(scheduleSync);
    chrome.bookmarks.onRemoved.addListener(scheduleSync);
    chrome.bookmarks.onMoved.addListener(scheduleSync);

    return () => {
      cancelAnimationFrame(raf);
      chrome.bookmarks.onCreated.removeListener(scheduleSync);
      chrome.bookmarks.onChanged.removeListener(scheduleSync);
      chrome.bookmarks.onRemoved.removeListener(scheduleSync);
      chrome.bookmarks.onMoved.removeListener(scheduleSync);
    };
  }, [loadBookmarks, runActiveQuery]);

  return {
    bookmarks,
    folders,
    isLoading,
    error,
    skipAnimation: hasAnimated,
    searchBookmarks,
    addBookmark,
    updateBookmark,
    removeBookmark,
    moveBookmark,
    refreshBookmarks: loadBookmarks,
  };
}
