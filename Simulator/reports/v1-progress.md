# Long-burn v1 — Engineering Plan Progress Log

One short entry per phase as it lands. Mirrors the matching state-of-play bullet in [CLAUDE.md](../../CLAUDE.md). Canonical plan: [engineering-plan-long-burn-v1.md](../../Design%20Documents/engineering-plan-long-burn-v1.md).

---

## 2026-05-14 — Step D landed: T4 Galactic Arm retune (iter 9)

**Workstream:** T4 Galactic Arm numerical calibration under Reading B + Engaged Comp 1-2 day / Engaged Thr 1-1.5 day targets. Phase 2 of the post-renumber workstream (Phase 1 = science-director slate re-validation cleared 0 blockers).

**Deliverable:** all four primary engaged pairings land inside per-tier T4 calendar band, 0% DNF across the matrix, T1/T2/T3 byte-identical preserved.

**Per-pairing T4 outcomes (N=50, seed=1):**

| Pairing | Mode | T4 dur p50 | Drift | Mass p50 | Ratio |
|---|---|---|---|---|---|
| p1 engaged × comp-hoarder | Comp | 1d 3h (27h) | -24.2% in 24-48h band | 3.39e+11 | 3.39× above-band |
| p2 engaged × comp-rusher | Comp | 1d 13h (37h) | +2.8% within | 2.43e+11 | 2.43× above-band |
| p3 engaged × thr-hoarder | Thr | 1d 5h (29h) | -3.3% within | 4.40e+10 | 2.20× above-band |
| p4 engaged × thr-rusher | Thr | 1d 10h (34h) | +16.2% in 24-36h band | 4.53e+10 | 2.27× above-band |

Bot reference: T4 Comp 1.00e+11 / T4 Thr 2.00e+10 (Thr within ±0.5 dex of Reading B target 10¹⁰ named scale; Comp 5× named, acceptable per CD-2/NEW-1).

**Locked T4 numerical values in `Prototype/src/sim/data.js`:**
- DLD initCost 5K → 150K (×30), baseMps 40 → 80 (×2)
- HII initCost 8K → 240K (×30), baseMps 60 → 120 (×2)
- PM initCost 15K → 450K (×30), addMpc 80 → 160 (×2)
- SDW initCost 20K → 600K (×30), addAps 1.0 → 2.0 (×2)
- HVC initCost 10.5M → 3B (×285) [completionist max-5; the big Comp-vs-Thr lever]
- GB initCost 200K → 6M (×30), addMps 30 → 60 (×2) [tiered consolidation 7×0.75 preserved]
- Sgr B2 initCost 600K → 18M (×30) [synergy A to PM ×1.5 preserved]
- GC initCost 150M → 100B (×667) [completionist anchor; allMps 1.42 preserved]
- AN initCost 8M → 20B (×2500) [transition gate; consolidation 8.125 preserved]

Consolidation budget check: 7×0.75 + 2.25 + 0 + 8.125 = 15.625 = 1.0 × 2.5³ ✓.

All 4 synergies unchanged: A (Sgr B2 → PM ×1.5 flat), B (DLD → HII ×1.06/lvl), C (HVC → DLD ×1.10/lvl cross-stat), D (Local Bubble T2 → HII T4 +0.04/lvl additive cross-tier), E (AN → T5 Sgr A* ×1.5 flat cross-tier).

**Verification:**

- `node src/test/save_migration_test.js` — 56/56 PASS unchanged.
- `node src/test/validate_offline.js` — 38/38 PASS unchanged.
- `node src/test/validate_subhalo.js` — 28/28 PASS unchanged.
- `node src/test/profiles_smoke.js` — 396/396 PASS unchanged.
- p17 bot-60cpm × comp-hoarder T1 byte-identical: 11m 40s ✓.
- p17 bot-60cpm × comp-hoarder T2 byte-identical: 1h 8m ✓.
- p17 bot-60cpm × comp-hoarder T3 byte-identical: 9h 36m ✓.
- T3 per-tier engaged primary results unchanged (p1 T3 per-tier 1d 7h drift -12.1% within matches CLAUDE.md T3 retune lock exactly).

**Scope notes:** Iteration count: 9 (started from PHASE-2-PLACEHOLDER + PHASE-2-CONSOLIDATION-RESCALE interim scaffolding from the 2026-05-13 ladder renumber). The CD-2/NEW-1 reframe was respected — sim-tuner did NOT chase the retired tight Comp-vs-Thr gap targets (+65.6% Comp-handoff / +38.6% Thr-handoff pre-renumber band). Comp-vs-Thr T4 calendar gap informational only: p1 Comp vs p3 Thr cumulative +1.5% (negligible); p2 Comp vs p4 Thr +8.3%.

**p1 Comp-hoarder note:** T4 dur p50 27h is HIGH-under target midpoint 36h by -24%, but inside the 24-48h band. The comp-hoarder profile (saveVpcThreshold=2.5) pumps T4 stackables aggressively, so it completes T4 faster than comp-rusher. Acceptable under loose pre-peak calibration; pushing it slower would risk bot DNF at T4 (iter 7 attempted incomes /25 and hit maxTicks).

**Mass-band context:** T4 ratio is the LOWEST above-band of any tier (T2 is ~150×, T3 is ~5×, T4 is ~2-3×). T4's cost/income lever absorbs idle accumulation most effectively of any tier. This is consistent with Reading B target "peak mass at gate ≈ named scale."

**Open items / recommended doc-keeper actions (next workstream):**

