// dev/SceneSwitcher.tsx — force-mount any tier scene + free-orbit (scaffold §7 G6 / §10).
//
// Pure store state (no Worker action): sets devSlice.forcedTier, which
// CosmicCanvas honors over the live engine tier (falling back to the engine
// tier when null), and devSlice.freeOrbit, which cameraRig.DevOrbitControls
// reads to mount drei OrbitControls. Together these let the dev VIEW any tier's
// scene and orbit the camera freely for scene authoring/inspection WITHOUT
// progressing the game (the engine state is untouched — this is a render-layer
// override only).
//
// Distinction from TierSkip: TierSkip advances the ENGINE to tier N (real game
// state changes, carry recomposes). SceneSwitcher only changes which SCENE is
// mounted for viewing — the engine stays at whatever tier it was. "Follow
// engine" (forcedTier = null) restores normal engine-driven mounting.
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
  const freeOrbit = useStore((s) => s.freeOrbit);
  const setFreeOrbit = useStore((s) => s.setFreeOrbit);

  return (
    <div style={section}>
      <p style={sectionTitle}>Scene switcher (view only — engine at T{engineTier})</p>

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

      <div style={row}>
        <button
          style={freeOrbit ? btnActive : btn}
          onClick={() => setFreeOrbit(!freeOrbit)}
        >
          Free orbit: {freeOrbit ? 'on' : 'off'}
        </button>
      </div>

      <p style={note}>
        Force-mounts a tier scene for viewing without touching engine state
        (unauthored tiers show the deep-field default). Free orbit mounts
        OrbitControls so the camera can be dragged for inspection.
      </p>
    </div>
  );
}
