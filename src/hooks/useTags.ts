import { useState, useEffect, useCallback } from 'react';
import { TagStore, TagMap, TagSummary } from '@/lib/tags';

/**
 * React access to the IndexedDB tag store. Holds the full tag map and a derived
 * tag-frequency summary in state, and exposes mutators that re-sync after each
 * write. This is the read/write API for the (future) tag UI.
 */
export function useTags() {
  const [tagMap, setTagMap] = useState<TagMap>({});
  const [allTags, setAllTags] = useState<TagSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [map, tags] = await Promise.all([
      TagStore.getAllTagsMap(),
      TagStore.getAllTags(),
    ]);
    setTagMap(map);
    setAllTags(tags);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getTags = useCallback((bookmarkId: string) => tagMap[bookmarkId] ?? [], [tagMap]);

  const setTags = useCallback(
    async (bookmarkId: string, tags: string[]) => {
      await TagStore.setTags(bookmarkId, tags);
      await refresh();
    },
    [refresh]
  );

  const addTag = useCallback(
    async (bookmarkId: string, tag: string) => {
      await TagStore.addTag(bookmarkId, tag);
      await refresh();
    },
    [refresh]
  );

  const removeTag = useCallback(
    async (bookmarkId: string, tag: string) => {
      await TagStore.removeTag(bookmarkId, tag);
      await refresh();
    },
    [refresh]
  );

  // Drop tag records whose bookmarks have been deleted, then re-sync.
  const prune = useCallback(
    async (validIds: string[]) => {
      await TagStore.pruneTags(validIds);
      await refresh();
    },
    [refresh]
  );

  return { tagMap, allTags, isLoading, getTags, setTags, addTag, removeTag, prune, refresh };
}
