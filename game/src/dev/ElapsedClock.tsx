// dev/ElapsedClock.tsx — real vs simulated elapsed time + per-tier pacing.
//
// "Time-skip should track elapsed time, both real + simulated, to see how long
// gameplay takes." This is that readout:
//   real      — wall clock since this universe began (app load / last Restart).
//   simulated — in-game seconds (snapshot.tickCount); 1 tick = 1 in-game second,
//               advanced by live ticks AND time-skips, so it equals in-game
//               calendar time. This is the number that maps to the design's
//               per-tier calendar targets.
//   accel     — simulated / real (how much faster than real-time the test ran).
//   in tier   — simulated time since the current tier began, against that tier's
//               Completion calendar target band (the headline calibration goal).
//
// Self-ticks at 1 Hz to keep the real clock live; sim time comes from snapshots.
// Dev-only (mounted under the import.meta.env.DEV-gated DevRoute).

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { selectSimSeconds, selectTierStartSec, selectTier, selectPaused } from '../store/selectors';
import { ENGAGED_TARGETS } from '../engine/profiles';
import { section, sectionTitle, note } from './devStyles';

function fmtDur(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '—';
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor((sec / 3600) % 24);
  const d = Math.floor(sec / 86400);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function ElapsedClock() {
  // universeStartMs changes on Restart — used purely as a reset signal here.
  const universeStartMs = useStore((s) => s.universeStartMs);
  const simSeconds = useStore(selectSimSeconds);
  const tierStartSec = useStore(selectTierStartSec);
  const tier = useStore(selectTier);
  const paused = useStore(selectPaused);
  const appView = useStore((s) => s.appView);

  // Real elapsed counts ONLY active play — game view, not paused. Sitting on the
  // main menu (or paused) does not count. Accumulated in refs so the 1 Hz tick
  // and the active-boundary settle without re-render churn; displayed via state.
  const active = appView === 'game' && !paused;
  const accumRef = useRef(0);   // accumulated active ms
  const lastRef = useRef(0);    // wall-clock of the last accounting
  const activeRef = useRef(active);
  const [realSec, setRealSec] = useState(0);

  // Settle the boundary whenever active flips, so the inactive gap is not counted.
  useEffect(() => {
    activeRef.current = active;
    lastRef.current = Date.now();
  }, [active]);

  // Reset on Restart (universeStartMs change). Refs only — no synchronous
  // setState in an effect; the next tick reflects the reset (≤1 s later).
  useEffect(() => {
    accumRef.current = 0;
    lastRef.current = Date.now();
  }, [universeStartMs]);

  // 1 Hz accounting. Date.now() lives in the interval callback (not render).
  useEffect(() => {
    lastRef.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (activeRef.current) accumRef.current += now - lastRef.current;
      lastRef.current = now;
      setRealSec(accumRef.current / 1000);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const accel = realSec > 0 ? simSeconds / realSec : 0;
  const inTierSec = Math.max(0, simSeconds - tierStartSec);

  const target = ENGAGED_TARGETS.completion?.[tier] ?? null;
  let pacing = '';
  if (target) {
    if (inTierSec < target.low) pacing = 'under target';
    else if (inTierSec > target.high) pacing = 'over target';
    else pacing = 'within target';
  }

  return (
    <div style={section}>
      <p style={sectionTitle}>Elapsed</p>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td style={cellL}>real</td><td style={cellR}>{fmtDur(realSec)}</td></tr>
          <tr><td style={cellL}>simulated</td><td style={cellR}>{fmtDur(simSeconds)}</td></tr>
          <tr><td style={cellL}>accel</td><td style={cellR}>{accel >= 1 ? `${accel.toFixed(1)}×` : accel > 0 ? `${accel.toFixed(2)}×` : '—'}</td></tr>
          <tr>
            <td style={cellL}>in tier</td>
            <td style={cellR}>
              {fmtDur(inTierSec)}
              {target && (
                <span style={{ color: pacing === 'within target' ? '#7a9' : '#a87', marginLeft: 6 }}>
                  / {fmtDur(target.low)}–{fmtDur(target.high)}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      {target && <p style={note}>T{tier} {pacing} (Completion calendar band)</p>}
    </div>
  );
}

const cellL: React.CSSProperties = { padding: '1px 14px 1px 0', color: '#789' };
const cellR: React.CSSProperties = { padding: '1px 0', color: '#cde' };
