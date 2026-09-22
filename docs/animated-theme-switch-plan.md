# Animated Light/Dark Theme Switching — Task Plan

**Author:** Ashutosh
**Date:** 2026-09-23
**Status:** Draft

---

## 1. Problem

`yc-physics-search` is hardcoded to a dark theme: `<html className="dark">` in the layout, `bg-[#09090b]` / `text-neutral-100` on the page shell, and 80+ hardcoded neutral/hex color classes across `page.tsx`, `SearchBar`, `StartupModal`, and `StartupTooltip`. The physics canvas in `PhysicsPile.tsx` bakes dark-only colors into its render loop (`rgba(255,255,255,0.16)` borders, white hover glow, black drop shadows).

There is no way to switch to a light theme, and the existing `:root` / `prefers-color-scheme` CSS variables in `globals.css` are unused. Users on light-mode systems get a dark app with no choice, and the app has no accessible theme control.

## 2. Goal

Add an animated light/dark theme toggle that reveals the new theme with a diagonal polygon wipe (via the View Transitions API), with light mode fully covering the DOM chrome and the physics canvas.

Success metrics:

- Toggle switches every themed surface (header, search bar, modal, tooltip, footer, canvas) with a single click.
- Animation runs on Chromium 111+, Firefox 103+, Safari 16.4+; unsupported browsers and `prefers-reduced-motion` users get an instant, correct toggle.
- No flash of incorrect theme (FOUC) on hard reload in either theme.
- First visit follows the OS `prefers-color-scheme`; explicit user choice persists across reloads via `localStorage`.
- `pnpm lint`, `pnpm build`, and the react-doctor score (currently 52/100) do not regress.
- Text meets WCAG AA contrast in both themes; toggle is keyboard-operable and labeled.

## 3. User Personas

| Persona | Need |
|---|---|
| Visitor on a light-mode OS | App should open light by default; dark stays one click away. |
| Dark-mode power user | Keeps today's exact dark look; choice persists across sessions. |
| Accessibility / reduced-motion user | Toggle still works instantly, no motion, no lost state. |
| Mobile user | Toggle reachable in the header; animation covers full viewport. |

## 4. Scope

### In scope (v1)

