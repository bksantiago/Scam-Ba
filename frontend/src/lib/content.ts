// Content model for the "Scam ba 'to?" bubble flow.
// Ported verbatim from the imported Claude Design prototype (Scam ba to.dc.html)
// so the Filipino copy, tone variants, signal weights and emoji stay identical.

export type Tone = 'kanal' | 'normal' | 'english';

/** A localized string. `kanal` is the fallback used by `tr()`. */
export type Loc = Record<Tone, string>;

export type StepType = 'single' | 'multi';

export interface StepOption {
  /** Stable key stored in `picks`. */
  k: string;
  emoji: string;
  /** Score weight (multi steps only). Positive = riskier, negative = safer. */
  w?: number;
  /** Marks a reassuring "good sign" option. */
  safe?: boolean;
  label: Loc;
}

export interface Step {
  id: string;
  type: StepType;
  /** Whether the free-text custom input is offered on this step. */
  custom: boolean;
  q: Loc;
  sub: Loc;
  opts: StepOption[];
}

export const TONES: { k: Tone; label: string; short: string }[] = [
  { k: 'kanal', label: 'Kanal', short: 'K' },
  { k: 'normal', label: 'Normal', short: 'N' },
  { k: 'english', label: 'English', short: 'EN' },
];

/** Pick the active tone's text, falling back to kanal. */
export function tr(obj: Loc | undefined, tone: Tone): string {
  if (!obj) return '';
  return obj[tone] ?? obj.kanal ?? '';
}

