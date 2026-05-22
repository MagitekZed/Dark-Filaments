// dev/TierSkip.tsx — jump directly to tier N (scaffold §7 G6 / §10).
//
// Sends SKIP_TO_TIER { tier }; the Worker's applySkipToTier replays applyTierUp
// up to the target so the carry recompose path is identical to a real climb (no
// special-casing). Used to author/test higher-tier scenes without a full
// playthrough. Only forward jumps are accepted by the engine (skipping back
// would require un-composing carry, which is meaningless) — buttons for tiers
// at-or-below the current tier are disabled.
//
// Dev-only: tree-shaken from prod via DevRoute's import.meta.env.DEV gate.

import { useStore } from '../store';
import { selectTier } from '../store/selectors';
import { TIERS } from '../engine';
import { devSkipToTier } from './devActions';
import { section, sectionTitle, btn, btnActive, row, note } from './devStyles';

const TIER_NUMBERS = Object.keys(TIERS).map(Number).sort((a, b) => a - b);

export function TierSkip() {
  const currentTier = useStore(selectTier);

  return (
    <div style={section}>
      <p style={sectionTitle}>Tier skip — currently T{currentTier} ({TIERS[currentTier]?.name})</p>
      <div style={row}>
        {TIER_NUMBERS.map((t) => {
          const isCurrent = t === currentTier;
          const disabled = t <= currentTier;
          return (
            <button
              key={t}
              style={isCurrent ? btnActive : btn}
              disabled={disabled}
              title={TIERS[t]?.name}
              onClick={() => devSkipToTier(t)}
            >
              T{t}
            </button>
          );
        })}
      </div>
      <p style={note}>
        Forward jumps only — the engine replays each tier-up so carry recomposes
        exactly as a real climb. Skipping mounts the destination scene
        (DefaultTierScene for tiers not yet authored).
      </p>
    </div>
  );
}
