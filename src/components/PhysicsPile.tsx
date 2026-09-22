'use client';

import React, { useEffect, useRef } from 'react';
import { Startup, YC_STARTUPS } from '@/data/startups';

interface TileBody {
  id: string;
  startup: Startup;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  size: number;
  targetX?: number;
  targetY?: number;
  gridIndex?: number;
  state: 'PILE' | 'FLYING_TO_GRID' | 'GRID' | 'DROPPING';
  springProgress: number; // 0 to 1
  originX: number;
  originY: number;
  originAngle: number;
}

interface PhysicsPileProps {
  matchedIds: string[];
  onHoverStartup: (startup: Startup | null, rect: { x: number; y: number; width: number; height: number } | null) => void;
  onSelectStartup?: (startup: Startup) => void;
}

// Pure grid-slot math shared by the matched-ids layout pass and resize relayout
function computeGridSlot(idx: number, total: number, width: number, height: number) {
  const cols = total <= 8 ? Math.min(total, 6) : total <= 18 ? 8 : 10;
  const tileSize = 44;
  const gap = 12;
  const gridWidth = cols * tileSize + (cols - 1) * gap;
  const startX = (width - gridWidth) / 2 + tileSize / 2;
  const startY = height * 0.25;
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  return {
    targetX: startX + col * (tileSize + gap),
    targetY: startY + row * (tileSize + gap),
  };
}

// Reflows tiles already docked (or flying) in the grid to new slot positions,
// preserving their original ordering. Used on resize / DPR change.
function relayoutGridTiles(tiles: TileBody[]) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const active = tiles
    .filter(t => t.state === 'GRID' || t.state === 'FLYING_TO_GRID')
    .sort((a, b) => (a.gridIndex ?? 0) - (b.gridIndex ?? 0));
  const total = active.length;

  active.forEach((tile, idx) => {
    const { targetX, targetY } = computeGridSlot(idx, total, width, height);
    tile.originX = tile.x;
    tile.originY = tile.y;
    tile.originAngle = tile.angle;
    tile.targetX = targetX;
    tile.targetY = targetY;
    tile.springProgress = 0;
    tile.state = 'FLYING_TO_GRID';
  });
}

