// dev/DevRoute.tsx — the dev panel mount (scaffold §7 G6 / §3 / §10).
//
// LOAD-BEARING: mounted ONLY behind a static `import.meta.env.DEV` guard in
// App.tsx (`{import.meta.env.DEV && <DevRoute />}`). That static guard is what
// lets Vite/Rollup dead-code-eliminate this entire subtree (and everything it
// imports) from the production bundle. Verified in G6/G7 by grepping dist/ for
// distinctive labels and finding zero matches. Dev tooling must never reach the
// player-facing build — this is the dev-tooling carve-out of the long-burn rule.
//
// Activation: an always-visible compact panel in dev mode, togglable with the
// backtick key (`).
//
// The panel is organised as a game-flow test harness, in three groups:
//   State            — readout + elapsed (real vs simulated) + owned upgrades.
//   Game flow        — drive the REAL game, accelerated but rule-respecting:
//                      restart, tap/buy/tier-up/pause, auto-click, live speed,
//                      fast-forward, tier-skip, param overrides. No mass/level
//                      cheats — all testing is realistic, just accelerated.
//   Scene & inspect  — author/view scenes: camera (gameplay ↔ free-look +
//                      orientation capture), view-any-tier, snapshot inspector.
//
// This is a developer instrument — exempt from the two-voice / prose-first
// chrome rules under the dev-tooling carve-out. It is deliberately utilitarian.

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import {
  selectMass, selectRates, selectTier, selectConsolidation,
  selectAffordable, selectCausalConnections, selectPaused,
} from '../store/selectors';
import { TIERS } from '../engine';
import { sendClick, sendBuy, sendTierUp } from '../workers/engineClient';
import { devSetPause, devResetUniverse } from './devActions';
import { ElapsedClock } from './ElapsedClock';
import { OwnedUpgrades } from './OwnedUpgrades';
import { AutoClick } from './AutoClick';
import { AutoBuy } from './AutoBuy';
import { LiveSpeed } from './LiveSpeed';
import { FastForward } from './FastForward';
import { TierSkip } from './TierSkip';
import { ParamOverrides } from './ParamOverrides';
import { CameraTools } from './CameraTools';
import { SceneSwitcher } from './SceneSwitcher';
import { SnapshotInspector } from './SnapshotInspector';
import { section, sectionTitle, btn, btnActive, label, row } from './devStyles';

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-3) return n.toExponential(3);
  return n.toFixed(4);
}

const groupTitle: React.CSSProperties = {
  color: '#9bd', margin: '0.7rem 0 0', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.75,
};

export function DevRoute() {
  const panelOpen = useStore((s) => s.panelOpen);
  const setPanelOpen = useStore((s) => s.setPanelOpen);
  const togglePanel = useStore((s) => s.togglePanel);

  // Store-side resets that accompany a Restart (the engine/save reset lives in
  // devResetUniverse → persistence.resetUniverse).
  const markUniverseStart = useStore((s) => s.markUniverseStart);
  const clearParamPatch = useStore((s) => s.clearParamPatch);
  const setCameraReadout = useStore((s) => s.setCameraReadout);
  const setLiveSpeed = useStore((s) => s.setLiveSpeed);
  const [confirmReset, setConfirmReset] = useState(false);

  // panelOpen defaults true (dev-gated). Backtick toggles. Ignored when typing
  // into the panel's own inputs.
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

  // Live readout. Object/array selectors via useShallow.
  const mass = useStore(selectMass);
  const rates = useStore(useShallow(selectRates));
  const tier = useStore(selectTier);
  const consolidation = useStore(useShallow(selectConsolidation));
  const affordable = useStore(useShallow(selectAffordable));
  const causal = useStore(selectCausalConnections);
  const paused = useStore(selectPaused);
  const offlineReturn = useStore(useShallow((s) => s.snapshot?.offlineReturn ?? null));

  function doRestart() {
    devResetUniverse();
    // Reset the store-side dev state so the readouts reflect the fresh universe.
    markUniverseStart();
    clearParamPatch();
    setCameraReadout(null);
    setLiveSpeed(1);
    setConfirmReset(false);
  }

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
        <h2
          style={{ color: '#8ab', margin: 0, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setPanelOpen(false)}
          title="minimize (click, or `)"
        >
          Dark Filaments — dev tools
        </h2>
        <button style={btn} onClick={() => setPanelOpen(false)} title="hide (`)">×</button>
      </div>

      {/* ── State ──────────────────────────────────────────────────── */}
      <p style={{ ...groupTitle, marginTop: '0.5rem' }}>State</p>
      <div style={{ ...section, borderTop: 'none', paddingTop: '0.35rem' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={cellL}>mass</td><td style={cellR}>{fmt(mass)} M☉</td></tr>
            <tr><td style={cellL}>mps / mpc / aps</td><td style={cellR}>{fmt(rates.mps)} / {fmt(rates.mpc)} / {fmt(rates.aps)}</td></tr>
            <tr><td style={cellL}>tier</td><td style={cellR}>T{tier} {TIERS[tier]?.name}</td></tr>
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
      <ElapsedClock />
      <OwnedUpgrades />

      {/* ── Game flow ─────────────────────────────────────────────────── */}
      <p style={groupTitle}>Game flow</p>
      <div style={section}>
        <p style={sectionTitle}>Run</p>
        <div style={row}>
          {confirmReset ? (
            <>
              <button style={btnActive} onClick={doRestart}>Confirm restart</button>
              <button style={btn} onClick={() => setConfirmReset(false)}>cancel</button>
            </>
          ) : (
            <button style={btn} onClick={() => setConfirmReset(true)} title="fresh T1 universe + clear save">
              Restart
            </button>
          )}
          <button style={btn} onClick={() => sendClick(1)}>Tap</button>
          <button style={btn} onClick={() => { if (affordable.length) sendBuy(affordable[0]); }} disabled={!affordable.length}>
            Buy
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
      <AutoClick />
      <AutoBuy />
      <LiveSpeed />
      <FastForward />
      <TierSkip />
      <ParamOverrides />

      {/* ── Scene & inspection ────────────────────────────────────────── */}
      <p style={groupTitle}>Scene &amp; inspection</p>
      <CameraTools />
      <SceneSwitcher />
      <SnapshotInspector />
    </div>
  );
}

const cellL: React.CSSProperties = { padding: '1px 14px 1px 0', color: '#789' };
const cellR: React.CSSProperties = { padding: '1px 0', color: '#cde' };
