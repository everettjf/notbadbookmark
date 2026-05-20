import { BookmarkNode, BookmarkService } from './bookmarks';

export interface BookmarkExport {
  version: string;
  exportDate: string;
  bookmarks: BookmarkNode[];
}

export class ImportExportService {
  static async exportBookmarks(): Promise<string> {
    const bookmarks = await BookmarkService.getAllBookmarks();
    
    const exportData: BookmarkExport = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      bookmarks: bookmarks
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  static async downloadBookmarks(format: 'json' | 'html' | 'markdown' = 'json'): Promise<void> {
    try {
      let content: string;
      let mimeType: string;
      let fileExtension: string;
      
      const bookmarkTree = await BookmarkService.getAllBookmarks();
      const allBookmarksFlat = BookmarkService.flattenBookmarks(bookmarkTree);
      const validBookmarksOnly = allBookmarksFlat.filter(b => b.url); // Only include actual bookmarks, not folders
      const dateStr = new Date().toISOString().split('T')[0];
      
      switch (format) {
        case 'json': {
          const exportData: BookmarkExport = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            bookmarks: validBookmarksOnly
          };
          content = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        }
          
        case 'html':
          content = this.exportToHTML(validBookmarksOnly);
          mimeType = 'text/html';
          fileExtension = 'html';
          break;
          
        case 'markdown':
          content = this.exportToMarkdown(validBookmarksOnly);
          mimeType = 'text/markdown';
          fileExtension = 'md';
          break;
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmarks-${dateStr}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export bookmarks');
    }
  }

  static parseImportFile(fileContent: string): BookmarkExport {
    try {
      const data = JSON.parse(fileContent);
      
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        throw new Error('Invalid bookmark file format');
      }
      
      return data as BookmarkExport;
    } catch (error) {
      throw new Error('Failed to parse bookmark file');
    }
  }

  static async importBookmarks(
    exportData: BookmarkExport, 
    targetFolderId?: string
  ): Promise<void> {
    try {
      const parentId = targetFolderId || '1'; // Default to Bookmarks Bar
      
      for (const bookmark of exportData.bookmarks) {
        if (bookmark.url) {
          await BookmarkService.createBookmark({
            title: bookmark.title,
            url: bookmark.url,
            parentId: parentId
          });
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import bookmarks');
    }
  }

  static async importFromFile(file: File, targetFolderId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const exportData = this.parseImportFile(content);
          await this.importBookmarks(exportData, targetFolderId);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Chrome native bookmark export format support
  static parseNetscapeBookmarks(htmlContent: string): { title: string; url: string }[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const links = doc.querySelectorAll('a[href]');
    
    return Array.from(links).map(link => ({
      title: link.textContent || 'Untitled',
      url: link.getAttribute('href') || ''
    })).filter(bookmark => bookmark.url);
  }

  static async importNetscapeBookmarks(file: File, targetFolderId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const bookmarks = this.parseNetscapeBookmarks(content);
          const parentId = targetFolderId || '1';
          
          for (const bookmark of bookmarks) {
            await BookmarkService.createBookmark({
              title: bookmark.title,
              url: bookmark.url,
              parentId: parentId
            });
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  static exportToHTML(bookmarks: BookmarkNode[]): string {
    const timestamp = new Date().toLocaleString();
    
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
<DT><H3>NotBadBookmark Export - ${timestamp}</H3>
<DL><p>
`;

    bookmarks.forEach(bookmark => {
      if (bookmark.url) {
        const addedDate = bookmark.dateAdded ? Math.floor(bookmark.dateAdded / 1000) : '';
        html += `<DT><A HREF="${bookmark.url}"${addedDate ? ` ADD_DATE="${addedDate}"` : ''}>${bookmark.title}</A>\n`;
      }
    });

    html += `</DL><p>
</DL><p>`;

    return html;
  }

  static exportToMarkdown(bookmarks: BookmarkNode[]): string {
    const timestamp = new Date().toLocaleString();
    
    let markdown = `# NotBadBookmark Export\n\nExported on: ${timestamp}\n\n`;
    
    const bookmarksByDomain = new Map<string, BookmarkNode[]>();
    
    bookmarks.forEach(bookmark => {
      if (bookmark.url) {
        try {
          const domain = new URL(bookmark.url).hostname;
          if (!bookmarksByDomain.has(domain)) {
            bookmarksByDomain.set(domain, []);
          }
          bookmarksByDomain.get(domain)!.push(bookmark);
        } catch {
          const unknown = 'Unknown';
          if (!bookmarksByDomain.has(unknown)) {
            bookmarksByDomain.set(unknown, []);
          }
          bookmarksByDomain.get(unknown)!.push(bookmark);
        }
      }
    });

    Array.from(bookmarksByDomain.keys()).sort().forEach(domain => {
      markdown += `## ${domain}\n\n`;
      bookmarksByDomain.get(domain)!.forEach(bookmark => {
        markdown += `- [${bookmark.title}](${bookmark.url})\n`;
      });
      markdown += '\n';
    });

    return markdown;
  }
}