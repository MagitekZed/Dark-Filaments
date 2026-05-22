// Dark Filaments — sim data
// Source of truth for upgrade parameters and default sim params.
// Lifted verbatim from dark-filaments-t1.html as part of Phase 1 of the JS sim migration.
// Mirror of dark-filaments-t1-current-state.md section 1.
//
// TS port (scaffold plan §5.1): IIFE wrapper + UMD shim stripped. Every numeric
// literal and comment preserved exactly — the numbers ARE the T1–T4 lock and the
// comments document calibration history. The cross-tier synergy IIFE is preserved
// as a module-level self-invoking block. TIERS metadata (§4.7) and the clean-break
// SAVE_VERSION = 5 (§4.6) are the only additions/edits over the prototype.

import type { Params, TierMeta, Upgrade } from './types';

export const UPGRADES: Upgrade[] = [
  // ---- Tier 1 ----
  // 2026-05-12 long-burn retune (M☉ denomination + steep engagement curve).
  // All numerical fields (initCost, addMps, addMpc, baseMps) rescaled ÷600
  // from the pre-rescale calibration. Structure / synergies / max-levels /
  // consolidation distribution / completionist flags are UNCHANGED. T1 mass scale
  // now lands at ~1 M☉ exit (was ~600 in arbitrary mass units), aligning with
  // the locked solar-mass denomination across all 10 tiers. Engagement curve
  // also restructured (see DEFAULT_PARAMS.perTierEngagement below) — T1
  // hyper-present, falling steeply toward almost-not-playing by T10.
  //
  // Source-of-truth: sim-tuner locked spec 2026-05-12. The original
  // pre-rescale calibration history is preserved in git.
  // 2026-05-12 iteration 2: Reading-B peak-mass anchor.
  // Iteration 1 ÷600 rescale produced active time 2m49s, click share 81%, peak
  // mass ~0.1 M☉ — three metrics off vs targets. Root cause: baseMpc dropped
  // only ÷50 (1.0 → 0.02) while everything else dropped ÷600 — click income
  // ~12× over-strong vs uniform scaling. This iteration:
  //   (1) baseMpc 0.02 → 0.0017 (another ÷~12) — restores intended floor-click weight
  //   (2) passive stackables (SW, AB) lifted ~2× to keep throughput in 10-15 M☉ band
  //       after the click-share correction
  //   (3) Magnetosphere costGrowth 2.00 → 2.10 and FP cost 1.42 → 1.55 to lift
  //       the post-consolidation save peak to ~1.0 M☉ (Reading B anchor: peak-counter
  //       reading at the moment of structural completion ≈ T1 solar-mass label)
  //   (4) Stellar Coupling addMpc lifted 2× (0.00058 → 0.00116) to compensate
  //       the floor-click reduction — keeps SC a meaningful click-power lever
  //       while clicks no longer dominate from a bare-floor start
  { name: "Solar Wind",       tier: 1, initCost:   0.012, costGrowth: 1.20, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.00013, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000,   selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000,   selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,     allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Charged particles drift outward and return with company. We are pulling more than we used to." },
  { name: "Asteroid Belt",    tier: 1, initCost:  0.033, costGrowth: 1.20, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.00033, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000,   selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000,   selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,     allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "The belt yields. Iron, ice, the slow gravel of the early system. Each rock finds us." },
  { name: "Stellar Coupling", tier: 1, initCost:  0.037, costGrowth: 1.40, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000,   selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.00058, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000,   selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,     allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "We pull harder. The center holds tighter." },
  { name: "Magnetosphere",    tier: 1, initCost:  0.13,  costGrowth: 1.65, maxLevels:  5, consolidation: 0.0,
    baseMps: 0,   addMps: 0.00167, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000,   selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000,   selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,     allAps: 1.0,
    synergies: [],
    completionist: true,
    desc: "The system's invisible shell. Charged particles arc and return. We catch what would have escaped." },
  { name: "Orbital Resonance", tier: 1, initCost: 0.40,  costGrowth: 1.00, maxLevels: 1, consolidation: 0.4,
    baseMps: 0,   addMps: 0.000,   selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000,   selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000,   selfAps: 1.0,
    allMps: 1.250, allMpc: 1.0,    allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Periods align. The system breathes in time with us. Everything we touch becomes synchronous." },
  { name: "Heliopause",       tier: 1, initCost: 0.96,  costGrowth: 1.00, maxLevels:  1, consolidation: 0.6,
    baseMps: 0,   addMps: 0.000,   selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000,   selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000,   selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,     allAps: 1.0,
    synergies: [{ target: "Stellar Coupling", multiplier: 1.5 }],
    completionist: false,
    desc: "We have reached the edge of our influence. Beyond it, the rest of the galaxy waits." },
  { name: "First Photons",    tier: 1, initCost: 1.00,  costGrowth: 1.00, maxLevels:  1, consolidation: 0.0,
    baseMps: 0.00167,  addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,        addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,        addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,       allMpc: 1.200, allAps: 1.0,
    synergies: [],
    completionist: true,
    desc: "Light, finally. The first photons leave the surface and find us. Everything quickens." },

  // ---- Tier 2 — Stellar Neighborhood (long-burn M☉ retune; structural fields preserved) ----
  // 2026-05-13 long-burn retune (14 iterations to convergence). T2 numerical
  // fields rescaled by ÷135 from the pre-retune v5-M values to align with
  // the M☉ scale locked in T1 (peak in-tier mass ≈ 1 M☉) and the Reading B
  // anchor for T2 (peak in-tier mass ≈ 1000 M☉ ≈ Pleiades-class).
  //
  // Iteration history (highlights):
  //   iter #1: uniform ÷135 rescale of all numerical fields. Peak landed at
  //     998.88 M☉ (dead-on Reading B). BUT hyper-onboard completed T2 in
  //     56m 6s — violating the load-bearing patient-universe rule.
  //   iter #2: OC=1000. Hyper DNFs; Comp-Thr gap collapsed to +4.5%.
  //   iter #3-#10: search for OC value enforcing patient-universe at peak ≈ 1000.
  //     Threshold found at OC=600 (hyper DNF); rusher buyers still finish phase 1
  //     up to OC ~900.
  //   iter #11: OC=950 — all 4 primary pairings DNF phase 1 (hoarders and rushers
  //     both), peak 1035 (Reading B +3.5%).
  //   iter #12: Microlensing addMpc 0.0178 → 0.150 (8.5×) to raise click share.
  //     Click share landed at 31.7% BUT hyper-onboard completed T2 (click income
  //     too strong → patient-universe broken).
  //   iter #13: OC=950, Microlensing addMpc=0.060 (3.4× lift). Click share
  //     13.6% at bot-Comp. Comp-vs-Thr gap +4.8% — user flagged as too small.
  //   iter #14 LOCKED: Moving Group initCost 333 → 1000 (3× cost lift) with
  //     proportional baseMps lift 0.119 → 0.358 (preserves mass:income ratio).
  //     MG now lands as a discrete post-consolidation save block instead of being
  //     absorbed into the OC-save ride-along. Comp-vs-Thr gap +5.8% (+1pp over
  //     iter #13). Peak preserved at 1033 M☉ (BD-L5 save still dominant).
  //     Hyper-onboard DNF preserved. T1 byte-identical preserved.
  //
  // Final verification metrics (bot-100cpm × Completion):
  //   Active duration: 45m 17s (was 44m 50s in iter #13)
  //   Peak in-tier mass: 1033.10 M☉ (Reading B +3.3%; within ~5% tolerance)
  //   Click share: 11.3%
  //   Levels at exit: SK=58, LB=21, ML=16, RLO=6, BD=5, all 4 one-shots
  //   Comp-vs-Thr gap: +5.8% (Thr 42m 47s vs Comp 45m 17s)
  //
  // === Comp-vs-Thr gap — STRUCTURAL FINDING (sim-tuner escalation 2026-05-13) ===
  // User brief targeted +40-50% Comp-vs-Thr gap to incentivize path choice.
  // Sweep analysis revealed this is STRUCTURALLY INFEASIBLE under the current
  // T2 design slate while preserving peak ≤ 1050 M☉:
  //
  //   Sweep result (MG cost × BD costGrowth, holding all else iter #13):
  //     Peak ≤ 1050 (Reading B band):   max achievable gap ≈ +5.8%
  //     Peak ≤ 1300 (Reading B +30%):   max achievable gap ≈ +7.4%
  //     Peak ≤ 1600 (Reading B +60%):   max achievable gap ≈ +9.3%
  //     Peak ≤ 2000 (Reading B +100%):  max achievable gap ≈ +10.3% (asymptote)
  //
  // Root cause: Comp-vs-Thr gap is the post-consolidation completionist phase only.
  // Thr exits at the moment of OC purchase (consolidation threshold met). Comp
  // continues with BD-L1..L5 + MG. Post-consolidation income at ~9-18 M/s burns
  // through 2000 M☉ of completionist work in 110-230s — a small fraction of
  // Thr's ~2570s pre-consolidation time.
  //
  // To reach +40% gap, post-consolidation phase needs ~1000s, requiring ~+16,000 M☉
  // of completionist work at the current income rate. Under peak ≤ 1050, that's
  // ~16 discrete saves of ~1000 M☉. Current slate has 6 (BD-L1..L5 + MG).
  //
  // Levers that COULD widen the gap (all require structural changes outside
  // sim-tuner authority — escalated to engineering-director / creative-director):
  //   1. Add more T2 completionist content (more upgrades / higher max levels).
  //   2. Substantially weaken post-consolidation income via shift of allMps
  //      multipliers onto consolidation-bearing-only (non-completionist) one-shots.
  //   3. Strategy refactor: disable allMps multipliers during post-consolidation focus.
  //   4. Relax the Reading B peak constraint (peak ≤ 1050 → e.g. ≤ 2000).
  //
  // Iter #14 represents the best gap achievable under current constraints
  // without structural changes. The user's "+40-50% gap as a soft target"
  // remains an open question for the design-corpus pass.
  //
  // Trade-offs documented in gameplay-design.md §3 T2 entry:
  //   - "+80-100% Comp-vs-Thr gap" target is STALE under long-burn pacing.
  //     Iter #14 lands at +5.8%. Structural limitation surfaced.
  //   - "2-8h Engaged Comp calendar" target NOW ACHIEVED. Phase 2 cadence
  //     fix (checkInsPerDay 1 → 4) lands Engaged Comp p50 at 4h 41m (was
  //     17h 51m). Engaged Thr p50 also 4h 41m. Both inside the locked band.
  //   - "30% click share" target structurally limited by perTierEngagement
  //     T2=0.25; 11.3% is the new equilibrium under MG=1000 (slightly down
  //     from iter #13's 13.6% because MG=1000's allMpc:1.30 fires later in
  //     the run, reducing click-share weight pre-consolidation).
  //
  // Preserved from prior calibration (NOT changed):
  //   - Stellar Kinematics selfMps: 1.115 (the curve-shape lever from
  //     2026-05-11 feel-tuning pass; SK is dominant T2 stackable).
  //   - All three synergies: A (BP→ML ×1.5 flat), B (RLO→LB ×1.05^lvl),
  //     C (BD→RLO ×1.10^lvl). Brown Dwarf cross-tier provider role for
  //     T3 Subhalo (when Phase 2 engine extension lands) preserved.
  //   - Consolidation math: 0.6 + 0.9 + 1.0 = 2.5 (T2→T3 gate).
  //   - Moving Group's ×1.30 allMpc as the late-T2 click-power amplifier.
  //   - Peculiar Velocity's ×1.40 allMps as the mid-tier passive amplifier.
  //   - Brown Dwarf initCost=37 + costGrowth=2.28 → L5 cost ≈ 1000 M☉ as the
  //     Reading B peak anchor.
  //   - OC=950 (the hyper-onboard DNF gate).
  //
  // Structural notes:
  //   - The Reading B peak (~1000 M☉) is still the BD-L5 save peak under
  //     iter #14. BD progression at initCost=37, costGrowth=2.28 → L5 cost
  //     = 37 × 2.28^4 ≈ 999 M☉. MG=1000's save peaks at ~990 (below BD-L5
  //     peak ~1033 because MG is bought before BD-L5 in the post-consolidation
  //     completionist sequence).
  //   - Open Cluster's bumped cost (46 → 950) makes OC the dominant gate save,
  //     forcing hyper-onboard players to close the tab and return. The save
  //     to OC takes longer than 60min of phase-1 active income at engagement
  //     0.25 + 60 cpm can produce.
  //   - Moving Group at 1000 M☉ adds ~64s to Comp's active duration vs iter #13's
  //     MG=333 (which was absorbed as a ride-along during pre-OC saves). MG=1000
  //     forces a discrete post-consolidation save of ~69s at post-OC income rate.
  //
  // Stackables (5)
  { name: "Stellar Kinematics", tier: 2, initCost:   0.67, costGrowth: 1.135, maxLevels: 99, consolidation: 0.0,
    baseMps: 0.0148, addMps: 0.000, selfMps: 1.115,
    baseMpc: 0,      addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,      addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,     allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Stars wander, and we listen for the wandering." },
  { name: "Local Bubble",       tier: 2, initCost:  2.0, costGrowth: 1.135, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.0111, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000,  selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000,  selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,    allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "A cavity carved by old supernovae. We are inside it. Everything inside is ours." },
  { name: "Microlensing",       tier: 2, initCost:  2.3, costGrowth: 1.34,  maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000,  selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.060,  selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000,  selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,    allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Light bends around mass we cannot see. We learn the shape of what we cannot touch." },
  { name: "Roche Lobe Overflow", tier: 2, initCost:  4.0, costGrowth: 1.42, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000,    selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000,    selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000667, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,      allAps: 1.0,
    synergies: [{ target: "Local Bubble", multiplier: 1.05 }],
    completionist: false,
    desc: "One star feeds another across the lobe. Material flows on its own.",
    // Synergy-variant flavor swaps (locked text from gameplay-design.md
    // §6). Resolution rule lives in core.getUpgradeFlavor — first match wins.
    // Both providers can be owned simultaneously in a Completion run (Local
    // Bubble lands early, Brown Dwarf is a max-5 completionist that lands
    // later). The design doc does not specify a priority. The order below is
    // a deliberate display choice: Brown Dwarf first, so the C variant takes
    // over once Brown Dwarf is on the board — letting the later-tier line
    // supersede the earlier one. Reorder if the design intent ends up being
    // the opposite (B persists, C never displays once both are owned).
    synergyVariants: [
      { provider: "Brown Dwarf",  text: "Unseen mass disturbs the pair. Each perturbation tightens the orbit a little. The Roche lobe is filled, then filled again." },
      { provider: "Local Bubble", text: "Mass that crosses the Lagrange point does not all reach the companion star. The remainder enters the bubble, and the bubble is patient." },
    ] },
  { name: "Brown Dwarf",        tier: 2, initCost: 37, costGrowth: 2.28, maxLevels:  5, consolidation: 0.0,
    baseMps: 0,   addMps: 0.0741, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000,  selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000,  selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,    allAps: 1.0,
    synergies: [{ target: "Roche Lobe Overflow", multiplier: 1.10 }],
    completionist: true,
    desc: "Failed star, patient mass. It never ignited; it accumulated." },

  // One-shots (4)
  { name: "Binary Partner",     tier: 2, initCost: 16, costGrowth: 1.00, maxLevels: 1, consolidation: 0.6,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Microlensing", multiplier: 1.5 }],
    completionist: false,
    desc: "A second center of mass. The orbit becomes a duet." },
  { name: "Peculiar Velocity",  tier: 2, initCost: 28, costGrowth: 1.00, maxLevels: 1, consolidation: 0.9,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.400, allMpc: 1.0,  allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "We move against the local flow. Mass piles into our wake." },
  { name: "Open Cluster",       tier: 2, initCost: 950, costGrowth: 1.00, maxLevels: 1, consolidation: 1.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Hundreds of young stars, gravitationally loose. The shape of belonging, briefly." },
  { name: "Moving Group",       tier: 2, initCost: 1000, costGrowth: 1.00, maxLevels: 1, consolidation: 0.0,
    baseMps: 0.358, addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,     addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,     addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,    allMpc: 1.300, allAps: 1.0,
    synergies: [],
    completionist: true,
    desc: "Stars sharing a common drift through the disk. We have learned to drift with them." },
  // Completionist stackable (T2 retune pass #3, 2026-05-13). Massive evolved
  // stars with strong stellar winds shedding mass at ~10⁻⁵ M☉/yr — the first
  // Act 1 foreshadow of Act 2 loss. SD mass scale: 10-25 M☉ per WR. Buy-order
  // slot: 10th, after Moving Group. Channel: addMpc (click-lift; chosen by CD
  // over passive to avoid redundancy with MG's allMps+allMpc compound).
  // consolidation: 0 (completionist pattern; preserves Threshold-mask). No
  // synergies (standalone; doesn't add a fourth T2 synergy).
  //
  // === Iter #23 → Iter #24 cost tune-down (2026-05-13 PM) ===
  // The CD-2 / NEW-1 reframe (locked 2026-05-13, see
  // feedback_strategic-completion-lens.md): pre-peak Comp-vs-Threshold gap
  // target is **loose** (sim-tuner picks pleasing numbers; no narrow band;
  // the per-tier gap is felt opportunity cost on a single playthrough, not
  // measured asymmetry across compared playthroughs). The retired +40-50%
  // gap target at T2 is now an informational outcome, not a calibration
  // mandate. Tight calibration only at PEAK tier (~parity), INVERSION tier
  // (Comp materially faster), and final tier.
  //
  // Iter #23 (WR initCost=4500) drove Comp peak in-tier mass to 4494 M☉ —
  // 4.5× the ~10³ Pleiades-class named scale. Under the reframe that cost
  // inflation is no longer load-bearing; sim-tuner tunes WR down so Comp
  // peak stays within ~2× of named scale while keeping Comp visibly distinct
  // from Threshold's 950 M☉ peak (the "you gathered every scrap, more than
  // the named scale required" identity stays felt).
  //
  // Tuning sweep at bot-100cpm (flat costGrowth=1.00, addMpc=0.025; T1
  // handoffMode matched to T2 mode):
  //   initCost=4500 → Comp peak 4494, gap +26.1%  (iter #23; over named scale)
  //   initCost=2500 → Comp peak 2499, gap +10.1%
  //   initCost=2000 → Comp peak 1999, gap  +6.8%  (top edge of new band)
  //   initCost=1750 → Comp peak 1748, gap  +5.1%  ← LOCKED iter #24 (mid-band)
  //   initCost=1500 → Comp peak 1498, gap  +3.5%  (bottom of new band)
  //
  // Selected: initCost = 1750. Lands Comp peak at ~1.84× named scale —
  // comfortably inside the 1500-2000 M☉ target band, ~84% above Threshold's
  // 950 peak (visible distinction preserved). Gap percentage falls out at
  // +5.1% — informational only under the new philosophy. costGrowth flat
  // 1.00 stays (most peak-efficient shape). addMpc 0.025 stays (the
  // click-channel benefit is independent of cost). Max-3 stays.
  //
  // Final verified metrics (bot-100cpm, T1 handoff matched to T2 mode):
  //   Completion: T2 active 3050s (50:50); peak 1748 M☉; click share 9.8%
  //   Threshold:  T2 active 2901s (48:21); peak  949 M☉; click share 11.3%
  //   Comp-vs-Thr gap: +5.1% (informational)
  //   WR levels at exit (Comp): 3 (all three saves complete)
  //   T1 byte-identical: preserved (no T1 fields touched)
  //   Hyper-onboard × comp-hoarder T2: DNF 10/10 (patient universe preserved)
  //   Engaged trajectory primaries (N=5/seed=1/30d): in band (2-8h Comp / 1.5-6h Thr)
  { name: "Wolf-Rayet Star",    tier: 2, initCost: 1750, costGrowth: 1.00, maxLevels: 3, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.025, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: true,
    desc: "Massive stars shedding their outer layers in strong winds. The carbon and nitrogen drift outward, faster than we can hold. Mass is leaving us. We are learning what that means." },

  // ---- Tier 3 — Dwarf Spheroidal *("the dark matter has a name")* ----
  // Inserted 2026-05-13 afternoon under the 11-tier ladder reshape.
  // CALIBRATED slate (2026-05-13 evening, Step D, sim-tuner iter #10):
  // 4 stackables + 4 one-shots + 3 synergies. Numbers locked under Reading B
  // (peak in-tier mass at Consolidation-gate-crossed moment ~3.16M M☉, ±0.5
  // dex) + 24-48h Engaged Comp / 18-36h Engaged Thr calendar bands. The
  // slate's structural shape (names, types, completionist flags, synergy
  // topology, consolidation distribution) follows gameplay-design.md §3
  // (Tier 3 — Dwarf Spheroidal).
  //
  // Defining physics: dark-matter-dominated (Draco M/L ~440). The luminous
  // part is the small part. The tier carries the narrative beat *"the dark
  // matter we are embedded in has a name"* (the Draco Dwarf completionist
  // anchor's flavor line). The Subhalo upgrade is the first hidden-channel
  // mechanic in the game — multiplies prior-tier MPS carry only via the
  // dedicated `carryMpsMult` engine field; contributes nothing visible on
  // MPS/MPC/APS stat lines. The hidden-channel UX (how the player perceives
  // Subhalo when stats don't point at it) is a Phase 2 engineering-director
  // question, separate from the math calibration here.
  //
  // Consolidation distribution (gameplay-design §3 locked):
  //   Orphan Stream      0.9
  //   Sculptor Dwarf     1.5
  //   Draco Dwarf        0.0  (completionist anchor — Threshold-mask friendly)
  //   Sagittarius Stream 3.85 (T3→T4 transition gate)
  //   = 6.25  matches engine 1.0 × 2.5^2.
  //
  // Synergies (3 total, locked shape per §3; user-ratified coefficients):
  //   A) Orphan Stream → RR Lyrae          × 1.5 (flat one-shot → click stackable)
  //   B) Population II → Subhalo           × (1 + 0.03 × N) — additive same-stat-family
  //   C) T2 Brown Dwarf → Subhalo          × (1 + 0.03 × BD_level) — cross-tier additive (attached below via IIFE)
  //
  // Subhalo felt-magnitude (user-ratified 2026-05-13):
  //   α = carryMpsMult = 1.08 per level (Visible band, lower edge).
  //   β_B = β_C = 0.03 additive per provider level.
  //   Iteration bands: ±20% on α (1.064 to 1.096); ±50% on β (0.015 to 0.045).
  //   Final values landed at α=1.08, β_B=β_C=0.03 (anchor values, no drift).
  //
  // === Calibrated numerical values (Step D iter #10) ===
  // N=50 verified at seed=1 across all 4 primary pairings (engaged × all
  // four buyer profiles); per-pairing T3 calendar drift within ±15% of
  // target midpoint:
  //   p1 engaged × comp-hoarder (Comp): T3 p50 1d 7h (31h)  → drift -12.1% within band 24-48h
  //   p2 engaged × comp-rusher  (Comp): T3 p50 1d 9h (33h)  → drift  -7.1% within band 24-48h
  //   p3 engaged × thr-hoarder  (Thr):  T3 p50 1d 5h (29h)  → drift  +8.5% within band 18-36h
  //   p4 engaged × thr-rusher   (Thr):  T3 p50 1d 6h (30h)  → drift +14.7% within band 18-36h
  // T1/T2 byte-identical preserved (p17 bot-60cpm T1 11m 40s, T2 1h 8m).
  // Locked harnesses pass: save_migration 56/56, validate_offline 38/38,
  // validate_subhalo 28/28, profiles_smoke 396/396.
  //
  // Stackables (4):
  { name: "Population II",         tier: 3, initCost: 25000, costGrowth: 1.135, maxLevels: 99, consolidation: 0.0,
    // T3 retune iter #10 (2026-05-13, Step D). Provider for Subhalo
    // synergy B (β_B = 0.03 additive per level, user-locked). Cost scale
    // sized so the Threshold-path peak mass at Sagittarius Stream gate-
    // cross lands close to the Reading B target (~3.16M M☉). T3 first
    // stackable in the catalog; baseMps=8.0 makes Pop II a meaningful
    // self-mass contributor while staying small relative to T2 carry-MPS.
    baseMps: 8.0, addMps: 0.000, selfMps: 1.12,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Subhalo", multiplier: 1.03, kind: "additive" }],
    completionist: false,
    desc: "Old stars, metal-poor, made before the universe had much else to make them from. They have been here since before we knew to look. Their light is the light of survivors." },
  { name: "Subhalo",               tier: 3, initCost: 40000, costGrowth: 1.16, maxLevels: 99, consolidation: 0.0,
    // T3 retune iter #10 (2026-05-13, Step D). DM-signal / hidden-channel
    // mechanic. Subhalo declares a dedicated `carryMpsMult` — multiplies
    // prior-tier MPS carry only, contributes 0 to its own per-upgrade
    // MPS/MPC/APS row. Synergies B (Population II, β_B=0.03 additive) and
    // C (Brown Dwarf, β_C=0.03 additive) compound the per-level coefficient
    // before exponentiation: total hidden factor =
    //   (α × (1 + 0.03×N_PopII) × (1 + 0.03×N_BD))^N_Subhalo
    // α = 1.08 LOCKED (user-ratified 2026-05-13, Visible band lower edge).
    // costGrowth 1.16 chosen so the Subhalo cost crosses Sagittarius
    // Stream's 2.5M gate at level ~14-15, naturally capping Comp-path
    // Subhalo investment around the felt-investment target (~10-15).
    // Felt-investment target shape (N=50 p1 engaged comp-hoarder verified):
    //   Comp T3 exit: ~10-15 Subhalos (median ~15; wide variance 5-30).
    //   Threshold T3 exit: ~5-8 Subhalos (median 7; wide variance 0-20).
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    carryMpsMult: 1.08,
    synergies: [],
    completionist: false,
    desc: "We are riding the tide of what was delivered before us. We cannot see the carrier. We can feel its keel." },
  { name: "RR Lyrae",              tier: 3, initCost: 60000, costGrowth: 1.34,  maxLevels: 99, consolidation: 0.0,
    // T3 retune iter #10 (2026-05-13, Step D). Click stackable; receives
    // synergy A (×1.5 flat from Orphan Stream). Magnitude tuned for T3
    // engagement curve (perTierEngagement T3=0.15): click income share
    // stays modest at full session cpm.
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 12.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Horizontal-branch stars, pulsing on a clock older than the disk. Each beat is a measurement we did not have to take. The universe is blinking at the same rate we are counting." },
  { name: "Velocity Dispersion",   tier: 3, initCost: 400000, costGrowth: 2.05,  maxLevels: 5,  consolidation: 0.0,
    // T3 retune iter #10 (2026-05-13, Step D). DM-signal / completionist max-5.
    // APS (autoclicker). Cross-stat synergy provider → Population II per
    // design-doc (multiplicative ×1.10/lvl, mirrors the T4 HVC → DLD shape
    // from the legacy slate). Five serial saves post-Consolidation for the
    // Comp-path completionist arc.
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.200, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Population II", multiplier: 1.10 }],
    completionist: true,
    desc: "The stars move faster than their visible companions should hold them. The number that does not fit is the number we have been looking for. The missing mass made measurable, one transit at a time." },

  // One-shots (4) in spec order:
  { name: "Orphan Stream",         tier: 3, initCost: 100000, costGrowth: 1.00, maxLevels: 1, consolidation: 0.9,
    // T3 retune iter #10 (2026-05-13, Step D). Synergy A provider
    // (×1.5 flat → RR Lyrae). Consolidation locked at 0.9 per design.
    // Smallest consolidation-bearing one-shot — first early-tier gate piece.
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "RR Lyrae", multiplier: 1.5 }],
    completionist: false,
    desc: "A thin ribbon of stars, drifting without a parent. The galaxy that shed them has no name. The debris kept moving in the shape of what carried it, and that shape is the only obituary." },
  { name: "Sculptor Dwarf",        tier: 3, initCost: 400000, costGrowth: 1.00, maxLevels: 1, consolidation: 1.5,
    // T3 retune iter #10 (2026-05-13, Step D). Reserved slot for a future
    // T3 → T4 cross-tier synergy provider (per design-doc); no synergy
    // declared yet. Consolidation locked at 1.5 per design. Mid-cost
    // mass gate between Orphan Stream and the bigger walls.
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Eighty-six kiloparsecs out, two stellar populations in one small body — an old one and an older one. Close enough to resolve the suns individually. The first time we have looked at another galaxy and seen the people in it." },
  { name: "Draco Dwarf",           tier: 3, initCost: 8000000, costGrowth: 1.00, maxLevels: 1, consolidation: 0.0,
    // T3 retune iter #10 (2026-05-13, Step D). DM-signal / completionist
    // anchor (mirrors T4 Globular Cluster role: 0 consolidation, pure
    // allMps payoff). Carries the tier's emotional weight — "the dark
    // matter we have been embedded in this whole time has a name."
    // Mid-band allMps (1.42 mirrors legacy GC value); cost sits above the
    // transition gate so the Comp-path purchases it post-Consolidation.
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.42, allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: true,
    desc: "Four hundred forty solar masses for every one we can see. A creature almost entirely invisible, almost entirely gravity. The dark matter we have been embedded in this whole time has a name, and the name is old." },
  { name: "Sagittarius Stream",    tier: 3, initCost: 2500000, costGrowth: 1.00, maxLevels: 1, consolidation: 3.85,
    // T3 retune iter #10 (2026-05-13, Step D). T3→T4 transition gate.
    // Consolidation locked at 3.85 per design. Largest consolidation, second-
    // largest mass cost (Draco still bigger); the gate the Threshold path
    // primarily aims for.
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "A dwarf galaxy is being torn apart along our orbit. Its stars unspool into a stream that wraps us twice. We are doing this. The arm we are about to become is being made from the things we are eating." },

  // ---- Tier 4 Galactic Arm (was Tier 3 pre-2026-05-13 ladder renumber) ----
  // Renumbered up by one with the T3 Dwarf Spheroidal insertion. Slate
  // preserved verbatim (5 stackables + 4 one-shots + 4 synergies); numerical
  // fields retuned 2026-05-14 (T4 retune iter #9, Phase 2 of the post-renumber
  // workstream).
  //
  // === T4 retune (2026-05-14, Phase 2 iter #9) ===
  // Workflow: replace PHASE-2-PLACEHOLDER + PHASE-2-CONSOLIDATION-RESCALE
  // interim scaffolding with Reading-B-anchored values. Carry-over from T3
  // Subhalo `carryMpsMult` (α=1.08, β=0.03) propagates into T4 carry-MPS via
  // core.computeRates's hidden-channel walk — verified by validate_subhalo 28/28.
  //
  // Reading B target (locked 2026-05-12 under M☉ rescale):
  //   peak in-tier mass at T4→T5 consolidation gate = ~10¹⁰ M☉ (Threshold path,
  //   named-scale anchor; Comp overshoot 2-3× acceptable under CD-2/NEW-1
  //   reframe — mirrors T2 / T3 patterns).
  //
  // Calendar targets (Engaged trajectory):
  //   Comp 1-2 days (24-48h) / Thr 1-1.5 days (24-36h). Drift detection
  //   ±15% from midpoint per engineering plan §4 C6.
  //
  // === Calibrated numerical values (Iter 9, N=50 verified at seed=1) ===
  // Per-pairing T4 drift (calendar) + mass-band (vs bot reference):
  //   p1 engaged × comp-hoarder (Comp): T4 dur 27h → drift -24.2% [HIGH-under, but in 24-48h band]
  //     Mass 3.39e+11 / Ref 1.00e+11 → 3.39× above-band (Comp overshoot expected per CD-2/NEW-1)
  //     Total drift -12.5% within
  //   p2 engaged × comp-rusher  (Comp): T4 dur 37h → drift  +2.8% within
  //     Mass 2.43e+11 / Ref 1.00e+11 → 2.43× above-band
  //     Total drift  +2.1% within
  //   p3 engaged × thr-hoarder  (Thr):  T4 dur 29h → drift  -3.3% within
  //     Mass 4.40e+10 / Ref 2.00e+10 → 2.20× above-band (close to within-band ceiling 2.0)
  //     Total drift  -0.2% within
  //   p4 engaged × thr-rusher   (Thr):  T4 dur 34h → drift +16.2% [HIGH-over, but in 24-36h band]
  //     Mass 4.53e+10 / Ref 2.00e+10 → 2.27× above-band
  //     Total drift  +9.1% within
  // T1/T2/T3 byte-identical preserved (p17 bot-60cpm T1 11m 40s, T2 1h 8m, T3 9h 36m).
  // All 4 locked harnesses pass: save_migration 56/56, validate_offline 38/38,
  //   validate_subhalo 28/28, profiles_smoke 396/396.
  //
  // Bot reference T4 peak mass (Threshold continuous-bot, the named M☉ anchor):
  //   T4 Thr bot ref = 2.0e+10 M☉ (target ~1e+10; 2× over, within ±0.5 dex band).
  //   T4 Comp bot ref = 1.0e+11 M☉ (Comp overshoot ~5× acceptable; mass commit
  //   from HVC max-5 + GC completionist + AN gate is ~30× Thr's commit so peak
  //   tracks the spend-down naturally).
  //
  // Calibration rationale per upgrade:
  //   Stackables: initCost scaled ×30 from pre-renumber (5K→150K DLD,
  //     8K→240K HII, 15K→450K PM, 20K→600K SDW). The pre-renumber values
  //     were stale by ~3 orders of magnitude under the M☉ scale; ×30 anchors
  //     T4 stackable L1 costs at ~1% of named-tier peak mass (10¹⁰).
  //   Stackable incomes: scaled ×2 (DLD 40→80, HII 60→120, PM addMpc 80→160,
  //     SDW addAps 1.0→2.0, HVC addAps 2.0→4.0). The ratio between cost
  //     and income is the ×15 lever — costs scaled more than incomes,
  //     producing slower mass-spending per session.
  //   GB: ×30 cost (200K→6M), ×2 income (addMps 30→60); 7 levels × 0.75
  //     consolidation = 5.25 (per design).
  //   Sgr B2: ×30 cost (600K→18M); synergy A ×1.5 to PM unchanged;
  //     consolidation 2.25.
  //   HVC (completionist max-5): cost 10.5M → 3B (×285). The big lever for
  //     Comp-vs-Thr differentiation under CD-2/NEW-1 — pushes Comp's mass
  //     commit much higher without affecting Thr. costGrowth 2.05 unchanged
  //     (gentler late-wall per pre-renumber pass 2). At L1=3B, L2=6.15B,
  //     L3=12.6B, L4=25.85B, L5=53B → cumulative ~100B for max-5.
  //   GC (completionist anchor): cost 150M → 100B (×667). Pushed up to keep
  //     Comp mass-commit / Thr mass-commit ratio in the design range (~30×).
  //     allMps 1.42 unchanged (locked anchor); consolidation 0 unchanged.
  //   AN (transition gate): cost 8M → 20B (×2500). Sized so Threshold peak
  //     mass at gate-cross lands near 10¹⁰ named scale. Most load-bearing
  //     single value at T4. consolidation 8.125, synergy E (→ T5 Sgr A*
  //     ×1.5) unchanged.
  //
  // Consolidation budget: 5.25 (GB 7×0.75) + 2.25 (Sgr B2) + 0 (GC) + 8.125
  // (AN) = 15.625 = 1.0 × 2.5³ ✓ (matches engine formula).
  //
  // CD-2/NEW-1 reframe context: pre-peak Comp-vs-Thr gap is LOOSE; the
  // retired prior +65.6% / +38.6% T4 band targets are NOT load-bearing. Sim-
  // tuner did NOT chase a specific gap. Comp-vs-Thr T4 calendar gap (informational):
  //   p1 (Comp) vs p3 (Thr) gap at T4: 2d 19h vs 2d 18h = +1.5% (negligible).
  //   p2 (Comp) vs p4 (Thr) gap at T4: 3d 6h vs 3d 0h = +8.3%.
  //
  // p1 Comp-hoarder note: T4 dur p50 27h is HIGH-under target midpoint 36h
  // by -24%, but still inside the 24-48h band. The comp-hoarder profile
  // (saveVpcThreshold=2.5) pumps T4 stackables aggressively, so the player
  // completes T4 faster than the comp-rusher (saveVpcThreshold=1.2 saves
  // longer for one-shots). Considered acceptable under loose pre-peak
  // calibration — pushing comp-hoarder slower would require lowering stackable
  // income ratios further, which risks bot DNF (bot uses 60cpm with no idle).
  //
  // === Pre-renumber calibration history (historical reference) ===
  //
  // Pre-renumber numerical history preserved below for sim-tuner reference
  // (the +73.4 / +75.1% gap landed under the pre-renumber consolidation
  // budget 6.25; gap calibration under the new budget 15.625 is retired
  // under the CD-2/NEW-1 reframe — pre-peak gap is loose).
  //
  // Pre-renumber calibration history preserved below for sim-tuner reference
  // (the +73.4 / +75.1% gap landed under the pre-renumber consolidation budget 6.25;
  // gap calibration under the new budget 15.625 is a Phase-2 question, retired
  // for now under the CD-2/NEW-1 reframe — pre-peak gap is loose).
  //
  // === Original T3 (now T4) calibration notes ===
  // Consolidation budget: 6.25 (engine = 1.0 × 2.5^2) — PRE-RENUMBER.
  // NEW budget: 15.625 (engine = 1.0 × 2.5^3) — POST-RENUMBER.
  // Composition (×2.5): Galactic Bulge 7×0.75 = 5.25 + Sagittarius B2 2.25
  // + Globular Cluster 0.00 + Active Nucleus 8.125 = 15.625 (exact).
  // Magnitude band: stackable initCost in [3,000, 15,000] Mass; flats ~50–60× T2 first-stackable.
  //
  // Tuning history:
  //   Pass 1 (2026-05-10 early): post-carry-fix calibration. HVC costGrowth 2.28 → 2.10.
  //     Landed gaps at +70.2% / +73.1% (target band +65–75%).
  //   Pass 2 (2026-05-10 evening, playtest-informed): real T3 playtest at 100 cpm surfaced
  //     two engagement problems. (1) Clicking invisible at endgame — 1% income share in
  //     Comp, autoclicker:player ratio 29:1. (2) Curve too backloaded — ~95% of income
  //     growth in last 25% of runtime; 4+ minute "GC dead-zone" where bot only saves.
  //     Retune:
  //       Click rebalance: PM addMpc 40 → 80 (click value 2x), SDW addAps 2.0 → 1.0
  //         (cut), HVC addAps 4.0 → 2.0 (cut). Net: autoclicker rate halved, click
  //         value doubled; ratio 30:1 → 15:1; click income share 0.6% → 1.2% (Comp),
  //         2.6% → 4.8% (Thr).
  //       Curve smoothing: DLD→HII synergy 1.05 → 1.06/lvl (each mid-tier DLD lifts HII
  //         more visibly); HVC costGrowth 2.10 → 2.05 (gentler late wall).
  //     Resulting gaps: +73.4% Comp-handoff / +75.1% Thr-handoff (both within band).
  //     T3 times at 100 cpm: Comp 40:16 (was 41:42), Thr 23:13 (was 24:20).
  //     The GC dead-zone is reduced but not eliminated — GC at 150M with ×1.42 allMps
  //     is intrinsically a multi-minute save when it lands. Further reduction would
  //     compress the Completion-vs-Threshold gap below band.
  //   Pass 3 (2026-05-10 late, GB income retune): user request — Galactic Bulge
  //     felt like a consolidation-tax that produced no income, especially by L7
  //     where prior addMps of 0 was swamped by HII/DLD compounding. Added
  //     exponential per-level income: addMps 30, selfMps 1.20. GB raw output:
  //     L1=30, L3=130, L5=311, L7=627 (raw, pre-allMps). At the moment GB
  //     levels are bought:
  //       L1 (4:21): GB =  30 raw vs total MPS  643 →  4.7% share
  //       L3 (5:25): GB = 130 raw vs total MPS  769 → 16.9% share (mid-climb visibility)
  //       L7 (17:34): GB= 627 raw vs total MPS 51k →  1.2% share (still real)
  //     By endgame (40 min) GB is dwarfed by HII×65/DLD×23 compounding —
  //     expected and design-consistent (the income makes the purchase feel
  //     substantive at L7, not at 40-min endgame).
  //
  //     Strategy side-effect: the bot's `hasIncome` guard on consolidation-bearing
  //     stackables (strategy.js step 2b) previously excluded income-bearing
  //     consolidation stackables from the "buy cheapest consolidation stackable when
  //     affordable" branch. With income on GB, that exclusion routed GB
  //     through normal VPC and the bot deferred GB indefinitely in favor of
  //     HII (collapsing the +73.4% Comp gap to -9.2%). Fix: removed the
  //     `hasIncome` guard. The branch now buys any consolidation-bearing stackable
  //     (consolidation > 0) when affordable, regardless of income — mechanically
  //     enforcing the design intent "Bulge is primarily a progress purchase,
  //     income makes it feel substantive but doesn't change the consolidation-drip
  //     mechanic." T1/T2 byte-identical preserved (no consolidation-bearing
  //     stackables in those tiers).
  //
  //     Resulting gaps: +75.5% Comp-handoff / +75.5% Thr-handoff. Both 0.5pp
  //     over the +75% band edge. The strategy fix in isolation (GB income = 0
  //     but `hasIncome` guard removed) reproduces baseline +73.4% / +75.1%
  //     exactly — so the +2pp gap inflation comes entirely from the GB
  //     income shaving Thr-path time (23:13 → 23:05) more than Comp-path
  //     time (40:16 → 40:30). The dead-zone narrowing the user hoped for
  //     did NOT materialize: GB is fully maxed by 30% decile (~12 min),
  //     long before the GC save at 70-80% decile (28-32 min). Adding
  //     income to a Bulge purchased before the save shifts the post-Bulge
  //     baseline up but doesn't introduce interleaved buys during the save.
  //     For dead-zone narrowing, a different lever (e.g. relaxing the
  //     long-save bypass tolerance, or a dead-zone-window income source)
  //     would be needed — out of scope for this single-change pass.
  //     T3 times at 100 cpm: Comp 40:30, Thr 23:05 (Comp-handoff scenarios).
  //
  // Within-tier synergies (3 + 1 cross-tier):
  //   A) Sagittarius B2  → Proper Motion             × 1.5     (one-shot → click stackable)
  //   B) Dust Lane Density → HII Region              × 1.06/lvl (regular passive → regular passive)
  //   C) High-Velocity Cloud → Dust Lane Density     × 1.10/lvl (completionist APS → regular passive, cross-stat)
  //   D) Local Bubble (T2) → HII Region              × additive +0.04/lvl (cross-tier; new synergy kind)
  // Stackables (5)
  { name: "Dust Lane Density", tier: 4, initCost: 150000, costGrowth: 1.135, maxLevels: 99, consolidation: 0.0,
    baseMps: 80.0, addMps: 0.000, selfMps: 1.12,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "HII Region", multiplier: 1.06 }],
    completionist: false,
    desc: "The dark bands thicken along our arm. Carbon, silicate, the cold dust between starlight. Everything that forms here forms in our reach." },
  { name: "HII Region",        tier: 4, initCost: 240000, costGrowth: 1.135, maxLevels: 99, consolidation: 0.0,
    baseMps: 120.0, addMps: 0.000, selfMps: 1.12,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Hydrogen ionizes at ten thousand kelvin. Young O and B stars light the gas they were born from. The pink glow is the youngest light in our reach.",
    // Synergy D variant — locked text from current-state.md §2 / design-doc
    // T3 entry. Fires once the cross-tier provider Local Bubble (T2) is owned
    // at any level. Resolution lives in core.getUpgradeFlavor.
    synergyVariants: [
      { provider: "Local Bubble", text: "The cavity's edge sweeps the medium ahead of it. What collapses there becomes the next generation of stars. The bubble is older than us, and it has been preparing our nurseries." },
    ] },
  { name: "Proper Motion",     tier: 4, initCost: 450000, costGrowth: 1.34,  maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 160.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Our pull reaches further than it did. Stars far from our center adjust their paths in answer. We read the angle they have moved against the sky." },
  { name: "Spiral Density Wave", tier: 4, initCost: 600000, costGrowth: 1.42, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 2.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "A wave of compression moves through the arm. Stars and gas pile against its crest. Where the wave passes, new light follows." },
  { name: "High-Velocity Cloud", tier: 4, initCost: 3000000000, costGrowth: 2.05, maxLevels: 5, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 4.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Dust Lane Density", multiplier: 1.10 }],
    completionist: true,
    desc: "A cloud of neutral hydrogen falls onto the disk at ninety kilometers a second. It has been falling for an age. Its arrival adds to ours." },

  // One-shots (4) in spec order
  { name: "Galactic Bulge",    tier: 4, initCost: 6000000, costGrowth: 1.55, maxLevels: 7, consolidation: 0.75,
    baseMps: 0,   addMps: 60.000, selfMps: 1.20,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    // L1 line is the fallback for any path that doesn't go through the
    // getUpgradeFlavor helper; descByLevel carries the locked 7-line arc.
    desc: "The center thickens. Gas falls inward along the bar, slowly, on long orbits.",
    descByLevel: [
      "The center thickens. Gas falls inward along the bar, slowly, on long orbits.",
      "Stars form in the dense rush. Hundreds at a time, in regions only light-years across.",
      "The core fills. Orbits crowd. Stars begin to scatter each other off their first paths.",
      "The motion settles into many directions at once. The bulge is no longer falling. It is held by its own dispersion.",
      "The new stars become old stars. Few are forming now. The light is the light of long-lived suns.",
      "Iron, magnesium, the residue of generations. The bulge keeps what its stars made before they died. The composition is set.",
      "The center is a quiet weight. Old stars on tangled orbits. Nothing falls in now that the bulge does not already hold.",
    ] },
  { name: "Sagittarius B2",    tier: 4, initCost: 18000000, costGrowth: 1.00, maxLevels: 1, consolidation: 2.25,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Proper Motion", multiplier: 1.5 }],
    completionist: false,
    desc: "A molecular cloud, three million solar masses, one hundred fifty light-years across, one hundred twenty parsecs from our center. Methanol, ethanol, vinyl alcohol — the most chemically complex region we know. Its mass enters our gravity." },
  { name: "Globular Cluster",  tier: 4, initCost: 100000000000, costGrowth: 1.00, maxLevels: 1, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.420, allMpc: 1.0,  allAps: 1.0,
    synergies: [],
    completionist: true,
    desc: "A tight sphere of stars, twelve billion years old, older than most of our disk. It orbits us in a long quiet ellipse. It binds." },
  { name: "Active Nucleus",    tier: 4, initCost: 20000000000, costGrowth: 1.00, maxLevels: 1, consolidation: 8.125,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Sagittarius A*", multiplier: 1.5 }],
    completionist: false,
    desc: "Our center brightens. Something massive at the heart of us begins to feed." },

  // ---- Tier 5 (was Tier 4 pre-2026-05-13 ladder renumber — Galaxy) ----
  // Renumbered up by one with the T3 Dwarf Spheroidal insertion. Slate
  // preserved verbatim (5 stackables + 5 one-shots + 4 synergies); consolidation
  // values rescaled × 2.5 to match the new T5 budget 1.0 × 2.5^4 = 39.0625.
  // Mass costs and income values are stale-pending-T5-retune — flagged inline
  // with PHASE-2-CONSOLIDATION-RESCALE comments. Cross-tier synergy D (Active
  // Nucleus → Sagittarius A*) preserved; the AN provider is now a T4 upgrade.
  //
  // === Pre-renumber T4 calibration notes (now T5) ===
  // PRE-RENUMBER consolidation budget: 15.625 (engine = 1.0 × 2.5^3).
  // POST-RENUMBER consolidation budget: 39.0625 (engine = 1.0 × 2.5^4).
  // Composition (×2.5):
  //   Bar Structure        3.750  (was 1.500)
  //   Fermi Bubbles        0.000  (completionist anchor; stays at 0)
  //   Sagittarius A*       3.750  (was 1.500; carries cross-tier synergy D target from AN)
  //   Hot Coronal Halo     0.000  (completionist anchor; compound allMps×allMpc — stays at 0)
  //   Dark Matter Halo    31.5625 (was 12.625; transition gate; largest consolidation)
  //   = 39.0625
  //
  // STRUCTURAL DECISION (2026-05-11): HCH placed at consolidation=0 (not "moderate-
  // nonzero" as the gameplay-design.md draft suggested). Reason: a completionist
  // upgrade with positive consolidation creates a Threshold-impassable gate
  // (Threshold-mode masks completionists, so any consolidation they hold becomes
  // mass the Threshold-path can't earn). Pattern matches T2 Moving Group,
  // T3 GC/HVC — all completionists at consolidation=0 across T1-T3. Keeping HCH
  // at 0 preserves Threshold-path reachability AND keeps HCH's mechanical
  // identity (the compound allMps×allMpc channel — the new tier-4 hook).
  // Surfaced to creative-director / engineering-director if reverting is
  // preferred — would need either a Threshold-mode override or a fundamental
  // gate redesign.
  //
  // Magnitude band: stackable initCost ~50–60× T3's first-stackable (DLD 5k → 250k–300k).
  // Flats scale similarly (DLD baseMps=40 → GR baseMps ~2.4k).
  //
  // Engine support diagnosis (2026-05-11 calibration pass):
  //   - HCH compound channel: works as-is. Declaring `allMps: 1.30` AND `allMpc: 1.30`
  //     on the same upgrade — core.computeRates multiplies each stat by its own
  //     allX^N product (lines 143-145), so both fire independently. The strategy's
  //     oneShotVpc Component A+B branches sum both channels' value correctly.
  //   - Cross-tier one-shot → one-shot synergy (AN → Sgr A*): works as-is.
  //     Sgr A* carries `baseMps`; AN declares synergies:[{target:"Sagittarius A*",
  //     multiplier:1.5}]. synergyMult (provider-list-aware via params.synergyProviders
  //     = allUpgrades, already plumbed for T2 LB → T3 HII) resolves AN's level=1
  //     and multiplies Sgr A*'s self-contribution. Live MPS computation
  //     (core.computeRates line 139-141) calls synergyMult for every active-tier
  //     upgrade, so once Sgr A* is owned its boosted output is correct.
  //     (Caveat: strategy.oneShotVpc Component C/D doesn't apply synergyMult to
  //     the target's own VPC — a pre-existing limitation that doesn't affect
  //     buy timing since one-shots are bought by cheapest-affordable rule, not
  //     VPC ranking. Flagged as future polish.)
  //
  // Cross-tier synergy D: AN (T3) → Sgr A* (T4). Multiplier ×1.5 (within the
  // typical synergy magnitude band — same as Heliopause → SC, SagB2 → PM,
  // Bar Structure → Galactic Rotation). Note: Sgr A* gets its boost ONLY when
  // AN is owned (Comp-handoff scenarios). Thr-handoff scenarios start T4
  // without AN — Sgr A* still functions but at unboosted baseline.
  //
  // Within-tier synergies (3 + 1 cross-tier = 4 total):
  //   A) Bar Structure       → Galactic Rotation   × 1.5 flat   (one-shot → passive stackable)
  //   B) Galactic Rotation   → Stellar Halo        × 1.06/lvl  (passive → passive same-family)
  //   C) Satellite Galaxies  → Galactic Fountain   × 1.10/lvl  (completionist APS → APS cross-stat)
  //   D) Active Nucleus (T3) → Sagittarius A*      × 1.5 flat   (cross-tier one-shot → one-shot; NEW SHAPE)
  //
  // Stackables (5)
  { name: "Galactic Rotation",  tier: 5, initCost:  2000000, costGrowth: 1.135, maxLevels: 99, consolidation: 0.0,
    baseMps: 10000.0, addMps: 0.000, selfMps: 1.12,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Stellar Halo", multiplier: 1.06 }],
    completionist: false,
    desc: "Two hundred billion stars circle our center. Each rotation brings the gas a little closer to the bar. Our disk turns, and what it turns past stays with us." },
  { name: "Stellar Halo",       tier: 5, initCost:  3000000, costGrowth: 1.135, maxLevels: 99, consolidation: 0.0,
    baseMps: 14000.0, addMps: 0.000, selfMps: 1.12,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Old stars circle the disk on long, tilted orbits. They are the population that built us before the disk did. Metal-poor, slow, here from the beginning." },
  { name: "Galactic Coupling",  tier: 5, initCost:  6000000, costGrowth: 1.34,  maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 2000.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Each pull reaches across a hundred thousand light-years. The disk answers along its rotation axis. What we move, the bar carries to the center." },
  { name: "Galactic Fountain",  tier: 5, initCost: 10000000, costGrowth: 1.42,  maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 20.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Hot gas rises from the disk and falls back as it cools. The cycle has been turning for ten billion years. Each return brings something new with it." },
  { name: "Satellite Galaxies", tier: 5, initCost: 40000000000, costGrowth: 2.10, maxLevels: 5, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 40.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Galactic Fountain", multiplier: 1.10 }],
    completionist: true,
    desc: "The Magellanic Clouds, the Sagittarius Dwarf. Smaller galaxies that orbit us. They have been falling for billions of years, and they have not yet finished arriving." },

  // One-shots (5) in spec order
  { name: "Bar Structure",      tier: 5, initCost: 200000000, costGrowth: 1.00, maxLevels: 1, consolidation: 3.75,  // PHASE-2-CONSOLIDATION-RESCALE (interim; T4/T5 retune will revisit) — was 1.50 pre-renumber (×2.5)
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Galactic Rotation", multiplier: 1.5 }],
    completionist: false,
    desc: "A great bar of stars and gas crosses our middle. Matter flows along it inward, slowly, from the disk's edge to the bulge. The shape decides the path." },
  { name: "Fermi Bubbles",      tier: 5, initCost: 1500000000, costGrowth: 1.00, maxLevels: 1, consolidation: 0.0,  // PHASE-2-CONSOLIDATION-RESCALE (interim; T4/T5 retune will revisit) — was 0.0 pre-renumber (stays at 0; completionist anchor)
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.50, allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: true,
    desc: "Two lobes of hot gas reach twenty-five thousand light-years above and below our disk. They are what the feeding left behind, five million years ago. The center is quieter now. The bubbles are still bright." },
  { name: "Sagittarius A*",     tier: 5, initCost: 800000000, costGrowth: 1.00, maxLevels: 1, consolidation: 3.75,  // PHASE-2-CONSOLIDATION-RESCALE (interim; T4/T5 retune will revisit) — was 1.50 pre-renumber (×2.5)
    baseMps: 800000.0, addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "Four million solar masses at our exact center. Quiet now, after the feeding. Massive, patient, ours." },
  { name: "Hot Coronal Halo",   tier: 5, initCost: 20000000000, costGrowth: 1.00, maxLevels: 1, consolidation: 0.0,  // PHASE-2-CONSOLIDATION-RESCALE (interim; T4/T5 retune will revisit) — was 0.0 pre-renumber (stays at 0; completionist compound channel)
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.30, allMpc: 1.30,  allAps: 1.0,
    synergies: [],
    completionist: true,
    desc: "A million-degree envelope settles around the disk. Oxygen ions glow faintly in X-ray. The galaxy breathes out its own atmosphere and is warmed by it." },
  { name: "Dark Matter Halo",   tier: 5, initCost: 16000000000, costGrowth: 1.00, maxLevels: 1, consolidation: 31.5625,  // PHASE-2-CONSOLIDATION-RESCALE (interim; T4/T5 retune will revisit) — was 12.625 pre-renumber (×2.5)
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.80, allMpc: 1.0,   allAps: 1.0,
    synergies: [],
    completionist: false,
    desc: "We are larger than we appear. A halo of unseen matter has cradled the disk since the beginning. The visible part was always the small part. Beyond the halo, more of us is moving toward us." },
];

// Cross-tier synergies — attached via IIFE so the provider entries stay
// visually clean and so synergy mutations are co-located in one spot.
//
//   1) T2 Local Bubble → T4 HII Region — × (1 + 0.04 × LB_level) — additive kind
//      The first cross-tier synergy in the game. Felt encoding of the
//      load-bearing rule "stats carry over between tiers." HII Region moved
//      T3 → T4 in the 2026-05-13 renumber; the synergy declaration follows
//      it. (Pre-renumber: T2 LB → T3 HII Region; semantics unchanged.)
//
//   2) T2 Brown Dwarf → T3 Subhalo — × (1 + 0.03 × BD_level) — additive kind
//      New in the 2026-05-13 T3 Dwarf Spheroidal insertion. Synergy C per
//      gameplay-design §3 — voice-coherent: Brown Dwarf was T2's unlit-mass
//      upgrade, Subhalo is its named follow-on at the next mass scale (still
//      unlit, but now named). β_C = 0.03 locked Step D iter #10
//      (2026-05-13, user-ratified); the per-BD-level Subhalo coefficient
//      kick parallels Synergy B (Pop II → Subhalo) — same magnitude, same
//      kind, different provider tier.
(function attachCrossTierSynergies() {
  const lb = UPGRADES.find(u => u.name === "Local Bubble" && u.tier === 2);
  if (lb) {
    lb.synergies = (lb.synergies || []).concat([
      { target: "HII Region", multiplier: 1.04, kind: "additive" },
    ]);
  }
  const bd = UPGRADES.find(u => u.name === "Brown Dwarf" && u.tier === 2);
  if (bd) {
    bd.synergies = (bd.synergies || []).concat([
      // T3 retune iter #10 (2026-05-13, Step D). β_C = 0.03 additive per BD
      // level (locked user-ratified 2026-05-13). The lit-mass-stream upgrade
      // (Brown Dwarf, T2) feeds the dark-mass-companion upgrade (Subhalo,
      // T3) — the voice rhyme is intentional.
      { target: "Subhalo", multiplier: 1.03, kind: "additive" },
    ]);
  }
})();

// DEFAULT_PARAMS — global / engine parameters mirroring current-state.md section 4.
// Centralized here so future sim/simulator UI can read them without re-deriving from code.
// T1 prototype today uses these values literally; do not change without updating the doc.
export const DEFAULT_PARAMS: Params = {
  tickIntervalMs: 1000,           // 1 Hz tick rate (Phase 4 alias: tick_rate_ms)
  baseMpc: 0.00120,               // floor of MPC; base click value in M☉. Lowered from 1.0 → 0.02
                                  // in the 2026-05-12 long-burn retune (M☉ denomination), then
                                  // further to 0.0017 in the 2026-05-12 iteration-2 fix to
                                  // correct click-share over-shoot (was 81%, target 50-60%) and
                                  // active-time under-shoot (was 2m49s, target 8-15min at bot-100cpm).
                                  // Floor click at 100 cpm now ≈ 0.17 M☉/min (was 2.0 M☉/min).
  baseMps: 0.0,                   // no idle income before any upgrades
  consolidationThreshold: 1.0,         // unlocks End Tier 1 — the T1→T2 gate (consolidation_T1_to_T2)
  consolidationGrowth: 2.50,           // consolidation_T_n_to_T_n+1 = consolidationT1ToT2 × consolidationGrowth^(n-1)
  // Strategy / sim params.
  cpm: 100,                       // default click rate for fresh sim runs (Simulator tab strip).
  saveVpcThreshold: 1.5,          // legacy v1.2.1 calibration default; the strategy's most
                                  // sensitive single tunable (next-target VPC ratio gate).
  longSaveTimeThresholdSec: 90,   // saves longer than this trigger the post-consolidation-focus
                                  // interleaving bypass (marginal-save-time tolerance check).
                                  // T1 saves stay under this → byte-identical T1 path.
  longSaveTolerance: 1.05,        // permitted save-time stretch from interleaved stackable buys
                                  // during long completionist saves. 1.0 = strict marginal-save
                                  // win; 1.05 = up to 5% delay allowed. Keeps completion-time
                                  // bounded while breaking T2's BD-save dead-zone.
  engagement: 1.0,                // global engagement override; nonzero → applied to every
                                  // tier in place of the per-tier curve. 1.0 = no override
                                  // intent, but the runner currently treats it as the baseline.
                                  // The simulator's quick-strip surfaces this as a global
                                  // multiplier; the Parameters tab exposes the per-tier curve.
  scenario: 'completion',         // default mode for Simulator tab quick runs ('threshold' | 'completion')
  // Per-tier engagement curve. Steep witness-phase shape locked 2026-05-12,
  // renumber-shifted 2026-05-13 for the 11-tier ladder (T3 Dwarf Spheroidal
  // insertion). T1 hyper-present (the player is learning what every click does),
  // falling sharply through T2-T3 as offline accrual takes over the mass flow,
  // and bottoming at T11 where the player is almost-not-playing — checking in
  // to watch named-connection breaks rather than tap. Mechanically encodes the
  // shift from active onboarding to passive witnessing across the arc.
  //
  // Runner contract: per_tick click income is
  //   mpc × cpm/60 × per_tier_engagement[scenario.tier]
  // (falling back to the global engagement override above if a tier value is
  // missing). This curve multiplies in-session cpm during check-ins; offline
  // windows remain pure-idle regardless (engineering plan §10 #5).
  //
  // 2026-05-13 renumber: T3 Dwarf Spheroidal inserted between T2 Stellar
  // Neighborhood and the old T3 (now T4) Galactic Arm. New T3 carries a
  // PHASE-2-PLACEHOLDER engagement value of 0.15 — between T2 (0.25, active
  // onboarding bridge) and old T3 / new T4 (0.08, offline-dominant). Sim-tuner
  // will tune T3 properly under Reading B during the T3 retune workstream.
  // Tiers T4-T11 below preserve the legacy curve values verbatim, just shifted
  // up by one tier number (old T3=0.08 → new T4=0.08; old T10=0.01 → new
  // T11=0.01).
  perTierEngagement: {
    1:  0.90,
    2:  0.25,
    3:  0.15,   // T3 retune iter #10 (2026-05-13, Step D): locked at 0.15
                //   under Reading B + the steep witness-phase curve. T3 is
                //   the first patient-universe-anchored tier; in-session
                //   click share is small (carry-MPS dominates the income
                //   stream) so engagement bridges T2's 0.25 active-onboard
                //   value and T4's 0.08 offline-dominant floor.
    4:  0.08,
    5:  0.05,
    6:  0.04,
    7:  0.03,
    8:  0.025,
    9:  0.02,
    10: 0.015,
    11: 0.01,
  },
};

// Save schema version. Bumped whenever SavePayload's shape OR semantic
// scale changes; sim/save.js routes through migration paths keyed on this
// number.
//
// v1 (initial 2026-05-12 morning): pre-M☉-retune. Mass values in arbitrary
//   units (baseMpc=1.0 click floor; cost scale up to ~5680 in T1).
// v2 (2026-05-12 retune): M☉ denomination + steep perTierEngagement curve
//   + baseMpc 1.0→0.00120. Mass values now in solar masses.
// v3 (2026-05-13 ladder renumber): T3 Dwarf Spheroidal insertion. Tier
//   numbers above T2 shifted up by one.
// v4 (2026-05-13 consolidation rename): every engine identifier carrying
//   the legacy `cohesion` name renamed in-place to `consolidation`.
// v5 (2026-05-21 React scaffold clean break): the game/ engine uses canonical
//   carry.* names natively (no mpsFloor/mpcFloor/apsFloor relic translation).
//   deserializeState refuses anything != 5 — no migration from the prototype's
//   v4 saves (solo tester; breaking saves during scaffold development is fine
//   per the scaffold plan §1 standing principle). The prototype keeps its own
//   v4 lineage for the calibration tool; the two diverge here deliberately.
export const SAVE_VERSION = 5;

// Tier metadata (scaffold plan §4.7) — NEW structure layered over the existing
// data, not a data-model change. Reads the same tier numbers the engine uses so
// the scene registry and chrome can resolve a tier name without hardcoding.
// (Tier 8/9 display names read from the renumber bullets in CLAUDE.md; flagged
// for §1 cross-check during scene work — not load-bearing for the engine port.)
export const TIERS: Record<number, TierMeta> = {
  1: { name: 'Solar System',          act: 1, peak: false },
  2: { name: 'Stellar Neighborhood',  act: 1, peak: false },
  3: { name: 'Dwarf Spheroidal',      act: 1, peak: false },
  4: { name: 'Galactic Arm',          act: 1, peak: false },
  5: { name: 'Galaxy',                act: 1, peak: false },
  6: { name: 'Local Group',           act: 1, peak: true },   // PEAK
  7: { name: 'Galactic Cluster',      act: 2, peak: false },   // Eridanus Reach pivot
  8: { name: 'Supercluster',          act: 2, peak: false },
  9: { name: 'Filament',              act: 2, peak: false },
  10: { name: 'Cosmic Web',           act: 2, peak: false },   // INVERSION
  11: { name: 'Causal Horizon',       act: 2, peak: false },   // final
};
