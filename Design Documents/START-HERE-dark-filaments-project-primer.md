# Dark Filaments — Project Primer

A handoff document for picking up development of *Dark Filaments* in a fresh context. Covers the game concept, current development state, the simulator we use to test it, and the philosophy behind both.

---

## Long-burn callout (2026-05-11 lock)

**Dark Filaments is a long-burn idle clicker that occupies cosmological deep-time.** Target playthrough is ~5-6 weeks engaged play / ~7-8 weeks casual play for a full Completion run; Threshold runs slightly longer due to its drawn-out descent. Sim-tuner calibrates against three engagement profiles (Engaged / Casual / Drift); calendar time is the design target, not continuous-bot active time. The player keeps a small dying universe in their browser tab for weeks. Two endings emerge from the same upgrade tree: **Threshold** (contemplative, slow) and **Completion** (catastrophic, with compressed Act 2). Both serve the central theme. The Act 2 inversion — Completion finishes *faster* than Threshold from T6 onward — is the mechanical instantiation of the central thesis ("the better you play, the faster the universe ends").

The patient universe model: mass accumulates while away, consolidation gates require active purchase, no completionist mechanics after T5 (strategic choice locks at the peak). 14 load-bearing rules locked or revised this session; see CLAUDE.md.

The primer below is written from the focused-experience frame of an earlier era. Where pacing, session length, or active-time targets are referenced, treat them as long-burn re-scaled per the table in `gameplay-design.md` §1. The structural ideas — emotional curve, hidden number, narrator, named-connection breaks, Inventory — all hold and have been strengthened, not replaced.

---

## Part 1 — The Game

### Concept

*Dark Filaments* is a **long-burn cosmological idle game**. The player starts at the scale of a single solar system and progresses through ten tiers up to the Causal Horizon. Target playthrough is ~5-8 weeks of calendar time at typical engagement; the patient universe model means mass accumulates while away and active sessions are investment moments that compound forward. Each tier represents a real astrophysical scale — Stellar Neighborhood, Galactic Arm, Galaxy, Local Group, Galactic Cluster, Supercluster, Filament, Cosmic Web, Causal Horizon.

Mechanically it's a Cookie Clicker descendant with a long-burn twist: tap to gain the primary resource (Mass, denominated in solar masses M☉), buy upgrades that improve passive accumulation and click power, transition between tiers when you've earned enough Consolidation. Mass accumulates while the player is away (patient universe); consolidation gates require active purchase. Real cosmological vocabulary throughout. No invented terminology.

Underneath the mechanics, the game has a structural twist that the player discovers slowly. What looks like a power-fantasy idle clicker is in fact a meditation on entropy, loss, and the cost of consolidation. The numbers are honest — you really are getting bigger and more powerful. And every time you do, somewhere offscreen, the spaces between things get a little wider.

### The emotional curve (load-bearing)

The architectural principle that ties together pacing, audio, visuals, and writing. The single design idea most worth protecting through every revision.

The game is **not** flat-then-sad. It is:

> **up → up → up → peak → first thinning → cold → silent**

Act 1 doesn't merely fail to get sad — it gets *actively grander*. By the time the player is consolidating the Local Group at Tier 5, the experience should be at its most triumphant. Music at its fullest. Visuals at their most overwhelming. The player should be feeling something close to awe.

**That peak is what makes the descent hurt.** The player doesn't fall from neutral into loneliness. They fall from awe into loneliness. And the structural twist is that *the peak is already the moment the descent has begun.* The most triumphant beat in the game is the moment when so much matter has been pulled together that the universe has thinned past recovery. The first named-connection break lands shortly after the Tier 5 peak — close enough that the player still has the awe in their body when the first sadness arrives.

### Act 1 — Ascent

A confident, polished, fun idle clicker that *gets grander as it goes*. The genre conventions are played straight:

- Punchy click feedback, satisfying upgrade trees, short-term goals every few minutes.
- Tier transitions feel like accomplishments — visual fanfare, sound stings, clear progression — and these *escalate*. The first transition is satisfying. The fifth is awe-inspiring.
- Flavor text is grand, embodied, physical. Verbs of contact and arrival: things *come to* the player. *"The Andromeda Galaxy bends toward you. One trillion stars settle within your gravitational reach."*
- UI is clean, readable, energizing.
- The visible-but-unlabeled number sits there, doing nothing visible.