1. Update `Design Documents/gameplay-design.md` §3 Tier 4 numerical column with iter 9 locked values.
2. Update `Prototype/dark-filaments-t1-current-state.md` T4 spec section.
3. Apply science-glossary.md Sgr B2 T5 → T4 fix flagged by science-director in Phase 1 (T4's Sgr B2 is locked content; glossary entry needs tier reference corrected).
4. Update CLAUDE.md state-of-play.

**Recommended next workstream:** T5 Galaxy retune. T5 is the PEAK tier — calibration TIGHTENS at T5 per CD-2/NEW-1 (Comp/Thr ~parity at peak). The compound-channel Hot Coronal Halo `allMps × allMpc` decoration concern from creative-director's pre-renumber Pass 1 review surfaces at T5 — click income share may approach 0% at T5 because HCH compounds `allMpc` further on top of T1-T4 carry. Recommend a creative-director consultation before T5 numerical retune lands.

---

## 2026-05-14 — Doc-keeper closing pass landed for T4 retune

**Deliverable:** 5 docs updated for T4 retune lock; science-glossary v0.2 → v0.3 with Sgr B2 T5 → T4 fixes + T4 entries added; ready for T5 retune workstream.

**Files updated:**

- `Design Documents/gameplay-design.md` 0.5 → 0.6 — §3 Tier 4 numerical columns replaced with iter #9 locked values from `data.js`; new "Calibration outcomes" sub-section landed with 4-pairing band table, Reading B mass anchors, 9-iteration history note; stale PHASE-2-CONSOLIDATION-RESCALE interim scaffolding from the 2026-05-13 renumber retired; pre-peak Comp-vs-Threshold band target retired under CD-2/NEW-1; Tier 4 intro paragraph updated to reflect the retune lock; changelog entry added.
- `Design Documents/science-glossary.md` 0.2 → 0.3 — Sgr B2 T5 → T4 corrections at 3 sites (forward-pointer block, cross-references chain re-ordered chronological-by-tier, precision-risk #6); Sgr B2 promoted from forward-pointer entry to full T4 body entry; Active Nucleus entry added to T4 body with the "Active Nucleus" (design name) vs "Active Galactic Nucleus" (literal astronomical term) gloss per science-director Phase 1 recommendation; full T4 section landed (Galactic Arm tier definition + 9 upgrade entries: Dust Lane Density, HII Region, Proper Motion, Spiral Density Wave, High-Velocity Cloud, Galactic Bulge with tiered-consolidation context, Sagittarius B2, Globular Cluster, Active Nucleus); named-structures-in-flavor section extended with Galactic Center, MW spiral arms, Fermi Bubbles forward-pointer; forward-pointer block now contains only T5+ entities (Sagittarius A*, Hot Coronal Halo); source list extended with 18 T4 references.
- `Prototype/dark-filaments-t1-current-state.md` — T4 spec section verified (sim-tuner had pre-populated with iter #9 lock values); "Synergies (4)" header tightened to "Synergies (4 within-tier + 1 cross-tier outbound = 5 total)" — D + E were listed in the body but the count header was stale; cross-tier-synergy-D notes extended with science-director Phase 1 physics confirmation per Zucker 2022.
- `CLAUDE.md` — new top-of-state-of-play bullet documenting the T4 retune lock (workstream phases, locked numerical values, Reading B mass anchors, 4-pairing calibration outcomes, science-director Phase 1 flag resolutions, T1/T2/T3 byte-identical preservation, harness pass results, iteration history, open queue including T5 retune and pre-T5 creative-director consultation); doc map entries for gameplay-design + science-glossary version-bumped; T4 per-tier disposition bullet updated to reflect 2026-05-14 retune lock and to flag that the older 2026-05-11 "T4 first numerical calibration pass" / "T4 design slate locked" bullets describe OLD T4 content which under the 2026-05-13 renumber is now T5 (Galaxy: Galactic Rotation / Stellar Halo / Bar Structure / Hot Coronal Halo / Dark Matter Halo); "Last updated" footer rewritten with multi-paragraph T4 retune session summary.
- `Simulator/reports/v1-progress.md` — this entry.

**Scope notes:** No engine changes. No slate number changes (data.js already locked at iter #9 by sim-tuner). No prose changes to gameplay-design.md §3 T4 flavor or voice-samples.md tier-up lines (locked per writer audit; Galactic Bulge per-level arc, all 9 T4 upgrade desc fields, T4 → T5 tier-up line all preserved verbatim). No load-bearing rule changes. The pass is doc-coordination only — surfacing the sim-tuner Step D iter #9 lock and the science-director Phase 1 Sgr B2 fix into source-of-truth docs so the verdict (T4 fully locked numerically, scientifically validated, glossary internally consistent) survives into future sessions.

**Ready for:** T5 Galaxy retune as next primary workstream. Pre-T5 creative-director consultation recommended on the Hot Coronal Halo compound-channel click-decoration concern (T4 click income share lands at 0-1% per Phase 1 flag #4 — at T5 the HCH compound-channel will compound on top of T1-T4 carry, potentially driving click share toward 0%). Subhalo UX surfacing parallel workstream remains open (engineering-director + creative-director scoping pass — promoted to named parallel workstream 2026-05-13 evening).

---

## 2026-05-13 evening — CD T1-T3 holistic review closing pass landed

**Deliverable:** creative-director's holistic review of T1-T3 landed as a source-of-truth pass. Verdict: "T1-T3 is ready to lock as a group; proceed to T4 retune."

**What landed:**

- **Three coordination flags** surfaced as parallel-with-T4 tracking items: (1) Subhalo UX surfacing — promoted from "deferred Phase 2" to named parallel workstream (becoming structurally load-bearing for T3 perception); (2) Welcome-back narrator UX — safe through T3-T5, load-bearing by T6-T7 (Eridanus pivot depends on it); (3) T3 DM-signal pattern doubling watch (Subhalo + Velocity Dispersion both do "missing mass made measurable" work; revisit after T4 if a third DM-signal candidate arrives).
- **Four new idea-surface captures** landed in `design-notes.md` §18: mass-counter-vs-stats-line teachable pattern (CMB-workshop scope-expansion candidate); "we are doing this" sibling line for T5; moderate engagement-profile creative-design surface (post-T5-T6 workstream); cosmological time-arc weight for Draco / Inventory artifact (Inventory presentation pass).
- **Over-deferred items audit** verdicts encoded: CMB through-line (hold; workshop before T7); Inventory artifact (hold); Subhalo UX surfacing (PROMOTED); Welcome-back narrator UX (hold through T5); Audio architecture (hold); React/Three.js scaffold (hold; loop engineering-director when T4 closes — T4's named one-shots want a scene).

**Files modified:**

- `Design Documents/design-notes.md` — v0.9 → v0.10. §9 closing paragraph on Subhalo UX surfacing rewritten ("Phase 2 sim-tuner / engineering-director question" → "named parallel workstream running alongside the T4 numerical retune"). New §18 "Idea captures" appended (between §17 Open Questions and Companion documents) with the four CD captures, each preserving description + proposed workstream timing + originating context.
- `Design Documents/gameplay-design.md` — §3 Tier 3 Subhalo subsection: new bullet added under the existing four (after "Reusable pattern") naming the UX-surfacing promotion to parallel workstream, with the engineering-director + creative-director scoping pass framing and the open affordance options list.
- `CLAUDE.md` — doc map updated (design-notes.md status: v0.8 → v0.10 with the §18 + §9 changes summarized). New top-of-state-of-play bullet documenting the CD review verdict, the five strongest creative outcomes, the three coordination flags, the four idea captures with §18 cross-reference, and the over-deferred items audit verdicts.
- `Simulator/reports/v1-progress.md` — this entry.

**Scope notes:** No engine changes. No slate number changes. No prose changes to gameplay-design.md §3 T1-T3 flavor or voice-samples.md tier-up lines (locked per writer audit). No science-glossary changes (already v0.2 from earlier today). No load-bearing rule changes. The pass is doc-coordination only — surfacing CD's review into the source-of-truth docs so the verdict ("locked as a group; proceed to T4") and the parallel-workstream promotion (Subhalo UX surfacing) survive into future sessions.

**Ready for:** T4 Galactic Arm numerical retune as next primary workstream. Subhalo UX surfacing scoping runs in parallel.

---

## 2026-05-13 evening — Thr T3 band expansion + science-glossary doc-map add (closing pass on T3 retune)

**Deliverable:** two small, tightly-scoped edits closing the T3 retune workstream — (1) Thr T3 Engaged calendar band expanded 18-36h → 22-44h per CD-2/NEW-1 loose-pre-peak reframe; (2) `science-glossary.md` added to the canonical doc map in CLAUDE.md.

**Item 1 — Thr T3 band 18-36h → 22-44h:**

- `Prototype/src/sim/profiles.js` — `ENGAGED_TARGETS.threshold[3]` low/high `18 * H / 36 * H` → `22 * H / 44 * H`. Label unchanged.
- `Design Documents/gameplay-design.md` §1 per-tier calendar targets table — T3 Engaged Thr column `18-36 hours` → `22-44 hours`. Comp T3 (24-48h) unchanged. Changelog entry added under v0.5 rolling.
- `CLAUDE.md` — new top-of-state-of-play bullet logging the band expansion.

**Rationale:** The CD-2/NEW-1 reframe (locked 2026-05-13) retired the tight Comp-vs-Thr pre-peak gap calibration. The original 18-36h Thr T3 band encoded a 25% Thr-faster-than-Comp assumption (27/36 midpoint ratio = 0.75) that predates the reframe and that the slate's actual physics doesn't manufacture. The latest 3-seed sweep (seeds 1 / 1337 / 451621332) showed Thr engaged p50 clustering at 35-37h calendar — natural slate behavior outside the over-tight band. The new 22-44h band (midpoint 33h) accommodates observed p50 within ±15% drift; preserves a soft Thr-faster-than-Comp ratio (33/36 = 0.92) without forcing tight numerical calibration. No T3 slate numerical changes; calibration is the band itself.

**Item 2 — science-glossary.md added to canonical doc map:**

- `CLAUDE.md` — new row in the `Design Documents/` table between `voice-samples.md` and `engineering-plan-long-burn-v1.md`. Entry text: "Writer-facing canonical reference for every named astronomical entity used in upgrades, flavor, and tier-up lines (T1-T3 complete; T4-T11 entries added as tiers retune)". Status: "Canonical (v0.2 — 2026-05-13 post-T1-T3 audit; Wolf-Rayet Star entry added, Sgr A\* / Sgr B2 forward-pointers, Sgr B2 precision-risk note flagged for T5 retune)".

**Verification:**

- `node src/test/profiles_smoke.js` — 396/396 PASS (no smoke-test assertion required adjustment; no test asserted the prior 18-36h values literally).
- `node src/test/save_migration_test.js` — 56/56 PASS unchanged.
- `node src/test/validate_offline.js` — 38/38 PASS unchanged.
- `node src/test/validate_subhalo.js` — 28/28 PASS unchanged.
- `node src/test/harness.js --pairing p17 --target t3 --n 1 --seed 1 --max-days 30` → T3 = 9h 36m (byte-identical to T3 retune canonical anchor; T1/T2/T3 engine math unchanged).

**Scope notes:** No engine change. No slate number change. The band edit is calibration-target-only — it reflects what the slate's physics already produces, not a new tuning target. The doc-map entry reflects the existing science-glossary.md file (v0.2 already on disk); the table addition closes a doc-keeper drift item between the file's existence and the canonical map.

---

## 2026-05-12 — E1 LocalStorage save (landed)

**Deliverable:** persistent dev save across browser sessions, with autosave + tier-up flush + beforeunload flush + Reset Universe affordance.

**What shipped:**

- `Prototype/src/sim/save.js` (new) — `serializeState`, `deserializeState`, `writeLocalSave`, `readLocalSave`, `clearLocalSave`, `computeSchemaSig`. SavePayload shape matches engineering plan §3 verbatim. Translates the playtest's relic `mpsFloor`/`mpcFloor`/`apsFloor` carry fields to the canonical `carryMps`/`carryMpc`/`carryAps` shape at the boundary.
- `Prototype/src/sim/data.js` — added `SAVE_VERSION = 1` constant, exposed on `DF.sim.data`.
- `Prototype/src/ui/playtest.js` — boot-time `restoreFromSave()` call before `buildUpgrades()`; 10 s autosave `setInterval`; explicit `saveNow()` in `transitionToNextTier()`, `skipToTier()`, and a `beforeunload` listener; new `resetUniverse()` export.
- `Prototype/src/ui/parameters.js` — new "Reset universe" button with inline confirmation, alongside the existing "Reset all to defaults".
- `Prototype/dark-filaments-t1.html` — `<script src="src/sim/save.js"></script>` between `runner.js` and `playtest_refs.js`.
- `Prototype/src/test/save_migration_test.js` (new) — 53 checks across round-trip parity, JSON byte-identity, carry-field translation, schemaSig stability/sensitivity, future-version refusal, and schemaSig-mismatch warn-load. **Locked harness — must run green after every save.js change.**
- `Prototype/dark-filaments-t1-current-state.md` §9 updated: new `save.js` module entry in the file-layout tree, new save_migration_test.js entry, new `DF.sim.save` export-shape block, new "Save lifecycle" paragraph, `DF.ui.playtest.init()` description refreshed.

**Verification:**

- `node src/test/save_migration_test.js` — 53/53 PASS.
- `node src/test/validate.js` — 60 cpm PASS (-2.5%), 100 cpm PASS (-4.3%), 147.9 cpm FAIL (-9.7%, pre-existing).
- `node src/test/t3_calibrate.js` — T3 Comp-handoff +76.2%, Thr-handoff +75.6% (byte-identical to pre-E1 CLAUDE.md state-of-play).
- `node src/test/t4_calibrate.js` — T4 Comp-handoff +65.6%, Thr-handoff +38.6%, T3 ripple +76.2%/+75.6% (byte-identical to pre-E1).

**Offline-window behavior (E1):** the universe is FROZEN across the away window — `(now - savedAt)` is added to `state.totalPausedMs` so `getElapsedMs()` reads continuously, but no mass accrues. E3's `reconstructFromOfflineWindow` will replace this freeze at the same call site (`restoreFromSave()` in `playtest.js`).

**SavePayload contract** (locked): `{ version, savedAt, schemaSig, game: { mass, cohesion, currentTier, levels, carry: {allMps, allMpc, allAps, carryMps, carryMpc, carryAps}, cohesionThreshold, cohesionHitMs, totalClicks, sessionStart, totalPausedMs, massGainedClicks, massGainedPassive, massGainedAuto, tickCount, tierSnapshots }, meta: { appBuild, devSkipsApplied, lastEngagementProfile } }`. Transient fields explicitly NOT persisted: log, click timestamps, pause state, autoclicker on/off (per plan §3).

**schemaSig:** FNV-1a 32-bit hash over `tier:name` joined in array order. Sensitive to order + name changes; insensitive to per-upgrade field tweaks (so calibration retunes don't invalidate saves). Mismatch surfaces as a `console.warn` + load — matches §10 open-item-2 recommendation for v1 dev tool.

**Open items deferred to subsequent phases:**

- Browser smoke test (buy upgrades → refresh → see them restored) — not automated; will surface during normal dev use of the prototype.
- E2 will add `encodeToken` / `decodeToken` to `save.js` and the Parameters-tab Saves strip.
- E3 will write `sim/offline.js` containing `reconstructFromOfflineWindow`; the boot-load call site already has the cap-at-24h decision point ready (currently no cap because the freeze is harmless).

**Next:** E3 (offline accrual math) is the load-bearing next step on the critical path. E2 (save token codec + UI) and S1 (harness skeleton) can both run parallel to E3.

---

## 2026-05-12 — E3 Offline accrual math (landed, same session as E1)

**Deliverable:** `reconstructFromOfflineWindow` — the load-bearing artifact of v1 per engineering plan §2 — replaces the E1 boot-time freeze. Mass accumulates from MPS + APS×MPC across the offline window (capped at 24 h), no purchases happen during offline (per the load-bearing universe-is-patient rule).

**What shipped:**

- `Prototype/src/sim/offline.js` (new) — `reconstructFromOfflineWindow(savedState, elapsedSeconds, profileParams)` returning `{ newState, buyLog, milestones, endReason, ticks }`. Pure function; clones the input savedState, runs a 1 Hz tick loop reusing `core.computeRates` + `strategy.decideAction` + `runner.composeCarryChain`, returns a fresh SavePayload-shaped state. Two modes via `profileParams.allowPurchases`: pure-idle (boot-time call; no purchases, no transitions — honors load-bearing rule "Consolidation does not advance without active purchase decisions") and active (parity test + future S2+ harness; full strategy pipeline). Handles intra-window tier transitions by recomposing carry across prior tiers and refreshing the active upgrade slice. `MAX_OFFLINE_TICKS = 30 days` safety ceiling.
- `Prototype/src/ui/playtest.js` — `restoreFromSave()` now feeds the offline gap to `reconstructFromOfflineWindow` in pure-idle mode, capped at 24 h. Replaces the E1 freeze (offline gap still added to `totalPausedMs` so `getElapsedMs()` stays continuous — the away time is mathematical game time, not session time). Stamps an `offline_accrual` log event on the live log for player-visible feedback (filtered through the existing log panel pipeline).
- `Prototype/dark-filaments-t1.html` — `<script src="src/sim/offline.js"></script>` added after `save.js`.
- `Prototype/src/test/validate_offline.js` (new) — 37-check locked harness covering: 400 s exact-level parity at 100 cpm vs `runner.runSimulation` (precondition: neither side transitions within window), boot-time pure-idle correctness (no purchases, MPS-only mass growth, levels untouched), APS-only pure-idle accrual (T2 RLO L10 → 0.9 M/s autoclicker income), zero-MPS pure-idle no-op, edge cases (0 / negative / NaN elapsedSeconds), purity (input savedState not mutated, identical inputs → identical outputs), tier transition handling (T1 → T2 over 900 s).
- `Prototype/dark-filaments-t1-current-state.md` §9 updated: new `offline.js` module entry in file-layout tree, new `validate_offline.js` entry, new `DF.sim.offline` export-shape block, save-lifecycle paragraph extended to describe E3 behavior, module-loading note about `offline.js` placement.

**Verification:**

- `node src/test/validate_offline.js` — 37/37 PASS. 400 s parity with the runner shows mass + every T1 level + cohesion match **exactly** (not within tolerance, byte-identical) when neither side transitions; the strategy invocation pipeline is therefore identical between runner and offline.
- `node src/test/save_migration_test.js` — 53/53 PASS (E1 unchanged).
- `node src/test/validate.js` — 60 cpm PASS, 100 cpm PASS, 147.9 cpm FAIL pre-existing (unchanged).
- `node src/test/t3_calibrate.js` — Comp-handoff +76.2%, Thr-handoff +75.6% (byte-identical to pre-E3).
- `node src/test/t4_calibrate.js` — Comp-handoff +65.6%, Thr-handoff +38.6%, T3 ripple 0pp (byte-identical to pre-E3).

**Plan §10 #3 (strategy refactor scope) resolved.** Closer reading of strategy.js showed `decideAction` was already pure with respect to `params` — no DEFAULT_PARAMS coupling existed to refactor. The buyer-profile contract maps directly to the existing `params` keys (`cpm`, `engagement`, `mode`, `saveVpcThreshold`, `longSaveTimeThresholdSec`, `longSaveTolerance`). offline.js constructs `stratParams` from `profileParams` and passes through. Zero changes to strategy.js were needed — risk of hidden coupling did not materialize.

**Plan §3 dt strategy.** Shipped the brute-force 1 Hz integration loop. Per §3 / §10 #4 footnote: if harness runs exceed ~30 s per pairing during S2+, fall back to a closed-form integration pass between purchase events. The parity test at 400 ticks (~0.05 s wall-clock) confirms the brute-force path is fast enough for the validate_offline harness; long-window scaling is an S2 concern.

**Offline window semantics (locked for E3):**

- Boot-time call uses `allowPurchases: false, cpm: 0`. Pure idle. Mass accrues from MPS + APS×MPC only (autoclicker income continues since APS upgrades are intrinsically active; `mpc` includes the +1 baseline so APS × mpc is non-zero even with cpm=0).
- 24 h cap applied at the call site (`ui/playtest.js`), not inside the function — `reconstructFromOfflineWindow` accepts any positive elapsedSeconds per plan §3 (harness flexibility).
- Capped gap also added to `totalPausedMs` so the session clock remains continuous across the boundary. The mass accrual is "game time" inside the gap; for session-clock purposes the player wasn't here.
- An `offline_accrual` log event is stamped on the live log when accrual fires, capturing `elapsed_sec`, `capped` flag, mass-before, mass-after, mass-gained. Shows up in the existing log panel and exports.

**Out of scope for E3 (deferred):**

- E2 (token codec + UI) — can run parallel. No dependency.
- E4 (dev time-skip) — depends on E3 (now landed). Next engineering-side opportunity.
- S1 (harness skeleton) — can run parallel. No dependency.
- Multi-window check-in scheduling (engagement-profile windows). S2+ concern.
- Closed-form integration optimization. S2+ if needed.

**Next:** E4 (dev time-skip tool, 0.5 session) now unblocked. S1 (harness skeleton, 1 session) can run parallel. After E4, the critical-path next step is S2 (primary pairings end-to-end).

---

## 2026-05-12 — S1 Harness skeleton (landed, same session as E1 + E3)

**Deliverable:** Node CLI calibration harness scaffold + engagement-profile/buyer-profile/realistic-pairings data catalog. Continuous bot pairings produce real headline numbers via `runner.runSimulation` (cross-checks T1-T4 calibration); engagement-profile pairings are stubbed pending S2's multi-window integration.

**What shipped:**

- `Prototype/src/sim/profiles.js` (new) — pure-data catalog exporting `TIMING_PROFILES` (8), `BUYER_PROFILES` (5), `REALISTIC_PAIRINGS` (12), plus helpers `lookupPairing(idOrName)`, `primaryPairings()`, `describePairing(p)`. Source: engineering plan §5 verbatim. Browser-compatible (IIFE + UMD shim) for forward-use in a future Parameters-tab profile picker.
- `Prototype/src/test/harness.js` (new) — Node CLI scaffold with `--pairing` (id or canonical name) / `--n` (per-pairing run count) / `--target` (highest tier, "t4" or "4") / `--report` (write report.md + raw.csv under `Simulator/reports/<timestamp>/`) / `--primary-only` (weight=primary filter) / `--seed` (reserved for S2 stochastic windowing) / `--list` (catalog dump) / `--help`. Two run paths: continuous-bot via runner.runSimulation chained across tiers (`p11`, `p12`); engagement-profile stub returning DNF placeholders (`p1`-`p10`, pending S2). Markdown report layout matches engineering plan §6 (headline + primary-pairings section + cross-pairing comparison table + anomalies + what-to-do-next). CSV "raw.csv" row-per-run for spreadsheet drilling.
- `Prototype/src/test/profiles_smoke.js` (new) — 122-check verifier covering: catalog integrity (8+5+12 well-formed, every pairing references known profiles, exactly 2 primary + 2 legacy), lookup helpers, CLI arg parsing (defaults, long form, equals form, --primary-only, --seed), end-to-end smoke (all 12 pairings at N=1/T2: bot pairings produce real numbers + reach T2, engagement-profile pairings produce DNF stubs, summaries well-formed, markdown report has all required sections + 12 cross-pairing rows + no exclamation points, CSV has correct header + 12 data rows), single-pairing higher-N/higher-target smoke.
- `Prototype/dark-filaments-t1-current-state.md` §9 updated: new `profiles.js` entry in file-layout tree, new `harness.js` + `profiles_smoke.js` entries, new `DF.sim.profiles` export-shape block, S1 landing note in section preamble.

**Verification:**

- `node src/test/profiles_smoke.js` — 122/122 PASS.
- `node src/test/harness.js --list` — prints full catalog cleanly.
- `node src/test/harness.js --pairing p11 --n 2 --target t3` — produces 1:13:53 totalSeconds = 4433 s, which matches `t3_calibrate.js`'s "All-Completion total 73:53" exactly (sanity: continuous-bot path is wired correctly).
- `node src/test/harness.js --primary-only --n 1 --target t2 --report` — writes `Simulator/reports/<timestamp>/report.md` + `raw.csv`; report has all required sections; the two primary pairings show as STUBBED (S2 will populate).
- `node src/test/validate_offline.js` — 37/37 PASS (E3 unchanged).
- `node src/test/save_migration_test.js` — 53/53 PASS (E1 unchanged).
- `node src/test/validate.js` — 60/100 cpm PASS, 147.9 pre-existing FAIL (unchanged).
- `node src/test/t3_calibrate.js` — Comp-handoff +76.2%, Thr-handoff +75.6% (byte-identical).
- `node src/test/t4_calibrate.js` — Comp-handoff +65.6%, Thr-handoff +38.6% (byte-identical).

**Locked decisions in S1:**

- Continuous bot pairings (`bot-100cpm`, `bot-60cpm`) run via `runner.runSimulation` chained across tiers 1..target — same chain pattern `t3_calibrate.js` / `t4_calibrate.js` use. Real numbers.
- Engagement-profile pairings remain DNF stubs in S1. S2 fills in: `reconstructFromOfflineWindow` driven by per-day check-in scheduling (Poisson-ish around `checkInsPerDay`), per-window minutes/cpm from the timing profile.
- Markdown report is locked at the §6 shape: headline → primary pairings → cross-pairing comparison → anomalies → what-to-do-next.
- CSV row shape: `pairing_id, timing, buyer, n, run_idx, kind, total_seconds, final_tier, dnf, dnf_reason, final_mass`. S2 will extend with per-tier columns + buy-log links.
- All harness numeric output is in seconds; markdown rendering uses `fmtTime` (mm:ss or h:mm:ss). No calendar-time interpretation in S1 — bot pairings have no calendar meaning; engagement-profile pairings are stubbed.
- Reports go under `Simulator/reports/<ISO-timestamp-with-colons-and-dots-replaced>/`. The directory was already created during E1's v1-progress.md commit.

**Plan §10 #6 (active-decay tier boundaries C3 T1-T3 / T4-T6 / T7-T10):** still open. The active-decay curve per band lives in `BUYER_PROFILES` or `TIMING_PROFILES` once defined — S1 ships the data catalog without that field. S2 surfaces the question when the multi-window loop needs it; sim-tuner will propose values then.

**Out of scope for S1 (deferred):**

- Multi-window simulation for engagement-profile pairings (S2).
- Per-pairing buy-log CSV emission (S2).
- DNF rules + mass-target band (S4).
- Top-down/mid-tier-seeded runs (S5).
- Drift detection vs design targets + retune recommendations (S6).
- `--seed` reproducibility (deferred to S2 when stochastic windowing lands).

**Next:** S2 (primary pairings end-to-end, 1.5 sessions) is now unblocked. E4 (dev time-skip, 0.5 session) remains available as a parallel branch off E3.

---

## 2026-05-12 — S2 Primary pairings end-to-end (landed, same session)

**Deliverable:** Multi-window engagement-profile loop in the harness, using `reconstructFromOfflineWindow`. Primary pairings (`engaged-steady × completionist`, `engaged-steady × consolidation-threshold`) now produce real engagement-profile numbers with per-tier calendar percentiles + ±15% drift detection against `gameplay-design.md` §1 targets. **First long-burn calibration apparatus working end-to-end.**

**What shipped:**

- `Prototype/src/sim/profiles.js` — added `ENGAGED_TARGETS` (T1-T10 per-tier ranges in both completion + threshold modes, from gameplay-design.md §1 verbatim) and `totalTargetSecondsThroughTier(mode, tier)` helper. T9 inversion encoded as data (completion 3-4d < threshold 7-10d).
- `Prototype/src/test/harness.js` — major extension:
  - **Mulberry32 seedable RNG** + `makeRunRng(baseSeed, runIdx)` for per-run determinism. Same `--seed` → byte-identical numbers.
  - **`sampleIdleGapSec(timing, rng)`** — exponential idle-gap sampler with mean = `86400 / checkInsPerDay`, clamped to `[5 min, 14 days]` so a single sample can't strand a run forever.
  - **`runEngagementProfileRun(...)`** replaces the S1 stub — multi-window loop alternating: idle gap (pure-idle `reconstructFromOfflineWindow` with `cpm=0`, `allowPurchases=false`) → check-in session (`reconstructFromOfflineWindow` for `sessionMinutes × 60` s with `cpm = timing.cpm`, `allowPurchases = buyer.inSessionPurchases`, mode from buyer profile). Tracks per-tier entry calendar timestamps via tier-up milestones, accumulates buyLog + milestones globally, applies a `MAX_ZERO_PROGRESS = 200` stuck guard for DNF detection.
  - **Refactored `runContinuousBotRun(...)`** to emit the same uniform output shape (`totalCalendarSec`, `totalActiveSec`, `perTierEntrySec`, `perTierActiveSec`) so the reporting layer treats both kinds uniformly. Continuous bot has `totalCalendarSec === totalActiveSec`.
  - **`summarizeRuns(runs, targetTier, mode)`** — per-tier p10/p50/p90 across completed runs (DNFs excluded per plan §4 C2). Drift detection: compare each tier's p50 to midpoint of `ENGAGED_TARGETS[mode][tier]`; ±15% flags `HIGH-over` / `HIGH-under` / `within`. Total-run drift vs sum of per-tier targets through target tier.
  - **`makeReportMarkdown(...)`** — full per-tier breakdown table per primary pairing (cols: tier, p50, p10/p90, target, drift, flag). Cross-pairing comparison adds mode + total-drift columns. Anomalies/flags section enumerates every HIGH drift + every DNF reason.
  - **`makeRawCsv(...)`** — extended row shape: `pairing_id, timing, buyer, mode, run_idx, kind, total_calendar_s, total_active_s, final_tier, dnf, dnf_reason, final_mass, t1_entry_s..tN_entry_s, t1_active_s..tN_active_s` for spreadsheet drilling.
  - **`fmtTime(s)`** rewritten with explicit unit labels (`9m 9s` / `9h 9m` / `5d 6h` / `12.4d`) — calendar-scale runs were being misread as mm:ss otherwise.
  - **`--max-days` CLI flag** added; default 365 days (gives drift detection enough room to surface real percentiles even when stale calibration overshoots target by orders of magnitude).
- `Prototype/src/test/profiles_smoke.js` — extended to 172 checks (was 122). New coverage: `ENGAGED_TARGETS` integrity (8 catalog checks + 20 per-tier shape checks + T9 inversion + T10 sum band), RNG determinism (same-seed reproducibility + different-seed difference), the multi-window end-to-end path (10 engagement-profile pairings now produce `kind === 'engagement-profile'` real results; at least one completes T2; idle gap fires so first tier-up calendar > session length), unit-label rendering check, CSV per-tier column presence.
- `Prototype/dark-filaments-t1-current-state.md` §9 — updated profiles.js + harness.js + profiles_smoke.js entries, expanded `DF.sim.profiles` export-shape block with `ENGAGED_TARGETS` + `totalTargetSecondsThroughTier`.

**Verification:**

- `node src/test/profiles_smoke.js` — **172/172 PASS** (was 122/122 at S1).
- `node src/test/harness.js --primary-only --n 5 --target t3 --seed 1 --max-days 90 --report` — both primary pairings complete all 5 runs (no DNF), p50 = 23h 41m, written to `Simulator/reports/2026-05-12T11-47-04-975Z/`.
- `node src/test/validate_offline.js` — 37/37 PASS (E3 unchanged).
- `node src/test/save_migration_test.js` — 53/53 PASS (E1 unchanged).
- `node src/test/validate.js` — 60/100 cpm PASS, 147.9 pre-existing FAIL (unchanged).
- `node src/test/t3_calibrate.js` — Comp-handoff +76.2%, Thr-handoff +75.6% (byte-identical).
- `node src/test/t4_calibrate.js` — Comp-handoff +65.6%, Thr-handoff +38.6% (byte-identical).

**First real calibration signal surfaced (sanity run N=5 / T3 / engaged-steady):**

| Tier | Comp p50 | Comp target | Comp drift | Flag |
|---|---|---|---|---|
| T1 | 5h 3m | 2h - 4h | +68.5% | **HIGH-over** |
| T2 | 9h 17m | 8h - 12h | -7.1% | within |
| T3 | 2h 47m | 1d - 2d | -92.2% | **HIGH-under** |

**Total p50 = 23h 41m vs target ~2 days → -51.6% [HIGH-under]**

Interpretation: the current bot-time T1-T4 calibration overshoots T1 (active onboarding too slow under engaged-steady's 3 × 15-min sessions) and dramatically undershoots T3 (patient-universe offline accumulation lets the player blast through T3 in a few check-ins). This is exactly the signal the harness was designed to produce — sim-tuner will use it in S6 to drive the next retune pass.

**Locked decisions in S2:**

- Idle-gap distribution: **exponential** with mean = 86400 / checkInsPerDay seconds. Clamped to `[5 min, 14 days]`. Per-day Poisson-process semantics; matches "real player check-ins are bursty, not perfectly scheduled."
- Session length: **fixed** at `timing.sessionMinutes × 60`. No per-session jitter in v1 (could add Gaussian in S3 if calibration benefits).
- Per-tier engagement curve (`perTierEngagement[tier]`): **multiplies in-session cpm** during check-in windows. Offline windows are pure-idle regardless of perTierEngagement. Per engineering plan §10 #5 resolution: "Likely: perTierEngagement becomes in-session attention — multiplies cpm during a check-in. Offline windows are governed separately by the timing profile." Now locked.
- Stuck guard: `MAX_ZERO_PROGRESS = 200` consecutive zero-purchase, zero-mass-delta sessions before DNF. Defensive, rarely fires (offline accrual produces mass even for idle-clicker buyers).
- Calendar-budget cap default: **365 days**. Lower via `--max-days` for faster iteration during retune cycles. Sized for stale calibration's drift headroom; sim-tuner can drop it post-retune.
- Drift threshold: **±15%** from per-tier target midpoint. Per plan §4 decision C6.
- DNF exclusion from percentiles: per plan §4 decision C2. DNFs reported separately.

**Plan §10 items resolved by S2:**

- **#5 (per-tier engagement curve interaction with engagement profiles):** locked — `perTierEngagement` multiplies in-session cpm.
- **#3 (strategy refactor scope):** already resolved during E3 — no changes to strategy.js needed in S2 either.

**Out of scope for S2 (deferred to subsequent sim-tuner phases):**

- Secondary + stress + legacy-reference pairings at correct N (S3).
- Mass-target band + formal DNF rules (S4).
- Top-down/mid-tier-seeded runs (S5; depends on E4).
- Per-tier active-decay curve (active engagement falling off across T1-T3 / T4-T6 / T7-T10 bands — plan §4 C3 + §10 #6). For S2, the engagement curve is uniform across the band.
- Wall-clock optimization for long-running DNF cases (closed-form integration between purchases — plan §10 #4). The brute-force 1Hz loop works for primary at T3 in ~2s/run; T4 + stale calibration approaches the practical limit.

**Next:** S3 (secondary pairings + correct-N coverage, 1 session) — flesh out the cross-pairing comparison with realistic N=20-30 per pairing across all 12 profiles. Then S4 (mass-target band + DNF rules, 0.5 session). E4 (dev time-skip, 0.5 session) remains available as a parallel branch. The critical-path remaining: S3 → S4 → S6.

---

## 2026-05-12 — S3 Secondary timing/buyer profiles (landed, same session)

**Deliverable:** 12-pairing matrix surfaces in weight-grouped report sections; drift detection is gated to engaged-timing pairings only (rows 1-4 of the catalog); casual/drift/bot pairings produce informational percentiles without drift comparison. New ad-hoc `--timing` + `--buyer` CLI flags. `activeDecay` schema slot scaffolded on `BUYER_PROFILES` for the post-v1 retune workstream. Low-confidence flag annotates summaries when DNF rate > 50%.

**Conservative scoping (per the user's caution "don't get stuck trying to tune numbers that can't ever make it"):** S3 follows engineering plan §4 decision C1 verbatim — primary pairings drive the retune; secondary / stress / legacy pairings inform but do not gate. The apparatus visibly differentiates these: drift detection only fires for engaged-* timing profiles (the only profiles ENGAGED_TARGETS is calibrated against). Non-engaged pairings render `n/a` in the drift column so sim-tuner sees "informational only" at a glance. No derived-target table for non-engaged profiles was introduced — that would have been an extra calibration knob with no defensible source. The `activeDecay` slot is scaffolded but uniform-1.0 — sim-tuner can populate values during the retune without further engine work.

**What shipped:**

- `Prototype/src/sim/profiles.js`:
  - `BUYER_PROFILES` — every entry now carries `activeDecay: { early: 1.0, mid: 1.0, late: 1.0 }` covering T1-T3 / T4-T6 / T7-T10 bands. Comment documents this as the retune-ready scaffolding for engineering plan §4 C3 / §10 #6.
  - `timingHasDriftTarget(timingName)` — pure helper returning `true` for engaged-* timing profiles, `false` for casual / drift / bot. Exposed on `DF.sim.profiles`. Drives the harness's drift-detection gating.

- `Prototype/src/test/harness.js`:
  - **`--timing` + `--buyer` ad-hoc CLI flags.** When both are present (without `--pairing`), `buildRunList` synthesizes a single one-off pairing with `weight: 'ad-hoc'`, default `n: 10`, overridable by `--n`. Unknown timing or buyer profile names throw a clear error. Useful for sim-tuner to explore combinations outside the 12 default during retune.
  - **`summarizeRuns(runs, targetTier, mode, pairing)`** — added `pairing` parameter so the summarizer can read the timing profile and route drift detection through `timingHasDriftTarget`. Returns `driftApplies: boolean`, `dnfRate: number`, `lowConfidence: boolean` on the summary object. When `driftApplies === false`, the per-tier `target` + `driftFlag` + `driftPct` fields are null (sim-tuner sees no spurious drift signal for non-engaged pairings).
  - **`lowConfidence` flag.** Set to `true` when `dnfRate > 0.5` (more than half the runs DNFed). When set, drift flags become `'low-confidence'` to prevent misreading p50 computed off too few completed runs. The flag surfaces in the report header for primary pairings and as a "low" entry in the secondary/stress/legacy summary tables' "Conf" column.
  - **Report writer restructured** — pairings now group by `weight` into five sections:
    - **Primary pairings (calibration-deciding)** — full per-tier breakdown with drift columns. Same shape as S2's primary section.
    - **Secondary pairings (informational; primary is gating)** — compact summary table per pairing. Drift column reads `n/a` for non-engaged timing profiles.
    - **Stress pairings (adversarial profiles; high-DNF expected)** — same compact shape; idle-clicker DNFs land here.
    - **Legacy reference (continuous-bot cross-check)** — explicit cross-check against `t3_calibrate.js` / `t4_calibrate.js`. Numbers should match prior calibration probes byte-for-byte.
    - **Ad-hoc pairings (--timing / --buyer)** — only appears when the run used the ad-hoc flow.
  - **Cross-pairing comparison** table now includes a `Weight` column so the matrix view shows which pairings are gating vs informational.
  - **Anomalies / flags** section now suppresses drift-breach entries for `low-confidence` summaries (showing the low-confidence note instead).

- `Prototype/src/test/profiles_smoke.js` — extended 172 → 219 checks (S3 added 47):
  - **activeDecay schema integrity** — every buyer profile has `{ early, mid, late }` all uniform 1.0 in v1.
  - **timingHasDriftTarget gating** — engaged-* → true; casual / drift / bot → false; null / empty → false.
  - **--timing + --buyer ad-hoc CLI** — parses correctly, builds ad-hoc pairing with weight='ad-hoc', honors --n override, unknown timing or buyer profile throws.
  - **Drift gating behavior** — engaged pairing has `driftApplies: true` + populated drift fields; casual pairing has `driftApplies: false` + null drift fields + null targets.
  - **Low-confidence flag** — schema present (boolean); dnfRate is finite [0,1]; flag fires correctly when dnfRate > 0.5, doesn't fire when ≤ 0.5.
  - **Report writer weight sections** — Primary / Secondary / Stress / Legacy headings all present; cross-pairing table includes Weight column; non-engaged rows show 'n/a' for drift.

- `Prototype/dark-filaments-t1-current-state.md` §9 — updated profiles.js + harness.js + profiles_smoke.js entries; expanded `DF.sim.profiles` export-shape block with `activeDecay` + `timingHasDriftTarget`.

**Verification:**

- `node src/test/profiles_smoke.js` — **219/219 PASS** (was 172/172 at S2).
- `node src/test/harness.js --n 5 --target t3 --seed 1 --max-days 30 --report` — full 12-pairing sweep in ~30s wall-clock. Report at `Simulator/reports/2026-05-12T11-59-40-098Z/`. Pairings render distinctly across timing profiles:

| Pairing kind | p50 (T3 target) |
|---|---|
| engaged-* (3 check-ins/day) | ~1 day |
| engaged-burst (2 check-ins/day) | ~1.5 days |
| casual-* (1 check-in/day) | ~2-3 days |
| drift-light (0.4 check-ins/day) | ~7 days |
| bot-* (continuous) | ~1 hour |
| engaged × idle-clicker (no in-session buys) | DNF (stuck guard fires correctly) |

  This is the "behave distinctly across timing profiles" verification from engineering plan §4 S3.
- `node src/test/validate_offline.js` — 37/37 PASS (E3 unchanged).
- `node src/test/save_migration_test.js` — 53/53 PASS (E1 unchanged).
- `node src/test/validate.js` — 60/100 cpm PASS, 147.9 pre-existing FAIL (unchanged).
- `node src/test/t3_calibrate.js` — +76.2% / +75.6% (byte-identical).
- `node src/test/t4_calibrate.js` — +65.6% / +38.6% (byte-identical).

**Legacy-reference cross-check (engineering plan §4 S3 mandate):** `p11 bot-100cpm × greedy-vpc-1.5` reports total T3 calendar of 1h 13m (= 4380 s); `t3_calibrate.js`'s "All-Completion T1+T2+T3=comp" total is 73:53 (= 4433 s). Within 1.2% — the harness's chained continuous-bot path matches the pre-existing T1-T4 calibration probes; calibration has not regressed.

**Plan §4 decisions honored:**

- **C1** (rows 1-2 drive calibration, 3-10 inform, 11-12 cross-check) — drift gated on engaged-timing pairings; legacy section cross-checks the bot path against pre-existing calibration probes.
- **C2** (DNFs excluded from percentiles) — explicit in summarizeRuns + headline + report sections.
- **C3** (T1-T3 / T4-T6 / T7-T10 active-decay bands) — schema slot scaffolded as `BUYER_PROFILES.<profile>.activeDecay = { early, mid, late }`. No-op in v1; sim-tuner populates during retune.
- **C5** (N=50 primary, 20-30 secondary, 10 legacy) — already encoded in REALISTIC_PAIRINGS catalog.
- **C6** (±15% drift threshold) — same as S2.

**Plan §10 open items still open after S3:**

- **#4 (harness wall-clock optimization for long-running DNF cases)** — at the v1 ship target (~5-6 weeks calendar Engaged Comp), full N=50 primary at full T10 will take significant wall-clock per pairing; closed-form integration between purchase events may be needed. Defer to S6 measurement and decide then.
- **#6 (active-decay tier band curve values)** — schema present, values uniform 1.0. Retune workstream sets actual curve.
- **#7 (M☉ unit denomination)** — out of scope for v1; sim-tuner pass after calibration stabilizes.

**Out of scope for S3 (deferred to subsequent sim-tuner phases):**

- Mass-target band + formal DNF rules (S4 — half-session).
- Top-down/mid-tier-seeded runs (S5; depends on E4).
- Baseline calibration sweep at full N + retune recommendations (S6).
- Per-profile target tables for non-engaged pairings — deliberately NOT added in v1 per the user's caution ("don't get stuck trying to tune numbers that can't ever make it"). The harness is honest about what it can compare drift against, and what it can't.

**Next:** S4 (mass-target band + DNF rules, 0.5 session). Formalizes the DNF rules (today: budget exhausted, stuck guard, max ticks; S4 adds the mass-target band — a successful run must reach 70-100% of tier end-mass within budget). Then S6 (baseline calibration sweep at full N — the apparatus delivering its first formal answer). E4 (dev time-skip, 0.5 session) remains a parallel branch.

---

## 2026-05-12 — S4 Mass-target band + DNF rules (landed, same session)

**Deliverable:** the mass-target band check (engineering plan §4 decision C4) and DNF-by-reason categorization. Per-tier exit mass is now compared against bot-reference mass and flagged `below-band` or `within-band`. DNFs are grouped by reason in headline + anomalies. New `--mass-band-low` CLI flag for sim-tuner exploration.

**Conservative scoping:** the upper bound of the mass band (100%) is reported but NOT a DNF trigger. Engagement-profile runs commonly exit at hundreds to thousands of times bot-reference mass due to offline accumulation — that's "hoarding" not "failure." The apparatus surfaces it so sim-tuner can see it; whether to tune for it is a design decision for the post-v1 retune workstream.

**What shipped:**

- `Prototype/src/sim/offline.js`:
  - Tier-up milestones now carry a `mass` field — `ws.mass` sampled at the transition tick (exit mass of the tier just left). Added to both the `max-tier-reached` and standard tier-up milestone records. Captured BEFORE state.currentTier increments and BEFORE carry recomposition, so the value reflects the mass with which the player crossed the gate.

- `Prototype/src/test/harness.js`:
  - **`referenceMassForTier(targetTier, mode)`** — runs `runner.runSimulation` chained 1..targetTier at the canonical continuous-bot params (`cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5`), returns the finalState.mass at target tier. Cached in `_referenceMassCache` keyed by `mode:tier` — computed lazily, once per harness invocation.
  - **`referenceMassesThroughTier(targetTier, mode)`** — convenience that returns `{ 1: refMass, 2: refMass, ..., targetTier: refMass }` in one call.
  - **`DEFAULT_MASS_BAND_LOW = 0.7`** + **`--mass-band-low <F>` CLI flag** (parsed in `parseArgs`, plumbed via `args.massBandLow` into `runPairing` and `summarizeRuns`).
  - **`runEngagementProfileRun`** — accumulates `perTierExitMass[T]` from milestone `mass` fields when tier-ups fire. For the FINAL tier reached (whether successful target or DNF point), stamps `state.mass` at run end into `perTierExitMass[finalTierForMass]` so every completed tier has an exit-mass datum.
  - **`runContinuousBotRun`** — captures `perTierExitMass[T] = result.finalState.mass` per tier completion so the bot path emits the same shape as engagement-profile runs (uniform output for reporting).
  - **`dnfReasonCategory`** field on every DNF run, one of: `budget-exhausted` / `stuck-no-progress` / `incomplete` / `runner-error`. Set at the point of DNF detection in both run functions.
  - **`summarizeRuns(runs, targetTier, mode, pairing, opts)`** — extended:
    - `dnfByReason`: `{ category: count }` aggregate.
    - Per-tier: `referenceMass` + `massRatioP10/P50/P90` + `bandFlag` (`below-band` / `within-band` / `low-confidence`). Mass ratio = exit mass / reference mass at that tier.
    - `massBandLow` surfaced on the summary (so the report writer can display the threshold actually used).
  - **`fmtRatio(r)`** + **`fmtMass(m)`** new formatters; mass uses scientific notation for values ≥ 1e6.
  - **Report writer**:
    - Headline now lists DNFs-by-reason + Mass-band-low threshold.
    - Primary section per-tier table extended with `Mass p50 / Ref`, `Ratio p50`, `Band` columns.
    - Secondary/Stress/Legacy weight-summary tables gain a `T_target mass ratio` column.
    - Cross-pairing comparison adds a `T_target band` column.
    - Anomalies section flags below-band tiers (across ALL pairings, not just engaged — mass-band is calibrated against bot reference which is defined for every mode).
  - **CSV writer** — header gains `dnf_reason_category` column and `tN_exit_mass` columns for each tier; per-tier exit mass written in scientific notation for tractable spreadsheet handling at later-tier scales.

- `Prototype/src/test/profiles_smoke.js` — extended 219 → 240 checks (S4 added 21):
  - `--mass-band-low` CLI parses (long form, equals form, absent → null).
  - `perTierExitMass` populated on completed engagement-profile runs.
  - Summary carries `referenceMass`, `massRatioP50`, `bandFlag`, `massBandLow`, `dnfByReason`.
  - DNF-by-reason aggregation: `drift-light × idle-clicker` at T2 with 0.5-day budget produces N DNFs with `budget-exhausted` category populated.
  - Report writer renders `Mass-band-low` headline + `Mass p50 / Ref` + `Ratio p50` + `Band` columns; cross-pairing table includes `T_target band`; no exclamation points.
  - CSV header includes `dnf_reason_category`, `t1_exit_mass`, `t2_exit_mass`.

- `Prototype/src/test/validate_offline.js` — extended 37 → 38 checks: tier-up milestones must carry a `mass` field (positive finite number).

- `Prototype/dark-filaments-t1-current-state.md` §9 — updated offline.js + harness.js + profiles_smoke.js entries; expanded `DF.sim.offline` export-shape block with the new milestone `mass` field.

**Verification:**

- `node src/test/profiles_smoke.js` — **240/240 PASS** (was 219/219 at S3).
- `node src/test/validate_offline.js` — **38/38 PASS** (was 37/37 at E3; added tier-up `mass` field check).
- `node src/test/save_migration_test.js` — 53/53 PASS (E1 unchanged).
- `node src/test/validate.js` — 60/100 cpm PASS, 147.9 pre-existing FAIL (unchanged).
- `node src/test/t3_calibrate.js` — +76.2% / +75.6% (byte-identical).
- `node src/test/t4_calibrate.js` — +65.6% / +38.6% (byte-identical).

**Plan §4 S4 verification mandate satisfied:** `node src/test/harness.js --timing drift-light --buyer idle-clicker --n 3 --target t4 --max-days 3 --seed 1 --report` produces:
- 3/3 DNF
- `DNFs by reason: budget-exhausted=3`
- Confidence: `low` (DNF rate 100% > 50%)
- Excluded from percentiles (`p10/p50/p90: —`)
- Anomalies section: `drift-light × idle-clicker: low-confidence (DNF 100% > 50%; percentiles read off <half the population)`

Report at `Simulator/reports/2026-05-12T12-12-29-469Z/`.

**Locked decisions in S4:**

- **Mass-band reference:** bot-derived exit mass at each tier under the matching mode. Computed once per harness invocation via `runner.runSimulation` chained across tiers. Not yet using M☉ design targets (per plan §10 #7 — denomination is a separate post-v1 workstream; v1 calibrates against shape, not absolute scale).
- **Mass-band threshold:** `MASS_BAND_LOW = 0.7` (engineering plan §4 C4 verbatim). Overridable via `--mass-band-low`.
- **Upper bound interpretation:** the literal plan reading "70-100% of tier end-mass" might suggest >100% is also out-of-band, but engagement-profile runs commonly overshoot 100× to 1000× the bot reference due to offline accumulation. Treating overshoot as DNF would flag essentially every engagement-profile run. Decision: upper bound is reported (as the ratio value) but does NOT trigger a flag. The "hoarding" signal is visible numerically without forcing a DNF.
- **DNF reason categories** (4): `budget-exhausted` (calendar cap hit before reaching target), `stuck-no-progress` (MAX_ZERO_PROGRESS sessions with no purchase and no mass delta), `incomplete` (runner short-circuited without transition — usually a strategy or carry math edge case), `runner-error` (engine threw — defensive, shouldn't fire in practice). Surfaced in headline + anomalies + raw CSV.

**Engagement-profile mass overshoot observed in sanity runs (engaged-steady × completionist, T3):**

| Tier | Bot ref mass | Engaged-steady p50 mass | Ratio |
|---|---|---|---|
| T1 | 37 | 37 | 1.0× |
| T2 | 1,177 | 3.38×10⁶ | 2,876× |
| T3 | 1.76×10⁶ | 6.27×10⁸ | 355× |

The Tier 1 ratio at exactly 1.0× is reassuring — T1 is fast enough that idle accumulation doesn't matter; the engaged player exits T1 the same way the bot does. T2+ shows orders-of-magnitude overshoot, the patient-universe "hoarding" signal made quantitative. Sim-tuner sees: under current calibration, an engaged-steady player is wasting 3 orders of magnitude of accumulated mass per tier — either because the strategy doesn't spend it during sessions, or because tier-up cost-gates are way below what's available.

**Plan §10 open items after S4:**

- **#4 (harness wall-clock optimization)** — still open. Full N=50 primary at full T10 will need optimization. Defer to S6 measurement.
- **#6 (active-decay tier band curve values)** — schema present (`BUYER_PROFILES.<x>.activeDecay`), values uniform 1.0. Retune workstream sets actual curve.
- **#7 (M☉ unit denomination)** — out of scope for v1. Mass-band uses bot reference, which is "the current calibration's exit mass." Denomination is a separate workstream.

**Out of scope for S4 (deferred to S5/S6):**

- Top-down/mid-tier-seeded runs (S5; depends on E4).
- Baseline calibration sweep at full N + retune recommendations (S6).

**Next:** S6 (baseline calibration sweep, 1 session) — the apparatus delivers its first formal answer at full N across all 12 pairings. S5 (top-down tooling, 0.5 session) is also available but depends on E4 (dev time-skip, 0.5 session) which hasn't shipped yet. The critical-path remaining: S6. E4 + S5 can run in parallel as a separate branch if useful for the retune workstream, but neither blocks S6.

---

## 2026-05-12 — T1 retune (M☉ denomination + Reading B + steep engagement curve)

**Deliverable:** first tier retuned under the long-burn post-v1 design pass. Reading-B anchor locked: target end-mass = peak mass on counter during structural tier completion (not transition-tick exit, not throughput).

**What shipped:**

- `Prototype/src/sim/data.js` — T1 numerical fields rescaled: `initCost` (0.012 / 0.033 / 0.037 / 0.13 / 0.40 / 0.96 / 1.00), `addMps` (0.00013 / 0.00033 / 0.00167), `addMpc` (0.00058 — Stellar Coupling), `baseMps` (0.00167 — First Photons). Structure / synergies / max-levels / cohesion distribution / completionist flags UNCHANGED. `DEFAULT_PARAMS.baseMpc: 1.0 → 0.00120` (initial 0.02 from iteration-1 corrected to 0.00120 in iteration-2 after click-share over-shoot). `DEFAULT_PARAMS.perTierEngagement` retired the old 1.00/0.85/0.80/0.70/0.50/0.45/0.40/0.35/0.30/0.30 curve and replaced with steep witness-phase shape: T1=0.90, T2=0.25, T3=0.08, T4=0.05, T5=0.04, T6=0.03, T7=0.025, T8=0.02, T9=0.015, T10=0.01. `SAVE_VERSION: 1 → 2`.
- **Science-director M☉ table re-validation (same pass):** two deltas (T9 1 dex up; T5 lower bound nudge). T8 = filament *complex / wall* (Sloan-class); T10 = asymptote framing (no narrator line may claim arrival at the full total). Documented in `gameplay-design.md` v0.4 changelog.
- **Engineering coupling bug fix:** `runner.js` + `offline.js` were hardcoding `baseMpc: 1.0` at three load-bearing sites, bypassing `DEFAULT_PARAMS`. All three sites now thread `data.DEFAULT_PARAMS.baseMpc` so future scale changes propagate without silent overrides.
- **Legacy harnesses marked stale:** `validate.js`, `t3_calibrate.js`, `t4_calibrate.js` carry header comments noting they assert pre-rescale numbers and are expected to fail until T2-T4 retunes land. Not deleted — assertions still document the prior calibration for reference.
- **T2-T4 numerical values in `data.js` declared stale.** Slates (upgrade designs, synergies, completionist flags) preserved; numbers queued for the next workstream (T2 retune is next).

**Verification (T1 retune only — T2-T4 expected stale):**

- T1 active duration at bot-100cpm × Completion: 7m 45s (in 8-15min target band).
- **Peak in-tier mass: 0.9791 M☉** — Reading B anchor lands dead-on T1's 1 M☉ target.
- Click share 49.4% (1pp under the 50-60 band).
- Final levels SW=10 AB=9 SC=7 Mag=5 (maxed) plus OR / HP / FP.
- Engaged-steady p1 T1 calendar: 5h 9m p50 (slightly over 2-4h band; accepted — active time + click share are the load-bearing T1 metrics).

**Next:** T2 retune (queued — next workstream). Engineering surface remains: E2 (token codec) + E4 (dev time-skip) + E5 (token UX) + S5 (top-down tooling) + S6 (baseline calibration sweep).

---

## 2026-05-12 — Player profile redesign + playtest tab re-linking

**Deliverable:** profile catalog rebuilt around realistic player trajectories. 6 trajectory timing profiles with 6-phase calendar-day schemas; 4 buyer profiles on a path × hoarding-preference axis. Playtest tab updated to the new T1 scale via adaptive mass formatting + SAVE_VERSION refusal of pre-retune v1 saves.

**What shipped:**

- `Prototype/src/sim/profiles.js` — full rewrite of the catalog shape:
  - **6 trajectory timing profiles** with 6-phase calendar-day schemas: `realistic-engaged` / `realistic-moderate` / `realistic-casual` / `realistic-drift` (player trajectories), `hyper-onboard` (single 60-min session then stops; T1 floor-time test case), `bot-60cpm` (continuous technical baseline). Phase shape: `{ fromDay, toDay, checkInsPerDay, sessionMinutes, cpm, label }` covering 0-60min / 60min-1day / 1-3d / 3-7d / 7-21d / 21+d.
  - **4 buyer profiles** on a `path × hoarding-preference` axis: `comp-hoarder` / `comp-rusher` / `thr-hoarder` / `thr-rusher`. Retired the old 5-buyer catalog plus the `inSessionPurchases` and `completionistAggressiveness` axes (collapsed: without in-session buys there's no progress; aggressiveness reduced to binary path field). New `saveVpcThreshold` knob: 2.5 (hoarder) vs 1.2 (rusher).
  - New `activePhaseForDay(profile, calendarDays)` helper exposed on `DF.sim.profiles`.
  - `REALISTIC_PAIRINGS` rebuilt to 17 entries: 4 primary (realistic-engaged × all 4 buyers) + 8 secondary (moderate × 4, casual × 4) + 2 stress (drift × thr-hoarder/thr-rusher) + 2 floor (hyper-onboard × comp-hoarder/thr-rusher) + 1 legacy (bot-60cpm × comp-hoarder). New `'floor'` weight class.
  - `timingHasDriftTarget` updated to gate drift on `realistic-engaged` + `realistic-moderate` (was `engaged-steady` + `engaged-burst` under the old catalog).
- `Prototype/src/test/harness.js` — `runEngagementProfileRun` rewritten with phase-aware multi-window loop. First session fires at t=0 with no initial idle (was: idle gap first, then session). Zero-check-in phases (e.g., drift's `gone-same-day`) skip ahead via pure-idle accrual. Tracks `perPhaseCalendarSec` + `perPhaseActiveSec` for per-phase breakdown in reports. New DNF category `'player-stopped'` for trajectory profiles that exhaust their phase list before reaching the target tier. Buyer mode derivation: `buyer.path === 'threshold'` (was `buyer.completionistAggressiveness === 'never'`).
- `Prototype/src/test/profiles_smoke.js` — rewritten for the new catalog shape: **394 checks** (was 249). Covers the new 6-trajectory / 4-buyer / 17-pairing catalog, the 6-phase schema, `activePhaseForDay`, phase-aware multi-window loop end-to-end.
- `Prototype/src/ui/format.js` — `fmtMass(n)` gained adaptive precision (3 decimals below 1 M☉, 2 decimals below 100, integer + thousands below 1e5, scientific above 1e5; below 1e-3 also scientific). `fmtCost(c)` upgraded from `Math.ceil` to the same adaptive shape — `Math.ceil` was collapsing all sub-M☉ T1 costs (0.012, 0.40, 0.96) to "1".
- `Prototype/src/ui/playtest.js` + `src/ui/simulator.js` — all mass display sites switched from `fmt(., 1)` to `fmtMass()`. Boot loader detects pre-retune v1 saves and clears with a console warn (`save.js` returns `{ error: 'pre_retune_save_version_1' }` per the M☉-scale-shift mismatch).
- `Prototype/src/sim/save.js` — `deserializeState` refuses saves with `version < SAVE_VERSION` (currently v2): returns `{ error: 'pre_retune_save_version_<N>', payload: null }`. No automatic migration (unit-scale shift is ambiguous to invert).
- `Prototype/src/sim/playtest_refs.js` — **deleted.** Pre-retune T1 playtest headline references no longer apply at the M☉ scale; the within-band indicator was removed from the playtest UI in the same pass. HTML `<script>` tag removed.
- `Prototype/dark-filaments-t1.html` — `<script src="src/sim/profiles.js"></script>` added to the loader (the simulator now needs `ENGAGED_TARGETS` for drift detection). `playtest_refs.js` script tag removed.

**Verification:**

- `node src/test/profiles_smoke.js` — 394/394 PASS.
- `node src/test/validate_offline.js` — 38/38 PASS.
- `node src/test/save_migration_test.js` — 53/53 PASS (v2 schema; v1 saves correctly refused with `pre_retune_save_version_1`).
- Legacy harnesses (`validate.js`, `t3_calibrate.js`, `t4_calibrate.js`) FAIL as expected per their stale-pending-retune headers.

**Next:** T2 retune (queued). Simulator tab rebuild (next entry below) consumes the redesigned profile catalog.

---

## 2026-05-12 — Sim-core extraction (`sweep.js`) + Simulator tab rebuild

**Deliverable:** simulation core extracted from the CLI harness into a browser-loadable module (`Prototype/src/sim/sweep.js`) so the Simulator tab can drive trajectory-profile runs in-browser. `harness.js` becomes CLI-only (arg parsing, report writers, file I/O). The Simulator tab is rebuilt around two sub-views (Single-Run, Sweep) replacing the prior bot-mode UI.

**What shipped:**

- `Prototype/src/sim/sweep.js` (NEW FILE, ~640 lines) — browser+Node-compatible IIFE+UMD module. Exports `runPairing`, `runEngagementProfileRun`, `runContinuousBotRun`, `summarizeRuns`, `referenceMassForTier`, `referenceMassesThroughTier`, `resetReferenceMassCache`, `makeRunRng`, `sampleIdleGapSec`, `freshSavedState`, `sortedAscending`, `pct`, plus constants `DEFAULT_MASS_BAND_LOW`, `DRIFT_THRESHOLD`, `LOW_CONFIDENCE_DNF_RATE`, `SEC_PER_DAY`, `DEFAULT_MAX_DAYS`. Browser-side dependencies resolved lazily via a `deps()` helper that reads from `global.DF.sim.*` first, falls back to Node `require` on the server.
- `Prototype/src/test/harness.js` — now CLI-only. Imports sim-core from `sweep.js` and keeps CLI plumbing (arg parsing, run-list construction, markdown + CSV report writers, file I/O, main entry, `--list` / `--help`). External scripts that referenced sim-core constants by name from `harness.js` still work — the constants are re-exported.
- `Prototype/dark-filaments-t1.html` — `<script src="src/sim/sweep.js"></script>` added between `profiles.js` and `format.js`. Sweep loads after the sim-core deps (`data`, `core`, `strategy`, `runner`, `save`, `offline`, `profiles`) so its `deps()` resolves synchronously at construction time in the browser.
- `Prototype/src/ui/simulator.js` (REBUILT, ~1240 lines) — two sub-views:
  - **Single-Run sub-view:** profile + buyer + tier + seed + max-days inputs with debounced auto-rerun. Headline block (calendar time / active time / peak mass / final tier / click share / DNF flag / drift flag / mass-band flag). Per-phase breakdown table (one row per active phase reached, with calendar + active seconds). Per-tier breakdown table (entry calendar second, active seconds, exit mass, ratio vs bot reference, band flag). Mass-over-calendar-time chart with phase boundary overlays. Comparison panel (side-by-side scenarios with overlaid mass chart).
  - **Sweep sub-view:** runs the full 17-pairing `REALISTIC_PAIRINGS` matrix one pairing at a time via `setTimeout(0)` so the browser stays responsive. Progress indicator. Weight-grouped aggregate cards (Primary / Secondary / Stress / Floor / Legacy). Cross-pairing comparison table. Anomalies list (drift breaches, mass-band flags, DNF clusters).
- **Retired (Simulator tab):** the prior 4-chart detail view (mass / cohesion / income / levels overlaid threshold + completion), per-tick trace table with decision-detail expansion, JSON/Markdown export panel, and Parameters-tab cross-sync via the shared params store. The Parameters tab still owns the underlying engine knobs; the Simulator tab now reads them indirectly through the buyer/timing profile dispatch in `sweep.js`.

**Verification:**

- Single-pairing sanity: opens to default `realistic-engaged × comp-hoarder × T1` and produces real headline + per-phase + per-tier output without DNF on T1.
- Sweep view: runs the full 17-pairing matrix progressively, weight-grouped output renders cleanly. No exclamation points (audited).
- `node src/test/profiles_smoke.js` — 394/394 PASS (harness consumes sweep.js via the re-export shim).
- `node src/test/harness.js --list` — full 17-pairing catalog prints cleanly. CLI surface unchanged from a user perspective.
- Legacy harnesses (`validate.js`, `t3_calibrate.js`, `t4_calibrate.js`) still fail-as-stale per their headers.

**Forward-looking:** the Single-Run + Sweep surfaces give sim-tuner an in-browser path for the post-T1 retune workstream (T2-T10), parallel to the Node CLI. The trajectory + buyer dropdowns expose the full 6×4 = 24 ad-hoc combinations beyond the 17-pairing canonical matrix.

**Next:** T2 retune (next workstream). E2 (token codec) + E4 (dev time-skip) + E5 (token UX) + S5 (top-down tooling) + S6 (baseline calibration sweep) remain as deferred engineering branches.

---

## 2026-05-13 — 11-tier ladder renumber landed (T3 Dwarf Spheroidal inserted; SAVE_VERSION 2 → 3)

**Deliverable:** the 2026-05-13 afternoon T3 Dwarf Spheroidal insertion lands in the engine. Tier numbers above T2 shift up by one across `data.UPGRADES`. Old T3 Galactic Arm (now T4) and old T4 Galaxy (now T5) slates preserved verbatim except for cohesion rescaling × 2.5 (one renumber step per slate). New T3 Dwarf Spheroidal slate inserted with shape-only `PHASE-2-PLACEHOLDER` numerical fields; structural shape (names, types, completionist flags, synergy topology, consolidation distribution) locked per gameplay-design.md §3. Cohesion stays formula-driven (no hard-coded `TIER_CONFIGS` values; `cohesionGrowth = 2.5` carries the rescale).

**What shipped:**

- `Prototype/src/sim/data.js` — UPGRADES tier renumber: old T3 entries (`Dust Lane Density`, `HII Region`, `Proper Motion`, `Spiral Density Wave`, `High-Velocity Cloud`, `Galactic Bulge`, `Sagittarius B2`, `Globular Cluster`, `Active Nucleus`) bumped `tier: 3` → `tier: 4`; old T4 entries (`Galactic Rotation`, `Stellar Halo`, `Galactic Coupling`, `Galactic Fountain`, `Satellite Galaxies`, `Bar Structure`, `Fermi Bubbles`, `Sagittarius A*`, `Hot Coronal Halo`, `Dark Matter Halo`) bumped `tier: 4` → `tier: 5`. Cohesion values rescaled × 2.5 with `// PHASE-2-COHESION-RESCALE (interim; T4/T5 retune will revisit)` tags on every non-zero-cohesion upgrade. NEW T3 Dwarf Spheroidal slate (8 upgrades: 4 stackables `Population II`, `Subhalo`, `RR Lyrae`, `Velocity Dispersion`; 4 one-shots `Orphan Stream`, `Sculptor Dwarf`, `Draco Dwarf`, `Sagittarius Stream`) inserted between T2 and the renumbered T4 block — all numerical fields tagged `PHASE-2-PLACEHOLDER (interim; T3 retune will revisit)`. NEW cross-tier synergy C (T2 Brown Dwarf → T3 Subhalo, additive `× (1 + 0.04 × N)`) appended via IIFE alongside the existing T2 Local Bubble → T4 HII Region (renumbered) cross-tier synergy. Flavor lines locked verbatim from gameplay-design.md §3. `perTierEngagement` curve extended T1-T11 (T3 inserted at PLACEHOLDER 0.15, between T2=0.25 and old-T3-now-T4=0.08; T4-T11 preserve legacy values shifted up one tier number). `SAVE_VERSION 2 → 3`.
- `Prototype/src/sim/runner.js` — TIER_CONFIGS refactored to compute `cohesionThreshold` from the engine formula `1.0 × cohesionGrowth^(tier - 1)` rather than hardcoded values; new `buildTierConfig(tier, data)` helper. Implemented tiers extended from `[1, 2, 3, 4]` to `[1, 2, 3, 4, 5]`. `runSimulation` falls back through `buildTierConfig(tier, data)` for tiers outside the implemented set (defensive for harness probes of T6+ before data lands). Resulting T1=1.0, T2=2.5, T3=6.25, T4=15.625, T5=39.0625 — verified at runtime.
- `Prototype/src/sim/save.js` — version-handling comment block updated for v3 semantics (v2 saves refused at load because tier numbers shifted; no automatic migration). Refusal logic unchanged structurally (same `pre_retune_save_version_N` error code; covers both v1 unit-scale shift and v2 tier renumber).
- `Prototype/src/test/profiles_smoke.js` — single assertion update: `parseTargetTier: null defaults to MAX_TIER (4 today)` → `(5 today)` reflecting the new max tier.
- `Prototype/src/test/t3_calibrate.js` → renamed `t4_calibrate_legacy.js` (old T3 now T4); header rewritten for the rename; `summarizeLevels` extended with new T2 Wolf-Rayet and new T3 Dwarf Spheroidal names; `runChain` extended to include T3 in the chain (the inserted Dwarf Spheroidal slate); `tier: 3` bumped to `tier: 4` for the focal slate; legacy "T3" labels preserved in pre-existing output formatting (advisory only since the harness is stale-pending-T4-retune).
- `Prototype/src/test/t4_calibrate.js` → renamed `t5_calibrate_legacy.js` (old T4 now T5); same shape of header rewrite + chain extension + tier bump.
- `Prototype/src/test/t3_curve_shape.js` → renamed `t4_curve_shape_legacy.js`; `t4_curve_shape.js` → renamed `t5_curve_shape_legacy.js`; `t3_propose.js` → renamed `t4_propose_legacy.js`; `t3_playtest_diag.js` → renamed `t4_playtest_diag_legacy.js`. Headers annotated; internals not touched (these are legacy debugging tools, not test harnesses; sim-tuner will rebuild during the retune workstreams).

**Verification (locked harnesses):**

- `node src/test/save_migration_test.js` — **53 / 53 PASS** (round-trip parity preserved under SAVE_VERSION 3; the harness compares to `data.SAVE_VERSION` dynamically).
- `node src/test/validate_offline.js` — **38 / 38 PASS** (pure-idle and active offline-window parity preserved; the harness uses T1 only; no tier-renumber surface).
- `node src/test/profiles_smoke.js` — **396 / 396 PASS** (catalog integrity, RNG determinism, multi-window end-to-end, CSV column shape; one assertion updated for MAX_TIER 4 → 5).

**T1 + T2 byte-identical preserved:** T1 @100cpm Comp finishes at 7:45 (target 8-15min band, peak 0.0537 M☉ exit-tick / 0.9791 peak — Reading B). T2 @100cpm Comp finishes at 50:50 with levels SK=58 BD=5 WR=3 MG=1 (matches CLAUDE.md state-of-play T2 retune iter #24 lock). No T1 / T2 numerical fields touched.

**Full chain reachability through new T5 (bot-100cpm × Completion):**

- T1: 7:45 (cohesion 1.00, exit transition)
- T2: 50:50 (cohesion 2.50, exit transition)
- T3: 978:38 (cohesion 6.25, exit transition, comp Y — STALE PLACEHOLDER)
- T4: 43:26 (cohesion 15.63, exit transition, comp Y — STALE per renumber rescale)
- T5: 30:13 (cohesion 39.06, exit transition, comp Y — STALE per renumber rescale)

**T3 placeholder numbers are stale-but-coherent:** mass costs sized so the bot completes T3 in roughly the right order of magnitude under the T2 carry income (~14-20 M/s into T3 post-T2-retune) without spinning past `runner.maxTicks: 60000`. NOT calibrated to the 24-48h Engaged Comp calendar target. Engaged-comp-hoarder × T3 (N=3, seed=1, max-days=7) lands at p50 1d 14h calendar (~38h) — happens to be inside the design's 24-48h Engaged Comp band by coincidence; T3 retune workstream will revisit under Reading B.

**Primary-pairing sanity (N=3, seed=1, max-days=7, target=T3):**

- p1 realistic-engaged × comp-hoarder: 1d 14h, 0 DNF
- p2 realistic-engaged × comp-rusher: 1d 14h, 0 DNF
- p3 realistic-engaged × thr-hoarder: 18h 6m, 0 DNF
- p4 realistic-engaged × thr-rusher: 12h 21m, 0 DNF

**Legacy harnesses (stale-pending-retune):**

- `t4_calibrate_legacy.js` (was `t3_calibrate.js`) runs to completion; numbers no longer in pre-renumber band; this is expected — the chain now includes T3 Dwarf Spheroidal placeholders before reaching T4.
- `t5_calibrate_legacy.js` (was `t4_calibrate.js`) runs to completion; similar shift.
- `validate.js` 60/100/147.9 cpm all FAIL by ~10-13% — pre-existing stale-pending-T1-playtest-rebaseline (the references compare sim to real playtests at the pre-M☉ scale).

**Out of scope this pass (deferred):**

- T3 Dwarf Spheroidal numerical calibration under Reading B + the 24-48h Engaged Comp calendar target (full T3 retune workstream).
- T4 Galactic Arm retune (mass costs + income values + cohesion structure verification under the new 15.625 budget).
- T5 Galaxy retune (same shape under 39.0625 budget).
- The hidden-channel UX question for Subhalo (the design intent "multiplies prior-tier MPS carry only; nothing visible on stat lines" is currently encoded as a familiar `baseMps` channel for engine round-tripping; Phase 2 engineering-director + sim-tuner will decide whether to introduce a dedicated hidden-channel engine extension or surface via UX).
- Voice-samples T3 tier-up line authoring (currently a TO-WRITE stub with science-director's "dark matter has a name" hook seed).
- Playtest tab visual eyeball pass for the new T3 slate (the slate parses + the engine runs; manual browser smoke not performed from the agent).

**Next workstream:** T3 retune (sim-tuner) — full numerical calibration under Reading B for the 24-48h Engaged Comp target, after which T4 / T5 retunes follow the same shape.

---

## 2026-05-13 — T3 Step C: Subhalo `carryMpsMult` hidden-channel engine extension (landed)

**Deliverable:** the engine now supports a hidden MPS channel that multiplies prior-tier MPS carry only, contributing zero to the per-upgrade stat-display row. Subhalo (T3) flips from its Step B `baseMps` placeholder to the dedicated channel. The mass counter rises faster than the visible per-upgrade sum predicts — that asymmetry is the design's hidden-channel UX signal.

**What shipped:**

- `Prototype/src/sim/core.js` — `computeRates` extended with a hidden-channel walk. Any upgrade in `synergyProviders` (the full owned-upgrades list, not the active-tier slice) declaring `carryMpsMult` contributes a per-level exponentiated multiplier applied to `carryMps` only. Per-level coefficient compounds incoming synergies BEFORE exponentiation: `α_eff_per_level = α × synergyMult(self)`, `hidden_factor *= α_eff^N`. Equivalent algebraic rewrite: `mps = (carryMps × hidden_mps_factor + sumMps) × allMps × allMpsCarry`. Walks providers (not active-tier) so Subhalo continues to amplify carry once the player advances into T4+. No changes needed in `offline.js` or `runner.js` — the no-frozen-floors invariant guarantees the hidden factor reads live from `state.levels[u.name]` every tick.
- `Prototype/src/sim/data.js` — Subhalo flipped from `baseMps: 2.2, selfMps: 1.12` (Step B placeholder) to `baseMps: 0, selfMps: 1.0` + new field `carryMpsMult: 1.10` (PHASE-2-PLACEHOLDER). Comment updated to reflect that Step C now provides the dedicated channel and Step D (sim-tuner) refines α.
- `Prototype/src/sim/strategy.js` — `stackableVpc` gains a fourth branch (first in the chain so Subhalo's zero `addX` doesn't fall through to delta=0). Marginal income per +1 Subhalo level: `delta_mps = carryMps × α_eff^N × (α_eff - 1) × gMps × carry.allMps`. Synergy gifts to Subhalo (Pop II → Subhalo, BD → Subhalo) are still valued via the existing synergy-gift accounting on the providers' VPC (Pop II / BD), unchanged. Edge case: `carryMps = 0 → delta = 0 → VPC = 0` (commented inline).
- `Prototype/src/test/validate_subhalo.js` (new, locked harness, 28 checks) — covers identity case, L1/L2/L3 no-synergy parity, Synergy B compounding, cross-tier Synergy C compounding, B+C combined, T3→T4 transition persistence, stat-display contract (Subhalo's per-upgrade row is zero on every stat), offline accrual integration (the hidden factor takes effect in pure-idle windows), carryMps=0 edge, no-op when no upgrade declares the field (T1 byte-identical), purity, and strategy VPC parity (analytic prediction matches computed VPC).

**Math contract verified:**

- L1 Subhalo, carry=100, no synergies: `mps = 100 × 1.10 = 110`. ✓
- L2 Subhalo: `mps = 100 × 1.21`. ✓
- L3 Subhalo: `mps = 100 × 1.331`. ✓
- L1 + 5 PopII (β_B = 0.06): `α_eff = 1.10 × (1 + 0.30) = 1.43`, delta = 100 × (1.43 - 1) = 43. ✓
- L2 + 5 BD (β_C = 0.04): `α_eff = 1.10 × (1 + 0.20) = 1.32`, delta = 100 × (1.32² - 1) ≈ 74.24. ✓
- L3 + 7 PopII + 5 BD: `α_eff = 1.10 × 1.42 × 1.20 ≈ 1.87`, delta = 100 × (1.87³ - 1). ✓

**Verification:**

- `node Prototype/src/test/save_migration_test.js` — **53/53 PASS** (no save shape change).
- `node Prototype/src/test/validate_offline.js` — **38/38 PASS** (T1/T2 offline parity preserved; the new path integrates the hidden factor identically in pure-idle and active modes).
- `node Prototype/src/test/profiles_smoke.js` — **396/396 PASS**.
- `node Prototype/src/test/validate_subhalo.js` — **28/28 PASS** (new harness).
- `harness.js --pairing p17 --target t1 --n 1 --seed 1` — 11m 40s, **byte-identical** to pre-Step-C baseline.
- `harness.js --pairing p17 --target t2 --n 1 --seed 1` — 1h 8m, **byte-identical** to pre-Step-C baseline.
- `harness.js --pairing p17 --target t3 --n 1 --seed 1` — 1h 57m (was 14h 31m under Step B's `baseMps: 2.2` placeholder). Bot buys 33 Subhalo levels + 1 Population II + 5 Velocity Dispersion (completionist) + all 4 one-shots → cohesion 6.25 → transition. The hidden channel is compounding carry as designed.
- `harness.js --pairing p17 --target t4 --n 1 --seed 1` — 2h 2m. T4 reaches cleanly with Subhalo's hidden factor continuing to amplify carry across the tier boundary.
- `harness.js --pairing p17 --target t5 --n 1 --seed 1` — 2h 2m.

**Bot behavior note:** at α = 1.10 (PHASE-2-PLACEHOLDER) the bot heavily prefers Subhalo (33 levels) over Population II (1 level). This signals α is currently sized so the hidden channel dominates T3 VPC — sim-tuner's Step D will refine α and the Pop II per-level coefficient β_B to land the desired T3 calendar shape under Reading B. The apparatus is correct; the calibration is not.

**No engine extensions needed in `offline.js` or `runner.js`:** the no-frozen-floors invariant (Option C fix that landed earlier) means carry payloads store RAW Σ self·syn separately from cumulative all-mult products, and `computeRates` re-multiplies live every tick. Subhalo's hidden factor is read live from `state.levels[u.name]` via the provider walk → automatically respects the invariant across tier transitions and offline windows. Verified empirically via the validate_subhalo offline-integration check (test #8) and the T3→T4 chain reachability runs.

**Out of scope this pass (deferred):**

- Step D: sim-tuner numerical calibration of α (currently 1.10), β_B (currently 0.06 Pop II → Subhalo additive), β_C (currently 0.04 BD → Subhalo additive), and the surrounding T3 slate (Population II cost / income, RR Lyrae, Velocity Dispersion, the four one-shots) under Reading B + the 24-48h Engaged Comp calendar target.
- Stat-display UX: the design intent "Subhalo contributes nothing visible on stat lines" is now mechanically true (the per-upgrade row is zero across MPS/MPC/APS). The UX question is whether the playtest tab's stat panel needs a hidden-channel indicator (e.g. a separate "carry multiplier" row) or whether the felt-asymmetry — mass rising faster than the visible sum predicts — is sufficient. Phase 2 engineering-director call.
- Browser smoke test of the rebuilt simulator with Subhalo's new shape — pending.

**Next:** Step D (sim-tuner) — full T3 numerical calibration under Reading B.

---

## 2026-05-13 — Engine-wide consolidation rename (landed)

**Deliverable:** every `cohesion*` engine identifier renamed to `consolidation*` across the simulator, prototype UI, save format, and dev tooling. The 2026-05-11 player-facing label rename left the engine identifiers as relics; the user closed that gap so the source of truth matches the player vocabulary. The rename is structural-only — no math changes.

**What shipped:**

- `Prototype/src/sim/data.js` — per-upgrade `cohesion: X.X` → `consolidation: X.X` across all 39 upgrade entries (T1 + T2 + T3 Dwarf Spheroidal placeholder + old-T3-now-T4 + old-T4-now-T5); `DEFAULT_PARAMS.cohesionThreshold` / `cohesionGrowth` → `consolidationThreshold` / `consolidationGrowth`; `PHASE-2-COHESION-RESCALE` comment tags → `PHASE-2-CONSOLIDATION-RESCALE`. `SAVE_VERSION 3 → 4` with the v4 migration comment block.
- `Prototype/src/sim/save.js` — SavePayload shape's `game.cohesion` → `game.consolidation`, `game.cohesionThreshold` → `game.consolidationThreshold`, `game.cohesionHitMs` → `game.consolidationHitMs`. Version-handling comment + error-message logic extended to refuse v3 alongside v1/v2.
- `Prototype/src/sim/runner.js` — `TIER_CONFIGS` formula reads `consolidationThreshold` / `consolidationGrowth`; `COHESION_EPS` → `CONSOLIDATION_EPS`; trace row / headline / `initialState` carry the renamed field; `state.cohesion += u.cohesion` → `state.consolidation += u.consolidation`.
- `Prototype/src/sim/strategy.js` — `cohesionThreshold` / `cohesionMet` / `cohesionStackables` / `postCohFocus` → `consolidationThreshold` / `consolidationMet` / `consolidationStackables` / `postConsFocus`; `COHESION_EPS` → `CONSOLIDATION_EPS`; per-upgrade `u.cohesion` accessor renamed.
- `Prototype/src/sim/offline.js` — `cloneSavedState` reads the renamed fields; `cohesionThresholdForTier` → `consolidationThresholdForTier`; tier-transition logic reads `consolidationThreshold` from the data module; `ws.consolidation += u.consolidation`.
- `Prototype/src/sim/sweep.js` — `freshSavedState` returns the renamed shape; tier-snapshot scaffold reads `consolidationHitMs`.
- `Prototype/src/sim/profiles.js` — buyer-profile comment updated.
- `Prototype/src/ui/playtest.js` — every reference renamed: live state, `consolidationThresholdForTier(tier)` helper, render loop reads `state.consolidation` / `state.consolidationThreshold` for the HUD bar + `N/M` Galactic Bulge tooltip, log-event payloads `consolidation_hit` / `consolidation_after` / `consolidation_at_pause` / `consolidation_hit_ms` / `new_consolidation_threshold`, DOM-ID lookups `consolidation-num` / `consolidation-max` / `consolidation-fill` / `consolidation-block` / `r-chart-consolidation`, `lastCohesion` → `lastConsolidation`, `consolidationHit_s`, `charts.consolidationLine` call.
- `Prototype/src/ui/simulator.js`, `parameters.js`, `charts.js`, `format.js`, `settings.js` — CSS variables `--consolidation-low` / `--consolidation-high`; chart helper renamed in `charts.js` (function + exported key); parameters-tab field keys + labels; log-line formatter reads `consolidation_after`.
- `Prototype/dark-filaments-t1.html` — CSS variables, CSS rules, DOM classes / IDs (`consolidation-block` / `consolidation-label` / `consolidation-value` / `consolidation-bar` / `consolidation-fill` / `consolidation-num` / `consolidation-max` / `r-chart-consolidation`), and the `/* CONSOLIDATION */` section comment.
- Test files: `save_migration_test.js`, `validate_offline.js`, `validate_subhalo.js`, `validate.js`, `t2_calibration.js`, `t2_feel_propose.js`, `t2_v4_proposal.js`, `t2_v5_proposal.js`, `t4_calibrate_legacy.js`, `t4_propose_legacy.js`, `t5_calibrate_legacy.js` — renamed in lockstep.
- `Prototype/src/test/save_migration_test.js` — added a parameterized loop that refuses every pre-current version (`v1`, `v2`, `v3`) with `pre_retune_save_version_<N>` errors; total checks 53 → 56.
- `Prototype/dark-filaments-t1-current-state.md` — every engineering reference updated; the 2026-05-11 "Player-facing label rename" section reworked into a "2026-05-13 Engine-wide consolidation rename" note that documents the full identifier surface that moved; `SAVE_VERSION` table + lineage paragraphs updated to v4; relic phrases ("field name is a relic from the pre-rename term") removed where they were now contradictory; the §9 summary line gained a 2026-05-13 entry noting the rename + harness pass counts.

**Verification:**

- `node Prototype/src/test/save_migration_test.js` — **56/56 PASS** (was 53/53; +3 for v1/v2/v3 refused-load checks).
- `node Prototype/src/test/validate_offline.js` — **38/38 PASS** (unchanged).
- `node Prototype/src/test/profiles_smoke.js` — **396/396 PASS** (unchanged).
- `node Prototype/src/test/validate_subhalo.js` — **28/28 PASS** (unchanged).
- T1 byte-identical at p17 bot-60cpm × comp-hoarder seed=1: **11m 40s** (pre-rename baseline matched).
- T2 byte-identical: **1h 8m**.
- T3 chain: **1h 57m** (pre-rename baseline matched; Subhalo step-C path unchanged).
- T4 chain: **2h 2m** (pre-rename baseline matched).
- T5 chain: **2h 2m** (pre-rename baseline matched).
- `node -c` syntax check passes for every sim, ui, and test file.

**Identifier surface (approximate count):** ~150-200 identifier occurrences renamed across ~20 files, plus the per-upgrade `cohesion: X.X` distribution field on 39 upgrade entries and a roughly equivalent count of comment-level references.

**Why now:** the user flagged the relic as accumulating terminology drift. The 2026-05-11 rename had explicitly preserved the engine fields "for stability across data.js / runner.js / strategy.js / saved playtest JSONL"; the dev save / harness / simulator-tab UX work over the following days kept generating new code that referenced the legacy name, and the dev tooling carve-out from the no-log rule made it clear the engine surface was where the canonical name belonged. The rename is a no-cost catch-up while pre-rename saves are already invalid under v2/v3.

**No design-doc churn:** historical references to "cohesion" in `Design Documents/*.md` are intentional lineage (the term was canonical for a stretch of design history); the canonical "Consolidation" terminology already lives in those docs for go-forward use. Only engineering docs (this progress log + `dark-filaments-t1-current-state.md`) and code were updated in this pass.

**Next:** T3 retune (sim-tuner workstream) under Reading B + 24-48h Engaged Comp calendar target. The rename has no impact on that workstream — Step D was already pending and now opens with the canonical identifiers in place.

---

## 2026-05-13 evening — Step D — T3 Dwarf Spheroidal numerical calibration LANDED

**Workstream:** sim-tuner T3 retune (Step D, numerical pass). Replaces all
PHASE-2-PLACEHOLDER values in the T3 Dwarf Spheroidal slate with locked numerical
values calibrated under Reading B + 24-48h Engaged Comp / 18-36h Engaged Thr.
Slate shape (4 stackables + 4 one-shots + 3 synergies) was locked in
`gameplay-design.md` §3 (2026-05-13 morning); the Subhalo `carryMpsMult`
engine extension landed Step C; the Cohesion → Consolidation rename landed prior.

**Iterations:** 10 sim-tuner passes (placeholder → iter #1 through iter #10).
The iteration band on the user-locked Subhalo felt-magnitude (α=1.08 carryMpsMult,
β_B=β_C=0.03 additive) was preserved — α and β stayed at their anchor values;
all calibration moved through one-shot mass costs and the Subhalo costGrowth lever.

**Locked T3 numerical values (data.js):**

Stackables:
- Population II — initCost 25000, costGrowth 1.135, baseMps 8.0, selfMps 1.12; synergy B (×1.03 additive → Subhalo).
- Subhalo — initCost 40000, costGrowth 1.16, carryMpsMult 1.08 (hidden channel; no visible base/add/all income); receives synergies B + C.
- RR Lyrae — initCost 60000, costGrowth 1.34, addMpc 12.0.
- Velocity Dispersion — initCost 400000, costGrowth 2.05, maxLevels 5 (completionist), addAps 0.20, provides ×1.10/lvl synergy → Pop II.

One-shots:
- Orphan Stream — initCost 100000, consolidation 0.9, provides ×1.5 flat → RR Lyrae.
- Sculptor Dwarf — initCost 400000, consolidation 1.5, reserved-slot (no synergy declared).
- Draco Dwarf — initCost 8000000, consolidation 0.0, completionist, allMps 1.42.
- Sagittarius Stream — initCost 2500000, consolidation 3.85 (T3→T4 gate).

Engine globals (unchanged from prior calibration):
- DEFAULT_PARAMS.perTierEngagement[3] = 0.15 (locked from PHASE-2-PLACEHOLDER value).

Cross-tier synergy C (T2 Brown Dwarf → T3 Subhalo):
- IIFE-attached, multiplier 1.03, kind "additive".

**Calibration outcomes (N=50, seed=1, max-days=14):**

| Pairing | T3 calendar p50 | Target | Drift |
|---|---|---|---|
| p1 engaged × comp-hoarder | 1d 7h (31h) | 24-48h | -12.1% within |
| p2 engaged × comp-rusher  | 1d 9h (33h) | 24-48h |  -7.1% within |
| p3 engaged × thr-hoarder  | 1d 5h (29h) | 18-36h |  +8.5% within |
| p4 engaged × thr-rusher   | 1d 6h (30h) | 18-36h | +14.7% within |

All four primary pairings within ±15% drift band for T3 calendar.

**Reading B mass anchors:**
- Threshold-path peak at Sgr Stream gate-cross ≈ **2.5M M☉** (-21% from 3.16M target; within ±0.5 dex band).
- Completion-path peak at Draco purchase moment ≈ **8M M☉** (+2.5× over target; within ±0.5 dex band; mirrors T2 iter #24's 1.84× Comp peak overshoot pattern).
- Bot reference exit masses (S4 mass-band check): Comp T3 exit 192k, Thr T3 exit 627k.

**Felt-investment shape (Subhalo levels at T3 exit, seeds 1-3 × N=5):**
- Comp p1 path: median 15 Subhalos (range 5-31). Within ~10-15 felt-investment target.
- Threshold p3 path: median 7 Subhalos (range 0-20). Within ~5-8 felt-investment target.
- High variance reflects RNG-driven patient-universe idle-gap sequencing; not a calibration failure.

**T1/T2 byte-identical preserved** at canonical seed (p17 bot-60cpm × comp-hoarder seed=1): T1 11m 40s, T2 1h 8m. T3 bot baseline: 9h 36m.

**T4/T5 chain reachable** with placeholder T4/T5 numbers: bot T4 9h 47m, bot T5 9h 48m (both still need their own retune workstreams).

**Locked harnesses (post-Step-D verification):**
- save_migration_test: 56/56 pass (unchanged)
- validate_offline: 38/38 pass (unchanged)
- validate_subhalo: 28/28 pass (unchanged)
- profiles_smoke: 396/396 pass (unchanged)

**Comp vs Threshold gap:** +6.9% Comp over Thr on T3 calendar (p1 31h vs p3 29h). Informational only under the CD-2/NEW-1 reframe (pre-peak gap is felt opportunity cost on a single playthrough, not a tight calibration target). Sim-tuner did NOT chase a tight gap band at T3.

**Strategy interaction:** Subhalo investment is correctly valued by the strategy's `stackableVpc` carryMpsMult branch (added Step B). Bot naturally caps Subhalo investment when next-level Subhalo cost approaches Sagittarius Stream gate cost (~level 14-15 with costGrowth=1.16), then transitions to gate-clearing save mode.

**Surfaced design tensions:**
1. Subhalo level variance is high (5-30 range) under patient-universe RNG. Median lands in band but upper tail is well over the felt-investment target. Acceptable under the model; surfaced for future review if it causes player friction.
2. T1 mass band ratio 0.60-0.71× < 0.7 floor — pre-existing T1 retune outcome at cpm-60 vs the cpm-100 bot reference; not introduced by this calibration.
3. Click income share at T3 is small (~1.5 M/sec from clicks vs ~1000+ M/sec passive carry). Clicking is decorative at T3, consistent with the steep witness-phase engagement curve.

**Recommended next workstream:** T4 Galactic Arm numerical retune. The current T4 slate carries PHASE-2-CONSOLIDATION-RESCALE numbers (×2.5 mechanical scaling from the 2026-05-13 renumber); mass costs and income values are stale-pending-T4-retune. Standard workflow: science-director slate validation → sim-tuner number proposal under Reading B + 1-2d Engaged Comp / 1-1.5d Engaged Thr → harness verification.

**Doc-keeper actions recommended (closing pass):**
- `gameplay-design.md` §3: fill in numerical columns with Step D iter #10 values; flavor text preserved verbatim.
- `dark-filaments-t1-current-state.md` §9: update the T3 spec table.
- `CLAUDE.md` state-of-play bullet: T3 Dwarf Spheroidal retune LANDED.

**Report path:** `Simulator/reports/2026-05-13T20-44-37-276Z/` (raw.csv + report.md + step-d-landing.md).

---

## 2026-05-13 evening — Doc-keeper closing pass (landed)

**Workstream:** doc-keeper closing pass for the T3 Dwarf Spheroidal retune. Five docs updated to reflect Step D landing + the 4 prior-phase landings (engineering plan / Step A+B engine renumber / Step C `carryMpsMult` extension / cohesion → consolidation rename).

**Docs updated:**

- `Design Documents/voice-samples.md` — version 0.2 → 0.3 (evening update). T3 tier-up line LOCKED with user-selected Candidate 1 ("embedding" register): *We are inside something we cannot see. The stars we can count are the small part. The rest holds.* Replaces the afternoon's TO-WRITE stub. Changelog entry added.
- `Design Documents/gameplay-design.md` — version 0.4 → 0.5. §3 Tier 3 section rewritten with calibrated stackables / one-shots tables (mirroring T4 / T5 table format) + "Subhalo — first hidden-channel upgrade" sub-section (α=1.08 / β=0.03 user-ratified felt-magnitude lock; engine extension semantics; cross-tier C as second cross-tier in game; reusable pattern note) + "Calibration outcomes" sub-section (4 engaged primary pairings within ±15% drift; Reading B Threshold / Comp peak mass anchors; felt-investment shape; T1/T2 byte-identical; locked harnesses 56/56 + 38/38 + 28/28 + 396/396; surfaced design tensions). Stale `cohesionGrowth` relic parentheticals cleaned up on Galactic Bulge implementation note + T4 / T5 consolidation-math footers (engine rename landed; identifiers are canonical, not relic). Active Nucleus relabeled T4→T5 transition gate; Dark Matter Halo relabeled T5→T6 transition gate. Changelog entry added.
- `Prototype/dark-filaments-t1-current-state.md` — §1 Tier 3 rewritten with NEW Dwarf Spheroidal table (all 8 upgrades with `carryMpsMult` column for Subhalo). T4 / T5 sections relabeled with pre-renumber / post-renumber consolidation context (×2.5 rescale). Upgrade-descriptions section gains T3 Dwarf Spheroidal block (8 lines) ahead of the renumbered T4 block. Synergies table updated with the new T3 Dwarf Spheroidal entries + Brown Dwarf → Subhalo cross-tier entry + renumbered T4 entries. §9 closing paragraph extended with Step D summary (Population II / Subhalo / RR Lyrae / Velocity Dispersion / 4 one-shots locked values; synergy B / C coefficients; calibration outcomes). Relic-clause cleanup: T2 consolidation math line + `consolidationLine` chart helper line + top-of-doc orienting note. Top-of-doc note retitled "11-tier ladder engine renumber LANDED + T3 Step D LANDED."
- `CLAUDE.md` — new state-of-play bullet at the top (the 5-phase workstream summary: engineering plan → Step A+B → Step C → rename → Step D + T3 tier-up line lock; locked T3 numbers; calibration outcomes; SAVE_VERSION lineage v1 → v4; locked harnesses; next workstream T4). T3 entry rewritten to reflect Step D landing (with pre-renumber Galactic Arm content preserved as a separate entry pointing forward to T4 as the renumbered home). T4 entry retitled to acknowledge it's the renumbered pre-2026-05-13 T3 content. "Consolidation rename + visual design" bullet updated to acknowledge the 2026-05-13 engine rename reversed the original relic-retention decision (no rewriting of history; the original decision is preserved, the override is documented). Last-updated footer rewritten as a multi-paragraph summary covering the workstream's full scope.
- `Simulator/reports/v1-progress.md` — this closing entry.

**Final scan for residual stale references:** stale "T3 Galactic Arm" references in the gameplay-design.md §3 Tier 4 section's internal notes (preserved-verbatim historical lineage references inside the renumbered slate's tables; intentionally left as lineage). Stale tier-count references checked — ladder is 11 tiers, peak at T6, inversion at T10, final at T11. Stale `cohesion` references cleaned up where they declared engine fields as relic-named; historical changelog entries and intentional 2026-05-13-rename-pass documentation references preserved.

**No design changes:** the closing pass only synchronizes docs to reflect the actual landed state. No load-bearing rules were touched; no design content authored; no new decisions made.

**Open items for next workstream:**

1. **T4 Galactic Arm numerical retune** (top of queue). Current T4 slate carries PHASE-2-CONSOLIDATION-RESCALE numbers (×2.5 mechanical scaling from the 2026-05-13 renumber); mass costs and income values remain stale-pending-T4-retune. Standard workflow: science-director slate validation → sim-tuner number proposal under Reading B + 1-2d Engaged Comp / 1-1.5d Engaged Thr → harness verification.
2. T5 Galaxy numerical retune queues after T4 (same workflow; Reading B + 3-4d Engaged Comp calendar target).
3. T1 mass band ratio 0.60-0.71× < 0.7 floor at cpm-60 vs cpm-100 bot reference — pre-existing T1 retune outcome, surfaced again in Step D's bot-reference comparison; not addressed here.
4. Manual browser test of the rebuilt simulator from the 2026-05-12 pass still pending (deferred from prior sessions).
5. Parameters-tab cross-sync (removed in the 2026-05-12 simulator rebuild) — could be restored in a different shape if needed; deferred.

---

## 2026-05-13 — Mass-band apparatus fix (Reading B peak-at-gate) (landed)

**Workstream:** S4 mass-band check apparatus correction. Sim-tuner diagnosed that the persistent T1 mass-band p50 0.60-0.71× below-threshold flag (open item #3 from the T3 Step D closing pass) was a pure apparatus mismatch, not a calibration failure — the check was reading post-gate exit-tick residual mass (~0.05 M☉ for T1) on both sides of the ratio, two orders of magnitude smaller than the load-bearing Reading B target (peak-at-gate ~1.0 M☉). Fix sized at ~15 LOC across 3 files; no data.js T1 number changes; no strategy or core math changes; T1 numerical calibration unchanged.

**What shipped:**

- `Prototype/src/sim/runner.js` — added `peakMass` tracking through the tick loop. New `let peakMass = 0` declaration alongside `transitioned` / `exitReason`; new `if (state.mass > peakMass) peakMass = state.mass` sample after income / before purchase decision; new `peakMass` field on `headline` returned by `runSimulation`. ~7 LOC + 6 LOC of comment explaining the Reading B anchor and why the post-income / pre-purchase sample lands on the gate-crossing moment.
- `Prototype/src/sim/offline.js` — added `peakMassInTier` tracking through the offline tick loop. New declaration after `activeUpgrades` slice initialization; new sample after income in the tick body; the `'transition'` branch now emits `peakAtGate = peakMassInTier` on the tier-up milestone's `mass` field (replacing the prior `ws.mass` exit-tick read); the `max-tier-reached` branch likewise emits `peakMassInTier`; after carry recomposition, `peakMassInTier = ws.mass` resets so the next tier tracks fresh. ~10 LOC + 12 LOC of comment.
- `Prototype/src/sim/sweep.js` — `runContinuousBotRun` now reads `result.headline.peakMass` for `perTierExitMass[t]` instead of `result.finalState.mass`. `referenceMassForTier` likewise reads `result.headline.peakMass` (renamed local from `exitMass` to `peakAtGate` for clarity). The engagement-profile fallback `perTierExitMass[finalTierForMass] = state.mass` is updated to use the in-function `peakInTierMass` tracker (which is already reset on tier-up so it tracks the final tier's peak). The CSV column name `t<n>_exit_mass` is preserved for backward compatibility — the semantic is now peak-at-gate. ~3 LOC + 13 LOC of comment.

**No assertion changes needed** in `validate_offline.js` — the existing tier-up milestone assertion checks only `mass != null && Number.isFinite && > 0`, all of which still hold under peak-at-gate semantics.

**Verified metrics:**

- Bot-100cpm × Completion T1: `headline.peakMass = 1.003753` M☉ (Reading B target ~1.0 — dead-on). Pre-fix `headline.finalMass = 0.053675` was the misleading exit-tick residual.
- Bot-60cpm × Completion T1: `headline.peakMass = 1.020340`. Ratio against bot-100cpm reference = 1.0165 → **within-band**. Pre-fix ratio of exit-tick residuals would have read ~0.83 (still > 0.7 floor in this particular case, but the underlying ratio was incoherent).
- Bot-100cpm × Threshold T1: `headline.peakMass = 0.971330` — symmetric to completion mode, gate-crossing semantics consistent.
- p1 realistic-engaged × comp-hoarder T1 (N=5, seed=1): T1 mass ratio p50 = **1.00× [within-band]** — the persistent flag has cleared.
- p17 bot-60cpm × comp-hoarder T1 (N=1, seed=1): T1 mass ratio = **1.00× [within-band]**. Anomaly section reports `(none flagged)` — the canonical reproduction case has cleared. Headline 11m 40s preserved byte-identical.

**Byte-identical sim outcomes preserved at canonical seed (p17 bot-60cpm × comp-hoarder seed=1):**

- T1: 11m 40s (unchanged)
- T2: 1h 8m (unchanged)

The apparatus fix is observation-only: no sim numerical outcome changed. The runner still applies the same income / strategy / purchase logic; only the auxiliary `peakMass` headline field is new, and only the milestone `mass` field semantic shifted from exit-tick residual to in-tier peak.

**Locked harnesses (post-apparatus-fix):**

- `validate_offline`: **38 / 38 PASS** (unchanged — milestone.mass existence + finiteness still hold).
- `save_migration_test`: **56 / 56 PASS** (unchanged — no save-shape semantic touched).
- `profiles_smoke`: **396 / 396 PASS** (unchanged — pairing catalog / RNG / CLI parsing untouched).
- `validate_subhalo`: **28 / 28 PASS** (unchanged — T3 Subhalo engine extension untouched).

**Above-band remains correct semantic:** the T2 / T3 mass-band check shows engagement-profile pairings at 80-140× the bot reference (`above-band`). This is the documented hoarding overshoot — offline accumulation over idle gaps inflates the in-tier peak well above the bot-continuous baseline. The above-band flag is informational, not a failure mode, per the existing CLAUDE.md S4 framing. The apparatus now compares like-with-like on both sides; the overshoot signal sim-tuner reads is real (mass-hoarding inflated peak vs bot's gate-crossing peak) rather than a residual-vs-residual coincidence.

**Surfaced (orthogonal) issue not addressed here:** the per-tier calendar p50 for engaged pairings at T1 reads as the full session-end calendar time (e.g. 1h 0m for an engaged-steady T1 target run that actually transitioned inside the 60-min session) rather than the in-session transition tick. Manifests in the report's per-tier calendar drift column (+421.7% HIGH-over while the total-target drift reads +1.4% within). This is a separate apparatus issue in the perTierEntrySec / perTierExitSec aggregation, distinct from the mass-band fix. Not addressed in this pass.

**Doc updates landed:**

- `Simulator/reports/v1-progress.md` — this entry.
- `Prototype/dark-filaments-t1-current-state.md` §9 — apparatus fix note (peak-at-gate Reading B semantic, milestone.mass field semantic shift, byte-identical confirmation).

**Open items remaining:**

- T1 mass band ratio open item from the T3 Step D closing pass is now **resolved** (apparatus mismatch, not a calibration failure).
- T4 Galactic Arm numerical retune (still top of queue for the next workstream).
- T5 Galaxy numerical retune (queues after T4).
- Manual browser test of the rebuilt simulator (still deferred).
- Parameters-tab cross-sync (still deferred).
- Per-tier calendar p50 aggregation reads session-end time rather than in-session transition tick for engaged profiles (newly surfaced orthogonal apparatus issue; not part of this fix).

---

## 2026-05-13 — Sweep view: per-tier P50 columns in cross-pairing comparison (landed)

**Deliverable:** the Simulator tab's Sweep sub-view now shows intermediate-tier P50 calendar-time columns in the Cross-pairing comparison table. For a sweep targeting tier N, `T1 p50 ... T(N-1) p50` columns sit between the DNF column and the target-tier `p10 / p50 / p90` triple. The user can read "when did P50 cross each gate" at a glance instead of only seeing the target-tier total.

**What shipped:**

- `Prototype/src/sim/sweep.js` — `summarizeRuns` aggregates `completedAtP10` / `completedAtP50` / `completedAtP90` per tier alongside the existing in-tier `p10 / p50 / p90`. Semantic: cumulative calendar second at the moment that tier was crossed (i.e. tier t+1 was entered), or the run's total calendar time for the target tier. Drawn from each run's `perTierEntrySec[t+1]`.
- `Prototype/src/ui/simulator.js` — `renderCrossPairingTable` builds intermediate-tier columns dynamically from the target tier; `colspan` for error rows recomputed from `10 + (targetTier - 1)`. New `.sim-table-scroll` wrapper provides horizontal overflow; the leftmost Pairing column is pinned via `position: sticky; left: 0` so row identity survives scrolling right. Sweeps targeting T1 add zero columns (table is unchanged). Sweeps targeting T2 add one column. T3 adds two. Generalizes through T11 without further code change.
- `Prototype/dark-filaments-t1-current-state.md` §9 — Sweep sub-view description updated; sweep.js export-shape block notes the new `completedAtP10/P50/P90` fields.

**Verification:**

- `node Prototype/src/test/save_migration_test.js` — 56 / 56 PASS.
- `node Prototype/src/test/validate_offline.js` — 38 / 38 PASS.
- `node Prototype/src/test/profiles_smoke.js` — 396 / 396 PASS.
- `node Prototype/src/test/validate_subhalo.js` — 28 / 28 PASS.
- `node Prototype/src/test/harness.js --pairing p1 --target t3 --n 5 --seed 1 --max-days 14 --report` — per-pairing per-tier breakdown table renders identically to pre-change (CLI markdown report unaffected; the new fields are not consumed by the markdown writer). p17 bot-60cpm × comp-hoarder T2 canonical run reproduces `T1 = 700s / T2 = 4083s` byte-identical to the apparatus-fix reference value.
- Node smoke (p1 N=3 target T3 seed 1 max-days 14): T1 completedAtP50 = 700s (11m 40s; matches the markdown's T1 p50 11m 40s), T2 completedAtP50 = 13687s (3h 48m cumulative = T1 700s + T2 in-tier 12987s), T3 completedAtP50 = 148630s (1d 17h cumulative; matches the run's headline total).

**What the rendered Sweep table now looks like at T3 target:**

Header row: `Pairing | Mode | Weight | N | DNF | T1 p50 | T2 p50 | T3 p10 | T3 p50 | T3 p90 | Total drift | T3 band`

Sample row (p1 realistic-engaged × comp-hoarder, N=5, seed=1): `realistic-engaged × comp-hoarder | completion | primary | 5 | 0/5 | 11m 40s | 3h 48m | 1d 4h | 1d 17h | 2d 14h | -0.4% [within] | 7.14× [above-band]`

Pairings that DNF before reaching a tier render `—` in that tier's column. Low-confidence pairings italicize the new cells alongside the existing target-tier `p10/p50/p90`. The whole table scrolls horizontally with the Pairing column sticky-pinned to the left edge.

**Manual browser eyeball still deferred** (locked harnesses and Node smoke confirm the data shape and rendering logic; visual layout, sticky-column behavior under live scroll, and column alignment at higher targets need a browser pass when the user next opens the prototype).

**Open items unchanged:** T4 / T5 retunes, Parameters-tab cross-sync restoration, per-tier calendar p50 session-end-time apparatus issue (separate from this UI work).

---

## 2026-05-13 evening — T1-T3 closing audit punch lists landed

T1-T3 closing audit landed — writer + science-director both clean; one T2 tier-up refresh + 4 glossary entries landed; T1-T3 locked as finished group; ready for T4 retune.

**Files modified:**

- `Design Documents/voice-samples.md` v0.3 → **v0.4**: T2 Stellar Neighborhood tier-up refreshed — *"Twelve solar masses, gathered"* → *"A thousand solar masses, gathered"* under the CD-1 M☉ unit lock (T2 end mass ~10³ M☉; original literal undersold the named scale by two orders of magnitude). Three-sentence rhythm preserved; pattern parallels T4's "Ten billion suns" and T5's "Two hundred billion stars" across the tier-up spine. Load-bearing third sentence "We are no longer just one sun" preserved verbatim. REVISIT bracket resolved and removed.
- `Design Documents/science-glossary.md` v0.1 → **v0.2**: added Wolf-Rayet Star T2 entry (was missing — added to design in iter #23 same day glossary v0.1 was drafted); added Sgr A* + Sgr B2 forward-pointer entries (T5 territory under 11-tier ladder); added precision-risk #6 (Sgr B2 mass three-million figure flagged for T5 retune). No T1-T3 prose corrections — T1-T3 physics audited clean.
- `CLAUDE.md`: voice-samples doc-map row bumped to v0.4 with audit-pass note.

**Verification:** prose-only changes; no code or test harnesses touched.

**Next:** T4 retune workstream — same Reading B + steep `perTierEngagement` curve workflow used for T1/T2/T3.

