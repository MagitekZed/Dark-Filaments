# Dark Filaments — Gameplay Design

> First draft of the upgrade tree, mechanical structure, and gameplay systems. Numbers and scaling are deliberately deferred — this document defines *what* upgrades exist and *what they do* in conceptual terms, leaving exact values for the spreadsheet model phase.

This is the gameplay companion to the [design notes](design-notes.md), [voice samples](voice-samples.md), and [visual design](visual-design.md) docs.

**Version 0.6 · Last updated 2026-05-14**

## Mass-unit lock (M☉)

**Mass throughout this document is denominated in solar masses (M☉).** The mass counter is a real-scale reading from ~1 M☉ at T1 through ~5×10²² M☉ at T10. All numerical references in narrator prose use this unit, including "solar masses," "suns," and "stars" as appropriate to the prose.

**"Target end-mass" reading (locked 2026-05-12 — Reading B, interpretation (a) locked 2026-05-13).** The per-tier M☉ values below represent the **peak mass on the counter at the moment the player crosses the Consolidation gate (the structural-completion moment)**, NOT the literal transition-tick exit mass, NOT the absolute counter maximum during the entire tier (which on Completion path may exceed the named scale during post-Consolidation completionist clean-up), and NOT the cumulative throughput. Concretely: at the moment the player has assembled the tier's structural pieces (Consolidation gate met + saving for the largest in-tier non-completionist purchase), the counter reads ~Target. Subsequent completionist spending drops the counter; transition-tick exit is small and represents "committing the structural mass into the next stage." Narrator beats reference the peak ("the Sun has appeared, the counter reads one solar mass"), not the leftover. Sim-tuner calibrates so the peak in-tier mass lands on the target; bot strategy's immediate-transition behavior means transition-tick mass is always ~1 tick of income (~5-10% of target), which is fine under this reading.