The act of playing this section well is what *causes* Act 2. Progression doesn't trigger the descent — progression *is* the descent, viewed from a different angle.

### Act 2 — Descent

Nothing announces the shift. There is no chapter break, no cutscene, no narrator monologue. Some players will notice the moment of transition. Most will look back and not be sure when it happened. What changes:

- The unlabeled number is now noticeably ticking down. Some players have spotted it. Most haven't.
- The narrator's voice quiets. Same "we." Different mood. Verbs change: things now *leave*. Numbers replace adjectives — *"The 4.2 billion stars of NGC 1300. Their last broadcasts, if any, departed 670 million years ago."* Same upgrade structure, different voice.
- Clicks feel infinitesimally less responsive — the screen shake is slightly smaller, the sound slightly thinner. Nothing the player can pin down.
- The first **named connection breaks** — the load-bearing reveal moment (see below).
- From here, named breaks accelerate, the audio bed thins, the playfield begins to fragment.
- **Idle interjections** start landing in dead air — quiet observations from the narrator while the player is just watching numbers. This is where Act 2's grief reaches the player most directly.

There is no boss, no climax, no triumph. Act 2 is a vigil.

### The number, and the reveal

A single 13-digit number sits unobtrusively in the UI **from the very first minute of play**. It is enormous. It is unlabeled. It does not move for a long time. Players will assume it's flavor, a placeholder, a future endgame target, or some kind of cosmic statistic. They will ignore it.

It represents the count of **causal connections** remaining in the universe — the number of "this region can still be reached by light from that region" pairs. The player is never told this until the reveal.

For roughly the first act, the number is functionally static. It might tick almost imperceptibly. Then, somewhere around when the player starts merging large structures, it begins to drop. Then drop faster. The relationship is the trap:

> **The better you play, the faster it drops.**

There is no upgrade that slows it. There is no resource you can spend to halt it. There is no mechanic the player overlooked. The game never had a way to stop it — that was always the point. The clicker rewards optimization with a steeper descent.

**The reveal moment.** The number is completely unlabeled until the first named-connection break. At that exact moment, three things happen simultaneously:

1. The number drops by **one**.
2. A label fades in beside it: *Causal Connections*.
3. One audio layer in the ambient bed fades out over four bars; a small, named region of the 3D scene drifts a few degrees away from the camera, then locks in place forever.

The naming *is* the reveal. There is no cutscene, no monologue. The player draws the conclusion themselves, and that conclusion is unforgettable *because* they drew it.

The current first-named-break candidate is **the Eridanus Reach**:

> *The Eridanus Reach has fallen below causal threshold.*
>
> *The 47 galaxies on its far side will not reach us again.*

Two sentences. The first uses a word the game has not used before. The second does what Act 2 always does from this point on — gives a number, makes the loss specific. The number 47 is small enough to be *real,* not abstract. Billions is a statistic. Forty-seven is a thing you could imagine. This is the most polished line in the entire game, and every other line of Act 2 is calibrated against its weight.

Players will, eventually, try to *play badly* to slow the descent. This is allowed. It does not feel good. Both choices are real, and both are losses, and that's the design working.

### The narrator

Every line of flavor text in *Dark Filaments* is spoken by a single voice. The voice is anonymous, durable, and present from the first stars to the last. It speaks in **first-person plural — "we"** — until the very end of the game, when it shifts to "I."

**Who they are:** never identified. Durable enough to have watched from before the first stars and to be present at the last. Not a god. They grieve. The "we" is the universe speaking through whatever observer happens to be present — the player included.

**Why it matters structurally:** the Act 1 → Act 2 tonal shift becomes *character development*, not a voice change. Same diarist, deepening into knowledge. The narrator does not change registers; they *come to understand* what they have always been recording.

**The endgame "I."** When the last connection breaks, the narrator shifts to first-person singular for the first time:

> *The last bridge has fallen. Everything that exists now exists alone.*
>
> *I remain. I do not know for whom I am still recording this.*
>
> *If you are reading these words, then somewhere, against everything, a connection has held.*
>
> *Goodnight.*

These are the only words in the entire game that don't fade. The save settles. The screen holds. The player closes the tab when they're ready, and the words are still there. The first persistent text in the game is also the last.

### Verb arc

The player's primary action — the click button — uses different verbs at different tiers:

| Tier | Verb |
|---|---|
| 1-2 | Pull |
| 3-4 | Bind |
| 5-6 | Consolidate |
| 7-8 | Hold |
| 9-10 | Reach |

Players who play long enough will eventually scroll back through the upgrade history and see the verbs together as a sentence: *Pull, Bind, Consolidate, Hold, Reach.* The acquisitive verbs (early) become preservational ones (late) inside the player's hands, on the button they press hundreds of times. The Tier 9 verb *Reach* is also the word in *the Eridanus Reach* — same word, two meanings, one act of contact, one act of severance.

### One universe per save

No traditional prestige. No "start over with bonuses." Each save is one universe, finite and final. Players can start a *new* universe whenever they want. Nothing stops them. But the old save isn't a failed run — it's a completed one. The main menu lists past universes as records:

> Universe 1 — 14h 22m active, 4d 17h elapsed, ended Apr 2
> Universe 2 — currently active, 2h 41m

This frames replay correctly. You're not optimizing. You're choosing to do it again.

### Design principles that shape everything

A few principles to internalize before making any decision:

**Real cosmology only.** Every upgrade name is a real astronomical term. *Solar Wind, Asteroid Belt, Stellar Coupling, Magnetosphere, Orbital Resonance, Heliopause, First Photons.* No invented vocabulary. This is the discipline that makes the writing credible — when the descriptions go strange in Act 2, the names stay grounded. Real galaxies. Real voids. Real physics. Poetic license in arrangement, not in invention.

**No log, no scrollback.** Flavor text fades and never persists. Players who miss a line don't get to retrieve it. This is non-negotiable: the entire game is about things being lost, and a scrollback log would be a *causal record* of those losses — exactly the thing the game is denying. The single exception is the endgame "I" lines, which don't fade. The first persistent text is also the last; that asymmetry is the point.

**Mass as the only currency through the entire game** ("it is cookies"). No second resource. No consolidation-as-spendable-currency. Just Mass. Consolidation is a *progress meter* that gates tier transitions — it accumulates from buying certain one-shots, not as a resource you "earn" and "spend."

**The number is shown, not hidden.** It sits in the UI from minute one — visible, unlabeled, ignorable. The label *Causal Connections* fades in only at the first named-connection break. The reveal is the naming, not the unveiling.

**Never explain.** The game does not say "you have caused this." It does not say "this is the descent." It does not say "the number was always this." The player figures it out from the numbers and the names. *That conclusion is unforgettable because they drew it.*

**No exclamation points anywhere.** Not in Act 1. Not in achievement popups. Not ever. The game has a quiet voice.

**No second-person guilt.** Act 2 doesn't say "you killed them." It says "they are gone." The shift from active to passive is the inversion of agency the player will feel.

**Consolidation-rewarding upgrades = the writing is best.** One-shots that grant consolidation are the upgrades with the best flavor descriptions, and they progress the game faster. The economy itself teaches: pursue the named, story-heavy upgrades, get rewarded with progression. The flavor *is* the reward.

### Mechanics: the upgrade taxonomy

Upgrades come in three mechanical categories:

**Stackables** — buy multiple times, each level adds an additive bonus to one of three stats:
- **Mass-per-click (MPC)** — multiplied by clicks
- **Mass-per-second (MPS)** — passive accumulation
- **Auto-clicks-per-second (APS)** — autoclickers; each auto-click yields current MPC mass

Cost grows geometrically per level (typically 1.15x or 1.40x). Effectively unlimited maximum (level cap of 99), with one exception per tier — the *completionist stackable* that has a low max (T1 has Mag at max=5) and is required for the Completion path.

