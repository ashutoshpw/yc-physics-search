'use client';

import React, { useState, useDeferredValue, useMemo, useCallback, useEffect } from 'react';
import { PhysicsPile } from '@/components/PhysicsPile';
import { SearchBar } from '@/components/SearchBar';
import { StartupTooltip } from '@/components/StartupTooltip';
import { StartupModal } from '@/components/StartupModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Startup, YC_STARTUPS } from '@/data/startups';
import { searchStartups, type SearchResult } from '@/lib/search';
import type { SearchApiResponse } from '@/lib/filters';

// Wait for a typing pause before asking the AI parser, so we don't call it per keystroke.
const AI_SEARCH_DEBOUNCE_MS = 400;
const STARTUPS_BY_ID = new Map(YC_STARTUPS.map((s) => [s.id, s]));

export default function Home() {
  const [query, setQuery] = useState('');
  const [hoveredStartup, setHoveredStartup] = useState<Startup | null>(null);
  const [hoveredRect, setHoveredRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const deferredQuery = useDeferredValue(query);

  // Heavy search/matchedIds computation deferred so fast typing in the
  // controlled input never drops or garbles characters.
  const localResult = useMemo(() => {
    return searchStartups(deferredQuery);
  }, [deferredQuery]);

  // AI-parsed result from /api/search; replaces the instant local result once it arrives.
  const [aiResult, setAiResult] = useState<{ query: string; result: SearchResult } | null>(null);

  useEffect(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) return;
    const controller = new AbortController();
    const runAiSearch = async () => {
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Search API responded ${res.status}`);
        const data: SearchApiResponse = await res.json();
        if (data.source !== 'ai') return;
        const matches = data.matchIds.flatMap((id) => STARTUPS_BY_ID.get(id) ?? []);
        setAiResult({ query: deferredQuery, result: { matches, matchedCategoryLabel: data.categoryLabel } });
      } catch (err) {
        if (!controller.signal.aborted) console.error('AI search failed; keeping local results:', err);
      }
    };
    const timer = setTimeout(() => void runAiSearch(), AI_SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [deferredQuery]);

  const searchResult = aiResult?.query === deferredQuery ? aiResult.result : localResult;

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
      <div aria-hidden className="ambient-bg pointer-events-none absolute inset-0 z-0" />
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
