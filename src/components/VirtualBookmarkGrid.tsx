import React, { useLayoutEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualBookmarkGridProps {
  count: number;
  viewMode: 'grid' | 'list';
  scrollRef: React.RefObject<HTMLDivElement>;
  renderItem: (index: number) => React.ReactNode;
}

// Row-virtualized grid for large bookmark sets. Renders only the rows near the
// viewport, keeping the DOM small for libraries with thousands of bookmarks.
// Columns are derived from the measured width; row heights are measured
// dynamically so tag chips (which make some cards taller) don't misalign.
export function VirtualBookmarkGrid({ count, viewMode, scrollRef, renderItem }: VirtualBookmarkGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(viewMode === 'list' ? 1 : 6);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    const scroll = scrollRef.current;
    if (!grid || !scroll) return;

    const measure = () => {
      const width = grid.clientWidth;
      setCols(viewMode === 'list' ? 1 : Math.max(1, Math.floor((width + 6) / 186)));
      const offset = grid.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop;
      setScrollMargin(offset);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [viewMode, scrollRef]);

  const rowCount = Math.ceil(count / cols);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (viewMode === 'list' ? 42 : 54),
    overscan: 4,
    scrollMargin,
  });

  return (
    <div ref={gridRef} style={{ position: 'relative', width: '100%', height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((row) => {
        const start = row.index * cols;
        const indices: number[] = [];
        for (let i = 0; i < cols && start + i < count; i += 1) indices.push(start + i);

        return (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            <div
              style={
                viewMode === 'list'
                  ? { display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 6 }
                  : { display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: 6, paddingBottom: 6 }
              }
            >
              {indices.map((index) => renderItem(index))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