**One-shots** — buy once, permanent. Some grant consolidation (gating tier transitions); some grant flat multipliers to global income; some are completionist-required. A single one-shot can do all three things at once.

**Synergies** — cross-upgrade multipliers. An upgrade can target another upgrade and multiply its self-contribution. T1's only synergy is *Heliopause → Stellar Coupling × 1.5* (a flat one-shot multiplier). T2 will introduce 2-3 more synergies of different mechanical kinds (per-level vs. flat, same-stat vs. cross-stat).

### Two player paths

Each tier has two ways to "leave" it:

**Threshold path** — reach the consolidation threshold for the tier. Transition becomes available; player chooses when to take it.

**Completion path** — reach the consolidation threshold AND max all completionist upgrades. The simulator runs this path by default because it's the longer, more representative experience.

Players who want to optimize take the Threshold path; players who want the full content stay for Completion.

### Tier structure (current planning state)

| # | Name | Consolidation | Status |
|---|---|---|---|
| 1 | Solar System | 1.0 | Calibrated, prototype built |
| 2 | Stellar Neighborhood | 2.5 | v5-M numbers locked, ported to JS sim; two playtests on the books (100 / 147.6 cpm); flavor locked |
| 3 | Galactic Arm | 6.25 | Slate locked: tiered Bulge (tiered consolidation), cross-tier synergy, "the arm, turning" |
| 4 | Galaxy | 15.6 | Slate locked: 5 stackables + 5 one-shots; compound-channel completionist (Hot Coronal Halo); cross-tier one-shot→one-shot synergy (T3 Active Nucleus → T4 Sgr A*); "Home, recognized" |
| 5 | Local Group | 39.1 | **Peak tier** — top polish budget; descent begins here structurally |
| 6 | Galactic Cluster | 97.7 | Act 2 begins (subtle); first named-connection break lands ~here |
| 7 | Supercluster | 244 | Act 2 clear |
| 8 | Filament | 610 | Title tier — meaning shifts; player IS a dark filament |
| 9 | Cosmic Web | 1525 | Late descent |
| 10 | Causal Horizon | 3814 | Endgame; vigil mechanics; "I" appears |

Consolidation thresholds grow geometrically (×2.5 per tier). Each tier takes hours to days of calendar time at the Engaged engagement profile (Threshold / Completion): T1 2-4 hr / 2-4 hr · T2 6-10 hr / 8-12 hr · T3 1-1.5 d / 1-2 d · T4 2-3 d / 3-4 d · T5 PEAK 3-5 d / 5-7 d · T6 4-6 d / 4-6 d · T7 5-7 d / 5-7 d · T8 6-8 d / 4-6 d · T9 7-10 d / 3-4 d (INVERSION) · T10 8-12 d / 2-3 d. Target calendar time at Engaged: ~5-6 weeks Completion / ~7-8 weeks Threshold. See `gameplay-design.md` §1 for the three-engagement-profile table (Engaged / Casual / Drift).

---

## Part 2 — The Simulator

### What it is

A spreadsheet-based simulation of player progression through a tier. Built in Excel (.xlsx) format using Python + openpyxl. Given a tier's upgrade definitions, macro parameters (cpm, engagement, consolidation thresholds), it simulates a virtual player making purchasing decisions every 10 seconds and projects time-to-completion + level distribution.

The current version (v1.2.1) handles T1 only, with timings calibrated to ±25 seconds of real playtests across 60/100/150 cpm.

### Why we built it

Idle games live or die on their progression curve. A bad curve means players hit either a wall (too slow) or a yawn (too fast). Tuning by gut alone is unreliable. The simulator lets us:

- Predict completion time for any given parameter combo before building anything
- See where a player gets stuck or breezes through
- Test how upgrade pricing/effects propagate through the whole curve
- Validate against real playtests (we did three at 60/100/150 cpm)
- Make "what if I changed this number?" cheap to answer

### Build philosophy: the script is the source of truth

The .xlsx file is *generated* by a Python script (`build_simulator_v12_1.py`). The script is the source code. The .xlsx is the build output.

Why this matters:

