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
import { Moon, Sun, Monitor, Circle } from 'lucide-react';

export function ThemeToggle() {
  const { setTheme, baseTheme } = useTheme();

  const getThemeIcon = () => {
    if (baseTheme === 'dark') return <Moon className="h-[1.2rem] w-[1.2rem]" />;
    if (baseTheme === 'light') return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-7 w-7">
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
          <Circle className="mr-2 h-4 w-4 text-green-600 fill-current" />
          <span>Light Green</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('light-purple')}>
          <Circle className="mr-2 h-4 w-4 text-purple-600 fill-current" />
          <span>Light Purple</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('light-orange')}>
          <Circle className="mr-2 h-4 w-4 text-orange-600 fill-current" />
          <span>Light Orange</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('light-pink')}>
          <Circle className="mr-2 h-4 w-4 text-pink-600 fill-current" />
          <span>Light Pink</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark Default</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark-blue')}>
          <Circle className="mr-2 h-4 w-4 text-blue-400 fill-current" />
          <span>Dark Blue</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark-green')}>
          <Circle className="mr-2 h-4 w-4 text-green-400 fill-current" />
          <span>Dark Green</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark-purple')}>
          <Circle className="mr-2 h-4 w-4 text-purple-400 fill-current" />
          <span>Dark Purple</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark-orange')}>
          <Circle className="mr-2 h-4 w-4 text-orange-400 fill-current" />
          <span>Dark Orange</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark-pink')}>
          <Circle className="mr-2 h-4 w-4 text-pink-400 fill-current" />
          <span>Dark Pink</span>
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