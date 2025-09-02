import React from 'react';
import { motion } from 'framer-motion';
import { BookmarkNode } from '@/lib/bookmarks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, FolderOpen, ChevronRight, Edit, Trash2, Share } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderItemProps {
  folder: BookmarkNode;
  onFolderSelect?: (folder: BookmarkNode) => void;
  onEdit?: (folder: BookmarkNode) => void;
  onDelete?: (folder: BookmarkNode) => void;
  className?: string;
  isSelected?: boolean;
}

export function FolderItem({ folder, onFolderSelect, onEdit, onDelete, className, isSelected }: FolderItemProps) {
  const handleClick = () => {
    onFolderSelect?.(folder);
  };

  const bookmarkCount = folder.children?.filter(child => child.url).length || 0;
  const subfolderCount = folder.children?.filter(child => !child.url).length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card 
        className={cn(
          "p-4 cursor-pointer group border-2 transition-all duration-200",
          isSelected 
            ? "border-primary bg-primary/5 shadow-md" 
            : "hover:bg-accent/50 hover:border-accent-foreground/20",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
              {isSelected ? (
                <FolderOpen className="h-5 w-5 text-primary" />
              ) : (
                <Folder className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate mb-1">{folder.title}</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {bookmarkCount > 0 && (
                <span>{bookmarkCount} bookmark{bookmarkCount !== 1 ? 's' : ''}</span>
              )}
              {subfolderCount > 0 && (
                <span>{subfolderCount} folder{subfolderCount !== 1 ? 's' : ''}</span>
              )}
              {bookmarkCount === 0 && subfolderCount === 0 && (
                <span>Empty</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(folder);
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
                onDelete?.(folder);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}