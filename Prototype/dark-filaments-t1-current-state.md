# Dark Filaments — T1 Prototype Current State

**Source of truth for `dark-filaments-t1.html`.** Edit values here and Claude will sync the code; or change the code and update this doc to match. Mirrors the column structure of `dark-filaments-simulation-v1.1.2.xlsx` for cross-checking with the simulator.

> Whenever this doc and the code disagree, **flag it explicitly** before assuming which is canonical.

> **11-tier ladder engine renumber LANDED 2026-05-13 (afternoon) + T3 Dwarf Spheroidal numerical calibration LANDED 2026-05-13 (evening, Step D).** Design corpus + engine now align on the 11-tier ladder: T1 Solar System → T2 Stellar Neighborhood → **T3 Dwarf Spheroidal** (NEW) → T4 Galactic Arm (was T3) → T5 Galaxy (was T4) → T6 Local Group (PEAK; was T5) → T7 Galactic Cluster (was T6; Eridanus Reach pivot) → T8 Supercluster → T9 Filament → T10 Cosmic Web (INVERSION) → T11 Causal Horizon (final). T1 / T2 numerical values byte-identical across the renumber (preserved through the engine reshape); T3 Dwarf Spheroidal numerical values locked Step D iter #10 (see §1 Tier 3 below); T4 / T5 numerical values remain PHASE-2-CONSOLIDATION-RESCALE interim scaffolding under the renumber and queue for T4 / T5 retune workstreams. SAVE_VERSION lineage: v1 → v2 (M☉ retune) → v3 (11-tier renumber) → v4 (engine-wide `cohesion` → `consolidation` rename, ~470 identifier renames across 24 files, 2026-05-13).

---

## 1. Upgrade parameters

> **2026-05-13 ladder renumber + T3 Step D landed.** The engine now implements the 11-tier ladder (T3 Dwarf Spheroidal inserted between T2 Stellar Neighborhood and the renumbered T4 Galactic Arm). The T3 Dwarf Spheroidal sub-section below carries its locked Step D iter #10 numerical values. The T4 (was T3) / T5 (was T4) sub-sections below describe the **pre-renumber** slates with the original consolidation values; under the renumber, consolidation values are rescaled × 2.5 per renumber step in `data.js` (T4 budget 6.25 → 15.625; T5 budget 15.625 → 39.0625) so the engine formula `1.0 × consolidationGrowth^(n-1)` with `consolidationGrowth = 2.5` continues to drive the gates. Mass costs and income values on the renumbered T4 / T5 slates are PHASE-2-CONSOLIDATION-RESCALE interim and queue for T4 / T5 retune workstreams (under Reading B + the 1-2d Engaged Comp / 3-4d Engaged Comp calendar targets respectively).

Values shown to 3 decimals to match the simulation spreadsheet. AC/sec fields (autoclicker income) are present in the schema; T1 entries have `0 / 0 / 1.000` for them (no autoclicker upgrades at T1) and those columns are omitted from the T1 table for readability. T2 introduces the first AC/sec channel (Roche Lobe Overflow `addAps: 0.090`); T3 adds two more APS channels (Spiral Density Wave, High-Velocity Cloud). T2 + T3 sub-tables include the AC/sec column where it carries data.

### Tier 1 (M☉-denominated; 2026-05-12 retune locked — Reading B anchor)

**Long-burn retune 2026-05-12.** All numerical fields rescaled to land on the M☉ scale (~1 M☉ peak counter reading during structural tier completion — the Reading B anchor). Structure, synergies, max-levels, consolidation distribution, and completionist flags all preserved from the pre-retune slate. Iteration 2 (current) corrects iteration 1's click-share over-shoot via `baseMpc` 0.02 → 0.00120, passive stackable lifts (SW/AB) ~2×, Magnetosphere `costGrowth` 2.00 → 2.10, FP cost ratio adjustment, and SC `addMpc` × 2 to keep clicking meaningful at the lowered floor.

| # | Name | Init cost | Cost growth | Max lvl | Consolidation+ | M/sec Base | M/sec +/lvl | M/sec ×self | M/click Base | M/click +/lvl | M/click ×self | × all M/sec | × all M/click | Completionist |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Solar Wind         | 0.012 | 1.20 | 99 | 0.00 | 0.00000 | **0.00013** | 1.000 | 0.000 | 0.000   | 1.000 | 1.000 | 1.000 | No |
| 2 | Asteroid Belt      | 0.033 | 1.20 | 99 | 0.00 | 0.00000 | **0.00033** | 1.000 | 0.000 | 0.000   | 1.000 | 1.000 | 1.000 | No |
| 3 | Stellar Coupling   | 0.037 | 1.40 | 99 | 0.00 | 0.00000 | 0.000       | 1.000 | 0.000 | **0.00058** | 1.000 | 1.000 | 1.000 | No |
| 4 | Magnetosphere      | 0.13  | 1.65 |  5 | 0.00 | 0.00000 | **0.00167** | 1.000 | 0.000 | 0.000   | 1.000 | 1.000 | 1.000 | **Yes** |
| 5 | Orbital Resonance  | 0.40  | 1.00 |  1 | 0.40 | 0.00000 | 0.000       | 1.000 | 0.000 | 0.000   | 1.000 | **1.250** | 1.000 | No |
| 6 | Heliopause         | 0.96  | 1.00 |  1 | 0.60 | 0.00000 | 0.000       | 1.000 | 0.000 | 0.000   | 1.000 | 1.000 | 1.000 | No |
| 7 | First Photons      | 1.00  | 1.00 |  1 | 0.00 | **0.00167** | 0.000   | 1.000 | 0.000 | 0.000   | 1.000 | 1.000 | **1.200** | **Yes** |

**Display order in UI:** top-to-bottom as listed above.

**Consolidation math:** Only Orbital Resonance (+0.4) and Heliopause (+0.6) contribute. Sum = 1.0, which is the threshold to unlock End Tier 1.

**Floor click value at 100 cpm:** `baseMpc × cpm / 60` ≈ 0.00120 × 100/60 ≈ 0.002 M☉/s ≈ 0.12 M☉/min from a bare floor — pre-retune was ~2.0 M☉/min, now click value is meaningfully coupled to upgrade purchases.

**Calibration (bot-100cpm × Completion, T1):** active duration 7m 45s (target 8-15 min band); peak in-tier mass **0.9791 M☉** (Reading B target ~1.0 M☉ — lands dead-on); click share 49.4% (target 50-60 band, 1pp under); final levels SW=10 AB=9 SC=7 Mag=5 (maxed) + OR/HP/FP. Engaged-steady p1 T1 calendar p50: 5h 9m (slightly over the 2-4h band; accepted — active time + click share + peak mass are the load-bearing T1 metrics).

### Tier 2 (long-burn M☉ retune 2026-05-13; structural fields preserved)

> **Retune note (2026-05-13).** T2 numerical values rescaled by ÷135 from pre-retune v5-M baseline to align with the locked M☉ scale + Reading B anchor (peak in-tier mass ≈ 1000 M☉ at bot Comp). Two non-uniform tunings on top of the ÷135 baseline: (1) **Open Cluster initCost bumped 46 → 950** to enforce the patient-universe rule (hyper-onboard 60-min single sessions cannot complete T2). (2) **Microlensing addMpc bumped 0.0178 → 0.060** to lift T2 bot-Comp click share from ~3.4% toward the brief's ~30% aspiration (landed at 13.6% — best achievable while preserving patient-universe). Structural fields (costGrowth, selfMps, allMps/Mpc/Aps, consolidation, maxLevels, synergies, completionist flags) UNCHANGED. The +80-100% Comp-vs-Threshold gap target from the pre-retune era is STALE under the long-burn pacing model; iter #13 lands at +4.8%. See `data.js` T2 comment for the full 13-iteration history.

| # | Name | Init cost | Cost growth | Max lvl | Consolidation+ | M/sec Base | M/sec +/lvl | M/sec ×self | M/click Base | M/click +/lvl | AC/sec +/lvl | × all M/sec | × all M/click | Completionist |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Stellar Kinematics  | **0.67**  | 1.135 | 99 | 0.00 | **0.0148** |  0.000   | **1.115** | 0.000 |  0.000   | 0.000     | 1.000 | 1.000 | No |
| 2 | Local Bubble        | **2.0**   | 1.135 | 99 | 0.00 |  0.000     | **0.0111** | 1.000 | 0.000 |  0.000   | 0.000     | 1.000 | 1.000 | No |
| 3 | Microlensing        | **2.3**   | 1.34  | 99 | 0.00 |  0.000     |  0.000   | 1.000 | 0.000 | **0.060** | 0.000     | 1.000 | 1.000 | No |
| 4 | Roche Lobe Overflow | **4.0**   | 1.42  | 99 | 0.00 |  0.000     |  0.000   | 1.000 | 0.000 |  0.000   | **0.000667** | 1.000 | 1.000 | No |
| 5 | Brown Dwarf         | **37**    | 2.28  |  5 | 0.00 |  0.000     | **0.0741** | 1.000 | 0.000 |  0.000   | 0.000     | 1.000 | 1.000 | **Yes** |
| 6 | Binary Partner      | **16**    | 1.00  |  1 | 0.60 |  0.000     |  0.000   | 1.000 | 0.000 |  0.000   | 0.000     | 1.000 | 1.000 | No |
| 7 | Peculiar Velocity   | **28**    | 1.00  |  1 | 0.90 |  0.000     |  0.000   | 1.000 | 0.000 |  0.000   | 0.000     | **1.400** | 1.000 | No |
| 8 | **Open Cluster**    | **950**   | 1.00  |  1 | 1.00 |  0.000     |  0.000   | 1.000 | 0.000 |  0.000   | 0.000     | 1.000 | 1.000 | No |
| 9 | Moving Group        | **1000**  | 1.00  |  1 | 0.00 | **0.358**  |  0.000   | 1.000 | 0.000 |  0.000   | 0.000     | 1.000 | **1.300** | **Yes** |
| 10 | **Wolf-Rayet Star** | **1750**  | **1.00**  | **3** | 0.00 |  0.000     |  0.000   | 1.000 | 0.000 | **0.025** | 0.000     | 1.000 | 1.000 | **Yes** |

Roche Lobe Overflow's `addAps` is `0.000667` (T2's only autoclicker — output value scaled to match the ÷135 mass-scale rescale). Brown Dwarf's `addMps` `0.0741` plus selfMps=1.0 makes its 5-level grind weighty in M☉ terms: BD-L5 cost ≈ 1000 M☉ = the Reading B structural-completion peak anchor (Threshold path; the Comp path now climbs higher into the completionist clean-up phase — see iter #23 block below).

