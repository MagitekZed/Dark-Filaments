# Dark Filaments — Engineering Plan: Long-Burn v1 (Dev-Tool Remodel)

> **Status:** locked plan for the next several weeks of engineering work. Synthesizes the engineering-director and sim-tuner specs into a single executable sequence. Updated 2026-05-12.

> **Scope (load-bearing):** v1 is a **dev-tool remodel**, not a shippable build. Everything here is calibration infrastructure. Player-facing polish lands in a later pass when we move toward shipping.

---

## 1. Project framing

### What v1 IS

- A remodel of the existing JS-in-prototype simulator into a **calibration apparatus for the long-burn pacing model** (5–6 weeks engaged Completion / 7–8 weeks engaged Threshold).
- The tooling that lets sim-tuner verify the patient-universe math — offline mass accrual, engagement-profile playthroughs, and the T8/T9 inversion — at calendar scale, on demand, in seconds of wall-clock time.
- A persistent dev-environment save so the engineering-director and sim-tuner can hand state to each other between sessions.

### What v1 IS NOT

- Not a shippable game build.
- Not a non-dev playtest surface. No external playtesters at this stage.
- Not a player-facing welcome-back experience. No narrator polish around offline returns.
- Not a multi-tab / multi-universe / settings-page UI surface.
- Not the React/Three.js scaffold. The migration to that stack remains a separate, later workstream.

### What we're building toward

The first long-burn calibration sweep. By the end of v1, sim-tuner can produce a markdown report that answers: *does the current upgrade tree, played by realistic player models against realistic engagement profiles, land within the calendar-time bands locked in `gameplay-design.md` §1?* The report must surface drift (±15% at primary pairings) so retuning is targeted.

### Where this slots in

- **Now → v1 ship**: this plan (~6–10 dev sessions, sequenced below).
- **After v1**: first long-burn calibration sweep → likely retune of T1–T4 numbers under M☉ units → T5–T10 design work (separate workstream).
- **After calibration stabilizes**: React + TS + Three.js scaffold migration (separate workstream).

---

## 2. System overview

Five systems compose v1. They share one piece of connective tissue: `reconstructFromOfflineWindow`, the pure function that produces a `{newMass, newCohesion, buyLog, ...}` payload given `(savedState, elapsedSeconds, profileParams)`.

| System | Owner module(s) | Purpose |
|---|---|---|
| LocalStorage persistence | `src/sim/save.js` (new) | Single dev save autosaved every ~10 s; loaded on boot; readable across browser sessions. |
| Save token export/import | `src/sim/save.js` + `src/ui/saves.js` (new) | `DF1.{base64}.{crc}` wire format for handing saves between humans/sessions. |
| Patient-universe offline accrual | `src/sim/offline.js` (new) — owns `reconstructFromOfflineWindow` | Pure math: given a saved state and an elapsed window, return the resulting state. Buyer profile decides which purchases happen. |
| Math-based dev time-skip | `src/ui/devtools.js` (extend) | "Skip 6 hours" button calls `reconstructFromOfflineWindow` against the current live state. |
| Engagement-profile harness | `src/test/harness.js` (new) + supporting profile catalog | Node-only multi-pairing simulation runner. Generates the markdown calibration report. |

### The connective tissue

`reconstructFromOfflineWindow(savedState, elapsedSeconds, profileParams) → { newState, buyLog, milestones }`

A pure function. Same inputs always produce same outputs. Used in three places:

1. **App boot** (`save.js` calls it once after loading from localStorage with `elapsedSeconds = now - savedAt`, capped at 24h per locked decision S1).
2. **Dev time-skip** (`devtools.js` calls it with an arbitrary user-supplied elapsedSeconds).
3. **Harness simulation** (`harness.js` calls it inside a loop that slices a multi-week playthrough into engagement-profile windows).

This single function is the load-bearing artifact of v1. Everything else is plumbing around it.

---

## 3. Architecture

### File-level design

**New files:**

