import type { CSSProperties } from 'react';
import { COPY, tr, type Tone } from '../lib/content';
import { meterColor, type VerdictView } from '../lib/scoring';
import { ctaStyle, fillStyle, theme, trackStyle } from '../lib/theme';

interface Props {
  tone: Tone;
  pct: number;
  verdict: VerdictView;
  /** True while /api/analyze is still refining the score. */
  analyzing: boolean;
  onRestart: () => void;
}

const titleStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: 42,
  margin: '12px 0 8px',
  letterSpacing: '-0.5px',
  lineHeight: 1.04,
};
const lineStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.5,
  maxWidth: 420,
  margin: '0 0 18px',
  color: theme.ink,
  fontWeight: 600,
};

export function Verdict({ tone, pct, verdict, analyzing, onRestart }: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '34px 26px',
      }}
    >
      <div style={{ fontSize: 92, lineHeight: 1, animation: 'pop .5s ease' }}>{verdict.emoji}</div>
      <h1 style={titleStyle}>{verdict.title}</h1>
      <p style={lineStyle}>{verdict.line}</p>

      {/* big meter */}
      <div style={{ width: '100%', maxWidth: 420, margin: '8px 0 22px' }}>
        <div style={trackStyle()}>
          <div style={fillStyle(pct, meterColor(pct))} />
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '.5px',
            marginTop: 8,
            color: theme.ink,
            opacity: analyzing ? 0.55 : 1,
            transition: 'opacity .3s ease',
          }}
        >
          {pct}% {tr(COPY.pctLabel, tone)}
          {analyzing ? ' …' : ''}
        </div>
      </div>

      {verdict.reasons.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            textAlign: 'left',
            padding: '18px 20px',
            borderRadius: 22,
            background: 'rgba(255,255,255,0.6)',
            border: theme.chipBorder,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '.5px',
              textTransform: 'uppercase',
              color: theme.sub,
            }}
          >
            {verdict.reasonsTitle}
          </div>
          {verdict.reasons.map((r, i) => (
            <div
              key={`${r.text}-${i}`}
              style={{
                display: 'flex',
                gap: 9,
                alignItems: 'flex-start',
                marginTop: 11,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18, flex: 'none', lineHeight: 1.5 }}>{r.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, color: theme.ink }}>
                {r.text}
              </span>
            </div>
          ))}
        </div>
      )}

      <button onClick={onRestart} style={ctaStyle}>
        {tr(COPY.restart, tone)}
      </button>
    </div>
  );
}
