# Dark Filaments

An idle clicker that disguises a meditation on entropy, loss, and the cost of consolidation. It starts with a single solar system and builds outward, tier by tier, toward the scale of the cosmic web. Every name in it is real cosmology; nothing is invented.

It is designed as a long-burn game, played in short check-ins over weeks. The universe keeps going while the player is away.

**Status:** in development and not yet deployed. The first tiers run in the new game build with their own 3D scenes; later tiers are designed but not yet built.

## What's in this repo

- `game/` — the game itself: React 19 + TypeScript, Three.js (WebGL2) via React Three Fiber, and Zustand. The simulation runs headless in a Web Worker, with Vitest and Playwright tests and a CI gate.
- `Prototype/` — the original HTML prototype and the JavaScript balance simulator used to tune pacing.
- `Simulator/` — playtest logs and calibration reports.
- `Design Documents/` — the design corpus. Start with `START-HERE-dark-filaments-project-primer.md`.
- `experiments/` — rendering experiments that fed the game's scenes.
- `.claude/agents/` — the Claude Code agents the project is built with: creative, engineering, and science directors, plus specialists for writing, simulation tuning, and documentation.

## Running it locally

```sh
cd game
npm install
npm run dev
```

Tests run with `npm test`.
