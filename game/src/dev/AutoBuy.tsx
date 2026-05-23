// dev/AutoBuy.tsx — live "self-play" (the game plays itself while you watch).
//
// Runs the buyer strategy on the LIVE engine tick (not just inside a fast-forward
// jump), so with Auto-click on (income) and a Live speed selected you can watch
// the game progress through tiers in real time or accelerated. Same strategy the
// offline / fast-forward auto-buy uses — realistic, just hands-free. Toggle state
// lives in devSlice.paramPatch (the snapshot does not echo params). Dev-only.

import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import { devSetAutoBuy } from './devActions';
import { section, sectionTitle, btn, btnActive, row, note } from './devStyles';

const MODES: Array<'completion' | 'threshold'> = ['completion', 'threshold'];

export function AutoBuy() {
  const paramPatch = useStore(useShallow((s) => s.paramPatch));
  const recordParamPatch = useStore((s) => s.recordParamPatch);

  const on = !!paramPatch.autoBuyOn;
  const mode = paramPatch.autoBuyMode === 'threshold' ? 'threshold' : 'completion';

  function apply(nextOn: boolean, nextMode: 'completion' | 'threshold') {
    devSetAutoBuy(nextOn, nextMode);
    recordParamPatch({ autoBuyOn: nextOn, autoBuyMode: nextMode });
  }

  return (
    <div style={section}>
      <p style={sectionTitle}>Auto-buy (self-play)</p>
      <div style={row}>
        <button style={on ? btnActive : btn} onClick={() => apply(!on, mode)}>
          {on ? 'on — turn off' : 'off — turn on'}
        </button>
        {MODES.map((m) => (
          <button
            key={m}
            style={mode === m ? btnActive : btn}
            onClick={() => apply(on, m)}
          >
            {m}
          </button>
        ))}
      </div>
      <p style={note}>
        Runs the buyer strategy live — one decision per tick. Pair with Auto-click
        (income) and a Live speed to watch the game play itself through the tiers.
      </p>
    </div>
  );
}
