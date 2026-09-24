import { beforeEach, describe, expect, it } from 'vitest';
import { mockChrome } from './chrome';
import { BookmarkService, canEdit, parentChoices } from '../src/lib/bookmarks';
import { exportTree, ImportExportService, validateNodes, previewImport } from '../src/lib/import-export';
import { TagStore } from '../src/lib/tags';
import { deleteRecoverably, recoveryRecords, restoreRecord } from '../src/lib/recovery';
import { queryBookmarks } from '../src/lib/query';
let mock: ReturnType<typeof mockChrome>;
beforeEach(async () => { mock = mockChrome(); await TagStore.pruneTags([]); });
const fixture = [{ title: '资料 & "收藏"', children: [{ title: 'Empty', children: [] }, { title: '你好 [世界] <tag>', url: 'https://example.com/a?q="x"&lang=zh#part', tags: ['Read', '工作'] }, { title: 'Again', url: 'https://example.com/a?q="x"&lang=zh#part' }] }];
describe('API correctness', () => {
  for (const method of ['create','update','move','remove','removeTree','getTree']) it(`propagates ${method} failure`, async () => {
    mock.fail(method);
    const operations = { create: () => BookmarkService.createBookmark({ title: 'x' }), update: () => BookmarkService.updateBookmark('x', { title: 'x' }), move: () => BookmarkService.moveBookmark('x', {parentId:'1'}), remove: () => BookmarkService.removeBookmark('x'), removeTree: () => BookmarkService.removeTree('x'), getTree: () => BookmarkService.getAllBookmarks() };
    await expect(operations[method as keyof typeof operations]()).rejects.toThrow('Injected');
  });
  it('excludes self, descendants, managed and root from parent choices', () => {
    const child = { id:'4', parentId:'3', title:'Child', children:[] }; const n = { id:'3',parentId:'1',title:'Folder',children:[child] };
    expect(parentChoices([...BookmarkService.getFolders(mock.tree),n,child,{id:'5',title:'Managed',unmodifiable:'managed'}],n).map(f=>f.id)).toEqual(['1','2']);
    expect(canEdit(mock.find('1')!)).toBe(false);
  });
});
describe('backup formats and import', () => {
  it('restores JSON hierarchy, empty folders, order, Unicode, exact URLs and tags', async () => {
    const first = await ImportExportService.importBookmarks({version:'2.0.0',exportDate:'',bookmarks:fixture},'1','keep');
    expect(first.errors).toEqual([]); expect(first.imported).toBe(2);
    const exported = exportTree(mock.find('1')!.children!,await TagStore.getAllTagsMap());
    expect(exported).toEqual(validateNodes(fixture).map(n => ({...n, dateAdded:undefined})));
    const json = ImportExportService.parseImportFile(JSON.stringify({version:'2.0.0',bookmarks:exported}));
    await ImportExportService.importBookmarks(json,'2','keep');
    expect(exportTree(mock.find('2')!.children!,await TagStore.getAllTagsMap())).toEqual(exported);
  });
  it('roundtrips browser HTML without markup injection or flattened folders', () => {
    const html = ImportExportService.exportToHTML(fixture);
    expect(html).toContain('&lt;tag&gt;'); expect(html).toContain('&quot;x&quot;');
    const parsed = ImportExportService.parseNetscapeTree(html);
    expect(parsed[0].title).toBe(fixture[0].title);
    expect(parsed[0].children?.[0].children).toEqual([]);
    expect(parsed[0].children?.[1].url).toBe(fixture[0].children[1].url);
  });
  it('accepts legacy flat and tree JSON, rejects unknown versions and invalid nodes', () => {
    expect(ImportExportService.parseImportFile('{"version":"1.0.0","bookmarks":[{"title":"x","url":"https://x.test"}]}').bookmarks).toHaveLength(1);
    expect(() => ImportExportService.parseImportFile('{"version":"9","bookmarks":[]}')).toThrow('version');
    for (const bad of [null, [{title:'x',url:'bad'}], [{title:4}], [{title:'x',url:'https://x',children:[]}]]) expect(()=>validateNodes(bad)).toThrow();
  });
  it('does not flatten an unrecognized HTML structure', () => {
    expect(()=>ImportExportService.parseNetscapeTree('<dl><a href="https://x.test">lost</a></dl>')).toThrow('structure');
  });
  it('preserves intentional duplicates in other folders and reports per-item failures', async () => {
    await BookmarkService.createBookmark({parentId:'2',title:'Existing',url:'https://x.test'});
    const data = {version:'2.0.0',exportDate:'',bookmarks:[{title:'a',url:'https://x.test'},{title:'b',url:'https://x.test'}]};
    const r = await ImportExportService.importBookmarks(data,'1','folder'); expect(r.imported).toBe(1); expect(r.skipped).toBe(1);
    const global = await ImportExportService.importBookmarks(data,'1','global'); expect(global.skipped).toBe(2);
    mock.fail('create'); const partial = await ImportExportService.importBookmarks(data,'1','keep'); expect(partial.errors).toHaveLength(1); expect(partial.imported).toBe(1);
  });
  it('cancels between items and keeps an accurate partial report', async () => {
    const controller = new AbortController();
    const r = await ImportExportService.importBookmarks({version:'2.0.0',exportDate:'',bookmarks:[{title:'a',url:'https://a'},{title:'b',url:'https://b'}]},'1','keep',() => controller.abort(),controller.signal);
    expect(r.imported).toBe(1); expect(r.cancelled).toBe(true);
  });
});
describe('durable recovery', () => {
  it('restores a deleted subtree with new IDs, ordering and tags after rereading storage', async () => {
    await ImportExportService.importBookmarks({version:'2.0.0',exportDate:'',bookmarks:fixture},'1','keep');
    const original = mock.find('1')!.children![0];
    const expected = exportTree([original],await TagStore.getAllTagsMap());
    await deleteRecoverably(original.id);
    expect(mock.find(original.id)).toBeUndefined();
    const [record] = await recoveryRecords(); expect(record.state).toBe('deleted');
    await restoreRecord(record.id);
    expect(exportTree(mock.find('1')!.children!,await TagStore.getAllTagsMap())).toEqual(expected);
    expect(mock.find('1')!.children![0].id).not.toBe(original.id);
    await expect(restoreRecord(record.id)).rejects.toThrow('already restored');
  });
  it('never deletes if the snapshot cannot be persisted', async () => {
    const n = await BookmarkService.createBookmark({parentId:'1',title:'Keep',url:'https://keep'});
    mock.fail('storage.set'); await expect(deleteRecoverably(n.id)).rejects.toThrow('Recovery'); expect(mock.find(n.id)).toBeDefined();
  });
  it('retains tags and original item after a failed delete', async () => {
    const n = await BookmarkService.createBookmark({parentId:'1',title:'Keep',url:'https://keep'}); await TagStore.setTags(n.id,['safe']);
    mock.fail('remove'); await expect(deleteRecoverably(n.id)).rejects.toThrow(); expect(await TagStore.getTags(n.id)).toEqual(['safe']);
    await expect(restoreRecord((await recoveryRecords())[0].id)).rejects.toThrow('still exists');
  });
  it('requires a valid fallback when parent was removed', async () => {
    const p = await BookmarkService.createBookmark({parentId:'1',title:'Parent'}); const n = await BookmarkService.createBookmark({parentId:p.id,title:'x',url:'https://x'});
    await deleteRecoverably(n.id); await BookmarkService.removeTree(p.id);
    const [r] = await recoveryRecords(); await expect(restoreRecord(r.id)).rejects.toThrow('original folder'); await restoreRecord(r.id,'2'); expect(mock.find('2')!.children).toHaveLength(1);
  });
  it('retries a failed child creation without duplicating restored parents', async () => {
    await ImportExportService.importBookmarks({version:'2.0.0',exportDate:'',bookmarks:fixture},'1','keep'); await deleteRecoverably(mock.find('1')!.children![0].id);
    const [r] = await recoveryRecords(); mock.fail('create'); await expect(restoreRecord(r.id)).rejects.toThrow('incomplete'); await restoreRecord(r.id); expect(mock.find('1')!.children).toHaveLength(1);
  });
});
it('searches within explicit scopes, supports folder names, AND/OR tags and domain', async () => {
  await ImportExportService.importBookmarks({version:'2.0.0',exportDate:'',bookmarks:fixture},'1','keep'); const map = await TagStore.getAllTagsMap();
  const q = {text:'',folderId:'1',descendants:false,tags:[],matchAll:true,domain:'',sort:'title-asc' as const};
  expect(queryBookmarks(mock.tree,map,q).bookmarks).toHaveLength(0);
  expect(queryBookmarks(mock.tree,map,{...q,descendants:true}).bookmarks).toHaveLength(2);
  expect(queryBookmarks(mock.tree,map,{...q,folderId:null,text:'资料'}).folders).toHaveLength(2);
  expect(queryBookmarks(mock.tree,map,{...q,descendants:true,tags:['read','missing']}).bookmarks).toHaveLength(0);
  expect(queryBookmarks(mock.tree,map,{...q,descendants:true,tags:['read','missing'],matchAll:false}).bookmarks).toHaveLength(1);
  expect(queryBookmarks(mock.tree,map,{...q,descendants:true,domain:'other.test'}).bookmarks).toHaveLength(0);
});
it('atomically merges tag names and removes a tag without changing bookmarks', async () => {
  await TagStore.setMany({a:['Read','Work'],b:['read']}); await TagStore.renameTag('read','Work');
  expect(await TagStore.getTags('a')).toEqual(['Work']); expect(await TagStore.getTags('b')).toEqual(['Work']);
  await TagStore.renameTag('Work',''); expect(await TagStore.getAllTagsMap()).toEqual({});
});
it('refuses deletion when descendants changed after confirmation', async () => {
  const p = await BookmarkService.createBookmark({parentId:'1',title:'P'});
  const expected = await BookmarkService.getNode(p.id);
  await BookmarkService.createBookmark({parentId:p.id,title:'New child',url:'https://new'});
  await expect(deleteRecoverably(p.id,expected)).rejects.toThrow('changed after'); expect(mock.find(p.id)).toBeDefined();
});
it('blocks ambiguous restore retry after a creation checkpoint fails', async () => {
  const n = await BookmarkService.createBookmark({parentId:'1',title:'x',url:'https://x'}); await deleteRecoverably(n.id);
  const [r] = await recoveryRecords();
  const original = mock.api.bookmarks.create.getMockImplementation()!;
  mock.api.bookmarks.create.mockImplementation((input,cb) => original(input,(node: unknown)=> { mock.fail('storage.set'); cb(node); }));
  await expect(restoreRecord(r.id)).rejects.toThrow('incomplete');
  await expect(restoreRecord(r.id)).rejects.toThrow('interrupted during creation');
  expect(mock.find('1')!.children).toHaveLength(1);
});

