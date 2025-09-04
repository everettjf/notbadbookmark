/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/

chrome.runtime.onInstalled.addListener(() => {
    console.log('NotBadBookmark extension installed');
});
// Handle extension icon click - open bookmark manager
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
        url: 'chrome://bookmarks/'
    });
});
chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
    console.log('Bookmark changed:', id, changeInfo);
});
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    console.log('Bookmark created:', id, bookmark);
});
chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
    console.log('Bookmark removed:', id, removeInfo);
});
chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
    console.log('Bookmark moved:', id, moveInfo);
});

/******/ })()
;
//# sourceMappingURL=background.js.map