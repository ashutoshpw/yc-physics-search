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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm motion-safe:animate-fade-in">
      <div
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-left motion-safe:animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
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
            <h3 className="text-xl font-bold text-white leading-tight">{startup.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-semibold border border-neutral-700">
                YC {startup.batch}
              </span>
              <span className="text-xs text-neutral-400">{startup.country} ({startup.region})</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed mb-5">
          {startup.description}
        </p>

        <div className="mb-6">
          <h5 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Categories & Tags
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {startup.categories.map((c) => (
              <span
                key={c}
                className="text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700/60"
              >
                {c}
              </span>
            ))}
            {startup.symbols.map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-md bg-neutral-950 text-neutral-400 border border-neutral-800"
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
            className="block w-full py-2.5 px-4 text-center rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-medium text-sm transition shadow-lg"
          >
            Visit Website ↗
          </a>
        )}
      </div>
    </div>
  );
};
