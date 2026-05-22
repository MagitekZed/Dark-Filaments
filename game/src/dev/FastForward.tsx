// dev/FastForward.tsx — dev time-skip (THE HEADLINE TOOL) (scaffold §7 G6 / §10).
//
// The game targets weeks of calendar time (the patient-universe long-burn).
// Testing later scenes/tiers by hand-clicking is impractically slow. This tool
// jumps mass forward through the SAME engine path the boot/offline accrual uses
// — reconstructFromOfflineWindow — never an ad-hoc multiplier. That is the
// dev-tooling carve-out of the long-burn-pacing rule: tier-skip / fast-forward /
// debug speed are dev-only and never reach the player-facing build (this whole
// module tree-shakes out of prod via the import.meta.env.DEV gate in DevRoute).
//
// Two modes:
//   Pure-idle (must-have)  — accrue mass at current rates, no purchases
//                            (cpm 0, allowPurchases false). The universe is
//                            patient: consolidation never advances, mass just
//                            piles up. After the skip the next snapshot reflects
//                            the accrued mass.
//   With auto-buy (extra)  — run strategy.decideAction with a buyer profile so
//                            the dev fast-forwards REAL tier progression
//                            (purchases + transitions land inside the window).
//
// Presets: 1 h / 6 h / 1 d / 1 week + a custom seconds field.

import { useState } from 'react';
import { useStore } from '../store';
import { selectMass } from '../store/selectors';
import {
  devTimeSkipIdle,
  devTimeSkipAutoBuy,
  TIME_SKIP_PRESETS,
  BUYER_PROFILES,
} from './devActions';
import { section, sectionTitle, btn, input, label, row, note } from './devStyles';

const BUYER_KEYS = Object.keys(BUYER_PROFILES);

function fmtMass(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-3) return n.toExponential(3);
  return n.toFixed(4);
}

export function FastForward() {
  const mass = useStore(selectMass);
  const timeSkipSeconds = useStore((s) => s.timeSkipSeconds);
  const setTimeSkipSeconds = useStore((s) => s.setTimeSkipSeconds);
  const [autoBuy, setAutoBuy] = useState(false);
  const [buyerKey, setBuyerKey] = useState(BUYER_KEYS[0]);
  // Default to an active-play rate (60 cpm ≈ 1 click/s, the calibration baseline)
  // so "fresh universe → auto-buy → +1 week" bootstraps from zero income out of
  // the box. Set cpm to 0 for "buy off accrued passive mass only".
  const [autoCpm, setAutoCpm] = useState(60);
  const [lastSkip, setLastSkip] = useState<{ seconds: number; massBefore: number } | null>(null);

  function runSkip(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setLastSkip({ seconds, massBefore: mass });
    if (autoBuy) {
      devTimeSkipAutoBuy(seconds, buyerKey, autoCpm);
    } else {
      devTimeSkipIdle(seconds);
    }
  }

  return (
    <div style={section}>
      <p style={sectionTitle}>Fast-forward (time-skip)</p>

      <div style={row}>
        {TIME_SKIP_PRESETS.map((p) => (
          <button key={p.label} style={btn} onClick={() => runSkip(p.seconds)}>
            +{p.label}
          </button>
        ))}
      </div>

      <div style={row}>
        <span style={label}>custom (s)</span>
        <input
          style={input}
          type="number"
          min={1}
          value={timeSkipSeconds}
          onChange={(e) => setTimeSkipSeconds(Math.max(0, Number(e.target.value) || 0))}
        />
        <button style={btn} onClick={() => runSkip(timeSkipSeconds)}>
          Skip
        </button>
      </div>

      <div style={row}>
        <label style={{ ...label, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoBuy}
            onChange={(e) => setAutoBuy(e.target.checked)}
            style={{ marginRight: '0.3rem' }}
          />
          auto-buy
        </label>
        {autoBuy && (
          <>
            <select
              style={input}
              value={buyerKey}
              onChange={(e) => setBuyerKey(e.target.value)}
            >
              {BUYER_KEYS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <span style={label}>cpm</span>
            <input
              style={{ ...input, width: 56 }}
              type="number"
              min={0}
              value={autoCpm}
              onChange={(e) => setAutoCpm(Math.max(0, Number(e.target.value) || 0))}
            />
          </>
        )}
      </div>

      <p style={note}>
        {autoBuy
          ? 'With auto-buy: runs the buyer strategy over the window — purchases and tier transitions fire. cpm simulates active clicking (default 60 ≈ 1 click/s, so a fresh universe bootstraps from zero); set cpm 0 to buy off accrued passive mass only.'
          : 'Pure-idle: mass accrues at current rates, no purchases (consolidation does not advance — the universe is patient).'}
      </p>

      {lastSkip && (
        <p style={{ ...note, color: '#7a8aa0' }}>
          last skip: +{lastSkip.seconds}s — mass {fmtMass(lastSkip.massBefore)} → {fmtMass(mass)} M☉
        </p>
      )}
    </div>
  );
}
