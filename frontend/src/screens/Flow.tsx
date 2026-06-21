import type { CSSProperties, KeyboardEvent } from 'react';
import { COPY, TONES, tr, type Step, type Tone } from '../lib/content';
import { bandLabel, faceFor, meterColor, type Customs, type Picks, type ScoreResult } from '../lib/scoring';
import {
  backBtnStyle,
  bubbleStyle,
  fillStyle,
  PERSONA_EMOJI,
  theme,
  toneChipStyle,
  trackStyle,
} from '../lib/theme';

interface Props {
  tone: Tone;
  onSetTone: (t: Tone) => void;
  step: Step;
  isLast: boolean;
  picks: Picks;
  customs: Customs;
  customText: string;
  score: ScoreResult;
  onBack: () => void;
  onPickSingle: (id: string, k: string) => void;
  onToggle: (id: string, k: string) => void;
  onCustomInput: (value: string) => void;
  onAddCustom: () => void;
  onNext: () => void;
}

const qStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: 30,
  lineHeight: 1.12,
  margin: '0 0 6px',
  letterSpacing: '-0.3px',
};
const subStyle: CSSProperties = { fontSize: 16, fontWeight: 600, color: theme.sub, margin: 0, lineHeight: 1.4 };

export function Flow({
  tone,
  onSetTone,
  step,
  isLast,
  picks,
  customs,
  customText,
  score,
  onBack,
  onPickSingle,
  onToggle,
  onCustomInput,
  onAddCustom,
  onNext,
}: Props) {
  const { pct, any } = score;
  const pickForStep = picks[step.id];
  const customsList = customs[step.id] ?? [];
  const mColor = meterColor(pct);
  const meterWidth = any ? pct : 50;

  const avatarStyle: CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flex: 'none',
    background: '#fff',
    border: theme.chipBorder,
  };

  const onCustomKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onAddCustom();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 6px' }}>
        <button onClick={onBack} style={backBtnStyle} aria-label="Back">
          ‹
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {TONES.map((d) => (
            <button
              key={d.k}
              onClick={() => onSetTone(d.k)}
              style={toneChipStyle(d.k === tone)}
              title={d.label}
            >
              {d.short}
            </button>
          ))}
        </div>
      </div>

      {/* question + bubbles */}
      <div style={{ flex: 1, padding: '14px 20px 8px', overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
            animation: 'slidein .3s ease',
          }}
        >
          <div style={avatarStyle}>{PERSONA_EMOJI}</div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.3px', color: theme.sub }}>
            {tr(COPY.personaName, tone)}
          </div>
        </div>
        <h2 style={qStyle}>{tr(step.q, tone)}</h2>
        <p style={subStyle}>{tr(step.sub, tone)}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 18 }}>
          {step.opts.map((o) => {
            const selected =
              step.type === 'single'
                ? pickForStep === o.k
                : !!(pickForStep && typeof pickForStep === 'object' && pickForStep[o.k]);
            return (
              <button
                key={o.k}
                onClick={() =>
                  step.type === 'single' ? onPickSingle(step.id, o.k) : onToggle(step.id, o.k)
                }
                style={bubbleStyle(selected, o.safe)}
              >
                <span style={{ fontSize: 24, flex: 'none' }}>{o.emoji}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{tr(o.label, tone)}</span>
                {selected && <span style={{ fontSize: 20, flex: 'none' }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* custom chips already added */}
        {customsList.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {customsList.map((txt, i) => (
              <span
                key={`${txt}-${i}`}
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '9px 14px',
                  borderRadius: 999,
                  background: '#fff',
                  color: theme.ink,
                  border: theme.chipBorder,
                }}
              >
                ✎ {txt}
              </span>
            ))}
          </div>
        )}

        {/* custom input */}
        {step.custom && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.sub, marginBottom: 8 }}>
              {tr(COPY.customHint, tone)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={customText}
                onChange={(e) => onCustomInput(e.target.value)}
                onKeyDown={onCustomKey}
                placeholder={tr(step.type === 'single' ? COPY.customPhSingle : COPY.customPhMulti, tone)}
                style={{
                  flex: 1,
                  fontSize: 17,
                  fontWeight: 600,
                  padding: '14px 16px',
                  borderRadius: theme.radius,
                  border: theme.chipBorder,
                  background: '#fff',
                  color: theme.ink,
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                onClick={onAddCustom}
                style={{
                  width: 54,
                  flex: 'none',
                  fontSize: 26,
                  fontWeight: 800,
                  borderRadius: theme.radius,
                  background: theme.accent,
                  color: '#fff',
                }}
                aria-label="Add"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* footer: meter + next */}
      <div
        style={{
          padding: '16px 20px calc(18px + env(safe-area-inset-bottom))',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(6px)',
          borderTop: theme.chipBorder,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.2px', color: theme.ink }}>
            {bandLabel(pct, any, tone)}
          </span>
          <span style={{ fontSize: 24 }}>{faceFor(pct, any)}</span>
        </div>
        <div style={trackStyle()}>
          <div style={fillStyle(meterWidth, mColor)} />
        </div>
        {step.type === 'multi' && (
          <button
            onClick={onNext}
            style={{
              width: '100%',
              marginTop: 14,
              fontFamily: theme.font,
              fontWeight: 800,
              fontSize: 19,
              padding: 16,
              borderRadius: 999,
              background: theme.accent,
              color: '#fff',
              boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
            }}
          >
            {tr(isLast ? COPY.nextLast : COPY.nextMore, tone)}
          </button>
        )}
      </div>
    </div>
  );
}
