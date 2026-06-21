// Mirrors the backend contract (backend/src/analysis/dto). Kept in sync by hand
// for now; a shared package is a natural later step (see CLAUDE.md).

export type Role = 'buying' | 'selling';
export type Verdict = 'safe' | 'caution' | 'scam';

export interface AnalyzeRequest {
  role: Role;
  description: string;
  signals?: string[];
  /** Prior follow-up turns, for conversational refinement. */
  history?: { question: string; answer: string }[];
}

export interface DetectedSignal {
  label: string;
  /** Which knowledge-base pattern surfaced this signal. */
  source: string;
  weight: number;
}

export interface CitedStory {
  id: string;
  title: string;
  category: string;
  narrative: string;
  severity: number;
}

export interface AnalyzeResult {
  /** 0–100. */
  scamProbability: number;
  verdict: Verdict;
  headline: string;
  reasoning: string;
  detectedSignals: DetectedSignal[];
  citedStories: CitedStory[];
  advice: string[];
  /** "heuristic" until the Claude analyzer is enabled. */
  engine: string;
}
