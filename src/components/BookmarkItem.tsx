import React from 'react';
import { motion } from 'framer-motion';
import { BookmarkNode } from '@/lib/bookmarks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Edit, Trash2, Link, Share, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkItemProps {
  bookmark: BookmarkNode;
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmark: BookmarkNode) => void;
  onShare?: (bookmark: BookmarkNode) => void;
  className?: string;
  isDragHandle?: boolean;
  dragHandleProps?: any;
}

export function BookmarkItem({ bookmark, onEdit, onDelete, onShare, className, isDragHandle, dragHandleProps }: BookmarkItemProps) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card className={cn("relative p-3 hover:bg-accent/50 group border transition-all duration-200", className)}>
        <div className="flex items-center gap-3">
        {isDragHandle && (
          <div 
            {...dragHandleProps}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            {bookmark.url ? (
              <img
                src={getFavicon(bookmark.url)}
                alt=""
                className="w-4 h-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Link className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${bookmark.url ? 'hidden' : ''}`} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 cursor-pointer" onClick={openBookmark}>
          <h3 className="font-medium text-sm truncate">{bookmark.title}</h3>
          {bookmark.url && (
            <p className="text-xs text-muted-foreground truncate">
              {new URL(bookmark.url).hostname}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {bookmark.url && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  openBookmark();
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(bookmark);
                }}
              >
                <Share className="h-3 w-3" />
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(bookmark);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(bookmark);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      </Card>
    </motion.div>
  );
}