export const STEPS: Step[] = [
  {
    id: 'role',
    type: 'single',
    custom: false,
    q: {
      kanal: 'Ano’ng meron, idol?',
      normal: 'Kumusta? Ano ang kailangan?',
      english: 'What’s going on?',
    },
    sub: {
      kanal: 'Bibili ka ba o nagbebenta?',
      normal: 'Bibili ka ba o nagbebenta?',
      english: 'Are you buying or selling?',
    },
    opts: [
      {
        k: 'buy',
        emoji: '🛒',
        label: { kanal: 'BIBILI ako', normal: 'Bibili ako', english: 'I’m buying' },
      },
      {
        k: 'sell',
        emoji: '🏷️',
        label: { kanal: 'NAGBEBENTA ako', normal: 'Nagbebenta ako', english: 'I’m selling' },
      },
    ],
  },
  {
    id: 'channel',
    type: 'single',
    custom: true,
    q: {
      kanal: 'Saan ’to nangyari?',
      normal: 'Saan ito nangyari?',
      english: 'Where did this happen?',
    },
    sub: {
      kanal: 'I-tap kung saan kayo nag-usap.',
      normal: 'Piliin kung saan kayo nag-usap.',
      english: 'Tap where you talked.',
    },
    opts: [
      { k: 'fb', emoji: '📘', label: { kanal: 'FB Marketplace', normal: 'FB Marketplace', english: 'FB Marketplace' } },
      { k: 'shopee', emoji: '🛍️', label: { kanal: 'Shopee / Lazada', normal: 'Shopee / Lazada', english: 'Shopee / Lazada' } },
      { k: 'sms', emoji: '✉️', label: { kanal: 'Text / SMS', normal: 'Text / SMS', english: 'Text / SMS' } },
      { k: 'call', emoji: '📞', label: { kanal: 'Tawag sa cellphone', normal: 'Tawag sa telepono', english: 'Phone call' } },
      { k: 'dm', emoji: '💬', label: { kanal: 'Messenger / DM', normal: 'Messenger / DM', english: 'Messenger / DM' } },
      { k: 'invest', emoji: '📈', label: { kanal: 'Investment app / “paluwagan”', normal: 'Investment app', english: 'Investment app' } },
    ],
  },
  {
    id: 'sig1',
    type: 'multi',
    custom: true,
    q: {
      kanal: 'Ano’ng sinabi o ginawa nila?',
      normal: 'Ano ang sinabi o ginawa nila?',
      english: 'What did they say or do?',
    },
    sub: {
      kanal: 'I-tap LAHAT ng totoo. Pwede higit sa isa.',
      normal: 'Piliin lahat ng totoo. Pwede higit sa isa.',
      english: 'Tap all that are true. Pick more than one.',
    },
    opts: [
      { k: 'cheap', emoji: '😲', w: 3, label: { kanal: 'Sobrang mura, parang fake', normal: 'Sobrang mura para totoo', english: 'Too cheap to be real' } },
      { k: 'rush', emoji: '⏰', w: 2, label: { kanal: 'Nagmamadali — “today lang!”', normal: 'Nagmamadali — “ngayon lang!”', english: 'Rushing me — “today only!”' } },
      { k: 'link', emoji: '🔗', w: 3, label: { kanal: 'Pinapa-click ako sa link', normal: 'Pinapa-click ako sa isang link', english: 'Asking me to click a link' } },
      { k: 'otp', emoji: '🔢', w: 5, label: { kanal: 'Humingi ng OTP / PIN / password', normal: 'Humihingi ng OTP / PIN / password', english: 'Asking for my OTP / PIN / password' } },
      { k: 'double', emoji: '💰', w: 4, label: { kanal: '“Doble ang pera mo” daw', normal: '“Dodoblehin ang pera mo” daw', english: 'Promises to “double my money”' } },
      { k: 'newacct', emoji: '👤', w: 2, label: { kanal: 'Bago / weird ang account nila', normal: 'Bago o kahina-hinala ang account', english: 'New or suspicious account' } },
      { k: 'bank', emoji: '🏦', w: 4, label: { kanal: '“Taga-bank/GCash” pero humihingi info', normal: 'Nagpapanggap na taga-bank/GCash', english: 'Claims to be from a bank/GCash' } },
      { k: 'normal', emoji: '😌', w: -3, safe: true, label: { kanal: 'Normal lang, walang kakaiba', normal: 'Normal lang, walang kakaiba', english: 'Nothing unusual' } },
    ],
  },
  {
    id: 'sig2',
    type: 'multi',
    custom: true,
    q: {
      kanal: 'Paano ang bayad o padala?',
      normal: 'Paano ang bayad o padala?',
      english: 'How is the payment or delivery?',
    },
    sub: {
      kanal: 'I-tap LAHAT ng totoo.',
      normal: 'Piliin lahat ng totoo.',
      english: 'Tap all that are true.',
    },
    opts: [
      { k: 'prepay', emoji: '💸', w: 3, label: { kanal: 'Bayad muna bago makita item', normal: 'Bayad muna bago makita ang item', english: 'Pay first before seeing the item' } },
      { k: 'nocod', emoji: '🚫', w: 2, label: { kanal: 'Ayaw mag-COD (cash on delivery)', normal: 'Ayaw mag-COD', english: 'Won’t do cash on delivery (COD)' } },
      { k: 'nomeet', emoji: '🙈', w: 2, label: { kanal: 'Ayaw mag-meetup / video call', normal: 'Ayaw mag-meetup o video call', english: 'Won’t meet up or video call' } },
      { k: 'cod', emoji: '🤝', w: -3, safe: true, label: { kanal: 'Pwede COD / meetup sa public', normal: 'Pwede COD o meetup sa public', english: 'OK with COD or meeting in public' } },
      { k: 'receipt', emoji: '🧾', w: -2, safe: true, label: { kanal: 'May legit receipt / official channel', normal: 'May legit receipt / official channel', english: 'Has a legit receipt / official channel' } },
      { k: 'patient', emoji: '🧘', w: -2, safe: true, label: { kanal: 'Hindi nagmamadali, chill lang', normal: 'Hindi nagmamadali', english: 'Not rushing, patient' } },
    ],
  },
];

