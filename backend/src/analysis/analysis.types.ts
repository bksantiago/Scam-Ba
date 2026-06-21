export type Verdict = 'safe' | 'caution' | 'scam';

export interface DetectedSignal {
  label: string;
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

/** The contract returned by POST /api/analyze (mirrored in frontend/src/types.ts). */
export interface AnalyzeResult {
  scamProbability: number;
  verdict: Verdict;
  headline: string;
  reasoning: string;
  detectedSignals: DetectedSignal[];
  citedStories: CitedStory[];
  advice: string[];
  engine: string;
}

export interface AnalyzeInput {
  role: 'buying' | 'selling';
  description: string;
  signals?: string[];
  history?: { question: string; answer: string }[];
}
