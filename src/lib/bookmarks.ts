export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  children?: BookmarkNode[];
  dateAdded?: number;
  dateGroupModified?: number;
  index?: number;
}

export class BookmarkService {
  static async getAllBookmarks(): Promise<BookmarkNode[]> {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        resolve(tree);
      });
    });
  }

  static async searchBookmarks(query: string): Promise<BookmarkNode[]> {
    return new Promise((resolve) => {
      chrome.bookmarks.search(query, (results) => {
        resolve(results);
      });
    });
  }

  static async getBookmarksByFolder(folderId: string): Promise<BookmarkNode[]> {
    return new Promise((resolve) => {
      chrome.bookmarks.getChildren(folderId, (children) => {
        resolve(children);
      });
    });
  }

  static async createBookmark(bookmark: {
    parentId?: string;
    title: string;
    url?: string;
    index?: number;
  }): Promise<BookmarkNode> {
    return new Promise((resolve) => {
      chrome.bookmarks.create(bookmark, (result) => {
        resolve(result);
      });
    });
  }

  static async updateBookmark(
    id: string,
    changes: { title?: string; url?: string }
  ): Promise<BookmarkNode> {
    return new Promise((resolve) => {
      chrome.bookmarks.update(id, changes, (result) => {
        resolve(result);
      });
    });
  }

  static async removeBookmark(id: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.bookmarks.remove(id, () => {
        resolve();
      });
    });
  }

  static async moveBookmark(
    id: string,
    destination: { parentId?: string; index?: number }
  ): Promise<BookmarkNode> {
    return new Promise((resolve) => {
      chrome.bookmarks.move(id, destination, (result) => {
        resolve(result);
      });
    });
  }

  static flattenBookmarks(nodes: BookmarkNode[]): BookmarkNode[] {
    const result: BookmarkNode[] = [];
    
    function traverse(nodes: BookmarkNode[]) {
      for (const node of nodes) {
        if (node.url) {
          result.push(node);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }
    
    traverse(nodes);
    return result;
  }

  static getFolders(nodes: BookmarkNode[]): BookmarkNode[] {
    const result: BookmarkNode[] = [];
    
    function traverse(nodes: BookmarkNode[]) {
      for (const node of nodes) {
        if (!node.url) {
          result.push(node);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }
    
    traverse(nodes);
    return result;
  }
}