import { useState, useEffect } from 'react';

type BaseTheme = 'light' | 'dark' | 'system';
type ThemeVariant = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
type Theme = `${BaseTheme}-${ThemeVariant}` | BaseTheme;

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>('default');

  useEffect(() => {
    const parseTheme = (themeStr: Theme) => {
      if (themeStr.includes('-')) {
        const [base, variant] = themeStr.split('-') as [BaseTheme, ThemeVariant];
        return { base, variant };
      }
      return { base: themeStr as BaseTheme, variant: 'default' as ThemeVariant };
    };

    const { base, variant } = parseTheme(theme);
    setThemeVariant(variant);

    const updateResolvedTheme = () => {
      if (base === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(systemPrefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(base);
      }
    };

    updateResolvedTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('dark', 'theme-default', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-pink');
    
    // Add dark class if needed
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    }
    
    // Add theme variant class
    root.classList.add(`theme-${themeVariant}`);
  }, [resolvedTheme, themeVariant]);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const getBaseTheme = (): BaseTheme => {
    if (theme.includes('-')) {
      return theme.split('-')[0] as BaseTheme;
    }
    return theme as BaseTheme;
  };

  return {
    theme,
    resolvedTheme,
    themeVariant,
    baseTheme: getBaseTheme(),
    setTheme: changeTheme,
  };
}