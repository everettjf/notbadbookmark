import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { mockChrome } from './chrome';
import { useBookmarks } from '../src/hooks/useBookmarks';
import { BookmarkNode } from '../src/lib/bookmarks';
afterEach(cleanup);
it('does not let an older tree response overwrite a newer refresh', async () => {
  const mock=mockChrome();
  const pending: Array<(nodes:BookmarkNode[])=>void> = [];
  mock.api.bookmarks.getTree.mockImplementation(cb=>pending.push(cb));
  const hook=renderHook(()=>useBookmarks());
  let refresh!: Promise<void>;
  act(()=>{refresh=hook.result.current.refreshBookmarks();});
  await act(async()=>{pending[1]([{id:'new',title:'Latest',url:'https://new'}]);await refresh;});
  await act(async()=>{pending[0]([{id:'old',title:'Stale',url:'https://old'}]);});
  await waitFor(()=>expect(hook.result.current.bookmarks[0].title).toBe('Latest'));
});
