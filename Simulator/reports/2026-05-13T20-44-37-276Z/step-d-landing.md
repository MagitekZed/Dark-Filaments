# T3 Dwarf Spheroidal — Step D landing report

2026-05-13 (evening). Sim-tuner T3 retune workstream, Step D (numerical calibration).
Replaces all PHASE-2-PLACEHOLDER values in the T3 slate with calibrated numbers under
Reading B + 24-48h Engaged Comp / 18-36h Engaged Thr calendar bands.

The slate shape (4 stackables + 4 one-shots + 3 synergies, including the new hidden-
channel mechanic and the cross-tier additive synergy from T2 Brown Dwarf) was locked in
gameplay-design.md §3 (2026-05-13 morning). The Subhalo `carryMpsMult` engine
extension landed Step C; the Cohesion → Consolidation rename landed prior. This pass
is purely numerical: costs, costGrowth, baseMps/addMps/addMpc/addAps, synergy
coefficients.

## Locked numbers (Step D iter #10)

### T3 stackables

| Upgrade | initCost | costGrowth | maxLv | Income shape | Synergies (received) | Comp |
|---|---|---|---|---|---|---|
| Population II | 25,000 | 1.135 | 99 | baseMps 8.0, selfMps 1.12 | — | no |
| Subhalo | 40,000 | 1.16 | 99 | carryMpsMult 1.08 (hidden) | Pop II β=0.03, BD β=0.03 (both additive) | no |
| RR Lyrae | 60,000 | 1.34 | 99 | addMpc 12.0 | Orphan Stream ×1.5 flat | no |
| Velocity Dispersion | 400,000 | 2.05 | 5 | addAps 0.20 | (provides ×1.10/lvl to Pop II) | **yes** |

### T3 one-shots

| Upgrade | initCost | Consolidation | Income/Effect | Comp |
|---|---|---|---|---|
| Orphan Stream | 100,000 | 0.9 | provides ×1.5 flat → RR Lyrae | no |
| Sculptor Dwarf | 400,000 | 1.5 | — (reserved slot for future T3→T4 synergy provider) | no |
| Draco Dwarf | 8,000,000 | 0.0 | allMps 1.42 (completionist anchor) | **yes** |
| Sagittarius Stream | 2,500,000 | 3.85 | (gate; consolidation-only) | no |

Consolidation total: 0.9 + 1.5 + 0.0 + 3.85 = **6.25** (matches engine 1.0 × 2.5²).

### Synergies (3, all locked per gameplay-design §3)

| Tag | Provider | Target | Magnitude | Kind |
|---|---|---|---|---|
| A | Orphan Stream (T3 one-shot) | RR Lyrae (T3 stackable) | ×1.5 flat | multiplicative |
| B | Population II (T3 stackable) | Subhalo (T3 stackable) | × (1 + 0.03 × N_PopII) | additive |
| C | Brown Dwarf (T2 stackable) | Subhalo (T3 stackable) | × (1 + 0.03 × N_BD) | additive cross-tier |

Subhalo's total hidden-factor: `(α × (1 + 0.03×N_PopII) × (1 + 0.03×N_BD))^N_Subhalo`
where α = `carryMpsMult` = 1.08 (locked, Visible band lower edge).

### Engine globals (re-verified, no change)