export const PhysicsPile: React.FC<PhysicsPileProps> = ({ matchedIds, onHoverStartup, onSelectStartup }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tilesRef = useRef<TileBody[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const hoveredTileRef = useRef<TileBody | null>(null);
  const onHoverStartupRef = useRef(onHoverStartup);
  const onSelectStartupRef = useRef(onSelectStartup);

  useEffect(() => {
    onHoverStartupRef.current = onHoverStartup;
  }, [onHoverStartup]);

  useEffect(() => {
    onSelectStartupRef.current = onSelectStartup;
  }, [onSelectStartup]);

  // Initialize pool of startup tiles pre-settled near the bottom pile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Expand startup collection to ~220 tiles so the bottom heap looks richly piled
    const pool: Startup[] = [];
    while (pool.length < 240) {
      pool.push(...YC_STARTUPS);
    }
    const selectedPool = pool.slice(0, 240);

    const floor = height - 20;
    const initialTiles: TileBody[] = selectedPool.map((startup, index) => {
      // Spawn distributed near bottom so pile forms rapidly and doesn't float down slowly
      const spawnX = width * 0.5 + (Math.random() - 0.5) * (width * 0.72);
      const spawnY = floor - 20 - Math.random() * 160 - (index % 15) * 6;
      return {
        id: `${startup.id}-${index}`,
        startup,
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2 + 1,
        angle: (Math.random() - 0.5) * 0.5,
        vAngle: (Math.random() - 0.5) * 0.04,
        size: 38,
        state: 'PILE',
        springProgress: 0,
        originX: spawnX,
        originY: spawnY,
        originAngle: 0,
      };
    });

    tilesRef.current = initialTiles;
  }, []);

  // Update target grid positions when matches change
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const tiles = tilesRef.current;
    if (tiles.length === 0) return;

    if (matchedIds.length === 0) {
      // Rapidly drop all active grid tiles back to pile with crisp downward thrust
      tiles.forEach(tile => {
        if (tile.state === 'GRID' || tile.state === 'FLYING_TO_GRID') {
          tile.state = 'DROPPING';
          tile.vx = (Math.random() - 0.5) * 10;
          tile.vy = Math.random() * 5 + 4; // Fast downward pop
          tile.vAngle = (Math.random() - 0.5) * 0.2;
        }
      });
      return;
    }

    // Pick unique startups for the grid display, preferring a tile that is
    // already docked (or flying in) for that id so refining a query doesn't
    // needlessly drop and re-fly tiles that still match.
    const matchedTiles: TileBody[] = [];
    const usedStartups = new Set<string>();

    matchedIds.forEach(id => {
      if (usedStartups.has(id)) return;
      const docked = tiles.find(t => t.startup.id === id && (t.state === 'GRID' || t.state === 'FLYING_TO_GRID'));
      const found = docked ?? tiles.find(t => t.startup.id === id && t.state !== 'GRID' && t.state !== 'FLYING_TO_GRID');
      if (found) {
        matchedTiles.push(found);
        usedStartups.add(id);
      }
    });

    // Grid geometry - responsive layout docked above the search bar
    const total = matchedTiles.length;

    matchedTiles.forEach((tile, idx) => {
      const { targetX, targetY } = computeGridSlot(idx, total, width, height);
      const wasDocked = tile.state === 'GRID' || tile.state === 'FLYING_TO_GRID';
      const targetMoved = tile.targetX !== targetX || tile.targetY !== targetY;

      tile.gridIndex = idx;

      // Already docked (or flying) in the right slot - leave it be, no churn.
      if (wasDocked && !targetMoved) return;

      // Either a fresh tile from the pile, or a docked tile whose slot moved
      // (e.g. grid relayout from result count change) - glide from where it is.
      tile.targetX = targetX;
      tile.targetY = targetY;
      tile.originX = tile.x;
      tile.originY = tile.y;
      tile.originAngle = tile.angle;
      tile.springProgress = 0;
      tile.state = 'FLYING_TO_GRID';
    });

    // Reset non-matched tiles that were previously in grid with energetic downward velocity
    tiles.forEach(tile => {
      if (!matchedTiles.includes(tile) && (tile.state === 'GRID' || tile.state === 'FLYING_TO_GRID')) {
        tile.state = 'DROPPING';
        tile.vx = (Math.random() - 0.5) * 10;
        tile.vy = Math.random() * 6 + 4;
        tile.vAngle = (Math.random() - 0.5) * 0.2;
      }
    });
  }, [matchedIds]);

  // Main Physics and Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    let justResized = true; // force an active frame after any resize
    const handleResize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      justResized = true;
      relayoutGridTiles(tilesRef.current);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // devicePixelRatio can change (e.g. dragging window between displays) without
    // firing a resize event; re-subscribe after each change since the query itself
    // stops matching once the ratio it names is no longer current.
    let dprMediaQuery: MediaQueryList | null = null;
    const watchDpr = () => {
      dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprMediaQuery.addEventListener('change', onDprChange);
    };
    function onDprChange() {
      dprMediaQuery?.removeEventListener('change', onDprChange);
      handleResize();
      watchDpr();
    }
    watchDpr();

    const floorY = () => window.innerHeight - 20;
    const leftWall = 30;
    const rightWall = () => window.innerWidth - 30;

    // Snappy physics constants (2.5x faster gravity & settling), tuned at 60fps
    const gravity = 1.05;
    const friction = 0.88;
    const bounce = 0.28;

    let lastTime = performance.now();
    let prevMouseX = mousePosRef.current.x;
    let prevMouseY = mousePosRef.current.y;
    let wasIdle = false;

    const render = (now: number) => {
      const dt = Math.min(3, Math.max(0, (now - lastTime) / (1000 / 60)));
      lastTime = now;

      const width = window.innerWidth;
      const height = window.innerHeight;

      const tiles = tilesRef.current;
      const floor = floorY();
      const rWall = rightWall();

      const mouseX = mousePosRef.current.x;
      const mouseY = mousePosRef.current.y;
      const mouseMoved = mouseX !== prevMouseX || mouseY !== prevMouseY;
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      const resized = justResized;
      justResized = false;

      // Settledness check: cheap pass, no sqrt/collision work
      let hasTransitional = false;
      let maxSpeed = 0;
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (t.state === 'FLYING_TO_GRID' || t.state === 'DROPPING') {
          hasTransitional = true;
        } else if (t.state === 'PILE') {
          const speed = Math.abs(t.vx) + Math.abs(t.vy);
          if (speed > maxSpeed) maxSpeed = speed;
        }
      }

      const idle = !hasTransitional && maxSpeed < 0.05 && !mouseMoved && !resized;

      let activeHover = hoveredTileRef.current;

      if (!idle) {
        activeHover = null;

        // 1. Update Physics
        for (let i = 0; i < tiles.length; i++) {
          const t = tiles[i];

          if (t.state === 'FLYING_TO_GRID') {
            // Snappy spring-like lift off (~180ms total animation with slight elastic overshoot)
            t.springProgress += 0.085 * dt;
            const p = Math.min(1, t.springProgress);

            // Elastic overshoot curve: snaps quickly and settles crisply into slot
            const c4 = (2 * Math.PI) / 3;
            const ease = p === 0 ? 0 : p === 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;

            t.x = t.originX + (t.targetX! - t.originX) * ease;
            t.y = t.originY + (t.targetY! - t.originY) * ease;
            t.angle = t.originAngle * (1 - p); // Snap upright

            if (p >= 1) {
              t.state = 'GRID';
              t.x = t.targetX!;
              t.y = t.targetY!;
              t.angle = 0;
              t.vx = 0;
              t.vy = 0;
            }
          } else if (t.state === 'GRID') {
            // Hover check
            const dist = Math.hypot(mousePosRef.current.x - t.x, mousePosRef.current.y - t.y);
            if (dist < t.size * 0.75) {
              activeHover = t;
            }
          } else {
            // PILE or DROPPING
            if (t.state === 'DROPPING' && t.y > height * 0.65) {
              t.state = 'PILE';
            }

            t.vy += gravity * dt;
            const decay = Math.pow(friction, dt);
            t.vx *= decay;
            t.vy *= decay;
            t.vAngle *= Math.pow(0.94, dt);

            t.x += t.vx * dt;
            t.y += t.vy * dt;
            t.angle += t.vAngle * dt;

            // Floor collision
            const half = t.size / 2;
            if (t.y + half > floor) {
              t.y = floor - half;
              t.vy = -t.vy * bounce;
              t.vx *= 0.82;
              t.vAngle *= 0.8;
            }

            // Wall collisions
            if (t.x - half < leftWall) {
              t.x = leftWall + half;
              t.vx = -t.vx * bounce;
            } else if (t.x + half > rWall) {
              t.x = rWall - half;
              t.vx = -t.vx * bounce;
            }

            // Mouse energetic repulsion
            const mDist = Math.hypot(t.x - mousePosRef.current.x, t.y - mousePosRef.current.y);
            if (mDist < 85 && mDist > 0) {
              const force = (85 - mDist) / 85;
              const nx = (t.x - mousePosRef.current.x) / mDist;
              const ny = (t.y - mousePosRef.current.y) / mDist;
              t.vx += nx * force * 5.5 * dt;
              t.vy += ny * force * 5.5 * dt;
            }
          }
        }

        // Inter-tile pile collisions (optimized for high FPS with fast resolution)
        for (let i = 0; i < tiles.length; i++) {
          const a = tiles[i];
          if (a.state === 'GRID' || a.state === 'FLYING_TO_GRID') continue;

          for (let j = i + 1; j < Math.min(i + 14, tiles.length); j++) {
            const b = tiles[j];
            if (b.state === 'GRID' || b.state === 'FLYING_TO_GRID') continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const minDist = (a.size + b.size) * 0.45;

            if (dist < minDist && dist > 0.001) {
              const overlap = (minDist - dist) * 0.5;
              const nx = dx / dist;
              const ny = dy / dist;

              a.x -= nx * overlap * 0.7;
              a.y -= ny * overlap * 0.7;
              b.x += nx * overlap * 0.7;
              b.y += ny * overlap * 0.7;

              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const impulse = velAlongNormal * 0.3;
                a.vx += nx * impulse;
                a.vy += ny * impulse;
                b.vx -= nx * impulse;
                b.vy -= ny * impulse;
              }
            }
          }
        }

        // Handle Hover state notification
        if (activeHover !== hoveredTileRef.current) {
          hoveredTileRef.current = activeHover;
          if (activeHover) {
            onHoverStartupRef.current(activeHover.startup, {
              x: activeHover.x - activeHover.size / 2,
              y: activeHover.y - activeHover.size / 2,
              width: activeHover.size,
              height: activeHover.size,
            });
          } else {
            onHoverStartupRef.current(null, null);
          }
        }
      }

      // Skip redraw entirely once settled and nothing changed since the last drawn frame
      if (idle && wasIdle) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }
      wasIdle = idle;

      ctx.clearRect(0, 0, width, height);

      // 2. Draw Tiles
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        const isHovered = t === activeHover;
        const currentSize = isHovered ? t.size * 1.15 : t.size;
        const r = 9;
        const half = currentSize / 2;

        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);

        // Shadow / Glow: real blurred shadow only for GRID/hovered tiles
        if (t.state === 'GRID' || isHovered) {
          ctx.shadowColor = isHovered ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = isHovered ? 18 : 9;
          ctx.shadowOffsetY = 4;
        } else {
          // Cheap fake shadow for pile/dropping tiles: offset flat fill, no blur
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.roundRect(-half, -half + 2, currentSize, currentSize, r);
          ctx.fill();
        }

        // Rounded Rect Tile Background
        ctx.fillStyle = t.startup.bgColor || '#18181b';
        ctx.beginPath();
        ctx.roundRect(-half, -half, currentSize, currentSize, r);
        ctx.fill();

        // Subtle border
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.strokeStyle = isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.16)';
        ctx.stroke();

        // Logo Glyphs / Iconography
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = t.startup.textColor || '#FFFFFF';
        ctx.font = `${Math.floor(currentSize * 0.44)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.startup.symbolGlyph, 0, 1);

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      dprMediaQuery?.removeEventListener('change', onDprChange);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseLeave = () => {
    mousePosRef.current = { x: -1000, y: -1000 };
  };

  const handleClick = () => {
    if (hoveredTileRef.current && onSelectStartupRef.current) {
      onSelectStartupRef.current(hoveredTileRef.current.startup);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="absolute inset-0 z-0 cursor-default"
    />
  );
};
