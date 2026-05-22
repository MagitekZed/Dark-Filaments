// App.tsx — mount the cosmic scene (CosmicCanvas) as the world, with the
// dev tooling panel (G6) layered on top in dev mode only.
//
// Boot path (G3): persistence.boot() restores from a v5 localStorage save with
// the patient-universe offline accrual, or starts a fresh universe. boot() is
// idempotent (StrictMode double-mount guard), so the bare call in the effect is
// safe.
//
// The scene fills the viewport (CosmicCanvas is position:fixed inset:0). Tapping
// the scene fires a CLICK + a pull particle (wired in CosmicCanvas).
//
// DEV ROUTE (G6, LOAD-BEARING): DevRoute is mounted ONLY behind the static
// `import.meta.env.DEV` guard. That static condition is what lets Vite/Rollup
// dead-code-eliminate the entire dev/ subtree (DevRoute + the five tools +
// devActions) from the production bundle — dev tooling never reaches the
// player-facing build. DevRoute subsumes the throwaway DebugReadout's controls
// (Tap / Buy / Tier-up / Pause), so there is one dev surface, not two. G5's real
// prose-first chrome layers in separately later. The grep-the-bundle check in
// G6 confirms zero dev strings survive in dist/.

import { useEffect } from 'react';
import { CosmicCanvas } from './scene/CosmicCanvas';
import { boot } from './store/persistence';
import { DevRoute } from './dev/DevRoute';

export default function App() {
  useEffect(() => {
    boot();
  }, []);

  return (
    <>
      <CosmicCanvas />
      {import.meta.env.DEV && <DevRoute />}
    </>
  );
}
