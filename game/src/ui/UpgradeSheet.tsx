// ui/UpgradeSheet.tsx — bottom-rising prose-first sheet (scaffold §3 G5).
//
// Lists the CURRENT tier's upgrades in UPGRADES array order (author-curated by
// narrative position, matching gameplay-design §3). NO sort controls, no filter,
// no best-buy reordering — the prose-first rule forbids player-facing sort.
//
// State: open/closed from the uiSlice (sheetOpen). Tapping outside the sheet
// (the close-zone above it) closes it. Each card reads its own level +
// affordability and fires sendBuy on tap (UpgradeCard).
//
// Reads: selectTier (which tier's slate to show), selectLevels (per-upgrade
// level), selectAffordable (the within-reach set). Object/array selectors via
// useShallow (Zustand v5 guard).

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { UPGRADES, upgradesForTier } from '../engine';
import { useStore } from '../store';
import { selectTier, selectLevels, selectAffordable } from '../store/selectors';
import { UpgradeCard } from './UpgradeCard';

export function UpgradeSheet() {
  const sheetOpen = useStore((s) => s.sheetOpen);
  const setSheetOpen = useStore((s) => s.setSheetOpen);
  const tier = useStore(selectTier);
  const levels = useStore(useShallow(selectLevels));
  const affordable = useStore(useShallow(selectAffordable));

  // Current-tier slate, in UPGRADES order. upgradesForTier preserves array
  // order, so the curated narrative ordering is intact.
  const slate = useMemo(() => upgradesForTier(UPGRADES, tier), [tier]);
  const affordableSet = useMemo(() => new Set(affordable), [affordable]);

  return (
    <>
      {/* Tap-outside-to-close scrim — only catches taps while open. */}
      {sheetOpen && (
        <button
          type="button"
          data-ui
          className="dfui-sheet-close-zone"
          aria-label="close upgrades"
          onClick={() => setSheetOpen(false)}
        />
      )}

      <div className={`dfui-sheet ${sheetOpen ? 'dfui-open' : ''}`} data-ui>
        <div className="dfui-sheet-grid">
          {slate.map((u) => (
            <UpgradeCard
              key={u.name}
              upgrade={u}
              level={levels[u.name] ?? 0}
              affordable={affordableSet.has(u.name)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