```
Prototype/src/
  sim/
    save.js                   localStorage I/O + token codec (DF1.{base64}.{crc})
    offline.js                reconstructFromOfflineWindow + buyer-profile logic
    profiles.js               engagement-profile + buyer-profile catalogs
  ui/
    saves.js                  Save-token export/import UI strip (textarea + buttons)
    devtools.js               consolidates time-skip + reset-universe + existing dev affordances
  test/
    harness.js                Node-only multi-pairing harness; CLI entry point
    save_migration_test.js    Round-trip save serialization + version-migration tests
    validate_offline.js       Sanity tests for reconstructFromOfflineWindow
    profiles_smoke.js         Smoke run of all 12 pairings at small N for CI-ish use
  reporting/
    template.md               (optional) Markdown template the harness fills in
```

**Files touched:**

```
Prototype/
  dark-filaments-t1.html      Add boot-time save-load call; add Saves tab/strip
  src/
    sim/
      data.js                 Add SAVE_VERSION constant; nothing else
      runner.js               Expose composeCarryChain in a way harness can call directly
      strategy.js             Add buyer-profile parameter pass-through (no logic change)
    ui/
      playtest.js             Replace "fresh session on refresh" with "load from save"
      parameters.js           Add "Reset universe" button + confirmation
      simulator.js            (no behavior change; may add a save-state inspect panel)
```

**Files unchanged:** `core.js`, `store.js`, all design docs (this plan IS the doc for v1; design docs only update if behavior touches load-bearing rules — handled via rules-guardian if so).

### Module boundaries

- `sim/save.js` knows about localStorage and the wire format. Nothing else.
- `sim/offline.js` knows about how a player would act during an offline window. It does not know about localStorage or the UI.
- `sim/profiles.js` is a flat data file. Pure constants. No logic.
- `ui/*` modules know about the DOM. They do not own simulation state directly; they read it from `store.js` and write it via documented action functions.
- `test/harness.js` is Node-only. It imports `sim/*` directly (those modules must remain side-effect-free at module load).

### API contracts

```js
// sim/save.js
SAVE_VERSION: number                                // current schema version
serializeState(liveState): SavePayload              // selects which fields persist
deserializeState(savePayload): liveState            // inverse, with version migration
encodeToken(savePayload): string                    // -> "DF1.{base64}.{crc}"
decodeToken(token): SavePayload | { error }
writeLocalSave(savePayload): void                   // wraps localStorage.setItem
readLocalSave(): SavePayload | null                 // wraps localStorage.getItem
clearLocalSave(): void                              // for "reset universe"

// sim/offline.js
reconstructFromOfflineWindow(
  savedState,                                       // SavePayload (post-deserialize)
  elapsedSeconds,                                   // number; harness slices it
  profileParams                                     // BuyerProfile + tier-aware engagement
): {
  newState,                                         // mutated live state shape
  buyLog,                                           // ordered Array<PurchaseEvent>
  milestones,                                       // tier-up / completionist / threshold-hit moments
  endReason                                         // "wallclock-exhausted" | "tier-up" | "DNF"
}

// sim/profiles.js
TIMING_PROFILES: { [name]: TimingProfile }          // 8 profiles
BUYER_PROFILES: { [name]: BuyerProfile }            // 5 profiles
REALISTIC_PAIRINGS: Array<{ timing, buyer, weight }>// 12 pairings + weight flag

// test/harness.js (Node CLI)
//   node src/test/harness.js --pairing engaged-steady-x-completionist --n 50 --target t10
//   node src/test/harness.js --report --primary-only
```

### State schema (saveable state)

```js
// SavePayload (the canonical persisted shape)
{
  version: 1,                                       // SAVE_VERSION
  savedAt: 1715520000000,                           // Date.now() at save
  schemaSig: "<sha-ish of UPGRADES.id+order>",      // detects upgrade-tree changes
  game: {
    mass: 1.234e15,
    cohesion: 0.42,                                 // engine field name relic
    currentTier: 4,
    levels: { "Solar Wind": 99, /* ... */ },
    carry: { allMps, allMpc, allAps, carryMps, carryMpc, carryAps },
    cohesionThreshold: 15.625,
    cohesionHitMs: null,                            // tier-local; nullable
    totalClicks: 123456,
    sessionStart: 1715000000000,                    // ms; for "calendar time"
    // mass-from-* counters preserved for the report
    massGainedTotal, massGainedClicks, massGainedPassive, massGainedAuto
  },
  meta: {
    appBuild: "long-burn-v1",                       // for debug
    devSkipsApplied: 3,                             // counter; informational
    lastEngagementProfile: "engaged-steady"
  }
}
```