it('preview duplicate counts agree with execution for merged and repeated folders', async () => {
  const nodes = [{title:'Docs',children:[{title:'a',url:'https://a'}]},{title:'Docs',children:[{title:'again',url:'https://a'},{title:'b',url:'https://b'}]}];
  for (const policy of ['folder','global','keep'] as const) {
    const before = await BookmarkService.getAllBookmarks();
    const preview = previewImport(nodes,before,'1',policy,false);
    const actual = await ImportExportService.importBookmarks({version:'2.0.0',exportDate:'',bookmarks:nodes},'1',policy);
    expect(actual.skipped).toBe(preview.duplicates);
  }
});
it('validates browser-style HTML with omitted closing tags and nested folders', () => {
  const html = '<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p><DT><H3>Root</H3><DL><p><DT><A HREF="https://a.test">A &amp; B</A><DT><H3>Inner</H3><DL><p><DT><A HREF="https://b.test">中文</A></DL><p></DL><p></DL><p>';
  const nodes = ImportExportService.parseNetscapeTree(html);
  expect(nodes[0].children?.[0].title).toBe('A & B');
  expect(nodes[0].children?.[1].children?.[0].url).toBe('https://b.test');
});

it('resumes a child failure using persisted parent ID mappings', async () => {
  await ImportExportService.importBookmarks({version:'2.0.0',exportDate:'',bookmarks:fixture},'1','keep');
  await deleteRecoverably(mock.find('1')!.children![0].id);
  const [r] = await recoveryRecords();
  const original = mock.api.bookmarks.create.getMockImplementation()!;
  let calls = 0;
  mock.api.bookmarks.create.mockImplementation((input,cb) => {
    if (++calls === 2) mock.fail('create');
    return original(input,cb);
  });
  await expect(restoreRecord(r.id)).rejects.toThrow('incomplete');
  expect(mock.find('1')!.children).toHaveLength(1);
  await restoreRecord(r.id);
  expect(mock.find('1')!.children).toHaveLength(1);
  expect(mock.find('1')!.children![0].children).toHaveLength(3);
});
