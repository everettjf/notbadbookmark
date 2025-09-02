import React from 'react';
import { motion } from 'framer-motion';
import { BookmarkNode } from '@/lib/bookmarks';
import { Card } from '@/components/ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Folder, FolderOpen, ChevronRight, Edit, Trash2 } from 'lucide-react';
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card 
            className={cn(
              "p-3 cursor-pointer group border-2 transition-all duration-200",
              isSelected 
                ? "border-primary bg-primary/5 shadow-md" 
                : "hover:bg-accent/50 hover:border-accent-foreground/20",
              className
            )}
            onClick={handleClick}
          >
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <div className="p-1.5 rounded bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  {isSelected ? (
                    <FolderOpen className="h-4 w-4 text-primary" />
                  ) : (
                    <Folder className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate mb-0.5">{folder.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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

              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleClick}>
            <Folder className="h-4 w-4 mr-2" />
            Open Folder
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          <ContextMenuItem onClick={() => onEdit?.(folder)}>
            <Edit className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
          
          <ContextMenuItem 
            onClick={() => onDelete?.(folder)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </motion.div>
  );
}