Not persisted: `log`, transient UI flags, pause state, autoclicker on/off. The log resets on each session — keeps the save tiny. (The harness has its own buy log; that's separate.)

### Test strategy per module

| Module | Test approach |
|---|---|
| `save.js` | `save_migration_test.js`: round-trip serialize → token → decode → deserialize; verify byte-identical state; verify v0 → v1 migration path; verify CRC rejects tampered tokens. |
| `offline.js` | `validate_offline.js`: against the existing runner. Build a state, run the runner for N ticks, then call `reconstructFromOfflineWindow` against the same starting state for N seconds — assert resulting mass/cohesion/levels match within rounding tolerance. |
| `profiles.js` | No tests; pure data. The harness exercises it. |
| `harness.js` | `profiles_smoke.js`: small-N run over all 12 pairings; assert no crashes, all DNFs flagged, report renders. |
| Integration | One end-to-end smoke: boot app → buy stuff → close tab → re-boot → state restored → verify reported mass/cohesion match pre-close + offline accrual delta. |

---

## 4. Implementation phases (sequenced, with dependencies)

Phases are written so a fresh session can read top-down and execute. Each lists prerequisites, deliverables, and verification.

### Engineering Phase 1 - LocalStorage save (E1)

**Estimate:** 1 session.
**Prereqs:** none.
**Blocks:** E2, E3, E4, E5 (everything that follows needs the persisted state shape).

**Deliverables:**

- `src/sim/save.js` with `serializeState`, `deserializeState`, `writeLocalSave`, `readLocalSave`, `clearLocalSave`, `SAVE_VERSION = 1`, `schemaSig` derived from `UPGRADES`.
- Boot-time integration in `dark-filaments-t1.html` and `ui/playtest.js`: replace fresh-session-on-refresh with load-from-save-else-start-fresh. Existing pause and log-reset semantics on refresh stay; this only adds state restoration.
- Autosave: 10 s interval `setInterval` while not paused. Also save on End Tier, skip_to_tier, and beforeunload.
- Reset-universe button in `ui/parameters.js` (under a confirmation modal). Wipes localStorage and reloads.

**Verification:** smoke test - buy upgrades, refresh browser, confirm state restored. `save_migration_test.js` round-trip test.

### Engineering Phase 2 - Save token codec + UI (E2)

**Estimate:** 0.5-1 session.
**Prereqs:** E1.
**Blocks:** ability to hand saves between humans and sessions.

**Deliverables:**

- `encodeToken` and `decodeToken` in `src/sim/save.js`. Format `DF1.{base64-of-gzip-or-deflate-compressed-json}.{crc32}`. If browser compression is annoying (`CompressionStream` is fine in modern browsers but check), fall back to plain base64.
- `src/ui/saves.js`: a small strip (lives under the Parameters tab for v1; not its own tab to keep the existing 3-tab shell unchanged) with Export current save, Import save token, and a textarea.
- `decodeToken` rejects on CRC mismatch with a clear error string; UI surfaces the error inline.

**Verification:** `save_migration_test.js` extended - export to token, import back, assert byte-identical save.

### Engineering Phase 3 - Offline accrual math (E3)

**Estimate:** 1.5-2 sessions.
**Prereqs:** E1 (state schema must be locked).
**Blocks:** E4 (dev time-skip), all sim-tuner harness work past Phase 1.

**Deliverables:**

- `src/sim/offline.js` exporting `reconstructFromOfflineWindow(savedState, elapsedSeconds, profileParams)`.
- Tick simulation under the hood: reuses `core.computeRates` for rate math; reuses (a refactored variant of) `strategy.decideAction` for purchase decisions, parameterized by buyer profile.
- The function does NOT mutate input. It returns a new state.
- Buyer profile contract: a small object describing decision biases (`saveVpcThreshold`, `completionistAggressiveness`, `idleClickRate`). Strategy reads from it instead of from `DEFAULT_PARAMS`.
- 24-hour offline cap applied at the call site (boot loader), not inside the function. The function itself accepts any positive elapsedSeconds - the harness needs that flexibility.

**Verification:** `validate_offline.js` - equivalence with `runner.runSimulation` for fixed-tick replays. Tolerance: numerical drift due to dt aggregation strategy is acceptable if documented; harness assumes <=0.1% delta on mass over a 10-min replay.

**Note on dt strategy:** the patient universe is continuous in the design but the engine is 1 Hz. For offline windows, integrate analytically by summing 1 s ticks in a loop. For very long windows (hours or days) this becomes expensive; if so, batch into N-second blocks where strategy cannot fire (between purchases) and integrate the closed-form mass accrual. Decision: start with the brute-force 1 Hz loop; optimize later if harness runs exceed ~30 s per pairing.

### Engineering Phase 4 - Dev time-skip tool (E4)

**Estimate:** 0.5 session.
**Prereqs:** E3.
**Enables:** sim-tuner Phase 5 (top-down mass tooling).

**Deliverables:**

- In `src/ui/devtools.js` (or extend the existing dev strip in `playtest.js`), add a Skip forward control: numeric input (default 6 hours) + go button.
- Calls `reconstructFromOfflineWindow` against the current live state. Replaces the live state with the result.
- Logs a `dev_time_skip` event into `state.log` capturing pre and post mass + duration.
- Same panel hosts: a Save state to clipboard shortcut (same as Export current save), a Force autosave debug button.

**Verification:** manual smoke; one full T1 to T4 playthrough using time-skip alone (not normal play); confirm matches the harness output for the same pairing.

### Engineering Phase 5 - Save token export/import polish (E5)

**Estimate:** 0.5 session.
**Prereqs:** E2.
**Independent of:** other phases past E1/E2.

**Deliverables:**

- Copy token and Download .dfsave buttons.
- Import accepts paste OR `.dfsave` file drop.
- Inline display of token metadata (version, savedAt, mass, currentTier) before commit.

This is small but important: it is the artifact channel through which the user can hand saves to the next session.

### Sim-Tuner Phase 1 - Harness skeleton (S1)

**Estimate:** 1 session.
**Prereqs:** can run in parallel with E1/E2.
**Blocks:** S2+.

**Deliverables:**

- `src/test/harness.js` skeleton: CLI argument parsing (`--pairing`, `--n`, `--target`, `--report`, `--primary-only`, `--seed`).
- Wires to existing `runner.runSimulation` for the per-session inside-window math.
- Stubs the multi-window loop (offline math integration deferred to after E3).
- Reporting scaffold: per-tier summary tables, pairing comparison tables. Writes to `Simulator/reports/<timestamp>.md` + `<timestamp>.csv`.

**Verification:** running `node src/test/harness.js --pairing engaged-steady-x-completionist --n 5 --target t4` produces a report. Report contents are stub-filled but format is correct.

### Sim-Tuner Phase 2 - Primary pairings end-to-end (S2)

**Estimate:** 1.5 sessions.
**Prereqs:** E3, S1.

**Deliverables:**

- Multi-window loop in harness using `reconstructFromOfflineWindow`.
- The two **primary pairings** (locked under decision C1): engaged-steady x completionist and engaged-steady x consolidation-threshold. These are the calibration deciders.
- Per-pairing report sections: calendar-time distribution (p10/p50/p90), DNF count (excluded from percentiles per C2), key milestones table.
- Drift detection: compare p50 to `gameplay-design.md` section 1 targets; flag entries exceeding +/-15% (per C6).

**Verification:** report passes a manual read against the design-doc targets. Numbers may be off - the report is the verification surface, not green/red lights.

### Sim-Tuner Phase 3 - Secondary timing/buyer profiles (S3)

**Estimate:** 1 session.
**Prereqs:** S2.

**Deliverables:**

- All 8 timing x 5 buyer combinations exposed, but only the 12 realistic pairings exercised by default.
- Secondary pairings run at N = 20-30 (vs primary 50, per C5).
- Reference pairings (e.g., bot-100cpm x greedy-vpc-1.5 - the old simulator regime) run at N = 10 for sanity.

**Verification:** report renders all pairings without crashing. Active-decay tiers (T1-T3 / T4-T6 / T7-T10 per C3) behave distinctly across timing profiles.

### Sim-Tuner Phase 4 - Mass-target band + DNF rules (S4)

**Estimate:** 0.5 session.
**Prereqs:** S3.

**Deliverables:**

- Mass-target band: each run ends successfully if it reaches 70-100% of tier end-mass within the budget (per C4).
- DNF rules locked: timing/buyer combinations that cannot reach the band within the calendar budget are flagged DNF and excluded from p10/p50/p90.
- DNF counts reported alongside percentiles.

**Verification:** induce a DNF (run drift x idle-clicker against T10 with a 3-day budget); confirm it is flagged and excluded correctly.

### Sim-Tuner Phase 5 - Top-down mass tooling (S5)

**Estimate:** 0.5 session.
**Prereqs:** E4.

**Deliverables:**

- Harness can start a run from a non-zero state - e.g., what does the next 2 weeks look like if starting at T6, mass = 1e15 solar masses?
- Reuses dev time-skip mechanics under the hood.
- Useful for calibrating individual tiers without running the full preceding stack.

**Verification:** start a run at T4 with arbitrary mass; confirm output is internally consistent with a full-stack run that reached the same state.

### Sim-Tuner Phase 6 - Calibration runs + report (S6)

**Estimate:** 1 session (the work itself, after which retune sessions happen on demand).
**Prereqs:** S2-S5.

**Deliverables:**

- A baseline run of all 12 pairings against the current calibration.
- Markdown report + CSV committed to `Simulator/reports/<timestamp>/`.
- Drift summary at the top of the report: which tiers, which pairings, drift direction.

This is the apparatus delivering its first answer.

### Critical path

```
E1 -> E3 -> S2 -> S3 -> S4 -> S6
                       \
                        S5 (parallel after E4)

E2, E4, E5 hang off E1/E3 but do not block calibration delivery.
S1 can run parallel to E1/E2.
```

**Critical path length:** E1 + E3 + S2 + S3 + S4 + S6 ~= 6-7 sessions.
**Total work:** ~9-11 sessions.

Parallelizable: E2/E5 and S1 can be done in slack moments around E1/E3. E4 needs E3 first but is small.

---

## 5. Engagement profile catalog

Captured here so a fresh session has everything in one place. These are sim-tuner's locked profiles.

### Timing profiles (8)

How often the player checks in, for how long, and how clicky they are in-session.

| Profile | Daily check-ins | Minutes/session | In-session cpm | Notes |
|---|---|---|---|---|
| `engaged-steady` | 3 | 15 | 100 | Locked design baseline. PRIMARY. |
| `engaged-high` | 3 | 20 | 150 | Power user. |
| `engaged-burst` | 2 | 25 | 130 | Longer sessions, fewer of them. |
| `casual-steady` | 1 | 15 | 90 | Casual baseline. |
| `casual-evening` | 1 | 30 | 100 | One bigger session per day. |
| `drift-light` | 0.4 | 10 | 80 | 2-3 per week. May DNF. |
| `bot-100cpm` | continuous | continuous | 100 | Legacy reference. |
| `bot-60cpm` | continuous | continuous | 60 | Legacy reference. |

### Buyer profiles (5)

How the player decides what to buy when they have mass.

| Profile | `saveVpcThreshold` | Completionist appetite | Notes |
|---|---|---|---|
| `completionist` | 1.5 | always buy completionists | PRIMARY. |
| `consolidation-threshold` | 1.5 | never buy completionists | PRIMARY. |
| `greedy-vpc-1.5` | 1.5 | sometimes (default strategy) | Legacy reference. |
| `lazy-stackable` | 1.2 | never; prefers cheap stackables | Stress test. |
| `idle-clicker` | 1.5 | never; almost no in-session purchases | DNF-prone. |

### Realistic pairings (12)

Of the 8 x 5 = 40 combinations, these 12 are the ones we actually run; others are available but informative only.

| # | Timing x Buyer | N | Weight |
|---|---|---|---|
| 1 | engaged-steady x completionist | 50 | **PRIMARY** |
| 2 | engaged-steady x consolidation-threshold | 50 | **PRIMARY** |
| 3 | engaged-high x completionist | 30 | secondary |
| 4 | engaged-burst x completionist | 30 | secondary |
| 5 | casual-steady x completionist | 30 | secondary |
| 6 | casual-steady x consolidation-threshold | 30 | secondary |
| 7 | casual-evening x consolidation-threshold | 20 | secondary |
| 8 | drift-light x consolidation-threshold | 20 | secondary (DNF expected on T10) |
| 9 | engaged-steady x lazy-stackable | 20 | stress |
| 10 | engaged-steady x idle-clicker | 20 | stress |
| 11 | bot-100cpm x greedy-vpc-1.5 | 10 | legacy reference |
| 12 | bot-60cpm x greedy-vpc-1.5 | 10 | legacy reference |

Per decision C1, calibration decisions are made against rows 1-2. Rows 3-10 inform. Rows 11-12 cross-check against the existing T1-T4 calibration so we do not regress that work.

---

## 6. Reporting format spec

The report has to be readable in 2-3 minutes. Per-tick output is forbidden.

### File layout per run

```
Simulator/reports/2026-05-15_long-burn-baseline/
  report.md              what the user reads
  raw.csv                per-run terminal state + percentiles for spreadsheet drilling
  buy_logs/              per-pairing condensed buy logs (key moments only)
    p1_engaged-steady_completionist.csv
    p2_engaged-steady_consolidation-threshold.csv
    ...
```

### `report.md` structure (target: 1-2 pages)

```markdown
# Long-burn calibration - <timestamp>

## Headline
- Build: long-burn-v1, calibration hash <sha>
- Pairings: 12 (2 primary, 8 secondary, 2 reference)
- Total runs: 290, DNFs: 17 (excluded from percentiles)
- Calibration verdict: <within-band | drift detected at T5, T8>

## Primary pairings (calibration-deciding)

### Engaged x Completionist (N=50)
| Tier | p50 calendar | p10/p90 | Target | Drift | Flag |
|---|---|---|---|---|---|
| T1 | 3.2 h | 2.1 / 4.8 h | 2-4 h | within | - |
| T5 | 6.4 d | 5.2 / 7.6 d | 5-7 d | within | - |
| T9 | 5.1 d | 4.2 / 6.1 d | 3-4 d | +27% | **HIGH** |
| ... | | | | | |
| Total | 5.8 weeks | 5.1 / 6.7 weeks | ~5-6 weeks | within | - |

### Engaged x Consolidation-Threshold (N=50)
(same shape)

## Cross-pairing comparison
| Timing x Buyer | DNF | Total p50 | T5 p50 | T9 p50 |
|---|---|---|---|---|
| engaged-steady x completionist | 0/50 | 5.8 weeks | 6.4 d | 5.1 d |
| engaged-steady x cons-threshold | 0/50 | 7.4 weeks | 4.8 d | 8.9 d |
| ... | | | | |

## Key milestones (median, across primary pairings)
| Pairing | First completionist | Save-mode duration (cumulative) | First T5 entry | Inversion crossover |
|---|---|---|---|---|
| ... | | | | |

## Anomalies / flags
- T9 drift +27% on engaged x completionist - inversion under-firing.
- drift-light x cons-threshold DNFs at T8 (10/20 runs).

## What to do next
- (Suggested retune actions, written by sim-tuner as a paragraph)
```

### Buy-log shape (key moments only)

Per-pairing CSV, one row per significant event. Significant = first purchase of each upgrade, every completionist purchase, every tier-up, every threshold-hit, every save-mode entry/exit, every offline-window boundary that crosses an hour. Not every purchase. Estimate: 100-200 rows per multi-week playthrough.

### `raw.csv` shape

One row per run: pairing, seed, DNF flag, terminal mass, terminal tier, per-tier calendar time, total clicks, click income share at each tier. Used for spreadsheet drilling if a deeper investigation is warranted.

---

## 7. Test strategy

### Per-phase verification

| Phase | What verifies it | Risk it guards |
|---|---|---|
| E1 | `save_migration_test.js` round-trip | Schema drift silently corrupts state |
| E2 | `save_migration_test.js` token round-trip | Token format breaks; saves un-importable |
| E3 | `validate_offline.js` parity with runner | Offline math diverges from live tick math |
| E4 | Manual smoke + one full playthrough | Time-skip drops state |
| E5 | Manual smoke | Token UX bugs |
| S1 | `profiles_smoke.js` | Harness crashes on edge pairings |
| S2 | Manual read of report against design targets | Report format is unreadable |
| S3 | Smoke covers all 12 pairings | One pairing crashes silently |
| S4 | Induced DNF case | DNFs pollute percentiles |
| S5 | Top-down vs full-stack consistency | Mid-tier starts diverge from full plays |
| S6 | Report committed | Apparatus produces deliverable |

### Load-bearing harnesses (locked)

- **`save_migration_test.js`** - must run green after every `save.js` change, including any `SAVE_VERSION` bump. Tests round-trip + migration paths.
- **`validate_offline.js`** - must run green after every `offline.js` change. Tests parity with `runner.runSimulation` within tolerance.
- **`profiles_smoke.js`** - small-N smoke covering all 12 pairings; quick sanity for any harness change.

Existing harnesses to preserve (do not regress):
- `validate.js` - T1 PASS/FAIL against playtests.
- `t3_calibrate.js`, `t4_calibrate.js` - tier-specific calibration probes.
- `t3_curve_shape.js`, `t4_curve_shape.js` - decile shape diagnostics.

### Regression risks

1. **Save schema drift.** If `SavePayload` shape changes without a `SAVE_VERSION` bump, existing saves silently corrupt. Mitigation: `save_migration_test.js` fixture covering known prior shapes.
2. **Offline math divergence.** If `offline.js` and `runner.js` get out of sync (e.g., a strategy bug fixed in one but not the other), saves restored on boot read wrong. Mitigation: `validate_offline.js` parity test as a CI-ish gate.
3. **schemaSig false negatives.** If `UPGRADES` is reordered without affecting math, `schemaSig` triggers a meaningless save-invalid warning. Mitigation: sig is content-derived (id + order), and a manual override path exists for dev use.
4. **Harness wall-clock explosion.** Naive 1 Hz integration over 6 weeks = 3.6M ticks. 50-run N x 12 pairings x 3.6M ticks = 2.2B simulated ticks. Mitigation: optimize the between-purchase math to closed-form once measured.

---

## 8. Out-of-scope (explicit)

Mark these so a fresh session does not accidentally pull them into v1:

- **QR codes** for save transport. Token export/import only.
- **Welcome-back narrator voice / modals.** No player-facing copy on save reload. Resume silently.
- **Multi-tab handling.** Single-tab dev assumption. If a second tab opens, behavior is undefined; we accept that.
- **Universe naming / multi-universe saves.** One dev save per browser.
- **Settings page UI.** No player-facing settings.
- **Audio architecture.** Deferred.
- **React/Three.js scaffold.** Separate workstream entirely.
- **T6-T10 design content.** Stale pending redesign; v1 calibrates against T1-T4 math + design-doc targets for T5-T10 (which are best-current-thinking, not validated).
- **CMB through-line authoring.** Deferred.
- **Inventory UX.** Deferred.

Anything in this list that surfaces during build is **not** in v1 scope. Surface it to the user as a deferred item.

---

## 9. Pickup checklist for new session

For whoever resumes work against this plan (likely a fresh Claude Code session):

1. **Read `CLAUDE.md`** at project root. Pay attention to the load-bearing rules and the state-of-play.
2. **Read `Design Documents/gameplay-design.md` section 1 (the long-burn lock)** for context on what the calendar-time targets are and why.
3. **Read this plan** end to end.
4. **Read `Prototype/dark-filaments-t1-current-state.md` section 9 (Code structure)** for the existing file layout in the prototype.
5. **Start with Engineering Phase 1 (E1 - LocalStorage save).** Do not start sim-tuner work until E1 is in.
6. **Default delegation:** engineering work goes to `app-developer` agent under engineering-director supervision; harness/report work goes to `sim-tuner`. Cross-cutting design questions go to `creative-director`.
7. **After each phase:** update CLAUDE.md state-of-play (via `doc-keeper`) with a one-line bullet capturing what shipped.
8. **Status updates:** maintain a `Simulator/reports/v1-progress.md` log - one short entry per phase landed. Mirror entries in CLAUDE.md state-of-play.

### Files to touch first (E1 specifically)

- Create `Prototype/src/sim/save.js`
- Create `Prototype/src/test/save_migration_test.js`
- Modify `Prototype/dark-filaments-t1.html` (boot-time save load) - minimal change
- Modify `Prototype/src/ui/playtest.js` (replace fresh-session-on-refresh)
- Modify `Prototype/src/ui/parameters.js` (add reset-universe button)
- Modify `Prototype/src/sim/data.js` (add `SAVE_VERSION = 1`)

### Verification before claiming E1 done

- Buy upgrades, refresh, see them restored.
- `node src/test/save_migration_test.js` exits 0.
- Existing `validate.js` still PASSes at 60/100 cpm (no regression).
- `dark-filaments-t1-current-state.md` updated via `doc-keeper`.

---

## 10. Open items that may surface during build

Things the engineering director anticipates may need re-decision once implementation starts. Surface them now so the fresh session knows what to bring back.

1. **Compression in the browser.** `CompressionStream` works in modern browsers, but if any dev target is older, fall back to plain base64. Token size may roughly double if uncompressed; for v1 that is fine - these are not being typed by hand.
2. **schemaSig change semantics.** If a sig mismatch happens (e.g., an upgrade name is tweaked during T5 design work), what is the right behavior? Options: (a) refuse to load, (b) load with a warning, (c) load and offer a migrate affordance. Recommend (b) for v1 dev tool; revisit before ship.
3. **Strategy refactor scope.** `decideAction` currently reads from `DEFAULT_PARAMS`. Phase E3 wants per-buyer-profile params. The clean refactor is to make `strategy.decideAction(state, upgrades, params)` fully pure (it mostly is) and pass profile params explicitly. If that refactor surfaces hidden coupling, scope creep risk. Flag at start of E3.
4. **Offline window granularity.** 1 Hz simulation over 6 weeks may be slow. If runs exceed ~30 s per pairing, the harness will need a closed-form integration pass between purchase events. Bring that decision back to the user when measurement happens.
5. **Per-tier engagement curve interaction with engagement profiles.** Existing `perTierEngagement` (in `DEFAULT_PARAMS`) was designed for the bot-time framing. Under engagement profiles, in-session engagement is different from what fraction of the wall clock is in-session. Need to confirm during S2 which axis the curve modulates. Likely: `perTierEngagement` becomes in-session attention - multiplies cpm during a check-in. Offline windows are governed separately by the timing profile. **Surface to creative-director if the framing shift changes anything narrator-facing.**
6. **Active-decay tier boundaries (C3 says T1-T3 / T4-T6 / T7-T10).** Need a defined active-decay curve per band - how does in-session attention fall off across the band? Sim-tuner to propose; user to confirm.
7. **Mass denominated in solar masses.** Design says T1=~1 M_sun, T10=~5e22 M_sun. Current T1 calibration uses arbitrary mass units. The denomination switch is a sim-tuner pass after long-burn calibration stabilizes - flag that **v1 explicitly does not re-denominate**; we calibrate against the shape targets first, the absolute-scale rewrite is downstream. Confirm with user before starting if they want denomination folded in earlier.
8. **Reset-universe vs. tier-skip.** Both write to the same save. If a tester uses tier-skip and then notices a bug, they currently lose their pre-skip state. Decision: that is acceptable for v1 (per S4). But if it bites in practice, consider an undo-one-skip buffer.
9. **The `state.log` is not persisted.** This means session reports cover only the current browser session, not the full universe history. For a dev tool that is fine. Buy-log persistence for analysis lives in the harness, not the save. If the user wants in-app multi-session buy-log review, that is out of scope.

---

## Appendix: phase summary table

| Phase | Owner | Estimate | Prereqs | Output |
|---|---|---|---|---|
| E1 LocalStorage save | app-developer | 1 session | - | Persistent dev save |
| E2 Save token codec + UI | app-developer | 0.5-1 | E1 | Export/import |
| E3 Offline accrual math | app-developer | 1.5-2 | E1 | `reconstructFromOfflineWindow` |
| E4 Dev time-skip | app-developer | 0.5 | E3 | Math-based skip |
| E5 Token UX polish | app-developer | 0.5 | E2 | Drop-import / clipboard / .dfsave |
| S1 Harness skeleton | sim-tuner | 1 | parallel ok | CLI + report scaffold |
| S2 Primary pairings | sim-tuner | 1.5 | E3, S1 | First real calibration |
| S3 Secondary profiles | sim-tuner | 1 | S2 | 12-pairing coverage |
| S4 Mass band + DNFs | sim-tuner | 0.5 | S3 | Locked verdict rules |
| S5 Top-down tooling | sim-tuner | 0.5 | E4 | Mid-tier start runs |
| S6 Baseline calibration run | sim-tuner | 1 | S2-S5 | First long-burn report |

**Critical path:** E1 -> E3 -> S2 -> S3 -> S4 -> S6 ~= **6-7 sessions**.
**Total work:** **~9-11 sessions** across both directors.

---

*Authored 2026-05-12 as the closing artifact for the long-burn-pacing-lock session. Next pickup: a fresh session against E1.*
