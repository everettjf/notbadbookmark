// Synthetic browser preview: never calls the real Chrome extension APIs.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { mockChrome } from './preview-chrome';
import { BookmarkManager } from '../src/components/BookmarkManager';
import { Toaster } from '../src/components/ui/toaster';
import { TagStore } from '../src/lib/tags';
import '../src/globals.css';
const mock = mockChrome();
const bar = mock.find('1')!;
bar.children = [{id:'10',parentId:'1',title:'Design & Research',index:0,children:[
  {id:'11',parentId:'10',title:'Apple Human Interface Guidelines',url:'https://developer.apple.com/design/human-interface-guidelines',index:0},
  {id:'12',parentId:'10',title:'交互设计：清晰的状态与反馈',url:'https://example.com/design?lang=zh',index:1}
]}, {id:'13',parentId:'1',title:'Empty folder',index:1,children:[]}];
mock.find('2')!.children = Array.from({length:180},(_,i)=>({id:String(1000+i),parentId:'2',index:i,title:`Research note ${i+1} — bookmarked reference`,url:`https://example.org/research/${i+1}`,dateAdded:Date.now()-i*100000}));
void TagStore.setMany({'11':['Design','Read later'],'12':['Design','中文']}).then(() => {
  createRoot(document.getElementById('root')!).render(<><BookmarkManager /><Toaster /></>);
});
