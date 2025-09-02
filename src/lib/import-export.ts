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

  static async downloadBookmarks(): Promise<void> {
    try {
      const exportData = await this.exportBookmarks();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
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
}