'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { Startup } from '@/data/startups';

interface StartupTooltipProps {
  startup: Startup | null;
  rect: { x: number; y: number; width: number; height: number } | null;
}

const EDGE_PADDING = 8;

export const StartupTooltip: React.FC<StartupTooltipProps> = ({ startup, rect }) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ left: number; top: number; flipped: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!startup || !rect) return;

    const el = innerRef.current;
    const tooltipWidth = el?.offsetWidth ?? 288; // fallback: w-72
    const tooltipHeight = el?.offsetHeight ?? 140;

    const idealLeft = rect.x + rect.width / 2;
    const clampedLeft = Math.min(
      Math.max(idealLeft, EDGE_PADDING + tooltipWidth / 2),
      window.innerWidth - EDGE_PADDING - tooltipWidth / 2
    );

    // Flip below the tile when there isn't enough room above it.
    const flipped = rect.y - 12 - tooltipHeight < EDGE_PADDING;
    const top = flipped ? rect.y + rect.height + 12 : rect.y - 12;

    setPlacement({ left: clampedLeft, top, flipped });
    // rect.x/y/width/height are read directly; startup identity plus the
    // numeric fields are what should trigger a reposition (a new rect object
    // with the same values shouldn't re-run this).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startup, rect?.x, rect?.y, rect?.width, rect?.height]);

  if (!startup || !rect) return null;

  const left = placement?.left ?? rect.x + rect.width / 2;
  const top = placement?.top ?? rect.y - 12;
  const flipped = placement?.flipped ?? false;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        transform: flipped ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
      className="z-50 pointer-events-none"
    >
      <div
        ref={innerRef}
        style={{ transformOrigin: flipped ? 'top center' : 'bottom center' }}
        className="w-72 p-3.5 bg-surface/95 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl text-left motion-safe:animate-pop-in"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow"
              style={{ backgroundColor: startup.bgColor, color: startup.textColor }}
            >
              {startup.symbolGlyph}
            </div>
            <div>
              <h4 className="text-foreground text-sm font-semibold leading-tight">{startup.name}</h4>
              <span className="text-[11px] text-muted-foreground font-mono">{startup.country}</span>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-secondary-foreground border border-border font-semibold">
            {startup.batch}
          </span>
        </div>

        <p className="text-xs text-secondary-foreground leading-relaxed line-clamp-3 mb-2">
          {startup.description}
        </p>

        <div className="flex flex-wrap gap-1 pt-1 border-t border-border-subtle/80 text-[10px] text-muted-foreground">
          {startup.categories.map((c) => (
            <span key={c} className="px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
              #{c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
