import type { CSSProperties } from 'react';
import { COPY, TONES, tr, type Tone } from '../lib/content';
import { ctaStyle, HERO_EMOJI, theme, toneOptionStyle } from '../lib/theme';

interface Props {
  tone: Tone;
  onSetTone: (t: Tone) => void;
  onStart: () => void;
}

const h1Style: CSSProperties = {
  fontWeight: 800,
  fontSize: 46,
  margin: '14px 0 6px',
  letterSpacing: '-0.5px',
  lineHeight: 1.02,
};
const leadStyle: CSSProperties = {
  fontSize: 19,
  lineHeight: 1.45,
  maxWidth: 380,
  margin: '0 0 26px',
  color: theme.sub,
  fontWeight: 600,
};
const fineStyle: CSSProperties = {
  fontSize: 14,
  marginTop: 16,
  color: theme.sub,
  fontWeight: 600,
};

export function Welcome({ tone, onSetTone, onStart }: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '32px 26px',
      }}
    >
      <div style={{ fontSize: 84, lineHeight: 1, animation: 'floaty 3s ease-in-out infinite' }}>
        {HERO_EMOJI}
      </div>
      <h1 style={h1Style}>{tr(COPY.welcomeTitle, tone)}</h1>
      <p style={leadStyle}>{tr(COPY.welcomeLead, tone)}</p>
      <button onClick={onStart} style={ctaStyle}>
        {tr(COPY.ctaLabel, tone)}
      </button>
      <p style={fineStyle}>{tr(COPY.welcomeFine, tone)}</p>

      <div style={{ marginTop: 30, width: '100%' }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {TONES.map((d) => (
            <button key={d.k} onClick={() => onSetTone(d.k)} style={toneOptionStyle(d.k === tone)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
