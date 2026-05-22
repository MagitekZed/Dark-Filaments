// App.tsx — G4: mount the cosmic scene (CosmicCanvas) as the world, with a
// minimal debug overlay layered on top for state visibility + the buy/tier-up
// controls until G5's real chrome lands.
//
// Boot path (G3): persistence.boot() restores from a v5 localStorage save with
// the patient-universe offline accrual, or starts a fresh universe. boot() is
// idempotent (StrictMode double-mount guard), so the bare call in the effect is
// safe.
//
// The scene fills the viewport (CosmicCanvas is position:fixed inset:0). The
// debug overlay (DevOverlay) is a small fixed panel — NOT prose-first chrome;
// it is a developer instrument, exempt under the dev-tooling carve-out, and is
// removed when GameChrome lands in G5. Tapping the scene fires a CLICK + a pull
// particle (wired in CosmicCanvas); the overlay carries buy/tier-up/pause since
// those have no scene affordance yet.

import { useEffect } from 'react';
import { CosmicCanvas } from './scene/CosmicCanvas';
import DevOverlay from './DebugReadout';
import { boot } from './store/persistence';

export default function App() {
  useEffect(() => {
    boot();
  }, []);

  return (
    <>
      <CosmicCanvas />
      <DevOverlay />
    </>
  );
}
