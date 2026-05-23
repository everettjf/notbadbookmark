import React from 'react';
import { createRoot } from 'react-dom/client';
import { BookmarkManager } from '@/components/BookmarkManager';
import { Toaster } from '@/components/ui/toaster';
import '@/globals.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <>
      <BookmarkManager />
      <Toaster />
    </>
  );
}