// dev/SnapshotInspector.tsx — raw EngineSnapshot JSON view (scaffold §7 G6 / §10).
//
// Reads the store's latest snapshot (no Worker action) and renders it as
// formatted JSON for debugging. Collapsed behind a toggle so it does not
// dominate the panel. Useful for confirming exactly what the engine is posting:
// rates, levels, affordable set, recentPurchase/recentTierUp riders,
// offlineReturn, the static causalConnections value.
//
// Dev-only: tree-shaken from prod via DevRoute's import.meta.env.DEV gate.

import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import { section, sectionTitle, btn } from './devStyles';

export function SnapshotInspector() {
  const showInspector = useStore((s) => s.showInspector);
  const setShowInspector = useStore((s) => s.setShowInspector);
  // The whole snapshot is an object; useShallow keeps the reference stable
  // across ticks that do not change its identity (the worker mints a new object
  // each post, so this re-renders ~4 Hz when open — acceptable for a dev view).
  const snapshot = useStore(useShallow((s) => s.snapshot));
  const lastRejection = useStore(useShallow((s) => s.lastRejection));
  const lastTransition = useStore(useShallow((s) => s.lastTransition));

  return (
    <div style={section}>
      <p style={sectionTitle}>
        Snapshot inspector
        <button
          style={{ ...btn, marginLeft: '0.5rem' }}
          onClick={() => setShowInspector(!showInspector)}
        >
          {showInspector ? 'hide' : 'show'}
        </button>
      </p>
      {showInspector && (
        <pre
          style={{
            margin: 0,
            maxHeight: 260,
            overflow: 'auto',
            background: '#0a0d14',
            border: '1px solid #1d2839',
            borderRadius: 4,
            padding: '0.5rem',
            color: '#9ab',
            fontSize: 10,
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {JSON.stringify({ snapshot, lastRejection, lastTransition }, null, 2)}
        </pre>
      )}
    </div>
  );
}
