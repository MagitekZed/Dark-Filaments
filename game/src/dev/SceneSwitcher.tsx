// dev/SceneSwitcher.tsx — view any tier's scene without progressing the game
// (scaffold §7 G6 / §10).
//
// Pure store state (no Worker action): sets devSlice.forcedTier, which
// CosmicCanvas honors over the live engine tier (falling back to the engine
// tier when null). Lets the dev VIEW/author any tier's scene without touching
// engine state — a render-layer override only. The free-look camera toggle that
// used to live here is now the dedicated Camera control (CameraTools).
//
// Distinction from TierSkip: TierSkip advances the ENGINE to tier N (real game
// state changes, carry recomposes). This only changes which SCENE is mounted for
// viewing. "Follow engine" (forcedTier = null) restores engine-driven mounting.
//
// Dev-only: tree-shaken from prod via DevRoute's import.meta.env.DEV gate.

import { useStore } from '../store';
import { selectTier } from '../store/selectors';
import { TIERS } from '../engine';
import { section, sectionTitle, btn, btnActive, row, note } from './devStyles';

const TIER_NUMBERS = Object.keys(TIERS).map(Number).sort((a, b) => a - b);

export function SceneSwitcher() {
  const engineTier = useStore(selectTier);
  const forcedTier = useStore((s) => s.forcedTier);
  const setForcedTier = useStore((s) => s.setForcedTier);

  return (
    <div style={section}>
      <p style={sectionTitle}>View tier (engine at T{engineTier})</p>

      <div style={row}>
        <button
          style={forcedTier == null ? btnActive : btn}
          onClick={() => setForcedTier(null)}
        >
          Follow engine
        </button>
        {TIER_NUMBERS.map((t) => (
          <button
            key={t}
            style={forcedTier === t ? btnActive : btn}
            title={TIERS[t]?.name}
            onClick={() => setForcedTier(t)}
          >
            T{t}
          </button>
        ))}
      </div>

      <p style={note}>
        Force-mounts a tier scene for viewing without touching engine state
        (unauthored tiers show the deep-field default). Use Camera → Free-look to
        orbit and capture a framing.
      </p>
    </div>
  );
}
