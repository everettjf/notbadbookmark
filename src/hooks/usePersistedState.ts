import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useState backed by chrome.storage.local. The value starts at `defaultValue`,
 * is hydrated from storage on mount, and persists on every change afterwards.
 * Writes are suppressed until hydration completes so the default never clobbers
 * a previously stored value.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const hydrated = useRef(false);

  useEffect(() => {
    chrome.storage?.local.get(key, (result) => {
      if (result && result[key] !== undefined) {
        setValue(result[key] as T);
      }
      hydrated.current = true;
    });
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    chrome.storage?.local.set({ [key]: value });
  }, [key, value]);

  const set = useCallback((next: T) => setValue(next), []);

  return [value, set];
}