- **Versioning is real.** You can diff scripts, see what changed between iterations, revert intent rather than just bytes.
- **Iteration is fast.** Tuning a number is a one-line change in Python, then rerun.
- **Patterns are reusable.** The script knows how to build a tier — adding T2 later means extending data, not redoing structure.
- **Excel doesn't fight you.** Trying to edit hundreds of structured formulas inline in Excel is awful. Editing them in Python and regenerating is sane.

The workflow is always: edit script → run script → run recalc → inspect xlsx → iterate.

### Spreadsheet structure

Five sheets. Each has a clear role:

**Parameters** — all macro values (cpm, active_play_fraction, consolidation thresholds, save_vpc_threshold, etc.). Hand-tunable. Changes here propagate through everything via cell references.

**Upgrades** — one row per upgrade, columns for cost, growth, max levels, the three stat additions (per-level), one-shot effects (×multipliers, +base values), consolidation contribution, completionist flag, synergy target, synergy mult/lvl, description. Tier 1 has 7 rows. Adding a new upgrade is one new row.

**UpgradeSim** — the actual simulation. ~400 rows of 10-second ticks. Reads from Parameters and Upgrades, computes everything per tick:
- Mass before income, income from clicks/passive/auto, mass after income
- Per-upgrade levels and self-contributions
- Cost helpers, save mode, action decision
- Mass after purchase

This is where the strategy lives — the action column at AX uses VPC math (more on that below) to decide what to buy each tick.

**Curves** — derived metrics. Per-upgrade level-over-time, contribution-over-time, click vs. passive split, completion progress. Useful for spotting where things look off.

**README** — version notes, workflow reminders.

### Helper columns: the action computation

The action formula at AX is the simulator's "AI." It needs to decide each tick: do nothing, buy a one-shot, buy a stackable, or transition? It also needs to be representative of how a real player would actually decide.

The decision logic uses ~10 helper columns (AG-AX) that compute intermediate values:

- **AG-AM**: Cost helpers — what does each upgrade cost at its current level?
- **AN**: Trans? — is transition available (consolidation + completionist met)?
- **AO**: Could-trans? — consolidation met, completionist may not be?
- **AP**: Next OS cost — cheapest unowned one-shot
- **AQ**: Cheapest stackable cost
- **AR**: Save mode flag
- **AS-AV**: Per-stackable VPC (value-per-cost ratios)
- **AW**: Save target VPC — max VPC across unaffordable buyable upgrades
- **AX**: Action decision

All hidden by default; unhide if you want to inspect what happened on a specific tick.

### The strategy: VPC + post-consolidation focus

This is the model the simulator uses for player decisions. It went through several iterations:

**v1.2 (balanced-build)** — buy whichever stackable has the lowest level. Came within 100% of player time (i.e., 2× too slow). Real players don't balance builds — they invest in efficiency.

**v1.2.1 (greedy VPC)** — buy whichever stackable has the highest income-gain-per-mass-spent. Each stackable's VPC = (per-level marginal income gain) / (next purchase cost). Each one-shot's VPC = (estimated total income delta from its effect) / cost. Improved time match dramatically.

**v1.2.1 + post-consolidation focus (current)** — once consolidation threshold is met but completionist isn't done yet, the simulator stops buying non-completionist stackables (SW, AB, SC) and rushes the completionist (Mag) to its max. This matched real player behavior — once the finish line is visible, players stop "exploring" stackables.

Final calibration: ±25 seconds of real player times across 60/100/150 cpm. Total times within 6%.

### The save_vpc_threshold parameter

The single most important tunable. Default 1.5. Save mode triggers when:
```
next_target_VPC > save_vpc_threshold × max_affordable_stackable_VPC
```

Lower values (1.0, 0.8) make the simulator save harder; higher values (2.0, 3.0) make it spend more freely on stackables. 1.5 is the value that matched real playtests.

### Calibration history

For reference, the timing journey at 100 cpm × 100% engagement (player ground truth: 8:37):

| Version | Total | Strategy |
|---|---|---|
| v1.2 | 18:30 (+115%) | Balanced-build |
| v1.2.1 (VPC, 2.0× threshold) | 13:40 (+58%) | Greedy value-per-cost |
| v1.2.1 (VPC, 1.5× threshold) | 12:50 (+49%) | Tighter save trigger |
| v1.2.1 + post-consol focus | 8:30 (-1%) | + endgame rush awareness |