export const COPY = {
  welcomeTitle: { kanal: 'Scam ba ’to?', normal: 'Scam ba ito?', english: 'Is this a scam?' },
  welcomeLead: {
    kanal: 'Niloloko ka ba, idol? Sagutin mo lang ’tong ilang tap. Tutulungan kitang malaman. 🕵️',
    normal: 'Baka niloloko ka. Sagutin lang ang ilang tanong at tutulungan kitang malaman. 🕵️',
    english: 'Are you being scammed? Answer a few taps and I’ll help you find out. 🕵️',
  },
  ctaLabel: { kanal: 'Sige, simulan! ➝', normal: 'Simulan na ➝', english: 'Let’s start ➝' },
  welcomeFine: {
    kanal: 'Libre ’to. At hindi kami hihingi ng OTP. 😉',
    normal: 'Libre ito. Hindi kami hihingi ng OTP. 😉',
    english: 'It’s free. And we’ll never ask for your OTP. 😉',
  },
  toneSwitchLabel: { kanal: 'ANONG TONO?', normal: 'PUMILI NG TONO', english: 'PICK A TONE' },
  personaName: { kanal: 'Si Bubbles', normal: 'Si Bubbles', english: 'Bubbles' },
  customHint: { kanal: 'Wala dito? I-type mo dito:', normal: 'Wala dito? I-type mo:', english: 'Not here? Type it:' },
  customPhSingle: { kanal: 'hal. “Binigay sa Viber”', normal: 'hal. “sa Viber”', english: 'e.g. “on Viber”' },
  customPhMulti: { kanal: 'hal. “may kakaiba sa picture”', normal: 'hal. “kakaiba ang larawan”', english: 'e.g. “the photo looks off”' },
  nextMore: { kanal: 'Tuloy ➝', normal: 'Tuloy ➝', english: 'Continue ➝' },
  nextLast: { kanal: 'Ano’ng hatol? ➝', normal: 'Tingnan ang hatol ➝', english: 'See the verdict ➝' },
  restart: { kanal: 'Ulitin ➝', normal: 'Ulitin ➝', english: 'Start over ➝' },
  pctLabel: { kanal: 'amoy-scam', normal: 'posibleng scam', english: 'scam likelihood' },
  band: {
    none: { kanal: 'Kulang pa info…', normal: 'Kulang pa ang info…', english: 'Need more info…' },
    safe: { kanal: 'Mukhang LIGTAS', normal: 'Mukhang ligtas', english: 'Looks SAFE' },
    warn: { kanal: 'INGAT — may amoy', normal: 'Mag-ingat', english: 'Be careful' },
    scam: { kanal: 'SCAM amoy nito!', normal: 'Mukhang scam', english: 'Likely a SCAM!' },
  },
  verdict: {
    green: {
      title: { kanal: 'Mukhang LEGIT!', normal: 'Mukhang ligtas', english: 'Looks legit!' },
      line: {
        kanal: 'Mukhang ayos ’to, idol — pero ’wag ka pa ring kampante. I-double check mo pa rin bago magbayad.',
        normal: 'Mukhang ayos ito. Pero mag-ingat pa rin at i-double check bago magbayad.',
        english: 'This looks okay — but stay careful and double-check before you pay.',
      },
      reasonsTitle: { kanal: 'Mga good sign:', normal: 'Mga magandang senyales:', english: 'Good signs:' },
    },
    amber: {
      title: { kanal: 'INGAT KA!', normal: 'Mag-ingat ka', english: 'Be careful!' },
      line: {
        kanal: 'May amoy ’to. ’Wag mong bayaran agad. Tanong-tanong muna, idol — baka maging content ka sa “Paano ako naloko.”',
        normal: 'May mga kahina-hinala dito. Huwag agad magbayad. Magtanong muna bago kumilos.',
        english: 'There are warning signs here. Don’t pay yet — ask around first.',
      },
      reasonsTitle: { kanal: 'Bakit dapat mag-ingat:', normal: 'Bakit dapat mag-ingat:', english: 'Why to be careful:' },
    },
    red: {
      title: { kanal: 'SCAM ’YAN!', normal: 'Mukhang scam ito', english: 'That’s a SCAM!' },
      line: {
        kanal: 'Layuan mo na ’yan, bes. Block, report, at ’wag na ’wag magbibigay ng OTP o pera. Hatid mo na sa kanal ang chat na ’yan.',
        normal: 'Iwasan mo na ito. I-block, i-report, at huwag magbigay ng OTP o pera.',
        english: 'Stay away. Block, report, and never share your OTP or money.',
      },
      reasonsTitle: { kanal: 'Mga red flag na nakita:', normal: 'Mga red flag na nakita:', english: 'Red flags found:' },
    },
  },
} as const;

export type VerdictBand = 'green' | 'amber' | 'red';
