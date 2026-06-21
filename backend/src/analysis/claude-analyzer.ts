import Anthropic from '@anthropic-ai/sdk';
import type { ScamStory } from '../knowledge/scam-story.types';
import type { AnalyzeInput, AnalyzeResult, Verdict } from './analysis.types';
import { CAUTION_THRESHOLD, SCAM_THRESHOLD } from './heuristic-analyzer';

// Structured-output schema (json_schema). Note: no min/max number constraints —
// those aren't supported by structured outputs, so we clamp after parsing.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    scamProbability: { type: 'integer' },
    verdict: { type: 'string', enum: ['safe', 'caution', 'scam'] },
    headline: { type: 'string' },
    reasoning: { type: 'string' },
    detectedSignals: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          label: { type: 'string' },
          source: { type: 'string' },
        },
        required: ['label', 'source'],
      },
    },
    advice: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'scamProbability',
    'verdict',
    'headline',
    'reasoning',
    'detectedSignals',
    'advice',
  ],
} as const;

/**
 * Claude-powered analyzer. Active only when ANTHROPIC_API_KEY is set; otherwise
 * the service uses the offline heuristic. `stories` are the RAG-retrieved
 * knowledge-base entries grounding the analysis.
 */
export class ClaudeAnalyzer {
  private readonly client: Anthropic;

  constructor(
    private readonly model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8',
  ) {
    this.client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  }

  async analyze(
    input: AnalyzeInput,
    stories: ScamStory[],
  ): Promise<AnalyzeResult> {
    const context = stories
      .map(
        (s, i) =>
          `[${i + 1}] (${s.category}, severity ${s.severity}) ${s.title}\n` +
          `${s.narrative}\nRed flags: ${s.redFlags.join('; ')}\n` +
          `Safer: ${s.saferAlternative}`,
      )
      .join('\n\n');

    const history = (input.history ?? [])
      .map((h) => `Q: ${h.question}\nA: ${h.answer}`)
      .join('\n');

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      system:
        'You are Scam-Ba, a careful, practical fraud-risk analyst for online ' +
        'marketplace deals (collectibles and general). Estimate how likely the ' +
        "user's situation is a scam using the provided known scam patterns as " +
        'evidence. Be calibrated: do not cry scam without signals, and do not ' +
        'reassure when clear red flags are present. scamProbability is 0–100. ' +
        'verdict: safe (<30), caution (30–65), scam (>65). detectedSignals are ' +
        'concrete things in the situation that match a known pattern; cite the ' +
        'pattern title in source. advice is 2–4 short, actionable steps.',
      messages: [
        {
          role: 'user',
          content:
            `Role: the user is ${input.role}.\n\n` +
            `Situation:\n${input.description || '(no free text given)'}\n\n` +
            (input.signals?.length
              ? `Flags the user selected:\n- ${input.signals.join('\n- ')}\n\n`
              : '') +
            (history ? `Conversation so far:\n${history}\n\n` : '') +
            `Known scam patterns (knowledge base):\n${context}`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === 'text');
    const parsed = JSON.parse(text && 'text' in text ? text.text : '{}');

    const scamProbability = clamp(Math.round(Number(parsed.scamProbability)), 3, 97);
    return {
      scamProbability,
      verdict: (parsed.verdict as Verdict) ?? verdictFor(scamProbability),
      headline: String(parsed.headline ?? ''),
      reasoning: String(parsed.reasoning ?? ''),
      detectedSignals: (parsed.detectedSignals ?? []).map(
        (s: { label: string; source: string }, i: number) => ({
          label: s.label,
          source: s.source,
          weight: 20 - i,
        }),
      ),
      citedStories: stories.slice(0, 3).map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        narrative: s.narrative,
        severity: s.severity,
      })),
      advice: (parsed.advice ?? []).map(String),
      engine: `claude:${this.model}`,
    };
  }
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function verdictFor(p: number): Verdict {
  if (p >= SCAM_THRESHOLD) return 'scam';
  if (p >= CAUTION_THRESHOLD) return 'caution';
  return 'safe';
}
