import { BookmarkNode, BookmarkService } from './bookmarks';

export interface BookmarkExport {
  version: string;
  exportDate: string;
  bookmarks: BookmarkNode[];
}

interface ParsedBookmark {
  title: string;
  url?: string;
  children?: ParsedBookmark[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
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

  // Set of URLs already present, used to skip duplicates on import.
  private static async getExistingUrls(): Promise<Set<string>> {
    const tree = await BookmarkService.getAllBookmarks();
    return new Set(
      BookmarkService.flattenBookmarks(tree)
        .filter((b) => b.url)
        .map((b) => b.url!.trim())
    );
  }

  static async importBookmarks(
    exportData: BookmarkExport,
    targetFolderId?: string
  ): Promise<ImportResult> {
    try {
      const parentId = targetFolderId || '1'; // Default to Bookmarks Bar
      const existing = await this.getExistingUrls();
      let imported = 0;
      let skipped = 0;

      for (const bookmark of exportData.bookmarks) {
        if (!bookmark.url) continue;
        const key = bookmark.url.trim();
        if (existing.has(key)) {
          skipped += 1;
          continue;
        }
        await BookmarkService.createBookmark({
          title: bookmark.title,
          url: bookmark.url,
          parentId,
        });
        existing.add(key);
        imported += 1;
      }
      return { imported, skipped };
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import bookmarks');
    }
  }

  static async importFromFile(file: File, targetFolderId?: string): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const exportData = this.parseImportFile(content);
          resolve(await this.importBookmarks(exportData, targetFolderId));
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

  // Walk the Netscape DL/DT tree, preserving folder hierarchy. The format omits
  // end tags, so a folder's child <DL> may be parsed either as a child of its
  // <DT> or as the next sibling; both layouts are handled.
  static parseNetscapeTree(htmlContent: string): ParsedBookmark[] {
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    const rootDl = doc.querySelector('dl');
    return rootDl ? this.parseDl(rootDl) : [];
  }

  private static parseDl(dl: Element): ParsedBookmark[] {
    const nodes: ParsedBookmark[] = [];
    const dts = Array.from(dl.children).filter((el) => el.tagName === 'DT');

    for (const dt of dts) {
      const heading = dt.querySelector(':scope > h3');
      const anchor = dt.querySelector(':scope > a');

      if (heading) {
        let childDl = dt.querySelector(':scope > dl');
        if (!childDl) {
          let sib = dt.nextElementSibling;
          while (sib && sib.tagName !== 'DL' && sib.tagName !== 'DT') {
            sib = sib.nextElementSibling;
          }
          if (sib && sib.tagName === 'DL') childDl = sib;
        }
        nodes.push({
          title: heading.textContent || 'Folder',
          children: childDl ? this.parseDl(childDl) : [],
        });
      } else if (anchor) {
        const url = anchor.getAttribute('href') || '';
        if (url) nodes.push({ title: anchor.textContent || 'Untitled', url });
      }
    }
    return nodes;
  }

  private static countBookmarks(nodes: ParsedBookmark[]): number {
    return nodes.reduce(
      (sum, node) => sum + (node.url ? 1 : 0) + (node.children ? this.countBookmarks(node.children) : 0),
      0
    );
  }

  private static async createTree(
    nodes: ParsedBookmark[],
    parentId: string,
    existing: Set<string>
  ): Promise<ImportResult> {
    let imported = 0;
    let skipped = 0;
    for (const node of nodes) {
      if (node.url) {
        const key = node.url.trim();
        if (existing.has(key)) {
          skipped += 1;
          continue;
        }
        await BookmarkService.createBookmark({ title: node.title, url: node.url, parentId });
        existing.add(key);
        imported += 1;
      } else {
        const folder = await BookmarkService.createBookmark({ title: node.title, parentId });
        const result = await this.createTree(node.children || [], folder.id, existing);
        imported += result.imported;
        skipped += result.skipped;
      }
    }
    return { imported, skipped };
  }

  static async importNetscapeBookmarks(file: File, targetFolderId?: string): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const parentId = targetFolderId || '1';
          const existing = await this.getExistingUrls();

          const tree = this.parseNetscapeTree(content);
          const flat = this.parseNetscapeBookmarks(content);

          // Safety net: only trust the hierarchical walk if it captured every
          // bookmark the flat scan found. Otherwise fall back to a flat import
          // so no bookmark is ever silently dropped.
          if (this.countBookmarks(tree) >= flat.length && tree.length > 0) {
            resolve(await this.createTree(tree, parentId, existing));
          } else {
            let imported = 0;
            let skipped = 0;
            for (const bookmark of flat) {
              const key = bookmark.url.trim();
              if (existing.has(key)) {
                skipped += 1;
                continue;
              }
              await BookmarkService.createBookmark({
                title: bookmark.title,
                url: bookmark.url,
                parentId,
              });
              existing.add(key);
              imported += 1;
            }
            resolve({ imported, skipped });
          }
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