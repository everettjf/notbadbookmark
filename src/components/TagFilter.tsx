import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tag } from 'lucide-react';
import { TagSummary } from '@/lib/tags';

interface TagFilterProps {
  allTags: TagSummary[];
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagFilter({ allTags, selected, onChange }: TagFilterProps) {
  if (allTags.length === 0) return null;

  const selectedSet = new Set(selected.map((t) => t.toLowerCase()));

  const toggle = (tag: string) => {
    const key = tag.toLowerCase();
    if (selectedSet.has(key)) {
      onChange(selected.filter((t) => t.toLowerCase() !== key));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={selected.length > 0 ? 'default' : 'outline'}
          size="sm"
          className="h-7 px-2 text-xs"
        >
          <Tag className="h-3 w-3 mr-1" />
          {selected.length > 0 ? `Tags (${selected.length})` : 'Tags'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-auto w-52">
        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuLabel className="p-0 text-xs">Filter by tag</DropdownMenuLabel>
          {selected.length > 0 && (
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => onChange([])}
            >
              Clear
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {allTags.map(({ tag, count }) => (
          <DropdownMenuCheckboxItem
            key={tag.toLowerCase()}
            checked={selectedSet.has(tag.toLowerCase())}
            onCheckedChange={() => toggle(tag)}
            onSelect={(e) => e.preventDefault()}
            className="text-xs"
          >
            <span className="flex-1 truncate">{tag}</span>
            <span className="ml-2 text-[11px] text-muted-foreground">{count}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
