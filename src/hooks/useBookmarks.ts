import { useState, useEffect, useRef, useCallback } from 'react';
import { BookmarkNode, BookmarkService, messageOf } from '@/lib/bookmarks';

export function useBookmarks() {
  const [tree, setTree] = useState<BookmarkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const refreshBookmarks = useCallback(async () => {
    const request = ++generation.current;
    try {
      const next = await BookmarkService.getAllBookmarks();
      if (request === generation.current) { setTree(next); setError(null); }
    } catch (e) { if (request === generation.current) setError(messageOf(e)); }
    finally { if (request === generation.current) setIsLoading(false); }
  }, []);
  useEffect(() => {
    void refreshBookmarks();
    let timer: ReturnType<typeof setTimeout>;
    const sync = () => { clearTimeout(timer); timer = setTimeout(refreshBookmarks, 80); };
    const events = [chrome.bookmarks.onCreated, chrome.bookmarks.onChanged, chrome.bookmarks.onRemoved,
      chrome.bookmarks.onMoved, chrome.bookmarks.onChildrenReordered, chrome.bookmarks.onImportEnded];
    events.forEach(e => e.addListener(sync));
    // This ref is a request generation counter, not a DOM element. Invalidate in-flight reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { ++generation.current; clearTimeout(timer); events.forEach(e => e.removeListener(sync)); };
  }, [refreshBookmarks]);
  return { tree, bookmarks: BookmarkService.flattenBookmarks(tree), folders: BookmarkService.getFolders(tree),
    isLoading, error, refreshBookmarks };
}
