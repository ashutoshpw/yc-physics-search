export interface CanvasThemePalette {
  border: string;
  borderHover: string;
  hoverGlow: string;
  tileShadow: string;
  pileShadow: string;
  tileFallback: string;
  textFallback: string;
}

export const CANVAS_THEME: Record<'light' | 'dark', CanvasThemePalette> = {
  dark: {
    border: 'rgba(255, 255, 255, 0.16)',
    borderHover: '#FFFFFF',
    hoverGlow: 'rgba(255, 255, 255, 0.5)',
    tileShadow: 'rgba(0, 0, 0, 0.6)',
    pileShadow: 'rgba(0, 0, 0, 0.28)',
    tileFallback: '#18181b',
    textFallback: '#FFFFFF',
  },
  light: {
    border: 'rgba(0, 0, 0, 0.14)',
    borderHover: '#09090b',
    hoverGlow: 'rgba(0, 0, 0, 0.25)',
    tileShadow: 'rgba(0, 0, 0, 0.18)',
    pileShadow: 'rgba(0, 0, 0, 0.1)',
    tileFallback: '#e4e4e7',
    textFallback: '#09090b',
  },
};