**Wolf-Rayet Star — completionist stackable, max-3 (iter #23 → iter #24, 2026-05-13).** Third T2 completionist. Buy-order slot: 10th, after Moving Group. Channel: `addMpc: 0.025` (click-lift; chosen over passive to avoid redundancy with MG's allMps+allMpc compound). Standalone — no synergies (does not add a fourth T2 synergy). Cost growth flat (1.00) — most peak-efficient shape per Comp-peak. **Iter #24 (PM 2026-05-13)**: initCost reduced 4500 → 1750 under the CD-2/NEW-1 reframe (pre-peak Comp-vs-Threshold gap is informational under the new philosophy, not load-bearing). The reduction lands Comp peak at ~1748 M☉ (~1.84× the Pleiades-class named scale) — within reasonable distance of the named scale while keeping Comp visibly distinct from Threshold's ~950 M☉ peak. Each L1/L2/L3 buy is a discrete ~1750 M☉ save under the long-save bypass, with light LB/RLO interleaves harvested between saves.

**Moving Group's 1000 M☉ cost is the Comp-vs-Thr gap lever (iter #14, 2026-05-13).** Pre-iter-14 MG=333 was bought as a ride-along during the OC-save mass climb, contributing minimally to Completion-vs-Threshold time delta. Post-iter-14 MG=1000 forces a discrete post-consolidation save block of ~69 seconds at bot-100cpm, raising the gap from +4.8% → +5.8%. MG's `baseMps` was lifted proportionally (0.119 → 0.358) to preserve the mass:income ratio — the larger cost is matched by a larger late-T2 passive income boost when MG is purchased. See structural-tension note below for why the gap can't grow further without redesign.

**Open Cluster's 950 M☉ cost is load-bearing.** Pre-retune OC was 46 (rough 1% of T2 total throughput). Post-retune OC=950 is now the dominant gate save — the player must accumulate ~950 M☉ before they can transition out of T2. This save is too long for a single 60-min hyper-onboard session at engagement 0.25 + 60 cpm to clear, mechanically enforcing the "the universe is patient" load-bearing rule at T2's structural footprint.

**Consolidation math:** Binary Partner (+0.6) + Peculiar Velocity (+0.9) + Open Cluster (+1.0) = 2.5 — matches engine `consolidationThreshold × consolidationGrowth^1`.

**Verification metrics (bot-100cpm × Completion, T1 handoff matched, iter #24):**
| Metric | Value | Target |
|---|---|---|
| Active duration | 50m 50s | (informational; was 60m 57s at iter #23 WR=4500) |
| Peak in-tier mass (Comp) | **1748 M☉** | 1500-2000 M☉ band — ~1.84× Pleiades-class named scale ✓ in band |
| Peak in-tier mass (Thr) | 949 M☉ | ~1000 M☉ Reading B — structural-completion anchor preserved on Threshold path |
| Click share | 9.8% | informational (lift from iter #23's 8.4% — shorter WR save phase reduces passive-income runaway) |
| Levels at exit (Comp) | SK=58, LB=21, ML=16, RLO=6, BD=5, **WR=3**, all 4 one-shots + MG | (lower LB/RLO interleaves than iter #23 because the cheaper WR saves leave less time for interleave harvest) |
| Comp-vs-Thr gap | **+5.1%** (Comp 50m 50s / Thr 48m 21s) | informational under the CD-2/NEW-1 reframe (no narrow band) |

**Calendar-time verification (engaged trajectory, iter #24; N=5 / seed=1, max-days=30):**
| Pairing | p50 | Target |
|---|---|---|
| p1 (engaged × comp-hoarder) | **4h 41m** | 2-8h Engaged Comp ✓ in band |
| p3 (engaged × thr-hoarder) | **4h 41m** | 1.5-6h Engaged Thr ✓ in band |
| p4 (engaged × thr-rusher) | **4h 41m** | ✓ in band |
| p15 (hyper-onboard × comp-hoarder) | DNF 10/10 | **MUST DNF** ✓ (load-bearing patient-universe rule) |

**Iter #24 (T2 follow-up tune-down) — WR initCost reduced 4500 → 1750 under the CD-2/NEW-1 reframe.** The design philosophy locked 2026-05-13 (see `feedback_strategic-completion-lens.md`): pre-peak Comp-vs-Threshold gap target is **loose** (sim-tuner picks pleasing numbers; the per-tier gap is *felt opportunity cost on a single playthrough*, not *measured asymmetry across compared playthroughs*). Tight calibration is reserved for PEAK tier (~parity), INVERSION tier (Comp materially faster), and final tier endings. The +42.5% Comp-vs-Thr gap at iter #23 is no longer load-bearing; the cost inflation that produced Comp peak at 4494 M☉ (4.5× named scale) is retired.

Iter #24 sweep at bot-100cpm (flat costGrowth=1.00, addMpc=0.025; T1 handoff matched to T2 mode):

| WR initCost | Comp peak | Comp-vs-Thr gap | Note |
|---|---|---|---|
| 4500 (iter #23) | 4494 | +26.1% | over named scale; retired |
| 2500 | 2499 | +10.1% | above ~2× named scale guideline |
| 2000 | 1999 |  +6.8% | top edge of target band |
| **1750 (iter #24 LOCK)** | **1748** |  **+5.1%** | mid-band; ~1.84× named scale |
| 1500 | 1498 |  +3.5% | bottom of target band |

**Reading B interpretation — preserved under iter #24, more comfortably than at iter #23:**
- **Structural-completion peak (Threshold path, OC purchase) ≈ 949 M☉** → Reading B preserved.
- **Post-structural-completion peak (Completion path, WR clean-up) ≈ 1748 M☉** → ~1.84× the named scale during completionist clean-up. The "you gathered every scrap" identity stays felt without straying as far from the named scale as iter #23's 4.5× did. Honors Reading B(a) more comfortably.

### Tier 3 — Dwarf Spheroidal (Step D iter #10 locked 2026-05-13 evening)

NEW tier inserted 2026-05-13 afternoon under the 11-tier ladder reshape; numerical values landed by sim-tuner Step D iter #10. Calendar target: 24-48h Engaged Comp / 18-36h Engaged Thr. Reading B mass anchor: Threshold peak at Sagittarius Stream gate-cross ≈ 2.5M M☉ (-21% from 3.16M target, within ±0.5 dex). Comp peak at Draco purchase ≈ 8M M☉ (+2.5× over named scale, mirrors T2 iter #24 Comp-overshoot under Reading B(a)). All four engaged primary pairings within ±15% drift band: p1 -12.1%, p2 -7.1%, p3 +8.5%, p4 +14.7%.

| # | Name | Init cost | Cost growth | Max lvl | Consolidation+ | M/sec Base | M/sec ×self | M/click +/lvl | AC/sec +/lvl | carryMpsMult | × all M/sec | Completionist |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Population II      |    25,000 | 1.135 | 99 | 0.00 | **8.000** | **1.120** | 0.000 | 0.000 | 1.000 | 1.000 | No |
| 2 | **Subhalo**        |    40,000 | 1.16  | 99 | 0.00 | 0.000 | 1.000 | 0.000 | 0.000 | **1.080** | 1.000 | No |
| 3 | RR Lyrae           |    60,000 | 1.34  | 99 | 0.00 | 0.000 | 1.000 | **12.000** | 0.000 | 1.000 | 1.000 | No |
| 4 | Velocity Dispersion |   400,000 | 2.05  |  5 | 0.00 | 0.000 | 1.000 | 0.000 | **0.200** | 1.000 | 1.000 | **Yes** |
| 5 | Orphan Stream      |   100,000 | 1.00  |  1 | **0.90** | 0.000 | 1.000 | 0.000 | 0.000 | 1.000 | 1.000 | No |
| 6 | Sculptor Dwarf     |   400,000 | 1.00  |  1 | **1.50** | 0.000 | 1.000 | 0.000 | 0.000 | 1.000 | 1.000 | No |
| 7 | Draco Dwarf        | 8,000,000 | 1.00  |  1 | 0.00 | 0.000 | 1.000 | 0.000 | 0.000 | 1.000 | **1.420** | **Yes** |
| 8 | Sagittarius Stream | 2,500,000 | 1.00  |  1 | **3.85** | 0.000 | 1.000 | 0.000 | 0.000 | 1.000 | 1.000 | No |

**Subhalo is the first hidden-channel upgrade in the game.** `carryMpsMult: 1.08` (α=1.08 user-ratified, Visible band lower edge per creative-director recommendation) multiplies prior-tier MPS carry only via the dedicated `carryMpsMult` engine field added in Step C (2026-05-13). Subhalo contributes 0 to its own MPS/MPC/APS row — the mass counter rises faster than the visible stats line predicts, which is the design's hidden-channel UX signal. Synergies B (Population II → Subhalo, additive `1 + 0.03 × N`) and C (T2 Brown Dwarf → Subhalo, additive `1 + 0.03 × BD_level`, cross-tier) compound the per-level coefficient BEFORE exponentiation: `α_eff_per_level = α × (1 + β_B × N_PopII) × (1 + β_C × N_BD)`, total hidden factor = `α_eff_per_level^N_Subhalo`. β_B = β_C = 0.03 user-ratified (tight β preserves "inferred, not rendered" feel per creative-director rationale). Honors SD-2 (*dark matter is inferred, not rendered*) at the tier whose defining physics most demands it.

**Synergies (3 total, including the second cross-tier synergy in the game):**

| Provider | Target | Multiplier | Kind | Notes |
|---|---|---|---|---|
| Orphan Stream (T3) | RR Lyrae (T3) | **1.5×** | flat one-shot | Within-tier; mirrors T2 BP → Microlensing pattern. |
| Population II (T3) | Subhalo (T3) | **+0.03/lvl** | additive | Within-tier stackable per-level; β_B = 0.03 user-ratified. |
| **Brown Dwarf (T2)** | **Subhalo (T3)** | **+0.03/lvl** | **additive — cross-tier** | **Second cross-tier synergy in the game** (the first, T2 Local Bubble → T4 HII Region, is in the renumbered T4 slate). β_C = 0.03 user-ratified. Voice-coherent: BD is T2's unlit-mass upgrade, Subhalo is its named follow-on at the next mass scale. Attached via IIFE in `data.js` alongside the renumbered T4-targeted cross-tier. |

**Consolidation math:** Orphan Stream (+0.9) + Sculptor Dwarf (+1.5) + Draco Dwarf (0.0) + Sagittarius Stream (+3.85) = **6.25** — matches engine `consolidationThreshold × consolidationGrowth^2 = 1.0 × 2.5² = 6.25`.

**Felt-investment shape (Subhalo levels at T3 exit, seeds 1-3 × N=5):**
- Comp p1 path: median 15 Subhalos (range 5-31) — within the ~10-15 felt-investment target.
- Threshold p3 path: median 7 Subhalos (range 0-20) — within the ~5-8 felt-investment target.
- High variance reflects RNG-driven patient-universe idle-gap sequencing; not a calibration failure.

**Comp-vs-Threshold gap:** +6.9% (p1 31h vs p3 29h on T3 calendar). Informational only under the CD-2/NEW-1 reframe (pre-peak gap is felt opportunity cost on a single playthrough, not a tight calibration target).

**Verification (post-Step-D):** save_migration_test 56/56 (up from 53/53; added v1/v2/v3 refused-load checks across SAVE_VERSION 2→3→4 bumps); validate_offline 38/38; validate_subhalo 28/28 NEW (identity, L1/L2/L3 parity, B/C synergy compounding, T3→T4 transition persistence, stat-display contract, offline integration, edge cases, purity, strategy VPC parity); profiles_smoke 396/396. T1/T2 byte-identical preserved (T1 11m 40s, T2 1h 8m at p17 bot-60cpm × comp-hoarder seed=1). T3 bot baseline: 9h 36m. T4 / T5 chains reachable with placeholder T4 / T5 numbers (bot T4 9h 47m, bot T5 9h 48m — both still need their own retune workstreams).

**Report path:** `Simulator/reports/2026-05-13T20-44-37-276Z/` (raw.csv + report.md + step-d-landing.md).

---

### Tier 4 — Galactic Arm (retuned 2026-05-14 under Reading B + CD-2/NEW-1 reframe; iter 9 locked)

> **T4 retune landed 2026-05-14 (Phase 2 of post-renumber workstream; iter #9 of 9).** Numerical fields rescaled under Reading B (peak in-tier mass at gate ~10¹⁰ M☉ Threshold path = named scale anchor). Slate (5 stackables + 4 one-shots + 4 synergies) and flavor preserved verbatim from the pre-renumber T3 calibration. All 4 primary engaged pairings land inside per-tier T4 calendar band (p1 27h / p2 37h / p3 29h / p4 34h), 0% DNF. T1/T2/T3 byte-identical preserved at p17 bot-60cpm seed=1 (T1 11m 40s, T2 1h 8m, T3 9h 36m). All 4 locked harnesses pass: save_migration 56/56, validate_offline 38/38, validate_subhalo 28/28, profiles_smoke 396/396.

T4 introduces AC/sec (autoclicker) income channels for the first time, so the AC/sec columns carry data here. `× all AC/sec` defaults to 1.000 across T4 and is omitted.

| # | Name | Init cost | Cost growth | Max lvl | Consolidation+ | M/sec Base | M/sec +/lvl | M/sec ×self | M/click +/lvl | AC/sec +/lvl | × all M/sec | × all M/click | Completionist |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Dust Lane Density   |       150,000 | 1.135 | 99 | 0.00  | **80.000** | 0.000 | **1.120** |  0.000 | 0.000 | 1.000 | 1.000 | No |
| 2 | HII Region          |       240,000 | 1.135 | 99 | 0.00  | **120.000** | 0.000 | **1.120** |  0.000 | 0.000 | 1.000 | 1.000 | No |
| 3 | Proper Motion       |       450,000 | 1.34  | 99 | 0.00  |  0.000 | 0.000 | 1.000 | **160.000** | 0.000 | 1.000 | 1.000 | No |
| 4 | Spiral Density Wave |       600,000 | 1.42  | 99 | 0.00  |  0.000 | 0.000 | 1.000 |  0.000 | **2.000** | 1.000 | 1.000 | No |
| 5 | High-Velocity Cloud |   3,000,000,000 | 2.05  |  5 | 0.00  |  0.000 | 0.000 | 1.000 |  0.000 | **4.000** | 1.000 | 1.000 | **Yes** |
| 6 | Galactic Bulge      |     6,000,000 | 1.55  |  7 | **0.75** |  0.000 | 60.000 | **1.200** |  0.000 | 0.000 | 1.000 | 1.000 | No |
| 7 | Sagittarius B2      |    18,000,000 | 1.00  |  1 | **2.25** |  0.000 | 0.000 | 1.000 |  0.000 | 0.000 | 1.000 | 1.000 | No |
| 8 | Globular Cluster    | 100,000,000,000 | 1.00  |  1 | 0.00  |  0.000 | 0.000 | 1.000 |  0.000 | 0.000 | **1.420** | 1.000 | **Yes** |
| 9 | Active Nucleus      |  20,000,000,000 | 1.00  |  1 | **8.125** |  0.000 | 0.000 | 1.000 |  0.000 | 0.000 | 1.000 | 1.000 | No |

**Galactic Bulge is tiered consolidation** — `maxLevels: 7`, `consolidation: 0.75` per level. Engine encodes it as a stackable with `consolidation > 0 && maxLevels > 1`; strategy buys it via the consolidation-only stackable rule (see section 9). 7 × 0.75 = 5.25 consolidation. GB also produces income: `addMps: 60, selfMps: 1.20` (raw output at L1=60, L7=180; the income makes the consolidation purchase feel substantive mid-T4 rather than a pure progress tax).

**Consolidation math:** Galactic Bulge (7 × 0.75 = 5.25) + Sagittarius B2 (+2.25) + Globular Cluster (0.00) + Active Nucleus (+8.125) = 15.625 — matches engine `consolidationThreshold × consolidationGrowth^3 = 1.0 × 2.5³ = 15.625`.

**Synergies (4 within-tier + 1 cross-tier outbound = 5 total):**
- A: Sagittarius B2 → Proper Motion ×1.5 flat (one-shot → click stackable)
- B: Dust Lane Density → HII Region ×1.06/lvl (regular passive → regular passive)
- C: High-Velocity Cloud → Dust Lane Density ×1.10/lvl (completionist APS → regular passive, cross-stat)
- D: Local Bubble (T2) → HII Region ×(1 + 0.04 × LB_level) additive (cross-tier; spans T2 → T4; first cross-tier synergy in the game; physics verified per Zucker 2022, science-director Phase 1)
- E (cross-tier outbound to T5): Active Nucleus → Sagittarius A* (T5) ×1.5 flat (one-shot → one-shot; resolves via existing `synergyMult` provider-list path)

**Calibration outcomes (N=50, seed=1 engaged primary pairings):**

| Pairing | Mode | T4 dur p50 | T4 band | Drift | Mass p50 | Ratio |
|---|---|---|---|---|---|---|
| p1 engaged × comp-hoarder | Comp | 1d 3h (27h) | 1d 0h - 2d 0h | -24.2% in band | 3.39e+11 | 3.39× above-band |
| p2 engaged × comp-rusher | Comp | 1d 13h (37h) | 1d 0h - 2d 0h | +2.8% within | 2.43e+11 | 2.43× above-band |
| p3 engaged × thr-hoarder | Thr | 1d 5h (29h) | 1d 0h - 1d 12h | -3.3% within | 4.40e+10 | 2.20× above-band |
| p4 engaged × thr-rusher | Thr | 1d 10h (34h) | 1d 0h - 1d 12h | +16.2% in band | 4.53e+10 | 2.27× above-band |

Bot reference: T4 Comp 1.00e+11 / T4 Thr 2.00e+10 (Thr within ±0.5 dex of Reading B target 10¹⁰ named scale; Comp 5× named acceptable per CD-2/NEW-1 — pre-peak Comp overshoot 2-3× expected, T4 lands 5× because mass commit from HVC + GC + AN is ~30× Thr's commit).

Comp-vs-Thr T4 calendar gap (informational only under CD-2/NEW-1 loose pre-peak): p1 vs p3 cumulative +1.5% (negligible); p2 vs p4 +8.3%.

### Tier 5 — Galaxy (was T4 pre-2026-05-13; numbers STALE pending T5 long-burn retune)

> **Stale-pending-retune note (2026-05-12 + 2026-05-13 renumber).** Same disposition as T4 — slate (5 stackables + 5 one-shots + cross-tier one-shot→one-shot synergy + first compound-channel multiplier) preserved; numbers below are the 2026-05-11 first-pass calibration at the pre-M☉ scale and no longer align with the locked Reading B scale; consolidation values rescaled × 2.5 for the renumber. T5 retune queues after T4.

### Tier 5 (first numerical calibration pass 2026-05-11; pre-renumber values shown)

T5 introduces two structural shapes (added to the engine pre-renumber when this slate was Tier 4): (1) a **compound-channel multiplier** (Hot Coronal Halo declares `allMps` AND `allMpc` simultaneously at the same coefficient — no engine extension needed, both channels read their own `allX^N` product), and (2) a **cross-tier one-shot → one-shot synergy** (Active Nucleus T4 → Sagittarius A* T5 post-renumber; was T3 → T4 pre-renumber — resolves via the existing `synergyMult` provider-list path already plumbed for T2 LB → T4 HII Region). Sgr A* declares `baseMps: 800k`; the synergy multiplies its self-contribution by 1.5 when AN is owned, which is unconditional in any handoff (AN is the T4→T5 transition gate, not a completionist).

| # | Name | Init cost | Cost growth | Max lvl | Consolidation+ | M/sec Base | M/sec ×self | M/click +/lvl | AC/sec +/lvl | × all M/sec | × all M/click | Completionist |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Galactic Rotation  |       2,000,000 | 1.135 | 99 | 0.00  | **10,000** | **1.120** |  0.000 | 0.000 | 1.000 | 1.000 | No |
| 2 | Stellar Halo       |       3,000,000 | 1.135 | 99 | 0.00  | **14,000** | **1.120** |  0.000 | 0.000 | 1.000 | 1.000 | No |
| 3 | Galactic Coupling  |       6,000,000 | 1.34  | 99 | 0.00  |  0.000 | 1.000 | **2,000** | 0.000 | 1.000 | 1.000 | No |
| 4 | Galactic Fountain  |      10,000,000 | 1.42  | 99 | 0.00  |  0.000 | 1.000 |  0.000 | **20.000** | 1.000 | 1.000 | No |
| 5 | Satellite Galaxies |  40,000,000,000 | 2.10  |  5 | 0.00  |  0.000 | 1.000 |  0.000 | **40.000** | 1.000 | 1.000 | **Yes** |
| 6 | Bar Structure      |     200,000,000 | 1.00  |  1 | **1.50**  | 0.000 | 1.000 |  0.000 | 0.000 | 1.000 | 1.000 | No |
| 7 | Fermi Bubbles      |   1,500,000,000 | 1.00  |  1 | 0.00  |  0.000 | 1.000 |  0.000 | 0.000 | **1.500** | 1.000 | **Yes** |
| 8 | Sagittarius A*     |     800,000,000 | 1.00  |  1 | **1.50**  | **800,000** | 1.000 |  0.000 | 0.000 | 1.000 | 1.000 | No |
| 9 | Hot Coronal Halo   |  20,000,000,000 | 1.00  |  1 | 0.00  |  0.000 | 1.000 |  0.000 | 0.000 | **1.300** | **1.300** | **Yes** |
| 10 | Dark Matter Halo  |  16,000,000,000 | 1.00  |  1 | **12.625** | 0.000 | 1.000 |  0.000 | 0.000 | **1.800** | 1.000 | No |

Cost-growth-1.135 stackables (Galactic Rotation, Stellar Halo) use the exponential `baseMps × selfMps^(N-1)` shape, mirroring T3 DLD/HII.

**Hot Coronal Halo is the first compound-channel multiplier in the game** — same coefficient (1.30) is declared on both `allMps` and `allMpc`. Live MPS and MPC each read their own `allX^N` product (`core.computeRates`, lines 143-145), so both channels fire independently. No engine extension was needed.

**Structural note on HCH consolidation = 0.00:** the v0.2 design draft proposed "moderate-nonzero" consolidation for HCH. Sim-tuner identified that a completionist upgrade with positive consolidation creates a Threshold-impassable gate (Threshold-mode masks completionists, so any consolidation they carry becomes unreachable mass — Threshold-path would never transition). Pattern across T1-T3: all completionists at consolidation 0 (Magnetosphere is the exception at T1 with consolidation 0 too; T2 Moving Group, T3 Globular Cluster, T3 HVC all at 0). HCH at 0 preserves Threshold-path reachability and matches the pattern. The 2.5 consolidation freed up was absorbed by Dark Matter Halo (10.125 → 12.625) — DMH is now the bigger and more decisive late-tier gate.

**Consolidation math (pre-rescale, as designed):** Bar Structure (+1.50) + Fermi Bubbles (0.00) + Sagittarius A* (+1.50) + Hot Coronal Halo (0.00) + Dark Matter Halo (+12.625) = **15.625** — matched the pre-renumber engine T4→T5 budget = 1.0 × 2.5³. **Under the 2026-05-13 11-tier renumber**, this slate is T5; consolidation values rescaled × 2.5 in `data.js` (Bar 3.75 + FB 0 + Sgr A* 3.75 + HCH 0 + DMH 31.5625 = 39.0625) to match the new T5→T6 budget = 1.0 × 2.5⁴ = 39.0625. `TIER_CONFIGS` in `runner.js` refactored to compute `consolidationThreshold` from the formula (no hardcoded values); implemented tiers extended to `[1..5]`.

**Cross-tier synergy** (declared on T3 Active Nucleus, target T4 Sagittarius A*): `synergies: [{ target: "Sagittarius A*", multiplier: 1.5 }]`. Existing engine path: when T4 is the active tier, `synergyMult("Sagittarius A*", levels, T4-upgrades, allUpgrades)` walks `allUpgrades` (which includes T3 AN with its synergy declaration) and finds the match; the multiplier multiplies Sgr A*'s self-contribution. Verified live by `t4_calibrate.js` (Sgr A* baseMps 800k → effective 1.2M MPS contribution when AN is owned, which is all four scenarios since AN is a non-completionist T3 gate).

**Calibration result (100 cpm, engagement 1.0):**

| Scenario | T4-thr | T4-comp | Gap |
|---|---|---|---|
| Comp-handoff | 21:46 | 36:03 | **+65.6%** (upper band edge; target +55-65%) |
| Thr-handoff | 39:33 | 54:50 | **+38.6%** (below band, accepted as structural — completionist absolute Δ ~14-15 min in both handoffs absorbs proportionally less of Thr-handoff's larger base time) |

cpm sensitivity: ±0.5pp across 60/100/150 cpm (T4 is largely click-insensitive due to dominant passive MPS from compounded carry-over). T3 ripple: 0pp (T3 byte-identical at +76.2% / +75.6% before and after T4 entries added).

**Curve shape (Comp-handoff Comp):** late-wall ratio 0.011 (T3 was 0.008 — comparable). MPS climbs visibly through deciles 30%-90% (16.5M → 56M → 103M → 372M → 847M → 1.75B → 3.65B). The "feels backloaded" risk that T2/T3 playtests surfaced does not appear in T4; the long-save tolerance bypass produces sustained stackable buys (mostly Stellar Halo and Galactic Rotation) across the entire run.

**Click share at T4: 0.0-0.2%** — clicking is effectively decorative at this tier. The HCH compound channel's design intent ("addresses late-tier click engagement") does not produce meaningful click engagement at the calibrated numbers: by T4, `allMpcCarry` from compounded T1-T3 click multipliers has reached ~1.56, and HCH's +30% lift on top is small relative to passive snowball. Surfaced as a design tension for creative-director / engineering-director — click feel at T4 is currently sacrificed in service of the snowball delivering the strategic-completion payoff. Possible fixes: raise Galactic Coupling addMpc significantly, raise HCH's allMpc lift, or reframe T4 as a primarily-passive tier where click is decorative (accept current state).

### Synergies (cross-upgrade effects)

A new effect type at T1 — owned upgrades can multiply the *self-contribution* of other specific upgrades. Thematically these are "Solar Wind effects" in-game (one upgrade's emissions affecting another). Mechanically: each provider declares targeted multipliers; the buff scales geometrically with provider level (`multiplier ^ N`) by default; multiple synergies on the same target compound multiplicatively. **An additive synergy kind landed pre-renumber at the old T3 boundary** (`kind: "additive"` declarations resolve as `1 + (multiplier - 1) × N` instead of `multiplier^N`); the same engine extension powers both cross-tier synergies and the Subhalo hidden-channel coefficient compounding.

| Provider | Target | Multiplier | Kind | Notes |
|---|---|---|---|---|
| Heliopause (T1) | Stellar Coupling (T1) | **1.5×** | flat one-shot | Buffs SC's full self-contribution to all stats. |
| Binary Partner (T2) | Microlensing (T2) | **1.5×** | flat one-shot | Mirrors HP→SC pattern. |
| Roche Lobe Overflow (T2) | Local Bubble (T2) | **1.05/lvl** | stackable per-level (multiplicative) | Within-tier same-stat-family. |
| Brown Dwarf (T2) | Roche Lobe Overflow (T2) | **1.10/lvl** | stackable cross-stat (multiplicative) | Within-tier passive→APS. |
| Orphan Stream (T3) | RR Lyrae (T3) | **1.5×** | flat one-shot | Mirrors BP→Microlensing pattern. T3 Dwarf Spheroidal within-tier flat. |
| Population II (T3) | Subhalo (T3) | **+0.03/lvl** | stackable per-level (additive) | T3 within-tier same-stat-family; β_B = 0.03 user-ratified. |
| Velocity Dispersion (T3) | Population II (T3) | **1.10/lvl** | stackable cross-stat (multiplicative) | T3 completionist APS provider → passive target. |
| **Brown Dwarf (T2)** | **Subhalo (T3)** | **+0.03/lvl** | **stackable per-level (additive — `kind: "additive"`)** | **Second cross-tier synergy in the game** (locked Step D iter #10, 2026-05-13). β_C = 0.03 user-ratified. Voice-coherent: BD is T2's unlit-mass upgrade, Subhalo is its named follow-on at the next mass scale. |
| Sagittarius B2 (T4) | Proper Motion (T4) | **1.5×** | flat one-shot | Mirrors BP→Microlensing pattern. *(Was T3 pre-renumber.)* |
| Dust Lane Density (T4) | HII Region (T4) | **1.06/lvl** | stackable per-level (multiplicative) | Both passive Mps. *(Was T3 pre-renumber.)* |
| High-Velocity Cloud (T4) | Dust Lane Density (T4) | **1.10/lvl** | stackable cross-stat (multiplicative) | T4 completionist APS provider → passive target. *(Was T3 pre-renumber.)* |
| **Local Bubble (T2)** | **HII Region (T4)** | **+0.04/lvl** | **stackable per-level (additive — `kind: "additive"`)** | **First cross-tier synergy in the game** (pre-renumber: T2 LB → T3 HII Region). Resolves as `1 + 0.04 × levels_of_Local_Bubble`. |
| Active Nucleus (T4) | Sagittarius A* (T5) | **1.5×** | flat one-shot (cross-tier) | Cross-tier one-shot → one-shot; resolves via `synergyMult` provider-list. *(Was T3 → T4 pre-renumber.)* |

**Why it matters at T1:** Heliopause was previously a pure gate purchase (consolidation-only, no stat effect). The synergy gives it a mechanical kick that the completionist player feels — buying HP suddenly increases their click value by 50%, which helps absorb the longer FP/Mag5 wait that follows.

**Why cross-tier synergies matter:** the cross-tier path (Local Bubble → HII Region at T2→T4, Brown Dwarf → Subhalo at T2→T3) is the felt encoding of "stats carry over between tiers" — a T2 stackable tangibly buffs a later-tier target. Used sparingly across the design (not auto-propagated to every tier). The Brown Dwarf → Subhalo route is the design's voice-coherent extension: BD's unlit-mass identity feeds into Subhalo's named-but-still-unseen mass identity at the next scale.

---

## 2. Upgrade descriptions

Italic flavor text shown beneath each upgrade. Part of what's being playtested — does the cosmological voice land or get skipped? Authoritative wording lives in `Design Documents/gameplay-design.md`; the strings below mirror what's in `data.js`.

**Tier 1**

- **Solar Wind:** *Charged particles drift outward and return with company. We are pulling more than we used to.*
- **Asteroid Belt:** *The belt yields. Iron, ice, the slow gravel of the early system. Each rock finds us.*
- **Stellar Coupling:** *We pull harder. The center holds tighter.*
- **Magnetosphere:** *The system's invisible shell. Charged particles arc and return. We catch what would have escaped.*
- **Orbital Resonance:** *Periods align. The system breathes in time with us. Everything we touch becomes synchronous.*
- **Heliopause:** *We have reached the edge of our influence. Beyond it, the rest of the galaxy waits.*
- **First Photons:** *Light, finally. The first photons leave the surface and find us. Everything quickens.*

**Tier 2** (mirrors `data.js` short descriptions; the full design-doc lines are longer. Roche Lobe Overflow's two synergy-variant lines live in a `synergyVariants: [{ provider, text }]` array — see section 9b for the resolution rule.)

- **Stellar Kinematics:** *Stars wander, and we listen for the wandering.*
- **Local Bubble:** *A cavity carved by old supernovae. We are inside it. Everything inside is ours.*
- **Microlensing:** *Light bends around mass we cannot see. We learn the shape of what we cannot touch.*
- **Roche Lobe Overflow (base):** *One star feeds another across the lobe. Material flows on its own.*
- **Roche Lobe Overflow (Synergy B variant — Local Bubble buff active):** *Mass that crosses the Lagrange point does not all reach the companion star. The remainder enters the bubble, and the bubble is patient.*
- **Roche Lobe Overflow (Synergy C variant — Brown Dwarf buff active):** *Unseen mass disturbs the pair. Each perturbation tightens the orbit a little. The Roche lobe is filled, then filled again.*
- **Brown Dwarf:** *Failed star, patient mass. It never ignited; it accumulated.*
- **Binary Partner:** *A second center of mass. The orbit becomes a duet.*
- **Peculiar Velocity:** *We move against the local flow. Mass piles into our wake.*
- **Open Cluster:** *Hundreds of young stars, gravitationally loose. The shape of belonging, briefly.*
- **Moving Group:** *Stars sharing a common drift through the disk. We have learned to drift with them.*

**Tier 3 — Dwarf Spheroidal** (locked design-doc lines; landed in `data.js` `desc` fields. Step D iter #10, 2026-05-13 evening.)

- **Population II:** *Old stars, metal-poor, made before the universe had much else to make them from. They have been here since before we knew to look. Their light is the light of survivors.*
- **Subhalo:** *We are riding the tide of what was delivered before us. We cannot see the carrier. We can feel its keel.*
- **RR Lyrae:** *Horizontal-branch stars, pulsing on a clock older than the disk. Each beat is a measurement we did not have to take. The universe is blinking at the same rate we are counting.*
- **Velocity Dispersion:** *The stars move faster than their visible companions should hold them. The number that does not fit is the number we have been looking for. The missing mass made measurable, one transit at a time.*
- **Orphan Stream:** *A thin ribbon of stars, drifting without a parent. The galaxy that shed them has no name. The debris kept moving in the shape of what carried it, and that shape is the only obituary.*
- **Sculptor Dwarf:** *Eighty-six kiloparsecs out, two stellar populations in one small body — an old one and an older one. Close enough to resolve the suns individually. The first time we have looked at another galaxy and seen the people in it.*
- **Draco Dwarf:** *Four hundred forty solar masses for every one we can see. A creature almost entirely invisible, almost entirely gravity. The dark matter we have been embedded in this whole time has a name, and the name is old.*
- **Sagittarius Stream:** *A dwarf galaxy is being torn apart along our orbit. Its stars unspool into a stream that wraps us twice. We are doing this. The arm we are about to become is being made from the things we are eating.*

**Tier 4 — Galactic Arm** *(was Tier 3 pre-2026-05-13 renumber; locked design-doc lines; landed in `data.js` `desc` fields. Galactic Bulge's per-level arc lives in a `descByLevel: [string]` array, and HII Region's Synergy D variant lives in a `synergyVariants: [{ provider, text }]` array — see section 9b for both resolution rules.)*

- **Dust Lane Density:** *The dark bands thicken along our arm. Carbon, silicate, the cold dust between starlight. Everything that forms here forms in our reach.*
- **HII Region (base):** *Hydrogen ionizes at ten thousand kelvin. Young O and B stars light the gas they were born from. The pink glow is the youngest light in our reach.*
- **HII Region (Synergy D variant — Local Bubble buff active):** *The cavity's edge sweeps the medium ahead of it. What collapses there becomes the next generation of stars. The bubble is older than us, and it has been preparing our nurseries.*
- **Proper Motion:** *Our pull reaches further than it did. Stars far from our center adjust their paths in answer. We read the angle they have moved against the sky.*
- **Spiral Density Wave:** *A wave of compression moves through the arm. Stars and gas pile against its crest. Where the wave passes, new light follows.*
- **High-Velocity Cloud:** *A cloud of neutral hydrogen falls onto the disk at ninety kilometers a second. It has been falling for an age. Its arrival adds to ours.*
- **Galactic Bulge — per-level arc (7 lines, stored as `descByLevel` in `data.js`; the upgrade's flat `desc` field is the L1 line as a fallback for paths that don't go through `core.getUpgradeFlavor`):**
  - L1: *The center thickens. Gas falls inward along the bar, slowly, on long orbits.*
  - L2: *Stars form in the dense rush. Hundreds at a time, in regions only light-years across.*
  - L3: *The core fills. Orbits crowd. Stars begin to scatter each other off their first paths.*
  - L4: *The motion settles into many directions at once. The bulge is no longer falling. It is held by its own dispersion.*
  - L5: *The new stars become old stars. Few are forming now. The light is the light of long-lived suns.*
  - L6: *Iron, magnesium, the residue of generations. The bulge keeps what its stars made before they died. The composition is set.*
  - L7: *The center is a quiet weight. Old stars on tangled orbits. Nothing falls in now that the bulge does not already hold.*
- **Sagittarius B2:** *A molecular cloud, three million solar masses, one hundred fifty light-years across, one hundred twenty parsecs from our center. Methanol, ethanol, vinyl alcohol — the most chemically complex region we know. Its mass enters our gravity.*
- **Globular Cluster:** *A tight sphere of stars, twelve billion years old, older than most of our disk. It orbits us in a long quiet ellipse. It binds.*
- **Active Nucleus:** *Our center brightens. Something massive at the heart of us begins to feed.*

---

## 3. Formulas (locked — structural, not tunable)

```
selfContrib(N, B, A, S) = 0                       if N = 0
                       = (B + N·A) · S^(N-1)     otherwise

  // L1 = base (selfMult not yet applied); L2+ apply the multiplier each
  // level beyond the first. For S=1 (the T1 default; T2 default except
  // Stellar Kinematics, which uses S=1.115 selfMps under v5-M + 2026-05-11
  // feel-tuning pass) S^(N-1) = 1, so the formula collapses to (B + N·A)
  // and those upgrades' calibrations are unaffected by the exponent.

synergyMult(target) = Π over providers P:
  if  P.kind === "additive":   1 + (multiplier_P→target − 1) · levels_P
  else (default multiplicative): multiplier_P→target ^ levels_P

// Single-tier compute (used when no carry payload is present, i.e. T1):
MPC = (1.0 + Σ over upgrades U: selfContrib_mpc(U) · synergyMult(U)) · Π allMpc^N
MPS = (0   + Σ over upgrades U: selfContrib_mps(U) · synergyMult(U)) · Π allMps^N
APS = (0   + Σ over upgrades U: selfContrib_aps(U) · synergyMult(U)) · Π allAps^N

cost(L) = initCost · costGrowth^L
```

Where N is the upgrade's current level. The synergy multiplier for an upgrade U is the product over all *other* upgrades that declare a synergy targeting U. Each provider's contribution is computed by its declared `kind`: default (no `kind` field) is multiplicative `m^N`; `kind: "additive"` resolves as `1 + (m − 1) · N`. For an upgrade with no incoming synergies, `synergyMult = 1` and the formula collapses to the original. The additive kind was added at T3 to support the cross-tier Local Bubble (T2) → HII Region (T3) synergy at `m = 1.04`, resolving as `1 + 0.04 · levels_of_Local_Bubble`. The default-multiplicative behavior is preserved for all T1/T2 synergies (byte-identical when no `kind` field is present).

### Cross-tier composition (Option C — "no frozen floors")

When more than one tier's upgrades are owned, the load-bearing rule is: **every owned ×all multiplier compounds across every owned stackable contribution, regardless of which tier provided it.** A T3 Globular Cluster (×1.42 ×all MPS) amplifies T1's Solar Wind contribution and T2's Stellar Kinematics contribution and T3's own Dust Lane Density contribution — all of them.

The canonical full-game compute (any tier, any owned set):

```
MPS = (Σ over ALL owned upgrades U: selfContrib_mps(U) · synergyMult(U)) · Π over ALL owned: allMps^N
MPC = (1.0 + Σ over ALL owned U:     selfContrib_mpc(U) · synergyMult(U)) · Π over ALL owned: allMpc^N
APS = (Σ over ALL owned U:           selfContrib_aps(U) · synergyMult(U)) · Π over ALL owned: allAps^N
```

The runner and the playtest UI split this into a *carry payload* (raw Σ self·syn from prior tiers + cumulative Π allX^N from prior tiers) plus the *active tier* (its own raw Σ self·syn + its own Π allX^N), and combine them at every tick. There are no frozen amounts — every multiplier acquired in the active tier is applied to the carried raw floor live. Equivalent to walking every owned upgrade across every tier on every tick. `core.computeRates(state, upgrades, carry, params, synergyProviders)` returns `{ mps, mpc, aps }` under this rule and is the single source of truth.

Carry payload shape (used in both `runner.js` tick loop and `playtest.js` live game):
- `carry.allMps` / `allMpc` / `allAps` — cumulative product of `allX^N` from all owned prior-tier upgrades. Composes multiplicatively on each tier transition.
- `carry.carryMps` / `carryMpc` / `carryAps` — cumulative **raw** Σ of `selfContrib · synergyMult` from all owned prior-tier upgrades. **No allX factor applied**; the runner multiplies live. Composes additively on each tier transition.

At T1 (no prior tier), `allX = 1` and `carryX = 0`, so `computeRates` reduces to the single-tier formula above. T1 calibration is therefore byte-identical to the pre-carry compute. Synergies (intra-tier and cross-tier) resolve through the `synergyProviders` wide-list everywhere they touch.

**`synergyProviders` argument (cross-tier plumbing, added at T3).** `core.synergyMult` and the three rate functions (`computeMpc/Mps/Aps`) accept an optional `synergyProviders` array — a wider provider list including prior-tier upgrades. When omitted, providers default to `upgrades` (preserving T1/T2 byte-identical behavior). The runner passes the unfiltered `allUpgrades` list as `synergyProviders` on every per-tick rate computation, so prior-tier providers (their levels seeded into `state.levels` from `carryFrom.finalState`) buff current-tier targets. Strategy's `decideAction` reads `params.synergyProviders` (defaults to `upgrades`) so VPC math also sees cross-tier providers.

**Hidden MPS channel (`carryMpsMult`, added at T3 for Subhalo — Step C, 2026-05-13).** Any owned upgrade in `synergyProviders` declaring `carryMpsMult` contributes a per-level exponentiated multiplier applied to **`carryMps` only** — `sumMps` (the active-tier self·syn sum) is untouched. The per-level coefficient compounds incoming synergies BEFORE exponentiation:

```
α_eff_per_level = u.carryMpsMult × synergyMult(u.name, ...)
hidden_mps_factor *= Math.pow(α_eff_per_level, N)
mps = (carryMps × hidden_mps_factor + sumMps) × allMps × allMpsCarry
```

The walk uses providers (the full owned-upgrades list, not the active-tier slice) so the hidden factor persists after the player transitions past the declaring tier. Subhalo (T3) is the first upgrade declaring `carryMpsMult` (PHASE-2-PLACEHOLDER `1.10`); its own per-upgrade MPS/MPC/APS row contributes 0 — the mass counter rises faster than the visible sum predicts, which is the design's hidden-channel UX signal. Strategy's `stackableVpc` has a dedicated branch for `carryMpsMult > 1` valuing one additional level at `carryMps × α_eff^N × (α_eff - 1) × gMps × carry.allMps / nextCost`. Synergies received by Subhalo (Population II → Subhalo additive `× (1 + 0.06 × N)`, Brown Dwarf → Subhalo cross-tier additive `× (1 + 0.04 × N)`) are valued via the providers' VPC paths through the existing synergy-gift accounting.

---

## 4. Global / engine parameters

| Parameter | Value | Notes |
|---|---|---|
| Tick rate | **1 Hz** (1000 ms) | `setInterval(tick, 1000)`. `DEFAULT_PARAMS.tickIntervalMs`. |
| MPC base value | **0.00120** | The "+ floor per pull" click value in M☉. `DEFAULT_PARAMS.baseMpc`. **2026-05-12 retune:** lowered from 1.0 to land click income on the M☉ scale (iteration 1 went to 0.02 — click share over-shot 81%; iteration 2 took it to 0.00120 — click share lands at 49.4%, in the 50-60 band). Engineering coupling fix in the same pass: `runner.js` + `offline.js` were hardcoding `baseMpc: 1.0` at 3 load-bearing sites; both now thread `data.DEFAULT_PARAMS.baseMpc`. |
| MPS base value | **0** | No idle income before any upgrades. `DEFAULT_PARAMS.baseMps`. |
| Consolidation T1 → T2 | **1.0** | Unlocks End Tier 1 button. `DEFAULT_PARAMS.consolidationThreshold`. |
| Consolidation growth | **2.50** | `consolidation_T_n_to_T_n+1 = consolidationThreshold × consolidationGrowth^(n-1)`. Inert at T1. `DEFAULT_PARAMS.consolidationGrowth`. |
| CPM rolling window | **30 s** | For the live cpm stat shown to player. `DEFAULT_PARAMS.cpmWindowMs`. |
| Default cpm (sim) | **100** | `DEFAULT_PARAMS.cpm` (Phase 4). The Simulator quick-strip's initial value. |
| Save VPC ratio | **1.5** | `DEFAULT_PARAMS.saveVpcThreshold`. The strategy's most sensitive single tunable. |
| Long-save threshold | **90 s** | `DEFAULT_PARAMS.longSaveTimeThresholdSec`. Post-consolidation long-save bypass gate; saves shorter than this stay locked on the next completionist. Inert at T1. |
| Long-save tolerance | **1.05** | `DEFAULT_PARAMS.longSaveTolerance`. Max with/without save-time ratio for accepting a non-completionist stackable interleave during a long completionist save. ~5% extension permitted. |
| Engagement (global ×) | **1.0** | `DEFAULT_PARAMS.engagement`. Multiplier applied on top of the per-tier curve. |
| Default scenario | **completion** | `DEFAULT_PARAMS.scenario` (Phase 4). `'completion'` or `'threshold'`. |
| Per-tier engagement | T1=0.90, T2=0.25, T3=0.08, T4=0.05, T5=0.04, T6=0.03, T7=0.025, T8=0.02, T9=0.015, T10=0.01 | `DEFAULT_PARAMS.perTierEngagement`. **2026-05-12 retune:** retired the prior curve (1.00 / 0.85 / 0.80 / 0.70 / 0.50 / 0.45 / 0.40 / 0.35 / 0.30 / 0.30) and replaced with the steep witness-phase shape — T1 hyper-present (player is learning what every click does), falling sharply through T2-T3 as offline accrual takes over the mass flow, bottoming at T10 where the player is almost-not-playing. Mechanically encodes the shift from active onboarding to passive witnessing across the arc. The runner uses `perTierEngagement[scenario.tier] × engagement` for per-tick click income. Multiplies in-session cpm during check-ins; offline windows are pure-idle regardless (engineering plan §10 #5). |
| Save schema version | **4** | `DEFAULT_PARAMS.SAVE_VERSION` (also exposed on `DF.sim.data`). Lineage: v1 → v2 (2026-05-12 M☉ retune, unit-scale shift), v2 → v3 (2026-05-13 ladder renumber, T3 Dwarf Spheroidal insertion), v3 → v4 (2026-05-13 consolidation rename, every `cohesion*` engine identifier → `consolidation*`). All prior versions refused at load; affected players start a fresh universe. |
| Cost display | `fmtCost(c)` adaptive | Replaced `Math.ceil(cost)` in the 2026-05-12 retune — sub-M☉ T1 costs (0.012, 0.40, 0.96) were collapsing to "1". Now: scientific below 1e-3, 3 decimals below 1, 2 decimals below 100, integer + thousands below 1e5, scientific above. |
| Mass display | `fmtMass(n)` adaptive | Replaced `fmt(n, 1)` in the 2026-05-12 retune — early-T1 click values were rendering as "0.0". Same magnitude buckets as `fmtCost`. |
| MPC / MPS / consolidation display | 2 decimals | (Non-mass stats kept fixed-precision; mass-bearing stats route through `fmtMass`.) |

---

## 5. Reference: simulation predictions

For comparing real-player data against the model. Source: `historical/dark-filaments-t1-barebones-spec.md`.

| Engagement | Threshold | Completion | Premium | Click share |
|---|---|---|---|---|
| 45 cpm × 50% (casual baseline) | 15.17 min | 27.33 min | 80% | 64.5% |
| 45 cpm × 90% (engaged)         |  9.67 min | 16.67 min | 72% | 66.6% |
| 60 cpm × 90% (high engagement) |  7.67 min | 13.17 min | 72% | 71.3% |

Real-player times outside this band → simulation miscalibrated. Inside the band → ready to scale model up to T2.

**T2 sim availability (Phase 6):** the JS simulator now runs T2 with the locked v3 numerical values from the gameplay design doc. T2 results have no playtest reference yet, so the within-band indicator is suppressed for tier > 1. Phase 6 is a porting pass, not a tuning pass — initial calibration probe at 100 cpm shows T2 Threshold/Completion times running well under the design-doc spec targets (T2 Threshold ≈ 19:00, T2 Completion ≈ 26:30); the gap surfaces a tuning conversation for `sim-tuner`, not a math-layer bug.

---

## 6. Session report fields

What appears on the report screen when the player clicks End Tier N (where N is the highest implemented tier). Also written to the `end` event payload in the JSON log.

- Total play time (`mm:ss`)
- **Completion extension** — `total time − first-tier consolidation-hit time`. The voluntary post-gate stretch on the player's path. Note: in multi-tier runs this is still anchored to the FIRST tier's threshold-hit timestamp (the top-level `state.consolidationHitMs` field — legacy single-tier scope, preserved for compatibility); per-tier threshold timings are surfaced in the per-tier breakdown table below.
- Final mass
- Total mass gained (gross, before any was spent on upgrades)
- Mass from clicks (absolute + % of total gained) — manual clicks + dev-tool autoclicker, both routed through `pull()`.
- Mass from passive (absolute + % of total gained) — `mps` per 1 Hz tick.
- Mass from auto (absolute + % of total gained) — APS-from-upgrades income (`aps × mpc` per 1 Hz tick). Sourced from owned APS upgrades (T2 Roche Lobe Overflow, T3 Spiral Density Wave / High-Velocity Cloud, ...). Channel is distinct from the dev-tool autoclicker, which produces click income via `pull()`. Stays zero on T1 sessions (no T1 APS source).
- Total clicks
- Average clicks per minute
- **Per-tier breakdown** (multi-tier only) — compact table above the levels table: Tier · Threshold hit · Tier ended · Mass at end. Tier-local timings (each row's times are relative to that tier's start, not session start). Suppressed for single-tier runs.
- Per-upgrade final levels (table) — covers all UPGRADES across all tiers (T1 + T2 + future), one row per upgrade.
- **Completionist roll-up** — generic over `UPGRADES.filter(u => u.completionist)`. One row per completionist upgrade. Stackable (`maxLevels > 1`) reads `<name> maxed: Yes/No` based on `level === maxLevels`; one-shot (`maxLevels === 1`) reads `<name> owned: Yes/No` based on `level === 1`. Future tiers populate automatically as new completionist upgrades come online.
- **Charts — "Your trajectory"** — five canvases reproducing the Simulator-tab visual style for the player's actual run:
  - Mass over time (gold line, sampled at every click / purchase / tick log entry).
  - **Consolidation progress** (cyan line over 0..1) — multi-tier-aware: consolidation is normalized to the current tier's threshold so each tier ramps 0..100% (drops to 0 at the transition, ramps again). Vertical dashed separators mark tier transitions; per-tier "T<n> threshold · mm:ss" hashes mark each tier's threshold-hit. Tier badges (T1, T2, ...) sit above each segment when more than one tier was played.
  - **Income breakdown** stacked area (click + passive + auto, 1 s bins) — smoothed with a 5 s trailing rolling average so per-second click spikes don't sawtooth the chart. The auto band auto-detects: `includeAuto = autoMax > 0`, so T1 sessions render click+passive only (no APS source); T2+ sessions with owned RLO/SDW/HVC surface the auto band automatically.
  - **Per-upgrade levels** stacked area — single chart, ALL tiers' upgrades stacked tier-by-tier (T1 first, then T2, ...). Earlier-tier bands stay flat at their final level after the tier transition while the new tier's bands ramp from 0 — visually conveying the carry-forward design rule (older upgrades cannot be repurchased; their effects do not reset). HTML legend below the chart wraps to multiple rows when needed.
  - CPM over time (gold line, single series; sampled directly from each tick event's `cpm_window` field — surfaces the player's actual rhythm, including any autoclicker periods at constant cpm). Playtest-only — the algorithmic player has constant cpm by definition, so the Simulator tab has no analog.
- **Charts — "Compared to algorithmic player"** — a dedicated comparison canvas overlaying the player's mass curve against the simulator's prediction at the matching average cpm. The sim is run through the same tiers the player played, with per-tier mode auto-detected from each tier's exit levels (all completionist upgrades at max → `completion`, else `threshold`). Tier traces are stitched end-to-end with cumulative-time offsets so the resulting curve covers the same wall-clock span as the player's. The summary row reads `Your run · Sim at <cpm> cpm [· T1 <mode> → T2 <mode> → ...] · Delta`, where Delta is `(your − sim) / sim` colored red for slower-than-bot, cyan for faster-than-bot, dim for within ±0.5%.
- **Rendered session log** (clicks, ticks excluded) — same formatter as the in-play dev log viewer; shares the `logEventsForDisplay()` filter so both surfaces stay in sync. Drops `click` and `tick` events; keeps `purchase`, `tier_advance`, `pause`, `resume`, `skip_to_tier`, `tier_end`, `session_end`.
- Copy session log → clipboard (full log; see export filter below)
- Download log → `.json` file (full log; see export filter below)

**Export filter — tick events dropped by default (added 2026-05-11).** Session-end Copy / Download both drop `tick` events from the exported JSON. All other event types persist: `purchase`, `tier_advance`, `pause`, `resume`, `skip_to_tier`, `tier_end`, `session_end`. Magnitude: a T3-length session goes from ~1000 events to ~100 in the export. In-memory `state.log` retains ticks (live charts depend on them); per-tier snapshots and chart bins are computed live during play, not from the filtered export, so they're unaffected. **Debug escape hatch:** set `window.DF_LOG_VERBOSE_EXPORT = true` in the console before exporting to include ticks (debugging only).

The `click_share` ratio in the JSON payload (0.0–1.0) maps directly to the simulator's "Click share" column.

### Chart rendering — same hidden-canvas fix as Simulator tab

Charts must be drawn after the report panel is visible (canvas `clientWidth`/`clientHeight` are 0 while the parent is hidden). `showReport()` toggles `#play` → `.hidden` and `#report-wrap` → visible, then schedules `renderReportCharts(totalTime, avgCpm)` via `requestAnimationFrame` so layout has run before the chart calls happen. The chart functions still early-return on zero-dim canvases, so this is belt-and-suspenders.

### Chart trace transformation — `traceFromPlaytestLog(log, totalTimeMs)`

A small helper inside `src/ui/playtest.js`. Walks `state.log` once and returns:
- `mass: [{x, y}]` — sampled at every click / purchase / tick.
- `consolidation: [{x, y, tier}]` — **normalized to the current tier's threshold** (0..1 per tier). On `tier_transition` events, two samples are emitted at the same timestamp: `{y: 1, tier: fromTier}` and `{y: 0, tier: toTier}`, producing a clean drop-and-restart in the chart. Sampled at purchase events plus the start `(0, 0, T1)` and end `(totalTime_s, ..., curTier)` edges.
- `consolidationHit_s` — first tier's threshold-hit timestamp (legacy single-tier field kept for compatibility).
- `tierSegments: [{ tier, startSec, endSec, threshold, thresholdHit_s }]` — one entry per tier the player entered. `endSec` is filled when the next transition fires or when the run ends. Drives the consolidation chart's separators and per-tier threshold-hit hashes.
- `cpm: [{x, y}]` — sampled at every tick event from the `cpm_window` payload (30 s rolling window). Drives the CPM-over-time chart.
- `income: { times, click, passive, auto }` — 1 s bins, **post-processed with a 5 s trailing rolling average** so per-second click spikes don't sawtooth the income chart. Click income is bucketed by `mpc_at_click`; passive income by the tick's `mps` reading dropped into the matching 1 s bin (per-tick logging means each tick log already represents 1 s of mps — no spreading needed); auto is always zero array (T1/T2).
- `levels: { times, perUpgrade: { name → [n,...] } }` — 1 s bins, monotonic forward-fill so empty bins inherit the running level. Covers all UPGRADES, all tiers.

---

## 7. Instrumentation — log event schema

Every meaningful event is pushed to `state.log` and `console.log`'d. Schema:

```js
{ t_ms: <ms since session start>, type: "click"|"purchase"|"tick"|"end", payload: {...} }
```

Per-type payloads:

- **click:** `{ mass_after, mpc_at_click, cpm_window }`
- **purchase:** `{ upgrade, new_level, cost_paid, mass_after, consolidation_after, completionist }`
- **tick:** `{ mass_after, mps, mpc, cpm_window }` *(every tick — 1 Hz; ~480 entries for an 8-min T1 run)*
- **pause:** `{ mass_at_pause, consolidation_at_pause, tier }` *(dev-tool event; fired when the user clicks Pause)*
- **resume:** `{ mass_at_resume, paused_duration_ms }` *(dev-tool event; fired when the user clicks Resume; `paused_duration_ms` is the duration of the just-ended pause window)*
- **skip_to_tier:** `{ target_tier, mode_chain, mass_after_skip, carry_after_skip, consolidation_threshold, levels_after_skip }` *(dev-tool event; fired when the tester uses Tier skip; `mode_chain` is an array like `["completion"]` for skip-to-T2 or `["threshold","completion"]` for skip-to-T3 with T1=Threshold and T2=Completion handoff. The skip resets the session log, so this is always the FIRST event in any post-skip log.)*
- **dev_time_skip:** `{ elapsed_sec, mass_before, mass_after, mass_gained, end_reason, ticks_simulated }` *(dev-tool event; fired when the tester uses the Time-skip panel — long-burn v1 / E4. `elapsed_sec` is the wall-clock duration of the skip; `end_reason` reflects the offline runner's exit (`wallclock-exhausted` for normal completion, `max-ticks-exceeded` for hitting the 30-day safety ceiling). `ticks_simulated` is seconds actually integrated. Does NOT reset the session log; appears interleaved with normal play events.)*
- **end:** payload gained `ended_early: boolean` (2026-05-12) — true when the run was terminated via the dev "End game now" button rather than organic tier completion at MAX_TIER. Other `end` payload fields unchanged.
- **end:** `{ final_mass, final_levels, total_clicks, total_time_ms, consolidation_hit_ms, completionist_extension_ms, mass_gained_total, mass_gained_clicks, mass_gained_passive, click_share, completionist_complete: { magnetosphere, firstPhotons } }`

All `t_ms` values are now derived from `getElapsedMs()` rather than raw wall-clock — they exclude paused durations, so a session that was paused for 30 s reads as continuous in the log timeline.

---

## 8. Dev tools (added beyond original spec)

Marked visually with dashed top border and "Dev —" label so they're clearly distinct from game UI.

### Autoclicker
- Position: directly below the Pull button.
- Off/On toggle (cyan when active).
- Step buttons: −10, −1, +1, +10.
- Direct numeric input (commits on Enter or blur).
- Default cpm: **100**
- Range: clamped to **1–6000** cpm.
- Auto-stops when End Tier 1 is pressed.

### Summary log viewer
- Position: footer of play area, below End Tier button.
- Toggle button: `▸ Show summary log` ↔ `▾ Hide summary log`.
- Renders `state.log` filtered to **exclude click and tick events** — only purchases, tier transitions, pause/resume, skip, and end. The `clicks, ticks excluded` suffix in the dev row reflects this. The shared `logEventsForDisplay()` helper backs both this in-play panel and the session-end report log so they stay in sync; updated 2026-05-11 — ticks were filtered out of the live panel after a playtest screenshot showed the per-second tick stream rendering the log unshareable.
- Monospace formatted, one event per line.
- Auto-refreshes when purchase/tier_transition/pause/resume/end events fire; click and tick events skip the re-render (display would be unchanged anyway). Preserves scroll position unless already at bottom.
- Read-only lens on the log; the underlying `state.log` retains every event (live charts + `traceFromPlaytestLog` depend on ticks). The export filter in `logText()` drops only ticks — it keeps clicks for after-the-fact analysis — so the display filter is a strict superset of the export filter.

### Pause / Resume (added 2026-05-09)
- Position: in `.end-block`, beside the End Tier button (session-control siblings).
- Single button: label toggles `Pause` ↔ `Resume`. Accent-tinted (`.pause-btn.paused`) while paused; `aria-pressed` reflects the state.
- While paused:
  - 1 Hz tick interval cleared (no passive accumulation, no tick log entries).
  - Autoclicker timer cleared. The toggle is forced visually `Off` and the autoclicker control is `disabled`. A `wasAutoOnBeforePause` flag remembers whether autoclicker was on so resume restarts it.
  - Pull button is `disabled` (visible inactive styling).
  - Upgrade buy buttons are `disabled` regardless of affordability — defensive, so a stray click can't spend mass on a frozen tick.
  - End Tier button is forced disabled (pause path early-returns inside `endTier()` too, but the visible state matches).
  - `#play.is-paused` applies a 0.55-opacity fade to mass / pull / consolidation / stats / upgrades / dev-panel children — the pause button itself stays full-opacity (it's the way out).
- Session clock excludes paused durations: a `getElapsedMs()` helper subtracts `state.totalPausedMs` (cumulative) and the in-flight `Date.now() - state.pauseStartedAt` window. All session-relative reads (log timestamps, snapshot times, CPM window, threshold-hit, total-time at session end) flow through this helper.
- Refresh during pause = fresh session, same as the rest of T1 prototype. Pause state is not persisted.
- Pause state extension on `state`: `paused` (boolean), `totalPausedMs` (number, ms), `pauseStartedAt` (timestamp ms or null).

### Tier skip (added 2026-05-10, UI generalized 2026-05-11, past-T1 unblocked 2026-05-12)
- Position: dedicated dev panel below the Autoclick panel and above the Time-skip panel.
- Label: `Dev — Tier skip (replaces state)`. The "(replaces state)" parenthetical is the player-facing distinction from Time skip below it — Tier skip wholesale-replaces live state with a sim-derived target-tier start; Time skip is non-destructive offline accrual at the current tier. The Skip button's tooltip restates the warning.
- UI shape (data-driven; replaces the original 6-button panel): a `Target` `<select>` dropdown enumerates every tier in `runner.TIER_CONFIGS` STRICTLY ahead of `state.currentTier`, plus a `Handoff` row that contains one `<select>` per prior tier (`T1 ▾`, `T2 ▾`, ..., `T(target-1) ▾`), each offering `Threshold` and `Completion`. A single `Skip` button reads the selections and calls `skipToTier(targetTier, modeChain)`. As `TIER_CONFIGS` grows (T5, T6, …), the dropdown and the handoff row both grow automatically — no UI work per new tier.
- Default selection: target = the highest available forward tier (e.g. T4 from a fresh T1, T4 from mid-T3, etc.); all prior-tier handoffs = `Completion`. Selections persist across target changes when the corresponding prior tier remains in range — switching target T4 → T2 → T4 preserves the T1/T2/T3 choices the user already made. The user's current target selection also persists across render-driven option rebuilds as long as the target is still ahead of the live tier; once a tier transition makes it stale, the default falls back to the highest available forward tier.
- Visibility: the panel hides only when the player is already at `MAX_TIER` (no forward target to offer). At any other tier it stays visible — past-T1 mid-run skipping is supported as of 2026-05-12 since the long-burn pacing model makes "advance from T3 to T5 without resetting" a real testing need. Backwards skipping is not offered (Time skip is the non-destructive alternative for advancing time at the current tier). `renderSkipPanel()` is invoked from both `init()` and the main `render()` loop so dropdown contents + visibility track the live tier.
- Implementation: `skipToTier(targetTier, modeChain)` runs the runner's sim chain through every prior tier (`runSimulation` with `carryFrom` chaining), then replaces all live state with the simulator's exit state. Carry composition uses `runner.composeCarryChain`, which walks every prior tier and accumulates floors/allMults — matching the live `transitionToNextTier` semantics. The skipped-to-T3 starting state is byte-identical to what the simulator's chained `runSimulation` produces and what a player who lived through every tier transition would experience. The same holds for T4 and any future tier added to `TIER_CONFIGS`.
- State replacement: `mass`, `levels` (prior-tier upgrades populated from sim, current-and-future tiers zeroed), `carry` (from `composeCarryChain`), `currentTier`, `consolidation = 0`, `consolidationThreshold` (target tier's value), `consolidationHitMs = null`. Click counters / mass-from-* / log / clickTimestamps reset. `sessionStart` reset to `Date.now()` so the post-skip clock starts at zero — the report and comparison-vs-sim chart cover only post-skip activity.
- Tier snapshots rebuilt: synthetic zero-duration entries for skipped tiers (with `levelsAtEnd` and `massAtEnd` populated from the sim, `skipped: true`, `skipMode: <mode>` markers, and `consolidationHitMs: null` since no live play happened in them), then a fresh open snapshot for the target tier. The per-tier breakdown table reads coherently if the player completes the skipped-into tier(s).
- Mid-round behavior: reachable from the UI at any tier below MAX_TIER as of 2026-05-12. `skipToTier` still discards in-flight live-play data wholesale — that's the dev-tool semantic, intentional. The `skip_to_tier` log event records the fact and parameters of the skip, so the downloaded session log preserves a forensic trail. For non-destructive forward progress (preserve current state, advance time only), use Time skip instead.
- Click rate: the underlying sim chain runs at fixed `cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5` regardless of the live tester's autoclicker setting — the skip's purpose is to deliver a calibrated starting state, not to mirror the tester's recent click rate. Autoclicker is reset to Off after the skip; tester re-enables manually.
- Player can advance from the skipped-to tier via the normal End Tier flow — no special "skipped" flag prevents further progression.
- Pause state during skip: if paused, the skip resumes first (so the post-skip session is not stuck in a frozen state).

### Time skip — offline accrual (added 2026-05-12, long-burn v1 / E4)

- Position: dedicated dev panel directly below the Tier-skip panel, above the Consolidation bar. Element id `dev-time-skip-panel`.
- UI shape: a row of quick-fire chips (`+1h`, `+6h`, `+1d`, `+3d`, `+7d`), then a custom-amount row (numeric input + `hours`/`days` unit selector + `Skip` button + `Save now` debug button), then a status line that reads back the last skip's result.
- Always visible — unlike the Tier-skip panel, this works at any tier. The whole point is testing long-burn pacing at T2+, where calendar-time-by-engagement-profile is measured in days-to-weeks.
- Mode: **pure-idle, locked.** Calls `reconstructFromOfflineWindow(payload.game, seconds, { cpm: 0, engagement: 1.0, allowPurchases: false })`. Mass advances from MPS + APS×MPC across the skipped window; consolidation never advances, no upgrades are bought. Matches the boot-time offline-accrual semantic exactly. Honors the load-bearing rule "Consolidation does not advance without active purchase decisions" — the universe is patient, and the dev tool simulates the player being away, not the strategy AI playing for them. (S5 top-down mass tooling will use the same offline function in `allowPurchases=true` mode from the simulator tab, not from this dev panel.)
- Per-call cap: `MAX_OFFLINE_TICKS = 30 days` (defensive ceiling in `offline.js`). Multiple successive skips compose — `+7d` × 4 = 28 days total. No global cap on cumulative skipped time.
- State writeback: `mass`, `massFromClicks`, `massFromPassive`, `massFromAuto`, `tickCount` from the accrued result; `levels` / `carry` / `currentTier` / `consolidation` / `consolidationThreshold` / `consolidationHitMs` splatted for forward-compat (pure-idle mode never mutates them, but the splat tolerates future mode toggles without code rework). Session clock: `totalPausedMs += seconds * 1000` so `getElapsedMs()` reads continuously — skipped time was AFK, not play, and shouldn't gain phantom session-active minutes or skew the CPM window.
- Log event: `dev_time_skip` with pre/post mass + duration + endReason + ticks (see §7 per-type payload). Unlike Tier skip, the time-skip event does NOT reset the session log — it interleaves with normal play events so a tester can build state by alternating "play 1 min → skip 6h → play 1 min → skip 1d" and trace the trajectory in the log.
- Pause behavior: if paused, the skip resumes first (matches `skipToTier`).
- Force-save button (`Save now`): debug shortcut that calls `saveNow()` immediately, independent of the 10 s autosave interval / `beforeunload` flush. Status line confirms with a timestamp.
- Engineering plan reference: §4.4 (E4 — Dev time-skip tool, 0.5 session). Verification: pure-idle from a fresh T1 universe produces no accrual (no MPS / no APS at fresh-T1); pure-idle from a partially-built state produces income proportional to current MPS + APS×MPC × seconds. Multi-skip composition is the practical workflow.

### End game now — dev early-end + report reset (added 2026-05-12)

- **Dev button placement:** `Dev — End game now` in the `.end-block` row alongside `End Tier N` and `Pause` — same visual neighborhood as the existing session-control buttons. Available at any tier, any consolidation, any pause state. Disabled only when `state.ended` is already true (would be a double-fire). If paused, resumes first so the report-rendering pipeline doesn't observe a frozen tick.
- **Semantic:** bypasses `endTier()`'s `state.consolidation >= consolidationThreshold` gate and calls `finalizeRun({ early: true })` directly. Ends the entire run wholesale — does NOT advance tiers, does NOT auto-skip remaining content. The dev intent is "I want to see the report now," not "skip remaining tiers." Confirmation modal before firing.
- **`finalizeRun(opts)` signature:** new optional `opts.early` flag. When true, the `end` log event gets `ended_early: true` and the report header gains a ` (early)` suffix (e.g. `Tier 3 — session ended (early)`) so the report can't be mistaken for an organic finish. Active-tier snapshot still closes cleanly via `endMs` / `massAtEnd` / `levelsAtEnd`; the snapshot's `consolidationHitMs` stays null if threshold wasn't reached, and the per-tier breakdown table prints `—` for that cell.
- **Save coupling:** the early-end does NOT auto-clear the save. The 10 s autosave guards on `state.ended` already, so once finalized no further saves overwrite the mid-tier state. If the tester reloads without using the new reset button, they resume mid-tier — which is correct: the report is dev-tooling, not destructive.
- **Report-screen `Start a new universe` button:** new affordance in the report's `.log-actions` row alongside `Copy session log` and `Download log`. Calls `resetUniverse()` (the same path the Parameters tab's Reset Universe uses — `clearLocalSave()` + `location.reload()`). Available equally for organic ends and dev early-ends — previously the only reset path was the Parameters tab, which was friction.
- **Multi-tier honesty:** because `tierSnapshots` accumulates across every tier transition, the report's per-tier breakdown table renders normally (threshold-hit / tier-ended / mass-at-end per tier) even when the active tier ends mid-progress. The active-tier row shows the consolidation / mass / levels at the moment of the early end; closed-tier rows show their organic completion data.

---

## 9. Code structure

As of Phase 3 Part B of the JS sim migration, the prototype hosts the math layer, strategy + runner, and a fully functional Simulator-tab UI alongside the playtest UI. **2026-05-13 ladder renumber:** the 11-tier ladder landed in the engine (T3 Dwarf Spheroidal inserted between old T2 and old T3 Galactic Arm). `data.UPGRADES` tier numbers above T2 bumped up by one — old T3 (`Dust Lane Density` … `Active Nucleus`) now lives at T4; old T4 (`Galactic Rotation` … `Dark Matter Halo`) now lives at T5. Consolidation values on the renumbered slates rescaled × 2.5 each (single renumber step) so the engine formula `consolidation_T_n = 1.0 × consolidationGrowth^(n-1)` with `consolidationGrowth = 2.5` continues to drive the gates (T4 budget = 15.625; T5 budget = 39.0625). `TIER_CONFIGS` in `runner.js` refactored to compute `consolidationThreshold` from the formula (no hardcoded values) — implemented tiers extended to `[1..5]`; out-of-set tiers fall through `buildTierConfig(tier, data)` for harness defense. NEW T3 Dwarf Spheroidal slate (8 upgrades: `Population II`, `Subhalo`, `RR Lyrae`, `Velocity Dispersion` + one-shots `Orphan Stream`, `Sculptor Dwarf`, `Draco Dwarf`, `Sagittarius Stream`) inserted with shape-only `PHASE-2-PLACEHOLDER` numerical fields. NEW cross-tier synergy C (T2 Brown Dwarf → T3 Subhalo, additive `× (1 + 0.04 × N)`) attached via IIFE alongside the existing T2 Local Bubble → T4 HII Region (renumbered). `perTierEngagement` curve extended to 11 tiers (T3 PLACEHOLDER 0.15, T4-T11 preserve old T3-T10 values shifted up). `SAVE_VERSION 2 → 3` — v2 saves refused at load (tier renumber makes `currentTier: 3+` incoherent). Renumbered values are STALE-pending-T3/T4/T5-retune; sim-tuner will revisit. **Long-burn v1 / E1 landed 2026-05-12:** a localStorage save module (`src/sim/save.js`) plus boot-time restore + 10 s autosave + beforeunload flush + Reset-Universe affordance in the Parameters tab. **Long-burn v1 / E3 landed 2026-05-12 (same session):** a pure-function offline-accrual module (`src/sim/offline.js` — owns `reconstructFromOfflineWindow`, the load-bearing artifact of v1 per engineering plan §2) replaces the E1 boot-time freeze; mass accumulates from MPS + APS×MPC across the away window (capped at 24 h), no purchases happen during offline (load-bearing rule: "Consolidation does not advance without active purchase decisions"). **Long-burn v1 / S1 landed 2026-05-12 (same session):** a Node-only calibration harness scaffold (`src/test/harness.js`) plus the engagement-profile + buyer-profile + realistic-pairings data catalog (`src/sim/profiles.js`). Markdown + CSV report writer lands runs under `Simulator/reports/<timestamp>/`. **Long-burn v1 / S2 landed 2026-05-12 (same session):** the multi-window engagement-profile loop in `harness.js`, using `reconstructFromOfflineWindow` end-to-end. Exponential idle-gap sampling (mean = `86400 / checkInsPerDay` seconds, clamped 5 min - 14 days) alternates with check-in sessions of `sessionMinutes × 60` seconds; primary pairings (`engaged-steady × completionist` / `× consolidation-threshold`) produce real engagement-profile numbers with per-tier calendar percentiles and ±15% drift detection vs `gameplay-design.md` §1 targets (encoded in `profiles.ENGAGED_TARGETS`). Seedable mulberry32 RNG for reproducibility. **Long-burn v1 / S3 landed 2026-05-12 (same session):** the 12-pairing matrix surfaces in weight-grouped report sections (Primary / Secondary / Stress / Legacy); drift detection is gated to engaged-timing pairings only (`timingHasDriftTarget`, per plan §4 decision C1: rows 3-10 inform, rows 11-12 cross-check, only primary drives the retune); casual/drift/bot pairings show `n/a` in the drift column. New `--timing` + `--buyer` ad-hoc CLI flags for exploring outside the 12 default pairings. `activeDecay` schema slot added to `BUYER_PROFILES` (uniform 1.0 in v1, retune-ready). `lowConfidence` flag fires when DNF rate > 50% to prevent misreading percentiles computed off too few completed runs. **Long-burn v1 / E4 landed 2026-05-12 (session-pickup after T1 retune):** dev time-skip tool in the Playtest tab (`Dev — Time skip (offline accrual)` panel). Quick-fire chips (+1h / +6h / +1d / +3d / +7d) + custom amount + unit selector + `Save now` debug button. Calls `reconstructFromOfflineWindow` in locked pure-idle mode (`cpm: 0, allowPurchases: false`) — matches the boot-time offline path; consolidation never advances per the load-bearing rule. Multi-skip composition is the workflow (no cumulative cap; per-call 30-day ceiling from `MAX_OFFLINE_TICKS`). Session clock absorbs the skipped duration via `totalPausedMs` so `getElapsedMs` stays player-active. New `dev_time_skip` log event interleaves with normal play (does NOT reset the log, unlike Tier skip). Engineering plan §4.4 verification path enabled. **Tier-skip past-T1 unblocked (same session):** the `state.currentTier > 1` hide rule retired; the Target dropdown rebuilds each render to show only tiers `> state.currentTier`; the panel hides only at `state.currentTier == MAX_TIER`. Label clarified to `Dev — Tier skip (replaces state)` so the destructive-vs-non-destructive distinction from Time skip is visible at a glance. **Phase-1 onboarding one-shot cap (same session):** new optional `oneShot: true` phase flag in `TIMING_PROFILES`; applied to all 5 onboarding phases (realistic-engaged/moderate/casual/drift + hyper-onboard). `runEngagementProfileRun` in `sweep.js` reads the flag after each session ends and idle-skips the phase remainder as pure-idle accrual. Eliminates the 44-53% second-session-in-phase-1 probability the exponential idle-gap sampler was producing for casual/drift profiles. **Cap ordering bug fixed (same session, post-eyeball):** the initial cap landed BEFORE the milestone/buyLog globalSec computation, so milestones inherited a calendar-offset equal to the cap's idle duration (e.g. casual T1→T2 transition was being reported at 45.8 min when its true value was 10.75 min). Cap now fires AFTER milestone/buyLog processing, and only when target tier hasn't been reached yet — so T1-target runs no longer get padded with irrelevant idle. **Simulator-tab measurement fixes (same session, post-eyeball #2):** (a) headline `p10_s`/`p50_s`/`p90_s` in `summarizeRuns` now compute against `perTierEntrySec[targetTier+1]` (= calendar time the target tier was actually completed) rather than `totalCalendarSec` (= session-length-floor that contained the transition). Set target=T1, the sweep now shows actual T1→T2 transition time; previously every row read like its phase-1 session length. (b) Mass-band threshold gained an upper bound: `DEFAULT_MASS_BAND_HIGH = 2.0`. Ratios above the upper threshold are labeled `above-band` (informational, not failure) rather than the old binary `within-band` for everything ≥ 0.7. Surfaces the patient-universe overshoot signal cleanly — drift × thr-hoarder at 45135.6× now reads `[above-band]` instead of `[within-band]`. (c) Simulator-tab chart-stretch bug: `drawMassChart` was drawing at `clientWidth=0`-fallback dimensions when the tab was hidden on app boot, then the browser stretched the 600px-buffer to fit ~1200px container on first show. Fix: skip draw when `clientWidth === 0`, plus a `tabs.onShow('simulator', ...)` callback that redraws stored single-run results when the tab becomes visible. **End-game-early control + report reset (same session):** new `Dev — End game now` button in `.end-block` calls `finalizeRun({ early: true })` directly — bypasses consolidation gate, works at any tier, marks the report as early via header suffix + `ended_early: true` on the end log payload. New `Start a new universe` button in the report's `.log-actions` row calls `resetUniverse()` (same path as Parameters tab Reset Universe). Available for organic ends too — previously the only reset path was the Parameters tab. **Long-burn v1 / S4 landed 2026-05-12 (same session):** the mass-target band check (engineering plan §4 decision C4) plus DNF-by-reason categorization. Reference masses derived per (tier, mode) by running the continuous-bot once at harness startup (`referenceMassForTier(tier, mode)`, cached in `_referenceMassCache`). Tier-up milestones now carry a `mass` field (the exit mass of the tier just transitioned out of) — captured in `sim/offline.js` at the transition tick. `runEngagementProfileRun` and `runContinuousBotRun` both emit `perTierExitMass` on the run record. `summarizeRuns` aggregates per-tier exit-mass ratio percentiles vs reference; flags `below-band` when p50 < `MASS_BAND_LOW` (default 0.7, overridable via `--mass-band-low`), else `within-band`. DNFs categorized via `dnfReasonCategory ∈ {budget-exhausted, stuck-no-progress, incomplete, runner-error}`; aggregated as `dnfByReason` on the summary and surfaced in the headline + anomalies section. Verification per plan §4 S4 mandate: `drift-light × idle-clicker` at T4 with 3-day budget DNFs all 3 runs with `budget-exhausted=3`. Engagement profiles routinely show massive mass overshoots vs bot reference (1× → 9000+× depending on tier) — that's the patient-universe "hoarding" signal made visible. **T3 Step C landed 2026-05-13 — `carryMpsMult` hidden-channel engine extension:** `core.computeRates` extended to walk `synergyProviders` (the full owned-upgrades list) for any upgrade declaring `carryMpsMult`. The per-level coefficient compounds incoming synergies BEFORE exponentiation (`α_eff_per_level = α × synergyMult(self)`); the resulting factor (`α_eff^N`) multiplies `carryMps` ONLY — `sumMps` (the active-tier self·syn sum) is untouched. Equivalent algebraic rewrite: `mps = (carryMps × hidden_factor + sumMps) × allMps × allMpsCarry`. Subhalo flipped from its Step B `baseMps: 2.2` placeholder to `carryMpsMult: 1.10` (PHASE-2-PLACEHOLDER for sim-tuner Step D); its per-upgrade MPS/MPC/APS row now reads 0 across the board, while the mass counter rises faster than the visible sum predicts (the design's hidden-channel UX signal). `strategy.stackableVpc` gains a fourth branch (first in the chain, ahead of `addMpc`/`addAps`/passive) for `carryMpsMult > 1`, computing `delta_mps = carryMps × α_eff^N × (α_eff - 1) × gMps × carry.allMps` for the marginal +1-level income gain. No changes needed in `offline.js` or `runner.js` — the no-frozen-floors invariant means `computeRates` re-reads `state.levels[u.name]` live every tick, so Subhalo's hidden factor propagates correctly through tier transitions and offline windows. The provider walk reaches across tiers, so Subhalo continues to amplify carry once the player advances into T4+. New locked harness `validate_subhalo.js` (28 checks) covers identity, L1/L2/L3 parity, B/C synergy compounding, T3→T4 transition persistence, stat-display contract, offline integration, edge cases, purity, and strategy VPC parity. T1/T2 byte-identical preserved (p17 bot-60cpm × comp-hoarder: T1 11m 40s, T2 1h 8m, unchanged). T3 chain now completes in 1h 57m (was 14h 31m under Step B placeholder) — bot buys 33 Subhalo levels + 5 Velocity Dispersion + all 4 one-shots, signal that the hidden channel is dominant at α=1.10 (Step D sim-tuner refines). **2026-05-13 engine-wide consolidation rename:** every `cohesion*` engine identifier renamed to `consolidation*` across `sim/data.js`, `sim/runner.js`, `sim/strategy.js`, `sim/offline.js`, `sim/save.js`, `sim/sweep.js`, `sim/profiles.js`, every `ui/*.js` file (including DOM IDs `consolidation-block` / `consolidation-fill` / `consolidation-num` / `consolidation-max` / `r-chart-consolidation`, CSS variables `--consolidation-low` / `--consolidation-high`, the `consolidationLine()` chart helper, and log-payload keys `consolidation_after` / `consolidation_at_pause` / `consolidation_hit_ms` / `new_consolidation_threshold`), every test file, and `dark-filaments-t1.html`. `SAVE_VERSION 3 → 4` (v3 saves refused at load — legacy `cohesion*` keys would silently default to 0 under v4 readers). No numeric impact; engine math unchanged. T1 byte-identical at p17 bot-60cpm × Completion seed=1 (11m 40s pre/post); T2 byte-identical (1h 8m); T3 chain 1h 57m; T4 / T5 chain reach 2h 2m / 2h 2m. All locked harnesses pass: `save_migration_test` 56/56 (added v1/v2/v3 refused-load checks; was 53/53), `validate_offline` 38/38, `profiles_smoke` 396/396, `validate_subhalo` 28/28. The HTML still loads from `file://` directly — no dev server, no build step, no ES modules. **2026-05-13 evening — T3 Dwarf Spheroidal Step D numerical calibration landed (sim-tuner iter #10):** all PHASE-2-PLACEHOLDER values in the T3 slate replaced with locked numerical values under Reading B + 24-48h Engaged Comp / 18-36h Engaged Thr calendar bands. Population II initCost 25000 / costGrowth 1.135 / baseMps 8.0 / selfMps 1.12; Subhalo initCost 40000 / costGrowth 1.16 / `carryMpsMult: 1.08` (α=1.08 user-ratified, Visible band lower edge); RR Lyrae initCost 60000 / costGrowth 1.34 / addMpc 12.0; Velocity Dispersion initCost 400000 / costGrowth 2.05 / addAps 0.20 (max 5, completionist); Orphan Stream 100000 (consolidation 0.9); Sculptor Dwarf 400000 (consolidation 1.5); Draco Dwarf 8000000 (consolidation 0, completionist, allMps 1.42); Sagittarius Stream 2500000 (consolidation 3.85, T3→T4 gate). Synergy B Population II → Subhalo β=0.03 additive; synergy C T2 Brown Dwarf → Subhalo β=0.03 additive (cross-tier, user-ratified). All four engaged primary pairings within ±15% drift band (p1 -12.1%, p2 -7.1%, p3 +8.5%, p4 +14.7%). Reading B: Threshold peak ~2.5M M☉ at Sagittarius Stream gate-cross (-21% from 3.16M target, within ±0.5 dex); Comp peak ~8M M☉ at Draco purchase (+2.5× over named scale, mirrors T2 iter #24 Comp-overshoot pattern). Felt-investment: Comp p50 = 15 Subhalos, Thr p50 = 7 Subhalos (both in band). Comp-vs-Thr gap +6.9% (informational only under CD-2/NEW-1 reframe). 10 sim-tuner iterations across one-shot mass costs and Subhalo costGrowth; α and β stayed at their anchor values throughout. T1/T2 byte-identical preserved (T1 11m 40s, T2 1h 8m at p17 bot-60cpm × comp-hoarder seed=1); T3 bot baseline 9h 36m. Report path: `Simulator/reports/2026-05-13T20-44-37-276Z/`.

### File layout

```
Prototype/
  dark-filaments-t1.html       Tab shell + DOM markup + tiny bootstrap <script>
  src/
    sim/
      data.js                  UPGRADES array + DEFAULT_PARAMS + SAVE_VERSION.
                               2026-05-12 T1 retune: M☉ denomination + Reading
                               B anchor. 2026-05-13 morning T2 retune iter #24:
                               WR Star added; numbers locked. 2026-05-13
                               afternoon 11-tier ladder renumber: SAVE_VERSION
                               2 → 3 (v1 + v2 saves refused on load; v2's tier
                               renumber makes `currentTier: 3+` incoherent).
                               2026-05-13 consolidation rename: SAVE_VERSION
                               3 → 4 (v3 saves refused on load; v3's legacy
                               `cohesion*` keys would silently default to 0
                               under v4 readers).
                               Old T3 slate (9 upgrades) bumped tier 3 → 4
                               (Galactic Arm now T4); old T4 slate (10 upgrades)
                               bumped tier 4 → 5 (Galaxy now T5); consolidation
                               values on renumbered slates rescaled × 2.5
                               (PHASE-2-CONSOLIDATION-RESCALE inline tags). NEW T3
                               Dwarf Spheroidal slate (8 upgrades) inserted
                               with PHASE-2-PLACEHOLDER numerical fields
                               (shape-only; sim-tuner T3 retune workstream
                               will calibrate). NEW cross-tier synergy C (T2
                               Brown Dwarf → T3 Subhalo, additive) attached
                               via IIFE. perTierEngagement extended T1-T11
                               (T3 PLACEHOLDER 0.15; T4-T11 preserve old
                               T3-T10 values shifted up). DEFAULT_PARAMS.
                               baseMpc 1.0 → 0.00120 (T1 retune). T1 + T2
                               numerical fields unchanged from iter #24 lock
                               (byte-identical preserved); T3 / T4 / T5 numbers
                               STALE pending future retunes.
      core.js                  pure math (cost, MPC, MPS, APS, synergies)
      store.js                 tiny pub/sub matching Zustand's contract,
                               plus the shared params-store singleton
                               (getParamsStore / resetParamsStore)
      strategy.js              v1.2.1 algorithmic-player decision function
                               (greedy VPC + save mode + post-consolidation focus
                                with long-save bypass: >90s saves allow
                                non-completionist stackable interleaves
                                within ~5% time tolerance)
      runner.js                1 Hz tick-loop sim runner (runSimulation)
      save.js                  long-burn v1 / E1: localStorage persistence
                               (serializeState / deserializeState /
                                writeLocalSave / readLocalSave /
                                clearLocalSave / computeSchemaSig). Owns
                               the SavePayload <-> live-state translation
                               and version migration. E2 will extend with
                               encodeToken/decodeToken; E3's offline.js
                               consumes the SavePayload shape produced here.
      offline.js               long-burn v1 / E3+S4: pure-function offline-
                               accrual math. Exports reconstructFromOfflineWindow
                               (savedState, elapsedSeconds, profileParams)
                               -> { newState, buyLog, milestones, endReason,
                               ticks }. 1 Hz tick loop reusing core.computeRates
                               + strategy.decideAction + runner.composeCarryChain.
                               Two modes: pure-idle (allowPurchases=false, used
                               by the boot-time call) honors the universe-is-
                               patient rule and never advances consolidation; active
                               (allowPurchases=true, used by validate_offline
                               and the S2+ harness) replicates the runner's
                               strategy invocation for parity. Handles tier
                               transitions internally via composeCarryChain.
                               S4 addition: tier-up milestones carry a `mass`
                               field (exit mass of the tier just transitioned
                               out of, sampled at the transition tick) so the
                               harness can compute the per-tier mass-band
                               ratio against bot reference.
      profiles.js              long-burn v1 / S1-S4 + 2026-05-12 trajectory
                               redesign: pure-data trajectory-timing + buyer-
                               profile + realistic-pairings catalog + per-tier
                               calendar targets + drift-gating helper. The
                               2026-05-12 redesign retired the prior
                               steady-state TIMING_PROFILES (8) +
                               BUYER_PROFILES (5) catalog in favor of:
                                 - TIMING_PROFILES (6) — trajectory-based,
                                   each carrying a `phases` array with a 6-
                                   phase calendar-day schema (0-60min /
                                   60min-1day / 1-3d / 3-7d / 7-21d / 21+d).
                                   Per phase: { fromDay, toDay,
                                   checkInsPerDay, sessionMinutes, cpm,
                                   label }. Profiles: realistic-engaged /
                                   realistic-moderate / realistic-casual /
                                   realistic-drift (player trajectories),
                                   hyper-onboard (60-min single session then
                                   stops; T1 floor-time test case), bot-60cpm
                                   (continuous technical baseline).
                                 - BUYER_PROFILES (4) — axed on path ×
                                   hoarding-preference. comp-hoarder /
                                   comp-rusher / thr-hoarder / thr-rusher.
                                   `saveVpcThreshold` knob: 2.5 (hoarder)
                                   or 1.2 (rusher). Retired the prior
                                   `inSessionPurchases` and
                                   `completionistAggressiveness` axes —
                                   `inSessionPurchases=false` produces no
                                   progress under the patient-universe rule
                                   (consolidation only advances on purchase), and
                                   aggressiveness reduced to a binary `path`
                                   field that maps directly to strategy mode.
                                 - REALISTIC_PAIRINGS (17) — 4 primary
                                   (realistic-engaged × all 4 buyers) +
                                   8 secondary (moderate × 4 + casual × 4) +
                                   2 stress (drift × thr-hoarder/thr-rusher)
                                   + 2 floor (hyper-onboard × comp-hoarder/
                                   thr-rusher) + 1 legacy (bot-60cpm ×
                                   comp-hoarder). New `'floor'` weight class.
                                 - ENGAGED_TARGETS — unchanged.
                                 - activePhaseForDay(profile, calendarDays)
                                   helper: returns the active phase given
                                   elapsed calendar days, or null if the
                                   player has exhausted the profile's phase
                                   list (e.g. hyper-onboard after day 1/24).
                                 - timingHasDriftTarget(timing) gates drift
                                   detection to realistic-engaged +
                                   realistic-moderate (the only profiles
                                   ENGAGED_TARGETS is calibrated against).
                                 - lookupPairing(), primaryPairings(),
                                   describePairing(),
                                   totalTargetSecondsThroughTier() — same
                                   semantics as before.
                               Source of truth: post-T1-retune design
                               discussion 2026-05-12 (user-locked) +
                               gameplay-design.md §1. Any rebalance routes
                               through doc-keeper; rule revisions through
                               rules-guardian.
      sweep.js                 long-burn v1 / 2026-05-12 sim-core extraction:
                               browser+Node IIFE+UMD module owning the simu-
                               lation core that previously lived in test/
                               harness.js. ~640 lines. Pure functions; no
                               CLI plumbing, no file I/O, no report writing.
                               Exports runPairing, runEngagementProfileRun
                               (phase-aware multi-window loop; first session
                               at t=0 with no initial idle; zero-check-in
                               phases skip ahead via pure-idle accrual;
                               tracks perPhaseCalendarSec + perPhaseActiveSec;
                               DNF category 'player-stopped' for trajectory
                               profiles that exhaust their phase list),
                               runContinuousBotRun (uniform output shape;
                               legacy bot-60cpm pairing), summarizeRuns
                               (per-tier p10/p50/p90, drift detection gated
                               by timingHasDriftTarget, mass-band check vs
                               bot reference, DNF-by-reason aggregation,
                               lowConfidence flag at >50% DNF rate),
                               referenceMassForTier(tier, mode) +
                               referenceMassesThroughTier(targetTier, mode)
                               (cached via _referenceMassCache; computed
                               lazily via runner.runSimulation at canonical
                               bot params), resetReferenceMassCache,
                               makeRunRng (seedable mulberry32),
                               sampleIdleGapSec (exponential, mean =
                               86400/checkInsPerDay; takes a phase or timing
                               profile), freshSavedState, sortedAscending,
                               pct, plus constants DEFAULT_MASS_BAND_LOW,
                               DRIFT_THRESHOLD, LOW_CONFIDENCE_DNF_RATE,
                               SEC_PER_DAY, DEFAULT_MAX_DAYS. Browser-side
                               deps resolved lazily via a deps() helper that
                               reads from global.DF.sim.* (sync; deps are
                               loaded earlier in the script tag list), falls
                               back to Node require() on the server. Consumed
                               by both the Simulator tab UI (ui/simulator.js)
                               and the CLI harness (test/harness.js).
    ui/
      format.js                fmt / fmtCost / fmtTime / fmtLogLine
      tabs.js                  three-tab shell switcher
      charts.js                vanilla canvas charts: massOverTime,
                               consolidationLine, levelsStacked, incomeStacked
      settings.js              settings export/import (JSON + Markdown) and
                               the comparison-panel params store (Phase 5)
      playtest.js              playtest tab UI: tick loop, click/buy handlers,
                               consolidation tracking, end-tier flow, session report,
                               autoclicker, log viewer
      simulator.js             simulator tab UI: parameter strip, two-mode
                               headline, tick-by-tick trace + per-tick decision
                               detail, four canvas charts; Phase 5 added the
                               comparison panel + export-current-settings panel
      parameters.js            parameters tab UI (Phase 4): engine + strategy +
                               per-tier engagement forms, full upgrade table
                               editor (expandable rows), synergy view, reset;
                               Phase 5 added the import-settings textarea
    test/
      validate.js              Node-only validation harness
                               (parses Simulator/playtests/*.txt, runs sim,
                                prints PASS/FAIL ±6% against real timings)
      t4_calibrate_legacy.js   Legacy T4 (was T3) calibration harness.
                               Renamed from t3_calibrate.js on 2026-05-13
                               with the ladder renumber (old T3 Galactic Arm
                               now lives at T4). Runs the full T1→T2→T3→T4
                               chain across the four handoff/mode permutations
                               and prints headline times. Stale-pending-T4-
                               retune (pre-renumber +73.4 / +75.1% gap band
                               no longer comparable; the chain now includes
                               new-T3 Dwarf Spheroidal placeholder values
                               before reaching T4).
      t5_calibrate_legacy.js   Legacy T5 (was T4) calibration harness. Renamed
                               from t4_calibrate.js on 2026-05-13. Runs the
                               full T1→T2→T3→T4→T5 chain. Stale-pending-T5-
                               retune.
      t4_curve_shape_legacy.js / t4_propose_legacy.js / t4_playtest_diag_legacy.js
                               Legacy T4 (was T3) debugging tools. Renamed
                               2026-05-13; internals not touched (these
                               targeted the pre-renumber T3 slate by upgrade
                               name; the harnesses' chain logic still calls
                               `tier: 3` which now resolves to new-T3 Dwarf
                               Spheroidal — so proposals would not apply
                               correctly without further surgery). Preserved
                               for historical reference; sim-tuner will rebuild
                               equivalents during the T4 retune workstream.
      t5_curve_shape_legacy.js Legacy T5 (was T4) decile-sampler. Renamed
                               2026-05-13.
      save_migration_test.js   Long-burn v1 / E1: round-trip + schemaSig +
                               version-migration verifier for sim/save.js.
                               Locked harness — must run green after every
                               save.js change or SAVE_VERSION bump. 56 checks
                               cover round-trip parity, JSON byte-identity,
                               carry-field translation (mpsFloor ↔ carryMps),
                               schemaSig sensitivity to order/name, future-
                               version refusal, and schemaSig-mismatch warn.
                               2026-05-13 consolidation rename adds v1/v2/v3
                               refused-load checks (+3 over the 53-check
                               baseline).
      validate_offline.js      Long-burn v1 / E3 + S4: numerical parity test
                               between offline.reconstructFromOfflineWindow
                               and runner.runSimulation. Locked harness —
                               must run green after every offline.js change.
                               38 checks: 400 s exact-level parity at 100 cpm
                               (precondition: neither side transitions in
                               the window), boot-time pure-idle correctness
                               (no purchases, MPS-only mass growth), APS
                               pure-idle accrual, edge cases (0 / negative /
                               NaN elapsedSeconds), purity (input not mutated,
                               deterministic), and tier-transition handling
                               (T1 → T2 across a 900 s window, S4 mass field
                               on tier-up milestone).
      validate_subhalo.js      T3 Step C (2026-05-13): carryMpsMult hidden-
                               channel engine extension parity test. Locked
                               harness — must run green after every change to
                               core.computeRates, strategy.stackableVpc, or
                               the Subhalo data.js entry. 28 checks: identity
                               (0 levels → factor 1.0), L1/L2/L3 no-synergy
                               parity, Population II additive synergy
                               compounds the per-level coefficient before
                               exponentiation, Brown Dwarf cross-tier additive
                               synergy compounds (provider walks T2 → T3),
                               B+C combined factor, T3 → T4 transition
                               persistence (Subhalo continues to amplify
                               carryMps in T4), stat-display contract (Subhalo
                               row reads 0 on every stat), offline accrual
                               integration (pure-idle window applies hidden
                               factor identically to active path), carryMps=0
                               edge, no-op for T1 (no upgrade declares
                               carryMpsMult → byte-identical to computeMps),
                               purity, and strategy VPC parity (analytic
                               delta_mps / nextCost matches stackableVpc).
      harness.js               Long-burn v1 / S1-S4 + 2026-05-12 sim-core
                               extraction: Node-only CLI calibration harness.
                               After the 2026-05-12 extraction this file is
                               CLI-ONLY — sim-core (runPairing,
                               runEngagementProfileRun, runContinuousBotRun,
                               summarizeRuns, referenceMassForTier,
                               makeRunRng, etc.) moved to sim/sweep.js.
                               harness.js now owns: argument parsing
                               (--pairing / --timing / --buyer / --n /
                               --target / --report / --primary-only / --seed /
                               --max-days / --mass-band-low / --list /
                               --help), run-list construction, markdown +
                               CSV report writers, file I/O under
                               Simulator/reports/<timestamp>/, and the main
                               entry. Constants (DEFAULT_MAX_DAYS,
                               SEC_PER_DAY, DRIFT_THRESHOLD,
                               DEFAULT_MASS_BAND_LOW,
                               LOW_CONFIDENCE_DNF_RATE) are re-exported from
                               sweep.js so external scripts that referenced
                               them from harness.js stay working without
                               churn. After the trajectory profile redesign
                               (same session): primary pairings p1-p4 are
                               realistic-engaged × all 4 buyer profiles;
                               secondary/stress/floor/legacy weights pull
                               from the new 17-pairing matrix; idle-gap
                               sampling is phase-aware (mean =
                               86400/phase.checkInsPerDay; phases with
                               checkInsPerDay=0 skip ahead via pure-idle
                               accrual). DNF reason categories now also
                               include 'player-stopped' (trajectory profile
                               exhausted its phase list before reaching
                               target tier).
      profiles_smoke.js        Long-burn v1 / S1-S4 + 2026-05-12 trajectory
                               redesign + 2026-05-13 ladder renumber: catalog +
                               harness verifier. Locked harness — must run
                               green after every profiles.js / sweep.js /
                               harness.js / data.js change.
                               396 checks (was 394; one assertion update for
                               MAX_TIER 4 → 5 reflecting the 11-tier renumber).
                               Was 240 under the prior steady-state catalog;
                               +154 for the 6-trajectory / 4-buyer / 17-
                               pairing redesign, phase-aware multi-window
                               loop, activePhaseForDay, phase shape
                               integrity, perPhase tracking, 'player-stopped'
                               DNF category, new floor/stress weight
                               classes). Includes: catalog integrity,
                               lookup helpers, CLI arg parsing (incl
                               --max-days, --timing, --buyer, --mass-band-low),
                               ENGAGED_TARGETS shape
                               (T1-T10 both modes; T9 inversion: completion <
                               threshold; T10 sum 27-40d), RNG determinism,
                               end-to-end smoke (all 12 pairings render
                               cleanly, weight sections present, drift
                               correctly gated to engaged-timing pairings),
                               activeDecay schema (S3: every buyer profile
                               carries {early, mid, late} all uniform 1.0),
                               timingHasDriftTarget gating (engaged-* → true,
                               casual/drift/bot → false), ad-hoc pairing
                               CLI (--timing + --buyer synthesizes
                               weight='ad-hoc' pairing; unknown profile
                               throws), drift-gating behavior (engaged
                               pairing → driftFlag populated; casual
                               pairing → driftFlag + target both null),
                               low-confidence flag (fires when DNF rate
                               > 50%), report writer weight sections
                               (Primary / Secondary / Stress / Legacy /
                               Ad-hoc all render, cross-pairing table
                               includes Weight column, non-engaged rows
                               show 'n/a' for drift). S4 additions:
                               --mass-band-low CLI flag, perTierExitMass
                               populated on completed runs, summary carries
                               referenceMass + massRatioP50 + bandFlag per
                               tier + massBandLow + dnfByReason; per-tier
                               completedAtP10/P50/P90 (cumulative calendar-
                               second at tier-crossing; feeds the Sweep
                               view's intermediate-tier P50 columns); DNF
                               induction (drift × idle-clicker, T2, 0.5d
                               budget) produces all-DNF + budget-exhausted
                               category aggregation; report writer renders
                               Mass-band-low headline + Ratio/Band columns
                               + Tn_band cross-pairing column; CSV header
                               includes dnf_reason_category + tN_exit_mass.
```

### Tab shell (Phase 2 / Phase 3 Part B / Phase 4)

Top-level `<div class="tab-bar">` contains three `<button class="tab-btn" data-tab="...">` elements (Parameters / Simulator / Playtest). Each tab's content lives in a sibling `<div data-tab-panel="...">`. `DF.ui.tabs.init({ defaultTab: "playtest" })` wires the click handlers, sets `aria-selected`, and toggles `.hidden` on the non-active panels.

- **Parameters** — built up at boot by `DF.ui.parameters.init()` (Phase 4). Empty `<div data-tab-panel="parameters">` in the static HTML; the parameters module injects its own DOM and styles on init. Six sections: engine, strategy + default scenario, per-tier engagement curve, upgrade table editor, synergy table view, reset-to-default with inline confirmation.
- **Simulator** — built up at boot by `DF.ui.simulator.init()` (Phase 3 Part B). Empty `<div data-tab-panel="simulator">` in the static HTML; the simulator module injects its own DOM and styles on init.
- **Playtest** — the existing T1 game (`#play` + `#report-wrap`); identical DOM and behavior to pre-Phase-2.

Default visible tab on load: **Playtest**.

The Parameters tab uses a singleton **params store** (`DF.sim.getParamsStore()`, lazy-created on first access) to hold its editable state. The store holds `{ params, upgrades }` cloned from `DF.sim.data.DEFAULT_PARAMS` and `UPGRADES`, so reset (`DF.sim.resetParamsStore()`) returns to defaults without mutating either source. **2026-05-12 simulator rebuild:** the prior Simulator-tab cross-sync (cpm / engagement / saveVpcThreshold strip wired into the same params store, debounced auto-rerun on either side) was retired in the trajectory-profile rebuild — the Simulator tab now drives runs through `DF.sim.sweep` + buyer/timing profile dispatch instead. Parameters-tab edits still propagate within the Parameters tab via `store.subscribe()` (Self-edit suppression flag handles the input-focus case), and the underlying `DEFAULT_PARAMS` / `UPGRADES` they target are what `sweep.js` reads at run start.

### Loading pattern

Each module is an IIFE that attaches its exports to `window.DF.sim.*` or `window.DF.ui.*`. The HTML loads them in dependency order, then runs a small bootstrap:

```html
<script src="src/sim/data.js"></script>
<script src="src/sim/core.js"></script>
<script src="src/sim/store.js"></script>
<script src="src/sim/strategy.js"></script>
<script src="src/sim/runner.js"></script>
<script src="src/sim/save.js"></script>
<script src="src/sim/offline.js"></script>
<script src="src/sim/profiles.js"></script>
<script src="src/sim/sweep.js"></script>
<script src="src/ui/format.js"></script>
<script src="src/ui/tabs.js"></script>
<script src="src/ui/charts.js"></script>
<script src="src/ui/settings.js"></script>
<script src="src/ui/playtest.js"></script>
<script src="src/ui/simulator.js"></script>
<script src="src/ui/parameters.js"></script>
<script>
  "use strict";
  DF.ui.tabs.init({ defaultTab: "playtest" });
  DF.ui.playtest.init();
  DF.ui.parameters.init();
  DF.ui.simulator.init();
</script>
```

`sim/save.js` loads after `runner.js` — order isn't load-bearing (save.js reads `DF.sim.data` lazily inside its serialize/deserialize functions), but the placement keeps sim-core modules grouped before UI. `sim/offline.js` loads after `save.js` (E3 reads SavePayload-shaped state; the dependency direction is offline → save). `sim/profiles.js` follows offline.js — the Simulator tab reads `ENGAGED_TARGETS` for drift detection. `sim/sweep.js` (2026-05-12 sim-core extraction) loads after profiles.js + offline.js + runner.js + data.js — its `deps()` helper resolves these synchronously from `global.DF.sim.*` on the browser side at construction time, so load order matters here. The old `sim/playtest_refs.js` was deleted in the same 2026-05-12 retune (pre-retune T1 playtest references no longer apply at the M☉ scale; the within-band indicator was removed from the playtest UI). All other `sim/*.js` files resolve their deps lazily and are order-tolerant inside the sim block.

`DF.ui.parameters.init()` runs before `DF.ui.simulator.init()` so the shared params store is populated before the simulator subscribes — the order isn't load-bearing (the store is lazy, both modules tolerate either order), but it keeps the bootstrap deterministic.

The `sim/*.js` files have UMD-style `module.exports` shims at the bottom so they can be `require()`'d from a Node test harness (used by Phase 3+ regression tests). UI files are browser-only and don't need the shim.

### Export shapes

**`DF.sim.data`**
- `UPGRADES` — array of upgrade objects (same schema as section 1 of this doc)
- `SAVE_VERSION` (long-burn v1 / E1) — schema version stamped onto every SavePayload. Currently **`4`**. Lineage: v1 → v2 (2026-05-12 M☉ retune; unit-scale shift from arbitrary mass units to M☉); v2 → v3 (2026-05-13 ladder renumber; T3 Dwarf Spheroidal insertion bumped `currentTier` 3+ incoherent); v3 → v4 (2026-05-13 consolidation rename; legacy `cohesion*` keys would silently default to 0 under v4 readers). `sim/save.js`'s `deserializeState` refuses v1/v2/v3 payloads with `{ error: 'pre_retune_save_version_<N>' }`; affected players start a fresh universe. Bumped whenever `SavePayload`'s shape OR semantic scale changes.
- `DEFAULT_PARAMS` — `{ tickIntervalMs, baseMpc, baseMps, consolidationThreshold, consolidationGrowth, cpmWindowMs, autoCpmDefault, autoCpmMin, autoCpmMax, cpm, saveVpcThreshold, longSaveTimeThresholdSec, longSaveTolerance, engagement, scenario, perTierEngagement }`. Mirrors section 4 plus the Parameters-tab-surfaced fields added in Phase 4.
  - `consolidationGrowth` (default 2.50): used to derive future tiers' consolidation thresholds via `consolidation_T_n_to_T_n+1 = consolidationThreshold × consolidationGrowth^(n-1)`. Inert at T1.
  - `cpm` (default 100): default click rate for fresh sim runs. Display-only canonicalization; the runner still defaults internally.
  - `saveVpcThreshold` (default 1.5): the strategy's most sensitive single tunable.
  - `longSaveTimeThresholdSec` (default 90): post-consolidation long-save bypass gate. When the active completionist save would take longer than this, the strategy is allowed to interleave non-completionist stackable buys whose income gain shortens the path to the completionist target enough that the total save time grows by no more than `longSaveTolerance`.
  - `longSaveTolerance` (default 1.05): max acceptable ratio of (save time with the interleave) ÷ (save time without). 1.05 = up to ~5% extension permitted. Inert at T1 because T1 saves never reach the 90s threshold; engaged at T2+.
  - `engagement` (default 1.0): global engagement multiplier applied on top of `perTierEngagement[tier]`. The Simulator quick-strip surfaces this; the Parameters tab also has it.
  - `scenario` (default `'completion'`): default mode for fresh sim runs. The Simulator strip can override per-run.
  - `perTierEngagement`: `{ 1..10 → number }`. The expected engagement at each tier (T1=1.00, T5=0.50, T10=0.30, etc.). The runner uses `perTierEngagement[scenario.tier] × engagement` for per-tick click income; falls back to `engagement` alone if a tier value is missing.

**`DF.sim.core`** — pure functions; no DOM, no timers, no closure over UI state.
- `selfContrib(N, B, A, S)` — implements section 3's formula; `0` when `N === 0`
- `synergyMult(targetName, levels, upgrades)` — `Π provider.multiplier^providerLevel`
- `computeMpc(state, upgrades)` — `(1.0 + Σ selfContrib_mpc · synergyMult) · Π allMpc^N`
- `computeMps(state, upgrades)` — `(0   + Σ selfContrib_mps · synergyMult) · Π allMps^N`
- `computeAps(state, upgrades)` — same shape as MPS; T1 returns `0` for any state
- `computeRates(state, upgrades, carry, params, synergyProviders?)` — single-pass composed rate; folds carry payload + active-tier upgrades + hidden MPS channel (`carryMpsMult`) into `{ mps, mpc, aps }`. The hidden-channel walk applies `α_eff^N` to `carryMps` only; the active-tier `sumMps` is untouched.
- `cost(upgrade, level)` — `initCost · costGrowth^level`, or `null` if `level >= maxLevels`

`state` is read for `state.levels[upgradeName]` only. The thin `computeMpc`/`computeMps`/`costToBuy` wrappers that bridge UI state to these pure functions now live in `src/ui/playtest.js`.

**`DF.sim.createStore(initialState)`** — Zustand-compatible vanilla store.
- `getState()`
- `setState(updater | partial)` — function or shallow-merged partial
- `subscribe(fn)` → returns `unsubscribe()`

Not yet wired into the playtest tick loop — present for the future React port to consume without rewrites.

**`DF.sim.getParamsStore()`** (Phase 4) — singleton store, lazy-created on first access. Holds `{ params, upgrades }` cloned from `DF.sim.data.DEFAULT_PARAMS` and `UPGRADES`. Both the Simulator-tab quick-strip and the Parameters-tab full editor read + write through this store; edits in either place propagate via `subscribe()`. The simulator subscribes and debounces a re-run on every change.

**`DF.sim.resetParamsStore()`** (Phase 4) — replaces both `params` and `upgrades` with fresh deep clones of the data-layer defaults. Driven by the Parameters tab's "Reset all to defaults" button (with inline confirm).

**`DF.sim.save`** (long-burn v1 / E1) — owns localStorage persistence + the SavePayload ↔ live-state translation.
- `LOCAL_KEY` — `'dark-filaments:save:v1'`. Single dev save per browser; multi-tab is explicitly out of scope per engineering plan §8.
- `serializeState(liveState, opts)` — projects the playtest module's live `state` object into the canonical `SavePayload` (per engineering plan §3). Translates the playtest's relic carry field names (`mpsFloor`/`mpcFloor`/`apsFloor`) to the canonical names (`carryMps`/`carryMpc`/`carryAps`) so future modules (`offline.js`, `harness.js`) see one shape. Does NOT persist the live `log`, click timestamps, pause state, or autoclicker on/off — those are transient per the spec.
- `deserializeState(payload)` — round-trips a `SavePayload` back into the same shape, with version migration. Returns `null` on malformed input, `{ error: 'newer_save_version', payload: null }` when the persisted version exceeds `SAVE_VERSION`, `{ error: 'pre_retune_save_version_<N>', payload: null }` when the persisted version is OLDER than current (2026-05-12 addition — the M☉ unit-scale shift between v1 and v2 is ambiguous to invert; v1 saves are refused and the player starts a fresh universe), or a deserialized payload with `schemaSigCurrent` + `schemaSigMismatch` flags appended. Mismatched schemaSig (same version, different upgrade list) surfaces as a warn-and-load (per §10 open item 2 recommendation for v1 dev tool).
- `writeLocalSave(payload)` / `readLocalSave()` / `clearLocalSave()` — wrap `localStorage.{set,get,remove}Item` with try/catch (Safari private mode etc. throw on access). Return `null`/`false` on failure rather than escalating.
- `computeSchemaSig(upgrades)` — FNV-1a 32-bit hash over `tier:name` joined in array order. Stable cross-platform (Node + browser), no `crypto` dependency. Sensitive to upgrade order AND name changes; insensitive to per-upgrade field tweaks (good — calibration retunes shouldn't invalidate saves).

**Save lifecycle (long-burn v1 / E1 + E3).** On `DF.ui.playtest.init()`: `save.readLocalSave()` → `save.deserializeState()` → if good, `restoreFromSave()` splats fields back into the playtest's `state` object before `buildUpgrades()` runs (so upgrade rows render at restored levels). The offline gap `Date.now() - payload.savedAt` is capped at 24 h (per engineering-plan §3) and fed to `DF.sim.offline.reconstructFromOfflineWindow` in pure-idle mode (`allowPurchases: false`, `cpm: 0`); the function returns a new SavePayload-shaped state with mass + per-bucket income counters advanced from MPS + APS×MPC accrual across the gap (no purchases, no tier transitions — honors the load-bearing universe-is-patient rule). The capped gap is also added to `state.totalPausedMs` so `getElapsedMs()` reads continuously across the boundary (the away time is mathematical game time, not session time). An `offline_accrual` log event is stamped on the live log for visibility. Autosave runs on a 10 s `setInterval` (paused/ended runs skip), plus explicit `saveNow()` calls on `transitionToNextTier()`, `skipToTier()`, and `beforeunload`. The Parameters tab's "Reset universe" button (long-burn v1 / E1 affordance, distinct from "Reset all to defaults") calls `clearLocalSave()` and reloads. End-of-run state is not autosaved (the run is over; saving would just re-snapshot a frozen state).

**`DF.sim.profiles`** (long-burn v1 / S1-S4 + 2026-05-12 trajectory redesign) — pure-data trajectory-timing + buyer-profile + realistic-pairings catalog + per-tier calendar targets + drift-gating helper. No logic, no DOM. Source of truth: post-T1-retune design discussion 2026-05-12 (user-locked) + [gameplay-design.md §1](../Design%20Documents/gameplay-design.md).
- `TIMING_PROFILES` — **6** profiles keyed by name (was 8 under the prior steady-state catalog). Trajectory-based — each player profile carries a `phases` array with a 6-phase calendar-day schema. Per phase: `{ fromDay, toDay, checkInsPerDay, sessionMinutes, cpm, label, oneShot? }` covering 0-60min (`onboard`, `oneShot: true`) / 60min-1day (`same-day`) / 1-3d (`peak`) / 3-7d (`routine`) / 7-21d (`taper`) / 21+d (`drift`). The optional `oneShot` flag (added 2026-05-12, playtest-tab review) caps the phase to exactly one session — applied today to all realistic + hyper onboarding phases so the exponential idle-gap sampler can't fire a second session inside the 60-min onboarding window (previously ~44-53% probability for casual/drift). Non-oneShot phases keep their natural Poisson behavior. The harness's `runEngagementProfileRun` reads `sessionPhase.oneShot` after each session ends; if true, idle-skips the remainder of the phase as pure-idle accrual before continuing. Profiles:
  - `realistic-engaged` (primary; ~3-4 check-ins/day in peak, 60-min onboarding, sustained engagement through drift).
  - `realistic-moderate` (secondary; ~2-3 check-ins/day peak, ~45 min onboarding, mid-tier engagement).
  - `realistic-casual` (secondary; ~1-2 check-ins/day peak, sporadic by week 2+).
  - `realistic-drift` (stress; brief onboarding, doesn't come back same day, essentially gone after week 3; expected to DNF on late tiers).
  - `hyper-onboard` (floor; single 60-min onboarding session then stops — no further phases. T1 floor-time test case; expected to DNF on T2+).
  - `bot-60cpm` (legacy; `continuous: true` + `cpm: 60`. Technical baseline — what is mechanically possible).
- `BUYER_PROFILES` — **4** profiles keyed by name (was 5). Axed on `path × hoarding-preference`. Shape: `{ path, saveVpcThreshold, notes }`.
  - `comp-hoarder` — completion path, `saveVpcThreshold: 2.5` (deep stackable build before one-shots).
  - `comp-rusher` — completion path, `saveVpcThreshold: 1.2` (rushes one-shots + completionists).
  - `thr-hoarder` — threshold path, `saveVpcThreshold: 2.5` (deep stackable build before tier-out).
  - `thr-rusher` — threshold path, `saveVpcThreshold: 1.2` (minimum-spend tier-out).
  - Retired axes: `inSessionPurchases` (without in-session buys there's no tier progress under the patient-universe rule; a "never buys" profile isn't a player); `completionistAggressiveness` (collapsed to the binary `path` field, which maps directly to `strategy.decideAction`'s mode).
  - Retired field: `activeDecay` (the prior S3 scaffolding for per-tier-band attention multipliers; the new trajectory profiles carry per-phase cpm explicitly via the phase shape, which makes the activeDecay slot redundant).
- `REALISTIC_PAIRINGS` — **17** entries (was 12): `{ id ("p1"-"p17"), timing, buyer, n, weight, dnfExpected? }`. Weights:
  - **`primary`** (calibration-deciding; N=50): p1-p4 — `realistic-engaged` × all 4 buyers.
  - **`secondary`** (informs but does not gate; N=30 for moderate, N=20 for casual): p5-p8 — `realistic-moderate` × all 4 buyers; p9-p12 — `realistic-casual` × all 4 buyers.
  - **`stress`** (adversarial; high-DNF expected; N=20): p13-p14 — `realistic-drift` × `thr-hoarder`/`thr-rusher` (completion path is unrealistic for drift).
  - **`floor`** (new weight class — fastest-possible-time bounds; N=10): p15-p16 — `hyper-onboard` × `comp-hoarder`/`thr-rusher`.
  - **`legacy`** (technical baseline; N=10): p17 — `bot-60cpm` × `comp-hoarder`.
- `ENGAGED_TARGETS` — unchanged from S2. Per-tier calendar-second ranges in both `completion` and `threshold` modes, T1-T10. From gameplay-design.md §1 verbatim. Shape: `ENGAGED_TARGETS[mode][tier] = { low, high, label }`. Drift detection compares run p50 to midpoint; ±15% flags HIGH. The T9 inversion (completion → 3-4 d, threshold → 7-10 d) is the design's central thesis encoded as math.
- `activePhaseForDay(profile, calendarDays)` (NEW 2026-05-12) — returns the active phase given elapsed calendar days, or `null` if the profile is continuous or its phase list is exhausted (e.g. `hyper-onboard` after day 1/24 — player has stopped). Drives the harness's phase-aware multi-window loop.
- `lookupPairing(idOrName)` — resolves a pairing by `id` ("p1") OR by canonical name (`<timing>-x-<buyer>`, e.g. "realistic-engaged-x-comp-hoarder"). The latter form is what the CLI `--pairing` flag takes.
- `primaryPairings()` — filter to `weight === 'primary'` (drives `--primary-only`).
- `describePairing(p)` — returns `{ id, label, n, weight, dnfExpected, timing, buyer }` joining the pairing with its referenced profile data.
- `totalTargetSecondsThroughTier(mode, tier)` — sums per-tier ranges to give a total target. Engaged Completion T10 sums to ~27-40 days (4-6 weeks); Engaged Threshold T10 sums longer (the inversion).
- `timingHasDriftTarget(timingName)` — returns `true` for `realistic-engaged` + `realistic-moderate`, `false` for casual / drift / hyper-onboard / bot-60cpm. Drives the harness's drift-detection gating: only profiles ENGAGED_TARGETS is calibrated against get drift comparisons. Everything else gets percentiles + `n/a` for drift (informational only).

**`DF.sim.offline`** (long-burn v1 / E3 + S4) — pure-function offline accrual math. The load-bearing artifact of v1 per engineering plan §2.
- `reconstructFromOfflineWindow(savedState, elapsedSeconds, profileParams)` → `{ newState, buyLog, milestones, endReason, ticks }`. Same inputs always produce same outputs; input `savedState` is NOT mutated. Internally clones, runs a 1 Hz tick loop (`core.computeRates` for rates → income accrual → optional `strategy.decideAction` → action application → loop), and returns a fresh SavePayload-shaped state object plus an event ledger. Honors the load-bearing rule "Consolidation does not advance without active purchase decisions" via `profileParams.allowPurchases` (false → no `decideAction` call, no transitions, no consolidation change; true → full strategy pipeline). Handles intra-window tier transitions by calling `runner.composeCarryChain` to recompose carry across all prior tiers, then refreshing the active upgrade slice. `endReason` is `"wallclock-exhausted"` (full window simulated), `"max-tier-reached"` (T_max transitioned out), or `"max-ticks-exceeded"` (defensive ceiling at 30 days). S4 addition: tier-up milestones now carry a `mass` field (exit mass of the tier just transitioned out of, sampled at the transition tick) — used by the harness's per-tier mass-band check.
- `MAX_OFFLINE_TICKS` — safety ceiling of 30 days at 1 s/tick (= 2,592,000). The boot-time call caps the input at 24 h before invocation; the harness slices longer windows externally. This bound prevents a malformed elapsedSeconds (NaN, large coerced value) from spinning the engine forever.
- Buyer-profile shape (`profileParams`): `{ cpm: 0|positive, engagement: 1.0, allowPurchases: false|true, mode: "completion"|"threshold", saveVpcThreshold: 1.5, longSaveTimeThresholdSec: 90, longSaveTolerance: 1.05, perTierEngagement?: {1..10 → n}, upgrades?: <override> }`. Maps directly to the existing `strategy.decideAction` `params` contract; no strategy refactor needed (the §10 #3 open item resolved cleanly — strategy was already pure with respect to `params`).
- Used in three places per engineering plan §2: boot-time (`ui/playtest.js` `restoreFromSave`), dev time-skip (E4), harness multi-window loop (S2+). E2 (save token codec) is independent.

**`DF.sim.sweep`** (long-burn v1 / 2026-05-12 sim-core extraction) — browser+Node simulation core that previously lived inside `test/harness.js`. Pure functions; no CLI plumbing, no file I/O, no report writing. Loaded as a regular `<script>` (after `data` / `core` / `strategy` / `runner` / `save` / `offline` / `profiles`); its `deps()` helper resolves the sim modules synchronously from `global.DF.sim.*` on the browser side and falls back to Node `require()` on the server. Consumed by `ui/simulator.js` (in-browser Simulator tab) and `test/harness.js` (CLI).
- Constants: `DEFAULT_MAX_DAYS` (365), `SEC_PER_DAY` (86400), `DRIFT_THRESHOLD` (0.15), `DEFAULT_MASS_BAND_LOW` (0.7), `LOW_CONFIDENCE_DNF_RATE` (0.5).
- `runPairing(pairing, targetTier, args)` → `{ pairing, runs, summary }`. Dispatches on `pairing.timing` — continuous bot pairings (e.g. `bot-60cpm`) route through `runContinuousBotRun`; trajectory profiles route through `runEngagementProfileRun`. The legacy `bot-100cpm` pairing was retired in the trajectory redesign — `bot-60cpm` is the sole continuous baseline.
- `runEngagementProfileRun(pairing, timing, buyer, targetTier, mode, rng, maxDays)` — phase-aware multi-window loop. First session fires at t=0 with no initial idle (the player's first action is the first action). Each iteration: (a) call `activePhaseForDay(timing, currentCalendarDays)`; (b) if phase has `checkInsPerDay === 0`, skip ahead via pure-idle `reconstructFromOfflineWindow` to the phase's `toDay` boundary; (c) otherwise, sample an idle gap via `sampleIdleGapSec(phase, rng)` (exponential, mean = `86400/phase.checkInsPerDay`, clamped 5min-14d), apply pure-idle accrual across the gap, then run a check-in session of `phase.sessionMinutes × 60` s with `cpm = phase.cpm`, `allowPurchases = true`, mode from buyer's `path` field. Tracks `perPhaseCalendarSec` + `perPhaseActiveSec` per phase label. Per-tier entry timestamps captured via tier-up milestones. `MAX_ZERO_PROGRESS = 200` stuck guard for DNF detection. New DNF category `'player-stopped'` fires when `activePhaseForDay` returns null (phase list exhausted before target tier reached).
- `runContinuousBotRun(pairing, timing, buyer, targetTier, mode)` — uniform output shape with `runEngagementProfileRun` (`totalCalendarSec`, `totalActiveSec`, `perTierEntrySec`, `perTierActiveSec`, `perTierExitMass`, `perPhaseCalendarSec`/`perPhaseActiveSec` set to a single `'continuous'` bucket). Drives `runner.runSimulation` chained 1..targetTier at `timing.cpm` continuous.
- `summarizeRuns(runs, targetTier, mode, pairing, opts)` — per-tier p10/p50/p90 across completed runs; DNFs excluded from percentiles. Drift detection gated by `profiles.timingHasDriftTarget(pairing.timing)` — `realistic-engaged` + `realistic-moderate` get populated `target` + `driftPct` + `driftFlag` fields; everything else gets nulls (informational only). `lowConfidence: true` when DNF rate exceeds `LOW_CONFIDENCE_DNF_RATE` (50%); overrides individual drift flags with `'low-confidence'`. Mass-band check vs `referenceMassForTier(tier, mode)` populates `referenceMass` + `massRatioP10/P50/P90` + `bandFlag` per tier; `'below-band'` fires when ratio p50 < `opts.massBandLow` (default `DEFAULT_MASS_BAND_LOW = 0.7`). `dnfByReason` aggregates DNFs by category (`budget-exhausted`, `stuck-no-progress`, `incomplete`, `runner-error`, `player-stopped`).
- `referenceMassForTier(targetTier, mode)` — runs `runner.runSimulation` chained 1..targetTier at canonical bot params, returns exit mass. Cached in `_referenceMassCache` keyed by `mode:tier` (computed lazily, once per process). `referenceMassesThroughTier(targetTier, mode)` returns `{ 1, 2, ..., targetTier }` in one shot. `resetReferenceMassCache()` clears the cache (used by the in-browser Simulator tab when the user re-runs after a Parameters-tab edit).
- `makeRunRng(baseSeed, runIdx)` — mulberry32 seedable RNG; same `(baseSeed, runIdx)` → byte-identical sequence.
- `sampleIdleGapSec(timingOrPhase, rng)` — exponential idle-gap sampler with mean = `86400 / checkInsPerDay`, clamped to `[5 min, 14 days]`. Accepts either a timing profile (legacy, for continuous bots — derives from top-level checkInsPerDay) or a phase object (trajectory profiles — derives from `phase.checkInsPerDay`).
- `freshSavedState()` — produces an empty SavePayload-shaped state for a run start (mass: 0, all levels: 0, currentTier: 1, etc.).
- `sortedAscending(values)` + `pct(sortedAsc, p)` — exposed for the report writers (and exercised by `profiles_smoke.js`).

**`DF.ui.format`** — display-side formatters. 2026-05-12 retune: `fmtMass` + `fmtCost` rebuilt with adaptive precision for the M☉ scale; the prior `fmt(n, 1)` / `Math.ceil(c)` shapes were unreadable below 1 M☉ (early-T1 click values rendered as "0.0", costs collapsed to "1").
- `fmt(n, d)` — `n.toFixed(d)`. Legacy; kept for non-mass display (cpm, percentages, raw MPS/MPC values where the caller knows the precision).
- `fmtMass(n)` — adaptive precision keyed by magnitude. `abs < 1e-3` → scientific (e.g. `1.20e-3`); `< 1` → 3 decimals (T1-scale clicks + saves); `< 100` → 2 decimals; `< 1e5` → integer + thousands separator; `>= 1e5` → scientific. Returns `'—'` on null / NaN; `'0'` on exact 0.
- `fmtCost(c)` — same adaptive shape as `fmtMass`. Replaces the prior `Math.ceil(c).toString()` which collapsed all sub-M☉ T1 costs (0.012 / 0.40 / 0.96) to "1".
- `fmtTime(ms)` — `mm:ss`.
- `fmtLogLine(event)` — formats one log event into a single human-readable line; click events are typically filtered out by the caller. Reads `fmtMass` for mass values inside the log line.

**`DF.ui.tabs`** — three-tab shell.
- `init({ defaultTab })` — wires click handlers and shows the default panel.
- `setActive(tabId)` — programmatic switch (used internally by click handlers; exposed for future deep-link / bootstrap use).
- `onShow(tabId, fn)` — register a callback that fires every time the named tab becomes the active panel (after the panel is taken out of `display: none`). Used by the simulator module to defer chart rendering until its canvases have a real laid-out size.

**`DF.ui.playtest`** — playtest tab UI logic.
- `init()` — long-burn v1 / E1: runs `DF.sim.save.readLocalSave()` → `deserializeState()` → `restoreFromSave()` first (universe frozen across the offline gap; mass accrual replaces this in E3). Then builds the upgrade rows, attaches all DOM event handlers (pull, buy, end-tier, autoclicker, log viewer, copy/download), starts the 1 Hz tick interval, starts the 10 s autosave interval, and registers the `beforeunload` flush.
- `resetUniverse()` (long-burn v1 / E1) — wipes `localStorage` and reloads the page so the playtest comes up at the fresh-T1 default. Called by the Parameters tab's "Reset universe" button.

All `state` and timer variables for the playtest live inside the `playtest.js` IIFE closure — nothing leaks to the global scope beyond `DF.ui.playtest`.

**`DF.sim.strategy`** — algorithmic-player decision function (v1.2.1 strategy port + v5-M long-save bypass + T3 cross-tier + Threshold-mode mask).
- `decideAction(state, params, upgrades)` → one of:
  - `{ action: "transition" }` — consolidation threshold met AND all required completionists maxed (Threshold mode treats no completionists as required; see below)
  - `{ action: "buy", upgrade, cost }` — cheapest affordable unowned one-shot, or affordable stackable with max VPC, or (T3+) cheapest affordable consolidation-only stackable level
  - `{ action: "save", target }` — save-mode active (next-target VPC > `saveVpcThreshold` × max-affordable-stackable VPC)
  - `{ action: "none" }` — nothing affordable, not saving (idle)
- **Post-consolidation focus with long-save bypass:** once consolidation is met but completionists aren't all done, the strategy normally locks onto the next completionist purchase. When the projected save time for that completionist exceeds `longSaveTimeThresholdSec` (default 90), the strategy evaluates each affordable non-completionist stackable as a candidate interleave: it computes the total save time *with* the stackable bought now (faster income, but mass spent that has to be re-earned) versus *without*, and accepts the interleave when the with/without ratio is ≤ `longSaveTolerance` (default 1.05, ~5% extension). If multiple interleaves qualify, the highest-VPC one wins. Inert at T1 (saves stay short of the 90s gate); engaged at T2+.
- **Step 2b — consolidation-only stackable buy rule (T3 addition).** Between the existing one-shot buy step and the stackable-VPC ranking, a new branch buys the cheapest affordable income-zero consolidation-bearing stackable. For stackables with zero income but positive consolidation contribution (the Galactic Bulge shape — `consolidation > 0 && maxLevels > 1` && all income channels neutral && no synergies; engine field name `consolidation` is a relic), `stackableVpc` returns `0.0001 / cost` epsilon so the upgrade is not chosen by the regular VPC ranking; step 2b walks the consolidation-only stackables in cheapest-affordable order and buys one. Strict guard: only fires when `consolidation > 0` AND all income channels neutral AND no synergies declared — i.e., genuinely consolidation-only stackables. T1/T2 have none, so this branch never fires there (T1/T2 byte-identical).
- **Threshold-mode completionist mask (T3 addition).** `decideAction` reads `params.mode` (default `"completion"` when omitted). In Threshold mode (`params.mode === "threshold"`), completionist-tagged upgrades are masked from all buy candidates (one-shot list, stackable VPC ranking, save targets, step 2b). T1/T2 callers omitting `mode` default to completion semantics → byte-identical for those tiers. T3 needs the mask because the runner's previous behavior was to exit Threshold mode on the first consolidation-met tick, but with tiered consolidation (Galactic Bulge) and consolidation-only purchases, the strategy's own buy logic must also avoid completionists during the climb — otherwise high-VPC completionist stackables (HVC) would still be selected on every save.
- **Floating-point consolidation epsilon.** `CONSOLIDATION_EPS = 1e-9` (relic constant name) is added to all consolidation-met checks in `decideAction` (and parallels the same constant in `runner.js` exit checks and the playtest UI's End-Tier button gate). T3's Galactic Bulge sums to `6.249999999999999` in IEEE 754 after the seventh +0.30 increment; the epsilon ensures the consolidation-met test still fires. 1e-9 sits well below any meaningful design granularity (consolidation contributions are ≥ 0.30).
- `classify(upgrades)` → `{ stackables, oneShots, completionists }`
- `stackableVpc(name, state, params, upgrades)` → per-level marginal income gain ÷ next cost. Returns `0.0001 / cost` epsilon for consolidation-only stackables (zero income, positive consolidation) so the regular VPC ranking does not pick them; step 2b handles those buys explicitly.
- `oneShotVpc(name, state, params, upgrades)` → bespoke per effect type (×all-MPS, ×all-MPC, baseMps floor, synergy provider)

All VPC formulas dispatch on the upgrade's data fields (no name-matching), so future tiers' upgrades reuse the same logic if their effect shape matches T1's three patterns. The legacy v1.2.1 quirk where stackable synergy providers' VPC includes the gift-to-target is implemented and exercised by T2 (Roche Lobe Overflow → Local Bubble per-level, Brown Dwarf → Roche Lobe Overflow per-level — verified at end-state in the Phase 6 calibration probe). The consolidation-only one-shot epsilon VPC branch (`0.0001 / cost` when value is otherwise 0 and `consolidation > 0`; field name is a relic) was added in Phase 6 so T2's Open Cluster (consolidation 1.0, no income effect) does not strand the T2→T3 transition. The T3 step-2b branch extends this idea from one-shots to stackables.

VPC math also reads `params.synergyProviders` (defaults to `upgrades`) so cross-tier synergy providers (e.g., T2 Local Bubble's contribution to T3 HII Region's effective income) are included in the stackable-VPC formula. Without this, the strategy would underestimate HII Region's value at T3 because it would not see the T2 levels seeded into `state.levels` from carry-over.

**`DF.sim.runner`** — 1 Hz tick-loop sim runner.
- `runSimulation(params, scenario)` → `{ headline, trace, finalState }`
  - `params`: `cpm`, `engagement`, `saveVpcThreshold`, `consolidationThreshold` (auto-filled per tier), `perTierEngagement` (Phase 4; defaults from `DF.sim.data.DEFAULT_PARAMS.perTierEngagement`), `maxTicks` (default **60000** — raised from 12,000 in T3 to accommodate longer Completion runs at 100 cpm; T1/T2 runs land well under either ceiling).
  - `scenario`: `{ tier, mode, upgrades? }`, where `mode` is `"completion"` (run until transition) or `"threshold"` (exit on first consolidation-met tick); `upgrades` (Phase 4) is an optional override array (defaults to `data.UPGRADES`) so the Parameters-tab editor's edits flow through. `mode` is also threaded into `params.mode` (T3 addition) so the strategy's completionist-mask can fire.
  - `headline`: `{ totalTime_s, totalTicks, finalMass, totalClicks, massFromClicks, massFromPassive, massFromAuto, clickShare, levels, consolidation, completionistDone, thresholdHit_s, transitioned, exitReason }`
  - `trace`: array of per-tick rows `{ tick, time_s, mass_in, click_income, passive_income, auto_income, mpc, mps, aps, action, upgrade?, cost?, target?, mass_out, consolidation, levels }`
- `TIER_CONFIGS` — per-tier defaults. T1 (consolidationThreshold 1.0), T2 (2.5), T3 (6.25) wired.
- `upgradesForTier(allUpgrades, tier)` (Phase 6) — filters the full `data.UPGRADES` array to only the upgrades whose `tier` matches the requested scenario tier. Upgrades with no `tier` field are treated as tier 1 for backward compatibility. The runner runs against this filtered list so prior-tier upgrades are not re-buyable; their effects flow through the carry-over instead.
- `computeCarryover(priorState, priorUpgrades, priorParams, core)` (Phase 6) — SINGLE-TIER primitive. Derives the carry payload (startingMass, carryMps, carryMpc, carryAps, carry.allMps/allMpc/allAps) from a finalized prior-tier state, walking only the upgrades passed in via `priorUpgrades`. The convention: carry floors are FROZEN at exit-time values; carry all-multipliers continue to multiply new-tier-only contributions but not the floors themselves. Matches the legacy v1.2.1 strategy formula `(baseMpc + sum_t2) × allMpc_t2 × carry.allMpc + carryMpc_floor`. `carryMpc` subtracts `baseMpc` (= 1.0) so the new tier's own +1 baseline is not double-counted. Used as the per-step primitive by `transitionToNextTier` in `playtest.js`; multi-tier composition for the runner's chained `runSimulation` calls lives in `composeCarryChain` (below).
- `composeCarryChain(priorFinal, currentTier, allUpgrades, params, core)` (added 2026-05-10 calibration pass) — multi-tier carry composition. Walks every prior tier from T1 to `currentTier - 1`, accumulates each tier's `computeCarryover` contribution (floors add, allMults multiply), and returns a unified payload. This honors the load-bearing rule **stats carry over between tiers** — every owned upgrade from every prior tier continues to produce its contribution forever, including flat additives. Before this helper, `runSimulation`'s chained calls computed T3's carry from `computeCarryover(T2_finalState, T2_upgrades_only)`, which silently dropped T1's flat MPS contributions and T1's `allMps` multipliers from T3's seed. The pre-fix T3 starting MPS at C-C handoff (100 cpm) was 263.66 (T2 only); post-fix it is 275.46 (= 11.80 T1 + 263.66 T2), matching what the live `transitionToNextTier` produces. The skip dev-tool also uses `composeCarryChain` so skipped-into-T3 starting states match live transitions byte-for-byte.
- **Carry-over level seeding (T3 addition).** When `tier > 1` and a `carryFrom` finalState is in play, prior-tier levels are seeded into `state.levels` so cross-tier synergies (Local Bubble levels feeding into HII Region's `synergyMult`) can resolve. Levels for prior-tier upgrades remain frozen for the duration of the new-tier run — they are read for synergy math only, not re-buyable.
- **`synergyProviders` plumbing (T3 addition).** The runner passes the unfiltered `allUpgrades` list as `synergyProviders` on every per-tick `core.computeMpc/Mps/Aps` call and on every `strategy.decideAction` call (via `params.synergyProviders`). This is what surfaces cross-tier providers to the math layer and the strategy's VPC math. T1/T2 callers that don't set up cross-tier synergies see byte-identical behavior because `synergyProviders` defaults to `upgrades` (the filtered current-tier list) when omitted.
- `scenario.handoffMode` (Phase 6) — `"threshold"` or `"completion"`. When `tier > 1` and `scenario.carryFrom` is not supplied, the runner runs the prior tier internally in this mode and uses its `finalState` to seed the carry. Default is `"completion"`. Callers can also pass an explicit `scenario.carryFrom` to skip the auto-run. T3 chains apply this recursively (T1 → T2 → T3 use the same handoff label across both prior tiers).

Per tick: compute MPC/MPS/APS (with `synergyProviders = allUpgrades`) → apply income (passive + click + auto, with click income scaled by `perTierEngagement[scenario.tier] × engagement`) → call `decideAction` (with `params.mode` set + `params.synergyProviders = allUpgrades`) → apply action → record trace row. Consolidation-met exit checks use `state.consolidation + CONSOLIDATION_EPS >= consolidationThreshold` to absorb floating-point sum drift.

**Per-tier engagement (Phase 4 wiring).** The runner's effective engagement per tick is `effEngagement = perTierEngagement[scenario.tier] × params.engagement`. The per-tier curve is the baseline (Parameters tab); the global `engagement` is a multiplier on top (Simulator quick-strip). For T1 the curve defaults to 1.0, so legacy callers passing `{ engagement: 1.0 }` get byte-identical output to pre-Phase-4. The validate.js harness exercises this — its baseline (PASS / PASS / FAIL at -9.7%) is preserved.

**`DF.sim.playtestRefs`** — **RETIRED 2026-05-12** (M☉ retune). The pre-retune T1 playtest references (60 / 100 / 150 cpm at the prior arbitrary-mass-unit scale) no longer apply after the data.js rescale to M☉. The module file `src/sim/playtest_refs.js` was deleted; the within-band indicator was removed from the playtest UI in the same pass. Real-world playtests at the M☉ scale will eventually inform a fresh reference table when collected, but until then the Simulator tab drives validation through `DF.sim.sweep` + `DF.sim.profiles.ENGAGED_TARGETS` + per-tier mass-band check vs bot reference.

**`DF.ui.charts`** — vanilla canvas charts, no library. Each takes a `<canvas>` and a small data object; clears + redraws on every call. DPR-aware so lines stay crisp on hi-dpi screens (backing buffer rounded to integer device pixels; 1px strokes drawn on integer + 0.5 to land on a single device-pixel column). `setupCanvas` returns `null` and the chart functions early-return when the canvas isn't laid out yet (`clientWidth` or `clientHeight` is 0, e.g. parent panel is `display: none`); this is the safe path that lets the simulator's init-time `runAndRender()` populate headline + trace without producing stretched 300×150 chart artifacts in a hidden panel.
- `palette()` — reads CSS variables (`--bg`, `--fg`, `--accent`, etc.) so colors track the prototype theme.
- `niceScale(dataMax, targetCount=4)` / `timeTicks(xMaxSeconds, targetCount=4)` / `niceTimeStep(...)` / `fmtTick(v, step)` — tick-algorithm helpers used by all four charts (1/2/2.5/5 × 10^N for Y, predefined `[1,2,5,10,15,30,60,120,300,...]` time steps for X). Exposed for tests / future callers.
- `massOverTime(canvas, { series, xMax, yMax })` — multi-series line chart. Threshold + Completion overlaid; Threshold series gets an end-marker (vertical hash + dot + "threshold reached" label) at its last data point. Legend in top-right gutter.
- `consolidationLine(canvas, { series, xMax, hits })` — time-series line chart of consolidation over time (0..1); dashed gate line at y=1.0; vertical hash + label per `hit` marking the threshold-hit timestamp. The simulator currently feeds it just the Threshold series (Completion's consolidation is identical pre-gate and clamped at the gate post-gate, so overlaying it added no information). Replaces the v1.2.1-era `consolidationBar` snapshot.
- `levelsStacked(canvas, { times, series, xMax, yMax, legend? })` — stacked-area chart over time (one band per upgrade, polygon fill instead of per-tick fillRect). When `legend: false`, the in-canvas legend is suppressed and the caller renders an HTML legend below the canvas.
- `incomeStacked(canvas, { times, click, passive, auto, xMax, yMax, includeAuto? })` — stacked area chart of per-tick income, click + passive + auto. Auto series is omitted from the in-canvas legend when `includeAuto` is false (T1 case: auto income is always zero).

**`DF.ui.parameters`** — Parameters tab UI logic (Phase 4). Builds its own DOM into the empty `<div data-tab-panel="parameters">` on init and injects a scoped `<style id="params-styles">` block.
- `init()` — builds the six sections, hydrates fields from `DF.sim.getParamsStore()`, and subscribes to the store so external edits (Simulator strip, reset, future settings import) re-sync the form values.

UI sections rendered:
1. **Engine** — `tickIntervalMs`, `baseMpc`, `baseMps`, `consolidationThreshold` (= consolidation_T1_to_T2), `consolidationGrowth`, `cpmWindowMs`. All numeric inputs.
2. **Strategy & default scenario** — `saveVpcThreshold`, `engagement` (global multiplier), `cpm`, plus a `scenario` dropdown (`Completion` / `Threshold`).
3. **Per-tier engagement curve** — 10 inputs (T1 through T10) editing `perTierEngagement`. Defaults: T1=1.00, T2=0.85, T3=0.80, T4=0.70, T5=0.50, T6=0.45, T7=0.40, T8=0.35, T9=0.30, T10=0.30.
4. **Upgrade table** — one row per upgrade. Summary columns (name / tier / max lvl / init cost / cost growth / consolidation [engine field `consolidation`] + type select + completionist checkbox) always visible; click a row to expand into a per-row detail block grouping the rest (cost/consolidation, MPS, MPC, APS, global multipliers, flags, synergies-this-upgrade-provides, description). The detail block edits `synergies` directly (add row, remove row, change target+multiplier).
5. **Synergy table view** — read-only cross-cutting view of every synergy declared across all upgrades. Columns: provider / target / multiplier / kind. `kind` derives from provider+target one-shot/stackable shape: `flat one-shot` (provider one-shot), `stackable per-level` (both stackable), `cross-stat` (stackable provider into one-shot target).
6. **Import settings** (Phase 5) — paste a settings JSON exported from the Simulator tab and click Import. Parses + validates via `DF.ui.settings.importJson(text)`. Missing keys fall back to `DEFAULT_PARAMS`; unknown schema versions warn but still apply. On success, `getParamsStore().setState(...)` replaces the store in one shot — the Simulator-tab subscription debounces a re-run within ~200 ms. The status line below the textarea reports OK / warnings / inline error.
7. **Export settings** (parallel affordance to the Simulator tab's export, added 2026-05-09) — "Export current settings" button reveals a panel with the same JSON + Markdown textareas + Copy buttons as the Simulator tab's export panel, so the user can export from wherever they are while tuning. Uses `DF.ui.settings.exportJson` / `exportMarkdown` directly. Pulls the latest headline + tier from the Simulator tab via two new accessors `DF.ui.simulator.getLastHeadline()` / `getLastTier()` (both are read-only, defined alongside `init`); when no Simulator run has happened yet, the headline block is omitted. Output is byte-identical to the Simulator-tab export modulo timestamp. The panel also auto-refreshes via the existing `syncFromStore` subscriber while open, so live edits to the form values propagate into the textareas without forcing a re-toggle. Copy buttons mirror the playtest tab's `copyLog` clipboard pattern (kept local rather than imported, so Parameters does not require Simulator-module load order).
8. **Reset** — "Reset all to defaults" button with an inline confirm row ("This will discard all edits…"). Calls `DF.sim.resetParamsStore()`.

All edits flow through `DF.sim.getParamsStore().setState(...)`. The Simulator tab subscribes to the same store and debounces a re-run on every change, so editing any field on the Parameters tab triggers a fresh simulator run within ~200 ms.

**Self-edit suppression (added 2026-05-09).** `applyParamPatch` / `applyUpgradePatch` set the module-local `ui.suppressStoreSync` flag around their `store.setState(...)` call, and `syncFromStore` short-circuits while that flag is set. Without this, every keystroke in a number input would synchronously re-render `renderUpgradesTable()`, blowing away the focused input mid-edit and dropping in-flight keystrokes — notably the `.` in decimal entry, since `<input type=number>` does not preserve a trailing dot through value reflection (`parseFloat("0.") === 0`, then re-render writes `"0"` back into the freshly-recreated input). Side effect: click-handlers that change row structure (synergy add/remove, type select, tier select, completionist toggle) must call `rerenderTables()` explicitly after their patch, since the auto-re-render path is now suppressed for self-originated changes. External store updates (Simulator-strip edits, reset, settings import) still trigger a full re-render via `syncFromStore` as before.

**`DF.ui.settings`** — settings export/import + comparison-panel store (Phase 5). UI-side helper, no math; does not touch `src/sim/*.js` files. Exports:
- `SETTINGS_VERSION` — current schema string (`'0.1.0'`).
- `buildSnapshot(state, opts?)` — pure function; returns a key-sorted snapshot from a store state plus optional `{ tier, mode, headline, timestamp }`.
- `exportJson(state, opts?)` → pretty-printed JSON string (2-space indent, sorted keys for stable diffs). The schema is `{ version, timestamp, scenario: { tier, mode }, params, upgrades, headline? }`. The simulator tab calls this with the current `getParamsStore().getState()` plus the latest `runSimulation` headlines.
- `exportMarkdown(state, opts?)` → chat-pasteable Markdown summary. Date stamp, scenario line, cpm/engagement/save_vpc, threshold + completion times with the matching real-playtest reference (where available) and percent delta, per-tier engagement one-liner, consolidation gate values. Compact, technical, no exclamation points.
- `importJson(text)` → `{ ok, errors, warnings, value }`. Parses JSON, defensively merges imported `params` over `DEFAULT_PARAMS` (per-tier engagement merged per-tier so partial curves don't drop tiers), uses imported `upgrades` array verbatim or falls back to `data.UPGRADES`, warns on unknown schema versions, rejects unparseable input. The Parameters-tab Import button replaces store state via `setState({ params, upgrades })` on success.
- `getComparisonStore()` — singleton, lazy-created. Independent params-store mirror used by the Simulator tab's comparison panel. Seeded from the live main store (or `DEFAULT_PARAMS` if it has not been touched) on first access. Held in this UI module rather than `src/sim/store.js` so the math layer stays md5-identical for Phase 5.
- `clearComparisonStore()` — drops the singleton; the next `getComparisonStore()` re-seeds. Called when the comparison panel is closed.

Round-trip identity gate (verified): export → reset → import → re-export produces byte-identical JSON modulo timestamp.

**`DF.ui.simulator`** — Simulator tab UI logic. **REBUILT 2026-05-12** (trajectory-profile edition) — the prior bot-mode UI (cpm / engagement / saveVpcThreshold / tier / handoff strip, per-tick trace table with decision-detail expansion, 4-chart detail view, Compare-against panel, JSON/Markdown export panel, Parameters-tab cross-sync via shared params store) was retired. The Simulator tab now drives the long-burn v1 trajectory-profile catalog (`DF.sim.profiles` + `DF.sim.sweep`) and ships two sub-views. The Parameters tab still owns the underlying engine knobs; the Simulator tab reads them indirectly through the buyer/timing profile dispatch in `sweep.js`.
- `init()` — builds the sub-view shell (Single-Run / Sweep tab buttons), wires the Single-Run debounced auto-rerun, registers a `DF.ui.tabs.onShow('simulator', ...)` callback that re-renders the active sub-view each time the Simulator tab becomes visible. Initial render is the Single-Run view at default selections (`realistic-engaged × comp-hoarder × T1`).
- The legacy `getLastHeadline()` / `getLastTier()` accessors are retired; the Parameters-tab Export panel they fed was removed in the same rebuild.

Sub-views:

1. **Single-Run** — picks a single pairing and produces a deep run report.
   - **Inputs:** trajectory profile dropdown (`realistic-engaged` / `realistic-moderate` / `realistic-casual` / `realistic-drift` / `hyper-onboard` / `bot-60cpm`); buyer profile dropdown (`comp-hoarder` / `comp-rusher` / `thr-hoarder` / `thr-rusher`); tier dropdown (T1-T10); seed input; max-days input. Edits debounce ~200 ms then trigger `sweep.runPairing` for an ad-hoc pairing built from the dropdown choices.
   - **Headline block:** total calendar time, total active time, peak mass on counter, final tier reached, click income share, DNF flag (with category), drift flag (vs `ENGAGED_TARGETS`; `n/a` for non-drift-target trajectories), mass-band flag (vs `referenceMassForTier`).
   - **Per-phase breakdown table:** one row per phase the player passed through, with phase label, fromDay-toDay calendar range, calendar seconds, active seconds, sessions executed. Visualizes how each trajectory phase contributed to the run.
   - **Per-tier breakdown table:** entry calendar second, active seconds in tier, exit mass, ratio vs bot reference, band flag.
   - **Mass-over-calendar-time chart** with vertical phase boundary overlays.
   - **Comparison panel:** toggle reveals a second pairing's strip; the chart overlays both mass curves. Independent state from the first scenario.

2. **Sweep** — runs the full 17-pairing `REALISTIC_PAIRINGS` matrix.
   - **Inputs:** target tier (T1-T10), seed, max-days. Run button kicks off the sweep.
   - **Execution:** runs one pairing at a time via `setTimeout(0)` between pairings so the UI stays responsive on long sweeps (the full N=50 primary at T10 can take minutes of wall-clock; the progress indicator keeps the user oriented).
   - **Progress indicator:** shows the active pairing + completion count (e.g., `12/17 · realistic-casual × thr-rusher`).
   - **Weight-grouped aggregate cards** for Primary / Secondary / Stress / Floor / Legacy sections, mirroring the CLI's markdown report layout. Each card holds per-pairing p50 calendar + drift + band + DNF rate.
   - **Cross-pairing comparison table** with weight column. For sweeps targeting tier N, the table includes intermediate-tier `T<t> p50` columns for tiers 1 through N-1 (calendar-second P50 of the moment each tier was crossed, equivalent to `perTier[t].completedAtP50`), positioned between the DNF column and the target-tier p10/p50/p90 columns. The table wraps in a horizontally scrolling container (`.sim-table-scroll`) with the leftmost Pairing column pinned via `position: sticky` so row identity survives the scroll.
   - **Anomalies list** enumerates drift breaches, below-band tiers, and DNF clusters (rate > 50%, by reason category).

### Verification

- Phase 1 (math layer): byte-equivalent against the pre-extraction implementation across 5000 random states (Object.is on `computeMpc`, `computeMps`, `cost`).
- Phase 2 (UI restructure): math layer untouched, so math equivalence is preserved trivially. Playtest behavior preserved verbatim — the extracted module is a literal lift of the prior inline script's logic. All four namespaces (`DF.sim.data`, `DF.sim.core`, `DF.ui.format`, `DF.ui.tabs`, `DF.ui.playtest`) verified present after load order; tab switching, default-tab-on-load, and Playtest functionality round-trip require browser verification before Phase 3.
- Phase 3 Part A (sim runner + strategy): math layer untouched (spot-checked: empty state MPC=1/MPS=0; SW5 AB5 → MPS=1.4; SC=3 with HP=1 → MPC=2.575 with synergy applied; cost(SW, 5) = 7·1.15⁵). All four `DF.sim.*` namespaces (`data`, `core`, `strategy`, `runner`) load from Node via `require()`. `node Prototype/src/test/validate.js` parses all three real T1 playtest logs and produces three PASS/FAIL lines. **60 cpm and 100 cpm pass within ±6% of real wall-clock time. 150 cpm fails at -9.7%, a tick-rate granularity artifact** (see Phase 3 Part A note in section 12 for details). Browser load via `file://` not yet exercised (no Simulator-tab UI in Part A).
- Phase 3 Part B (Simulator UI): math layer untouched (md5 of `src/sim/{data,core,store,strategy,runner}.js` unchanged from Part A). New files (`src/sim/playtest_refs.js`, `src/ui/charts.js`, `src/ui/simulator.js`) syntax-validated via `new Function(src)`. `node validate.js` continues to produce the Part A baseline (PASS / PASS / FAIL at -9.7%). End-to-end UI run smoke-tested via Node by replicating the bootstrap path: default load (cpm=100, eng=1.0, savevpc=1.5) produces threshold 350s and completion 495s, both within ±6% of the embedded reference. Browser load via `file://` not yet exercised (Simulator tab DOM rendering, debounced auto-run, trace expand/collapse, chart canvas drawing) — needs manual verification.
- Phase 3 Part C (chart polish): math layer untouched (md5 of `src/sim/*.js` byte-identical to Part B). UI files modified: `src/ui/charts.js` (DPR rounding, nice-tick algorithms `niceScale` / `timeTicks` / `fmtTick`, integer + 0.5 stroke alignment, font constants, `consolidationBar` → `consolidationLine` rename, levels stacked converted from per-tick fillRect to stacked-area polygons, in-canvas legend right-aligned, empty-data placeholder); `src/ui/simulator.js` (CSS heights per chart + `gap: 14px`, dropped `<canvas height>` attrs, added `aria-label`s, added `<div id="sim-chart-levels-legend">` HTML legend block, swapped Asteroid Belt cyan ↔ Stellar Coupling bronze in `UPGRADE_COLORS`, `renderCharts` feeds `consolidationLine` with both-modes time-series + threshold-hit hash, filters zero-only `auto` series from income legend). `node validate.js` continues to produce the Part B baseline (PASS / PASS / FAIL at -9.7%). Browser load via `file://` and visual inspection of crisp text rendering / clean axis ticks / legend placement still needs manual verification.
- Phase 3 Part C-fix2 (chart sizing in hidden tab): math layer still untouched (md5 of `src/sim/{core,data,playtest_refs,runner,store,strategy}.js` byte-identical to Part C-fix). Bug: opening the Simulator tab showed all four charts rendered at very large, stretched, low-res, overlapping-text scale. Cause: simulator init runs while the Simulator panel is `display: none` (default tab is Playtest); inside a hidden parent the canvas `clientWidth` / `clientHeight` are 0, and the previous `setupCanvas` fallback chain (`canvas.width || 600`, `canvas.height || 200`) collapsed to the HTML canvas spec defaults of 300 × 150, since the polish pass had dropped the `<canvas height>` attributes. Charts rendered into a 300×150 backing buffer, then the browser stretched it across the real ~1200×220 CSS rect when the tab was finally shown. Fix in two layers: (1) `src/ui/tabs.js` — added `onShow(tabId, fn)` callback registry; `setActive` fires registered callbacks after the panel is made visible. (2) `src/ui/charts.js` — `setupCanvas` now returns `null` for zero-dimension canvases and each of `massOverTime` / `consolidationLine` / `incomeStacked` / `levelsStacked` early-returns on null. (3) `src/ui/simulator.js` — `init()` registers a `tabs.onShow('simulator', ...)` callback that re-renders headline + charts + trace each time the Simulator tab becomes visible (uses cached `ui.results`; falls back to a full `runAndRender()` if results are missing). Initial `runAndRender()` at init still runs so headline + trace are populated; chart calls during that initial render harmlessly early-return. `node --check` passes on all three edited files. Browser visual verification still pending.
- Phase 3 Part D (session-report charts): math layer untouched (md5 of `src/sim/{core,data,playtest_refs,runner,store,strategy}.js` byte-identical to Part C-fix2). UI files modified: `src/ui/playtest.js` (added `traceFromPlaytestLog(log, totalTimeMs)` helper, `renderReportCharts(totalTime, avgCpm)`, and a `requestAnimationFrame`-deferred call from `showReport`; reuses `DF.ui.charts.massOverTime` / `consolidationLine` / `incomeStacked` / `levelsStacked` verbatim — no new chart functions). HTML modified: `dark-filaments-t1.html` (added `.report-charts` block inside `#report-wrap` with five canvases + a 3-cell summary row; CSS for chart heights mirrors the Simulator tab's: mass 220 / consolidation 96 / income 200 / levels 220 / compare 220). The comparison chart re-runs `runSimulation` at the player's measured average cpm (rounded to integer, clamped ≥ 1) with `engagement: 1.0` and `saveVpcThreshold: 1.5`, then overlays `Your run` (gold) and `Sim at <cpm> cpm` (cyan) as a two-series mass-over-time. Delta is `(your − sim) / sim`, colored red when the player is slower than the bot, cyan when faster, dim within ±0.5%. Rendering is gated on `requestAnimationFrame` so the canvases are laid out before draw — the chart functions also early-return safely on zero-dim canvases per the Part C-fix2 setup. Browser visual verification (chart appearance, comparison chart at 60 / 100 / 150 cpm matching the simulator's reference run shapes, dev tools / autoclicker still working during the run) still pending.
- Phase 3 Part C-fix (chart polish bugs): math layer still untouched (same md5s). `src/ui/charts.js` — removed `ctx.imageSmoothingEnabled = false` from `setupCanvas` (the polish pass added it for "crispness", but with anti-aliasing disabled the gold mass curve's near-vertical drops on each buy rasterized as solid vertical columns, reading as catastrophic full-height artifacts on the chart); rebuilt `niceScale`'s niceNorm thresholds to round UP to the next 1/2/2.5/5 instead of down (was producing step=250 for dataMax≈1274 → 7 Y-ticks instead of the targeted 4-5; now produces step=500 → `[0, 500, 1000, 1500]`); rewrote `niceTimeStep` to pick the smallest step where `ceil(xMax/s) <= targetCount`, with default `targetCount = 5` (was using a `s >= xMax/4` formulation that skipped the 120s step at xMax=495 and jumped to 300, leaving only "0:00 / 5:00 / 10:00"); dropped the `gate (1.00)` text label from `consolidationLine` (it stacked under the `threshold hit · m:ss` label and read as overlapping illegibly — the dashed line plus the "1.0" Y-tick already name the level); bumped consolidation plot top padding from 18 to 24 and pinned the CONSOLIDATION title higher in the gutter so the top Y-tick "1.0" no longer collides with the title's descender row. `src/ui/simulator.js` — dropped the Completion consolidation series from the consolidation chart's payload (it was identical to Threshold's pre-gate, and clamped at 1.0 along the gate dashed line post-gate, so it added no information and was fully occluded). `node validate.js` continues to produce the Part B baseline (PASS / PASS / FAIL at -9.7%). Browser visual verification still pending.
- Phase 4 (Parameters tab + per-tier engagement wiring): math layer touched in one place — `src/sim/runner.js` — to apply `effEngagement = perTierEngagement[scenario.tier] × params.engagement` to the per-tick click income and total-clicks counters (replacing the bare `params.engagement`). The per-tier curve defaults from `data.DEFAULT_PARAMS.perTierEngagement` so legacy callers passing only `{ engagement: 1.0 }` get byte-identical output at T1 (perTier[1]=1.0). `data.js` extended with `consolidationGrowth`, `cpm`, `scenario`, `perTierEngagement` keys (all additive — existing keys retained, existing values unchanged). `store.js` extended with the singleton params-store helpers `getParamsStore` / `resetParamsStore` (both additive). `runner.js` also now accepts an optional `scenario.upgrades` override array so the Parameters-tab editor's edits flow through (defaults to `data.UPGRADES`). New file: `src/ui/parameters.js` — six-section UI (engine / strategy + scenario / per-tier engagement / upgrade table editor with expandable per-row detail / synergy view / reset-to-default with inline confirm). Refactored `src/ui/simulator.js` to read+write through the same shared params store: `pushStripToStore` after every strip change, `pullStripFromStore` on every external store update, and a `subscribe` callback that debounces a re-render. The strip's `engagement` field re-labeled to `engagement ×` (now a multiplier on top of the per-tier curve, range 0–10). HTML bootstrap updated: replaced the placeholder `<div class="tab-bar">` parameters stub with an empty `<div data-tab-panel="parameters">`, added `<script src="src/ui/parameters.js">`, added `DF.ui.parameters.init()` call before `DF.ui.simulator.init()`. `core.js`, `playtest_refs.js`, `strategy.js` md5-unchanged from Phase 3 Part D baseline. `node validate.js` continues to produce the same baseline (PASS / PASS / FAIL at -9.7%, byte-identical diagnostics) — confirmed both before and after every modification in this phase. Round-trip identity verified via Node smoke: editing `perTierEngagement[1]` 1.0→0.5 lengthens completion time 495s→717s; setting global `engagement` 1.0→0.5 with curve back to 1.0 produces 728s (within tick-granularity of the curve-edit case); editing Solar Wind's `addMps` 0.08→0.16 via the upgrade-table store path shortens completion time by 28s; reset restores 495s. Browser load via `file://` and the full visual round-trip (typing in the Parameters tab → strip updates → sim re-runs; reset confirm dialog flow) still needs manual verification.
- Phase 5 (A/B comparison + settings export/import): math layer fully untouched — md5 of `src/sim/{core,data,playtest_refs,runner,store,strategy}.js` byte-identical to Phase 4. UI-side changes only. New file: `src/ui/settings.js` — exposes `exportJson` / `exportMarkdown` / `importJson` / `buildSnapshot` plus `getComparisonStore` / `clearComparisonStore`. Comparison store is held in this UI module (rather than `src/sim/store.js`) precisely so the math layer stays md5-identical. `src/ui/simulator.js` extended with: a "Compare against…" toggle button on the strip; an "Export current settings" toggle; an export panel with two textareas (JSON + Markdown) and Copy buttons reusing the same clipboard pattern as the playtest tab's `copyLog`; a comparison panel slotted between the main headlines and the charts when active (current placement after a small post-Phase-5 layout pass; layout reads main strip → main headlines → comparison → charts → trace) that has its own quick parameter strip, its own headline (Threshold + Completion side-by-side, lavender `#a08fcd` and muted-green `#7fb069` border-left tints matching the comparison-series colors on the mass chart), and a delta-summary row showing diffs against the main panel. The mass chart adds 3rd + 4th comparison series (in lavender + muted green — distinct base hues from the main cyan + gold pair, picked so all four series read as four clearly different things rather than two pairs) when the comparison panel is active; the consolidation / income / levels charts stay single-scenario. **Comparison chart scope: mass overlay** (per the spec's recommended sweet spot). `src/ui/parameters.js` extended with an Import-settings section above Reset — textarea + Import button + inline status line (ok / warn / error). HTML bootstrap updated: added `<script src="src/ui/settings.js">` (loaded after charts.js, before playtest.js, so playtest/simulator/parameters can all access `DF.ui.settings` at init). `node validate.js` continues to produce the same baseline (PASS / PASS / FAIL at -9.7%) — re-confirmed after every modification. **Round-trip identity gate verified via Node smoke**: edit `cpm`, `saveVpcThreshold`, `engagement`, two per-tier values, and one upgrade field; export with fixed timestamp; reset; re-import; re-export with same timestamp → JSON output byte-identical (4456 chars). Defensive import paths verified: bad JSON rejected with inline error; unknown schema version warns but proceeds; partial params (no upgrades) falls back to default upgrades; empty input rejected. Comparison-store independence verified: tweaking save_vpc 1.5→2.0 in the comparison store changes completion 495s→519s (+24s) while the main store stays at 1.5; clearing the comparison store + re-getting re-seeds from the main store. Browser load via `file://` and the full visual round-trip (Compare toggle → strip edits in either panel → both panels run independently → close drops series cleanly; Export panel → Copy buttons; Import paste → both tabs re-sync) still needs manual verification.
- T3 calibration pass (2026-05-10): math layer touched in five mode-gated, additive ways — (1) `core.synergyMult` accepts `kind: "additive"` (default branch unchanged), (2) `core.synergyMult` + `computeMpc/Mps/Aps` accept optional `synergyProviders` argument (defaults to `upgrades`), (3) `runner.js` passes the unfiltered `allUpgrades` list as `synergyProviders` and seeds prior-tier levels into `state.levels` from `carryFrom.finalState`, (4) `strategy.js` adds step 2b consolidation-only stackable buy rule + Threshold-mode completionist mask + `params.synergyProviders` plumbing, (5) `CONSOLIDATION_EPS = 1e-9` added to runner exit + strategy consolidation-met checks. `runner.maxTicks` raised 12,000 → 60,000 to fit T3 Completion runs. `node validate.js` re-confirmed PASS / PASS / FAIL at -9.7% (byte-identical T1 diagnostics) — T1 byte-identical was the gate before merging. T2 calibration probe re-run: T2 Threshold/Completion times byte-identical to Phase 6 baseline. New file `src/test/t3_calibrate.js` runs T3 chained T1 → T2 → T3 across the four handoff/mode permutations and prints headlines: at 100 cpm engagement 1.0, Threshold-handoff Threshold/Completion 37:29 / 65:18 (+74.2% gap, target band ✓), Completion-handoff Threshold/Completion 30:07 / 47:34 (+57.9%, slightly below band — sensitive to HVC `initCost` bistability). Browser visual verification of T3 dropdown + handoff label + tiered-consolidation `N/M` display still pending; awaiting first real T3 playtest.
- Carry-composition fix (2026-05-10): math layer touched in two places. (1) `src/sim/runner.js` — added `composeCarryChain(priorFinal, currentTier, allUpgrades, params, core)` helper that walks every prior tier T1..currentTier-1, accumulating each tier's per-step `computeCarryover` (floors add, allMults multiply); `runSimulation` now uses `composeCarryChain` instead of a single-tier `computeCarryover` call when seeding T>1 carry. The single-tier `computeCarryover` is retained as the per-step primitive (still used by `transitionToNextTier` in `playtest.js`). (2) `src/ui/playtest.js` — `skipToTier`'s carry composition switched from single-call `computeCarryover` to `composeCarryChain`, so skipped-to-T3 starting states match live transitions byte-for-byte. (3) `src/sim/data.js` — `High-Velocity Cloud` `costGrowth` 2.28 → 2.10 to land the post-fix T3 Comp-vs-Thr gaps in band. **Bug diagnosed by engineering-director while building tier-skip:** runner's `computeCarryover(T2_finalState, T2_upgrades_only)` walked only the immediate-prior tier's upgrade slice, silently dropping T1's flat additive contributions (Solar Wind, Asteroid Belt, Magnetosphere, First Photons) and T1's `allMps` multipliers (Orbital Resonance ×1.25) from T3's carry seed. Pre-fix T3 starting MPS at C-C handoff (100 cpm) was 263.66 (T2 only); post-fix it is 275.46 (= 11.80 T1 + 263.66 T2), matching the live `transitionToNextTier`. Equivalence verified across all four T1/T2 handoff permutations: live accumulator and `composeCarryChain` produce numerically identical carry payloads. **Calibration results.** `node validate.js`: PASS / PASS / FAIL at -9.7% — T1 byte-identical (no prior tier so no chain to walk). `node t3_calibrate.js` at 100 cpm engagement 1.0:
   - Pre-fix: All-Thr T3=37:29, All-Comp T3=47:34, Comp-handoff Thr T3=30:07, Thr-handoff Comp T3=65:18 — gaps Comp-handoff +57.9% (below band), Thr-handoff +74.2% (in band).
   - Post-fix-pre-retune (carry-fix only): All-Thr T3=34:18, All-Comp T3=48:23, Comp-handoff Thr T3=24:47, Thr-handoff Comp T3=60:07 — gaps Comp-handoff +95.2% (above band), Thr-handoff +75.3% (band edge).
   - Post-fix + HVC `costGrowth` 2.28→2.10: All-Thr T3=34:18, All-Comp T3=42:11, Comp-handoff Thr T3=24:47, Thr-handoff Comp T3=59:23 — gaps **Comp-handoff +70.2%**, **Thr-handoff +73.1%** — both inside +65–75% band.
   
   Tier-skip dev-tool harness (`test_skip_v2.js`) re-run: 6/6 PASS — synthetic skip states match runner's chained `runSimulation` starting states byte-for-byte across both T2 and all four T3 handoff permutations. Forward-looking note: this fix's magnitude grows at each tier — at T4 the under-count would have been ~9%, at T5 ~14%, compounding. The corrected carry semantic is what the per-tier inversion curve targets (+65–75% T3 → +25–35% T4 → −5–−15% T5) implicitly assume; the curve continues to be the calibration lens.
- "No frozen floors" fix (2026-05-10, deeper-than-carry-fix follow-up): user-stated rule clarified — "all multipliers should continue to apply from the moment you get them." If T1 grants a ×2 to all M/sec and T2 grants another ×2 to all M/sec, total is ×4 from T2 onward, applied to *all* contributions including T1's flat additives. The carry-composition fix above wired up T1's contributions to reach T3, but did not re-amplify them by multipliers acquired in later tiers — at T3, T1's 11.80 carried floor sat as a constant while T3's new ×1.42 Globular Cluster only amplified T3's own self·syn output (and the carried allMps product was a cumulative *prior-tier* product, not live). The user's rule requires live re-amplification. **Implementation (Option C — "no frozen floors").** Carry payload semantic changed: `carryMps` / `carryMpc` / `carryAps` now store the **raw** Σ self·syn from prior tiers (no `allX^N` applied); `carry.allMps` / `allMpc` / `allAps` store the cumulative `allX^N` product. At every tick the new `core.computeRates(state, upgrades, carry, params, synergyProviders)` helper combines `(carryFloor + activeSelf·syn) × carryAllMult × activeAllMult` — algebraically equivalent to "walk every owned upgrade across every tier, sum self·syn, multiply by total Π allX^N." New multipliers acquired in any tier amplify all owned contributions live, satisfying the rule exactly. Files touched: `src/sim/core.js` (added `computeRates`), `src/sim/runner.js` (rewrote `computeCarryover` + `composeCarryChain` to produce raw floors; tick loop calls `computeRates`; `computeCarryover` gains optional `allUpgrades` 5th arg so cross-tier synergy providers resolve at transition time), `src/sim/strategy.js` (live MPS/MPC/APS calculations in `stackableVpc` / `oneShotVpc` / `currentIncomePerSec` rewritten to match the composed-rate semantic — marginal `delta` math is unchanged because `dSelf × Π_all_owned_allMps^N × syn` is invariant under the change), `src/ui/playtest.js` (`computeMpc/Mps/Aps` route through `core.computeRates`; the live carry accumulator's `mpsFloor`/`mpcFloor`/`apsFloor` are now interpreted as raw — `transitionToNextTier`'s additive composition is unchanged because each tier's `computeCarryover` payload is also raw now, so the sum stays raw across transitions), and `Prototype/dark-filaments-t1-current-state.md` §3 (Cross-tier composition subsection added). **Audit (pre-fix).** Synthetic check at T3 start (Completion handoff, 100 cpm) after buying Globular Cluster ×1.42 with no T3 stackable bought: engine MPS = 275.46 (just the frozen floor, GC ×1.42 not applied); user-rule MPS = 491.45 (Σ self·syn × Π allMps including GC). Pre-fix under-amplification factor ×1.78. Post-fix engine MPS = 491.45 → delta 0.000. Mid-T2 audit (Peculiar Velocity ×1.4 purchase tick): pre-fix MPS ratio across the buy = 1.275 (only T2 self amplified); post-fix = 1.400 exactly (T1 carried floor also amplified). **Calibration.** `node validate.js`: PASS / PASS / FAIL at -9.7% (T1 byte-identical — no prior tier so the new semantic reduces to the single-tier formula). T2 calibration probe: Comp-handoff T2 Completion 27:35 → 27:15 (-20s, within ±10% advisory band); Thr-handoff T2 Threshold 17:41 → 17:36 (-5s); T2 Completion gap +89.8% (was +91-97% under old engine, still within +80–100% T2 target band). `node t3_calibrate.js`: All-Thr T3 34:18 → 33:59; All-Comp T3 42:11 → 41:42; Comp-handoff Thr T3 24:47 → 24:20; Thr-handoff Comp T3 59:23 → 59:04 — gaps Comp-handoff **+71.4%** (was +70.2%), Thr-handoff **+73.8%** (was +73.1%), both inside +65–75% band. No retune needed; HVC `costGrowth` 2.10 stays. T3 starting MPS at C-C handoff (synthetic, after GC buy with zero T3 stackables): pre-fix 275.46 → post-fix 491.45 (×1.78). Forward-looking: this fix's correctness impact grows at every tier — T4 onward, where multipliers stack three or four deep, the pre-fix under-amplification would have rendered the inversion curve targets infeasible. The corrected semantic IS what the per-tier inversion curve assumes; T4 (+25–35%) and T5 (−5–−15%) calibrations should now be reachable with realistic completionist costs.
- Mass-band apparatus fix — Reading B peak-at-gate (2026-05-13): sim-tuner diagnosed that the persistent T1 mass-band p50 0.60-0.71× below-threshold flag (open item from the T3 Step D closing pass) was an apparatus mismatch, not a calibration failure. Both sides of the mass-band ratio (`perTierExitMass[t]` and `referenceMassForTier`) were reading **exit-tick residual** mass (~0.05 M☉ for T1) — the few decimal places left over after the strategy's gate-crossing purchase debited the cost — instead of the load-bearing Reading B target (**peak counter at structural-completion moment** ~1.0 M☉ for T1). Math layer unchanged in this fix; only the measurement surfaces shifted. `src/sim/runner.js` adds a `peakMass` field to the headline (sampled each tick after income, before purchase decision — so it lands on the pre-commit peak that matches the player's counter at the gate-crossing moment). `src/sim/offline.js` adds a `peakMassInTier` tracker through the offline tick loop; the `'transition'` and `max-tier-reached` branches emit this value as the tier-up milestone's `mass` field (replacing the prior `ws.mass` exit-tick read); after recomposing carry the tracker resets to `ws.mass` for the next tier. `src/sim/sweep.js` — `runContinuousBotRun` reads `result.headline.peakMass` for `perTierExitMass[t]`; `referenceMassForTier` reads the same; the engagement-profile fallback `perTierExitMass[finalTierForMass] = state.mass` is now sourced from the in-function `peakInTierMass` tracker. The CSV column `t<n>_exit_mass` is preserved by name; semantic is peak-at-gate. **Verified.** Bot-100cpm × Completion T1 `headline.peakMass = 1.003753` M☉ (Reading B target ~1.0 — dead-on; finalMass was the misleading 0.053675 residual). p17 bot-60cpm × comp-hoarder T1 mass ratio = **1.00× [within-band]** (the canonical reproduction case for the below-band flag). p1 realistic-engaged × comp-hoarder T1 N=5 seed=1 → **1.00× [within-band]**, anomaly section clear of the T1 mass-band flag. Byte-identical sim outcomes at canonical seed: T1 11m 40s / T2 1h 8m. Locked harnesses: validate_offline 38/38, save_migration 56/56, profiles_smoke 396/396, validate_subhalo 28/28 (all unchanged). validate_offline's existing tier-up milestone assertion checks `mass != null && Number.isFinite && > 0`, all of which still hold under peak-at-gate semantics — no test change required. The engagement-profile T2 / T3 above-band overshoots (80-140× the bot reference at T2) remain — these are the documented offline-hoarding signal, now compared like-with-like on both sides.

---

## 9b. Multi-tier playtest flow (added 2026-05-09)

The playtest tab is no longer T1-only. With T2 upgrades populated in `data.UPGRADES` (Phase 6) and T3 added in the 2026-05-10 T3 pass, the playtest now runs the full tier-transition flow through whatever tier set is defined, ending the run when the highest implemented tier (currently T3) completes.

### State extensions (`src/ui/playtest.js`)

The playtest's `state` object gained five fields beyond the original T1-only schema:

- `currentTier` — starts at 1; advances on transition.
- `consolidationThreshold` — the active tier's gate. Derived from `DEFAULT_PARAMS.consolidationThreshold × DEFAULT_PARAMS.consolidationGrowth^(tier-1)` via the local `consolidationThresholdForTier(tier)` helper. T1 = 1.0, T2 = 2.5, T3 = 6.25.
- `carry` — `{ allMps, allMpc, allAps, mpsFloor, mpcFloor, apsFloor }`. Tracks accumulated carryover from prior tiers. T1 starts with `{ 1, 1, 1, 0, 0, 0 }` (no-op). On each transition, the just-finished tier's `computeCarryover` payload is composed in: allMults multiply, floors add. The live accumulator and the runner-side `composeCarryChain` produce numerically identical carry payloads for the same chain of finalStates (verified across all four T1/T2 handoff permutations).
- `tierSnapshots` — `[{ tier, startMs, thresholdHitMs, endMs, levelsAtEnd, massAtEnd, consolidationHitMs }, ...]`. Per-tier timestamps for the report's per-tier breakdown table.
- The legacy `consolidationHitMs` field (top-level) still tracks the FIRST tier's threshold hit; chart trace builder reads it.

### Live MPC/MPS via carry

`computeMpc()` / `computeMps()` / `computeAps()` in `playtest.js` route through the shared `core.computeRates` helper, which folds the carry payload and the active tier into a single composed rate per the Option-C "no frozen floors" semantic (added 2026-05-10):

```
mpc_live = (baseMpc + carry.mpcFloor + Σ_active selfContrib_mpc · synergyMult) × carry.allMpc × Π_active allMpc^N
mps_live = (         carry.mpsFloor + Σ_active selfContrib_mps · synergyMult) × carry.allMps × Π_active allMps^N
aps_live = (         carry.apsFloor + Σ_active selfContrib_aps · synergyMult) × carry.allAps × Π_active allAps^N
```

`carry.mpsFloor` / `mpcFloor` / `apsFloor` are **raw** Σ self·syn from prior tiers (NOT pre-multiplied by `allX`). `carry.allMps` / `allMpc` / `allAps` are the cumulative product of `allX^N` from prior tiers. New multipliers acquired in the active tier amplify the carried raw floor live — there are no frozen amounts. T1 → `carry.allX = 1`, `carry.xFloor = 0` → reduces to the single-tier formula → byte-identical to pre-Phase-6.

### Visibility filter

`buildUpgrades()` builds DOM rows for ALL tiers (so the report can read per-upgrade levels off them). `render()` toggles `.hidden` on rows whose `tier !== state.currentTier`. Owned earlier-tier upgrades persist in `state.levels` and continue to contribute through `carry`; their rows are simply hidden.

### Tier transition

`transitionToNextTier()` is the new function; called from `endTier()` when `currentTier < MAX_TIER`. It:

1. Closes the prior-tier snapshot (`endMs`, `massAtEnd`, `levelsAtEnd`).
2. Calls `DF.sim.runner.computeCarryover(priorState, priorUpgrades, priorParams, core)` — reused from `runner.js` (no reimplementation).
3. Composes the new `state.carry`: `allMps/Mpc/Aps` multiply with existing carry; `mpsFloor/mpcFloor/apsFloor` add to existing carry. Existing carry chains forward across multiple transitions.
4. Increments `currentTier`, resets `consolidation` to 0, sets new `consolidationThreshold`, opens a new snapshot.
5. Logs a `tier_transition` event (new event type) and re-renders. The tick loop and autoclicker keep running uninterrupted.

`finalizeRun()` (refactored out of the original `endTier()`) only fires when `currentTier === MAX_TIER`. Stops the tick loop + autoclicker and shows the session report.

### End Tier button

Label is dynamic and depends on whether the current tier is the last implemented tier (`MAX_TIER`, computed from `data.UPGRADES`):

- `currentTier < MAX_TIER` → `"Advance to T" + (currentTier + 1)`. Clicking transitions to the next tier; the tick loop and autoclicker keep running.
- `currentTier === MAX_TIER` → `"End Tier " + currentTier`. Clicking ends the run and fires the session report.

Enabled in either case when `state.consolidation + CONSOLIDATION_EPS >= state.consolidationThreshold` (T3 addition — `CONSOLIDATION_EPS = 1e-9`). The dispatch lives in `endTier()`, which routes to `transitionToNextTier()` or `finalizeRun()` based on the same `currentTier < MAX_TIER` test.

### Consolidation display

**Engine-wide consolidation rename — 2026-05-13.** The 2026-05-11 rename was player-facing only (display labels updated; engine identifiers retained the legacy `cohesion` name as a relic). The 2026-05-13 pass extends the rename through the engine, simulator, save format, and dev tooling so the source of truth matches the player vocabulary. Renamed identifiers: state field `cohesion` → `consolidation`, threshold/growth params `cohesionThreshold` / `cohesionGrowth` → `consolidationThreshold` / `consolidationGrowth`, per-upgrade `cohesion` distribution field → `consolidation`, threshold-hit timestamp `cohesionHitMs` → `consolidationHitMs`, the floating-point guard `COHESION_EPS` → `CONSOLIDATION_EPS`, log payload fields `cohesion_hit` / `cohesion_after` / `cohesion_at_pause` → `consolidation_hit` / `consolidation_after` / `consolidation_at_pause`, the `cohesionLine()` chart helper → `consolidationLine()`. CSS variables and DOM IDs migrated in lockstep (`--cohesion-low/high` → `--consolidation-low/high`; `cohesion-block`/`fill`/`bar`/`num`/`max` → `consolidation-block`/`fill`/`bar`/`num`/`max`; `r-chart-cohesion` → `r-chart-consolidation`). `SAVE_VERSION` bumped 3 → 4 so pre-rename saves are refused at load (v3 payloads carry the legacy keys; a v4 reader would silently default them to zero and corrupt transition gates). No numeric impact — engine math is unchanged.

The HTML now reads `<span id="consolidation-num">0.00</span> / <span id="consolidation-max">1.00</span>` with both values populated by `render()`. **As of 2026-05-11, both the numeric readout and the bar fill are cumulative across tiers — one source of truth, they cannot disagree.** The numeric display reads `cumulative consolidation / cumulative threshold`, where `cumulative = sum(prior-tier budgets) + state.consolidation` and `cumulativeThreshold = sum(budgets through state.currentTier)`. Examples: T1 start `0.00 / 1.00`, T1 end `1.00 / 1.00`, T2 start `1.00 / 3.50`, T2 end `3.50 / 3.50`, T3 start `3.50 / 9.75`, T3 end `9.75 / 9.75`. The bar fill ratio uses the same numerator/denominator — see Expanding consolidation bar below. The "full" consolidation class (which colors the bar at completion) uses the `CONSOLIDATION_EPS` epsilon so the IEEE-754 `6.249999999999999` Galactic Bulge sum at T3 still snaps to "full".

**HUD vs. session-end chart convention.** The HUD shows cumulative ("where am I overall"); the session-end Consolidation *chart* on the report uses per-tier-normalized 0..1 axis (each tier ramps to 1, resets to 0 — "how did each tier shape"). The two conventions co-exist deliberately.

### Expanding consolidation bar (2026-05-11)

A single horizontal bar in the playtest HUD that **never resets across tiers**. At each tier transition the filled portion compresses leftward and the bar extends rightward to the new tier's entry fill ratio.

**Math.**
- Per-tier budget: `consolidationThreshold × consolidationGrowth^(n-1)` = T1 1.0, T2 2.5, T3 6.25, ...
- Cumulative budget through tier N: T1 = 1.0, T2 = 3.5, T3 = 9.75, ... (helper `cumulativeBudgetThroughTier(tier)` in `playtest.js`).
- Bar fill ratio = `(priorBudgets + state.consolidation) / cumulativeBudgetThroughTier(state.currentTier)`, clamped to 0..1.
- Entry ratios: T1 = 0, T2 = 1.0/3.5 = 28.6%, T3 = 3.5/9.75 = 35.9%. T4+ asymptote to ~40% (= 1 / consolidationGrowth = 1 / 2.5) as cumulative budgets grow geometrically.

**Tier-up animation.** `transitionToNextTier()` toggles a `.tier-up` class on `#consolidation-fill` for 1.6 s and triggers a re-render. The `.tier-up` rule lengthens the width transition from the default 240 ms (per-purchase) to 1400 ms with a `cubic-bezier(0.4, 0.0, 0.2, 1)` easing — the bar reads 100% pre-transition (just-finished tier hit its gate → fillRatio = 1.0) and post-render the width drops to the new entry ratio, animating across 1.4 s. The class clears after the animation window so within-tier purchases animate with the normal short transition again.

**Tier-skip semantics.** Skipped tiers are treated as 100% complete (their full budgets contribute to `priorBudgets`). On skip, `state.consolidation` resets to 0 for the target tier, so the bar lands at the target tier's entry ratio immediately on the post-skip render. The skip path does NOT apply the `.tier-up` class — no compress-and-extend gesture for skips, since the player wasn't watching the bar fill.

**Verification.** `validate.js` 60/100 cpm PASS, 150 cpm pre-existing FAIL (unchanged). `t3_calibrate.js` byte-identical (no sim code touched).

### Tiered-consolidation level display (T3 addition)

For upgrades with `consolidation > 0 && maxLevels > 1` (the Galactic Bulge shape), the per-row level indicator displays in `N/M` form (e.g., `3/7`) so the player can see how many of the seven consolidation-bearing levels they've bought. Regular stackables (`consolidation === 0`) and one-shots (`maxLevels === 1`) keep their existing displays. Per-tier snapshots' `consolidationHitMs` field also uses `CONSOLIDATION_EPS` for the same threshold-snap reason.

**Per-level consolidation tooltip.** Any upgrade matching the `consolidation > 0 && maxLevels > 1` condition gets a row-level `title=` tooltip reading `"+X.XX consolidation / level"` (e.g., `"+0.30 consolidation / level"` for Galactic Bulge). Set in `buildUpgrades` and never updated, so it follows the upgrade's static `consolidation` field. Generalized — any future tiered-consolidation upgrade picks it up automatically. Today's only match is Galactic Bulge.

**Per-level flavor arc (`descByLevel`) and synergy-variant flavor (`synergyVariants`).** Two optional flavor-extension fields on upgrade entries:

- `descByLevel: [string]` — array of per-level flavor lines. Used today only by Galactic Bulge (7 lines, one per level).
- `synergyVariants: [{ provider: string, text: string }]` — array of variant lines that swap in when a named provider is owned (`state.levels[provider] > 0`). Used today by **T2 Roche Lobe Overflow** (variants B / C — Local Bubble / Brown Dwarf) and **T3 HII Region** (variant D — Local Bubble cross-tier). The locked text for all three lives in `data.js` and mirrors `gameplay-design.md` §6 / §T3.

Resolution rule lives in `core.getUpgradeFlavor(upgrade, level, state)`. Order of checks:

1. **Synergy variant.** If `state` is provided AND `synergyVariants` is non-empty AND any entry's `provider` has `state.levels[provider] > 0`, return that variant's `text`. First match wins if multiple providers are owned simultaneously, so the array order is the priority order. (For Roche Lobe Overflow, Brown Dwarf is listed first — once both providers are owned in a Completion run, the C variant supersedes the B variant. Reorderable if the design intent ends up being the opposite.)
2. **Per-level arc.** Else, fall through to `descByLevel`:
   - `level === 0` (not yet purchased): returns `descByLevel[0]` if present (preview of the L1 line), else `desc`.
   - `level >= 1`: returns `descByLevel[level - 1]` if present and in range, else `desc`.
   - Out-of-range `level` clamps to the last line (defensive — can't actually happen since the buy path enforces `maxLevels`).
3. **Flat desc.** Upgrades without `descByLevel` always return `desc`.

`state` is optional — pass `null` from contexts without a live state (simulator card hover, design-doc previews). When `state` is null only rules 2 and 3 apply, preserving the pre-synergy-variant behavior.

`playtest.js` calls the helper for both initial render (in `buildUpgrades`, with level=0) and every `render()` tick (current owned level), passing `state` in both cases so per-level arcs and synergy-variant swaps stay in sync. The upgrade's `desc` field still carries the base / L1 line as a fallback for any path that doesn't go through the helper (the Parameters tab dev tool reads `desc` directly when editing — that surface is dev-only).

The base data fields are unchanged (numerical mechanics in `core.js` / `strategy.js` consume `synergies`, not `synergyVariants` — the variant array is purely display-layer). `validate.js` 60/100 cpm still PASS, 150 still pre-existing FAIL; `t3_calibrate.js` numbers unchanged.

### Session report extensions

- The H1 reads `"Tier N — session ended"` where N is the tier on which `finalizeRun()` fired.
- A new `#r-tier-breakdown` block is injected before the levels table when `tierSnapshots.length > 1`. Columns: Tier · Threshold hit · Tier ended · Mass at end. Times are tier-local (relative to that tier's `startMs`).
- The cumulative `#r-levels` table iterates all UPGRADES, so multi-tier runs naturally show levels for every owned upgrade.
- The legacy "Time to consolidation (Threshold)" row in `#r-grid` continues to show the FIRST tier's consolidation-hit time. Per-tier hits live in the breakdown block.

### Log schema additions

A new event type `tier_transition` carries `{ from_tier, to_tier, mass_at_transition, carry, new_consolidation_threshold }`. The `purchase` event payload also gained `tier`. The `end` event payload gained `tier_snapshots` and `ended_at_tier`.

### Math layer change

`src/sim/runner.js` exports three helpers for browser callers: `computeCarryover` and `upgradesForTier` (added Phase 6), plus `composeCarryChain` (added 2026-05-10). Pure functions with no closure state — playtest path uses them directly. `computeCarryover` is the per-tier primitive (used by `transitionToNextTier`'s incremental accumulator); `composeCarryChain` walks the full prior-tier chain (used by `runSimulation`'s `tier > 1` carry seed and by the tier-skip dev tool, so both paths reproduce live-transition semantics).

### Multi-tier session report polish (post-Phase-6)

Six follow-ups to the report panel landed after the first full T1+T2 playthrough:
1. Removed the redundant top-of-summary "Time to consolidation (Threshold)" row (per-tier breakdown table covers it).
2. Completionist roll-up is generic over `UPGRADES.filter(u => u.completionist)` so future tiers populate automatically.
3. Consolidation chart is now tier-normalized (0..100% per tier) with vertical separators at transitions and per-tier threshold-hit hashes; tier badges sit above each segment.
4. Income chart applies a 5 s trailing rolling average so click spikes don't sawtooth the stacked area.
5. ~~Levels chart shows ALL tiers' upgrades stacked tier-by-tier on a single continuous chart (approach C from the design discussion: T1 bands stay flat after transition, T2 bands ramp from 0 — visually conveys the carry-forward rule).~~ **Revised 2026-05-11 after first T3 playtest.** Restricted to the **current (final) tier's upgrades only**. The all-tiers stack worked for T1+T2 (~16 bands) but became visual noise at T3 (24+ bands, most of them flat carry-over baselines). Older-tier upgrades still contribute via carry (covered by income / mass charts); the levels chart now answers "what did I buy in the session being reported" rather than "what is the cumulative state". Legend below the chart filters to match. Implementation: `.filter(u => (u.tier ?? 1) === state.currentTier)` on the tier-ordered upgrade list in `renderReportCharts`. T3 entries (DLD/HII/PM/SDW/HVC/GB/SagB2/GC/AN) added to `REPORT_SHORT` and `REPORT_UPGRADE_COLORS` so the abbreviated legend renders correctly.
6. Comparison-vs-sim chart auto-detects which tiers the player played and which mode (completion / threshold) per tier from the snapshot's exit levels, then stitches the multi-tier sim trace end-to-end and compares it to the player's full run. Delta is now meaningful for multi-tier runs (sub-30% range for a real player vs. perfect bot, instead of the previous T1-only +475%). **Extended 2026-05-11 to handle skipped tiers.** When `state.tierSnapshots` contains any entries with `skipped: true`, the comparison chart prepends the sim's mass trajectory across those skipped tiers onto "Your run" (since the skip's starting state IS the sim's exit state from those tiers — they share that prefix exactly), then offsets the player's actual mass samples by `skipPrefixTime_s` so the two timelines align. Visually: the two lines run identically through the skip prefix and diverge at the first live-played tier boundary. For organic runs (no skipped tiers) the offset is 0 and the path is a no-op. The leading `(0, 0)` sample in `trace.mass` is dropped when prepending so the join is continuous instead of spiking down. `xMaxCmp` uses `trace.totalTime_s + skipPrefixTime_s` so the chart's x-axis covers both segments.

### Known follow-ups

- ~~HII Region Synergy D variant (Local Bubble buff active) flavor is **locked** in `gameplay-design.md` and section 2 of this doc, but **not stored in code yet**. T2's Roche Lobe Overflow Synergy B/C variants are in the same situation (design-doc-only). Proposed convention when the runtime swap lands: a `synergyVariants: [{ provider: "Local Bubble", text: "..." }]` field on the target upgrade entry, with the consumer keying off `state.levels[provider] > 0`. Surfaced as a question; not invented unilaterally.~~ **Resolved 2026-05-10.** `synergyVariants: [{ provider, text }]` field landed in `data.js` for all three locked variants; resolution rule lives in `core.getUpgradeFlavor(upgrade, level, state)`; smoke harness at `Prototype/src/test/flavor_smoke.js` covers the four resolution branches per upgrade. See the per-level-flavor-arc paragraph above for the full schema and resolution order. Open sub-question deferred for design pass: priority order when both Roche Lobe Overflow providers (Local Bubble + Brown Dwarf) are owned — currently C-variant (Brown Dwarf) wins by being listed first; reorder in `data.js` if the design intent is the opposite.
- ~~Awaiting first real T3 playtest data to ground the bot's HVC purchase timing (Completion-handoff Completion gap is currently +57.9% — slightly below the +65–75% target band; sensitive to HVC `initCost` bistability, where a small cost change can flip whether HVC level 2 buys before or after Active Nucleus).~~ **Resolved 2026-05-10 carry-composition pass.** The pre-fix +57.9% Comp-handoff gap was an artifact of a `runSimulation` chaining bug: the runner computed each tier's carry from `computeCarryover(prior_finalState, prior_tier_upgrades_only)`, silently dropping T1's flat additives and `allMps` multipliers from T3's seed (~4.5% under-count at the Comp handoff, growing each tier). The live `transitionToNextTier` was always correct. Fix: new `composeCarryChain` helper walks every prior tier and accumulates floors/allMults — used by `runSimulation`'s tier-seed and by the tier-skip dev tool. Post-fix gaps at 100 cpm: **Comp-handoff +70.2%**, **Thr-handoff +73.1%** — both inside the +65–75% band. To land back in band, `High-Velocity Cloud` `costGrowth` was eased 2.28 → 2.10 (initCost 10.5M unchanged), softening the within-stack progression while preserving the first-level sticker shock. Open the band check on first real T3 playtest.
- ~~Awaiting first real T3 playtest data to validate the post-fix calibration (HVC progression at growth 2.10, +70/+73% Completion-vs-Threshold gaps) against an engaged human player.~~ **Resolved 2026-05-10 evening — first real T3 playtest landed; playtest-informed retune followed.** First real T3 playtest at 100 cpm (Completion handoff): Threshold 24:20, Completion 41:42 — sim bot times match to the second (the playtest was the bot output, used as ground truth to confirm the deterministic chain). Beyond the timing, the playtest surfaced two engagement problems: (a) clicking invisible (1% income share at full autoclicker load — 30:1 autoclicker:player rate ratio), (b) curve perceived as "WAY too backloaded" (long flat-feeling middle, GC save at 70% of runtime creates a 4+ minute dead-zone where the bot only saves). Retune landed:
  - **Click rebalance.** PM `addMpc` 40 → 80 (click value 2x). SDW `addAps` 2.0 → 1.0 (cut autoclicker rate). HVC `addAps` 4.0 → 2.0 (cut completionist autoclicker). Net: autoclicker:player ratio 30:1 → 15:1; click income share 0.6% → 1.2% (Comp), 2.6% → 4.8% (Thr). Autoclicker still dominant by design but clicks visibly contribute now.
  - **Curve smoothing.** HVC `costGrowth` 2.10 → 2.05 (gentler late wall). DLD→HII synergy 1.05 → 1.06/lvl (each mid-tier DLD purchase lifts HII slightly more, smoothing mid-game MPS climb).
  - **Calibration.** `node validate.js` T1 byte-identical (PASS / PASS / FAIL at -9.7% — pre-existing 150 cpm tick-granularity artifact, unrelated). T2 byte-identical at all cpm × scenario combinations (T2 not touched). T3 gaps: **+73.4% Comp-handoff / +75.1% Thr-handoff** (within +65–75% band; Thr-handoff at the upper edge by design margin). cpm sensitivity: +71.2% / +73.4% / +78.4% at 60/100/150 cpm. T3 times at 100 cpm: Comp 40:16 (was 41:42), Thr 23:13 (was 24:20).
  - **Known residue.** GC dead-zone (4-6 minute pure-save window at ~70% of runtime when bot saves for Globular Cluster 150M) is intrinsic to the design and not eliminated. Reducing GC cost further compresses the gap below band; the dead-zone is accepted as part of T3's late-wall character.
  - **Open design question — flagged for creative-director.** During tuning exploration, adding a small `addMps` to Galactic Bulge (currently pure consolidation-only) was considered as a way to give the mid-tier climb more steady mass-flow growth. Decided against landing it: the "pure progress purchase" design intent for tiered-consolidation upgrades is a deliberate mechanical signature. Surfaced here as a future design question if the GB grind ever feels too thin from a "buy lands but nothing visible changes" perspective.
- ~~APS-from-upgrades income was missing from the live `tick()` in `playtest.js`. The simulator's `runner.js:387` adds `autoInc = aps × mpc` per tick; the live tick only added `mps`. Net effect: every owned APS upgrade (T2 RLO, T3 SDW/HVC) silently produced zero mass in live play even though the AC/sec stat displayed correctly. The dev-tool autoclicker (which calls `pull()`) was unaffected. **Symptom:** the 2026-05-11 T3 Comp-handoff playtest at 60 cpm clocked ~99 min, matching the APS-OFF bot prediction of ~90 min instead of APS-ON ~24 min — diagnosed by sim-tuner, traced to this bug.~~ **Resolved 2026-05-11.** `tick()` now mirrors `runner.js`: `mps + (aps × mpc)` accrues per 1 Hz tick; `state.massFromAuto` is a third bucket alongside `massFromClicks` and `massFromPassive`. `pull()` is unchanged (manual + dev-autoclicker clicks still route through it; `state.clicks` is still the count of `pull()` invocations). The session report gained a "Mass from auto" row (HTML `#r-mass-auto`), and the income breakdown chart auto-detects whether to draw the auto band (`includeAuto = autoMax > 0`) so T1 sessions are visually unchanged. `state.massFromAuto` is also reset in `skipToTier`. Tick log payload gained `aps` and `auto_inc` so `traceFromPlaytestLog` can reconstruct the auto-band per-second bins. End-event payload gained `mass_gained_auto`; `mass_gained_total` and `click_share` now include auto in the denominator (matching `runner.js` semantics). Verification: `node validate.js` byte-identical (PASS / PASS / FAIL — pre-existing 150 cpm artifact, unrelated); `node t3_calibrate.js` byte-identical; headless smoke confirmed `state.mass` and `state.massFromAuto` both rise by `aps × mpc` per tick with synthetic SDW=14 + HVC=5 state (aps=24, autoInc=34,584/s).

---

## 10. Out of scope for T1 prototype

Per the original barebones spec — explicitly skipped:

- Save/load (refresh = start over)
- Animations beyond CSS hover/transition
- Sound or music
- Tutorial or onboarding popups
- Tier 2+ logic
- Localization
- Server-side anything
- Build tooling

---

## 11. Sync workflow

When changes are made:

1. **Editing this doc to drive code changes** — change a value here, then ask Claude to sync. Claude will diff this doc against the code and apply the deltas.
2. **Editing code first** — after a code change, update the relevant section of this doc so it stays canonical.
3. **Conflict** — if doc and code disagree, the asker should be told both values and asked which to keep before either is touched.

The simulation spreadsheet (`dark-filaments-simulation-v1.1.2.xlsx`) is a separate source — when its parameters change, you'll typically push them to this doc first, then sync to code.

---

## 12. Phase 3 Part A — calibration note (open)

The Phase 3 Part A validation harness compares the JS sim's wall-clock time against the three real T1 playtests. Result on 2026-05-07:

```
 59.5 cpm  → real 11:35 / sim 11:18 (-2.5%)  PASS
100.0 cpm  → real  8:37 / sim  8:15 (-4.3%)  PASS
147.9 cpm  → real  6:53 / sim  6:13 (-9.7%)  FAIL
```

The 150 cpm miss is **monotone with cpm** (drift grows as click rate rises), which the spec flags as the signature of a tick-rate granularity artifact rather than a VPC formula bug. Cross-check: the legacy Python `sim_validate.py` (10-second ticks) at the same average cpms produces 11:50 / 8:30 / 6:30 — matching real within 6% — and at 60 cpm the JS and Python sims produce **identical** final levels (SW=17 AB=16 SC=7 Mag=5). The strategy port is faithful; the divergence comes from the 1 Hz tick rate the spec mandates (matching the prototype's tick), which lets the algorithmic player chain rapid purchases that the 10-s Python sim and the human player cannot.

**Open decision** (for next sim-tuner session): widen the calibration band, tune engagement at high cpm, or accept the artifact as expected bot-vs-human drift at high click rates. No constants tweaked in Part A per the spec's "surface, don't reshape" instruction.
