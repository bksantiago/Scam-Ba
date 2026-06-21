import seed from '../knowledge/scam-stories.seed.json';
import type { ScamStory } from '../knowledge/scam-story.types';
import type { AnalyzeInput } from './analysis.types';
import { CAUTION_THRESHOLD, heuristicAnalyze } from './heuristic-analyzer';

const stories = seed as ScamStory[];
const forRole = (role: 'buying' | 'selling') =>
  stories.filter((s) => s.role === role || s.role === 'both');

describe('heuristicAnalyze', () => {
  it('flags a clear buying scam as high risk', () => {
    const input: AnalyzeInput = {
      role: 'buying',
      description:
        'The seller listed a sealed booster box way below market and only wants payment up front.',
      signals: [
        'Asked to pay by gift card, Zelle, or crypto',
        'Seller wants to move off the platform (WhatsApp/Telegram)',
        'Price seems too good to be true',
        'Seller refuses buyer protection / reversible payment',
      ],
    };
    const r = heuristicAnalyze(input, forRole('buying'));

    expect(r.verdict).toBe('scam');
    expect(r.scamProbability).toBeGreaterThan(65);
    expect(r.detectedSignals.length).toBeGreaterThan(0);
    expect(r.citedStories.length).toBeGreaterThan(0);
    expect(r.advice.length).toBeGreaterThan(0);
    expect(r.engine).toBe('heuristic');
  });

  it('treats a clean buying situation as low risk', () => {
    const input: AnalyzeInput = {
      role: 'buying',
      description:
        'Buying a graded Charizard from an established eBay seller with thousands of reviews. Paying with PayPal buyer protection, shipping to my verified address.',
      signals: [],
    };
    const r = heuristicAnalyze(input, forRole('buying'));

    expect(r.verdict).toBe('safe');
    expect(r.scamProbability).toBeLessThan(CAUTION_THRESHOLD);
  });

  it('flags a selling overpayment scenario', () => {
    const input: AnalyzeInput = {
      role: 'selling',
      description:
        'A buyer paid more than my asking price and is asking me to refund the difference.',
      signals: [
        'Buyer overpaid and wants the difference refunded',
        'Only a payment screenshot, no funds in my account yet',
      ],
    };
    const r = heuristicAnalyze(input, forRole('selling'));

    expect(r.verdict).not.toBe('safe');
    expect(r.scamProbability).toBeGreaterThanOrEqual(CAUTION_THRESHOLD);
    expect(
      r.detectedSignals.some((s) => /difference|overpay|screenshot|funds/i.test(s.label)),
    ).toBe(true);
  });

  it('is deterministic', () => {
    const input: AnalyzeInput = {
      role: 'buying',
      description: 'gift card and whatsapp',
      signals: [],
    };
    const a = heuristicAnalyze(input, forRole('buying'));
    const b = heuristicAnalyze(input, forRole('buying'));
    expect(a).toEqual(b);
  });
});
