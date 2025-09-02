import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookmarkNode } from '@/lib/bookmarks';
import { BookmarkItem } from '@/components/BookmarkItem';
import { Checkbox } from '@/components/ui/checkbox';

interface DraggableBookmarkItemProps {
  bookmark: BookmarkNode;
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmark: BookmarkNode) => void;
  className?: string;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelection?: (bookmarkId: string) => void;
}

export function DraggableBookmarkItem({ 
  bookmark, 
  onEdit, 
  onDelete, 
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
  } = useSortable({ id: bookmark.id });

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
      {...attributes}
      {...(isSelectionMode ? {} : listeners)}
      className={className}
    >
      <div className="relative">
        {isSelectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelectionToggle}
              className="bg-background border-2"
            />
          </div>
        )}
        
        <BookmarkItem
          bookmark={bookmark}
          onEdit={onEdit}
          onDelete={onDelete}
          className={`${isDragging ? 'ring-2 ring-primary' : ''} ${
            isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
          } ${isSelectionMode ? 'pl-8' : ''}`}
        />
      </div>
    </div>
  );
}