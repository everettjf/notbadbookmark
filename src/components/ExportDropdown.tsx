import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileJson, Globe, FileText } from 'lucide-react';

interface ExportDropdownProps {
  onExport: (format: 'json' | 'html' | 'markdown') => void;
}

export function ExportDropdown({ onExport }: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('json')}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>Export as JSON</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('html')}>
          <Globe className="mr-2 h-4 w-4" />
          <span>Export as HTML</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('markdown')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Export as Markdown</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}