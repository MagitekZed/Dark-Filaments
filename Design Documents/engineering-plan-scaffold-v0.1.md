# Dark Filaments — Engineering Plan: Scaffold v0.1 (Real Build Stand-Up)

> **Status:** locked plan for the next several sessions of engineering work. Stands up the real React + TypeScript + Three.js game build, ports the tuned engine in headless, absorbs the WebGL2 scene experiment, and structures everything so unbuilt tiers and surfaces attach incrementally on top. Authored 2026-05-21. Built on the 8 ratified architecture decisions (locked — not re-litigated here).

> **Scope (load-bearing):** v0.1 is the **app scaffold + the pieces already in hand**, not a shippable game. Calibration infrastructure stays in the `Prototype/` JS tool. Authoring gaps (most flavor text, T5–T11 numbers, audio, the 13-digit number, aesthetic-direction lock) are explicitly OUT — they attach onto the running scaffold afterward. This plan covers the structural build only.

---

## 1. Project framing

### What v0.1 IS

- A new `game/` directory: a real **React 19 + TypeScript + Vite** application, sibling to `Prototype/` and `experiments/` in the existing monorepo.
- The tuned T1–T4 engine (`data / core / runner / strategy / offline / save / sweep`) ported in as **pure, headless TypeScript** under `game/src/engine/`, with state shapes and function signatures kept **byte-identical** to the prototype so the calibration harnesses port over and prove parity.
- The engine running on a **Web Worker**, with a defined `postMessage` contract; the main thread reflects clicks optimistically for zero-latency tap feel.
- **Zustand**, sliced (`engine` / `ui` / `dev` / `audio`), with narrow selectors so engine ticks don't re-render the world.
- A **clean-break save** (SAVE_VERSION 5, no migration from the prototype's v4) in localStorage.
- The `experiments/galaxy-spike` WebGL2 scene (title→T1 cinematic, procgen solar system, T2 scene, click-feedback pull particles) **absorbed and refactored** into `game/src/scene/`, wired to read engine state, with the named-one-shot-on-purchase and stackable-particle-density content hooks **stubbed** for later authoring.
- **Vitest** for the ported engine harnesses (same fixtures, same assertions), **Playwright** for one UI smoke, **GitHub Actions CI** (typecheck + Vitest + Playwright + bundle-size budget).
- **Local-only** delivery: Vite dev server, on-demand Cloudflare quick tunnel for real-device testing. No hosting commitment.

### What v0.1 IS NOT

- Not a shippable game build. No full-arc playthrough; T5–T11 are not playable.
- Not a content pass. No flavor authoring, no aesthetic-direction lock, no audio.
- Not a calibration retune. The `Prototype/` JS simulator stays alive as the calibration tool; this scaffold does not replace it.
- Not a save-migration exercise. The prototype's v4 saves are abandoned; no back-compat code anywhere. (Standing principle for this whole phase: solo tester, breaking saves/schemas during development is always fine.)
- Not a WebGPU/TSL build. WebGL2 via R3F is the render stack; WebGPU is reserved only for a proven-unbuildable need (none yet).
- Not a deploy. No DNS, no Cloudflare Pages commitment, no production hosting.

### What we're building toward

By the end of v0.1: the real app boots to the title screen, runs the engine on a Worker, plays the T1→T2 arc with live engine-driven mass/MPS/MPC/consolidation, persists across browser sessions, accrues mass on return via the patient-universe offline path, and passes `tsc` + the 4 ported engine harnesses + a Playwright smoke in CI. Every unbuilt tier and surface has a documented seam to attach onto.

### Where this slots in

- **Now → v0.1:** this plan (~9–12 dev sessions, sequenced below).
- **After v0.1:** content attaches tier-by-tier and surface-by-surface (T5–T11 numbers via the existing sim-tuner workflow, flavor authoring, audio chain, Inventory artifact, the 13-digit number, aesthetic lock). Each rides the seams this plan establishes.

### Relationship to the existing artifacts

| Artifact | Disposition under v0.1 |
|---|---|
| `Prototype/src/sim/*.js` (engine) | **Source of the port.** Stays alive as the calibration tool's engine. The `game/` engine is a TS translation held byte-identical. The two diverge only when a deliberate retune lands in both. |
| `Prototype/src/test/*.js` (harnesses) | The 4 locked harnesses (`save_migration_test`, `validate_offline`, `validate_subhalo`, `profiles_smoke`) port to Vitest. The prototype copies stay as the calibration tool's gate. |
| `experiments/galaxy-spike/` | **Source of the scene.** Refactored into `game/src/scene/`. The experiment stays as a sandbox; `game/` becomes the canonical render home. |
| `Prototype/dark-filaments-t1.html` + `src/ui/*` | Not ported. The prototype's vanilla-JS UI is the calibration surface, superseded by the React UI in `game/`. |

---

## 2. System overview

Six systems compose v0.1. They connect through one boundary contract: the **Worker postMessage protocol**, which carries actions one direction and `EngineSnapshot` the other.

| System | Owner module(s) | Purpose |
|---|---|---|
| Headless engine | `game/src/engine/*` | Pure TS port of the tuned sim. Zero React/DOM/Three knowledge. Byte-identical to prototype. |
| Tick scheduler | `game/src/workers/engine.worker.ts` + `game/src/workers/engineClient.ts` | Engine ticks at 1 Hz inside the Worker; posts display snapshots at a few Hz; consumes purchase/click/skip actions. |
| State store | `game/src/store/*` | Zustand, sliced (`engine` / `ui` / `dev` / `audio`). Hydrates `engine` from Worker snapshots; UI subscribes via narrow selectors. |
| Save | `game/src/engine/save.ts` (codec) + `game/src/store/persistence.ts` (lifecycle) | SAVE_VERSION 5, localStorage, clean break from v4. |
| Cosmic scene | `game/src/scene/*` | R3F/WebGL2 scene absorbed from galaxy-spike; reads engine state via selectors; named-one-shot + stackable-density hooks stubbed. |
| UI chrome | `game/src/ui/*` | Edge-Vignette chrome, prose-first upgrade sheet, narrator surfaces, title screen. Ported from the spike's `*UIChrome` work. |

### The connective tissue

The engine never touches the DOM, Three, or React. The Worker owns the only live engine instance. Everything the UI and scene see arrives as an immutable `EngineSnapshot` pushed through `postMessage`. The store hydrates from it; selectors slice it; the scene and chrome read the slices. Clicks are the one exception — reflected optimistically on the main thread for tap latency, then reconciled when the next authoritative snapshot lands.

This is the load-bearing boundary of v0.1. Get the snapshot shape and the action protocol right and everything else is plumbing around it.

---

## 3. Target file tree for `game/`

```
game/
  package.json
  tsconfig.json                       project-references root
  tsconfig.app.json                   app + engine + scene + ui + store
  tsconfig.node.json                  vite.config, scripts
  tsconfig.worker.json                worker (webworker lib, no DOM)
  vite.config.ts                      react plugin + worker format 'es' + bundle-size note
  vitest.config.ts                    node environment for engine harnesses
  playwright.config.ts                one UI smoke; webServer = vite preview
  eslint.config.js                    ported from spike, tightened
  index.html
  .gitignore
  public/

  src/
    main.tsx                          React root mount
    App.tsx                           top-level: title vs running-game route + dev route gate

    engine/                           ── PURE. zero React/DOM/Three imports ──
      data.ts                         UPGRADES, DEFAULT_PARAMS, SAVE_VERSION, TIER metadata
      core.ts                         computeRates, selfContrib, synergyMult, cost, getUpgradeFlavor
      runner.ts                       runSimulation, composeCarryChain, computeCarryover, upgradesForTier, TIER_CONFIGS
      strategy.ts                     decideAction, classify, stackableVpc, oneShotVpc
      offline.ts                      reconstructFromOfflineWindow  (the patient-universe accrual)
      sweep.ts                        sweep core (shared by harness + future in-app dev sweep)
      save.ts                         serializeState / deserializeState / encode / decode / schemaSig
      types.ts                        EngineState, SavePayloadV5, Upgrade, Carry, Params, EngineSnapshot, Action
      index.ts                        public barrel — the engine's entire export surface

    workers/
      engine.worker.ts                owns the live engine; tick loop; message handler
      protocol.ts                     postMessage message types (both directions) — SHARED by worker + client
      engineClient.ts                 main-thread wrapper: spawns worker, sends actions, dispatches snapshots to store

    store/
      index.ts                        create + combine slices; selector exports
      engineSlice.ts                  snapshot hydration (set by engineClient on each snapshot)
      uiSlice.ts                      sheet open, active modal, focus, narrator queue
      devSlice.ts                     debug toggles, time-skip params, free-orbit toggle
      audioSlice.ts                   mute, master volume (no audio engine yet — slice only)
      selectors.ts                    narrow selectors (mass, rates, tier, levels, consolidation, affordable set)
      persistence.ts                  boot-restore + autosave lifecycle; calls engineClient + save.ts

    scene/                            ── R3F / WebGL2 ──
      CosmicCanvas.tsx                the single <Canvas>; standard depth buffer (log-depth reverted, see §12.4); Bloom; camera rig
      sceneParams.ts                  per-tier scene constants (spin, tilt, radii, camera) — fixes spike's magic-number duplication
      cameraRig.tsx                   curated drift + transition tweens; free-orbit gated to dev/Inventory
      tiers/
        T1SolarSystem.tsx             absorbed from spike T1Scene/MainScene composition
        T2StellarNeighborhood.tsx     absorbed from spike T2Scene composition
        T5Galaxy.tsx                  absorbed from spike Galaxy/T5Scene (out-of-arc reference for now)
        registry.ts                   tier → scene component map (the attach point for T3,T4,T6–T11)
      transitions/
        T1ToT2.tsx                    absorbed from spike T1ToT2Transition + transitionTimeline
        transitionRegistry.ts         (fromTier,toTier) → cinematic; default crossfade fallback
      components/                     all reusable scene primitives, absorbed from spike
        Star.tsx Planet.tsx Galaxy.tsx Nebula.tsx PlasmaArcs.tsx Heliopause.tsx
        DeepStarfield.tsx MidStarfield.tsx MilkyWayBand.tsx AsteroidBelt.tsx Comet.tsx
        ZodiacalLight.tsx FieldStarSystem.tsx WolfRayetPlumes.tsx OpenCluster.tsx
        Microlensing.tsx RocheLobeOverflow.tsx StellarKinematics.tsx MovingGroup.tsx
        BrownDwarfs.tsx LocalBubble.tsx Bloom.tsx Starfield.tsx DustHaze.tsx
        BackgroundGalaxies.tsx BlackHole*.tsx MiniPlanet.tsx TwinklingStars.tsx
        discTexture.ts                procedural sprite textures
      feedback/
        PullParticles.tsx             click-feedback dust burst (absorbed)
        pullEvents.ts                 click → world-space spawn bus
        clock.ts                      nowSeconds() = performance.now()/1000  (the spike's clickBoost.ts time helper, salvaged)
      hooks/
        useNamedOneShots.ts           STUB: subscribe to owned one-shots → mount/unmount scene markers (CD-7)
        useStackableDensity.ts        STUB: owned stackable levels → aggregate particle density (CD-7)
        useEngineScene.ts             selector bundle the scene reads (tier, levels, recent purchase)

    ui/
      TitleScreen.tsx                 absorbed from spike TitleScene + TitleChrome
      GameChrome.tsx                  the running-game Edge-Vignette chrome shell
      MassReadout.tsx                 mass + stats line (MPS·MPC·AC/s) with scrim
      ConsolidationBar.tsx            top-edge progress bar
      CausalConnections.tsx           unlabeled static 13-digit number (Act 1 = literal constant)
      UpgradeSheet.tsx                bottom-rising prose-first sheet
      UpgradeCard.tsx                 4 fields only: name / clinical desc / cost / level (+ affordability glow)
      NarratorSurface.tsx             ephemeral fade-in (tier-up + first-purchase) — Two-voice fading register
      ClickVerb.tsx                   rotating clinical verb at the tap point (Pull/Bind/Consolidate/Hold/Reach)
      SettingsGear.tsx                top-right glyph (modal stub)
      ReturnSurface.tsx               quiet welcome-back line (absorbed/reshaped from spike ReturnModal)
      chrome.css                      shared Edge-Vignette styles (consolidates spike's *UIChrome.css)
      fonts.css                       Cormorant Garamond + Inter

    dev/                              ── env-gated: only mounted when import.meta.env.DEV ──
      DevRoute.tsx                    /dev panel mount (tree-shaken from prod build)
      TierSkip.tsx                    jump to tier N
      FastForward.tsx                 dev time-skip via reconstructFromOfflineWindow
      ParamOverrides.tsx              live param edits (cpm, engagement, baseMpc…)
      SnapshotInspector.tsx           raw EngineSnapshot view
      SceneSwitcher.tsx              force-mount any tier scene + free-orbit toggle (authoring camera)
      devActions.ts                   typed dev-only Worker actions

    test/
      engine/
        save_migration.test.ts        ported (clean-break: v5 round-trip; refuses <5 and >5)
        validate_offline.test.ts      ported byte-identical
        validate_subhalo.test.ts      ported byte-identical
        profiles_smoke.test.ts        ported byte-identical
        parity.test.ts                NEW: TS engine vs prototype JS engine, byte-for-byte
      ui/
        boot.smoke.spec.ts            Playwright: title→T1, purchase fires, save round-trips, tier transition

  .github/workflows/
    ci.yml                            typecheck + vitest + playwright + bundle-size budget
```

---

## 4. Module boundaries & API contracts

### 4.1 The engine's public surface (`game/src/engine/index.ts`)

The barrel re-exports exactly what the Worker and harnesses need. **No other module in `game/` imports from `engine/` except the Worker and the test files.** (The store reads snapshots, not the engine; the scene reads the store.) This is the seam that keeps the engine pure.

```ts
// engine/index.ts — the complete public surface
export {
  UPGRADES, DEFAULT_PARAMS, SAVE_VERSION, TIERS,   // data.ts (TIERS = new tier metadata table, §4.7)
} from './data';
export {
  selfContrib, synergyMult, computeRates, cost, getUpgradeFlavor,
  // computeMpc/Mps/Aps retained as named exports for harness parity even though
  // computeRates is the live path — the prototype exports them and parity asserts on them.
  computeMpc, computeMps, computeAps,
} from './core';
export {
  runSimulation, composeCarryChain, computeCarryover, upgradesForTier, TIER_CONFIGS,
} from './runner';
export {
  decideAction, classify, stackableVpc, oneShotVpc,
} from './strategy';
export { reconstructFromOfflineWindow } from './offline';
export {
  serializeState, deserializeState, encodeToken, decodeToken, computeSchemaSig,
} from './save';
export type {
  EngineState, SavePayloadV5, Upgrade, Carry, Params, EngineSnapshot,
  Action, TierMeta, BuyLogEntry, Milestone,
} from './types';
```

**Hard rule (CI-enforceable via ESLint `no-restricted-imports`):** files under `engine/` may not import from `react`, `three`, `@react-three/*`, `zustand`, or any `../scene`/`../ui`/`../store`/`../workers` path. The engine compiles under `tsconfig.worker.json`-compatible libs (no DOM dependency beyond what the prototype already uses — note `localStorage` access in `save.ts` is guarded by `typeof localStorage` exactly as the prototype does, so it stays Worker- and Node-safe).

### 4.2 Engine types (`game/src/engine/types.ts`)

Types are added **over** the existing shapes — the data model is not redesigned. These are the exact field names the prototype uses (verified against `core.js`, `save.js`, `offline.js`).

```ts
export interface Upgrade {
  name: string; tier: number; initCost: number; costGrowth: number;
  maxLevels: number; consolidation: number;
  baseMps: number; addMps: number; selfMps: number;
  baseMpc: number; addMpc: number; selfMpc: number;
  baseAps: number; addAps: number; selfAps: number;
  allMps: number; allMpc: number; allAps: number;
  synergies: Array<{ target: string; multiplier: number; kind?: 'additive' }>;
  carryMpsMult?: number;                 // hidden channel (Subhalo, T3)
  completionist: boolean;
  desc?: string; descByLevel?: string[];
  synergyVariants?: Array<{ provider: string; text: string }>;
}

export interface Carry {
  allMps: number; allMpc: number; allAps: number;
  carryMps: number; carryMpc: number; carryAps: number;
}

export interface EngineState {        // canonical (SavePayload.game) names
  mass: number;
  consolidation: number;
  currentTier: number;
  levels: Record<string, number>;
  carry: Carry;
  consolidationThreshold: number;
  consolidationHitMs: number | null;
  totalClicks: number;
  sessionStart: number;
  totalPausedMs: number;
  massGainedClicks: number;
  massGainedPassive: number;
  massGainedAuto: number;
  tickCount: number;
  tierSnapshots: Array<{ tier: number; levelsAtEnd: Record<string, number> | null; [k: string]: unknown }>;
}

export interface Params {             // mirrors DEFAULT_PARAMS
  tickIntervalMs: number; baseMpc: number; baseMps: number;
  consolidationThreshold: number; consolidationGrowth: number;
  cpm: number; saveVpcThreshold: number;
  longSaveTimeThresholdSec: number; longSaveTolerance: number;
  engagement: number; scenario: 'completion' | 'threshold';
  perTierEngagement: Record<number, number>;
  // worker-runtime additions (not persisted):
  autoCpm?: number; autoclickerOn?: boolean;
}

// The snapshot the Worker posts. Display-shaped — derived, not the raw state.
export interface EngineSnapshot {
  seq: number;                         // monotonic; client drops stale snapshots
  mass: number;
  mps: number; mpc: number; aps: number;
  currentTier: number;
  consolidation: number;
  consolidationThreshold: number;
  consolidationReady: boolean;         // consolidation >= threshold (tier-up gate open)
  levels: Record<string, number>;
  affordable: string[];                // upgrade names the player can afford right now
  recentPurchase: { name: string; tier: number; level: number } | null;   // for first-purchase narrator + scene marker
  recentTierUp: { fromTier: number; toTier: number } | null;
  causalConnections: number;           // static placeholder in Act 1
  paused: boolean;
  // Welcome-back, set once after a boot offline-accrual window:
  offlineReturn: { elapsedSec: number; massGained: number } | null;
}
```

### 4.3 Worker postMessage contract (`game/src/workers/protocol.ts`)

Both directions are explicit and versioned. The client and worker import this shared module so the contract cannot drift between them.

**Main → Worker (`Action`):**

```ts
type Action =
  | { type: 'INIT'; state: EngineState | null; params: Params; offlineSec: number }
        // state=null → fresh universe. offlineSec → boot-time reconstructFromOfflineWindow
        // (pure-idle: cpm 0, allowPurchases false) applied before ticking starts.
  | { type: 'BUY'; upgrade: string }            // purchase request; worker validates affordability authoritatively
  | { type: 'CLICK'; count?: number }           // tap income; count defaults 1 (batched taps)
  | { type: 'SET_PARAMS'; patch: Partial<Params> }   // dev param overrides
  | { type: 'TIER_UP' }                          // commit consolidation gate → next tier (carry recompose)
  | { type: 'SKIP_TO_TIER'; tier: number }       // dev only
  | { type: 'TIME_SKIP'; seconds: number; profileParams: ProfileParams }  // dev fast-forward
  | { type: 'PAUSE'; paused: boolean }
  | { type: 'REQUEST_SAVE' }                     // worker replies with SAVE payload (authoritative state)
  | { type: 'SET_TICK_HZ'; coreHz: number; snapshotHz: number };  // background throttle
```

**Worker → Main:**

```ts
type WorkerMessage =
  | { type: 'SNAPSHOT'; snapshot: EngineSnapshot }       // pushed at snapshotHz (default ~4 Hz)
  | { type: 'SAVE'; payload: SavePayloadV5 }             // reply to REQUEST_SAVE / autosave tick
  | { type: 'TRANSITION'; fromTier: number; toTier: number }  // discrete event: drives scene cinematic
  | { type: 'PURCHASE_OK'; upgrade: string; level: number }   // reconciles optimistic main-thread click/buy
  | { type: 'PURCHASE_REJECTED'; upgrade: string; reason: 'unaffordable' | 'maxed' | 'unknown' }
  | { type: 'ERROR'; message: string };
```

**Cadence (locked):**
- **Core tick:** 1 Hz in foreground (`setInterval`-equivalent inside the Worker; use a self-correcting accumulator against `performance.now()` so drift doesn't accumulate). The engine math is 1 Hz by design — this matches the prototype exactly.
- **Snapshot post:** ~4 Hz (every ~250 ms), coalesced — only post if the snapshot differs meaningfully from the last (mass always changes, so this is effectively "post every 250 ms while unpaused, plus immediately on any discrete event").
- **Discrete events** (`TRANSITION`, `PURCHASE_OK/REJECTED`) post immediately, out of the snapshot cadence, so the scene reacts on the same frame as the player action.
- **Background throttle:** on `document.visibilitychange` to hidden, main sends `SET_TICK_HZ { coreHz: 1, snapshotHz: 0.2 }` (snapshot every 5 s) to spare battery; on visible, restore 1/4. **For long backgrounding the authoritative path is `reconstructFromOfflineWindow` on next visible/boot, not the throttled tick** — the Worker may be frozen by the browser and we do not trust its tick count across a long hidden window. On `visibilitychange` to visible after >N seconds hidden, main re-INITs the Worker with the elapsed-window offline accrual (same path as boot). This is the hard guarantee; the throttled tick is only for smoothness during short backgrounding.

> **Risk flag (Decision 2 — Worker + offline duality):** there are now two code paths that advance mass — the live Worker tick and `reconstructFromOfflineWindow`. They MUST agree. The prototype already proves they agree (`validate_offline` asserts ≤0.1% drift over a 10-min replay). The gotcha in the port is the *handoff*: when we re-INIT the Worker with an offline-accrued state after a long hidden window, we must avoid double-counting the boundary second. Mitigation: the offline window is `[lastTickWallClock, now)`; the Worker resets its internal accumulator to `now` on INIT. Add a parity assertion in `validate_offline.test.ts` for the re-INIT handoff specifically (not just boot). This is the single most likely place for a subtle mass bug.

### 4.4 The Worker tick loop (`engine.worker.ts`)

The Worker holds the only mutable engine state. Its loop mirrors the prototype's playtest tick (the same `core.computeRates` → mass accrual → strategy-free player-driven purchases). Key point: **in the real game the player buys, not the strategy** — `decideAction` is NOT in the live loop. The Worker handles `BUY` actions directly (validate cost via `core.cost`, decrement mass, increment level, recompute consolidation). `decideAction`/`strategy.ts` is only used by `reconstructFromOfflineWindow` (when `allowPurchases` is true — which boot never sets) and by the harnesses. So in v0.1 the live game uses: `data`, `core`, `runner.composeCarryChain` (on tier-up), `offline` (pure-idle on return), `save`. The full `strategy` + `sweep` modules port for harness parity but aren't on the live path.

### 4.5 Zustand slices (`game/src/store/`)

Sliced so an engine tick touching `mass` doesn't re-render the upgrade sheet.

```ts
// engineSlice — hydrated by engineClient on each SNAPSHOT
interface EngineSlice {
  snapshot: EngineSnapshot | null;
  applySnapshot(s: EngineSnapshot): void;        // drops stale seq; sets snapshot
  optimisticMass: number;                         // main-thread click reflection
  reflectClick(mpc: number): void;                // bumps optimisticMass immediately
}
// uiSlice — sheet/modal/focus/narrator queue
interface UiSlice {
  sheetOpen: boolean; activeModal: 'settings' | null;
  narratorQueue: NarratorLine[]; pushNarrator(l: NarratorLine): void; shiftNarrator(): void;
}
// devSlice — only meaningful on the dev route
interface DevSlice {
  showInspector: boolean; freeOrbit: boolean; forcedTier: number | null;
  timeSkipSeconds: number; /* … */
}
// audioSlice — slice only; no audio engine in v0.1
interface AudioSlice { muted: boolean; masterVolume: number; }
```

**Hydration:** `engineClient` calls `store.getState().applySnapshot(snapshot)` on each `SNAPSHOT` message. Selectors (`selectors.ts`) read `snapshot.*`:

```ts
export const selectMass         = (s) => s.optimisticMass > (s.snapshot?.mass ?? 0) ? s.optimisticMass : s.snapshot?.mass ?? 0;
export const selectRates        = (s) => ({ mps: s.snapshot?.mps ?? 0, mpc: s.snapshot?.mpc ?? 0, aps: s.snapshot?.aps ?? 0 });
export const selectTier         = (s) => s.snapshot?.currentTier ?? 1;
export const selectLevels       = (s) => s.snapshot?.levels ?? {};
export const selectConsolidation= (s) => ({ value: s.snapshot?.consolidation ?? 0, threshold: s.snapshot?.consolidationThreshold ?? 0, ready: s.snapshot?.consolidationReady ?? false });
export const selectAffordable   = (s) => s.snapshot?.affordable ?? [];
```

Components subscribe with `useStore(selectMass)` etc. — narrow slices, no whole-snapshot subscriptions. The optimistic-click reconciliation: `reflectClick` bumps `optimisticMass`; when the next snapshot's `mass` exceeds it, `selectMass` falls back to authoritative. The scene reads `selectTier`/`selectLevels`/`recentPurchase` only — **never the Worker directly.**

### 4.6 Save v5 payload (`SavePayloadV5`)

Clean break. Same structural shape as the prototype's v4 `SavePayload.game` (so `offline.ts` and the harnesses port unchanged), but `SAVE_VERSION = 5` and **`deserializeState` refuses anything `< 5` and anything `> 5`** — no migration code. The `mpsFloor/mpcFloor/apsFloor` → `carryMps/carryMpc/carryAps` translation that the prototype did at the boundary is **dropped**: the React engine uses canonical `carry.*` names natively from the start (the live state IS the canonical shape, since there's no legacy playtest UI feeding relic names). This is a genuine simplification the clean break buys us.

```ts
interface SavePayloadV5 {
  version: 5;
  savedAt: number;
  schemaSig: string;                  // FNV-1a over UPGRADES (tier:name|…), same algorithm as prototype
  game: EngineState;                  // canonical names throughout — no relic translation
  meta: { appBuild: string; lastTier: number; };
}
```

Token codec (`encodeToken`/`decodeToken`, `DF5.{base64}.{crc}`) ports from the prototype's planned E2 shape but is **optional for v0.1** — localStorage round-trip is the gate; the token is a convenience for handing dev saves between machines. Keep it if the port is cheap (it is — pure functions), drop to a follow-up if it fights `CompressionStream` typing.

### 4.7 New tier metadata table (`TIERS` in `data.ts`)

The prototype derives tier names ad hoc. The scaffold needs an explicit `tier → { name, sceneId, transitionInId }` table so the scene registry and chrome can resolve a tier without hardcoding. This is **new structure layered over the existing data, not a data-model change** — it reads the same tier numbers the engine already uses.

```ts
export const TIERS: Record<number, TierMeta> = {
  1: { name: 'Solar System',          act: 1, peak: false },
  2: { name: 'Stellar Neighborhood',  act: 1, peak: false },
  3: { name: 'Dwarf Spheroidal',      act: 1, peak: false },
  4: { name: 'Galactic Arm',          act: 1, peak: false },
  5: { name: 'Galaxy',                act: 1, peak: false },
  6: { name: 'Local Group',           act: 1, peak: true  },   // PEAK
  7: { name: 'Galactic Cluster',      act: 2, peak: false },   // Eridanus Reach pivot
  8: { name: 'Supercluster',          act: 2, peak: false },
  9: { name: 'Filament',              act: 2, peak: false },
  10:{ name: 'Cosmic Web',            act: 2, peak: false },   // INVERSION
  11:{ name: 'Causal Horizon',        act: 2, peak: false },   // final
};
```

(Tier 8/9 display names should be confirmed against `gameplay-design.md` §1 during E1 — I'm reading them from the renumber bullets in CLAUDE.md and have not cross-checked the §1 table. Flag for verification, not a blocker.)

---

## 5. The engine-port checklist (parity-gated)

**This is the first work and it gates everything else. The TS engine must produce byte-identical output to the prototype JS engine before any Worker, store, scene, or UI work proceeds.**

### 5.1 Mechanical port steps

1. **Copy, don't rewrite.** For each of `data / core / runner / strategy / offline / save / sweep`, copy the prototype `.js` body into the corresponding `.ts`, strip the IIFE wrapper + UMD shim, convert `global.DF.sim.X = {…}` to ES `export`. Preserve every comment (they document the calibration history and the load-bearing math). Preserve every numeric literal exactly.
2. **Resolve cross-module references.** The prototype's `deps()` pattern (`offline.js`, `runner.js` reach into `DF.sim.*` or `require()`) becomes plain `import { core } from './core'`. The lazy-resolution gymnastics go away — ES modules handle load order.
3. **Add types over shapes (`types.ts`).** Annotate the copied bodies. Do NOT change a single computation. Where the JS used `s.levels[u.name]` with implicit `undefined`, keep the `if (!N) continue` guards — they are load-bearing (an unowned upgrade reads `undefined`, falsy, skipped).
4. **`save.ts` clean-break edits:** drop the `mpsFloor→carryMps` translation; `SAVE_VERSION = 5`; `deserializeState` refuses `!= 5`. Everything else (FNV-1a `computeSchemaSig`, the localStorage guards) ports verbatim.
5. **ESLint guard:** add `no-restricted-imports` blocking `react`/`three`/`zustand`/scene/ui/store from `engine/**`.
6. **`tsc` clean** under strict TS (the spike's tsconfig is the baseline; `noUnusedLocals`/`noUnusedParameters` on). The prototype's unused-var-tolerant JS will surface a few — fix by removal, never by behavior change.

### 5.2 Porting the 4 harnesses to Vitest

Each prototype harness is a Node script using `require('../sim/X.js')` and a hand-rolled assert/counter. Port pattern:

- Replace `require('../sim/data.js')` (side-effect that attaches to `window.DF`) + `const X = require('../sim/X.js')` with `import * as engine from '../../engine'`.
- Wrap each existing assertion block in Vitest `test(...)` / `expect(...)`. **The assertion VALUES are copied verbatim** — these are the byte-identical fixtures (T1 11m 40s, T2 1h 8m, the 56/38/28/396 check counts, the exact mass/level outputs). The check COUNT must match: `save_migration` → 56, `validate_offline` → 38, `validate_subhalo` → 28, `profiles_smoke` → 396.
- `save_migration.test.ts` is the one that changes semantically (clean break): drop the v1/v2/v3-refused-load assertions, add v5-round-trip + `<5 refused` + `>5 refused`. The check count will differ from 56 here and that's expected and correct — document the delta.

### 5.3 The parity gate (`parity.test.ts`) — NEW, load-bearing

This is the proof that the TS port didn't drift. It runs **both engines** and asserts byte-equality.

- The prototype JS engine is loadable from Node today (UMD shims). Import it via a small fixture loader that `require`s the prototype files from `../../../Prototype/src/sim/` (relative path from `game/src/test/engine/`). The prototype stays in the repo, so this path is stable.
- For a battery of scenarios (T1 full run, T2 full run with carry, T3 with the Subhalo hidden channel, T4, a `reconstructFromOfflineWindow` pure-idle window, a `runSimulation` at the canonical seed/cpm), call the **same function on both engines** and `expect(tsResult).toEqual(jsResult)` on the full returned object (mass, levels, carry, consolidation, milestones).
- **Gate:** parity.test.ts must be green before E2 (Worker) starts. If it's red, the port has a bug and nothing downstream is trustworthy.
- Tolerance: **exact** for integer/level fields; the prototype already runs deterministic float math (no RNG in the core path; `runSimulation` is deterministic; only the harness's engagement-profile sampling uses seeded mulberry32, which we don't exercise in parity beyond fixed seeds). Use `toEqual` (exact) first; if IEEE-754 reordering from the IIFE-strip causes last-bit differences, fall back to `toBeCloseTo` at 12 sig-figs and document why — but the expectation is exact, since we're not reordering operations.

### 5.4 Verification before claiming the port done

- `tsc --noEmit` clean.
- All 4 ported harnesses green at their expected check counts (with the documented `save_migration` delta).
- `parity.test.ts` green (exact byte-equality across the scenario battery).
- ESLint `engine/**` import-purity rule green.

---

## 6. Scene absorption plan

The galaxy-spike is further along than a "spike" — it has a full T1 solar system, a full T2 stellar neighborhood with conditional upgrade components, a 10-second T1→T2 cinematic, a title screen, click-feedback pull particles, two UI chromes, and a ReturnModal. The absorption is a **refactor-in-place-then-move**, not a rebuild.

### 6.1 Move + restructure

1. **Lift the renderer config into `CosmicCanvas.tsx`.** The spike has a `<Canvas>` per scene (`MainScene`, `T1Scene`, `T2Scene`, `T5Scene`) each redefining camera/dpr/gl. Consolidate to one `CosmicCanvas` that takes a `tier` prop, mounts the tier's scene from `scene/tiers/registry.ts`, and owns the shared rig (Bloom, background layers, camera). **Use the standard depth buffer** (`gl={{ antialias: true }}`). *(Originally specced as `gl={{ logarithmicDepthBuffer: true }}` per Decision 8; reverted 2026-05-22 — see §12.4 for the root cause and rationale. Standard depth is correct-by-default for the stylized, per-tier-bounded scenes; the extreme-scale span is handled across tiers via separate scenes + transitions, never as one frame.)*
2. **Extract `sceneParams.ts` per tier.** NOTES.md flags the magic-number duplication explicitly (spin rate duplicated across `Galaxy.tsx`/`TwinklingStars.tsx`; the `rotation={[Math.PI/2.3, 0.18, 0]}` repeated across 5 BlackHole components). Pull every "must-match-across-components" constant into `sceneParams.ts` keyed by tier. This is the NOTES.md "couplings to fix in the real scaffold" task, done during absorption.
3. **Components move verbatim** into `scene/components/` (they're already clean R3F). The seeded-RNG + primitive-`useMemo`-deps pattern (NOTES.md "Bugs hit and fixed") is already in `Nebula.tsx`/`OpenCluster.tsx` — preserve it; it's the codebase pattern.
4. **Tier scenes** (`T1Scene`/`T2Scene`/`T5Scene` + `MainScene`'s composition) become `scene/tiers/T1SolarSystem.tsx` etc. `MainScene` and `T1Scene` overlap heavily (MainScene is the title→T1 unified canvas); fold MainScene's title-phase logic into `cameraRig.tsx` + `TitleScreen.tsx` and keep one T1 scene composition.
5. **Transitions:** `T1ToT2Transition.tsx` + `transitionTimeline.ts` → `scene/transitions/T1ToT2.tsx`, registered in `transitionRegistry.ts`. Other (fromTier,toTier) pairs fall back to a default crossfade until authored.

### 6.2 Wire to engine state (the key change)

Today the spike scenes drive themselves from mock controls (`T2Controls`, dev panels, hardcoded click economy in the chromes). In `game/` they read the engine:

- **Tier mounting:** `CosmicCanvas` reads `selectTier` → mounts `registry[tier]`. A `TRANSITION` worker message (or `recentTierUp` on the snapshot) triggers the cinematic via `transitionRegistry`.
- **Conditional upgrade components → `useNamedOneShots` hook (STUB).** The spike already mounts upgrade visuals conditionally (Wolf-Rayet activation, Microlensing, etc.). In `game/`, `useNamedOneShots.ts` subscribes to `selectLevels`, diffs against owned one-shots, and returns a mount/unmount list with a `freshStart` flag (the NOTES.md activation pattern). v0.1 wires the **mechanism** (purchase a one-shot → its scene component mounts with `freshStart=true`) and stubs the **content** (which component maps to which one-shot beyond the handful the spike already built). The CD-7 rule ("named one-shots are universe events") is satisfied structurally; per-tier content attaches later.
- **Stackable density → `useStackableDensity` hook (STUB).** Reads stackable levels → returns aggregate particle-count/glow scalars the background components consume. v0.1 wires the plumbing for T1/T2 (the spike's economy already drives some of this); higher tiers attach later.
- **Click feedback:** `PullParticles` + `pullEvents` move over; the tap handler calls `engineClient.send({type:'CLICK'})` AND `store.reflectClick(mpc)` (optimistic) AND fires a `pullEvents` spawn — the visual is independent of the authoritative income, so tap feel is instant.

### 6.3 TS-error cleanup (Decision 8 wants `tsc` passing in CI)

The brief flags two known errors; verified against the source:

1. **Unused `sgn` in `Galaxy.tsx`** (line 13: `const sgn = () => (Math.random() < 0.5 ? 1 : -1)`). Either delete it or use it — `noUnusedLocals` is on. Quick: delete if no consumer; grep confirmed it's declared.
2. **drei `OrbitControls` ref-type mismatch across ~6 scene files** (`MainScene`, `T1Scene`, `T1UITestScene`, `T2Scene`, `T2UITestScene`, `T5Scene` all carry `controlsRef`/`OrbitControlsImpl`). The spike works around it with a hand-rolled `type OrbitControlsImpl = { reset: () => void }`. In `game/`, fix once: a shared `useOrbitControlsRef()` hook in `cameraRig.tsx` typed against drei's actual `OrbitControlsChangeEvent`/`OrbitControlsProps['ref']` element type (`three-stdlib`'s `OrbitControls`), eliminating the per-file workaround. Since the curated-camera decision (NOTES.md) reserves free-orbit for dev/Inventory, most tier scenes won't even mount `OrbitControls` in shipped mode — the ref lives in `cameraRig.tsx` behind the `devSlice.freeOrbit` gate, so the mismatch is solved in exactly one place.

Run `tsc --noEmit` on the absorbed scene as the acceptance gate for the absorption phase.

### 6.4 Camera philosophy (carried from NOTES.md)

Curated camera by default; free orbit gated to dev (`devSlice.freeOrbit`) and the future Inventory artifact. `cameraRig.tsx` owns curated drift + transition tweens; `OrbitControls` mounts only when `freeOrbit` is true. This bakes the locked decision into the architecture rather than leaving it to each scene.

---

## 7. Phased implementation sequence

Phases written top-down so a fresh session executes in order. Owner column: `app-developer` does code execution under engineering-director supervision; `Plan`/architecture-level checks loop in as noted.

### Phase G0 — Repo + tooling stand-up
**Estimate:** 0.5 session. **Prereqs:** none. **Blocks:** everything.
- Create `game/` (sibling to `Prototype/`, `experiments/`). `npm create vite@latest` React-TS, then align deps to the spike's proven versions (R3F 9, drei 10, three 0.184, React 19 — **RESOLVED 2026-05-21: React 19 locked** in the tech stack via rules-guardian, matching the proven spike; the prior "CLAUDE.md says React 18" tension is gone. Pin React 19 + R3F 9 to the spike's versions).
- Add Vitest, Playwright, ESLint (port spike's config + add `engine/**` import guard).
- tsconfig project references: app / node / worker split.
- `vite.config.ts`: react plugin, `worker: { format: 'es' }`, build target.
- Skeleton `App.tsx` + `main.tsx` that renders "Dark Filaments" so the dev server boots.
- **Verify:** `npm run dev` serves; `tsc --noEmit` clean on the skeleton; `git` shows `game/` tracked.

### Phase G1 — Engine port + parity gate
**Estimate:** 1.5 sessions. **Prereqs:** G0. **Blocks:** G2, G3, G5. **The critical first deliverable.**
- §5.1 mechanical port of all 7 engine modules + `types.ts` + `index.ts` barrel.
- §5.2 port the 4 harnesses to Vitest.
- §5.3 build `parity.test.ts` against the prototype JS engine.
- **Verify (§5.4):** `tsc` clean; 4 harnesses green at expected counts; parity green; import-purity green. **Do not proceed to G2 until parity is green.**

### Phase G2 — Worker + store + optimistic clicks
**Estimate:** 1.5 sessions. **Prereqs:** G1. **Blocks:** G4 (UI), G6 (scene wiring).
- `protocol.ts` (the §4.3 contract), `engine.worker.ts` (the §4.4 tick loop — player-driven BUY, not strategy), `engineClient.ts`.
- Zustand slices (§4.5) + `selectors.ts`.
- Optimistic click reflection + reconciliation.
- A throwaway debug DOM readout (mass/MPS/tier) to prove the loop end-to-end before any real UI.
- **Verify:** open dev server, click → mass rises instantly (optimistic) and reconciles on next snapshot; BUY → level increments authoritatively, PURCHASE_REJECTED surfaces on unaffordable; manual tier-up via a temp button recomposes carry; `validate_offline.test.ts` extended with the re-INIT handoff parity assertion (§4.3 risk flag) and green.

### Phase G3 — Save + persistence + offline boot
**Estimate:** 1 session. **Prereqs:** G1 (save.ts), G2 (engineClient). **Blocks:** the patient-universe return + welcome-back.
- `persistence.ts`: boot-restore (read localStorage → INIT worker with `offlineSec = now - savedAt`, pure-idle accrual) + 10 s autosave (REQUEST_SAVE → write) + save-on-`beforeunload` + save-on-tier-up.
- `visibilitychange` re-INIT path for long backgrounding (§4.3).
- `offlineReturn` surfaced on the snapshot → `ReturnSurface.tsx` (quiet, unannounced — load-bearing welcome-back rule).
- **Verify:** buy upgrades, refresh → state restored; close tab for a measured gap, reopen → mass accrued matches a hand-computed pure-idle window; `save_migration.test.ts` green; refusing a `version: 4` save starts fresh.

### Phase G4 — Scene absorption
**Estimate:** 2 sessions. **Prereqs:** G0 (can start in parallel with G1/G2; wiring needs G2). **Blocks:** nothing downstream; the visual layer.
- §6.1 move + restructure (CosmicCanvas, sceneParams, components, tiers, transitions).
- §6.3 TS-error cleanup (the `sgn` unused + the OrbitControls ref-type fix).
- §6.2 wire to engine state for T1/T2 (tier mount via selector, click feedback → engineClient, `useNamedOneShots`/`useStackableDensity` STUBS with the mechanism live for the upgrades the spike already built).
- **Verify:** `tsc` clean on absorbed scene; T1 scene renders driven by engine tier; tap fires PullParticles + engine CLICK; buying a one-shot the spike supports mounts its scene component with `freshStart`. **UI/feel verified by human — flag that the agent cannot verify visual feel.**

### Phase G5 — UI chrome on engine state
**Estimate:** 1.5 sessions. **Prereqs:** G2 (selectors), G4 (scene to layer over). **Blocks:** the Playwright smoke.
- Absorb the spike's `T1UIChrome`/`T2UIChrome`/`TitleChrome` into `ui/` as engine-driven components (§3 ui tree): MassReadout, ConsolidationBar, CausalConnections (static), UpgradeSheet + prose-first UpgradeCard (4 fields, affordability glow from `selectAffordable`), NarratorSurface (fading register), ClickVerb (rotating, clinical), SettingsGear (stub), TitleScreen.
- Replace all mock-economy reads with selectors.
- Tier-up gate: ConsolidationBar `ready` → a Consolidate affordance → `engineClient.send({type:'TIER_UP'})` → transition cinematic.
- **Verify:** chrome reads live engine; upgrade cards show real cost/level; affordability glow on real affordability; consolidation gate fires real tier-up. Human verifies feel.

### Phase G6 — Dev route + tooling
**Estimate:** 1 session. **Prereqs:** G2 (worker actions), G3 (offline for time-skip). **Parallelizable** with G5.
- `dev/DevRoute.tsx` mounted only when `import.meta.env.DEV` (tree-shaken from prod). Env-gated route (e.g. `/dev` or a key-toggle like the spike's backtick).
- TierSkip (`SKIP_TO_TIER`), FastForward (`TIME_SKIP` via `reconstructFromOfflineWindow` with `allowPurchases` per a buyer profile), ParamOverrides (`SET_PARAMS`), SnapshotInspector, SceneSwitcher (force-mount any tier + free-orbit toggle for authoring).
- **Verify:** prod build (`vite build`) contains no dev code (grep the bundle); dev route skips tiers, fast-forwards, overrides params; free-orbit toggle works for scene authoring.

### Phase G7 — CI + Playwright smoke + bundle budget
**Estimate:** 1 session. **Prereqs:** G1–G5. **The acceptance gate for v0.1.**
- `playwright.config.ts` + `boot.smoke.spec.ts`: app boots to title → Begin → T1 chrome visible → a tap raises mass → a programmatic BUY increments a level → reload restores state → a forced consolidation fires a tier transition. (Drive the engine via a dev/test hook to avoid waiting real calendar time — e.g. a test-only `TIME_SKIP` or seeded high-mass INIT.)
- `.github/workflows/ci.yml`: on push → `tsc --noEmit` + `vitest run` + `playwright test` + bundle-size budget check (fail if `dist/` main chunk exceeds a set ceiling — pick an initial budget like 1.5 MB gzipped for the three-heavy build and tighten later).
- **Verify:** CI green on a clean push; intentionally break parity → CI red; bundle over budget → CI red.

### Critical path

```
G0 → G1 → G2 → G3 ┐
                  ├→ G7 (CI gate)
G0 → G4 ──────────┤
G2 → G5 ──────────┘
G2/G3 → G6 (parallel with G5)
```

- **Critical path:** G0 → G1 → G2 → G5 → G7 ≈ **6 sessions** (G3 and G4 parallelize against the path; G6 parallels G5).
- **Total work:** **~9–12 sessions.**
- **Parallelizable:** G4 (scene absorption) can run alongside G1/G2 since absorption + TS-cleanup don't need the engine wired until the end of G4. G6 (dev tooling) parallels G5 (UI). G1 is the one hard serialization point — nothing real proceeds until parity is green.

### Appendix: phase summary table

| Phase | Estimate | Prereqs | Output |
|---|---|---|---|
| G0 Repo + tooling | 0.5 | — | `game/` boots; tsc clean skeleton |
| G1 Engine port + parity | 1.5 | G0 | Headless TS engine; 4 harnesses + parity green |
| G2 Worker + store + clicks | 1.5 | G1 | Live tick loop off the render thread; sliced store |
| G3 Save + offline boot | 1.0 | G1, G2 | Persistence + patient-universe return |
| G4 Scene absorption | 2.0 | G0 (wire needs G2) | Engine-driven cosmic scene; TS errors gone |
| G5 UI chrome | 1.5 | G2, G4 | Prose-first chrome on live engine |
| G6 Dev route + tooling | 1.0 | G2, G3 | Env-gated tier-skip / fast-forward / overrides |
| G7 CI + smoke + budget | 1.0 | G1–G5 | GitHub Actions gate |

---

## 8. Testing strategy

| Layer | Tool | What it guards |
|---|---|---|
| Engine math | Vitest (`parity.test.ts`) | The TS port drifting from the tuned JS engine. Exact byte-equality across a scenario battery. The single most important test in the build. |
| Engine harnesses | Vitest (4 ported) | The T1–T4 numerical lock. Same fixtures, same assertions (56/38/28/396, with the documented `save_migration` clean-break delta). |
| Worker/offline duality | Vitest (`validate_offline.test.ts` + re-INIT handoff assert) | Mass double-counting at the offline→live handoff (§4.3 risk). |
| Save round-trip | Vitest (`save_migration.test.ts`) | v5 round-trip; `<5`/`>5` refusal. |
| UI smoke | Playwright (`boot.smoke.spec.ts`) | Boot → tap → buy → save → tier-transition end-to-end. One test, not a suite. |
| Import purity | ESLint (`no-restricted-imports`) | `engine/**` accidentally importing React/Three/Zustand — the seam that keeps the engine portable. |
| Bundle size | CI budget check | Three.js + R3F bloat creeping past a ceiling. |
| Visual feel | **Human only** | Camera, click feedback, narrator timing, chrome legibility. The agent explicitly cannot verify feel — this is called out per phase. |

**Locked harnesses (must stay green after any engine edit):** `parity.test.ts`, `validate_offline.test.ts`, `validate_subhalo.test.ts`, `profiles_smoke.test.ts`, `save_migration.test.ts`. The prototype's copies stay as the calibration tool's gate; the two sets diverge only when a deliberate retune lands in both.

---

## 9. CI config shape (`.github/workflows/ci.yml`)

```yaml
name: game-ci
on:
  push: { paths: ['game/**'] }
  pull_request: { paths: ['game/**'] }
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: game } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: game/package-lock.json }
      - run: npm ci
      - run: npx tsc -b --noEmit            # typecheck (project references)
      - run: npx vitest run                  # engine harnesses + parity
      - run: npx playwright install --with-deps chromium
      - run: npm run build                   # vite build (also typechecks via tsc -b)
      - run: npx playwright test             # webServer: vite preview (built artifact)
      - run: node scripts/bundle-budget.mjs  # fail if dist main chunk > ceiling
```

Notes: `paths: ['game/**']` keeps CI from firing on prototype/design-doc edits. `bundle-budget.mjs` reads `dist/` chunk sizes and exits nonzero past the ceiling. Playwright runs against the built artifact (`vite preview`) so the smoke validates the real bundle, not just dev mode.

---

## 10. Dev tooling (env-gated)

All dev tooling lives under `game/src/dev/` and mounts only when `import.meta.env.DEV` is true, so it tree-shakes out of the production build entirely (verified in G6 by grepping `dist/`). It maps directly onto Worker actions:

| Tool | Worker action | Purpose |
|---|---|---|
| TierSkip | `SKIP_TO_TIER` | Jump to tier N to author/test higher-tier scenes without a full playthrough. |
| FastForward | `TIME_SKIP` (via `reconstructFromOfflineWindow`) | Math-based dev time-skip — the patient-universe rule's dev-tooling carve-out. |
| ParamOverrides | `SET_PARAMS` | Live-edit cpm/engagement/baseMpc for feel-tuning. |
| SnapshotInspector | — (reads store) | Raw `EngineSnapshot` view for debugging. |
| SceneSwitcher | (local) | Force-mount any tier scene + free-orbit toggle — the scene-authoring camera. |

This honors the dev-tooling carve-out in the load-bearing rules: tier-skip / fast-forward / debug speed are dev-only and never reach the player-facing build.

---

## 11. Out-of-scope (explicit — attach later)

Mark these so a fresh session does not pull them into v0.1. Each names where it attaches.

- **Content authoring — flavor text.** Clinical upgrade-card one-liners (~50–90 lines), first-purchase narrator lines beyond what the spike mocked, tier-up lines T4–T11. Attach: `data.ts` desc fields + `NarratorSurface` content. *(T1–T3 first-purchase + tier-up lines exist in the spike's `T2NarratorSurface` and can ride along where already authored — but no new authoring in v0.1.)*
- **T5–T11 numerical calibration.** The engine ports with the current data.js values (T1–T4 locked, T5+ stale-pending-retune). v0.1 plays the T1–T2 arc; higher tiers mount scenes but are not numerically tuned. Attach: the existing sim-tuner workflow against the `Prototype/` tool, then port locked numbers into `game/src/engine/data.ts` (and re-run parity).
- **Audio.** `audioSlice` is a slice with no engine behind it. No Web Audio / Tone / Howler in v0.1. Attach: a future `game/src/audio/` chain wired to tier/event signals.
- **The 13-digit Causal Connections value.** Renders the placeholder `8,419,302,776,043`, static. The scientifically-sound value is a separate TO-DO. Attach: `data.ts` constant + `CausalConnections.tsx`.
- **Aesthetic-direction lock.** The scene absorbs the spike's current look; this is not an aesthetic-finalization pass. Color/palette/bloom/typography refinement attach later via creative-director direction.
- **Act 2 named-connection-break system.** The `causalConnections` decrement, the *Causal Connections* label fade-in, dim-points-on-loss — none of this is built. v0.1 holds the number static (correct for Act 1). Attach: an Act-2 event system reading authored break beats.
- **Inventory artifact.** Final-tier reveal, dim-points scroll, free-orbit. v0.1 reserves `freeOrbit` in `cameraRig` and the dev route uses it for authoring; the Inventory surface itself is later.
- **Save token UX, QR, multi-universe, Settings page functionality.** Token codec ports as pure functions if cheap; the UX around it (download/.dfsave/drop-import) is later. Settings gear is a stub.
- **Hosting / deploy / DNS.** Local-only (Vite dev + Cloudflare quick tunnel). Cloudflare Pages and darkfilaments.io are deferred.
- **WebGPU/TSL.** Reserved for a proven-unbuildable WebGL2 need. None identified.
- **The prototype's calibration UI.** Stays in `Prototype/`. Not ported.

Anything in this list that surfaces during the build is **not** v0.1 scope — surface it to the user as a deferred attach-later item.

---

## 12. Risks & implementation gotchas in the 8 decisions

Not re-litigating — surfacing real gotchas to handle during execution.

1. **Worker + offline duality (Decision 2).** Two paths advance mass (live tick, `reconstructFromOfflineWindow`). They must agree, and the re-INIT-after-long-hidden handoff is where double-counting hides. *Mitigation:* §4.3 boundary-second discipline + a dedicated handoff parity assertion in `validate_offline.test.ts`. **Highest-attention item in the build.**
2. **Optimistic click vs authoritative snapshot (Decision 2/3).** If the optimistic `optimisticMass` and the authoritative `snapshot.mass` desync (e.g. a buy spends mass on the Worker but the optimistic value didn't account for it), the counter can visibly jump backward. *Mitigation:* optimistic reflection covers clicks only (additive, monotonic); BUY waits for `PURCHASE_OK`. `selectMass` takes `max(optimistic, authoritative)` so it never jumps down from a click; a BUY's mass decrement always comes from the authoritative snapshot. Watch for the case where a click and a buy race.
3. **React 19 lock (Decision 8/stack) — RESOLVED 2026-05-21.** The earlier React-18-vs-19 tension is gone: the tech stack now locks **React 19** (rules-guardian-vetted), matching the working spike (React 19 + R3F 9). *Residual gotcha to honor during execution:* R3F 9 targets React 19, so pin the spike's proven versions; do not downgrade to R3F 8 / React 18. Note the captured incompatibility — `@react-three/postprocessing` 3.0.4 throws an invalid-hook error under R3F 9 + React 19, so the spike (and v0.1) use a hand-rolled bloom pass instead (see §12.4 + NOTES.md). That is a postprocessing-library gotcha, not a reason to revisit the React 19 lock.
4. **`logarithmicDepthBuffer` — REVERTED 2026-05-22 (Decision 8 §12.4 amendment).** Decision 8 originally specced `logarithmicDepthBuffer: true` for forward-looking extreme-scale depth precision; G4 enabled it and re-verified bloom (the gotcha originally tracked here). It is now **OFF** (`CosmicCanvas.tsx` → `gl={{ antialias: true }}`). **Root cause:** the absorbed scenes use custom `ShaderMaterial`s (Star/Planet, hand-written GLSL) that do NOT implement the log-depth chunks, while built-in materials (e.g. the solar-prominence `pointsMaterial`) DO — two incompatible depth encodings in one buffer broke depth tests (prominences rendered on top of a planet transiting the sun). **Rationale for disabling rather than patching every shader:** the scenes are stylized and bounded per tier; the truly extreme scale span is handled ACROSS tiers via separate scenes + transitions, never as one frame, so standard depth is correct-by-default and needs no per-shader cooperation (the spike ran fine without it). Keeping log-depth would force every current AND future custom shader to remember the log-depth chunks or silently reintroduce the bug — a recurring footgun plus a `gl_FragDepth` perf cost for precision nothing currently uses. **If a future scene genuinely needs single-frame extreme precision, re-introduce log-depth SCOPED to that scene and make its shaders log-depth-aware then.** Engineering decision (engineering-director domain), user-approved; no load-bearing design rule depends on it, so no rules-guardian pass. The hand-rolled `UnrealBloomPass` via `useFrame` priority is unaffected by the revert.
5. **Engine purity vs `localStorage` in `save.ts` (Decision 1).** `save.ts` touches `localStorage`, which doesn't exist in a Worker or Node. The prototype already guards with `typeof localStorage === 'undefined'`. *Gotcha:* keep that guard; the codec functions (`encode/decode/serialize/deserialize`) stay pure and the I/O functions (`writeLocalSave` etc.) are the only impure ones — and persistence runs on the **main thread**, not the Worker, so the Worker never calls them. Be deliberate about which side owns localStorage I/O: **main thread (`persistence.ts`) owns it; the Worker only produces/consumes the `SavePayloadV5` object via `REQUEST_SAVE`/`SAVE` messages.**
6. **Clean-break carry-name simplification (Decision 4).** Dropping the `mpsFloor→carryMps` translation is correct and simpler, but it means `offline.ts` and the harnesses (which already speak canonical `carry.*`) port unchanged while `save.ts` loses code. *Gotcha:* make sure no ported test fixture asserts on the relic names — grep the harnesses for `mpsFloor`/`mpcFloor`/`apsFloor` during G1 and confirm none leak into v5 fixtures.
7. **Scene reads store, never Worker (Decision 3/8).** Easy to accidentally pass `engineClient` into a scene component for "convenience." *Mitigation:* `useEngineScene.ts` is the only scene→state hook; it reads selectors. No scene component imports `engineClient`. Consider an ESLint rule blocking `workers/` imports from `scene/**`.
8. **Snapshot coalescing vs scene reactivity (Decision 2).** At ~4 Hz snapshots, a fast tap-buy might land between snapshots and feel laggy in the scene (the chrome is optimistic, but a one-shot's scene marker mounts off `recentPurchase` which only arrives on a snapshot). *Mitigation:* discrete events (`PURCHASE_OK`, `TRANSITION`) post immediately out-of-cadence (§4.3) so scene markers and cinematics fire on the action frame, not the next snapshot tick.

---

## 13. Pickup checklist for a fresh session

1. **Read `CLAUDE.md`** — load-bearing rules (especially: prose-first cards, two-voice UI, the static Act-1 number, named-one-shots-are-universe-events, the patient universe) and the locked tech stack.
2. **Read this plan end to end.**
3. **Read the 8 ratified architecture decisions** (in the task that spawned this plan / the design-doc header) — they are locked; build on them.
4. **Read `experiments/galaxy-spike/NOTES.md`** — the bug catalog (seeded-RNG/primitive-deps, R3F uniform-clone trap, `THREE.Clock` vs `performance.now`, frustum-culling sentinels, the bloom workaround, the optimize-deps cache gotcha) and the magic-number couplings to fix.
5. **Skim `Prototype/src/sim/core.js` + `save.js` + `offline.js`** — the math, the save shape, the load-bearing function. These are the port source of truth.
6. **Start with G0 (repo stand-up), then G1 (engine port + parity gate).** Do not start G2/G4/G5 until `parity.test.ts` is green — the parity gate is the foundation everything stands on.
7. **React version — RESOLVED 2026-05-21: React 19 locked** (§12.3). No longer a decision to surface; pin React 19 + R3F 9 to the spike's proven versions in G0.
8. **Default delegation:** code execution → `app-developer`; architecture-level checks (Worker contract, slice boundaries, scene registry shape) → `Plan`; any change touching load-bearing rules (e.g. the dev route as a non-player surface, the static-number rendering) → `rules-guardian`; scene/feel intent → `creative-director`; cosmology terms in `TIERS`/scene → `science-director`.
9. **After each phase:** update CLAUDE.md state-of-play via `doc-keeper`; the prototype's current-state.md is unaffected (the prototype isn't changing), but a new `game/` doc or a state-of-play bullet captures scaffold progress.

### Files to create first (G0 + G1)

- `game/package.json`, `game/tsconfig*.json`, `game/vite.config.ts`, `game/vitest.config.ts`, `game/eslint.config.js`
- `game/src/engine/{data,core,runner,strategy,offline,sweep,save,types,index}.ts` (ports of `Prototype/src/sim/*.js`)
- `game/src/test/engine/{save_migration,validate_offline,validate_subhalo,profiles_smoke,parity}.test.ts`

### Verification before claiming v0.1 done

- `tsc -b --noEmit` clean across all project references.
- All 5 locked Vitest harnesses green (parity + 4 ported, with documented `save_migration` clean-break delta).
- `boot.smoke.spec.ts` green (title → T1 → tap → buy → save round-trip → tier transition).
- `vite build` succeeds; dev code absent from `dist/`; bundle under budget.
- A human has verified T1/T2 visual feel (camera, click feedback, chrome legibility) — the agent cannot, and says so.
- CI green on a clean push to `game/**`.

---

*Authored 2026-05-21 as the scaffold stand-up plan. Built on the 8 ratified architecture decisions. The React version question is RESOLVED (2026-05-21: React 19 locked). Next pickup: a fresh session against G0 → G1.*