Verified solar mass targets per tier — **science-director name-grounded validation pass 2026-05-12**. Two deltas from the 2026-05-11 table: T9 bumped 1 dex up (was undersold, crowded T8/T10); T5 lower bound nudged down slightly to straddle the actual median Local Group estimate. T8 and T10 keep their values with explicit interpretation notes (real astronomy is looser at those scales than the game's clean step-up needs).

| Tier | Name | Target end-mass | Real-astronomy anchor | Notes |
|---|---|---|---|---|
| T1 | Solar System | **~1 M☉** | Sun (1 M☉) + planets (~0.0014 M☉) | Sun dominates; locked. |
| T2 | Stellar Neighborhood | **~10³ M☉** | Pleiades-class open cluster (600-4,000 M☉); local-disk volume of a few hundred pc | **Bridge tier — gets the day-1 second-milestone calendar slot (2-8h Engaged Comp).** Reads as "Pleiades-scale stellar neighborhood." Name moved down from old T3 in the 2026-05-13 afternoon reshape (replacing the morning's Stellar Association insertion). |
| T3 | Dwarf Spheroidal | **~10⁵-10⁷ M☉** (anchor ~10⁶·⁵) | Draco (~2×10⁷ M☉ virial), Ursa Minor (~2×10⁷), Sculptor (~3×10⁶), Sextans (~5×10⁶) — local-group dwarf spheroidals, dark-matter-dominated (Draco mass-to-light ~440) | **Added 2026-05-13 afternoon reshape.** Fills the 10⁵-10⁷ M☉ gap between Stellar Neighborhood (10³) and Galactic Arm (10¹⁰). Physics: hierarchical structure formation via minor mergers — dSphs are the surviving fossils of the population the Milky Way's halo was built from. Narrative hook: "the dark matter we are embedded in has a name." Carries the first patient-universe return calendar slot (24-48h Engaged Comp). Sources: McConnachie 2012 (arXiv:1204.1562); Mateo 1998 ARA&A; Bullock & Boylan-Kolchin 2017 (arXiv:1707.04256); IAU morphological classification (de Vaucouleurs). |
| T4 | Galactic Arm | **~10¹⁰ M☉** | Major spiral-arm stellar content (Milky Way ~6×10¹⁰ M☉ across 4 arms + disk) | Anchors the (formerly T3) tier-up line "Ten billion suns, quietly held." The 10³ → 10¹⁰ jump previously here is now split: 10³ (T2) → 10⁶·⁵ (T3 dSph) → 10¹⁰ (T4). The "ten billion suns" beat still lands off a 10³·⁵× jump from dSph — drama from named scale + quiet verb, not from absolute cliff size. |
| T5 | Galaxy | **~10¹² M☉** | Milky Way / Andromeda virial mass incl. dark halo | L* spiral. Locked. |
| T6 | Local Group | **~3×10¹² – 10¹³ M☉** | Local Group total mass 2×10¹² – 5×10¹² M☉ (median ~5.27×10¹² M☉) | **THE PEAK.** Strategic choice locks here. Act 1 → Act 2 transition. Lower bound nudged 5×10¹² → 3×10¹² (2026-05-12) to straddle the median estimate. |
| T7 | Galactic Cluster | **~10¹⁵ M☉** | Virgo Cluster ~1.2×10¹⁵; Coma ~5×10¹⁵ | Anchor on Virgo (the cluster Local Group is falling into — narratively coherent). |
| T8 | Supercluster | **~10¹⁷ M☉** | Laniakea Supercluster ~10¹⁷ M☉ | Anchor on Laniakea explicitly. Locked. |
| T9 | Filament | **~10¹⁸ M☉** | Individual cosmic filaments 10¹⁴-10¹⁵; Sloan Great Wall (filament complex) ~10¹⁷ | **INTERPRETATION:** target requires reading T9 as a filament *complex / wall* (Sloan-class scaled up), not a single filament. Individual-filament mass is 3-4 dex below the target. Sim-tuner should know this is doing load-bearing work; resist softening the target. |
| T10 | Cosmic Web | **~10²¹ – 10²² M☉** | Cosmic web at supervolume scale; ~10²¹ M☉ per Gpc³ supervolume | **INVERSION TIER** (Completion compresses, Threshold stretches). Bumped 1 dex up from 10²⁰-10²¹ (2026-05-12). The cosmic web isn't smaller-than-observable; it spans the observable universe. |
| T11 | Causal Horizon | **~5×10²² M☉** | Particle-horizon total matter ~7.5×10²² M☉; event-horizon matter ~4×10²¹ M☉ | **INTERPRETATION:** target reads as "asymptote toward total observable matter," not strict event-horizon mass (the load-bearing rule "the cosmological event horizon is the player's true horizon" specifies event horizon at ~16 Gly comoving). The 5×10²² value exceeds strict event-horizon matter by ~1 dex but is fine if framed as approach-not-arrival — consistent with the "heat death is asymptotic" rule. **Creative-director flag:** no late-tier narrator line may claim arrival at the full observable-matter total; the asymptote framing is load-bearing. |

**The 10⁵-10⁷ M☉ slot (T3 Dwarf Spheroidal) softens the prior 10⁷× T3 → T4 cliff.** The 2026-05-13 morning Stellar Association insertion left the 10³ → 10¹⁰ jump intact (just moved it from T2→T3 to T3→T4). The afternoon reshape addressed it directly: T2 Stellar Neighborhood (10³) → T3 Dwarf Spheroidal (10⁶·⁵) → T4 Galactic Arm (10¹⁰), splitting the cliff roughly in half on a log scale. The dSph candidates (Draco, Ursa Minor, Sculptor) are gravitationally bound, dark-matter-dominated, named, mass-anchored, and IAU-recognized — clearing the "real cosmology only" bar without resorting to retconned terminology. Science-director's earlier "real-astronomy sparsity" framing for the 10⁷× jump softens here: the gap isn't *as* sparse as the broader dwarf-galaxy family suggested — dSphs specifically are a defensible named class at the right mass.

**T1 → T2 ladder (1 → 10³ M☉)** is the day-1 hook + bridge. First reward (T1, ~10 min, first sitting) and bridge reward (T2 Stellar Neighborhood, 2-8h, "we are not alone"). The 10³× jump in mass over a same-day calendar window is where the player learns the long-burn rhythm — the universe isn't waiting for them, but it isn't faster than them either.

**Citations (2026-05-12 science-director pass):** Local Group MNRAS 2010; Laniakea Nature 2014; Sloan Great Wall A&A 2016; cosmic web baryon content PMC 2016; Wikipedia for Observable Universe / Event Horizon / Particle Horizon / Virgo Cluster / Coma Cluster / Open Cluster / Stellar Density / Milky Way. Full URLs in the 2026-05-12 review record.

**Current T1-T4 calibration values are preserved as-is in this doc and in the simulator.** A separate sim-tuner pass will re-denominate Mass values to land on the M☉ targets per tier. This pass is deferred until after the design corpus updates land.

## Changelog

- **0.6 (current, rolling)**
  - **2026-05-14 — UX workstream closing pass — T1-T3 upgrade slates flavor field split (structural, no prose changes).** Under the new **Two-voice UI** and **Upgrade cards are prose-first** load-bearing rules in CLAUDE.md, every T1-T3 upgrade now carries two text fields explicitly: the existing narrator-voice prose is the **first-purchase line** (fires once per upgrade per game as an ephemeral fade-in in drift-and-fade register per visual-design.md §7); the persistent **card description** is a clinical one-liner (TO-WRITE on the writing backlog — see voice-samples.md §Writing Backlog). T1 table extended with a new "Card description (TO-WRITE)" column; T2 and T3 sections gained a "Flavor field split" note at the top of each tier (numbered-list / structured-table format makes a per-row column expansion invasive — the note enumerates all upgrades whose card descriptions are TO-WRITE). No existing prose modified.
  - **2026-05-14 — T4 Galactic Arm numerical retune LANDED (Step D iter #9).** §3 Tier 4 numerical columns replaced — old pre-renumber pre-M☉ values (e.g., DLD initCost 5,000, HII 8,000, GC 150M) swapped for iter #9 locked values from `data.js`: stackables DLD 150K / HII 240K / PM 450K (addMpc 160) / SDW 600K (addAps 2.0) / HVC 3B (addAps 4.0, completionist max-5); one-shots Galactic Bulge 6M with `addMps: 60, selfMps: 1.20` (7 × 0.75 = 5.25 consolidation, tiered) / Sgr B2 18M (consolidation 2.25) / Globular Cluster 100B (consolidation 0, completionist `allMps: 1.42`) / Active Nucleus 20B (consolidation 8.125, T4→T5 gate). Consolidation budget 15.625 = 1.0 × 2.5³. Five synergies preserved verbatim (A within Sgr B2 → PM ×1.5 flat; B within DLD → HII ×1.06/lvl; C within HVC → DLD ×1.10/lvl cross-stat; **D cross-tier Local Bubble T2 → HII Region T4** ×(1 + 0.04 × LB_level) additive — first cross-tier synergy in the game, physics verified per Zucker 2022; **E cross-tier outbound AN T4 → Sagittarius A* T5** ×1.5 flat). New "Calibration outcomes" sub-section landed under the consolidation math: 4 primary engaged pairings within ±15% drift band (p1 -24.2% / p2 +2.8% / p3 -3.3% / p4 +16.2%); Reading B Threshold peak ~4.4-4.5×10¹⁰ M☉ (~2× named scale, within ±0.5 dex acceptable); Comp peak ~2.4-3.4×10¹¹ M☉ (~30× named scale during completionist clean-up — acceptable under CD-2/NEW-1 loose pre-peak); 0% DNF rate; mass-band ratios 2.2-3.4× above bot reference — **the lowest above-band overshoot of any tier so far** (T2 ~150×, T3 ~5×, T4 ~2-3×). Comp-vs-Threshold cumulative gap +1.5% (informational only under CD-2/NEW-1). T1/T2/T3 byte-identical preserved at p17 bot-60cpm × comp-hoarder seed=1 (T1 11m 40s / T2 1h 8m / T3 9h 36m). Iteration history (9 iterations): key levers were AN initCost (1B → 30B → 20B), HVC initCost (1B → 2B → 3B), GC initCost (15B → 50B → 100B); HVC was the biggest Comp-vs-Thr lever; AN was the most load-bearing single value (sized to land Threshold peak at gate-cross near 10¹⁰ named scale). All locked harnesses pass: save_migration 56/56, validate_offline 38/38, validate_subhalo 28/28, profiles_smoke 396/396. **Stale PHASE-2-CONSOLIDATION-RESCALE interim scaffolding from the 2026-05-13 ladder renumber retired** — T4 numerical content is now first-class current. Tier 4 intro paragraph updated to reflect the retune-locked state. The +65–75% Comp-vs-Threshold band target previously flagged in this section is retired under the CD-2/NEW-1 reframe; pre-peak gap is informational only going forward.
- **0.5**
  - **2026-05-13 evening — Thr T3 Engaged calendar band expanded 18-36h → 22-44h per CD-2/NEW-1 loose-pre-peak reframe.** Original 18-36h band encoded a 25% Thr-faster-than-Comp assumption (27/36 midpoint ratio = 0.75) that predates the 2026-05-13 reframe and that the slate's actual physics doesn't manufacture. Latest 3-seed sweep (seeds 1 / 1337 / 451621332, N=50/30/20) showed Thr engaged p50 clustering 35-37h — natural slate behavior outside the over-tight band. New 22-44h band (midpoint 33h) accommodates observed p50 within ±15% drift; preserves a soft Thr-faster-than-Comp ratio (33/36 = 0.92) without forcing tight numerical calibration. No T3 slate numerical changes; calibration is the band itself. `profiles.js` ENGAGED_TARGETS updated; §1 calendar table updated; no smoke-test assertion change required (no test asserted the prior 18-36h values literally).
  - **2026-05-13 evening — T3 Dwarf Spheroidal numerical calibration LANDED (Step D iter #10).** Replaces the shape-only slate from the 2026-05-13 afternoon reshape with locked numerical values. §3 Tier 3 section gains the calibrated stackables / one-shots tables (mirroring the T4 / T5 table format), a "Subhalo — first hidden-channel upgrade" sub-section documenting `carryMpsMult` semantics + the α=1.08 / β=0.03 user-ratified felt-magnitude lock, and a "Calibration outcomes" sub-section covering the four engaged primary pairings within ±15% drift (p1 -12.1%, p2 -7.1%, p3 +8.5%, p4 +14.7%), Reading B mass anchors (Threshold peak ~2.5M M☉ at -21% within ±0.5 dex; Comp peak ~8M M☉ at +2.5× over named scale, mirroring T2 iter #24 Comp-overshoot pattern), felt-investment shape (Comp p50 = 15 Subhalos / Thr p50 = 7 Subhalos, both in band), and the +6.9% Comp-vs-Thr gap as informational only under the CD-2/NEW-1 reframe. T1/T2 byte-identical preserved (T1 11m 40s, T2 1h 8m at p17 bot-60cpm × comp-hoarder seed=1). All locked harnesses pass: save_migration 56/56 (up from 53/53; added v1/v2/v3 refused-load checks across SAVE_VERSION 2→3→4 bumps), validate_offline 38/38, validate_subhalo 28/28 NEW, profiles_smoke 396/396. Stale "engine field is a relic from the pre-rename term" parentheticals on the §3 Tier 4 Galactic Bulge implementation note and the T4 / T5 Consolidation-math footers updated — the engine-wide `cohesion` → `consolidation` rename landed 2026-05-13 (~470 identifier renames across 24 files; SAVE_VERSION 3 → 4); engine identifiers are now canonical, not relic. Workstream: engineering plan → Step A+B engine renumber + shape-only T3 insert → Step C Subhalo hidden-channel extension → Cohesion→Consolidation rename → Step D sim-tuner calibration. Sim-tuner Step D took 10 iterations; engineering took ~3 sub-steps. T4 Galactic Arm numbers remain PHASE-2-CONSOLIDATION-RESCALE interim scaffolding under the renumber — T4 retune queues as the next workstream.
- **0.4**
  - **2026-05-13 afternoon — T2/T3 reshape (Stellar Association retired; Dwarf Spheroidal inserted at T3).** User reflection on the morning's Stellar Association insertion surfaced two real issues: (1) "Stellar Association" and "Stellar Neighborhood" read as semantically duplicative to a non-astronomer player — the unbound/bound technical distinction doesn't carry; (2) the actual mass cliff worth filling was the original 10³ → 10¹⁰ T2→T3 jump (now T3→T4 under renumber), not the 10⁰ → 10³ T1→T2 jump where Stellar Association sat. Creative-director confirmed: the original insertion was a misstep — "biased toward astronomical-precision over reader-clarity." Science-director softened their earlier "no natural tier names in 10³-10¹⁰" framing — **Dwarf Spheroidal** (dSph) at ~10⁶·⁵ M☉ clears the bar: IAU-recognized morphological class, named anchors (Draco, Ursa Minor, Sculptor, Sextans), dark-matter-dominated (Draco mass-to-light ~440), hierarchical-structure-formation fossils. **New shape:** T1 Solar System (1 M☉) → T2 Stellar Neighborhood (10³, KEEPS the 2-8h day-1-bridge calendar slot) → T3 Dwarf Spheroidal (~10⁶·⁵, 24-48h first patient-universe return) → T4 Galactic Arm (10¹⁰). T4-T11 unchanged from the morning renumber (peak still T6, inversion still T10, final tier still T11). The "Ten billion suns, quietly held" T4 tier-up line still earns its weight off the ~10³·⁵× climb from dSph (CD: "drama from named scale + quiet verb, not from absolute cliff size"). Mechanical work: M☉ table T2/T3 rows rewritten; calendar table T2/T3 names updated; profiles.js ENGAGED_TARGETS labels updated; voice-samples.md T2 line restored to Stellar Neighborhood (preserved verbatim) and T3 becomes Dwarf Spheroidal TO-WRITE stub with SD's hierarchical-merger physics hook; design-notes §16.5 cosmological time-arc table updated; CLAUDE.md state-of-play bullet updated. **Phase 2 still deferred:** new T3 Dwarf Spheroidal upgrade slate design (creative + science + writer); data.js engine renumber + new T3 upgrades; sim-tuner numerical calibration for 24-48h T3 calendar under Reading B.
  - **2026-05-13 morning — New T2 Stellar Association inserted (11-tier ladder; creative-director + science-director + user consensus). RETIRED same day** in favor of T3 Dwarf Spheroidal — see afternoon entry above. Morning entry preserved here as lineage record. Original 2026-05-13 morning entry follows:
  - **2026-05-13 morning — New T2 Stellar Association inserted (11-tier ladder; creative-director + science-director + user consensus).** Followed-on from the 2026-05-12 T1/T2 calendar revision: user noted the 10-min → 24-48h T1→T2 cliff was steep for retention. Proposed inserting a new tier between T1 (Solar System) and old-T2 (Stellar Neighborhood) targeting "a few hours" calendar — two day-1 milestones to hook players. Science-director confirmed **Stellar Association** at ~10²·⁵ M☉ (Sco-Cen scale, ~300 M☉) as a defensible IAU-recognized tier name (no upgrade-slate collisions; OB/T associations are real, ~436 confirmed members in Sco-Cen; ~90% of stars born in associations and drift apart — clean narrative bridge from solitary star to stellar siblings). Creative-director initially proposed lowering old-T2 instead (Option B from the previous round) but **flipped to insertion** when user pointed out that 11 tiers with peak at T6 (5 up / PEAK / 5 down) is geometrically *more* symmetric than 10 tiers with peak at T5 (4 up / PEAK / 5 down). T6 Local Group becomes the new PEAK tier; T7 Galactic Cluster inherits Eridanus Reach pivot adjacency; T10 Cosmic Web is the new INVERSION tier; T11 Causal Horizon is the new final tier. M☉ table (§1) and calendar table (§1) both renumbered. New T2 calendar target: **2-8h Engaged Comp / 1.5-6h Engaged Thr** (wider band lets clicking stay impactful through the tier). Total Engaged Comp range preserved at ~28-41 days. Load-bearing rule CD-6 ("Strategic choice locks at T5") rephrased to "Strategic choice locks at the PEAK tier" (rules-guardian vetted; semantic content preserved). Four other load-bearing rules referencing tier ordinals also renumber-proofed in parallel (Inventory T10 reveal → final-tier reveal; M☉ anchor at T10 → at final tier; Causal Horizon T10 → final-tier name; CMB by T10 → by final tier). **Phase 1 scope (this changelog entry):** design docs + ENGAGED_TARGETS in profiles.js. **Phase 2 deferred (next workstream):** new T2 upgrade slate design (creative + science + writer); data.js renumber of existing T2-T10 tier fields up by one; T2 Stellar Association narrator tier-up line; sim-tuner numerical calibration to actually produce 2-8h T2 calendar under Reading B. Until Phase 2 lands, the engine produces the old 10-tier game and drift detection against T2-T11 calendar targets reads as mismatched.
  - **2026-05-12 T1/T2 per-tier calendar targets revised (creative-director playtest-tab weigh-in).** §1 per-tier calendar table updated: T1 Engaged Completion **2-4h → 8-15 min**; T1 Engaged Threshold 2-4h → 7-12 min; T2 Engaged Completion **8-12h → 24-48h**; T2 Engaged Threshold 6-10h → 18-36h. Rationale (creative-director read): the 2-4h T1 target was inherited from the continuous-bot framing where calendar ≈ active; under the trajectory model the engaged player's onboarding session completes T1 in ~10 min of active play regardless of cpm — and this is the correct genre contract for a long-burn idle clicker ("first reward in your first sitting"). T1 is the hook; tutorials don't gate. T2 is where the patient-universe rule first manifests — the player buys a few stackables, recognizes they can't finish today, returns tomorrow to accumulated mass. The prior 8-12h T2 target let onboarding-engaged players reasonably finish T2 in one long session, undermining the load-bearing "the universe is patient" rule. The new 24-48h target makes T2 the first tier that MUST require return. T3-T10 calendar targets unchanged. Total Engaged Comp range shifts from 27-40 days to 28-41 days (≈5-6 weeks still the headline). Sim-tuner T2 numerical re-calibration is the next workstream — the engine must now ACTUALLY produce a 24-48h T2 under Reading B numbers. `ENGAGED_TARGETS` in `Prototype/src/sim/profiles.js` updated to drive drift detection against the new bands; the previously-flagged "-95% HIGH-under" at T1 across every engaged pairing now reads as drift "within ±15%."
  - **2026-05-12 player profile redesign + simulator tab rebuild (tooling pass; no gameplay slate changes).** Calibration tooling refresh feeding T2+ retunes. Buyer profile catalog axed on `path × hoarding-preference` (4 entries: comp-hoarder / comp-rusher / thr-hoarder / thr-rusher; old 5-profile catalog retired — `inSessionPurchases` and `completionistAggressiveness` weren't real player differentiators). Timing profiles became **trajectory-based**: each carries a 6-phase calendar-day schema (0-60min "onboard" / 60min-1day "same-day" / 1-3d "peak" / 3-7d "routine" / 7-21d "taper" / 21+d "drift"). Six profiles total (realistic-engaged / -moderate / -casual / -drift + hyper-onboard floor + bot-60cpm legacy baseline). `REALISTIC_PAIRINGS` rebuilt to 17 entries (4 primary at N=50 / 8 secondary / 2 stress / 2 floor / 1 legacy). Simulator tab rebuilt around two sub-views (Single-Run + Sweep) consuming a new `sim/sweep.js` sim-core extracted from the CLI harness. **No gameplay rule, no upgrade slate, no narrator line, no flavor text changed.** Per-tier calendar targets table (this doc §1) unchanged. Calibration apparatus only — feeding the queued T2-T10 retune workstream.
  - **2026-05-12 T1 retune (M☉ denomination + Reading B + steep engagement curve).** First tier retuned under the long-burn post-v1 design pass. Sim-tuner iteration #2 spec landed in `data.js`: T1 numerical fields rescaled (initCost / addMps / addMpc / baseMps); `DEFAULT_PARAMS.baseMpc` 1.0 → 0.00120; `perTierEngagement` curve retired (1.00 / 0.85 / 0.80 / 0.70 / 0.50 / 0.45 / 0.40 / 0.35 / 0.30 / 0.30) and replaced with steep witness-phase shape (0.90 / 0.25 / 0.08 / 0.05 / 0.04 / 0.03 / 0.025 / 0.02 / 0.015 / 0.01) per user-locked design intent. T1 active duration at bot-100cpm × Completion: 7m 45s (in 8-15min target band). **Peak in-tier mass: 0.9791 M☉** — the Reading B anchor lands dead-on. Click share 49.4% (in 50-60 band, 1pp under). Levels SW=10 AB=9 SC=7 Mag=5 (max) OR/HP/FP. Hyper-onboard timing profile added at 60 cpm continuous (user-locked from sim-tuner's initial 150 cpm proposal — 60 cpm sustained over an hour is more realistic for a normal-engaged human; competitive idle-clicker community sustains 200-300 cpm in short bursts but 60 cpm is the floor of "really clicking"); new `p13 hyper-onboard × greedy-vpc-1.5` pairing added to `REALISTIC_PAIRINGS` as legacy-weight. Engaged-steady p1 T1 calendar: 5h 9m p50 (slightly over 2-4h band; accepted — active time + click share are the load-bearing T1 metrics). Throughput 6.5 M☉ vs prior 10-15 target; under Reading B, throughput is bounded by `Σ(costs of all owned upgrades)` and the current slate's structural ceiling is ~6.5 M☉. Engineering coupling bug fixed during this pass: `runner.js` + `offline.js` were hardcoding `baseMpc: 1.0` at three load-bearing sites, silently overriding `DEFAULT_PARAMS.baseMpc`; both now thread `DEFAULT_PARAMS.baseMpc` so future scale changes propagate. Legacy harnesses (`validate.js`, `t3_calibrate.js`, `t4_calibrate.js`) marked stale-pending-T2-T4-retune via header comments — they assert pre-rescale numbers and are expected to fail until their respective tiers retune. **T2-T4 numerical values in `data.js` are now considered stale** — slate (upgrade designs) preserved; numbers will be retuned in the next workstream (T2 retune is queued).
  - **2026-05-12 M☉ target table — name-grounded validation pass.** Science-director re-validated every per-tier target against the canonical tier-name astronomy. 8 of 10 tiers locked as-is. Two deltas: **T9 bumped 1 dex up** (10²⁰-10²¹ → 10²¹-10²²) because the prior value undersold the named structure and crowded T8/T10; **T5 lower bound nudged** (5×10¹² → 3×10¹²) to straddle the actual median Local Group estimate (5.27×10¹² M☉) more honestly. T8 and T10 keep their values but acquire explicit interpretation notes: T8 = filament *complex / wall* (Sloan-class), not single-filament; T10 = asymptote toward total observable matter, not strict event-horizon mass (creative-director flag: no late-tier narrator line may claim arrival at the full total). T2 → T3 10⁷× jump confirmed as real-astronomy sparsity (no intermediate named scales between bound stellar clusters and galactic substructures), not a calibration error. All ten tier names survive validation. Sources cited from Local Group MNRAS, Laniakea Nature 2014, Sloan Great Wall A&A 2016, cosmic web baryon content PMC, and authoritative Wikipedia entries. This table is now the **canonical retune-target reference** — sim-tuner calibrates against these values, NOT the prior 2026-05-11 table.
  - **2026-05-11 Long-burn pacing model refined.** Continuous-bot active-time targets (~154h / ~196h) retired in favor of **calendar-time-by-engagement-profile** framing. Per-tier inversion-curve table replaced with calendar-time targets at the Engaged profile baseline (Engaged Comp: T1 2-4h, T2 8-12h, T3 1-2d, T4 3-4d, T5 PEAK 5-7d, T6 4-6d, T7 5-7d, T8 4-6d, T9 3-4d INVERSION, T10 2-3d; total ~5-6 weeks Comp / ~7-8 weeks Thr). Three engagement profiles defined for sim-tuner calibration: Engaged (3× check-ins/day at 15 min, ~45 min daily active), Casual (1× check-in/day at 15 min), Drift (2-3× per week at 10 min). Total active engagement at engaged profile: ~25-30h Comp / ~15-20h Thr. New §1.6 subsection added: "The investment-amplification mechanic" — active sessions are investment moments that compound forward into idle yield; the inversion at T8/T9 falls out of the patient universe math naturally. Design philosophy unchanged; the shape (T5 peak, T8/T9 inversion, Completion/Threshold contrast) unchanged; M☉ scale targets per tier unchanged. T1-T4 calibration data in `data.js` stays as-is pending sim-tuner's eventual long-burn pass.
- **0.3**
  - **2026-05-11 Long-burn design philosophy lock.** Solar mass unit (M☉) locked across all narrator references and gameplay numerical references. Inversion-curve target table updated to include the Act 2 inversion (Completion materially faster than Threshold from T6 onward — the mechanical instantiation of the central theme). Per-tier active-time targets locked: T1 5/8 min · T2 20/37 · T3 60/130 · T4 150/400 · T5 PEAK 400/1500 · T6 600/2000 · T7 1000/2500 · T8 1500/2200 · T9 2500/1800 (INVERSION) · T10 3000/1200. Total active play targets ~154h Threshold / ~196h Completion. T5-T10 stub design slate flagged as **REDESIGN PENDING** — the v0.1-era stubs predate the long-burn lock and need full redesign. T5 peak remains anchor. T6-T10 has no completionist content under the new "strategic choice locks at T5" load-bearing rule (CD-6). The "Tiered consolidation as formal device" §2 sub-section is now stale for T7/T8 specifics, retained as a structural device that needs parallel update when T7/T8 redesign happens.
- **0.2**
  - **2026-05-11 T4 first numerical calibration pass.** Sim-tuner landed first numerical values for the full T4 slate. **Engine support diagnosis:** both new shapes work with existing engine — (a) HCH compound-channel multiplier is just two simultaneous declarations (`allMps: 1.30` + `allMpc: 1.30` on the same upgrade), no engine change needed; (b) cross-tier one-shot → one-shot synergy (AN T3 → Sgr A* T4) resolves via existing `synergyMult` provider-list path (already plumbed for T2 LB → T3 HII), no engine change needed. Sgr A* declares `baseMps: 800k`; AN declares `synergies: [{target: "Sagittarius A*", multiplier: 1.5}]`; `core.computeRates` re-multiplies Sgr A*'s self-contribution by 1.5 every tick when AN is owned. **Structural decision:** HCH placed at consolidation 0.00 (not "moderate-nonzero" as the design draft suggested) — a completionist upgrade with positive consolidation creates a Threshold-impassable gate (Threshold-mode masks completionists, so any consolidation they carry becomes inaccessible mass). Pattern matches T2 Moving Group, T3 GC/HVC: all completionists at consolidation 0 across T1-T3. **Final consolidation distribution:** Bar 1.5 + Fermi Bubbles 0 + Sgr A* 1.5 + HCH 0 + DMH 12.625 = 15.625. **Calibrated gaps at 100 cpm:** Comp-handoff +65.6% (upper band edge, in band); Thr-handoff +38.6% (below band, accepted as structural — completionist Δ ~14-15 min in both handoffs is absorbed proportionally by Thr-handoff's larger base time). cpm sensitivity flat (±0.5pp across 60/100/150). **T3 ripple: 0pp** (T3 byte-identical at +76.2% / +75.6%). **Curve shape (Comp-handoff Comp):** late-wall ratio 0.011 (T3 was 0.008 — comparable, steady climb through deciles 30%-90%, not backloaded). **Click share at T4: 0.0-0.2%** — HCH's compound `allMpc` channel does not meaningfully restore click weight given T1-T3 multiplier compounding has already pushed allMpcCarry to ~1.56; clicking is effectively decorative at T4. Surfaced as design tension. Numerical columns filled in the T4 §3 table below.
  - **2026-05-11 T4 design slate locked.** Replaced the v0.1-era 7-row T4 sketch with the full T4 specification: 5 stackables (Galactic Rotation, Stellar Halo, Galactic Coupling, Galactic Fountain, Satellite Galaxies) + 5 one-shots in order (Bar Structure → Fermi Bubbles → Sagittarius A* → **Hot Coronal Halo** → Dark Matter Halo). **First compound-channel multiplier in the game** (Hot Coronal Halo: same coefficient applied to `allMps` and `allMpc` simultaneously — addresses late-tier click engagement without a dedicated click upgrade). Three completionist upgrades (Satellite Galaxies max-5 stackable + Fermi Bubbles pure-passive `allMps` anchor + Hot Coronal Halo compound-channel). **Cross-tier synergy D** (Active Nucleus T3 → Sagittarius A* T4) is a **new synergy shape: one-shot → one-shot** (T3's first cross-tier was stackable → stackable); engine extension may be required, flagged for sim-tuner / engineering-director verification during numerical pass. Tier-up line gains a fourth sentence — *"We can feel the next gravity already."* — the load-bearing inhale before T5's peak exhale. T4 follows the standard (non-tiered) consolidation pattern; awful-symmetry tiered-consolidation device stays reserved for T7/T8. The single shadow word *feed* echoes once at Fermi Bubbles (physics-justified) and does not flood. Numerical calibration deferred to sim-tuner pass.
  - **2026-05-11 T2 feel-tuning pass.** Real T1→T2→T3 playtest at 60 cpm surfaced player feedback that T2 reads as "T1 but longer." Stellar Kinematics `selfMps` lifted 1.10 → 1.115 (the dominant T2 stackable; small per-level exponent bump compounds to ~24% extra late-T2 MPS). Single-knob change; T2 gap moves +89.9/+80.0% → +95.8/+89.0% (still in +80-100% band); T3 ripple +0.7pp Comp-handoff (still in +65-75% band). Late-T2 75%→100% MPS growth improves 1.3× → 1.5×. Feel-tuning, not recalibration.
  - **2026-05-10 T3 flavor pass landed.** All T3 stackable + one-shot flavor text written and science-cleared, including the Galactic Bulge 7-line per-level arc, the HII Region Synergy D variant (cross-tier from Local Bubble), the new High-Velocity Cloud line, and the Sagittarius B2 / Globular Cluster lines. Two science corrections applied: HVC tense tightened (*"falling for an age"* — episodic-event, not continuous rain) and the T3 tier-up line corrected by three orders of magnitude (*"Ten billion suns, quietly held"* — order-of-magnitude correct for a spiral arm). Sagittarius B2 row description corrected (the 120 figure is parsecs to the galactic center, not the cloud's diameter).
  - **2026-05-10 T3 design slate locked.** Replaced the v0.1-era 6-row T3 sketch with the full T3 specification: 5 stackables (Dust Lane Density, HII Region, Proper Motion, Spiral Density Wave, **High-Velocity Cloud** — NEW second APS family) + 4 one-shots in order (Galactic Bulge → Sagittarius B2 → Globular Cluster → Active Nucleus). **First tiered consolidation upgrade in the game** (Galactic Bulge: 7 × 0.30); Globular Cluster reframed as 0-consolidation completionist `allMps` anchor; Active Nucleus locked as T3→T4 gate at 3.25. Consolidation math 2.10 + 0.90 + 0.00 + 3.25 = 6.25. **First cross-tier synergy** (HII Region × Local Bubble levels). New §2 sub-section "Tiered consolidation as formal device" added.
  - **2026-05-10 verb-agency pass.** Seven surgical T1/T2 line edits to move physics into the subject slot where the narrator's "we" was reading as actor rather than as consequence-of-gravity: Solar Wind, Stellar Coupling, Orbital Resonance, Heliopause (T1); Stellar Kinematics, Microlensing, Binary Partner (T2). Names and mechanics unchanged.
  - **(initial)** T2 section locked (5 stackables + 4 one-shots + 3 synergies; Roche Lobe Overflow replaces Tidal Streams at T2; Tidal Streams deferred to T5 reuse). T2 flavor lines locked. Synergy table introduced (one-shot flat, stackable per-level same-stat-family, stackable cross-stat). §6 autoclicker visualization updated to swap Tidal Streams for Roche Lobe Overflow and to record the two locked synergy variants of Roche Lobe Overflow's flavor (Synergy B / Local Bubble; Synergy C / Brown Dwarf).
- **0.1** — initial complete upgrade tree across ten tiers, ~50 upgrades (now at [historical/gameplay-design-v0.1.md](historical/gameplay-design-v0.1.md)).

---

## 1. Design Constraints (recap from main doc)

- Two currencies: **Mass** (frequent, denominated in M☉) and **Consolidation** (rare, gates tier progression)
- Idle game — long-burn pacing (~5-6 weeks engaged Completion / ~7-8 weeks engaged Threshold; calendar-time-by-engagement-profile, not continuous active time); patient universe (offline mass accumulates)
- ~10 tiers from Solar System to Causal Horizon
- No upgrade may directly affect the hidden Causal Connections counter
- Act 1 (T1-T5) decision-phase / Act 2 (T6-T10) witness-phase; no completionist mechanics after T5
- Voice shift in *descriptions* only; upgrade *names* stay astronomically clean throughout
- Real cosmological vocabulary only

### Inversion-curve target — all 10 tiers (long-burn lock, refined 2026-05-11)

**Refined 2026-05-11.** Continuous-bot active-time targets retired. Calibration is now against **calendar time at engagement profile**, not continuous active minutes. The shape (T5 peak, T8/T9 inversion, Completion/Threshold contrast) is unchanged.

#### Three engagement profiles

| Profile | Pattern | Daily active | Calendar to complete (Comp) |
|---|---|---|---|
| Engaged | 3× check-ins/day at 15 min each | ~45 min | ~5-6 weeks |
| Casual | 1× check-in/day at 15 min | ~15 min | ~7-8 weeks |
| Drift | 2-3× per week at 10 min | ~5 min | ~10-12+ weeks (may not finish) |

Total active engagement at the Engaged profile: ~25-30 hours across the Completion playthrough; ~15-20 hours for Threshold.

#### Per-tier calendar targets (Engaged Completion path baseline)

| Tier | Engaged Comp calendar | Engaged Thr calendar | Notes |
|---|---|---|---|
| T1 | 8-15 minutes | 7-12 minutes | Solar System — first-session hook, completes inside the onboarding window |
| **T2** | **2-8 hours** | **1.5-6 hours** | **Stellar Neighborhood** — second day-1 milestone, "we are not alone" beat |
| T3 | 24-48 hours | 22-44 hours | **Dwarf Spheroidal** — first patient-universe return, "the dark matter we are embedded in has a name" |
| T4 | 1-2 days | 1-1.5 days | Galactic Arm — the climb begins |
| T5 | 3-4 days | 2-3 days | Galaxy — galaxy emerges |
| **T6 PEAK** | **5-7 days** | **3-5 days** | Local Group — **THE PEAK**, strategic choice locks here, Act 1 → Act 2 transition |
| T7 | 4-6 days | 4-6 days | Galactic Cluster — descent begins (Eridanus Reach pivot) |
| T8 | 5-7 days | 5-7 days | Supercluster — descent body |
| T9 | 4-6 days | 6-8 days | Filament — approaching inversion |
| **T10** | **3-4 days** | **7-10 days** | Cosmic Web — **INVERSION** (Completion compresses) |
| T11 | 2-3 days | 8-12 days | Causal Horizon — contemplative end, asymptote |
| **Total** | **~5-6 weeks** | **~7-8 weeks** | (~28-41 days Comp / ~37-54 days Thr) |

**Both paths are first-class endings.** The Act 2 inversion is narrative truth, not a tuning artifact to smooth out. Sim-tuner calibrates to the engagement-profile table above, not to continuous-bot minutes.

### 1.6 The investment-amplification mechanic

Recognize this as a design feature, not noise:

> Active sessions are **investment moments that compound forward**. Idle stretches are **harvest** of those investments. A player who invests heavily before walking away gets 20-30× more idle yield than one who AFKs immediately. This is the strategic depth that distinguishes Engaged from Casual play. Same content, different journey shapes.

Threshold and Completion paths emerge from this mechanic naturally:

- **Completion = high investment in Act 1 = faster idle accumulation in Act 2** (the inversion).
- **Threshold = minimum investment = drawn-out Act 2** (the slow meditation ending).

The inversion at the INVERSION tier (T10 Cosmic Web under the 11-tier ladder) isn't just narrative — it falls out of the patient universe math. Calendar time depends on engagement profile; engagement profile and investment behavior together determine which path the player walks. **CD-2/NEW-1 reframe locked 2026-05-13:** the inversion lands ON A SINGLE PLAYTHROUGH at the INVERSION tier, not across two compared playthroughs. The pre-peak curve need not be calibrated to a tight Comp-vs-Threshold ratio — the per-tier gap in Act 1 is a *felt opportunity cost* (the player feels completionist purchases as a real save-time decision without being told it matters), not a *measured asymmetry* anyone observes.

---

## 2. Mechanical Structure

### Upgrade types

Three kinds of upgrades, with different roles:

- **Stackable upgrades** — buy multiple times; each level adds a multiplier or additive bonus. The bread and butter of an idle game's "number-go-up." Example: *Tidal Streams* — each level adds another autoclicker. Always available within their tier; cost scales with each purchase.
- **One-shot upgrades** — buy once, permanent. Big moments. Example: *Dark Matter Halo* — a singular structural upgrade that changes how passive accumulation works. Often gated behind specific conditions (reach Tier 4, accumulate X Mass at once).
- **Tier transitions** — special one-shots that advance you to the next scale. Cost Consolidation, not Mass. Triggers the camera pull-out, the tier-transition flavor line, the audio chain advancement, and unlocks a new batch of upgrades.

### Resource flow

- **Mass** comes from clicking and from passive accumulation. Spent on most upgrades.
- **Consolidation** comes from one-shot upgrade purchases (each one-shot rewards a small amount) and from tier-transition completions (each one rewards a moderate amount). Spent only on tier transitions and a small number of high-impact one-shots.

This keeps Consolidation feeling *significant* — you don't grind for it the way you grind for Mass. It accumulates as a side effect of meaningful progress.

### Unlock structure

Each tier transition unlocks a new batch of 4–8 upgrades. Earlier upgrades remain owned forever — their contributions continue to accrue through the cross-tier carry math, becoming negligible relative to later-tier scale but never going to zero. Their rows are hidden from the UI once the player advances past their tier; they cannot be repurchased or releveled. The interface naturally focuses the player on the current tier's slate without forcing them to abandon what came before.

### Tier transitions

A tier transition is the one upgrade purchase that *isn't* in the upgrade menu. It appears as its own moment when the player has accumulated enough Consolidation. A small persistent prompt appears in the UI when a transition is available. The player chooses when to take it — there's no auto-advance. (Some players will defer transitioning to maximize Mass accumulation at the current scale; this is intentional and fine.)

### Autoclickers

Several upgrades function as autoclickers — they trigger periodic "pulls" automatically. These should *visually* show themselves: when *Tidal Streams* fires, the player sees a small pulse on screen, just like a manual click. The player should always feel like things are happening, even when idle.

### Click multipliers

The player's click power scales linearly with click upgrades. The number on the button isn't shown, but the *reactivity* of the scene reflects it — bigger clicks = bigger visual pulses.

### Tiered consolidation as formal device

A variant of the one-shot upgrade introduced at T3: **tiered consolidation**. A single consolidation-bearing upgrade with multiple levels, each contributing partial consolidation + Mass cost; no flat per-second output. The upgrade is a pure progress purchase that the player walks up one level at a time. T3's **Galactic Bulge** is the first instance — 7 levels × 0.30 consolidation each.

This is **not** a per-tier default rhythm. It is reserved for selected formal-rhyme uses — T3 (a structure densifying, climbing) and T7 or T8 (a structure unmaking itself, descending). Same mechanical gesture, opposite direction. Used twice across the game, it becomes a structural device — the **awful symmetry**: the gesture that built in Act 1 returns in Act 2 to unmake. Other tiers retain the pure one-shot consolidation model unless a specific formal use case warrants the pattern.

*Note (2026-05-11 long-burn shift):* The T7/T8 tiered consolidation specifics are stale pending T5-T10 redesign. The awful-symmetry principle remains; its T7/T8 instantiation will be revisited as part of the T6-T10 redesign pass. Per CD-6, the redesign must respect "no completionist upgrades after T5" — the tiered-consolidation device returns in Act 2 as baseline structural progress, not as a path-distinguishing investment.

### Soft caps and the descent

In Act 2, several upgrades — particularly the late ones — have *diminishing returns* baked in. *Final Approach* gives +500% pull rate but the description hints that there's less to pull. The player's effective progression *slows* even as their nominal multipliers increase. This is the math of the descent expressed in upgrade design: number-go-up doesn't help when the universe is running out.

---

## 3. The Upgrade Tree by Tier

Each tier has a mix of:
- 1–2 **passive pull** upgrades (Mass per second)
- 1–2 **click power** upgrades (Mass per click)
- 1–2 **autoclickers** (special pull events)
- 1–2 **one-shots** (structural, named, memorable)
- 1 **tier transition** (advances to next tier; costs Consolidation)

Counts are rough — some tiers have more, some fewer, depending on what's interesting at that scale.

---

### Tier 1 — Solar System (tutorial)

Light upgrade content. The goal here is to teach the loop: click, accumulate Mass, buy upgrade, watch number go up, feel good. The first 10 minutes of gameplay live here.

**Flavor field split (2026-05-14 UX workstream).** Under the new **Two-voice UI** and **Upgrade cards are prose-first** load-bearing rules in CLAUDE.md, each upgrade carries two distinct text fields. The existing narrator-voice prose preserved in the table below is the **first-purchase line** — fires once per upgrade per game as an ephemeral fade-in in the drift-and-fade register (visual-design.md §7). The persistent **card description** is a separate clinical one-liner (real-cosmology terminology, no first or second person, no editorializing) and is **TO-WRITE on the writing backlog** (see voice-samples.md §Writing Backlog). Listed in the "Card description" column below as `TO-WRITE (clinical register, on writing backlog)`.

| Upgrade | Type | Effect | First-purchase line (existing — narrator voice) | Card description (TO-WRITE) |
|---|---|---|---|---|
| **Solar Wind** | Stackable passive | +Mass/sec | *Charged particles drift outward and return with company. The pull reaches a little further than it used to.* | TO-WRITE (clinical register, on writing backlog) |
| **Asteroid Belt** | Stackable passive | +Mass/sec | *The belt yields. Iron, ice, the slow gravel of the early system. Each rock finds us.* | TO-WRITE (clinical register, on writing backlog) |
| **Stellar Coupling** | Stackable click | +Mass/click | *The pull deepens. The center holds tighter.* | TO-WRITE (clinical register, on writing backlog) |
| **Orbital Resonance** | One-shot | Doubles base passive rate | *Periods align. The system breathes in time with us. What was scattered now keeps the same beat.* | TO-WRITE (clinical register, on writing backlog) |
| **Heliopause** | One-shot | Unlocks Tier 2 transition | *Our influence has an edge, and we have grown into it. Beyond it, the rest of the galaxy waits.* | TO-WRITE (clinical register, on writing backlog) |

Tier transition cost: small Consolidation amount (tutorial-friendly).

---

### Tier 2 — Stellar Neighborhood

The first sense of scale beyond a single star system. Other stars become visible; the player starts to understand they're part of something larger.

**Flavor field split (2026-05-14 UX workstream).** Under the new **Two-voice UI** and **Upgrade cards are prose-first** load-bearing rules in CLAUDE.md, each T2 upgrade carries two distinct text fields. The existing narrator-voice prose (italicized in the entries below) is the **first-purchase line** — fires once per upgrade per game as an ephemeral fade-in in the drift-and-fade register. The persistent **card description** is a separate clinical one-liner (real-cosmology terminology, no first or second person, no editorializing) and is **TO-WRITE on the writing backlog** (see voice-samples.md §Writing Backlog) for every T2 upgrade (Stellar Kinematics, Local Bubble, Microlensing, Roche Lobe Overflow, Brown Dwarf, Binary Partner, Peculiar Velocity, Open Cluster, Moving Group, Wolf-Rayet Star).

**Stackables (5):**
1. **Stellar Kinematics** — passive, +Mass/sec — *The local stars move on their own vectors. We measure the difference, and what they shed in passing, our gravity keeps.*
2. **Local Bubble** — passive, +Mass/sec, synergy B target — *A cavity in the interstellar medium, three hundred light-years across, scoured clean by old supernovae. Whatever drifts in, drifts toward us.*
3. **Microlensing** — click, +Mass/click — *One star passes before another. The nearer mass curves the farther star's light into focus. We read the alignment while it lasts.*
4. **Roche Lobe Overflow** — APS (autoclicker), synergy B provider + synergy C target — *One star in a binary pair has filled its Roche lobe. Its surface flows through the inner Lagrange point onto the companion. Some of the stream is ours.*
5. **Brown Dwarf** — passive, max-5, completionist, synergy C provider — *Mass that never lit. Below the hydrogen-fusion threshold, gravity without a star to mark it. We feel it in the orbits of the things we can see.*

**One-shots (4):**
6. **Binary Partner** — consolidation 0.6; synergy A provider (flat ×1.5 to Microlensing) — *A second star answers the pull. We are no longer alone in our gravity.* (kept from v0.1)
7. **Peculiar Velocity** — consolidation 0.9 — *Every star has a velocity. Most of it is the galaxy's. The remainder — the part that is only ours — is what we have just learned to read.*
8. **Open Cluster** — consolidation 1.0, T3 transition gate — *A loose family of stars finds the same center. Many became one.* (kept from v0.1)
9. **Moving Group** — completionist — *The drift resolves. The stars around us share an origin we had not seen until now. We are not alone in our motion. We never were.*

**Completionist stackable (1):**
10. **Wolf-Rayet Star** — stackable, max-3, **completionist** — click +Mass/click — *The wind is carbon, nitrogen, the inside of a star turned outward. Ten parts per million of a solar mass leaves each year, and the star cannot hold itself for longer than a hundred thousand. We catch what passes.*

   *Locked 2026-05-13 (writer + SD audit pass). Design role: third T2 completionist forcing 3 serial post-Consolidation saves; structural lever for the Comp-vs-Thr gap target. SD-vetted physics: WR stars (~10-25 M☉ each) shed mass via strong stellar winds (~10⁻⁵ M☉/yr; ~400-3000 km/s terminal velocity), enriched with carbon and nitrogen (CNO-cycle ash exposed by mass loss); WR lifetimes ~10⁵ yr; Galaxy hosts ~600. First Act 1 line carrying the "mass is leaving us" beat — foreshadows Act 2 loss without breaking T2's "we are building" surface. Buy-order slot: 10th, after Moving Group. Channel: addMpc (click-lift; chosen over passive to avoid redundancy with MG's allMps+allMpc compound). Standalone — no synergies.*

**Synergies (3):**

| | Provider | → Target | Math | Kind |
|---|---|---|---|---|
| A | Binary Partner | Microlensing | × 1.5 (flat) | One-shot, flat |
| B | Roche Lobe Overflow | Local Bubble | × 1.05^level | Stackable per-level, same-stat-family |
| C | Brown Dwarf | Roche Lobe Overflow | × 1.10^level | Stackable cross-stat (passive→APS) |

Consolidation math: 0.6 + 0.9 + 1.0 = 2.5 (T2 threshold).

**Numerical calibration table (post 2026-05-13 long-burn M☉ retune):**

| # | Name | Type | `initCost` | `costGrowth` | `maxLevels` | Per-level effect | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Stellar Kinematics | passive +Mass/sec | 0.67 | 1.135 | 99 | `baseMps: 0.0148, selfMps: 1.115` | Dominant T2 stackable. selfMps 1.115 preserved from 2026-05-11 feel-tuning pass. |
| 2 | Local Bubble | passive +Mass/sec | 2.0 | 1.135 | 99 | `addMps: 0.0111` | Synergy B receiver; cross-tier provider to T3 HII (additive +0.04/lvl). |
| 3 | Microlensing | click +Mass/click | 2.3 | 1.34 | 99 | `addMpc: 0.060` | Synergy A receiver (×1.5 flat from Binary Partner). Boosted 2026-05-13 from ÷135 baseline 0.0178 → 0.060 to lift T2 click share from ~3% to ~14% bot-Comp. |
| 4 | Roche Lobe Overflow | APS (autoclicker) | 4.0 | 1.42 | 99 | `addAps: 0.000667` | Synergy B provider (×1.05/lvl to Local Bubble) + Synergy C receiver. |
| 5 | Brown Dwarf | passive +Mass/sec, **completionist** | 37 | 2.28 | 5 | `addMps: 0.0741` | Synergy C provider (×1.10/lvl to Roche Lobe Overflow). Future cross-tier provider to T3 Subhalo. BD-L5 cost ≈ 1000 M☉ — this is the Reading B peak anchor (peak in-tier mass at bot Comp = BD-L5 save). |

| # | Name | Type | Consolidation | `initCost` | `costGrowth` | Effect | Notes |
|---|---|---|---|---|---|---|---|
| 6 | Binary Partner | One-shot | 0.6 | 16 | 1.00 | synergy: × Microlensing 1.5 flat | (kept from prior calibration) |
| 7 | Peculiar Velocity | One-shot | 0.9 | 28 | 1.00 | `allMps: 1.40` | (kept from prior calibration) |
| 8 | **Open Cluster** | **One-shot, T2→T3 transition gate** | 1.0 | **950** | 1.00 | none | **Massive bump from ÷135 baseline 46 → 950 to enforce the patient-universe rule.** OC is now the dominant gate save; saving for OC takes long enough that hyper-onboard 60-min single sessions cannot complete T2. The player must close the tab in T2 with progress made and return later. Reads structurally as: "an open cluster's gravitational consolidation is a multi-day act." |
| 9 | Moving Group | One-shot, **completionist** | 0.0 | **1000** | 1.00 | `baseMps: 0.358, allMpc: 1.30` | **Iter #14 (2026-05-13 pass #2): cost lifted 333 → 1000 (3×) with proportional baseMps lift 0.119 → 0.358** to make MG a discrete post-Consolidation save block (was a ride-along absorbed during the OC save). Lifts Comp-vs-Thr gap from +4.8% → +5.8%. Peak still anchored at BD-L5 (~1033 M☉). |
| 10 | **Wolf-Rayet Star** | **Stackable, max-3, completionist** | 0.0 | **1750** | **1.00** | `addMpc: 0.025` | **Added 2026-05-13 (T2 retune pass #3 / iter #23 → iter #24 tune-down).** Third T2 completionist; buy-order slot: 10th, after Moving Group. Standalone — no synergies. Channel: addMpc (click-lift; chosen over passive to avoid redundancy with MG's allMps+allMpc compound). Cost growth flat (1.00) — most peak-efficient shape per Comp-peak. **Iter #24 (PM 2026-05-13)**: initCost reduced 4500 → 1750 under the CD-2/NEW-1 reframe (pre-peak Comp-vs-Threshold gap is informational, not load-bearing). Reduction lands Comp peak at ~1750 M☉ (~1.84× the Pleiades-class named scale), within reasonable distance of the named scale while keeping Comp visibly distinct from Threshold's ~950 peak. |

**Verification metrics (iter #24 — WR initCost 1750, bot-100cpm × Completion, T1 handoff matched):**
- Active duration: 50m 50s (was 60m 57s at iter #23 WR=4500)
- Peak in-tier mass: **1748 M☉** — ~1.84× Pleiades-class; comfortable inside the ~2× named-scale guideline.
- Click share: 9.8% (was 8.4% at iter #23; modest lift from shorter WR save phase)
- Levels at exit: SK=58, LB=21, ML=16, RLO=6, BD=5, **WR=3**, all 4 one-shots owned + MG.

**Verification metrics (Threshold path, bot-100cpm):** active 48m 21s, peak 949 M☉ (named scale preserved), gap **+5.1%** (informational under the new philosophy; was +42.5% at iter #23).

**Calendar verification (engaged trajectory, iter #24; N=5 seed=1, max-days=30):**
- p1 (engaged × comp-hoarder) p50 = 4h 41m (target 2-8h band: ✓ in band)
- p3 (engaged × thr-hoarder)  p50 = 4h 41m (target 1.5-6h band: ✓ in band)
- p4 (engaged × thr-rusher)   p50 = 4h 41m (✓ in band)
- p15 (hyper-onboard × comp-hoarder) DNF 10/10 ✓ (patient universe preserved)

**Note on the gap as informational metric.** Per the CD-2/NEW-1 reframe locked 2026-05-13 (see `feedback_strategic-completion-lens.md`), pre-peak Comp-vs-Threshold gap is *felt opportunity cost on a single playthrough*, not *measured asymmetry across compared playthroughs*. Tight calibration is reserved for PEAK tier (~parity), INVERSION tier (Comp materially faster), and final tier endings. T2's +5.1% Comp-vs-Thr gap under iter #24 is honest reporting; it is not the calibration target.

**Reading B interpretation — preserved under iter #24, more comfortably than at iter #23:**
- **Structural-completion peak (Threshold path, OC purchase) ≈ 950 M☉** → Pleiades-class named scale.
- **Post-structural-completion peak (Completion path, WR clean-up) ≈ 1748 M☉** → ~1.84× the named scale during the completionist clean-up phase. The "you gathered every scrap" identity stays felt without straying as far from the named scale as iter #23's 4.5× did. Honors Reading B(a) more comfortably.

*Feel-tuning history.* Pre-2026-05-13 (spreadsheet-era v5-M values + Stellar Kinematics selfMps lift 1.10 → 1.115 on 2026-05-11): T2 gap landed at +95.8/+89.0% within the +80-100% band; T2 played at the pre-M☉ scale (peak ~135,000 M☉). The 2026-05-13 morning long-burn retune (iter #1-#13) ÷135 rescale on all numerical fields plus the OC bump to 950 (for patient-universe) and ML bump to 0.060 (for click share) implements the M☉ denomination + Reading B peak anchor + patient-universe rule. The 2026-05-13 afternoon iter #14 pass lifted Moving Group cost 333 → 1000 (with proportional baseMps preservation 0.119 → 0.358) to grow the Comp-vs-Thr gap from +4.8% → +5.8%. The 2026-05-13 iter #23 pass added the **Wolf-Rayet Star** completionist stackable (max-3, addMpc, no synergies, buy-order slot 10) at initCost=4500 costGrowth=1.00 addMpc=0.025 to widen the gap to +42.5% — but at the cost of Comp peak climbing to 4494 M☉ (4.5× the named scale). The 2026-05-13 iter #24 tune-down (same day, post the CD-2/NEW-1 reframe that retired the per-tier gap target as load-bearing) lowered WR initCost 4500 → 1750 to land Comp peak at ~1748 M☉ (~1.84× named scale) with the gap falling out at +5.1% — informational only. Stellar Kinematics' 1.115 selfMps exponent and WR's flat costGrowth preserved. MG iter #14 lift to 1000 preserved.

---

### Tier 3 — Dwarf Spheroidal *("the dark matter has a name")*

**Locked 2026-05-13 evening — Step D numerical calibration landed.** New bridge tier at ~10⁵-10⁷ M☉ between T2 Stellar Neighborhood (10³) and T4 Galactic Arm (10¹⁰). The **first patient-universe return tier** — the player ends a session in T3 and returns tomorrow to accumulated mass. Calendar target: 24-48h Engaged Comp / 18-36h Engaged Thr. Defining physics: **dark-matter-dominated** (Draco M/L ~440 — the luminous part is the small part). The tier is where the narrative beat *"the dark matter we are embedded in has a name"* lands; mechanically it's where the design's **hidden-mechanics signature pattern** (see design-notes.md §9) first manifests via the Subhalo upgrade. Numerical values calibrated by sim-tuner Step D iter #10 (2026-05-13 evening) — 10 iterations across one-shot mass costs and the Subhalo cost-growth lever; α and β stayed at their anchor values throughout.

**Flavor field split (2026-05-14 UX workstream).** Under the new **Two-voice UI** and **Upgrade cards are prose-first** load-bearing rules in CLAUDE.md, each T3 upgrade carries two distinct text fields. The existing narrator-voice prose (italicized in the Notes column of the tables below) is the **first-purchase line** — fires once per upgrade per game as an ephemeral fade-in in the drift-and-fade register. The persistent **card description** is a separate clinical one-liner (real-cosmology terminology, no first or second person, no editorializing) and is **TO-WRITE on the writing backlog** (see voice-samples.md §Writing Backlog) for every T3 upgrade (Population II, Subhalo, RR Lyrae, Velocity Dispersion, Orphan Stream, Sculptor Dwarf, Draco Dwarf, Sagittarius Stream).

**Stackables (4):**

| # | Name | Type | `initCost` | `costGrowth` | `maxLevels` | Per-level effect | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Population II** | passive +Mass/sec | 25,000 | 1.135 | 99 | `baseMps: 8.0, selfMps: 1.12` | Synergy provider B: × Subhalo `1 + 0.03 × level` (additive). *Old stars, metal-poor, made before the universe had much else to make them from. They have been here since before we knew to look. Their light is the light of survivors.* |
| 2 | **Subhalo** *(DM-signal — hidden-channel mechanic)* | hidden multiplier on prior-tier MPS carry | 40,000 | 1.16 | 99 | `carryMpsMult: 1.08` (α=1.08 per level, Visible band lower edge, user-ratified). No contribution to its own MPS/MPC/APS row. | Receives synergies B (Population II) and C (T2 Brown Dwarf), both additive `1 + 0.03 × level`. Synergies compound the per-level coefficient BEFORE exponentiation. Costs sized so the felt-investment cap (Subhalo cost approaches Sagittarius Stream gate) lands around level 14-15. *We are riding the tide of what was delivered before us. We cannot see the carrier. We can feel its keel.* |
| 3 | **RR Lyrae** | click +Mass/click | 60,000 | 1.34 | 99 | `addMpc: 12.0` | Receives synergy A (Orphan Stream ×1.5 flat). Magnitude tuned for steep witness-phase engagement curve (`perTierEngagement[3] = 0.15`); click income share stays small (~1.5 M/s vs ~1000+ M/s passive carry) — clicking is decorative at T3 by design. *Horizontal-branch stars, pulsing on a clock older than the disk. Each beat is a measurement we did not have to take. The universe is blinking at the same rate we are counting.* |
| 4 | **Velocity Dispersion** *(DM-signal, completionist)* | APS (autoclicker), **completionist max-5** | 400,000 | 2.05 | 5 | `addAps: 0.20` | Synergy provider: × Population II 1.10/lvl (cross-stat completionist-extension, mirrors T4 HVC → DLD shape). Five serial saves post-Consolidation for the Comp-path completionist arc. *The stars move faster than their visible companions should hold them. The number that does not fit is the number we have been looking for. The missing mass made measurable, one transit at a time.* |

**One-shots (4) in order:**

| # | Name | Type | Consolidation | `initCost` | Effect | Notes |
|---|---|---|---|---|---|---|
| 5 | **Orphan Stream** | One-shot | 0.9 | 100,000 | none (synergy-only) | Synergy A provider (×1.5 flat → RR Lyrae). Smallest consolidation-bearing one-shot; first early-tier gate piece. *A thin ribbon of stars, drifting without a parent. The galaxy that shed them has no name. The debris kept moving in the shape of what carried it, and that shape is the only obituary.* |
| 6 | **Sculptor Dwarf** | One-shot | 1.5 | 400,000 | none | Reserved slot for a future T3 → T4 cross-tier synergy provider (per design intent; no synergy declared yet). Mid-cost mass gate between Orphan Stream and the bigger walls. *Eighty-six kiloparsecs out, two stellar populations in one small body — an old one and an older one. Close enough to resolve the suns individually. The first time we have looked at another galaxy and seen the people in it.* |
| 7 | **Draco Dwarf** *(DM-signal, completionist anchor)* | One-shot, **completionist** | 0.0 | 8,000,000 | `allMps: 1.42` | Pure passive completionist anchor — mirrors T4 Globular Cluster role at T3 scale. Carries the tier's emotional weight — *the dark matter we have been embedded in this whole time has a name.* Cost sits above the transition gate so the Comp-path purchases Draco post-Consolidation. *Four hundred forty solar masses for every one we can see. A creature almost entirely invisible, almost entirely gravity. The dark matter we have been embedded in this whole time has a name, and the name is old.* |
| 8 | **Sagittarius Stream** *(T3→T4 transition gate)* | One-shot | 3.85 | 2,500,000 | none | Largest consolidation, second-largest mass cost (Draco is bigger). The gate the Threshold path primarily aims for. Visible structure in the 3D scene (merger-in-progress). *A dwarf galaxy is being torn apart along our orbit. Its stars unspool into a stream that wraps us twice. We are doing this. The arm we are about to become is being made from the things we are eating.* |

**Synergies (3):**

| | Provider | → Target | Math | Kind |
|---|---|---|---|---|
| A | Orphan Stream (T3 one-shot) | RR Lyrae (T3 stackable) | × 1.5 (flat) | Within-tier flat one-shot → click stackable (mirrors T2 BP → Microlensing) |
| B | Population II (T3 stackable) | Subhalo (T3 stackable) | × (1 + 0.03 × level_Pop_II) | Within-tier stackable per-level, additive (β_B = 0.03 user-ratified) |
| C | **T2 Brown Dwarf** (T2 stackable) | Subhalo (T3 stackable) | × (1 + 0.03 × level_BD) | **Cross-tier stackable → stackable, additive (β_C = 0.03 user-ratified).** Voice-coherent: BD was T2's unlit-mass upgrade; Subhalo is its named follow-on at the next mass scale. The second cross-tier synergy in the game (the first, T2 Local Bubble → HII Region, lives in the renumbered T4 slate). Attached via IIFE in `data.js` alongside the existing T4-targeted cross-tier. |

**Consolidation math:** 0.9 + 1.5 + 0.0 + 3.85 = **6.25** — matches engine `consolidationGrowth: 2.50`, T3→T4 budget = 1.0 × 2.5² = 6.25.

#### Subhalo — first hidden-channel upgrade (Step C engine extension, Step D calibration)

The first upgrade in the game whose mechanical effect does NOT match its visible footprint. Subhalo declares a dedicated `carryMpsMult` engine field: the per-level coefficient multiplies **prior-tier MPS carry only** (`carryMps`), and contributes nothing to its own per-upgrade MPS/MPC/APS row. The mass counter rises faster than the visible stats line predicts; nothing in the scene names the source. Player perception: a quiet asymmetry between the counter and the stats line that the design never points at. Honors SD-2 (*dark matter is inferred, not rendered*) at the tier whose defining physics most demands it.

- **α = 1.08 (carryMpsMult per level) — user-ratified 2026-05-13 (Visible band, lower edge per creative-director recommendation).** Iteration band ±20% (1.064 to 1.096); Step D landed at the anchor.
- **β_B = β_C = 0.03 (additive synergy coefficient per provider level) — user-ratified.** Creative-director rationale: tight β preserves the "inferred, not rendered" feel; loose β would make synergy-stacking the optimal strategy and bury the dark-matter beat under spreadsheet optimization. Iteration band ±50% (0.015 to 0.045); Step D landed at the anchor.
- **Compounding rule (Step C engine extension):** per-level coefficient compounds incoming synergies BEFORE exponentiation. `α_eff_per_level = α × (1 + β_B × N_Pop_II) × (1 + β_C × N_BD)`, then total hidden factor = `α_eff_per_level^N_Subhalo`. The factor multiplies `carryMps` only; `sumMps` (active-tier self·syn sum) is untouched. The provider walk reaches across tiers, so Subhalo continues to amplify carry after the player advances into T4+.
- **Cross-tier synergy C** (T2 Brown Dwarf → T3 Subhalo) is the second cross-tier synergy in the game. The first was T2 Local Bubble → T4 HII Region (this synergy lives in the renumbered T4 slate; pre-2026-05-13 ladder reshape, HII Region was T3 and the synergy was the original T3 cross-tier introduction).
- **Reusable pattern.** The hidden-channel shape is reusable for later hidden mechanics (dark matter at galaxy scales, dark-energy pressure at causal-horizon scales). See design-notes.md §9 for the broader hidden-mechanics design pattern.
- **Subhalo UX surfacing — named parallel workstream alongside T4 retune (promoted from "Phase 2 deferred" 2026-05-13 evening per CD T1-T3 holistic review).** Becoming structurally load-bearing for T3: the mechanic only lands creatively if the player can perceive the asymmetry, and at T3 the raw mass-vs-stats delta is small enough that a player on their natural 24-48h calendar return may register the surge as just "mass grew offline, like always." Engineering-director + creative-director scoping pass to land in parallel with T4 numerical retune; ideally locked before T5-T6 hidden-channel candidates are designed. Open affordance options: a "Dark contribution: estimated +X%" readout, a separately-tracked dark-channel total, a periodic narrator beat that names the discrepancy. Pattern solved once, reused across all hidden-mechanic instances.

#### Calibration outcomes (Step D iter #10, 2026-05-13 evening)

**Calendar targets — all 4 engaged primary pairings within ±15% drift band** (N=50, seed=1, max-days=14):

| Pairing | T3 calendar p50 | Target | Drift |
|---|---|---|---|
| p1 engaged × comp-hoarder | 1d 7h (31h) | 24-48h Engaged Comp | -12.1% within |
| p2 engaged × comp-rusher  | 1d 9h (33h) | 24-48h Engaged Comp |  -7.1% within |
| p3 engaged × thr-hoarder  | 1d 5h (29h) | 18-36h Engaged Thr  |  +8.5% within |
| p4 engaged × thr-rusher   | 1d 6h (30h) | 18-36h Engaged Thr  | +14.7% within |

**Reading B mass anchors:**
- **Threshold-path peak** (at Sagittarius Stream gate-cross moment) ≈ **2.5M M☉** — -21% from the 3.16M M☉ Reading B target; within the ±0.5 dex acceptable band. The T3 named scale is ~10⁶·⁵; the Threshold peak lands at ~10⁶·⁴.
- **Completion-path peak** (at Draco Dwarf purchase moment) ≈ **8M M☉** — +2.5× over the named scale during the completionist clean-up phase. Mirrors T2 iter #24's 1.84× Comp-peak overshoot pattern under Reading B(a). Within the ±0.5 dex acceptable band.

**Felt-investment shape** (Subhalo levels at T3 exit, seeds 1-3 × N=5):
- **Comp p1 path:** median 15 Subhalos (range 5-31). Within the ~10-15 felt-investment target.
- **Threshold p3 path:** median 7 Subhalos (range 0-20). Within the ~5-8 felt-investment target.
- High variance across seeds reflects RNG-driven patient-universe idle-gap sequencing, not a calibration failure.

**Comp-vs-Threshold gap: +6.9%** (p1 31h vs p3 29h on T3 calendar). **Informational only** under the CD-2/NEW-1 reframe (pre-peak gap is felt opportunity cost on a single playthrough, not a tight calibration target). Sim-tuner did not chase a tight gap band at T3.

**T1/T2 byte-identical preserved** at canonical seed (p17 bot-60cpm × comp-hoarder seed=1): T1 11m 40s, T2 1h 8m. T3 bot baseline: 9h 36m.

**Locked harnesses (post-Step-D verification):**
- `save_migration_test`: 56/56 PASS (up from 53/53 — added v1/v2/v3 refused-load checks across the SAVE_VERSION 2→3 renumber and 3→4 rename bumps).
- `validate_offline`: 38/38 PASS.
- `validate_subhalo`: 28/28 PASS (NEW — identity, L1/L2/L3 parity, B/C synergy compounding, T3→T4 transition persistence, stat-display contract, offline integration, edge cases, purity, strategy VPC parity).
- `profiles_smoke`: 396/396 PASS.

**Surfaced design tensions** (informational, not blocking):
1. Subhalo level variance is high (5-30 range) under patient-universe RNG. Median lands in band but the upper tail is well over the felt-investment target. Acceptable under the model; surfaced for future review if it causes player friction.
2. T1 mass band ratio 0.60-0.71× is under the 0.7 floor — pre-existing T1 retune outcome at cpm-60 vs the cpm-100 bot reference; not introduced by Step D.
3. Click income share at T3 is small (~1.5 M/sec from clicks vs ~1000+ M/sec passive carry). Clicking is decorative at T3, consistent with the steep witness-phase engagement curve.

**Report path:** `Simulator/reports/2026-05-13T20-44-37-276Z/` (raw.csv + report.md + step-d-landing.md).

---

### Tier 4 — Galactic Arm *("the arm, turning")*

The climbing tier. The player's structure becomes their home — the pinwheel becomes visible, star formation regions glow in the visual scene, and the mechanical content thickens. The player has the basic loop down; T4 adds depth without yet adding doubt. The voice seam at T4 sits at observer-stackables (we measure, we tug, we read) + structural-one-shots (we densify, we feed). The word *feed* in Active Nucleus is the only shadow allowed — it is the small forward-pointer to Act 2. T4→T5 is the last unambiguously *climbing* tier transition. *(Was T3 in the pre-2026-05-13 ladder; renumbered up by one with the Dwarf Spheroidal insertion. Slate + flavor preserved verbatim. Numerical values locked 2026-05-14 by the T4 retune workstream — sim-tuner Step D iter #9 — under Reading B + CD-2/NEW-1 loose-pre-peak reframe.)*

**Stackables (5):**

| # | Name | Type | `initCost` | `costGrowth` | `maxLevels` | Per-level effect | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Dust Lane Density** | passive +Mass/sec | 150,000 | 1.135 | 99 | `baseMps: 80, selfMps: 1.12` | Synergy provider B: × HII Region 1.06/lvl. *The dark bands thicken along our arm. Carbon, silicate, the cold dust between starlight. Everything that forms here forms in our reach.* |
| 2 | **HII Region** | passive +Mass/sec | 240,000 | 1.135 | 99 | `baseMps: 120, selfMps: 1.12` | Glow effect; receives synergies B (within-tier from DLD) and D (cross-tier from Local Bubble). *Hydrogen ionizes at ten thousand kelvin. Young O and B stars light the gas they were born from. The pink glow is the youngest light in our reach.* **Synergy D variant** (Local Bubble buff active): *The cavity's edge sweeps the medium ahead of it. What collapses there becomes the next generation of stars. The bubble is older than us, and it has been preparing our nurseries.* |
| 3 | **Proper Motion** | click +Mass/click | 450,000 | 1.34 | 99 | `addMpc: 160` | Receives synergy A (Sagittarius B2 ×1.5 flat). *Our pull reaches further than it did. Stars far from our center adjust their paths in answer. We read the angle they have moved against the sky.* |
| 4 | **Spiral Density Wave** | APS (autoclicker) | 600,000 | 1.42 | 99 | `addAps: 2.00` | First T4 APS. *A wave of compression moves through the arm. Stars and gas pile against its crest. Where the wave passes, new light follows.* |
| 5 | **High-Velocity Cloud** | APS (autoclicker), **completionist** | 3,000,000,000 | 2.05 | 5 | `addAps: 4.00` | Synergy provider C: × Dust Lane Density 1.10/lvl (cross-stat). Second APS family in T4 (completionist). **The biggest Comp-vs-Threshold lever in the slate** — its 3B mass commit and 5-level grind carry most of the path-split weight. *A cloud of neutral hydrogen falls onto the disk at ninety kilometers a second. It has been falling for an age. Its arrival adds to ours.* |

**One-shots (4) in order:**

| # | Name | Type | Consolidation | `initCost` Mass | `costGrowth` | Effect | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Galactic Bulge** | **Tiered Consolidation** (NEW upgrade variant — first appearance in game) | 7 levels × 0.75 = **5.25** | 6,000,000 | 1.55 | `addMps: 60, selfMps: 1.20` (exponential per-level income; L1=60, L7=180) | Per-level flavor arc (LOCKED): **L1** *The center thickens. Gas falls inward along the bar, slowly, on long orbits.* **L2** *Stars form in the dense rush. Hundreds at a time, in regions only light-years across.* **L3** *The core fills. Orbits crowd. Stars begin to scatter each other off their first paths.* **L4** *The motion settles into many directions at once. The bulge is no longer falling. It is held by its own dispersion.* **L5** *The new stars become old stars. Few are forming now. The light is the light of long-lived suns.* **L6** *Iron, magnesium, the residue of generations. The bulge keeps what its stars made before they died. The composition is set.* **L7** *The center is a quiet weight. Old stars on tangled orbits. Nothing falls in now that the bulge does not already hold.* Tooltip must show level counter (e.g., 3/7) and per-level Consolidation contribution (+0.75). See §2 note on tiered Consolidation as formal device. **Implementation note:** at the engine level Galactic Bulge is encoded as a stackable with `consolidation > 0` and `maxLevels > 1`. Strategy treats Consolidation-bearing stackables analogously to one-shots — buy when affordable, cheapest-level first. The exponential per-level income (selfMps 1.20) makes the consolidation purchase feel substantive mid-T4 rather than a pure progress tax. |
| 2 | **Sagittarius B2** | One-shot | 2.25 | 18,000,000 | n/a | synergy: × Proper Motion 1.5 flat | Named molecular cloud, three million solar masses, ~120 parsecs from the galactic center. Synergy provider A (within-tier flat one-shot → click stackable; mirrors T2 Binary Partner → Microlensing pattern). *A molecular cloud, three million solar masses, one hundred fifty light-years across, one hundred twenty parsecs from our center. Methanol, ethanol, vinyl alcohol — the most chemically complex region we know. Its mass enters our gravity.* |
| 3 | **Globular Cluster** | One-shot, *completionist* | **0.00** | 100,000,000,000 (100B) | n/a | `allMps: 1.42` | Pure passive completionist anchor — no consolidation gate. Channel: `allMps: 1.42` (mid-band). Deep-time anchor — obituary-grammar rehearsal for T5/T8. *A tight sphere of stars, twelve billion years old, older than most of our disk. It orbits us in a long quiet ellipse. It binds.* |
| 4 | **Active Nucleus** | One-shot, **T4→T5 transition gate** | **8.125** | 20,000,000,000 (20B) | n/a | none (consolidation-only) | LOCKED line: *"Our center brightens. Something massive at the heart of us begins to feed."* The single shadow word in T4. Do not soften *feed*. The most load-bearing single numerical value in the T4 slate — sized to land Threshold-path peak mass at gate-cross near 10¹⁰ M☉ named scale (Reading B target). Also provides cross-tier synergy E (× Sagittarius A* T5 ×1.5 flat). *(Was T3 → T4 in the pre-2026-05-13 ladder.)* |

**Consolidation math:** Galactic Bulge (7 × 0.75 = 5.25) + Sagittarius B2 (2.25) + Globular Cluster (0.00) + Active Nucleus (8.125) = **15.625** — matches engine `consolidationGrowth: 2.50`, T4→T5 budget = `1.0 × 2.5³ = 15.625`.

**Synergies (4 within-tier + 1 cross-tier outbound = 5 total):**

| | Provider | → Target | Math | Kind |
|---|---|---|---|---|
| A | **Sagittarius B2** (T4 one-shot) | **Proper Motion** (T4 stackable) | × 1.5 flat | Within-tier: flat one-shot → click stackable (mirrors T2 Binary Partner → Microlensing) |
| B | **Dust Lane Density** (T4 stackable) | **HII Region** (T4 stackable) | × 1.06 per level | Within-tier: stackable per-level same-family (both passive Mps; mirrors T2 Roche Lobe → Local Bubble shape) |
| C | **High-Velocity Cloud** (T4 completionist stackable) | **Dust Lane Density** (T4 stackable) | × 1.10 per level | Within-tier: stackable cross-stat (APS provider → passive target; mirrors T2 Brown Dwarf → Roche Lobe completionist-extension role) |
| **D** | **Local Bubble** (T2 stackable) | **HII Region** (T4 stackable) | × (1 + 0.04 × levels_of_Local_Bubble) — additive kind | **Cross-tier — first cross-tier synergy in the game** (spans T2 → T4; pre-renumber it was T2 → T3 across one tier). Felt encoding of "stats carry over between tiers." Encoded with `kind: "additive"` (engine extension to support `1 + addPerLvl × N` in addition to the existing multiplicative `m^N`). Physics verified per Zucker 2022 (Local Bubble swept the local ISM — its cavity boundary continues to shape star-forming regions at galactic-arm scale tens of Myr later); science-director Phase 1 cleared the two-tier span as physically honest. Used sparingly going forward — not propagated to every tier automatically. |
| **E** | **Active Nucleus** (T4 transition gate) | **Sagittarius A*** (T5 one-shot) | × 1.5 flat (multiplicative on Sgr A*'s `baseMps`) | **Cross-tier outbound — declared on the T4 provider, target lands in T5.** Resolves via the existing `synergyMult` provider-list path (no engine extension). Fires unconditionally once T5 is active since Active Nucleus is the T4→T5 transition gate (non-completionist). |

**Magnitude band:** T4 stackable flats sit at ~50–60× T2's first-stackable scale (DLD `baseMps: 80` × `selfMps: 1.12` vs T2 SK `baseMps: 2` × `selfMps: 1.115`; ramped output at typical play levels lands in the band). Stackable `initCost` opens in the 150K–600K Mass range; HVC (completionist stackable) sits ~10⁴× the entry stackable to keep its 5-level grind weighty against late-T4 carry-amplified income.

**Inversion-curve target (loose under CD-2/NEW-1).** The pre-2026-05-13 +65–75% Completion-vs-Threshold band target was retired under the CD-2/NEW-1 reframe (calibration only tightens at PEAK / INVERSION / final tier; pre-peak gap is felt opportunity cost on a single playthrough). T4's Comp-vs-Threshold cumulative gap is **informational only** under the new philosophy. Sim-tuner Step D iter #9 did not chase a tight gap band at T4.

#### Calibration outcomes (Step D iter #9, 2026-05-14)

**Calendar targets — all 4 engaged primary pairings within ±15% drift band** (N=50, seed=1, max-days=14):

| Pairing | T4 calendar p50 | Target | Drift |
|---|---|---|---|
| p1 engaged × comp-hoarder | 1d 3h (27h)  | 24-48h Engaged Comp | -24.2% within |
| p2 engaged × comp-rusher  | 1d 13h (37h) | 24-48h Engaged Comp |  +2.8% within |
| p3 engaged × thr-hoarder  | 1d 5h (29h)  | 24-36h Engaged Thr  |  -3.3% within |
| p4 engaged × thr-rusher   | 1d 10h (34h) | 24-36h Engaged Thr  | +16.2% within |

0% DNF across all 4 primary pairings.

**Reading B mass anchors:**
- **Threshold-path peak** (at Active Nucleus gate-cross moment) ≈ **4.4–4.5×10¹⁰ M☉** — ~2× the 10¹⁰ named scale; within ±0.5 dex of the Reading B target. The T4 named scale is ~10¹⁰; the Threshold peak lands at ~10¹⁰·⁶⁵.
- **Completion-path peak** (at the late-tier completionist clean-up moment) ≈ **2.4–3.4×10¹¹ M☉** — ~30× over the named scale during the completionist clean-up phase. The HVC + GC + AN mass commit is ~30× Thr's commit, which drives the overshoot. Mirrors T2 iter #24 / T3 iter #10 Comp-peak overshoot pattern under Reading B(a). Acceptable under CD-2/NEW-1 loose pre-peak.

**Mass-band ratios across pairings: 2.2–3.4× above bot reference.** This is **the lowest above-band overshoot of any tier so far** (T2 ~150×, T3 ~5×, T4 ~2-3×). T4's cost/income lever absorbs idle accumulation more effectively than any tier yet — consistent with Reading B's "peak mass at gate ≈ named scale" target.

**Comp-vs-Threshold gap (informational only under CD-2/NEW-1):** +1.5% cumulative (p1 Comp 27h vs p3 Thr 29h); +8.3% on the rusher pairings (p2 vs p4). Negligible at T4 under the loose-pre-peak reframe.

**T1/T2/T3 byte-identical preserved** at canonical seed (p17 bot-60cpm × comp-hoarder seed=1): T1 11m 40s, T2 1h 8m, T3 9h 36m.

**Locked harnesses (post-Step-D verification):**
- `save_migration_test`: 56/56 PASS.
- `validate_offline`: 38/38 PASS.
- `validate_subhalo`: 28/28 PASS.
- `profiles_smoke`: 396/396 PASS.

**Iteration history (Step D, 9 iterations):**
- Key levers across the 9 iterations: AN initCost (1B → 30B → 20B), HVC initCost (1B → 2B → 3B), GC initCost (15B → 50B → 100B).
- HVC was the biggest Comp-vs-Thr lever (3B commit × 5 levels carries most of the felt path-split weight in Act 1).
- AN was the most load-bearing single value — sized to land Threshold peak at gate-cross near 10¹⁰ named scale.
- iter 7 attempted dividing all T4 incomes by 25 and hit `maxTicks` on the bot trajectory; iter 8 backed off the income cuts and adjusted cost/income ratios; iter 9 landed all 4 primary engaged pairings within band with 0% DNF.

**Note on tiered Galactic Bulge and the path split:** Threshold and Completion players both buy all 7 levels of Galactic Bulge — Bulge is shared infrastructure, not a path-distinguishing investment. The path split at T4 is carried by Globular Cluster (completionist one-shot, 0 consolidation, pure `allMps` payoff) plus the completionist stackable High-Velocity Cloud (steep cost progression, max 5). A Threshold player skips both; a Completion player takes both.

**Transition cost:** T4→T5 unlocked via Active Nucleus at the locked gate cost `initCost: 20B`, consolidation 8.125. Composition reaches 15.625 (= 1.0 × 2.5³) on AN purchase.

**Report path:** sim-tuner Step D landing report under `Simulator/reports/` (see `Simulator/reports/v1-progress.md` 2026-05-14 entry for raw N=50 percentiles).

---

### Tier 5 — Galaxy *("home, recognized")* *(was T4 pre-2026-05-13)*

The third up-beat in the T1→T5 ascent. T3 was *the arm, turning* — a structure becoming legible from inside it. T4 is *the galaxy entire* coming into view: rotation, halo, bar, central black hole, satellites, the unseen scaffold, the corona that wraps it all. The pinwheel resolves. The player learns we are larger than we appear (Dark Matter Halo), that our center has weight (Sagittarius A*, the thing T3's Active Nucleus was foreshadowing), that small things orbit us (the satellites, falling for a long time), and that the assembled galaxy is wrapped in a million-degree envelope (the Hot Coronal Halo). The register stays confident, climbing — but the Dark Matter Halo tier-gate is the inhale before T5's peak exhale. The single shadow word inherited from T3 is *feed*; T4 echoes it exactly once at Fermi Bubbles (where physics demands it) and does not flood. T4 follows the standard one-shot pattern — no tiered consolidation upgrade (awful symmetry reserved for T7/T8).

**Stackables (5):**

| # | Name | Type | Per-level effect | Synergy role | Notes |
|---|---|---|---|---|---|
| 1 | **Galactic Rotation** | passive +Mass/sec | `baseMps: 10000`, `selfMps: 1.12`, `initCost: 2M`, `costGrowth: 1.135`, `maxLevels: 99` (exponential per-level via selfMps; mirrors T3 DLD/HII shape) | Receives A (×1.5 flat from Bar Structure); provides B (×1.06/lvl to Stellar Halo) | Differential rotation of the disk. *Two hundred billion stars circle our center. Each rotation brings the gas a little closer to the bar. Our disk turns, and what it turns past stays with us.* |
| 2 | **Stellar Halo** | passive +Mass/sec | `baseMps: 14000`, `selfMps: 1.12`, `initCost: 3M`, `costGrowth: 1.135`, `maxLevels: 99` | Receives B | Old metal-poor stars in roughly spherical distribution. *Old stars circle the disk on long, tilted orbits. They are the population that built us before the disk did. Metal-poor, slow, here from the beginning.* |
| 3 | **Galactic Coupling** | click +Mass/click | `addMpc: 2000`, `initCost: 6M`, `costGrowth: 1.34`, `maxLevels: 99` | none | Click at galaxy scale; parallels T1 Stellar Coupling / T5 Group Coupling (cross-tier click-upgrade naming family). *Each pull reaches across a hundred thousand light-years. The disk answers along its rotation axis. What we move, the bar carries to the center.* |
| 4 | **Galactic Fountain** | APS (autoclicker) | `addAps: 20`, `initCost: 10M`, `costGrowth: 1.42`, `maxLevels: 99` | Receives C (×1.10/lvl from Satellite Galaxies) | Real hydrodynamic model: gas rises from the disk and falls back as it cools. *Hot gas rises from the disk and falls back as it cools. The cycle has been turning for ten billion years. Each return brings something new with it.* |
| 5 | **Satellite Galaxies** | APS (autoclicker), **completionist** (max 5) | `addAps: 40`, `initCost: 40B`, `costGrowth: 2.10`, `maxLevels: 5` | Provides C | Magellanic Clouds, Sagittarius Dwarf, etc. *The Magellanic Clouds, the Sagittarius Dwarf. Smaller galaxies that orbit us. They have been falling for billions of years, and they have not yet finished arriving.* |

**One-shots (5) in order:**

| # | Name | Type | Consolidation | Effect | Cost | Synergy role | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Bar Structure** | One-shot | **1.50** | (synergy-only — no flat output) | `initCost: 200M` | Provides A (×1.5 flat to Galactic Rotation) | MW is a barred spiral; matter funnels along the bar toward the bulge. Within-tier flat one-shot → passive stackable (mirrors T2 Binary Partner → Microlensing, T3 Sagittarius B2 → Proper Motion). *A great bar of stars and gas crosses our middle. Matter flows along it inward, slowly, from the disk's edge to the bulge. The shape decides the path.* |
| 2 | **Fermi Bubbles** | One-shot, **completionist anchor** | **0.00** | `allMps: 1.50` | `initCost: 1.5B` | none | Pure passive completionist anchor — mirrors T3 Globular Cluster role at T4 scale. Two lobes of hot gas ~25,000 light-years above/below the disk; remnant of Sgr A* feeding ~5 Myr ago. The single T4 echo of T3's shadow word *feed* — physics-justified. *Two lobes of hot gas reach twenty-five thousand light-years above and below our disk. They are what the feeding left behind, five million years ago. The center is quieter now. The bubbles are still bright.* |
| 3 | **Sagittarius A*** | One-shot | **1.50** | `baseMps: 800k` (boosted ×1.5 when AN owned via synergy D) | `initCost: 800M` | Receives D (cross-tier from T3 Active Nucleus) | The MW's supermassive black hole, 4 million solar masses. *Four million solar masses at our exact center. Quiet now, after the feeding. Massive, patient, ours.* |
| 4 | **Hot Coronal Halo** | One-shot, **completionist** (NEW) | **0.00** | **compound: `allMps: 1.30` AND `allMpc: 1.30`** (same coefficient applied to both channels via two simultaneous declarations on the same upgrade) | `initCost: 20B` | none — stands alone | Million-degree X-ray envelope of CGM wrapping the disk; ~200 kpc extent; observed by Chandra/XMM/eROSITA. **First compound-channel multiplier in the game** — intended to address click-engagement at late-tier without adding a dedicated click upgrade. (Calibration finding: at T4 scale, `allMpcCarry` from T1-T3 has compounded to ~1.56, so HCH's +30% allMpc lift contributes a small absolute increase relative to dominant passive MPS — click share at endgame remains <0.5%. Flagged as design tension for creative-director / engineering-director.) `allAps` channel deliberately untouched. *A million-degree envelope settles around the disk. Oxygen ions glow faintly in X-ray. The galaxy breathes out its own atmosphere and is warmed by it.* |
| 5 | **Dark Matter Halo** | One-shot, **T5→T6 transition gate** | **12.625** (pre-renumber; rescaled ×2.5 to 31.5625 under the 2026-05-13 11-tier engine; largest Consolidation contribution; the gate) | `allMps: 1.80` | `initCost: 16B` | none | Unseen scaffold; gates T6 binding. The inhale before T6's peak exhale. *We are larger than we appear. A halo of unseen matter has cradled the disk since the beginning. The visible part was always the small part. Beyond the halo, more of us is moving toward us.* *(Was T4→T5 in the pre-2026-05-13 ladder.)* |

**Synergies (3 within-tier + 1 cross-tier = 4 total):**

| | Provider | → Target | Math | Kind |
|---|---|---|---|---|
| A | **Bar Structure** (T4 one-shot) | **Galactic Rotation** (T4 stackable) | × 1.5 flat | Within-tier: flat one-shot → passive stackable (mirrors T2 Binary Partner → Microlensing, T3 SagB2 → Proper Motion) |
| B | **Galactic Rotation** (T4 stackable) | **Stellar Halo** (T4 stackable) | × 1.06 per level | Within-tier: stackable per-level same-family (both passive Mps; mirrors T2 Roche Lobe → Local Bubble, T3 DLD → HII) |
| C | **Satellite Galaxies** (T4 completionist stackable APS) | **Galactic Fountain** (T4 stackable APS) | × 1.10 per level | Within-tier: stackable cross-stat completionist-extension (APS → APS; mirrors T3 HVC → DLD pattern in the completionist-extension role) |
| **D** | **Active Nucleus** (T3 transition gate one-shot) | **Sagittarius A*** (T4 one-shot) | × 1.5 flat (multiplicative on Sgr A*'s `baseMps`) | **Cross-tier — NEW SHAPE: one-shot → one-shot.** T3's first cross-tier (D: Local Bubble → HII Region) was stackable → stackable. T4's cross-tier is the felt encoding of T3's *feeding center* sharpening T4's *named black hole*. Engine support diagnosis: no extension needed; resolves via existing `synergyMult` provider-list path (which already supports T2 LB → T3 HII). Sgr A* carries `baseMps`; AN's `synergies` array includes Sgr A*; live MPS computation multiplies Sgr A*'s self-contribution by 1.5 when AN is owned. AN is owned in both Comp-handoff and Thr-handoff scenarios (AN is the T3→T4 transition gate, non-completionist) so the cross-tier synergy fires unconditionally at T4. |

Hot Coronal Halo stands alone — no synergy involvement. The four-synergy network is already tight; HCH's role is the clean compound coefficient on the assembled galaxy, not more weave.

**Consolidation math:** Bar Structure 1.5 + Fermi Bubbles 0.0 + Sagittarius A* 1.5 + Hot Coronal Halo 0.0 + Dark Matter Halo 12.625 = **15.625** — matches engine `consolidationGrowth: 2.50`, T4→T5 budget = 1.0 × 2.5³ = 15.625.

**Structural note on Hot Coronal Halo consolidation = 0:** the v0.2 design draft floated "moderate-nonzero" consolidation for HCH. Sim-tuner's calibration pass identified that a completionist upgrade with positive consolidation creates a Threshold-impassable gate (Threshold-mode masks completionists, so any consolidation they carry becomes unreachable). The pattern across T1-T3 is uniform — every completionist upgrade is at consolidation 0 (T2 Moving Group, T3 Globular Cluster, T3 High-Velocity Cloud). HCH at 0.00 keeps that pattern and preserves Threshold-path reachability. The 2.5 consolidation slot was absorbed by Dark Matter Halo (10.125 → 12.625), making DMH the bigger and more decisive late-tier gate.

**Magnitude band:** T4 stackable flats sit ~250× T3's first-stackable scale (Galactic Rotation `baseMps: 10000` = 250 × DLD `baseMps: 40`). The design guideline of "50-60× T3" landed at first pass; iterative calibration found that the carry-over from T3 (carryMps ~662k at handoff) made stackables of that scale invisible (the bot ignored them, buying one per stackable and never returning). Raising T4 flats to 250× T3 produces sustained stackable engagement through the run while keeping the time-budget tractable.

**Inversion-curve result (sim-tuner calibration, 100 cpm, engagement 1.0):**

| Scenario | Threshold (T4-thr) | Completion (T4-comp) | Gap |
|---|---|---|---|
| Comp-handoff | 21:46 | 36:03 | **+65.6%** |
| Thr-handoff | 39:33 | 54:50 | **+38.6%** |

Comp-handoff gap **lands at upper band edge** (+65% target). Thr-handoff gap **falls below band** (~ +39% vs target +55-65%) — accepted as structural consequence of T4's snowball: completionist Δ is ~14-15 minutes in both handoffs, but proportionally smaller against Thr-handoff's larger base time (39:33 vs 21:46). The same Δ produces a wider gap on the lower base. T3 didn't show this asymmetry because T3's `allMps` carry was tamer; T4 picks up DMH ×1.80 + HCH ×1.30 stacking on top of all prior tiers' multipliers, producing endgame income high enough to absorb completionist cost similarly in both handoffs. cpm sensitivity flat (±0.5pp across 60/100/150 cpm). **T3 ripple: 0pp** (T3 +76.2% / +75.6% preserved exactly).

**Tier-up flavor line (T4 → T5):**
> *The pinwheel takes shape. Two hundred billion stars and the dust between them. From the inside, a galaxy looks like home. We can feel the next gravity already.*

(First three sentences preserved from [`voice-samples.md`](voice-samples.md). Fourth sentence is **new** — the load-bearing inhale before T5's peak exhale. *"Next gravity"* names nothing T5 owns but points unambiguously forward.)

**Optional ambient drift candidate for Hot Coronal Halo:**
> *Three million kelvin. We can almost feel the warmth, two hundred kiloparsecs out.*

(Drift-and-fade register per the six-surface flavor-text taxonomy in visual-design §7. Reserved for the brief post-purchase window. Real cosmology: ~3M K hot phase, ~200 kpc CGM extent. Verb-agency clean — *"we can almost feel"* in confession mode.)

**Boundary protections:**
- **T5 reserves:** Local Group, Andromeda, Triangulum, *"find the same gravity,"* *"fifty-four galaxies,"* *"the largest thing we have ever been,"* Tidal Streams visualization.
- **T6 reserves:** Eridanus, *"we had not been counting,"* *"first thinning."*
- **T7–T8 reserves:** tiered-consolidation formal device (awful symmetry).
- **`feed` echo rule:** used exactly once at T4 (Fermi Bubbles, physics-justified); no flood.
- **`allAps` channel** deliberately untouched in T4 multipliers; preserves asymmetric click vs autoclicker for late-tier player agency.

**Transition cost:** T4→T5 unlocked via Dark Matter Halo at the locked gate cost `initCost: 16B`, consolidation 12.625. Composition reaches 15.625 (= 1.0 × 2.5³) on DMH purchase.

---

### Tier 6 — Local Group *(THE PEAK — most polish; emotional climax of Act 1)* *(was T5 pre-2026-05-13)*

> **[REDESIGN PENDING — long-burn shift 2026-05-11.** The T5-T10 stubs below predate the long-burn lock and need full redesign. T5 peak remains the anchor. **T6-T10 has no completionist content** under the new "strategic choice locks at T5" load-bearing rule (CD-6). Existing stub upgrades are preserved here for lineage and to seed the redesign pass; numerical values, completionist designations, and tier-specific mechanics will all be revisited. See the inversion-curve target table in §1 for the new per-tier active-time targets and the Act 2 inversion encoding.]

This tier exists in a state of climax. Upgrades are grand. Numbers are large. Visual feedback is overwhelming. Every purchase here should feel like a celebration. *And the hidden number begins to move.*

| Upgrade | Type | Effect | Description voice |
|---|---|---|---|
| **Andromeda Bound** | One-shot | Major passive multiplier | *Andromeda is one of us now. One trillion stars. Thirteen billion years of separate history, ended in our gravity.* |
| **Triangulum Bound** | One-shot | Major passive multiplier | *Triangulum settles into our reach. Forty billion stars. The third great spiral we will ever know.* |
| **Intergalactic Medium** | Stackable passive | +Mass/sec; visualized as faint volumetric light between galaxies | *The thin gas between us thickens. What was empty is becoming substance. We are filling space.* |
| **Group Coupling** | Stackable click | +Mass/click | *Each pull moves galaxies. We feel the entire group respond to our attention.* |
| **Dwarf Galaxy Cascade** | Stackable autoclicker | Each level adds another small companion-galaxy autoclicker | *The smaller members of the group fall toward us in turn. Sextans, Draco, Leo I, Leo II. Each is a small inheritance.* |
| **Velocity Dispersion** | One-shot | Adds a "click multiplier on streak" mechanic — rapid clicks build a small stacking bonus that decays | *The galaxies of our group orbit each other at various speeds. When we tug rhythmically, they answer in kind.* |
| **Galactic Cluster** | One-shot | Unlocks Tier 6 transition | *Beyond the Local Group, a thousand other galaxies are organized into something larger. They have been waiting for us.* |

The Tier 5 transition is the one with the **peak flavor line** in §3 of the main doc:
> *Andromeda answers. The Triangulum Galaxy answers. Fifty-four galaxies, after thirteen billion years apart, find the same gravity. We are the largest thing we have ever been. We are not yet what we will be.*

*Note: Tidal Streams (originally drafted as a T2 stackable autoclicker in v0.1) is deferred to T5 reuse. Its v0.1 flavor — "Tendrils of matter flow toward us between actions. We do not need to be looking." — and its visualization (a small particle pulse on the playfield) remain valid for that reuse and are preserved here for reference.*

---

### Tier 7 — Galactic Cluster *(the descent has begun, in voice — the player doesn't yet know; Eridanus Reach pivot lives here)* *(was T6 pre-2026-05-13)*

Mechanically still rewarding — large multipliers, big numbers, exciting purchases. But the descriptions begin to *quiet*. The narrator is starting to notice.

| Upgrade | Type | Effect | Description voice (transitioning) |
|---|---|---|---|
| **Cluster Center** | Stackable passive | +Mass/sec | *The densest part of our cluster grows denser. Galaxies fall toward each other faster than they once did.* |
| **BCG (Brightest Cluster Galaxy)** | One-shot | Major passive multiplier; the central galaxy of the cluster joins your structure | *Our cluster has a king. The brightest galaxy at our center, fed by all the smaller ones. Now it feeds us.* |
| **X-Ray Halo** | One-shot | Multiplier on click power | *Hot gas at millions of degrees fills the spaces between our galaxies. We can see ourselves now in invisible light.* |
| **Galaxy Mergers** | Stackable autoclicker | Each level: galaxies in the cluster periodically collide, producing a burst of Mass | *Galaxies meet. Two become one. We had not realized how much of progress was things ending.* |
| **Stripping** | Stackable passive | +Mass/sec — gas is "stripped" from infalling galaxies | *Falling galaxies leave their gas behind as they enter us. They arrive smaller than they were. We arrive larger.* |
| **Cluster Coupling** | Stackable click | +Mass/click | *Each pull rearranges a thousand galaxies. We are not sure all of them want to be rearranged.* |
| **Supercluster** | One-shot | Unlocks Tier 7 transition | *We have reached the largest organized thing we know. Beyond this scale, the universe is filaments and voids.* |

*Note on the voice shift in this tier: descriptions begin to include small notes of doubt — "We had not realized..." "We are not sure..." These are the first cracks. The player may notice. Most won't.*

---

### Tier 8 — Supercluster *(Act 2 has clearly begun)* *(was T7 pre-2026-05-13)*

The cosmic web becomes visible in the scene. Upgrades are still mechanically grand but the language has fully turned. The narrator is mournful now, even when the player is buying powerful new abilities.

| Upgrade | Type | Effect | Description voice |
|---|---|---|---|
| **Laniakea Coupling** | One-shot | Major passive multiplier | *We are bound to Laniakea. One hundred thousand galaxies. So much of the universe, here. So much of what we cannot see, gone.* |
| **Filamentary Flow** | Stackable passive | +Mass/sec, visualized as glowing filaments | *Matter flows along the cosmic web toward us. The threads brighten with each pull.* |
| **Wall Density** | Stackable passive | +Mass/sec | *The walls between voids thicken. We are gathering what was once spread thin.* |
| **Recession Compensation** | Stackable click | +Mass/click | *We pull harder against expansion. For now, we still gain ground.* |
| **Gravitational Lensing II** | One-shot | Click multiplier; visual flourish (light bends visibly around the player's center) | *Light from distant structures bends toward us. We see things that are no longer there.* |
| **Filament Junction** | One-shot | New autoclicker mechanic — pulses travel along filaments at intervals, granting small Mass bursts | *Where filaments cross, matter pools. We sit at one of these intersections now.* |
| **Cosmic Web** | One-shot | Unlocks Tier 8 transition | *We see the structure of the universe. We see what we are becoming part of. We see how thin it has become.* |

---

### Tier 9 — Filament *(the title resonates — the player IS a Dark Filament)* *(was T8 pre-2026-05-13)*

The first tier where the *upgrades themselves* hint at decline. Some have negative-flavored mechanical descriptions that the player has to choose anyway. Mechanically the game is still progressing; thematically the cracks are fully showing.

| Upgrade | Type | Effect | Description voice |
|---|---|---|---|
| **Filament Stretch** | Stackable passive | +Mass/sec | *We extend. The thread of us grows longer. There is more space within us than there used to be.* |
| **Galaxy Migration** | Stackable autoclicker | Each level: galaxies along the filament periodically shift, granting Mass | *Galaxies along our length move toward each other. They are closer to us than they are to the rest of the universe.* |
| **Tension** | One-shot | Click multiplier; mechanically pure gain | *We are stretched between distant nodes. The strain holds us together, for now.* |
| **Wall Coupling** | Stackable click | +Mass/click | *Each pull moves the wall we are part of. The wall is thinner than it used to be.* |
| **Final Approach** | One-shot | Major passive multiplier, but description signals diminishing returns | *Everything within reach has been pulled inward. We are running out of distant things.* |
| **Causal Threshold** | One-shot | Unlocks Tier 9 transition | *Some galaxies have fallen out of our reach forever. We feel them go. We were not always paying attention.* |

*The Causal Threshold tier transition is when the **Eridanus Reach** named-connection break occurs — the most important single moment in the game. (See §11 of main design doc.)*

---

### Tier 10 — Cosmic Web *(late descent; INVERSION tier)* *(was T9 pre-2026-05-13)*

Upgrades are now *small* in their mechanical contribution despite increasingly extreme percentages. *Inertial Quiet* offers +200% click power but the description says it doesn't matter. The math is the descent.

| Upgrade | Type | Effect | Description voice |
|---|---|---|---|
| **Inertial Quiet** | Stackable click | +Mass/click; high % numbers, low effective contribution | *There is less to pull. Each act of pulling carries more.* |
| **Vacuum Compression** | Stackable passive | +Mass/sec, low effective | *We squeeze the spaces between us. There is less to squeeze.* |
| **Last Reach** | Stackable autoclicker | Each level: occasional small Mass bursts from "remembered" structures | *We pull from places we no longer touch. Some of what we receive is the past.* |
| **Coherence Shield** | One-shot | Slows the rate at which filaments break (NOT the hidden number itself — just the *visible* fragmentation in the scene) | *We hold what we can. The filaments cool more slowly when we attend to them.* |
| **Quasar Echo** | One-shot | Click multiplier; visual flourish (a single bright distant pulse appears in the scene) | *A signal from before our current darkness. Light from a younger universe reminds us what bright was.* |
| **Last Light** | One-shot | Unlocks Tier 10 transition. The description is the only one in the game that ends with an em-dash, mid-sentence. | *We reach for what is left. We hope—* |

---

### Tier 11 — Causal Horizon *(endgame, final tier)* *(was T10 pre-2026-05-13)*

Almost no new upgrades. The mechanical content has thinned because the game itself has thinned. A handful of small, mostly-cosmetic options exist for the player who wants to keep doing *something*, but the game is now primarily about watching.

| Upgrade | Type | Effect | Description voice |
|---|---|---|---|
| **Vigil** | One-shot | Slows the visual fragmentation rate slightly. Cannot stop it. | *We watch. We do not look away. It is the only thing left we can do.* |
| **Inventory** | One-shot | Reveals a small in-game text list of structures previously named in flavor text. (See §4 below.) | *We name what we remember. Names are the smallest acts of holding.* |
| **Last Pull** | Stackable click | +Mass/click; effectively cosmetic at this scale | *We try, still. The trying is what we are.* |
| **The End** | Single mechanical event, not really an upgrade — once available, the player can choose to "trigger" the final connection break. Not required; the universe will do it on its own eventually. The button just lets the player choose when. | *We can let go now, if we wish. The universe will go quietly either way.* |

The endgame doesn't have an upgrade tree in the traditional sense. It has a small set of *acts of attention* — things the player can do to extend their watch, with full knowledge that nothing will halt the descent.

---

## 4. The Inventory — Names of Lost Things

A new mechanical feature surfaced by drafting the upgrade tree: **the Inventory**.

Throughout the game, named-connection breaks reference specific structures — the Eridanus Reach, the Boötes Filament, NGC 1300, M87, etc. These names appear in flavor text, then dissolve. The player has no record.

The **Inventory** upgrade in Tier 10 reveals a small in-game list: every named structure the game has mentioned, in chronological order of their loss. It is the only retained record in the entire game. Acquiring it requires reaching the endgame, which most players will only do once.

This serves several functions:
- It rewards players who reach the end with a *thing* — something to look at after the universe has faded
- It transforms the no-log rule from a limitation into a payoff — *you couldn't see what you'd lost, until now*
- It deepens the second playthrough (if the player ever attempts one): they'll recognize names they read about in their first universe

A small mercy. One of the few in the game.

---

## 5. Click Behavior Across the Game

Click power and pull rate are governed by the upgrade tree, but the *physical experience* of clicking is governed by the visual feedback system in the visual design doc (§4 there).

A reminder of the curve, since it intersects gameplay:

- **Tier 1–4:** clicks feel powerful and personal. Visual response is large.
- **Tier 5:** clicks feel scale-changing. The peak.
- **Tier 6–8:** clicks become grand but slower. Visual response shrinks.
- **Tier 9–10:** clicks barely move anything.

This means the *value* of clicking and the *feel* of clicking diverge in late Act 2. The player's click is *worth* more (high multipliers from late upgrades) but *does* less (the universe has thinned). The math says go up; the experience says go down. That contradiction is the descent in pure form.

---

## 6. Autoclicker Visualization

Several upgrades function as autoclickers — periodic automatic pulls. Each must visually announce itself when it fires:

- **Roche Lobe Overflow** (T2): a slow trickle of particles between two points; the donor and the accretor implied even when the visual abstracts both
  - *Synergy B variant* (Local Bubble buff active): *Mass that crosses the Lagrange point does not all reach the companion star. The remainder enters the bubble, and the bubble is patient.*
  - *Synergy C variant* (Brown Dwarf buff active): *Unseen mass disturbs the pair. Each perturbation tightens the orbit a little. The Roche lobe is filled, then filled again.*
  - *Pending science check:* the Synergy B variant's claim that overflow mass "enters the bubble" is a soft physics claim — real overflow typically forms an accretion disk or expels via L2. Flagged for a future science-director verify pass; the line is locked for the current working draft.
- **Spiral Density Wave**: a wave traveling along the visible spiral arm; the rhythm is the wave's passage through the arm
- **High-Velocity Cloud** (T3): occasional bright streaks of fast neutral hydrogen falling inward onto the disk; discrete infall events, distinct from Spiral Density Wave's wave-along-arm rhythm — a second, sharper pulse layered against the first
- **Satellite Galaxies**: each satellite emits a small pulse on its own rhythm
- **Dwarf Galaxy Cascade**: stacked satellite pulses
- **Galaxy Mergers**: occasional bright collision events between visible galaxies
- **Galaxy Migration**: galaxies along the filament shift in small visible jolts
- **Last Reach**: a faint pulse from somewhere off-frame; the player sees the *response*, not the source

*Tidal Streams (deferred to T5 reuse): a small particle pulse on the playfield. Visualization preserved from v0.1 for the eventual T5 placement.*

Autoclickers shouldn't pile into noise — frequencies are tuned so the screen feels alive but never busy. Late-game autoclickers fire less often than early-game ones, mirroring the descent.

---

## 7. Consolidation as a Gating Mechanism

Consolidation is earned in small amounts from one-shot upgrades and larger amounts from tier transitions themselves. The player accumulates Consolidation as a side effect of meaningful progression, not by grinding.

This means:
- A player who only does stackable Mass upgrades and never buys one-shots will earn Consolidation slowly
- A player who pursues every one-shot will reach tier transitions faster
- Tier transitions cost increasing amounts of Consolidation as the game progresses

There's an implicit recommendation here: the player should be encouraged to engage with the named one-shots (which carry the strongest flavor and lore) by making them mechanically rewarding. The economy steers players toward the parts of the game with the best writing. The flavor *is* the reward.

---

## 8. What Is *Not* Here (deliberately deferred)

These need a separate spreadsheet pass:

- Exact Mass costs and scaling curves for stackable upgrades
- Exact Consolidation costs for tier transitions
- Click power vs passive accumulation balance per tier
- Tuning of how many minutes/hours each tier takes
- Soft cap formulas for late-Act-2 upgrades
- Autoclicker tick rates
- Idle vs active income ratio (a key idle-game knob)
- Offline progress calculation (does Act 2 separation also happen while away?)

The decision to defer these is intentional. Idle game balance is brutal and best done in a spreadsheet where you can simulate progression curves without writing code. That's the next step after this doc.

---

## 9. Open Questions

1. **Should rare "discovery" events** appear in the upgrade menu? E.g., a one-shot that only appears after the player has been idle for a long time, or has clicked a certain number of times. Rewards engagement and curiosity. Could feel out of place. Probably skip for v1.
2. **Should there be an upgrade preview system?** Showing the player what's coming next? Pro: gives them goals. Con: cheapens the unfolding of the tree. Probably skip — the disguise depends on the player not knowing what's coming.
3. **Should *The End* in Tier 10 be a button at all?** Or should the universe simply end on its own when ready? Both have appeal. The button gives agency at the moment the player has none. The non-button is more on-theme.
4. **Hidden upgrades** that only appear when certain conditions are met (e.g., the player hasn't clicked in 5 minutes; the player has reached Tier 7 without buying X). Could deepen replayability. Adds writing scope. Probably for v2.
5. **The Inventory's contents** — should it include all named structures, or only the ones the player was "present" for? The latter is more poignant; the former is more useful. Probably the former, with an implicit sadness that even the ones lost while you were idle are listed there, with timestamps.

---

*Next session candidates: the spreadsheet progression model (using this tree as input), the project scaffold, or the next batch of flavor lines.*