Across all three cpm tested (60, 100, 150), the final version is within 6% of player times.

### How to run a simulation

```bash
# 1. Edit parameters in the script if needed (or the xlsx Parameters tab)
python build_simulator_v12_1.py
# → outputs dark-filaments-simulation-v1.2.1.xlsx

# 2. Recalculate the sheet (LibreOffice headless)
python recalc.py dark-filaments-simulation-v1.2.1.xlsx 240
# → 240 is timeout in seconds; ~1 minute for T1

# 3. Open the xlsx in Excel/LibreOffice/Google Sheets
# → cached values reflect last recalc
```

Default parameters in the build script: `active_clicks_per_min=100`, `active_play_fraction=1.0`. Match what the prototype reports. The prototype dynamically adjusts cpm based on actual click rate, so engagement is always 1.0 — partial-engagement is captured by cpm dropping naturally.

### What the simulator currently doesn't model

A few things to be aware of:

- **Player exploration.** Real players try things, change their mind, buy non-optimal upgrades for variety. The simulator plays optimally per VPC.
- **Multi-tier dynamics.** The current sim runs one tier at a time. Tier transitions and how they feel structurally aren't modeled.
- **Per-tier active-fraction modeling for the simulator.** The simulator's `perTierEngagement` parameter models the fraction of wall-clock time the player is actively present during each tier — proposed values T1 ≈ 100%, T5 ≈ 50%, T9-10 ≈ 30%. Under the long-burn shift this is no longer about "session length" but about **how much of the long-burn arc the player chooses to spend actively present versus letting the patient universe accumulate offline**. Per-tier values still need revisit-and-validate against real long-burn playtest data once T5+ redesign lands.
- **Real autoclickers.** T1 doesn't use APS. T2 will (Tidal Streams). The schema supports it; behavior in the simulator will need testing once T2 is built.

---

## Part 3 — Current State

### T1 — Solar System (calibrated, prototype built)

7 upgrades, 1 synergy, calibrated against real playtests:

| Upgrade | Type | Cost | Growth | Max | Effect | Consolidation | Completionist |
|---|---|---|---|---|---|---|---|
| Solar Wind | Stackable (MPS) | 7 | 1.15 | 99 | +0.080 M/s/lvl | — | — |
| Asteroid Belt | Stackable (MPS) | 20 | 1.15 | 99 | +0.200 M/s/lvl | — | — |
| Stellar Coupling | Stackable (MPC) | 22 | 1.40 | 99 | +0.350 M/click/lvl | — | — |
| Magnetosphere | Stackable (MPS, completionist) | 80 | 1.80 | 5 | +1.000 M/s/lvl | — | **Yes** |
| Orbital Resonance | One-shot | 240 | — | 1 | ×1.25 to all M/s | 0.4 | — |
| Heliopause | One-shot | 575 | — | 1 | (synergy → SC ×1.5) | 0.6 | — |
| First Photons | One-shot | 850 | — | 1 | +1.0 base M/s, ×1.20 to all M/click | — | **Yes** |

Consolidation total available: 0.4 + 0.6 = 1.0 (transition threshold)
Completionist required: Magnetosphere maxed AND First Photons owned

Real playtest results:
- 60 cpm: 11:35 total
- 100 cpm: 8:37 total
- 150 cpm: 6:53 total

Sim matches all three within 6% time.

### T2 — Stellar Neighborhood (drafted, not yet implemented)

Proposed upgrade list (9 upgrades, 3 synergies):

**Stackables (5):**
1. Stellar Drift — passive
2. Local Bubble — passive (synergy target)
3. Gravitational Lensing — click (synergy target)
4. Tidal Streams — autoclicker (synergy provider, NEW APS mechanic)
5. Brown Dwarf — passive completionist, max 5 (synergy provider)

**One-shots (4):**
6. Binary Partner — consolidation 0.6, synergy provider (flat)
7. Proper Motion — consolidation 0.9 (placeholder name, may rename)
8. Open Cluster — consolidation 1.0, T3 transition gate
9. Stellar Cocoon — completionist (placeholder name, may rename)

