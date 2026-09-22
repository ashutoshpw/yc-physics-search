'use client';

import React from 'react';
import { Startup } from '@/data/startups';

interface StartupModalProps {
  startup: Startup | null;
  onClose: () => void;
}

export const StartupModal: React.FC<StartupModalProps> = ({ startup, onClose }) => {
  if (!startup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm motion-safe:animate-fade-in">
      <div
        className="relative w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 shadow-2xl text-left motion-safe:animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition"
        >
          ✕
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
            style={{ backgroundColor: startup.bgColor, color: startup.textColor }}
          >
            {startup.symbolGlyph}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground leading-tight">{startup.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-amber-600 dark:text-amber-400 font-semibold border border-border">
                YC {startup.batch}
              </span>
              <span className="text-xs text-muted-foreground">{startup.country} ({startup.region})</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-secondary-foreground leading-relaxed mb-5">
          {startup.description}
        </p>

        <div className="mb-6">
          <h5 className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2">
            Categories & Tags
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {startup.categories.map((c) => (
              <span
                key={c}
                className="text-xs px-2.5 py-1 rounded-md bg-muted text-secondary-foreground border border-border/60"
              >
                {c}
              </span>
            ))}
            {startup.symbols.map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-md bg-input text-muted-foreground border border-border-subtle"
              >
                logo:{s}
              </span>
            ))}
          </div>
        </div>

        {startup.website && (
          <a
            href={startup.website}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 px-4 text-center rounded-xl bg-foreground text-background hover:opacity-90 font-medium text-sm transition shadow-lg"
          >
            Visit Website ↗
          </a>
        )}
      </div>
    </div>
  );
};