- `react-theme-switch-animation@1.3.0` as the animation engine (`ThemeAnimationType.POLYGON`).
- Theme state: follow system by default, explicit choice persisted in `localStorage` (key: `theme-preference`; the library's own `theme` key is ignored to keep system-following intact until the user chooses).
- Pre-paint inline script in the layout to apply the resolved theme class before first paint.
- `ThemeProvider` (client) exposing resolved theme to React code, including the canvas.
- `ThemeToggle` button in the top-right header (where the removed attribution used to be).
- Tailwind v3 `darkMode: "class"` + semantic color tokens (CSS variables) replacing hardcoded neutrals.
- Canvas theming: theme-aware palette for borders, shadows, hover glow, text/fallback colors, redrawn synchronously on toggle.
- Light mode QA for all components and the canvas.

### Out of scope (v1)

- A three-way theme selector UI (system / light / dark). v1 follows system by default and stores explicit choices on toggle; an explicit "system" option is a follow-up.
- Cross-tab synchronization via `storage` events.
- Per-component themes, custom GIF/polygon-gradient animation types.
- Fixing unrelated react-doctor findings in `PhysicsPile.tsx` (effect cleanup, `Set` lookup, giant component) — tracked separately.
- Redesigning the brand palette or startup tile colors (`startups.ts` colors stay as-is).

## 5. Core Features

### 5.1 Animated toggle (polygon wipe)

**What it does:** Clicking the header toggle runs a diagonal wipe — toward dark the new theme grows as a triangle from the top-left corner; back to light it grows from the bottom-right — then the theme is fully swapped.

**How it works:** `useModeAnimation` wraps `document.startViewTransition()`, injects a stylesheet that masks `::view-transition-new(root)` with an SVG triangle animated from `mask-size: 0` to `200vmax`, and toggles the `dark` class on `<html>` inside `flushSync` so the "new" snapshot is captured in the target theme. It removes the injected style after the animation and falls back to an instant toggle when the API or motion preferences disallow animation.

**Configuration (planned):**

| Option | Value | Why |
|---|---|---|
| `animationType` | `ThemeAnimationType.POLYGON` | Selected look: diagonal wipe. |
| `duration` | `750` (default) | Library default; tune after visual QA. |
| `globalClassName` | `"dark"` (default) | Matches Tailwind class strategy. |
| `isDarkMode` / `onDarkModeChange` | Controlled by `ThemeProvider` | Single source of truth for canvas + UI. |

**Edge cases:**

- Double-click during animation: library removes the previous style and catches aborted transitions.
- `prefers-reduced-motion: reduce`: instant toggle (library handles).
- API unsupported: instant toggle (library handles); theme still applies.
- The polygon animation does not originate from the button position (unlike circle/blur) — it always wipes from the corners; button `ref` is still attached as the hook requires it.

### 5.2 Theme state + no-flash boot

**What it does:** First visit resolves theme from `prefers-color-scheme`; after an explicit toggle the choice persists. No wrong-theme flash on reload.

**How it works:**

1. Inline script in `layout.tsx` runs before paint:

```tsx
// layout.tsx (server component)
<html lang="en" suppressHydrationWarning>
  <body>
    <Script id="theme-init" strategy="beforeInteractive">
      {`(function(){try{var t=localStorage.getItem('theme-preference');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`}
    </Script>
    <ThemeProvider>{children}</ThemeProvider>
  </body>
</html>
```

2. `ThemeProvider` (client, `src/components/theme-provider.tsx`) reads the class the script set and exposes `{ resolvedTheme, setTheme }` via `useSyncExternalStore` so SSR/hydration stay consistent and post-hydration reads are correct.
3. `useModeAnimation` is driven in controlled mode (`isDarkMode` + `onDarkModeChange` from the provider), so the provider — not the library — owns persistence and system-preference tracking.

**Edge cases:**

- System preference changes while the user has never toggled: provider follows `matchMedia('(prefers-color-scheme: dark)')`.
- System preference changes after an explicit choice: explicit choice wins.
- `localStorage` unavailable (private mode): wrap in `try/catch`, fall back to in-memory + system.

### 5.3 Semantic color tokens (DOM)

**What it does:** Replaces hardcoded dark neutrals with tokens that flip with the `.dark` class.

**How it works:**

- `tailwind.config.ts`: set `darkMode: "class"` and map semantic colors to CSS variables.
- `globals.css`: define light values on `:root` and dark values under `.dark` (replacing the unused `prefers-color-scheme` block), plus `color-scheme` per theme.
- Components keep brand colors (`#ff6600` YC accent, `startup.bgColor` / `textColor`) and swap neutrals for tokens.

Proposed token mapping (values tuned during QA):

| Token | Light | Dark (current look) | Replaces |
|---|---|---|---|
| `--background` | `#fafafa` | `#09090b` | `bg-[#09090b]` |
| `--foreground` | `#18181b` | `#fafafa` | `text-neutral-100` |
| `--surface` | `#ffffff` | `#18181b` | `bg-neutral-900` |
| `--surface-raised` | `rgba(255,255,255,0.95)` | `rgba(24,24,27,0.95)` | `bg-neutral-900/95` |
| `--surface-hover` | `#f4f4f5` | `#27272a` | `hover:bg-neutral-800` |
| `--border` | `#e4e4e7` | `#3f3f46` | `border-neutral-700` |
| `--border-subtle` | `#f4f4f5` | `#27272a` | `border-neutral-800` |
| `--text-secondary` | `#52525b` | `#a3a3a3` | `text-neutral-300/400` |
| `--text-muted` | `#a1a1aa` | `#737373` | `text-neutral-500/600` |

### 5.4 Canvas theming + synchronous redraw

**What it does:** The physics pile redraws with light-appropriate borders, shadows, and hover glow, and the new look is present in the View Transition snapshot.

**How it works:**

- New `src/lib/canvas-theme.ts`:

```ts
export const CANVAS_THEME = {
  dark:  { border: 'rgba(255,255,255,0.16)', borderHover: '#FFFFFF',
           glow: 'rgba(255,255,255,0.5)', shadow: 'rgba(0,0,0,0.6)',
           overlay: 'rgba(0,0,0,0.28)', tileFallback: '#18181b', textFallback: '#FFFFFF' },
  light: { border: 'rgba(0,0,0,0.12)', borderHover: '#09090b',
           glow: 'rgba(0,0,0,0.25)', shadow: 'rgba(0,0,0,0.18)',
           overlay: 'rgba(0,0,0,0.08)', tileFallback: '#e4e4e7', textFallback: '#09090b' },
} as const;
```

- `PhysicsPile.tsx` reads the palette from a ref that is updated in a `useLayoutEffect` keyed on the resolved theme, and calls the existing render function once immediately (not waiting for the rAF loop) so canvas pixels are updated before the View Transition snapshots the "new" state.
- Lines using hardcoded colors today: `444`, `452`, `459`, `466`, `472`.

**Edge cases:**

- Toggle mid-hover: glow color follows the new palette on the forced redraw.
- Resize/DPR handling is untouched; the theme ref is orthogonal to the physics state.
- Canvas stays transparent (`clearRect` only); the page background token shows through, so no separate canvas background fill is needed.

## 6. Architecture

```
ThemeToggle (header, client)
  └─ useModeAnimation (react-theme-switch-animation)
       ├─ injects polygon mask stylesheet (::view-transition-new(root))
       ├─ document.startViewTransition(() => {
       │     flushSync(() => ThemeProvider.setTheme(next))      // React state
       │     document.documentElement.classList.toggle('dark')  // library
       │  })
       └─ removes stylesheet after duration

ThemeProvider.setTheme
  ├─ writes localStorage.theme
  ├─ PhysicsPile useLayoutEffect → themeRef = CANVAS_THEME[theme]; renderOnce()
  └─ .dark class flip → CSS variable tokens re-theme all DOM components

Boot (layout.tsx inline script, pre-paint)
  └─ resolves localStorage → classList + color-scheme before hydration
```

Key decisions and tradeoffs:

- **Use the npm package (chosen) over vendoring:** fast, MIT, React 19-compatible, handles Safari mask quirks and reduced-motion. Tradeoff: polygon wipe is corner-anchored and not customizable beyond duration/easing; canvas sync must be solved on our side.
- **`useSyncExternalStore` for theme state:** avoids hydration mismatches caused by the pre-paint script and gives a sync read for the canvas.
- **CSS-variable tokens over `dark:` pairs:** one variable flip themes 80+ usages without doubling class lists; canvas can reuse the same conceptual palette.
- **Synchronous canvas redraw via layout effect:** layout effects run inside `flushSync`, so the canvas is correct before the View Transition captures the new snapshot; relying on the rAF loop would race the snapshot.

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Canvas redraw races the View Transition snapshot (old-theme canvas revealed in the new layer, then snapping) | Visible glitch on every toggle | Force a synchronous render in a `useLayoutEffect` on theme change; verify by pausing mid-animation in DevTools and in a real browser during QA |
| Tailwind v3 class strategy differs from the library's Tailwind v4 example | `dark:` / token switching silently fails | Set `darkMode: "class"` explicitly; verify `.dark` class flip and computed styles in QA |
| Hydration mismatch on the toggle icon / theme state | Console errors, flicker | `suppressHydrationWarning` on `<html>`; `useSyncExternalStore` with server snapshot; render icon from resolved theme only after hydration or with CSS-driven visibility |
| Token migration touches 80+ class usages across 4 components | Visual regressions in dark mode | Migrate file-by-file against the existing dark palette values; screenshot-compare dark mode before/after; run react-doctor `--scope changed` |
| Library writes `localStorage.theme` in its own effect as well as the provider | Duplicate writes, possible drift | Provider remains the single source of truth; the library's write uses the same key/value (harmless) — confirm after integration |
| View Transitions + Next 16 (React 19.2) coexist with future `ViewTransition` usage | Style conflicts | The library scopes its rules to `::view-transition-*(root)` and cleans up after each run; no app code uses Next view transitions today |
| Light-mode contrast (muted text, borders, canvas tiles) fails WCAG AA | Accessibility regression | Token values chosen for AA; verify with contrast checks in QA for `--text-secondary` / `--text-muted` on `--background` / `--surface` |
| `prefers-reduced-motion` users get motion anyway via a custom path | Accessibility regression | Library short-circuits to instant toggle; do not add our own animation path |

## 8. Open Questions

1. Toggle icon: reuse the reference repo's sun/moon SVGs, or design a YC/orange-accent icon to match the header?
2. Hover glow in light mode: switch to a dark glow (proposed) or keep a subtle white glow for consistency with dark mode?
3. Should the provider listen to cross-tab `storage` events in v1, or defer to a follow-up?
4. Should an explicit three-way selector (system/light/dark) be added later, and does that change how v1 stores choices?
5. Is `750ms` the right polygon duration for this app, or should it be faster given the busy canvas?

## 9. References

- Reference implementation: https://github.com/MinhOmega/react-theme-switch-animation (cloned and studied; `src/index.ts` — `useModeAnimation`, polygon mask + `startViewTransition` + `flushSync`)
- npm package: https://www.npmjs.com/package/react-theme-switch-animation (v1.3.0)
- View Transitions API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- Tailwind v3 dark mode (class strategy): https://v3.tailwindcss.com/docs/dark-mode
- Local files affected: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tailwind.config.ts`, `src/components/{PhysicsPile,SearchBar,StartupModal,StartupTooltip}.tsx`

## 10. Next Steps

- [ ] `pnpm add react-theme-switch-animation`
- [ ] Add `darkMode: "class"` and semantic color tokens to `tailwind.config.ts`
- [ ] Replace `globals.css` theme variables with light (`:root`) + dark (`.dark`) token sets and `color-scheme`
- [ ] Add the pre-paint inline script and `suppressHydrationWarning` to `layout.tsx`; remove the hardcoded `className="dark"`
- [ ] Create `ThemeProvider` and `ThemeToggle`; place the toggle in the header (`page.tsx` top-right)
- [ ] Migrate `page.tsx`, `SearchBar`, `StartupModal`, `StartupTooltip` from hardcoded neutrals to tokens
- [ ] Add `src/lib/canvas-theme.ts` and wire theme-aware colors + synchronous redraw into `PhysicsPile.tsx`
- [ ] Verify: `pnpm lint`, `pnpm build`, `npx react-doctor@latest --scope changed`
- [ ] Browser QA: light/dark toggle animation, hard-reload FOUC, system-default first visit, reduced-motion fallback, mid-animation snapshot check, mobile viewport, contrast spot checks
