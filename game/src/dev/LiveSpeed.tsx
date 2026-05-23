// dev/LiveSpeed.tsx — accelerate the live tick to WATCH a tier unfold.
//
// Multiplies the core tick rate (SET_TICK_HZ) so in-game time runs faster than
// real time while the scene/economy keep updating — the complement to the
// discrete Fast-forward jumps. The engine ticks the SAME applyTick more often,
// so accrual stays exactly realistic, just sped up. Pair with Auto-click to
// watch a tier fill up. The Elapsed readout shows the resulting accel ratio.
// NOTE: tabbing away resets cadence to 1× (the visibilitychange handler) — pick
// a speed again on return. Dev-only.

import { useStore } from '../store';
import { devSetSpeed } from './devActions';
import { section, sectionTitle, btn, btnActive, row, note } from './devStyles';

const SPEEDS = [1, 5, 20, 60];

export function LiveSpeed() {
  const liveSpeed = useStore((s) => s.liveSpeed);
  const setLiveSpeed = useStore((s) => s.setLiveSpeed);

  return (
    <div style={section}>
      <p style={sectionTitle}>Live speed</p>
      <div style={row}>
        {SPEEDS.map((m) => (
          <button
            key={m}
            style={liveSpeed === m ? btnActive : btn}
            onClick={() => { setLiveSpeed(m); devSetSpeed(m); }}
          >
            {m}×
          </button>
        ))}
      </div>
      <p style={note}>
        Real-time runs the engine faster (1× = normal 1 Hz). For big jumps use
        Fast-forward instead. Resets to 1× if you tab away.
      </p>
    </div>
  );
}
