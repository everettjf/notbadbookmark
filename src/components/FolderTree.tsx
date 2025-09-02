import React, { useState } from 'react';
import { BookmarkNode } from '@/lib/bookmarks';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  folders: BookmarkNode[];
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

interface FolderItemProps {
  folder: BookmarkNode;
  level: number;
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  expandedFolders: Set<string>;
  onToggleExpanded: (folderId: string) => void;
}

function FolderItem({ 
  folder, 
  level, 
  selectedFolder, 
  onFolderSelect, 
  expandedFolders,
  onToggleExpanded 
}: FolderItemProps) {
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolder === folder.id;
  const hasChildren = folder.children && folder.children.some(child => !child.url);

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
    <div>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-left font-normal h-auto py-2 px-2",
          isSelected && "bg-accent text-accent-foreground",
          "hover:bg-accent/50"
        )}
        style={{ paddingLeft: `${0.5 + level * 0.75}rem` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 w-full">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
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
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
          
          <span className="truncate flex-1 text-sm">{folder.title}</span>
        </div>
      </Button>

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
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ folders, selectedFolder, onFolderSelect }: FolderTreeProps) {
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
    <div className="p-2">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-left font-normal h-auto py-2 px-2 mb-2",
          selectedFolder === null && "bg-accent text-accent-foreground",
          "hover:bg-accent/50"
        )}
        onClick={() => onFolderSelect(null)}
      >
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">All Bookmarks</span>
        </div>
      </Button>

      <div className="space-y-1">
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
            />
          ))}
      </div>
    </div>
  );
}