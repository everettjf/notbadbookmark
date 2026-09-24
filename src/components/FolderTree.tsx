import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BookmarkNode, canEdit, canContain } from '@/lib/bookmarks';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  folders: BookmarkNode[];
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onEditFolder?: (folder: BookmarkNode) => void;
  onDeleteFolder?: (folder: BookmarkNode) => void;
}

interface FolderItemProps {
  folder: BookmarkNode;
  level: number;
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  expandedFolders: Set<string>;
  onToggleExpanded: (folderId: string) => void;
  onEditFolder?: (folder: BookmarkNode) => void;
  onDeleteFolder?: (folder: BookmarkNode) => void;
}

function FolderItem({ 
  folder, 
  level, 
  selectedFolder, 
  onFolderSelect, 
  expandedFolders,
  onToggleExpanded,
  onEditFolder,
  onDeleteFolder
}: FolderItemProps) {
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolder === folder.id;
  const hasChildren = folder.children && folder.children.some(child => !child.url);
  const { setNodeRef, isOver } = useDroppable({ id: `folder:${folder.id}`, disabled: !canContain(folder) });

  const handleClick = () => {
    onFolderSelect(folder.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpanded(folder.id);
    }
  };

  return (
    <div ref={setNodeRef}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            role="button" tabIndex={0}
            aria-label={folder.title}
            onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleClick(); } }}
            className={cn(
              "w-full justify-start text-left font-normal h-auto py-1 px-2 rounded-md",
              isSelected && "bg-accent text-accent-foreground",
              isOver && "ring-2 ring-primary bg-primary/10",
              "hover:bg-accent/50"
            )}
            style={{ paddingLeft: `${0.5 + level * 0.625}rem` }}
            onClick={handleClick}
          >
            <div className="flex items-center gap-1.5 w-full">
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${folder.title}`}
                  aria-expanded={isExpanded}
                  onClick={handleToggle}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <div className="w-4" />
              )}

              {isExpanded && hasChildren ? (
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}

              <span className="truncate flex-1 text-[13px]">{folder.title}</span>
            </div>
          </div>
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleClick}>
            <Folder className="h-4 w-4 mr-2" />
            Open Folder
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          <ContextMenuItem disabled={!canEdit(folder)} onClick={() => onEditFolder?.(folder)}>
            <Edit className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
          
          <ContextMenuItem 
            disabled={!canEdit(folder)}
            onClick={() => onDeleteFolder?.(folder)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {hasChildren && isExpanded && folder.children && (
        <div>
          {folder.children
            .filter(child => !child.url)
            .map(child => (
              <FolderItem
                key={child.id}
                folder={child}
                level={level + 1}
                selectedFolder={selectedFolder}
                onFolderSelect={onFolderSelect}
                expandedFolders={expandedFolders}
                onToggleExpanded={onToggleExpanded}
                onEditFolder={onEditFolder}
                onDeleteFolder={onDeleteFolder}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ folders, selectedFolder, onFolderSelect, onEditFolder, onDeleteFolder }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2'])); // Default open Bookmarks Bar and Other Bookmarks

  const handleToggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <div className="p-1.5">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-left font-normal h-auto py-1 px-2 mb-1 rounded-md",
          selectedFolder === null && "bg-accent text-accent-foreground",
          "hover:bg-accent/50"
        )}
        onClick={() => onFolderSelect(null)}
      >
        <div className="flex items-center gap-1.5">
          <Folder className="h-3.5 w-3.5 text-primary" />
          <span className="text-[13px] font-medium">All Bookmarks</span>
        </div>
      </Button>

      <div className="space-y-0.5">
        {folders
          .filter(folder => folder.parentId === '0') // Root folders only
          .map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              level={0}
              selectedFolder={selectedFolder}
              onFolderSelect={onFolderSelect}
              expandedFolders={expandedFolders}
              onToggleExpanded={handleToggleExpanded}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
      </div>
    </div>
  );
}