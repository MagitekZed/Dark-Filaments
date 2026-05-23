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
// GameChrome and dismisses the title. `view` lives in the store (uiSlice) — the
// engine is already ticking underneath, so Begin only changes which chrome shows.
//
// Return-straight-in (design decision 2026-05-22): a RETURNING player (a valid
// save was restored) lands straight in the game — the dignified, unannounced
// welcome-back (no menu gate, the counter just reads what it reads). Only a
// genuinely FRESH start shows the title — the ceremonial first-entry threshold
// (Begin a new universe / Return to load a save code). The title remains a
// future on-demand destination (reachable from Settings); save-code load and
// start-over are rehomed to Settings rather than forced on every return.
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

import { useLayoutEffect } from 'react';
import { CosmicCanvas } from './scene/CosmicCanvas';
import { boot } from './store/persistence';
import { useStore } from './store';
import { DevRoute } from './dev/DevRoute';
import { TitleScreen } from './ui/TitleScreen';
import { GameChrome } from './ui/GameChrome';

export default function App() {
  // view lives in the store (uiSlice) so the dev elapsed clock can distinguish
  // "on the title menu" from "playing" and count real time only during play.
  const view = useStore((s) => s.appView);
  const setView = useStore((s) => s.setAppView);

  // boot() decides restore-vs-fresh; we land returning players straight in the
  // game and only show the title on a fresh start. useLayoutEffect runs before
  // paint so a returning player never sees a title flash. 'already-booted' is the
  // StrictMode second-invoke — skip it so it cannot override the real verdict.
  useLayoutEffect(() => {
    const decision = boot();
    if (decision.reason !== 'already-booted') {
      setView(decision.mode === 'restore' ? 'game' : 'title');
    }
  }, [setView]);

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
