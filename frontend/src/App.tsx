import { useState } from 'react';
import type { CSSProperties } from 'react';
import { STEPS, type Tone } from './lib/content';
import {
  bandFromPct,
  buildVerdict,
  computeScore,
  getTint,
  type Customs,
  type Picks,
} from './lib/scoring';
import { theme } from './lib/theme';
import { toAnalyzeRequest } from './lib/backend';
import { analyze } from './api';
import type { AnalyzeResult } from './types';
import { Welcome } from './screens/Welcome';
import { Flow } from './screens/Flow';
import { Verdict } from './screens/Verdict';

export function App() {
  const [tone, setTone] = useState<Tone>('kanal');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [picks, setPicks] = useState<Picks>({});
  const [customs, setCustoms] = useState<Customs>({});
  const [customText, setCustomText] = useState('');
  const [backendResult, setBackendResult] = useState<AnalyzeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const isLast = stepIndex >= STEPS.length - 1;
  const step = STEPS[stepIndex] ?? STEPS[0];
  const score = computeScore(picks);

  // Hybrid verdict: the backend can only escalate the risk, never lower it, so
  // a blatant scam can't be talked down to "safe" by a keyword miss.
  const effPct = backendResult
    ? Math.max(score.pct, backendResult.scamProbability)
    : score.pct;
  const effBand = bandFromPct(effPct);

  // Whole-screen tint reacts live during the flow, settles on the verdict.
  const tintPct = done ? effPct : score.pct;
  const tintAny = done ? true : score.any;
  const tint = getTint(tintPct, tintAny, done);

  const rootStyle: CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    background: tint,
    fontFamily: theme.font,
    color: theme.ink,
    transition: 'background .5s ease',
  };

  // ── Backend (hybrid): fire once when the flow completes. ──────────────────
  const submit = (finalPicks: Picks, finalCustoms: Customs) => {
    setDone(true);
    setBackendResult(null);
    setAnalyzing(true);
    analyze(toAnalyzeRequest(finalPicks, finalCustoms))
      .then((res) => setBackendResult(res))
      .catch(() => {
        /* offline / backend down → keep the client-side score */
      })
      .finally(() => setAnalyzing(false));
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onStart = () => {
    setStarted(true);
    setDone(false);
    setStepIndex(0);
  };

  const onBack = () => {
    if (stepIndex <= 0) setStarted(false);
    else {
      setStepIndex(stepIndex - 1);
      setCustomText('');
    }
  };

  const onNext = () => {
    if (isLast) submit(picks, customs);
    else {
      setStepIndex(stepIndex + 1);
      setCustomText('');
    }
  };

  const onRestart = () => {
    setStarted(false);
    setDone(false);
    setStepIndex(0);
    setPicks({});
    setCustoms({});
    setCustomText('');
    setBackendResult(null);
    setAnalyzing(false);
  };

  const onPickSingle = (id: string, k: string) => {
    const next = { ...picks, [id]: k };
    setPicks(next);
    if (isLast) submit(next, customs);
    else {
      setStepIndex(stepIndex + 1);
      setCustomText('');
    }
  };

  const onToggle = (id: string, k: string) => {
    const cur = {
      ...(typeof picks[id] === 'object' ? (picks[id] as Record<string, boolean>) : {}),
    };
    cur[k] = !cur[k];
    setPicks({ ...picks, [id]: cur });
  };

  const onCustomInput = (value: string) => setCustomText(value);

  const onAddCustom = () => {
    const txt = customText.trim();
    if (!txt) return;
    const list = [...(customs[step.id] ?? []), txt];
    const nextCustoms = { ...customs, [step.id]: list };
    setCustoms(nextCustoms);
    setCustomText('');
    if (step.type === 'single') {
      const nextPicks = { ...picks, [step.id]: `custom:${txt}` };
      setPicks(nextPicks);
      if (isLast) submit(nextPicks, nextCustoms);
      else setStepIndex(stepIndex + 1);
    }
  };

  const verdictView = buildVerdict(picks, effBand, tone);

  return (
    <div style={rootStyle}>
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!started && <Welcome tone={tone} onSetTone={setTone} onStart={onStart} />}

        {started && !done && (
          <Flow
            tone={tone}
            onSetTone={setTone}
            step={step}
            isLast={isLast}
            picks={picks}
            customs={customs}
            customText={customText}
            score={score}
            onBack={onBack}
            onPickSingle={onPickSingle}
            onToggle={onToggle}
            onCustomInput={onCustomInput}
            onAddCustom={onAddCustom}
            onNext={onNext}
          />
        )}

        {started && done && (
          <Verdict
            tone={tone}
            pct={effPct}
            verdict={verdictView}
            analyzing={analyzing}
            onRestart={onRestart}
          />
        )}
      </div>
    </div>
  );
}
