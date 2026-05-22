// DebugReadout.tsx — THROWAWAY G2 verification surface. DELETE in G5.
//
// Proves the Worker + store + optimistic-click loop end-to-end before any real
// UI exists. Shows live mass / mps / mpc / aps / tier / consolidation, plus:
//   - Tap        → sendClick (optimistic reflectClick + worker CLICK)
//   - Buy first  → sendBuy on the first affordable upgrade (PURCHASE_OK or
//                  PURCHASE_REJECTED if it raced unaffordable)
//   - Tier up    → sendTierUp (composeCarryChain recompose into the next tier)
//   - Pause      → sendPause toggle
//
// This is NOT prose-first chrome and breaks the two-voice rules deliberately —
// it is a developer instrument, exempt under the dev-tooling carve-out, and is
// removed when GameChrome lands.

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from './store';
import {
  selectMass, selectRates, selectTier, selectConsolidation,
  selectAffordable, selectCausalConnections, selectPaused,
} from './store/selectors';
import {
  startEngine, sendInit, sendClick, sendBuy, sendTierUp, sendPause,
} from './workers/engineClient';
import { DEFAULT_PARAMS } from './engine';

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || (abs > 0 && abs < 1e-3)) return n.toExponential(3);
  return n.toFixed(4);
}

export default function DebugReadout() {
  // Object/array-returning selectors MUST be wrapped in useShallow under Zustand
  // v5 — an unstable return reference each call triggers the "getSnapshot should
  // be cached" infinite loop. Primitive selectors (mass/tier/causal/paused) are
  // fine bare.
  const mass = useStore(selectMass);
  const rates = useStore(useShallow(selectRates));
  const tier = useStore(selectTier);
  const consolidation = useStore(useShallow(selectConsolidation));
  const affordable = useStore(useShallow(selectAffordable));
  const causal = useStore(selectCausalConnections);
  const paused = useStore(selectPaused);
  const levels = useStore(useShallow((s) => s.snapshot?.levels ?? {}));
  const rejection = useStore((s) => s.lastRejection);
  const transition = useStore((s) => s.lastTransition);
  const offlineReturn = useStore((s) => s.snapshot?.offlineReturn ?? null);

  // Boot the engine on mount: spawn the worker + INIT a fresh universe.
  useEffect(() => {
    startEngine();
    sendInit({ type: 'INIT', state: null, params: DEFAULT_PARAMS, offlineSec: 0 });
  }, []);

  const ownedLevels = Object.entries(levels).filter(([, n]) => (n as number) > 0);

  return (
    <div style={{
      fontFamily: 'monospace', padding: '1.5rem', color: '#cde',
      background: '#0a0d14', minHeight: '100vh', lineHeight: 1.6,
    }}>
      <h2 style={{ color: '#8ab', marginTop: 0 }}>Dark Filaments — G2 debug loop (throwaway)</h2>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td style={cellL}>mass</td><td style={cellR}>{fmt(mass)} M☉</td></tr>
          <tr><td style={cellL}>mps</td><td style={cellR}>{fmt(rates.mps)} /s</td></tr>
          <tr><td style={cellL}>mpc</td><td style={cellR}>{fmt(rates.mpc)} /click</td></tr>
          <tr><td style={cellL}>aps</td><td style={cellR}>{fmt(rates.aps)} /s</td></tr>
          <tr><td style={cellL}>tier</td><td style={cellR}>{tier}</td></tr>
          <tr><td style={cellL}>consolidation</td><td style={cellR}>{fmt(consolidation.value)} / {fmt(consolidation.threshold)} {consolidation.ready ? '(READY)' : ''}</td></tr>
          <tr><td style={cellL}>causal connections</td><td style={cellR}>{causal.toLocaleString()}</td></tr>
          <tr><td style={cellL}>paused</td><td style={cellR}>{String(paused)}</td></tr>
          <tr><td style={cellL}>affordable</td><td style={cellR}>{affordable.length ? affordable.join(', ') : '(none)'}</td></tr>
        </tbody>
      </table>

      <div style={{ marginTop: '1rem' }}>
        <button style={btn} onClick={() => sendClick(1)}>Tap (CLICK)</button>
        <button style={btn} onClick={() => { if (affordable.length) sendBuy(affordable[0]); }}>
          Buy first affordable
        </button>
        <button style={btn} onClick={() => sendTierUp()} disabled={!consolidation.ready}>
          Tier up
        </button>
        <button style={btn} onClick={() => sendPause(!paused)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {rejection && (
        <p style={{ color: '#d88' }}>last rejection: {rejection.upgrade} — {rejection.reason}</p>
      )}
      {transition && (
        <p style={{ color: '#8d8' }}>last transition: T{transition.fromTier} → T{transition.toTier}</p>
      )}
      {offlineReturn && (
        <p style={{ color: '#8ad' }}>
          offline return: {offlineReturn.elapsedSec}s away, +{fmt(offlineReturn.massGained)} M☉
        </p>
      )}

      <div style={{ marginTop: '1rem' }}>
        <strong style={{ color: '#8ab' }}>owned levels:</strong>{' '}
        {ownedLevels.length
          ? ownedLevels.map(([name, n]) => `${name}=${n}`).join('  ')
          : '(none)'}
      </div>
    </div>
  );
}

const cellL: React.CSSProperties = { padding: '2px 16px 2px 0', color: '#789' };
const cellR: React.CSSProperties = { padding: '2px 0', color: '#cde' };
const btn: React.CSSProperties = {
  marginRight: '0.5rem', padding: '0.5rem 1rem', background: '#1a2434',
  color: '#cde', border: '1px solid #2a3a52', borderRadius: 4, cursor: 'pointer',
};
