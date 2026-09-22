'use client';

import React, { useState, useDeferredValue, useMemo, useCallback } from 'react';
import { PhysicsPile } from '@/components/PhysicsPile';
import { SearchBar } from '@/components/SearchBar';
import { StartupTooltip } from '@/components/StartupTooltip';
import { StartupModal } from '@/components/StartupModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Startup } from '@/data/startups';
import { searchStartups } from '@/lib/search';

export default function Home() {
  const [query, setQuery] = useState('');
  const [hoveredStartup, setHoveredStartup] = useState<Startup | null>(null);
  const [hoveredRect, setHoveredRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const deferredQuery = useDeferredValue(query);

  // Heavy search/matchedIds computation deferred so fast typing in the
  // controlled input never drops or garbles characters.
  const searchResult = useMemo(() => {
    return searchStartups(deferredQuery);
  }, [deferredQuery]);

  const matchedIds = useMemo(() => {
    return searchResult.matches.map((s) => s.id);
  }, [searchResult]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
  };

  const handleHoverStartup = useCallback(
    (startup: Startup | null, rect: { x: number; y: number; width: number; height: number } | null) => {
      setHoveredStartup(startup);
      setHoveredRect(rect);
    },
    []
  );

  const handleSelectStartup = useCallback((startup: Startup) => {
    setSelectedStartup(startup);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-background text-foreground flex flex-col items-center justify-between select-none">
      {/* Top Header Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#ff6600] flex items-center justify-center font-bold text-white text-xs shadow-md">
            Y
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            YC Universe Search
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-faint font-mono pointer-events-auto">
          <span className="hidden sm:inline">Physics Engine Active</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Physics Canvas Background */}
      <PhysicsPile
        matchedIds={matchedIds}
        onHoverStartup={handleHoverStartup}
        onSelectStartup={handleSelectStartup}
      />

      {/* Floating Search Controls (Centered horizontally, positioned at ~55% height) */}
      <div className="relative w-full z-20 flex flex-col items-center mb-auto pt-[36vh] pointer-events-none">
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          resultCount={searchResult.matches.length}
          categoryLabel={searchResult.matchedCategoryLabel}
        />
      </div>

      {/* Footer Info */}
      <footer className="w-full px-6 py-3 flex items-center justify-center text-[11px] text-faint z-10 pointer-events-none">
        <span>Type natural queries above to see matching startups lift into the grid</span>
      </footer>

      {/* Hover Tooltip Card */}
      <StartupTooltip startup={hoveredStartup} rect={hoveredRect} />

      {/* Click Modal Details */}
      <StartupModal
        startup={selectedStartup}
        onClose={() => setSelectedStartup(null)}
      />
    </main>
  );
}
