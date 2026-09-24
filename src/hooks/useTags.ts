import { useState, useEffect, useCallback, useRef } from 'react';
import { TagStore, TagMap, TagSummary } from '@/lib/tags';
import { messageOf } from '@/lib/bookmarks';

export function useTags() {
  const [tagMap, setTagMap] = useState<TagMap>({});
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const map = await TagStore.getAllTagsMap();
      if (request === sequence.current) { setTagMap(map); setError(null); }
    } catch (e) { if (request === sequence.current) setError(messageOf(e)); }
  }, []);
  useEffect(() => {
    void refresh();
    const channel = new BroadcastChannel('notbadbookmark-tags');
    channel.onmessage = refresh;
    window.addEventListener('notbadbookmark-tags', refresh);
    // This ref is a request generation counter, not a DOM element. Invalidate in-flight reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { ++sequence.current; channel.close(); window.removeEventListener('notbadbookmark-tags', refresh); };
  }, [refresh]);
  const counts = new Map<string, TagSummary>();
  for (const tags of Object.values(tagMap)) for (const tag of tags) {
    const key = tag.toLowerCase(), entry = counts.get(key);
    counts.set(key, { tag: entry?.tag || tag, count: (entry?.count || 0) + 1 });
  }
  return { tagMap, error, allTags: Array.from(counts.values()).sort((a,b) => a.tag.localeCompare(b.tag)), refresh };
}
