import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, baseTheme, themeVariant } = useTheme();

  const getThemeIcon = () => {
    if (baseTheme === 'dark') return <Moon className="h-[1.2rem] w-[1.2rem]" />;
    if (baseTheme === 'light') return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
  };

  const getVariantColor = (variant: string) => {
    switch (variant) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      default: return '';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light Default</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('light-blue')}>
          <Sun className="mr-2 h-4 w-4 text-blue-600" />
          <span>Light Blue</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('light-green')}>
          <Sun className="mr-2 h-4 w-4 text-green-600" />
          <span>Light Green</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark Default</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark-blue')}>
          <Moon className="mr-2 h-4 w-4 text-blue-400" />
          <span>Dark Blue</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark-green')}>
          <Moon className="mr-2 h-4 w-4 text-green-400" />
          <span>Dark Green</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}