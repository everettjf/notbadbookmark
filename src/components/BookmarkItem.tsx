import React from 'react';
import { BookmarkNode, canEdit, domainOf } from '@/lib/bookmarks';
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
  path?: string;
  query?: string;
  onLocate?: () => void;
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

function BookmarkItemComponent({ bookmark, path, query, onLocate, tags, onEdit, onDelete, onShare, onCopy, className, isDragHandle, dragHandleProps, isSelectionMode, onToggleSelection }: BookmarkItemProps) {
  const openBookmark = () => {
    if (bookmark.url) {
      chrome.tabs.create({ url: bookmark.url });
    }
  };

  const highlight = (value: string) => {
    const needle = query?.trim();
    if (!needle) return value;
    const start = value.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
    return start < 0 ? value : <>{value.slice(0, start)}<mark>{value.slice(start, start + needle.length)}</mark>{value.slice(start + needle.length)}</>;
  };

  return (
    <div className="transition-colors duration-150">
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
                  <Link className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>

              <div
                role="button" tabIndex={0}
                aria-label={`Open ${bookmark.title}`}
                title={`${bookmark.title}\n${bookmark.url || ''}\n${path || ''}`}
                onKeyDown={e => { if (e.key === 'F2' && canEdit(bookmark)) { e.preventDefault(); onEdit?.(bookmark); } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (isSelectionMode) onToggleSelection?.(bookmark.id); else openBookmark(); } }}
                className="flex-1 min-w-0 cursor-pointer focus-visible:outline focus-visible:outline-2"
                onClick={isSelectionMode ? () => onToggleSelection?.(bookmark.id) : openBookmark}
              >
                <h3 className="font-medium text-[13px] leading-tight truncate">{highlight(bookmark.title)}</h3>
                {bookmark.url && (
                  <p className="text-[11px] leading-tight text-muted-foreground truncate mt-0.5">
                    {highlight(domainOf(bookmark.url))}
                  </p>
                )}
                {path && <p className="text-[11px] text-muted-foreground truncate">{highlight(path)}</p>}
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
          {onLocate && <ContextMenuItem onClick={onLocate}>Show in folder</ContextMenuItem>}
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
          
          <ContextMenuItem disabled={!canEdit(bookmark)} onClick={() => onEdit?.(bookmark)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          <ContextMenuItem 
            disabled={!canEdit(bookmark)}
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