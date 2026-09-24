import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookmarkNode } from '@/lib/bookmarks';
import { BookmarkItem } from '@/components/BookmarkItem';
import { Checkbox } from '@/components/ui/checkbox';

interface DraggableBookmarkItemProps {
  bookmark: BookmarkNode;
  path?: string;
  query?: string;
  onLocate?: () => void;
  disabled?: boolean;
  tags?: string[];
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmark: BookmarkNode) => void;
  onShare?: (bookmark: BookmarkNode) => void;
  onCopy?: (bookmark: BookmarkNode) => void;
  className?: string;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelection?: (bookmarkId: string) => void;
}

export function DraggableBookmarkItem({
  bookmark, path, query, onLocate, disabled,
  tags,
  onEdit,
  onDelete,
  onShare,
  onCopy,
  className,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelection
}: DraggableBookmarkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: bookmark.id,
    disabled: isSelectionMode || disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSelectionToggle = () => {
    onToggleSelection?.(bookmark.id);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={className}
    >
      <div className="relative">
        {isSelectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              aria-label={`Select ${bookmark.title}`}
              disabled={disabled}
              checked={isSelected}
              onCheckedChange={handleSelectionToggle}
              className="bg-background border-2"
            />
          </div>
        )}
        
        <div className="w-full">
          <BookmarkItem
            bookmark={bookmark}
            path={path} query={query} onLocate={onLocate}
            tags={tags}
            onEdit={onEdit}
            onDelete={onDelete}
            onShare={onShare}
            onCopy={onCopy}
            className={`${isDragging ? 'ring-2 ring-primary' : ''} ${
              isSelected ? 'bookmark-selected ring-1 ring-primary' : ''
            } ${isSelectionMode ? 'pl-8' : ''}`}
            isDragHandle={!isSelectionMode && !disabled}
            dragHandleProps={isSelectionMode ? {} : { ...attributes, ...listeners }}
            isSelectionMode={isSelectionMode}
            onToggleSelection={onToggleSelection}
          />
        </div>
      </div>
    </div>
  );
}