// Maps the bubble-flow picks into the backend /api/analyze contract.
//
// The backend heuristic matches the request text against an English-language
// knowledge base (keyword overlap + a critical-token lexicon). The raw chip
// labels don't overlap that vocabulary, so each *risk* signal is mapped to a
// phrase built from the knowledge base's own red-flag wording and high-signal
// tokens (otp→"2fa verification code", rush→"urgent", etc). "Safe" picks carry
// no backend meaning and are omitted. Free-text customs are passed through so
// they get matched too.
//
// App combines the result as max(clientScore, backendScore): the backend can
// only escalate the risk, never talk a blatant scam back down to "safe".

import { STEPS, tr } from './content';
import type { Picks, Customs } from './scoring';
import type { AnalyzeRequest, Role } from '../types';

/** Risk-signal key → phrase rich in knowledge-base / critical-token vocabulary. */
const SIGNAL_PHRASES: Record<string, string> = {
  cheap: 'price far below market, too cheap to be real',
  rush: 'urgent pressure to act fast, today only, rushing the deal',
  link: 'sent a link to log in from the message, asking me to click the link',
  otp: 'asking for my OTP, 2fa verification code on the page',
  double: 'promises to double my money, investment deposit with guaranteed returns',
  newacct: 'seller has no real history, brand new suspicious account',
  bank: 'claims to be from the bank or GCash, account suspended or flagged, asks for a verification code',
  prepay: 'seller demands full payment before shipping, pay first before seeing the item',
  nocod: 'refuses cash on delivery (COD), insists on advance payment',
  nomeet: 'refuses to meet up or video call, avoids close-up authentication photos',
};

const CHANNEL_CONTEXT: Record<string, string> = {
  invest: 'investment app or paluwagan deposit scheme',
};

function asSet(pick: Picks[string] | undefined): Record<string, boolean> {
  return pick && typeof pick === 'object' ? pick : {};
}

/** Build an AnalyzeRequest from the user's taps + free-text customs. */
export function toAnalyzeRequest(picks: Picks, customs: Customs): AnalyzeRequest {
  const role: Role = picks.role === 'sell' ? 'selling' : 'buying';

  const signals: string[] = [];
  const descParts: string[] = [];

  for (const s of STEPS) {
    if (s.type === 'single') {
      const chosen = picks[s.id];
      if (typeof chosen === 'string' && chosen.startsWith('custom:')) {
        descParts.push(chosen.slice('custom:'.length));
      } else if (typeof chosen === 'string' && s.id === 'channel') {
        const opt = s.opts.find((o) => o.k === chosen);
        if (opt) descParts.push(`Channel: ${tr(opt.label, 'english')}.`);
        const ctx = CHANNEL_CONTEXT[chosen];
        if (ctx) signals.push(ctx);
      }
    } else {
      const sel = asSet(picks[s.id]);
      for (const o of s.opts) {
        // Only risk signals carry backend meaning; "safe" picks are skipped.
        if (sel[o.k] && !o.safe) {
          signals.push(SIGNAL_PHRASES[o.k] ?? tr(o.label, 'english'));
        }
      }
    }
    for (const custom of customs[s.id] ?? []) {
      if (!signals.includes(custom)) signals.push(custom);
    }
  }

  if (signals.length) descParts.push(signals.join('. ') + '.');

  return {
    role,
    description: descParts.join(' ').trim() || 'No details provided.',
    signals,
  };
}
