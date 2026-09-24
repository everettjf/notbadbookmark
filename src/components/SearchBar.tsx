import React, { useEffect, useRef, useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
export function SearchBar({ value, onSearch }: { value: string; onSearch: (q: string) => void }) {
  const [draft, setDraft] = useState(value);
  const composing = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); input.current?.focus(); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  return <div className="flex gap-1 flex-1 min-w-48">
    <Input ref={input} aria-label="Search titles, URLs and folders" placeholder="Search titles, URLs and folders…" value={draft}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={e => { composing.current = false; onSearch(e.currentTarget.value); }}
      onChange={e => { setDraft(e.target.value); if (!composing.current) onSearch(e.target.value); }}
      onKeyDown={e => { if (e.key === 'Escape' && !composing.current) { setDraft(''); onSearch(''); } }} />
    {draft && <Button variant="ghost" aria-label="Clear search" onClick={() => { setDraft(''); onSearch(''); input.current?.focus(); }}>×</Button>}
  </div>;
}
