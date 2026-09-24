import { expect, it } from 'vitest';
import { queryBookmarks } from '../src/lib/query';
import type { BookmarkNode } from '../src/lib/bookmarks';
it('queries synthetic libraries without losing matching records', () => {
  const measurements = [];
  for (const count of [1000,10000,50000]) {
    const tree: BookmarkNode[] = [{id:'0',title:'',children:[{id:'1',parentId:'0',title:'Library',children:Array.from({length:count},(_,i)=>({id:String(i+10),parentId:'1',title:`Note ${i} 中文`,url:`https://example.com/${i}`,index:i}))}]}];
    const start=performance.now();
    const result=queryBookmarks(tree,{}, {text:'中文',folderId:'1',descendants:false,tags:[],matchAll:true,domain:'example',sort:'title-asc'});
    measurements.push({count,queryMilliseconds:Math.round((performance.now()-start)*10)/10});
    expect(result.bookmarks).toHaveLength(count);
  }
  console.log('Synthetic query CPU time only (not end-to-end UI):',JSON.stringify(measurements));
});