Consolidation total: 0.6 + 0.9 + 1.0 = 2.5 (T2 threshold)

**Three synergies (different kinds):**
- A. Binary Partner → Gravitational Lensing × 1.5 (one-shot, flat — same as T1's HP→SC)
- B. Tidal Streams → Local Bubble × 1.05^level (stackable, per-level — NEW)
- C. Brown Dwarf → Tidal Streams × 1.10^level (stackable, cross-stat — NEW)

Numerical tuning hasn't started yet.

### Prototype state

A barebones T1 prototype exists, built in Claude Code (in-app). Single-file HTML + JS. Has:
- Click-to-gain-mass core loop
- Upgrade purchasing with the schema above
- Autoclicker dev tool (sets cpm; player can override)
- Instrumentation logging (every tick + every buy logged with timestamps, mass, consolidation)
- Session report screen (final levels, click/passive split, total time, completion flags)
- Copy/Download log buttons for sharing playtest data

The prototype's logging output format matches what the simulator expects to consume for calibration.

Spec for the prototype is in [`Prototype/historical/dark-filaments-t1-barebones-spec.md`](../Prototype/historical/dark-filaments-t1-barebones-spec.md).

---

## Part 4 — Migration Notes

### What's in this package

| File | Purpose |
|---|---|
| `dark-filaments-project-primer.md` | This document |
| `dark-filaments-simulation-v1.2.1.xlsx` | Latest simulator (T1 calibrated) |
| `build_simulator_v12_1.py` | Build script — source of truth for the simulator |
| `recalc.py` | LibreOffice-headless recalc helper |
| `Prototype/historical/dark-filaments-t1-barebones-spec.md` | Prototype build spec |
| `playtest_log_60cpm.txt` | Real playtest at 60 cpm (11:35 total) |
| `playtest_log_100cpm.txt` | Real playtest at 100 cpm (8:37 total) |
| `playtest_log_150cpm.txt` | Real playtest at 150 cpm (6:53 total) |

The four design docs from the source project (design notes, gameplay design, visual design, voice samples) live in the original conversation's outputs and are referenced throughout this primer. Pull those in alongside this file. They use stable unversioned filenames now; internal Changelog blocks at the top of each track version history.

### Suggested project structure for Claude Code

```
dark-filaments/
├── CLAUDE.md                    # Project context, conventions, current state
├── docs/
│   ├── design-notes.md          # Canonical concept doc
│   ├── gameplay-design.md       # Full upgrade tree, all tiers
│   ├── visual-design.md         # Stages, UI, click feedback
│   ├── voice-samples.md         # Narrator voice calibration
│   └── project-primer.md        # This file
├── simulator/
│   ├── build_simulator_v12_1.py # Source of truth
│   ├── recalc.py                # Recalc helper
│   ├── dark-filaments-simulation-v1.2.1.xlsx  # Current build output
│   └── playtests/
│       ├── log_60cpm.txt
│       ├── log_100cpm.txt
│       └── log_150cpm.txt
├── prototype/
│   └── (T1 prototype HTML + JS)
└── game/                        # Future home for the actual game
```

### Dependencies

For the simulator:
- Python 3.x
- `openpyxl` (`pip install openpyxl`)
- LibreOffice (for `recalc.py` headless mode)

The recalc script uses `soffice --headless --convert-to xlsx` under the hood. On macOS that's typically at `/Applications/LibreOffice.app/Contents/MacOS/soffice`. On Linux it's `soffice`. The recalc.py script handles platform detection.

### Where we are (state of play)

- **T1**: numerically calibrated, prototype playable, simulator matches real playtests within 6%.
- **T2**: upgrade list drafted with proposed synergies; numerical tuning not started; nothing built.
- **Open questions for T2**: confirm synergy kinds (flat vs per-level), name finalization (Proper Motion, Stellar Cocoon are placeholders), per-tier engagement parameters.
- **Next session candidate**: number-tuning T2, then extending the simulator's build script to handle a second tier.
