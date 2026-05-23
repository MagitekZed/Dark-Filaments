// dev/AutoClick.tsx — hands-free auto-clicking (a core per-tier test tool).
//
// Drives the worker-runtime autoclicker at `cpm` clicks/minute through the SAME
// mpc channel a real tap uses — so "turn it on and walk away" is realistic play,
// just hands-free (pair with Live speed to watch a tier fill up). The toggle
// state lives in devSlice.paramPatch (the engine snapshot does not echo params),
// matching how ParamOverrides tracks applied patches. Dev-only.

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import { devSetAutoClick } from './devActions';
import { section, sectionTitle, btn, btnActive, input, label, row, note } from './devStyles';

export function AutoClick() {
  const paramPatch = useStore(useShallow((s) => s.paramPatch));
  const recordParamPatch = useStore((s) => s.recordParamPatch);

  const autoclickerOn = !!paramPatch.autoclickerOn;
  const [cpm, setCpm] = useState<number>(
    typeof paramPatch.autoCpm === 'number' ? paramPatch.autoCpm : 60,
  );

  function apply(on: boolean, rate: number) {
    devSetAutoClick(on, rate);
    recordParamPatch({ autoclickerOn: on, autoCpm: rate });
  }

  return (
    <div style={section}>
      <p style={sectionTitle}>Auto-click</p>
      <div style={row}>
        <button
          style={autoclickerOn ? btnActive : btn}
          onClick={() => apply(!autoclickerOn, cpm)}
        >
          {autoclickerOn ? 'on — turn off' : 'off — turn on'}
        </button>
        <span style={label}>cpm</span>
        <input
          style={{ ...input, width: 64 }}
          type="number"
          min={0}
          value={cpm}
          onChange={(e) => {
            const next = Math.max(0, Number(e.target.value) || 0);
            setCpm(next);
            if (autoclickerOn) apply(true, next);
          }}
        />
      </div>
      <p style={note}>
        Clicks hands-free at cpm/60 per second (60 ≈ 1 click/s, the calibration
        baseline). Real income path — no rules bent.
      </p>
    </div>
  );
}