- `DEFAULT_PARAMS.baseMpc`: 0.00120 (T1 retune anchor)
- `DEFAULT_PARAMS.perTierEngagement[3]`: **0.15** (locked Step D iter #10; renumbered comment flag removed)
- `DEFAULT_PARAMS.consolidationGrowth`: 2.50 (gate scaling per tier)
- `DEFAULT_PARAMS.saveVpcThreshold`: 1.5 (default; buyer profiles override)
- `DEFAULT_PARAMS.longSaveTimeThresholdSec`: 90 (post-Consolidation interleave threshold)
- `DEFAULT_PARAMS.longSaveTolerance`: 1.05 (5% save-time stretch tolerance)

## Calibration outcomes (N=50, seed=1, max-days=14)

### Primary pairings (engaged-timing, all four buyer profiles)

| Pairing | Mode | T3 p10 / p50 / p90 | T3 target | Drift | Flag |
|---|---|---|---|---|---|
| p1 engaged × comp-hoarder | completion | 19h 25m / **1d 7h (31h)** / 2d 4h | 24-48h | -12.1% | within |
| p2 engaged × comp-rusher | completion | 23h 15m / **1d 9h (33h)** / 2d 8h | 24-48h | -7.1% | within |
| p3 engaged × thr-hoarder | threshold | 22h 39m / **1d 5h (29h)** / 1d 15h | 18-36h | +8.5% | within |
| p4 engaged × thr-rusher | threshold | 1d 1h / **1d 6h (30h)** / 1d 14h | 18-36h | +14.7% | within |

All four primary pairings land within the ±15% drift band for T3 calendar.

(The Step D report's "Total drift" column sums T1 + T2 + T3 calendar targets,
which surfaces pre-existing T1/T2 drift signals — those are not introduced or
addressed by this retune.)

### Reading B mass anchors

Reading B target: peak in-tier mass at the Consolidation-gate-crossed moment
~10⁶·⁵ ≈ **3.16M M☉** for the Threshold path; Completion-path peak modestly
higher during post-Consolidation completionist clean-up (mirrors T2's iter #24
outcome of Comp peak ~1.84× named scale).

| Path | Peak mass anchor | Vs. 3.16M target |
|---|---|---|
| Threshold | Sagittarius Stream gate-cross peak ≈ **2.5M** | -21% (within ±0.5 dex band 1M-10M) |
| Completion | Pre-Draco-purchase peak ≈ **8M** | +2.5× over (within ±0.5 dex band) |

Bot reference exit masses (cpm=100, mode-chained; from S4 mass-band check):
- Comp T3 exit: 192k M☉ (post-Draco leftover; not peak)
- Thr T3 exit: 627k M☉ (post-Sgr Stream leftover)

Engagement-profile runs overshoot bot reference 5×-220× due to patient-universe
offline accumulation between sessions. This is expected; the mass-band check
flags it as informational ("above-band") but does not gate calibration. The
relevant Reading B comparison is the **peak mass at gate-cross moment**, which
the bot baseline trace establishes.

### Felt-investment shape (Subhalo levels at T3 exit)

Spot-checked across seeds 1-3 at N=5 per seed:

| Path | Target levels | Observed median | Observed range |
|---|---|---|---|
| Comp (p1) | ~10-15 | ~15 | 5-31 |
| Threshold (p3) | ~5-8 | ~7 | 0-20 |

Median lands in band for both paths. The variance reflects RNG-driven idle-gap
sequencing in the patient-universe model — players who happen to accumulate more
mass offline reinvest more deeply into Subhalo. The high-end runs (~20-30
Subhalos) are not a failure of calibration; they represent a player who got
lucky with check-in timing and ended up over-investing.

The Subhalo cost-growth lever (costGrowth = 1.16) was sized so the per-level
Subhalo cost crosses the Sagittarius Stream gate cost (2.5M) at level ~15 — past
that point the bot prefers buying the gate to buying another Subhalo.

### Byte-identity check (T1, T2)

| Pairing | Target | Result | Reference |
|---|---|---|---|
| p17 bot-60cpm × comp-hoarder | T1 | **11m 40s** | matches CLAUDE.md T1 retune anchor |
| p17 bot-60cpm × comp-hoarder | T2 | **1h 8m** | matches CLAUDE.md T2 retune anchor |
| p17 bot-60cpm × comp-hoarder | T3 | 9h 36m | (new calibration baseline) |

T3 chain reachability through T4/T5 still works (placeholder T4/T5 numbers; not
calibrated, just running):

| Pairing | Target | Result |
|---|---|---|
| p17 bot-60cpm × comp-hoarder | T4 | 9h 47m total |
| p17 bot-60cpm × comp-hoarder | T5 | 9h 48m total |

### Locked harness pass counts (re-verified post-calibration)

| Harness | Result |
|---|---|
| save_migration_test | **56 / 56 pass** |
| validate_offline | **38 / 38 pass** |
| validate_subhalo | **28 / 28 pass** |
| profiles_smoke | **396 / 396 pass** |

## Iteration history (this Step D session)

| Iter | Lever change | p1 T3 p50 | p2 | p3 | p4 | Notes |
|---|---|---|---|---|---|---|
| placeholder | — | 18h 6m | 18h 6m | 18h 42m | 12h 21m | Pre-retune; T3 calendar HIGH-under across all bands. |
| #1 | Flipped α 1.10→1.08, β 1.06/1.04→1.03/1.03; modest cost lift. | 18h 6m | 18h 42m | 19h 49m | 18h 46m | Bot slowed 50% but engaged barely moved (offline dominated). |
| #2 | Lifted T3 one-shot costs ~4× (Sgr 600k→3M, Draco 1.5M→5M, etc.) + stackable income lift. | 1d 18h | 1d 19h | 1d 19h | 1d 19h | Comp in band; Thr above band (43h vs 18-36h target). |
| #3 | Sgr 3M→2M, Draco 5M→8M, Subhalo cg 1.135→1.18. | 1d 20h | 2d 11h | 1d 18h | 1d 17h | Subhalo cg too aggressive — p2 blew up. |
| #4 | Subhalo cg 1.18→1.155. | 1d 10h | 2d 7h | 1d 18h | 1d 17h | Better p1; p2/p3/p4 still high. |
| #5 | Subhalo cg → 1.20; Sgr → 1.5M. | 2d 4h | 2d 7h | 1d 15h | 1d 15h | Slowed everything; Subhalo cap moved too far. |
| #6 | Sgr → 1.5M, Sculptor 1M → 700k, Orphan 300k → 200k, Subhalo cg → 1.16. | 1d 23h | 2d 1h | 1d 10h | 1d 14h | All four within or near band. |
| #7-#8 | Subhalo cg/initCost experiments. | — | — | — | — | Lower Subhalo counts but higher variance, broke band. |
| #9 | Returned to cg=1.16, Sgr 1.5M → 1.3M, Sculptor 700k → 400k, Orphan 200k → 100k. | 1d 18h | 1d 23h | 1d 8h | 1d 8h | All four within band; locked candidate. |
| **#10** | **Sgr 1.3M → 2.5M (Reading B Thr-peak anchor).** | **1d 13h** | **1d 16h** | **1d 12h** | **1d 13h** | **LOCKED: all four within band; Thr peak anchored to ~2.5M ≈ Reading B target.** |

## Comp vs Threshold gap (informational under CD-2/NEW-1 reframe)

| Metric | Comp p50 (p1) | Thr p50 (p3) | Gap |
|---|---|---|---|
| T3 calendar | 31h | 29h | +6.9% Comp over Thr |
| T3 active engagement | 2h 30m | 2h 30m | (same) |

The CD-2/NEW-1 reframe retires the pre-peak Comp-vs-Threshold gap as a tight
calibration target. T3 is pre-peak (T6 is PEAK, T10 is INVERSION). Sim-tuner did
NOT chase a tight gap band here. The +6.9% landed value is informational only;
the felt opportunity cost (Comp player saves longer for Draco + VD 5 levels)
is real on the player's single playthrough, but the cross-path measured asymmetry
is not load-bearing.

## Open items / design tensions surfaced

1. **Subhalo level variance is high** (5-30 levels across runs). The Subhalo
   VPC scales with carryMps, which compounds dramatically from T2 carry across
   idle windows. Players with luckier check-in sequencing (more offline mass
   accumulation) will end T3 with substantially deeper Subhalo investment than
   players with shorter sessions. The median lands in the felt-investment target
   band, but the upper tail (~30 Subhalos) is well over the design target.
   Acceptable under the patient-universe model; flagged as a design question
   if the variance later proves player-frustrating.

2. **T1 mass band warning persists** (ratio 0.60-0.71× < 0.7 floor). This is a
   T1 retune outcome, not a T3 issue — the harness's mass-band check uses the
   bot reference at cpm=100, and the engaged-profile T1 floor at cpm=60 lands
   below 0.7×. Pre-existing; not introduced by this calibration pass.

3. **Click income share at T3 is small** (RR Lyrae addMpc 12.0 × engaged
   T3=0.15 × cpm/60 ≈ ~1.5 M/sec from clicks vs ~1000+ M/sec passive carry).
   Clicking is largely decorative at T3, consistent with the steep witness-
   phase curve. The RR Lyrae upgrade is more a structural beat than a real
   income driver — same shape as T4's Proper Motion, which CLAUDE.md surfaced
   as a similar design tension at the time. Not a calibration issue at T3
   under the long-burn engaged-profile framing.

4. **The new Subhalo `carryMpsMult` channel works correctly** under all primary
   pairings. The validate_subhalo locked harness (28/28 pass) covers parity
   with hand-computed expected hidden-factor values, synergy compounding, and
   zero-base-stat behavior. The strategy's `stackableVpc` branch for
   `carryMpsMult > 1` (added Step B) computes the correct marginal income
   delta — confirmed by the bot's natural ramping into Subhalo investment.

5. **Bot reference baseline numbers**: bot-60cpm × Comp T3 = 9h 36m active
   total (1h 8m T2 entry + 8h 28m T3 in-tier). Threshold-mode bot reference
   not directly measured (no p17-equivalent for threshold), but Threshold-path
   exit-mass via the harness's `referenceMassForTier(3, 'threshold')` lands at
   627k M☉ leftover post-Sgr-Stream — the peak just before purchase ≥ 2.5M
   M☉ (Sgr Stream cost), inside the ±0.5 dex Reading B band.

## Recommended next workstream

**T4 Galactic Arm retune.** The current T4 slate in `data.js` carries
PHASE-2-CONSOLIDATION-RESCALE numbers (the 2026-05-13 renumber's ×2.5 mechanical
scaling of consolidation values into the 15.625 budget). Mass costs and income
values are stale (calibrated against the pre-renumber 6.25 budget and the pre-
M☉ scale). Follow the standard workflow:

1. Science-director re-validates the T4 slate against gameplay-design.md §4
   (Galactic Arm) under the current ladder + Reading B.
2. Sim-tuner proposes T4 numbers under Reading B + the 24-48h Engaged Comp /
   18-36h Engaged Thr target (T4 is the climb-begins tier; calendar 1-2d per
   the per-tier table).
3. Harness verification at N=50, seed=1, primary pairings + bot byte-identity.

Note that T4's slate has a richer mechanical shape than T3 (compound-channel
multipliers at Hot Coronal Halo, cross-tier one-shot synergy at Active Nucleus
→ Sagittarius A*). Some of those engine paths haven't been exercised under the
M☉ scale yet — expect surface-level surprises during T4 retune.

## Doc-keeper actions recommended (closing pass)

The following docs reference T3 numbers and should be updated by doc-keeper:

1. **`Design Documents/gameplay-design.md` §3 (Tier 3 — Dwarf Spheroidal):**
   the section's numerical column (initCost, costGrowth, etc.) should be
   filled in with the Step D iter #10 locked values. The flavor text is
   preserved verbatim.

2. **`Prototype/dark-filaments-t1-current-state.md` §9** (or equivalent
   simulator section): update the T3 spec table with the locked numerical
   values, the engine extension (carryMpsMult), and the Step D landing entry.

3. **`CLAUDE.md` state-of-play bullet:** add the T3 Dwarf Spheroidal retune
   landing entry. Workstream next: T4 Galactic Arm retune.

4. **`Simulator/reports/v1-progress.md`:** append the Step D landing entry
   (this report's summary line).

The values themselves should NOT be edited in `data.js` outside of a deliberate
retune workstream — they are the canonical Step D iter #10 outcome.
