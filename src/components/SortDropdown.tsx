import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, ArrowUpAZ, ArrowDownAZ, GripVertical } from 'lucide-react';

export type SortOption = 'manual' | 'title-asc' | 'title-desc' | 'domain-asc' | 'domain-desc' | 'newest-first' | 'oldest-first';

interface SortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function SortDropdown({ currentSort, onSortChange }: SortDropdownProps) {
  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'manual': return 'Manual Order';
      case 'title-asc': return 'Title A-Z';
      case 'title-desc': return 'Title Z-A';
      case 'domain-asc': return 'Domain A-Z';
      case 'domain-desc': return 'Domain Z-A';
      case 'newest-first': return 'Newest First';
      case 'oldest-first': return 'Oldest First';
      default: return 'Sort';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
          <ArrowUpDown className="h-3 w-3 mr-1" />
          {getSortLabel(currentSort)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onSortChange('manual')}>
          <GripVertical className="mr-2 h-4 w-4" />
          <span>Manual Order</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('title-asc')}>
          <ArrowUpAZ className="mr-2 h-4 w-4" />
          <span>Title A-Z</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('title-desc')}>
          <ArrowDownAZ className="mr-2 h-4 w-4" />
          <span>Title Z-A</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('domain-asc')}>
          <ArrowUpAZ className="mr-2 h-4 w-4" />
          <span>Domain A-Z</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('domain-desc')}>
          <ArrowDownAZ className="mr-2 h-4 w-4" />
          <span>Domain Z-A</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('newest-first')}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <span>Newest First</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('oldest-first')}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <span>Oldest First</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}