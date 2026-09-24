import React from 'react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockChrome } from './chrome';
import { BookmarkManager } from '../src/components/BookmarkManager';
import { BookmarkDialog } from '../src/components/BookmarkDialog';
import { SearchBar } from '../src/components/SearchBar';
import { BookmarkService } from '../src/lib/bookmarks';
import { TagStore } from '../src/lib/tags';
let mock: ReturnType<typeof mockChrome>;
beforeEach(async () => { mock = mockChrome(); await TagStore.pruneTags([]); });
afterEach(cleanup);
it('retains edit inputs on save failure and submits the selected destination', async () => {
  const user = userEvent.setup(), save = vi.fn().mockRejectedValue(new Error('Save denied')), close = vi.fn();
  render(<BookmarkDialog isOpen onClose={close} onSave={save} bookmark={{id:'3',parentId:'1',title:'Original',url:'https://example.com'}} folders={BookmarkService.getFolders(mock.tree)} />);
  await user.clear(screen.getByLabelText('Title')); await user.type(screen.getByLabelText('Title'),'Changed');
  await user.selectOptions(screen.getByLabelText('Folder'),'2');
  await user.click(screen.getByRole('button',{name:'Save'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','Save denied');
  expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Changed'); expect(close).not.toHaveBeenCalled();
  expect(save).toHaveBeenCalledWith(expect.objectContaining({title:'Changed',parentId:'2'}));
});
it('does not save before existing tags have loaded', async () => {
  let resolve!: (t:string[])=>void;
  const spy = vi.spyOn(TagStore,'getTags').mockReturnValue(new Promise(r=>{resolve=r;}));
  const save = vi.fn(); render(<BookmarkDialog isOpen onClose={()=>{}} onSave={save} bookmark={{id:'3',parentId:'1',title:'x',url:'https://x'}} folders={BookmarkService.getFolders(mock.tree)} />);
  expect((screen.getByRole('button',{name:'Save'}) as HTMLButtonElement).disabled).toBe(true);
  resolve(['keep']); await waitFor(()=>expect((screen.getByRole('button',{name:'Save'}) as HTMLButtonElement).disabled).toBe(false)); spy.mockRestore();
});
it('handles IME without querying incomplete composition', () => {
  const search = vi.fn(); render(<SearchBar value="" onSearch={search} />);
  const input = screen.getByRole('textbox'); fireEvent.compositionStart(input); fireEvent.change(input,{target:{value:'zhong'}}); expect(search).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input,{target:{value:'中文'}}); expect(search).toHaveBeenLastCalledWith('中文');
});
it('clears hidden selection when search changes and never deletes on opening confirmation', async () => {
  await BookmarkService.createBookmark({parentId:'1',title:'Alpha',url:'https://alpha.test'}); await BookmarkService.createBookmark({parentId:'1',title:'Beta',url:'https://beta.test'});
  const user = userEvent.setup(); render(<BookmarkManager />);
  await screen.findByRole('button',{name:'Open Alpha'});
  await user.click(screen.getByRole('button',{name:'Select bookmarks'})); await user.click(screen.getByRole('button',{name:'Select all results'}));
  expect(screen.getByText('2 selected in current results')).toBeTruthy();
  await user.type(screen.getByRole('textbox',{name:'Search titles, URLs and folders'}),'Beta');
  await waitFor(()=>expect(screen.queryByText('2 selected in current results')).toBeNull());
  await user.click(screen.getByRole('button',{name:'Select bookmarks'})); await user.click(screen.getByRole('button',{name:'Select all results'}));
  await user.click(screen.getByRole('button',{name:'Delete selected…'})); expect(mock.api.bookmarks.remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:'Delete with recovery'}));
  await waitFor(()=>expect(mock.api.bookmarks.remove).toHaveBeenCalledTimes(1));
  expect(BookmarkService.flattenBookmarks(mock.tree).map(b=>b.title)).toEqual(['Alpha']);
});
it('shows no-match state separately from an empty library', async () => {
  const user = userEvent.setup(); await BookmarkService.createBookmark({parentId:'1',title:'Alpha',url:'https://alpha.test'}); render(<BookmarkManager />);
  await screen.findByRole('button',{name:'Open Alpha'}); await user.type(screen.getByRole('textbox',{name:'Search titles, URLs and folders'}),'not-here');
  expect(await screen.findByText('No matching items')).toBeTruthy(); await user.click(screen.getByRole('button',{name:'Clear filters'})); expect(await screen.findByRole('button',{name:'Open Alpha'})).toBeTruthy();
});
it('moves an edited bookmark and retains tags through the actual manager save flow', async () => {
  const n = await BookmarkService.createBookmark({parentId:'1',title:'Alpha',url:'https://alpha.test'}); await TagStore.setTags(n.id,['Keep']);
  const user = userEvent.setup(); render(<BookmarkManager />);
  fireEvent.keyDown(await screen.findByRole('button',{name:'Open Alpha'}), {key:'F2'});
  await user.clear(screen.getByLabelText('Title')); await user.type(screen.getByLabelText('Title'),'Renamed');
  await user.selectOptions(screen.getByLabelText('Folder'),'2'); await user.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(()=>expect(mock.find(n.id)?.parentId).toBe('2')); expect(mock.find(n.id)?.title).toBe('Renamed'); expect(await TagStore.getTags(n.id)).toEqual(['Keep']);
});
it('keeps a new bookmark draft after tag failure and retries without duplication', async () => {
  const user = userEvent.setup(); render(<BookmarkManager />); await screen.findByRole('button',{name:'Add bookmark'});
  await user.click(screen.getByRole('button',{name:'Add bookmark'})); await user.type(screen.getByLabelText('Title'),'New'); await user.type(screen.getByLabelText('URL'),'https://new.test');
  await user.type(screen.getByLabelText('Add tags'),'Keep{Enter}');
  const spy = vi.spyOn(TagStore,'setTags').mockRejectedValueOnce(new Error('Storage temporarily unavailable'));
  await user.click(screen.getByRole('button',{name:'Save'}));
  expect(await screen.findByText(/Bookmark saved, but tags failed/)).toBeTruthy();
  expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('New'); await user.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
  const nodes = BookmarkService.flattenBookmarks(mock.tree); expect(nodes).toHaveLength(1); expect(await TagStore.getTags(nodes[0].id)).toEqual(['Keep']); spy.mockRestore();
});
