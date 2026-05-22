import React from 'react';
import { BookmarkNode } from '@/lib/bookmarks';
import { Card } from '@/components/ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit, Trash2, Link, Share, Copy, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkItemProps {
  bookmark: BookmarkNode;
  tags?: string[];
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmark: BookmarkNode) => void;
  onShare?: (bookmark: BookmarkNode) => void;
  onCopy?: (bookmark: BookmarkNode) => void;
  className?: string;
  isDragHandle?: boolean;
  dragHandleProps?: Record<string, unknown>;
  isSelectionMode?: boolean;
  onToggleSelection?: (bookmarkId: string) => void;
}

function BookmarkItemComponent({ bookmark, tags, onEdit, onDelete, onShare, onCopy, className, isDragHandle, dragHandleProps, isSelectionMode, onToggleSelection }: BookmarkItemProps) {
  const openBookmark = () => {
    if (bookmark.url) {
      chrome.tabs.create({ url: bookmark.url });
    }
  };

  const getFavicon = (url?: string) => {
    if (!url) return undefined;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return undefined;
    }
  };

  return (
    <div className="transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card className={cn("relative p-1.5 hover:bg-accent/60 group border rounded-md transition-colors duration-150", className)}>
            <div className="flex items-center gap-2">
              {isDragHandle && (
                <div
                  {...dragHandleProps}
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-shrink-0">
                <div className="w-5 h-5 rounded bg-muted/60 ring-1 ring-border/60 flex items-center justify-center overflow-hidden">
                  {bookmark.url ? (
                    <img
                      src={getFavicon(bookmark.url)}
                      alt=""
                      className="w-3.5 h-3.5"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <Link className={`w-3 h-3 text-muted-foreground ${bookmark.url ? 'hidden' : ''}`} />
                </div>
              </div>

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={isSelectionMode ? () => onToggleSelection?.(bookmark.id) : openBookmark}
              >
                <h3 className="font-medium text-[13px] leading-tight truncate">{bookmark.title}</h3>
                {bookmark.url && (
                  <p className="text-[11px] leading-tight text-muted-foreground truncate mt-0.5">
                    {new URL(bookmark.url).hostname}
                  </p>
                )}
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-block max-w-[84px] truncate rounded bg-secondary px-1 text-[10px] leading-4 text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-[10px] leading-4 text-muted-foreground">+{tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => openBookmark()}>
            <Link className="h-4 w-4 mr-2" />
            Open
          </ContextMenuItem>
          
          {bookmark.url && (
            <>
              <ContextMenuItem onClick={() => onCopy?.(bookmark)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </ContextMenuItem>
              
              <ContextMenuItem onClick={() => onShare?.(bookmark)}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </ContextMenuItem>
              
              <ContextMenuSeparator />
            </>
          )}
          
          <ContextMenuItem onClick={() => onEdit?.(bookmark)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          <ContextMenuItem 
            onClick={() => onDelete?.(bookmark)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export const BookmarkItem = React.memo(BookmarkItemComponent);