import type { AnalyzeRequest, AnalyzeResult } from './types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function analyze(req: AnalyzeRequest): Promise<AnalyzeResult> {
  const res = await fetch(`${BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Analysis failed (${res.status}). ${detail}`.trim());
  }
  return res.json() as Promise<AnalyzeResult>;
}
