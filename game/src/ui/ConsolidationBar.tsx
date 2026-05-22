// ui/ConsolidationBar.tsx — top-edge progress bar (scaffold §3 G5).
//
// Reads selectConsolidation { value, threshold, ready }. The fill width is the
// fraction value/threshold, clamped to 100%. The visual-design Consolidation
// HUD is the expanding-progress-bar concept; v0.1 renders the per-tier fill
// ratio (the bar-never-resets compression at tier transitions is a later visual
// pass — out of v0.1 scope). When ready, a small warm glow rides the leading
// edge. No label, no numbers — the bar is a perceptual progress meter only.
//
// Object-returning selector via useShallow (Zustand v5 guard).

import { useStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { selectConsolidation } from '../store/selectors';

export function ConsolidationBar() {
  const { value, threshold, ready } = useStore(useShallow(selectConsolidation));

  const fraction = threshold > 0 ? Math.min(value / threshold, 1) : 0;

  return (
    <div className="dfui-consolidation" aria-hidden>
      <div className="dfui-consolidation-track" />
      <div
        className="dfui-consolidation-fill"
        style={{ width: `${fraction * 100}%` }}
      >
        {ready && <div className="dfui-consolidation-glow" />}
      </div>
    </div>
  );
}
