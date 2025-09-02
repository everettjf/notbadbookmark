import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';

export type SortOption = 'title-asc' | 'title-desc' | 'domain-asc' | 'domain-desc' | 'date-added';

interface SortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function SortDropdown({ currentSort, onSortChange }: SortDropdownProps) {
  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'title-asc': return 'Title A-Z';
      case 'title-desc': return 'Title Z-A';
      case 'domain-asc': return 'Domain A-Z';
      case 'domain-desc': return 'Domain Z-A';
      case 'date-added': return 'Date Added';
      default: return 'Sort';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          {getSortLabel(currentSort)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
        <DropdownMenuItem onClick={() => onSortChange('date-added')}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <span>Date Added</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}