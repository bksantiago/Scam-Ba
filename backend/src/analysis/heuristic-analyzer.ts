import type { ScamStory } from '../knowledge/scam-story.types';
import type {
  AnalyzeInput,
  AnalyzeResult,
  CitedStory,
  DetectedSignal,
  Verdict,
} from './analysis.types';
import { overlapScore, phraseMatches, tokenSet } from './text.util';

export const CAUTION_THRESHOLD = 30;
export const SCAM_THRESHOLD = 66;

// High-signal free-text tokens that may not surface as a matched red-flag
// phrase but should still raise suspicion. Token form = post-tokenize().
const CRITICAL_TOKENS: Record<string, number> = {
  gift: 10,
  crypto: 10,
  bitcoin: 10,
  wire: 10,
  escrow: 9,
  overpaid: 12,
  overpay: 12,
  screenshot: 8,
  whatsapp: 8,
  telegram: 8,
  code: 9,
  verification: 10,
  deposit: 7,
  urgent: 7,
  pending: 6,
  zelle: 8,
};

/**
 * Deterministic, offline scam scorer. The default analyzer; also the fallback
 * when no ANTHROPIC_API_KEY is set. `candidates` should be the role-relevant
 * slice of the knowledge base.
 */
export function heuristicAnalyze(
  input: AnalyzeInput,
  candidates: ScamStory[],
): AnalyzeResult {
  const haystack = tokenSet(
    [input.description, ...(input.signals ?? [])].join(' '),
  );

  // Per-story matched red flags.
  const perStory = candidates.map((story) => {
    const matched = story.redFlags.filter((f) => phraseMatches(f, haystack));
    return {
      story,
      matched,
      overlap: overlapScore(haystack, tokenSet(searchableText(story))),
    };
  });

  // Dedup matched flags into signals (keep strongest).
  const byLabel = new Map<string, DetectedSignal>();
  for (const { story, matched } of perStory) {
    const weight = clamp(Math.round(story.severity * 4), 8, 20);
    for (const flag of matched) {
      const key = flag.toLowerCase().trim();
      const existing = byLabel.get(key);
      if (!existing || weight > existing.weight) {
        byLabel.set(key, { label: flag, source: story.title, weight });
      }
    }
  }
  const detectedSignals = [...byLabel.values()].sort(
    (a, b) => b.weight - a.weight,
  );

  // Score: diminishing-returns sum of signal weights + critical-token floor.
  let score = 6;
  detectedSignals.forEach((s, i) => {
    score += s.weight * Math.pow(0.82, i);
  });
  let lexicon = 0;
  for (const [token, w] of Object.entries(CRITICAL_TOKENS)) {
    if (haystack.has(token)) lexicon += w;
  }
  score += Math.min(lexicon, 30);
  const scamProbability = clamp(Math.round(score), 3, 97);
  const verdict = verdictFor(scamProbability);

  // Citations: matched stories first, then by overlap, then severity.
  const matchedCounts = new Map(
    perStory.map((p) => [p.story.id, p.matched.length]),
  );
  const citedStories: CitedStory[] = [...perStory]
    .sort(
      (a, b) =>
        b.matched.length - a.matched.length ||
        b.overlap - a.overlap ||
        b.story.severity - a.story.severity,
    )
    .slice(0, 3)
    .map(({ story }) => ({
      id: story.id,
      title: story.title,
      category: story.category,
      narrative: story.narrative,
      severity: story.severity,
    }));

  const topCategory =
    detectedSignals.length > 0
      ? prettyCategory(
          findStoryByTitle(candidates, detectedSignals[0].source)?.category,
        )
      : undefined;

  return {
    scamProbability,
    verdict,
    headline: headlineFor(verdict, topCategory),
    reasoning: reasoningFor(verdict, detectedSignals.length, topCategory, input.role),
    detectedSignals,
    citedStories,
    advice: adviceFor(perStory, matchedCounts, input.role),
    engine: 'heuristic',
  };
}

// ── helpers ────────────────────────────────────────────────────────────────

function searchableText(s: ScamStory): string {
  return [s.title, s.narrative, s.category, ...s.redFlags, ...s.tags].join(' ');
}

function verdictFor(p: number): Verdict {
  if (p >= SCAM_THRESHOLD) return 'scam';
  if (p >= CAUTION_THRESHOLD) return 'caution';
  return 'safe';
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function prettyCategory(cat?: string): string | undefined {
  return cat?.replace(/-/g, ' ');
}

function findStoryByTitle(stories: ScamStory[], title: string) {
  return stories.find((s) => s.title === title);
}

function headlineFor(verdict: Verdict, topCategory?: string): string {
  const c = topCategory ?? 'scam';
  switch (verdict) {
    case 'scam':
      return `This has the hallmarks of a known ${c} scam.`;
    case 'caution':
      return `Some details match common ${c} scams — proceed carefully.`;
    case 'safe':
      return `Nothing here strongly matches a known scam pattern, but stay alert.`;
  }
}

function reasoningFor(
  verdict: Verdict,
  matchedCount: number,
  topCategory: string | undefined,
  role: string,
): string {
  if (matchedCount === 0) {
    return `I didn't find specific red flags in what you described, which is reassuring. Scams evolve, though — the examples below are the ones most relevant to ${role} right now.`;
  }
  const plural = matchedCount === 1 ? 'red flag' : 'red flags';
  const cat = topCategory ? `, most notably around ${topCategory}` : '';
  const tail =
    verdict === 'scam'
      ? 'Together these strongly resemble documented scams — treat this as high risk.'
      : 'These warrant caution; confirm each before sending money or the item.';
  return `I matched ${matchedCount} ${plural} against real scam reports${cat}. ${tail}`;
}

function adviceFor(
  perStory: { story: ScamStory; matched: string[] }[],
  matchedCounts: Map<string, number>,
  role: string,
): string[] {
  const matchedAdvice = perStory
    .filter((p) => (matchedCounts.get(p.story.id) ?? 0) > 0)
    .sort((a, b) => b.story.severity - a.story.severity)
    .map((p) => p.story.saferAlternative);

  const general =
    role === 'buying'
      ? 'Pay with a method that has buyer protection and keep all communication on-platform.'
      : 'Only ship or hand over the item once funds have irreversibly settled in your own account.';

  const tips = [...new Set(matchedAdvice)].slice(0, 3);
  if (tips.length === 0) {
    return [
      general,
      'Never share verification codes, and refuse gift card, wire, or crypto payments.',
      "If the deal suddenly feels urgent, slow down — pressure is the scammer's main tool.",
    ];
  }
  return [...tips, general];
}
