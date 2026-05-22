// dev/DevRoute.tsx — the dev panel mount (scaffold §7 G6 / §3 / §10).
//
// LOAD-BEARING: mounted ONLY behind a static `import.meta.env.DEV` guard in
// App.tsx (`{import.meta.env.DEV && <DevRoute />}`). That static guard is what
// lets Vite/Rollup dead-code-eliminate this entire subtree (and everything it
// imports — FastForward, TierSkip, ParamOverrides, SnapshotInspector,
// SceneSwitcher, devActions) from the production bundle. Verified in G6 by
// grepping dist/ for a distinctive label and finding zero matches. Dev tooling
// must never reach the player-facing build — this is the dev-tooling carve-out
// of the long-burn-pacing rule.
//
// Activation: an always-visible compact panel in dev mode, togglable with the
// backtick key (`) — the same key the spike used. Subsumes the throwaway
// DebugReadout's controls (Tap / Buy / Tier-up / Pause) so there is ONE dev
// surface, not two competing panels. The live readout up top proves time-skip
// and param edits land; the tool sections below drive the Worker actions.
//
// This is a developer instrument — exempt from the two-voice / prose-first
// chrome rules under the dev-tooling carve-out. It is deliberately utilitarian.

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import {
  selectMass, selectRates, selectTier, selectConsolidation,
  selectAffordable, selectCausalConnections, selectPaused,
} from '../store/selectors';
import { sendClick, sendBuy, sendTierUp } from '../workers/engineClient';
import { devSetPause } from './devActions';
import { FastForward } from './FastForward';
import { TierSkip } from './TierSkip';
import { ParamOverrides } from './ParamOverrides';
import { SnapshotInspector } from './SnapshotInspector';
import { SceneSwitcher } from './SceneSwitcher';
import { section, sectionTitle, btn, label, row } from './devStyles';

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-3) return n.toExponential(3);
  return n.toFixed(4);
}

export function DevRoute() {
  const panelOpen = useStore((s) => s.panelOpen);
  const setPanelOpen = useStore((s) => s.setPanelOpen);
  const togglePanel = useStore((s) => s.togglePanel);

  // panelOpen defaults true in devSlice (dev-gated), so the tools are visible on
  // first load. Backtick toggles the panel. Ignored when typing into the panel's own inputs
  // (so a backtick in a number field does not collapse the panel mid-edit).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '`') return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      togglePanel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePanel]);

  // Live readout (subsumes DebugReadout). Object/array selectors via useShallow.
  const mass = useStore(selectMass);
  const rates = useStore(useShallow(selectRates));
  const tier = useStore(selectTier);
  const consolidation = useStore(useShallow(selectConsolidation));
  const affordable = useStore(useShallow(selectAffordable));
  const causal = useStore(selectCausalConnections);
  const paused = useStore(selectPaused);
  const offlineReturn = useStore(useShallow((s) => s.snapshot?.offlineReturn ?? null));

  if (!panelOpen) {
    return (
      <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 100 }}>
        <button style={btn} onClick={() => setPanelOpen(true)} title="dev panel (`)">
          dev
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', top: 10, right: 10, zIndex: 100,
        width: 360, maxHeight: 'calc(100vh - 20px)', overflowY: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: '#cde', background: 'rgba(8, 11, 18, 0.86)',
        backdropFilter: 'blur(6px)', border: '1px solid #1d2839',
        borderRadius: 8, padding: '0.6rem 0.8rem', lineHeight: 1.5,
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ color: '#8ab', margin: 0, fontSize: 13 }}>Dark Filaments — dev tools</h2>
        <button style={btn} onClick={() => setPanelOpen(false)} title="hide (`)">×</button>
      </div>

      {/* Live readout */}
      <div style={{ ...section, borderTop: 'none', paddingTop: '0.5rem' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={cellL}>mass</td><td style={cellR}>{fmt(mass)} M☉</td></tr>
            <tr><td style={cellL}>mps / mpc / aps</td><td style={cellR}>{fmt(rates.mps)} / {fmt(rates.mpc)} / {fmt(rates.aps)}</td></tr>
            <tr><td style={cellL}>tier</td><td style={cellR}>{tier}</td></tr>
            <tr><td style={cellL}>consolidation</td><td style={cellR}>{fmt(consolidation.value)} / {fmt(consolidation.threshold)} {consolidation.ready ? '(READY)' : ''}</td></tr>
            <tr><td style={cellL}>causal</td><td style={cellR}>{causal.toLocaleString()}</td></tr>
            <tr><td style={cellL}>paused</td><td style={cellR}>{String(paused)}</td></tr>
          </tbody>
        </table>
        {offlineReturn && (
          <p style={{ color: '#8ad', margin: '0.3rem 0 0', fontSize: 11 }}>
            offline return: {offlineReturn.elapsedSec}s away, +{fmt(offlineReturn.massGained)} M☉
          </p>
        )}
      </div>

      {/* Shared game controls (subsumed from DebugReadout) */}
      <div style={section}>
        <p style={sectionTitle}>Game controls</p>
        <div style={row}>
          <button style={btn} onClick={() => sendClick(1)}>Tap</button>
          <button style={btn} onClick={() => { if (affordable.length) sendBuy(affordable[0]); }} disabled={!affordable.length}>
            Buy first affordable
          </button>
          <button style={btn} onClick={() => sendTierUp()} disabled={!consolidation.ready}>
            Tier up
          </button>
          <button style={btn} onClick={() => devSetPause(!paused)}>
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
        <span style={{ ...label, fontSize: 10 }}>
          affordable: {affordable.length ? affordable.join(', ') : '(none)'}
        </span>
      </div>

      {/* The five dev tools (§10) */}
      <FastForward />
      <TierSkip />
      <SceneSwitcher />
      <ParamOverrides />
      <SnapshotInspector />
    </div>
  );
}

const cellL: React.CSSProperties = { padding: '1px 14px 1px 0', color: '#789' };
const cellR: React.CSSProperties = { padding: '1px 0', color: '#cde' };
