// App.tsx — mount the cosmic scene (CosmicCanvas) as the world, layer the
// player-facing chrome (G5) over it, with the dev tooling panel (G6) on top in
// dev mode only.
//
// Boot path (G3): persistence.boot() restores from a v5 localStorage save with
// the patient-universe offline accrual, or starts a fresh universe. boot() is
// idempotent (StrictMode double-mount guard), so the bare call in the effect is
// safe. The engine runs from boot regardless of which chrome is showing.
//
// Title vs running-game (G5): the scene is the backdrop in BOTH states. The
// TitleScreen is a DOM overlay over the running scene; Begin reveals the
// GameChrome and dismisses the title. Local `view` state owns the swap — the
// engine is already ticking underneath, so Begin only changes which chrome the
// player sees.
//
// The scene fills the viewport (CosmicCanvas is position:fixed inset:0). Tapping
// the scene fires a CLICK + a pull particle (wired in CosmicCanvas); the chrome
// root is pointer-events:none so taps fall through except on interactive chrome.
//
// DEV ROUTE (G6, LOAD-BEARING): DevRoute is mounted ONLY behind the static
// `import.meta.env.DEV` guard. That static condition is what lets Vite/Rollup
// dead-code-eliminate the entire dev/ subtree (DevRoute + the five tools +
// devActions) from the production bundle — dev tooling never reaches the
// player-facing build. The grep-the-bundle check in G6 confirms zero dev
// strings survive in dist/.

import { useEffect, useState } from 'react';
import { CosmicCanvas } from './scene/CosmicCanvas';
import { boot } from './store/persistence';
import { DevRoute } from './dev/DevRoute';
import { TitleScreen } from './ui/TitleScreen';
import { GameChrome } from './ui/GameChrome';

export default function App() {
  const [view, setView] = useState<'title' | 'game'>('title');

  useEffect(() => {
    boot();
  }, []);

  return (
    <>
      <CosmicCanvas />
      {view === 'title' ? (
        <TitleScreen onBegin={() => setView('game')} />
      ) : (
        <GameChrome />
      )}
      {import.meta.env.DEV && <DevRoute />}
    </>
  );
}
