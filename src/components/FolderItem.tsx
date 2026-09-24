import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BookmarkNode, canEdit, canContain } from '@/lib/bookmarks';
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

function FolderItemComponent({ folder, onFolderSelect, onEdit, onDelete, className, isSelected }: FolderItemProps) {
  const handleClick = () => {
    onFolderSelect?.(folder);
  };

  const bookmarkCount = folder.children?.filter(child => child.url).length || 0;
  const subfolderCount = folder.children?.filter(child => !child.url).length || 0;

  const { setNodeRef, isOver } = useDroppable({ id: `folder:${folder.id}`, disabled: !canContain(folder) });

  return (
    <div ref={setNodeRef} className="transition-colors">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card
            className={cn(
              "p-1.5 cursor-pointer group border rounded-md transition-colors duration-150",
              isOver
                ? "border-primary ring-2 ring-primary bg-primary/10"
                : isSelected
                ? "border-primary bg-primary/5"
                : "hover:bg-accent/60",
              className
            )}
            role="button" tabIndex={0} title={folder.title}
            onKeyDown={e => { if (e.key === 'F2' && canEdit(folder)) { e.preventDefault(); onEdit?.(folder); } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
            onClick={handleClick}
          >
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <div className="p-1 rounded bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  {isSelected ? (
                    <FolderOpen className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[13px] leading-tight truncate">{folder.title}</h3>
                <div className="flex items-center gap-2 text-[11px] leading-tight text-muted-foreground mt-0.5">
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
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
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
          
          <ContextMenuItem disabled={!canEdit(folder)} onClick={() => onEdit?.(folder)}>
            <Edit className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
          
          <ContextMenuItem 
            disabled={!canEdit(folder)}
            onClick={() => onDelete?.(folder)}
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

export const FolderItem = React.memo(FolderItemComponent);