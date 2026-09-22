'use client';

import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  resultCount?: number;
  categoryLabel?: string;
}

const EXAMPLE_QUERIES = [
  'show me startups with a dog logo',
  'Show me the first startups in YC',
  'show me the newest startups in YC',
  'show me the inventory management startups in the summer 2024 batch',
  'show me food delivery software in USA',
  'show me food delivery software in Asia',
  'Show me startups with a red logo',
  'Show me startups with a blue logo',
  'Show me startups with a green logo',
  'Show me startups with a yellow logo',
  'Show me startups with a black logo',
  'show me startups in space tech',
  'startups in the ai testing niche',
  'startups in the ai coding agents in the cloud niche',
];

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, resultCount, categoryLabel }) => {
  const [currentPlaceholderIdx, setCurrentPlaceholderIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPlaceholderIdx(prev => (prev + 1) % EXAMPLE_QUERIES.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 z-20 flex flex-col items-center pointer-events-auto">
      {/* Active Category Tag / Status Badge */}
      {categoryLabel && (
        <div className="mb-2 px-3 py-1 rounded-full bg-surface/90 border border-border/60 text-xs text-secondary-foreground font-medium backdrop-blur-md motion-safe:animate-fade-in shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{categoryLabel}</span>
          <span className="text-faint font-mono">({resultCount})</span>
        </div>
      )}

      {/* Main Search Input Box */}
      <div className="relative w-full group">
        <div className="relative flex items-center bg-input/80 backdrop-blur-xl border border-border-subtle/80 rounded-2xl shadow-2xl transition-[border-color,box-shadow] duration-200 ease-out group-focus-within:border-border group-focus-within:shadow-[0_0_35px_rgba(0,0,0,0.06)] dark:group-focus-within:shadow-[0_0_35px_rgba(255,255,255,0.08)]">
          <div className="pl-4 text-muted-foreground">
            <svg
              className="w-5 h-5 transition-colors group-focus-within:text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Try: "${EXAMPLE_QUERIES[currentPlaceholderIdx]}"`}
            className="w-full py-3.5 px-3 bg-transparent text-foreground text-sm md:text-base font-normal placeholder:text-faint focus:outline-none"
            autoFocus
          />

          {value && (
            <button
              onClick={() => onChange('')}
              className="pr-4 text-faint hover:text-secondary-foreground text-xs font-mono transition-colors"
            >
              ESC
            </button>
          )}
        </div>

        {/* Ambient Glow Bar directly below the input (matching the video) */}
        <div className="h-[3px] w-4/5 mx-auto mt-1 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 opacity-60 blur-[1px] transition-opacity group-focus-within:opacity-100" />
      </div>

      {/* Quick Prompts Chips / Suggested Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-xl">
        {EXAMPLE_QUERIES.slice(0, 6).map((q) => (
          <button
            key={q}
            onClick={() => onChange(q)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-surface/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border-subtle/80 transition-colors duration-200 backdrop-blur-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
