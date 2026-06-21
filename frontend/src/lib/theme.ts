// "Bula" visual tokens + shared style builders, ported from the imported design.
// The prototype used inline style strings; here they are React CSSProperties so
// the dynamic theming (selected states, accent fills) stays in one place.

import type { CSSProperties } from 'react';

export const theme = {
  font: "'Baloo 2', system-ui, sans-serif",
  ink: '#21302a',
  sub: '#5d6e64',
  accent: '#2f7d52',
  chipBg: '#ffffff',
  chipBorder: '2px solid #dde6dc',
  chipInk: '#21302a',
  radius: '30px',
  track: '#dfe9df',
} as const;

export const HERO_EMOJI = '🐤';
export const PERSONA_EMOJI = '🐤';

/** Primary pill — welcome CTA and restart button. */
export const ctaStyle: CSSProperties = {
  fontFamily: theme.font,
  fontWeight: 800,
  fontSize: 21,
  padding: '18px 40px',
  borderRadius: 999,
  background: theme.accent,
  color: '#fff',
  boxShadow: '0 8px 22px rgba(0,0,0,0.20)',
};

/** A scored option "bubble" (single or multi select). */
export function bubbleStyle(selected: boolean, safe?: boolean): CSSProperties {
  const base: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '16px 18px',
    minHeight: 62,
    fontFamily: theme.font,
    fontSize: 18,
    fontWeight: 700,
    borderRadius: theme.radius,
    transition: 'all .18s ease',
    textAlign: 'left',
    lineHeight: 1.25,
  };
  if (selected) {
    const bg = safe ? '#3f9d5a' : theme.accent;
    return {
      ...base,
      background: bg,
      color: '#fff',
      border: `2px solid ${bg}`,
      boxShadow: '0 6px 16px rgba(0,0,0,0.16)',
      transform: 'translateY(-1px)',
    };
  }
  return {
    ...base,
    background: theme.chipBg,
    color: theme.chipInk,
    border: theme.chipBorder,
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
  };
}

/** Large tone pill on the welcome screen. */
export function toneOptionStyle(active: boolean): CSSProperties {
  return {
    fontFamily: theme.font,
    fontSize: 15,
    fontWeight: 700,
    padding: '10px 18px',
    borderRadius: 999,
    ...(active
      ? { background: theme.accent, color: '#fff', border: `2px solid ${theme.accent}` }
      : { background: '#fff', color: theme.ink, border: theme.chipBorder }),
  };
}

/** Compact tone chip in the flow header. */
export function toneChipStyle(active: boolean): CSSProperties {
  return {
    minWidth: 34,
    height: 34,
    padding: '0 10px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(active
      ? { background: theme.accent, color: '#fff', border: `2px solid ${theme.accent}` }
      : { background: 'rgba(255,255,255,0.8)', color: theme.ink, border: theme.chipBorder }),
  };
}

export const backBtnStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  fontSize: 26,
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff',
  color: theme.ink,
  border: theme.chipBorder,
  flex: 'none',
};

/** The meter track + its colored fill. `pct` 0–100, `color` from meterColor(). */
export function trackStyle(): CSSProperties {
  return {
    position: 'relative',
    width: '100%',
    height: 16,
    borderRadius: 999,
    overflow: 'hidden',
    background: theme.track,
  };
}

export function fillStyle(pct: number, color: string): CSSProperties {
  return {
    height: '100%',
    width: `${pct}%`,
    borderRadius: 999,
    background: color,
    transition: 'width .45s cubic-bezier(.3,1.2,.4,1), background .45s ease',
  };
}
