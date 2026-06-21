// Deterministic client-side scoring — ported from the imported design prototype.
// Drives the live meter, the green→amber→red screen tint, and the offline
// verdict. When the backend is reachable, App overrides the score with
// /api/analyze (see lib/backend.ts); the reasons below stay client-side so they
// remain in the user's chosen tone.

import { COPY, STEPS, tr, type Tone, type VerdictBand } from './content';

/** Single steps store the chosen key; multi steps store a set of toggled keys. */
export type Picks = Record<string, string | Record<string, boolean>>;
export type Customs = Record<string, string[]>;

export interface ScoreResult {
  /** 0–100 scam likelihood. */
  pct: number;
  /** Whether the user has toggled any scored signal yet. */
  any: boolean;
}

export interface VerdictReason {
  icon: string;
  text: string;
  risk: number;
}

export interface VerdictView {
  emoji: string;
  title: string;
  line: string;
  reasonsTitle: string;
  reasons: VerdictReason[];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function asSet(pick: Picks[string] | undefined): Record<string, boolean> {
  return pick && typeof pick === 'object' ? pick : {};
}

/** Sum signal weights across the multi-select steps. */
export function computeScore(picks: Picks): ScoreResult {
  let net = 0;
  let any = false;
  for (const s of STEPS) {
    if (s.type !== 'multi') continue;
    const sel = asSet(picks[s.id]);
    for (const o of s.opts) {
      if (sel[o.k]) {
        net += o.w || 0;
        any = true;
      }
    }
  }
  const pct = clamp(Math.round(50 + net * 6), 3, 99);
  return { pct, any };
}

// ── Color + tint helpers ───────────────────────────────────────────────────

type RGB = [number, number, number];

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function mix3(stops: [RGB, RGB, RGB], pct: number): string {
  const t = pct / 100;
  let lo: RGB;
  let hi: RGB;
  let f: number;
  if (t <= 0.5) {
    lo = stops[0];
    hi = stops[1];
    f = t / 0.5;
  } else {
    lo = stops[1];
    hi = stops[2];
    f = (t - 0.5) / 0.5;
  }
  return `rgb(${lerp(lo[0], hi[0], f)},${lerp(lo[1], hi[1], f)},${lerp(lo[2], hi[2], f)})`;
}

/** Full-screen background tint. Stronger green/red once the verdict is in. */
export function getTint(pct: number, any: boolean, done: boolean): string {
  const stops: [RGB, RGB, RGB] = done
    ? [[166, 216, 172], [243, 238, 213], [235, 150, 135]]
    : [[200, 226, 202], [244, 241, 230], [238, 196, 182]];
  if (!any && !done) return '#f1eee6';
  return mix3(stops, pct);
}

export function meterColor(pct: number): string {
  if (pct < 35) return '#3f9d5a';
  if (pct <= 65) return '#e0a32a';
  return '#d2452f';
}

export function faceFor(pct: number, any: boolean): string {
  if (!any) return '🤔';
  if (pct < 30) return '😎';
  if (pct < 50) return '🙂';
  if (pct <= 70) return '🤨';
  return '😱';
}

type BandKey = 'none' | 'safe' | 'warn' | 'scam';

export function bandKey(pct: number, any: boolean): BandKey {
  if (!any) return 'none';
  if (pct < 35) return 'safe';
  if (pct <= 65) return 'warn';
  return 'scam';
}

/** Verdict band used by the final screen (no "none" — a verdict always lands). */
export function bandFromPct(pct: number): VerdictBand {
  if (pct < 35) return 'green';
  if (pct <= 65) return 'amber';
  return 'red';
}

/** The localized band caption shown next to the live meter. */
export function bandLabel(pct: number, any: boolean, tone: Tone): string {
  return tr(COPY.band[bandKey(pct, any)], tone);
}

const BAND_EMOJI: Record<VerdictBand, string> = {
  green: '🟢',
  amber: '🟡',
  red: '🔴',
};

/** Build the verdict view: localized copy for the band + reasons from picks. */
export function buildVerdict(picks: Picks, band: VerdictBand, tone: Tone): VerdictView {
  const g = COPY.verdict[band];
  const reasons: VerdictReason[] = [];
  for (const s of STEPS) {
    if (s.type !== 'multi') continue;
    const sel = asSet(picks[s.id]);
    for (const o of s.opts) {
      if (!sel[o.k]) continue;
      if ((o.w || 0) > 0) reasons.push({ icon: '🚩', text: tr(o.label, tone), risk: 1 });
      else if (o.safe) reasons.push({ icon: '✅', text: tr(o.label, tone), risk: 0 });
    }
  }
  reasons.sort((a, b) => b.risk - a.risk);
  return {
    emoji: BAND_EMOJI[band],
    title: tr(g.title, tone),
    line: tr(g.line, tone),
    reasonsTitle: tr(g.reasonsTitle, tone),
    reasons: reasons.slice(0, 6),
  };
}
