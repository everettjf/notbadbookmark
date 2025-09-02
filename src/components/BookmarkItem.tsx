import React from 'react';
import { motion } from 'framer-motion';
import { BookmarkNode } from '@/lib/bookmarks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BorderBeam } from '@/components/ui/border-beam';
import { ExternalLink, Edit, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkItemProps {
  bookmark: BookmarkNode;
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmark: BookmarkNode) => void;
  className?: string;
}

export function BookmarkItem({ bookmark, onEdit, onDelete, className }: BookmarkItemProps) {
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={cn("relative p-3 hover:bg-accent/50 cursor-pointer group overflow-hidden", className)}>
        <BorderBeam size={250} duration={12} delay={Math.random() * 2} />
        <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {bookmark.url ? (
            <img
              src={getFavicon(bookmark.url)}
              alt=""
              className="w-4 h-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
              }}
            />
          ) : (
            <Star className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 min-w-0" onClick={openBookmark}>
          <h3 className="font-medium text-sm truncate">{bookmark.title}</h3>
          {bookmark.url && (
            <p className="text-xs text-muted-foreground truncate">
              {new URL(bookmark.url).hostname}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {bookmark.url && (
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