// dev/ParamOverrides.tsx — live engine-param edits (scaffold §7 G6 / §10).
//
// Sends SET_PARAMS { patch } so the dev can feel-tune cpm / engagement / baseMpc
// and friends without rebuilding. The Worker merges the patch over its live
// params and re-snapshots, so rates update on the next snapshot.
//
// The engine snapshot does not echo params back, so the panel tracks the
// applied patch in devSlice.paramPatch and shows it. "Reset shown" only clears
// the local display; it does not revert the engine (re-INIT / reload does that).
//
// Exposed knobs:
//   cpm                — click rate the simulator assumes (not the live tap path,
//                        which is per-CLICK; cpm feeds the autoclicker channel).
//   engagement         — global engagement multiplier (×perTierEngagement).
//   baseMpc            — floor click value in M☉ (the most load-bearing tuning
//                        lever from the M☉ retune).
//   consolidationGrowth— per-tier threshold growth factor.
//
// The autoclicker (autoclickerOn / autoCpm) used to live here; it is now the
// dedicated first-class Auto-click control in the Game-flow section.
//
// Dev-only: tree-shaken from prod via DevRoute's import.meta.env.DEV gate.

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import { DEFAULT_PARAMS, type Params } from '../engine';
import { devSetParams } from './devActions';
import { section, sectionTitle, btn, input, label, row, note } from './devStyles';

interface Knob {
  key: keyof Params;
  label: string;
  step: number;
}

const KNOBS: Knob[] = [
  { key: 'cpm', label: 'cpm', step: 5 },
  { key: 'engagement', label: 'engagement', step: 0.05 },
  { key: 'baseMpc', label: 'baseMpc', step: 0.0005 },
  { key: 'consolidationGrowth', label: 'consolidationGrowth', step: 0.1 },
];

export function ParamOverrides() {
  const paramPatch = useStore(useShallow((s) => s.paramPatch));
  const recordParamPatch = useStore((s) => s.recordParamPatch);
  const clearParamPatch = useStore((s) => s.clearParamPatch);

  // Local edit buffer — seeded from DEFAULT_PARAMS, overlaid with any applied
  // patch so the inputs show the effective value the dev last set.
  const [draft, setDraft] = useState<Record<string, number>>(() => {
    const patchRec = paramPatch as unknown as Record<string, unknown>;
    const defaultsRec = DEFAULT_PARAMS as unknown as Record<string, unknown>;
    const d: Record<string, number> = {};
    for (const k of KNOBS) {
      const key = k.key as string;
      const v = patchRec[key] ?? defaultsRec[key];
      d[key] = typeof v === 'number' ? v : 0;
    }
    return d;
  });

  function applyOne(key: keyof Params) {
    const value = draft[key as string];
    if (!Number.isFinite(value)) return;
    const patch = { [key]: value } as Partial<Params>;
    devSetParams(patch);
    recordParamPatch(patch);
  }

  return (
    <div style={section}>
      <p style={sectionTitle}>Param overrides</p>

      {KNOBS.map((k) => (
        <div key={k.key as string} style={row}>
          <span style={{ ...label, minWidth: 130, display: 'inline-block' }}>{k.label}</span>
          <input
            style={input}
            type="number"
            step={k.step}
            value={draft[k.key as string]}
            onChange={(e) =>
              setDraft((d) => ({ ...d, [k.key as string]: Number(e.target.value) }))
            }
          />
          <button style={btn} onClick={() => applyOne(k.key)}>
            apply
          </button>
        </div>
      ))}

      {Object.keys(paramPatch).length > 0 && (
        <>
          <p style={{ ...note, color: '#7a8aa0' }}>
            applied: {Object.entries(paramPatch)
              .map(([k, v]) => `${k}=${v}`)
              .join('  ')}
          </p>
          <button style={btn} onClick={clearParamPatch}>clear shown</button>
        </>
      )}
      <p style={note}>
        Patches merge over the engine's live params (reload / Restart reverts).
      </p>
    </div>
  );
}
