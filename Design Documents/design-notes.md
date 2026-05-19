# Dark Filaments — Design Notes

> A long-burn idle clicker that disguises a meditation on entropy, loss, and the cost of consolidation. The player thinks they're building a galactic empire. They're actually causing the heat death of the universe. Not an evening's entertainment — an artifact the player keeps with them for weeks.

**Version 0.11 · Last updated 2026-05-14**

## Changelog

- **0.11 (current)** — **2026-05-14 UX workstream closing pass.** §18 5th idea-capture entry added: "Dim points + Fork C as one design idea" — the Causal Connections mystery number and the Inventory artifact reframed as one composition presented in two parts, separated by the endgame fade; canonical presentation surface is visual-design.md §9 hybrid composition. §16.5 cosmological time-arc subsection gained a forward pointer to visual-design.md §9: the time-arc gains a presentation surface in the Inventory's curated spiral layout (T1 near screen center, T11 at periphery), encoded spatially (radial position by tier) and temporally (brightness-as-recency across the deep field of dim points). No other prose or slate changes.
- **0.10** — **CD T1-T3 holistic review closing pass landed 2026-05-13 evening.** Verdict: "T1-T3 is ready to lock as a group; proceed to T4 retune." Two narrow content edits: (1) §9 closing paragraph on Subhalo UX surfacing promoted from "Phase 2 sim-tuner / engineering-director question" to "named parallel workstream running alongside the T4 numerical retune"; (2) new §18 "Idea captures" section appended — four creative-direction surfaces preserved for future workstreams (Mass-counter-vs-stats-line teachable pattern; "we are doing this" sibling line for T5; Moderate engagement-profile creative-design surface; Cosmological time-arc weight for Draco / Inventory artifact). Each capture preserves description + proposed workstream timing + originating context. No prose or slate changes elsewhere.
- **0.9** — **11-tier ladder locked 2026-05-13 (afternoon reshape).** Final shape: T1 Solar System → **T2 Stellar Neighborhood** (now at the 2-8h day-1-bridge calendar slot; name stays from prior 10-tier ladder) → **T3 Dwarf Spheroidal NEW** (~10⁶·⁵ M☉; Draco / Ursa Minor anchor; dark-matter-dominated) → T4 Galactic Arm → ... → T6 Local Group PEAK → ... → T10 Cosmic Web INVERSION → T11 Causal Horizon. Morning pass had inserted Stellar Association at ~10²·⁵ M☉; retired same-day when Association/Neighborhood naming collision surfaced and the actual 10³ → 10¹⁰ mass cliff was identified as the more meaningful gap to fill. Full rationale in gameplay-design.md v0.4 changelog. Cosmological time-arc table (§16.5) renumbered to 11 tiers with new T3 Dwarf Spheroidal anchored at "stelliferous, present (dark-matter-dominated relics)". Per-tier calendar targets in §1.5 rewritten for the new shape. All §3 / §7 / §9 / §17 references to ordinal tiers renumbered or rephrased as renumber-proof. Phase 2 deferred: new T3 Dwarf Spheroidal upgrade slate design (creative + science + writer), data.js engine renumber, sim-tuner calibration to produce 24-48h T3 calendar. Cosmological time-arc table (§16.5) renumbered to 11 tiers; new T2 anchored at "stelliferous, present (co-natal sibling drift)" with associations dispersing over ~10⁷-10⁸ yr. Per-tier calendar targets in §1.5 rewritten for 11-tier shape (T1 Solar System 8-15min · **T2 Stellar Association 2-8h (NEW bridge)** · T3 Stellar Neighborhood 24-48h · ... · **T6 Local Group PEAK** · ... · **T10 Cosmic Web INVERSION** · T11 Causal Horizon final). All §3 / §7 / §9 / §17 references to ordinal tiers renumbered or rephrased as renumber-proof (e.g. "Tier 10 Inventory" → "final-tier Inventory"; "Act 1 T1-T5" → "Act 1 = T1 through the PEAK tier"). Tiers' canonical names referenced explicitly where renumber-proofing would lose clarity. Phase 2 deferred: new T2 Stellar Association upgrade slate design (creative + science + writer), data.js engine renumber, sim-tuner calibration to produce 2-8h T2 calendar.
- **0.8** — Long-burn pacing model refined 2026-05-11. Continuous-bot active-time totals (~154h Threshold / ~196h Completion) retired in favor of **calendar-time-by-engagement-profile** framing. §1.5 "Tamagotchi for entropy" totals reframed: ~5-6 weeks engaged Completion / ~7-8 weeks engaged Threshold (Casual: ~7-8 weeks Comp / ~9-10 weeks Thr; Drift: ~10-12+ weeks, may not finish). Total active engagement (engaged profile) ~25-30h Completion / ~15-20h Threshold. Per-tier calendar targets and the investment-amplification mechanic now live in `gameplay-design.md` v0.4 (§1.6). Design philosophy, the 14 load-bearing rules, the inversion shape, and M☉ targets per tier are unchanged.
- **0.7** — Long-burn design philosophy lock 2026-05-11. Genre reframed from focused evening-length experience to long-burn idle clicker (~154h Threshold / ~196h Completion active play, 1-2 months idle). New §1.5 "Tamagotchi for entropy" genre reframe. §3 emotional curve preserved but pacing recontextualized across deep time. §7 Two Acts reframed as Act 1 (decision-phase, T1-T5) / Act 2 (witness-phase, T6-T10) with no new strategic mechanics in T6-T10. Two paths now articulated as two endings (Threshold = contemplative ~154h; Completion = catastrophic ~196h with compressed Act 2). §9 Inventory expanded as canonical post-completion artifact (chronological, returnable indefinitely, ~40-60+ named structures). §6 CMB through-line workshop priority raised — Act 2 has only three content channels (named-connection breaks, baseline progress, CMB through-line). New §17 cosmological time-arc per tier added (T6 ~10¹¹ yr through T10 ~10⁴⁰-10¹⁰⁰⁺ yr). Solar mass unit lock referenced. T6-T10 stub design now stale pending redesign.
- **0.6** — New §6 Cosmological Through-Line (~15-20 CMB flavor lines across the full arc; the literal physical signal that connected the whole universe, fading — needs fleshing-out during writing-in-volume). §9 Upgrade tree captured with reference to gameplay design doc. The Inventory mechanic added — a Tier 10 one-shot that reveals a chronological list of every named structure the game has lost. Open questions resolved from gameplay design pass: discovery events skipped (too "game-y"), upgrade preview skipped (preserves the disguise), The End button kept with caveats (revisit during prototyping), hidden upgrades / branching paths skipped (would harm narrator coherence), Inventory contents includes all named structures including those lost while idle.

---

## 1. The Core Concept

Dark Filaments is two games stacked on top of each other.

The first is a competent, satisfying, completely normal idle clicker about cosmic ambition. You harness your solar system. You bind nebulae to your gravity. You merge galaxies. Numbers go up. Upgrades unlock. Tier names sound triumphant. It feels good. As you go deeper, it doesn't just stay good — it gets *grand*. The music swells. The visuals overwhelm. You feel something close to awe.

The second is what's actually happening. By pulling matter together into ever-larger clumps, you're emptying the spaces between them — and those empty regions, the supervoids, are growing. The cosmic web is *real physics*: matter clumps along thinning filaments, and the gaps inflate. Eventually the filaments become too thin to hold. Galaxies, star groups, finally individual stars become **causally disconnected** — separated by so much expanding space that no light or signal can ever pass between them again. The universe doesn't end with a bang. It ends with everything being alone forever.

The player learns this gradually, through a single dropping number they didn't notice for the first hour — and they realize, looking back, that the most triumphant moment of the game was already the moment when too much had been pulled together.

The title's meaning surfaces at the same time. *Dark Filaments* sounds, on the store page, like atmospheric sci-fi. By the Filament tier (T9 under the 2026-05-13 11-tier ladder) it means something specific: the cosmic web's threads — the structures of matter the player has spent the whole game becoming, and which are unraveling around them.

---

## 1.5 The Long-Burn — Tamagotchi for Entropy

Dark Filaments is a long-burn idle clicker that occupies cosmological deep-time. Not an evening's entertainment — an artifact the player keeps with them for weeks. The universe runs whether watched or not; the player checks in, makes a decision or two, watches a structure that did not exist this morning appear in the scene. Days later, watches one disappear. The arc of play is the arc of a relationship with something dying slowly enough that the dying becomes the relationship.

Calibration targets are **calendar time at engagement profile**, not continuous active minutes. The Engaged profile (3× check-ins/day at 15 min — ~45 min daily active) completes a Completion playthrough in **~5-6 weeks**; a Threshold playthrough in **~7-8 weeks**. The Casual profile (1× check-in/day at 15 min) extends to ~7-8 weeks Comp / ~9-10 weeks Thr. The Drift profile (2-3× per week at 10 min) runs ~10-12+ weeks and may not finish. Total active engagement across an engaged Completion playthrough is **~25-30 hours**; ~15-20 hours for Threshold. Per-tier calendar targets under the 2026-05-13 11-tier ladder (Engaged Comp baseline): T1 Solar System 8-15min · **T2 Stellar Neighborhood 2-8h (day-1 bridge)** · **T3 Dwarf Spheroidal 24-48h (first patient-universe return)** · T4 Galactic Arm 1-2 days · T5 Galaxy 3-4 days · **T6 Local Group PEAK 5-7 days** · T7 Galactic Cluster 4-6 days · T8 Supercluster 5-7 days · T9 Filament 4-6 days · **T10 Cosmic Web 3-4 days (INVERSION)** · T11 Causal Horizon 2-3 days. See `gameplay-design.md` §1.6 for the investment-amplification mechanic underneath: active sessions compound into idle yield, and Completion's inversion at T10 falls out of that math naturally.

### Two paths, two endings

Both paths are first-class. The split is the point.

- **Threshold path → contemplative ending.** ~7-8 weeks at the Engaged profile. Reach each tier's consolidation threshold and advance. *"We are still here, barely."* The slow meditation. The player watches the universe thin without trying to fill it.
- **Completion path → catastrophic ending.** ~5-6 weeks at the Engaged profile, with compressed post-peak descent. Reach each tier's Consolidation gate AND complete every completionist upgrade. *"You gathered every scrap; now the collapse is yours."* The Act 2 inversion — Completion finishes faster than Threshold by the INVERSION tier — is the mechanical instantiation of the central theme. The better you played, the faster the universe ended. *(CD-2/NEW-1 reframe locked 2026-05-13: the split's real value is felt opportunity cost on a single playthrough, not measured asymmetry across compared playthroughs. The thesis lands at the INVERSION tier specifically — the pre-peak curve need not be calibrated to a tight Comp-vs-Threshold ratio.)*

The same upgrade tree produces both endings. The player chooses with their purchases. The game does not signal which is "correct."

### The patient universe (offline model)

Mass accumulates continuously while the player is away. Consolidation does not advance without active purchase decisions — purchase is the only mechanism that converts stored mass into structural progress. A player who checks in once a day finds a richer mass pool waiting; they decide what to do with it. The narrator does not perform to an empty room: accumulated narrator events are held until return, then delivered as transient lines on return rather than as a readable queue. A player who returns after a long absence is greeted by a quieter line, never the loudest.

### What this changes structurally

- Forward-pointing narrator lines now point across real time (days, not minutes). The peak (T6 Local Group, under the 2026-05-13 11-tier renumber) lands days into play; the Eridanus pivot at T7 lands days after the peak. The narrator's voice gets the temporal distance it was always written for.
- Save tokens are part of the model (Cookie Clicker idiom): the universe persists across browser sessions, devices, and absences. Closing the tab is closing a door, not ending a run.
- Speedrun, idle-skip, and accelerated-time modes are not first-class. Any player-facing "faster path" undermines the thesis — the universe's death takes time. Dev tooling (tier-skip, fast-forward, debug speed multipliers) remains in scope under the existing dev-tooling carve-out; the constraint is on player-facing surfaces only.

---

## 2. The Player Is Matter

This is the keystone shift, and it makes everything else work.

In real cosmology, voids don't *do* anything — they're regions of underdensity. What actually happens is **matter clumps under gravity**, and the clumping leaves voids behind. The player isn't the antagonist; they're just gravity, doing what gravity does. The game's tragedy isn't that someone chose to destroy the universe. It's that the universe destroys itself by trying to organize.

**Mechanically:**
- You play as the gravitational pull of an initial structure (your solar system → galaxy → group → cluster → supercluster).
- Clicking and upgrading pulls matter inward, builds connections, grows your structure.
- This is real progression. The numbers are honest. You really are getting bigger and more powerful.
- And every time you do, somewhere offscreen, the spaces between things get a little wider.

**Narratively:** the framing in the early game leans into cosmic ambition — "harness," "bind," "consolidate," "dominion." Players read this as a power fantasy. They're not wrong, exactly. They just don't see what the power is doing.

---

## 3. The Emotional Curve (load-bearing)

The architectural principle that ties together pacing, audio, visuals, and writing.

The game is **not** flat-then-sad. It is:

> **up → up → up → peak → first thinning → cold → silent**

Act 1 doesn't just *fail to get sad* — it gets actively grander. By the time the player is consolidating the Local Group, the experience should be at its most triumphant. Music at its fullest. Visuals at their most overwhelming. The player should be feeling something close to awe.

**That peak is what makes the descent hurt.** The player doesn't fall from neutral into loneliness. They fall from awe into loneliness. And the structural twist of the game is that *the peak is already the moment the descent has begun.* The most triumphant beat in the game is the moment when so much matter has been pulled together that the universe has thinned past recovery.

If only one design idea from this document survives every revision: it's this curve.

---

## 4. The Hidden Number

A single, unlabeled, 13-digit number sits somewhere unobtrusive in the UI from the very first minute.

It is enormous. It does not move for a long time. Players will assume it's flavor, a placeholder, a future endgame target, or some kind of cosmic statistic. They will ignore it.

It represents the number of **causal connections** remaining in the universe. (Players never see this label until the reveal.)

For roughly the first act, the number is functionally static. Then, somewhere around when the player starts merging large structures, it begins to drop. Then drop faster:

> **The better you play, the faster it drops.**

There is no upgrade that slows it. There is no resource you can spend to halt it. The clicker rewards optimization with a steeper descent.

**Label strategy:** the number is **completely unlabeled** until the moment of the first named-connection break. At that exact moment, a label fades in beside it: *Causal Connections.* The naming is itself the reveal.

---

## 5. The Narrator

Every line of flavor text is spoken by a single anonymous voice. **First-person plural — "we"** — until the very end of the game, when it shifts to "I."

**Who they are:** never identified. Durable enough to have watched from before the first stars and to be present at the last. Not a god. They grieve. The "we" is the universe speaking through whatever observer happens to be present — the player included.

**Why it matters structurally:** the Act 1 → Act 2 tonal shift becomes *character development*, not a voice change. Same diarist. Different chapter of grief. This solves a real authoring problem: instead of writing two voices and trying to blend them, we write one character whose mood evolves.

**The narrator is on matter's side, not the player's.** They're grateful in Act 1; devastated in Act 2 as that same binding causes the separations. The narrator never says *you did this*. But their grief is the indirect indictment.

**The endgame "I" reveal.** After the last connection breaks:

> *I remain. I do not know for whom I am still recording this.*

The earlier "we" reveals itself, in retrospect, to have always been one voice speaking on behalf of everything that could no longer speak for itself. The narrator is never named.

---

## 6. The Cosmological Through-Line *(NEW — needs further fleshing-out)*

A subset of the flavor text — roughly 15–20 lines out of the ~150 total — follows a recurring observational thread that runs the entire length of the game. **The thread is the cosmic microwave background (CMB).**

### Why the CMB

The CMB is the oldest light in the universe — a faint thermal signal from the moment the universe became transparent, 380,000 years after the Big Bang. It is the only signal that ever connected every part of the cosmos. It is real, omnipresent, and slowly fading as cosmic expansion stretches its wavelengths longer and cooler.

The CMB is, in a literal physical sense, the universe's only universal voice. It is *also* exactly what the game's narrator is metaphorically — a presence that has been there from the beginning, that connects everything, that is gradually thinning as the game progresses. The narrator's tracking of it across the arc is not a metaphor for the game; **it's the same thing the game is, expressed in physics.**

### The arc of the through-line

The narrator returns to the CMB across all ten tiers, with the *register* of the references following the emotional curve:

- **Early Act 1** — the CMB is mentioned as ambient warmth. *"The cosmic microwave background hums. It has hummed for thirteen billion years. It is the oldest light there is."* Curiosity, casual reverence.
- **Mid Act 1** — the CMB is mentioned as a thing that connects everything. *"Every part of the universe shares this one signal. We are not alone in hearing it."* Optimism.
- **The peak (Tier 6, Local Group — was Tier 5 pre-2026-05-13 renumber)** — the CMB is mentioned at maximum amplitude, full and rich. *"It fills every cubic centimeter of us. We are bathed in the universe's first morning."* Awe.
- **Early Act 2** — the narrator notes, almost in passing, that the CMB is colder than it used to be. *"The microwave hum has cooled by a fraction. We had not noticed when."* The first time the narrator implicates themselves in not-noticing.
- **Mid Act 2** — the CMB has thinned. *"What was warm is becoming faint. Soon the only universal signal will not reach us either."*
- **Late Act 2** — the CMB is barely detectable. *"We strain to hear it. The first light is dying back into the dark."*
- **Endgame** — the CMB is gone, or nearly so. *"The hum that connected everything is ending. After it, only silence between us."*

The reader who follows the CMB across the game watches the narrator *learn cosmology in real time* — wonder, comprehension, mourning. The thread makes the disconnected flavor text cohere into a single sustained meditation, without telling a story or introducing characters.

### How to find the through-line

The thread is **not legible on first encounter.** Most players reading their first CMB line will register *cool detail* and move on. Only the player who reads carefully, or who looks back at the upgrade tree and Inventory after their universe ends, will piece together that the narrator was tracking one specific thing the entire time.

This is the right shape for the game's whole design ethos: rewards for close attention, never demanded.

### What still needs work

Treat this section as a sketch, not a spec. Open questions:

- **Exact line count.** "15–20" is a rough guess. Could be tighter (10–12) or looser (25–30) depending on how often the thread should surface.
- **Placement strategy.** Should the CMB lines fall at consistent intervals, or cluster around certain emotional beats? Probably a mix — some scheduled, some opportunistic.
- **Vocabulary discipline.** "Cosmic microwave background" is a real term but a mouthful. May need shorter phrasings ("the microwave hum," "the first light," "the ancient warmth") that the careful reader recognizes as referring to the same thing. Worth establishing those phrases early so they read as cohesive when reused.
- **One thread or several?** The CMB is the chosen spine. But other secondary motifs (recession velocity / cosmic expansion, specific recurring named structures like M104 or Boötes, the narrator's own relationship to time) might appear lightly underneath. To be decided. **Probably keep singular for v1** to make the writing tractable; revisit for v2.
- **Should the narrator ever explicitly *connect* the CMB to the game's mechanics?** I.e., should there be a late-game line that says, in effect, *"the signal that connects us is fading because we have pulled everything too tightly"?* This would close the loop neatly — too neatly. The game doesn't explain itself anywhere else; the through-line probably shouldn't either. Likely no.

This is one of the few sections of the design doc explicitly marked as needing more work. Worth a focused workshop session before the writing-in-volume phase begins.

**Priority elevated 2026-05-11 under the long-burn shift.** Act 2 is the witness-phase: no new strategic mechanics, no completionist upgrades, no path-distinguishing investments. That leaves Act 2 with exactly three content channels: **named-connection breaks**, **baseline progress**, and the **CMB through-line**. The through-line is now load-bearing for the witness-phase's emotional shape, not optional flavor. The workshop is the next major writing milestone after the design corpus settles.

---

## 7. The Two Acts — Decision-Phase and Witness-Phase

The game has no chapter breaks. The player crosses from Act 1 to Act 2 without being told. Some players will notice the moment. Others will look back and not be sure when it happened.

The acts are also two phases of player agency. **Act 1 (T1 through the PEAK tier) is the decision-phase** — the player is buying, choosing, optimizing, watching their universe assemble. Strategic choice peaks at the peak tier, then locks. **Act 2 (post-peak through the final tier) is the witness-phase** — no new strategic mechanics, no completionist upgrades, no path-distinguishing investments after the peak. The player witnesses what they built; they do not negotiate with it. The absence of choice in Act 2 IS the emotional content of Act 2. (Under the 2026-05-13 11-tier ladder: Act 1 = T1-T6, Act 2 = T7-T11.)

### Act 1 — Ascent / decision-phase (T1 through the PEAK tier — T1-T6 under the 11-tier ladder)

A confident, polished, fun idle clicker that *gets grander as it goes*. The genre conventions are *played straight*:

- Punchy click feedback, satisfying upgrade trees, short-term goals every few minutes
- Tier transitions feel like accomplishments — visual fanfare, sound stings, clear progression — and these escalate
- Flavor text is grand, embodied, and physical
- UI is clean, readable, energizing
- The hidden number sits there. Doing nothing visible.

The act of playing this section well is what *causes* Act 2. The choice to take the Completion path in Act 1 commits the player to the compressed Act 2 (and the catastrophic ending).

### Act 2 — Descent / witness-phase (post-peak through the final tier — T7-T11 under the 11-tier ladder)

Nothing announces the shift. What changes:

- The hidden number is now noticeably ticking
- The narrator's voice quiets. Same "we." Different mood.
- Clicks feel infinitesimally less responsive
- The first **named connection breaks.** *"The Eridanus Reach has fallen below causal threshold..."* The hidden number drops by one, and the player suddenly knows what the number is.
- From here, named breaks accelerate, the audio bed thins, the playfield begins to fragment
- **Idle interjections** start landing in dead air — the narrator's quiet observations, including some of the through-line CMB lines

There is no boss, no climax, no triumph. Act 2 is a vigil.

### Endgame

The number approaches zero. The screen is mostly black, with a few small bright pockets in their own corners. Audio has thinned to near-silence.

The final connections fall. The narrator shifts to "I."

**The End mechanic:** in the final tier (Causal Horizon), the player has access to a one-shot called *The End* — a button that severs the last remaining connections at the player's choosing. It is **not required.** The universe will reach the same state on its own eventually. The button just lets the player choose when. (To revisit during prototyping — both versions have a real feel and the right answer is probably the one that works in playtesting.)

When the last connection falls — by player choice or natural progression — the game shows:

> *The last bridge has fallen. Everything that exists now exists alone.*
>
> *I remain. I do not know for whom I am still recording this.*
>
> *If you are reading these words, then somewhere, against everything, a connection has held.*
>
> *Goodnight.*

The universe then fades, very slowly, over many minutes, until only the text remains. The text never fades. The save persists indefinitely.

---

## 8. One Universe Per Save

No traditional prestige. Each save is one universe, finite and final.

Players can start a new universe whenever they want. The old save isn't a failed run — it's a completed one. The main menu lists past universes as records.

Optional cross-universe thread (a memory-fragment carried between saves): **deferred**. Adds emotional weight but breaks the self-contained-universe principle. Revisit post-launch.

---

## 9. Core Loop, Resources, Upgrades

### The loop

**Active:** Click anywhere in the play area to exert gravitational pull.
**Passive:** Your structure attracts matter on its own at a rate set by upgrades.
**Idle:** Offline progress applies. In Act 2, coming back means coming back to find more connections lost in your absence — not a punishment, just the universe doing what it does without you.

### Resources (locked)

- **Mass** — primary currency. Accumulated from every click and from passive gravitational pull. Spent on most upgrades.
- **Consolidation** — secondary. Earned in small amounts from one-shot upgrades and larger amounts from tier transitions. Spent only on tier transitions and a small number of high-impact one-shots.

This keeps Consolidation feeling significant — not grindable, only earned through meaningful progression. The economy steers players toward the named one-shots, which carry the strongest writing and lore.

### Upgrade structure

Three kinds of upgrades — **stackable** (buy multiple), **one-shot** (buy once, named, memorable), and **tier transitions** (special one-shots that advance scale).

Each tier unlocks 4–8 new upgrades. Earlier-tier upgrades are owned forever — their effects carry forward through the cross-tier stat math — but they leave the visible menu once the player advances past their tier. No repurchase, no relevel; the past keeps working, quietly, while attention moves to what's new.

Tier transitions are not in the upgrade menu. They appear as a separate prompt when the player has accumulated enough Consolidation to take them. The player chooses when to advance; auto-advance is never forced.

**No upgrade affects the hidden Causal Connections counter.** Players who comb the upgrade tree looking for one find nothing. That absence is part of the reveal.

The complete upgrade tree is detailed in the [gameplay design doc](gameplay-design.md). This doc references but does not duplicate it.

### Hidden mechanics as a Dark Filaments signature pattern *(NEW 2026-05-13)*

The game is called *Dark Filaments*. The title commits to a design pattern: **mechanical effects whose source is not luminous, not shown in the stats panel, and not represented in the 3D scene as a body — only inferred from gravitational consequence on what is shown.**

First instance: T3 Dwarf Spheroidal **Subhalo** stackable — a "hidden-channel" upgrade that multiplies prior-tier MPS carry only, contributes nothing visible on MPS/MPC/APS stat lines, places no marker in the scene. The player perceives its existence as a discrepancy: the mass counter runs faster than the stats line predicts. Honors SD-2 (dark matter inferred, not rendered) at the tier whose defining physics (Draco M/L ~440) most clearly demands it.

This pattern should **recur in other forms** through the game wherever the cosmological subject demands it — dark matter, dark energy, vacuum-energy pressure, the underlying physics that does load-bearing work without revealing itself directly. Each occurrence should be **mechanically distinct from the others** (no repeat of the carry-multiplier shape after T3) but **conceptually unified** under the title's commitment. Candidate future instances to design when their tier lands:
- **Late Act 1 / early Act 2 dark-matter-halo dynamics** — beyond T3's substructure, the smooth halo dominates galaxy-scale and cluster-scale physics. T5 Galaxy / T6 Local Group / T7 Galactic Cluster could each carry an upgrade whose effect is inferred-only.
- **Vacuum / dark-energy acceleration** at T10 Cosmic Web / T11 Causal Horizon — the cosmological constant doing its expansive work without being shown. Could manifest as a *reduction* of effective income from distant prior-tier contributions (causal-horizon erosion mechanic) — the player loses what they had without seeing what took it.
- **Inferred fields** in connection-break events: a named connection breaks not because of a visible event but because cumulative dark-energy pressure has driven it past the causal threshold. The break is rendered; the cause is not.

The pattern is the title earning its keep. *Dark Filaments* shouldn't be just the name of a thing in T9; it should be the name of how the game thinks. **Anchor rule for the pattern:** the player must always be able to **measure** the hidden effect (a delta they can verify against the stats line, a counter that drifts, a structure that disappears with a date) even when they can't see its source. The hidden is *honest about being there*; what stays mysterious is *what it is*.

UX surfacing for the T3 Subhalo specifically is a **named parallel workstream** running alongside the T4 numerical retune (promoted from "Phase 2 deferred" 2026-05-13 evening per CD T1-T3 holistic review). At late tiers with huge numbers, a raw counter-vs-stats discrepancy won't be perceptible — some affordance (a "Dark contribution: estimated +X%" readout, a separately-tracked dark-channel total, a periodic narrator beat that names the discrepancy) is needed. This is design tension worth solving once, then reusing across all hidden-mechanic instances. Ideally locked before T5-T6 hidden-channel candidates are designed.

### The Inventory — canonical post-completion artifact

A final-tier reveal called *Inventory* surfaces a chronological scroll of every named structure the game has mentioned in flavor text. Each entry preserves the structure's name, its appearance line (when relevant), and its named-connection break line (when applicable). The Inventory **persists past the final fade** — when the universe is gone and only the "I" lines remain, the Inventory is still there, returnable to indefinitely.

For a Threshold playthrough the Inventory holds ~40-60+ named structures; a Completion playthrough holds more (each completionist upgrade and synergy provider adds named structures along the way). Includes structures that were lost while the player was idle.

This is the only post-completion textual record in the entire game and is **canonical**. It serves four functions: rewarding endgame attainment with a *thing*; transforming the no-log rule from a limitation into a payoff (*you couldn't see what you'd lost, until now*); giving the second playthrough deeper texture (a player will recognize names from a previous universe); and providing the long-burn player a place to return to weeks or months after the universe has ended.

A small mercy. The only one in the game large enough to outlast the universe.

---

## 10. The Click — Verbs of Progression (locked)

The click button does not have a single verb. It has an arc:

| Tier | Click verb |
|---|---|
| 1–2 | **Pull** |
| 3–4 | **Bind** |
| 5–6 | **Consolidate** |
| 7–8 | **Hold** |
| 9–10 | **Reach** |

The verb on the button changes at each tier transition. The drift from acquisitive to preservational happens while the player isn't watching.

The player's tier 9 verb is *Reach.* The first named-connection break is *the Eridanus Reach.* Same word, two meanings — one act of contact, one act of severance.

Players who play long enough will eventually scroll back through the upgrade history and see the verbs together as a sentence: *Pull, Bind, Consolidate, Hold, Reach.*

---

## 11. Voice & Flavor Text

### Voice rules

- **First-person plural throughout, until the very end.** *We, us, our.*
- **Present tense, even for deep time.**
- **Numbers are weapons in Act 2, decorations in Act 1.**
- **Specific names whenever possible.** Real galaxies, real voids, real structures.
- **Sentences shorten as the game descends.**
- **No exclamation points. Ever.**
- **No second person.**
- **No metaphors that aren't physics.**
- **Real cosmological vocabulary only.**
- **The narrator confesses, never accuses.**

### Idle interjections — "filling the space between"

The narrator speaks not only at scheduled milestones but during quiet stretches. In Act 1, these are observations of wonder; in Act 2, where the most devastating lines land — because they arrive when the player isn't expecting an event.

Cadence is tied to the progression math with small random variance, so the rhythm naturally tracks the emotional curve. Interjections only appear when the player is currently in the game (browser visibility events plus a "recent input" heuristic).

### Authoring strategy

Write in this order:

1. **Tier-up lines** (~10) — the spine. Most polished. Write first.
2. **The peak line** (Local Group, the PEAK tier — Tier 6 under the 2026-05-13 11-tier ladder; was Tier 5) — polish indefinitely.
3. **The pivot — Eridanus Reach** — second most important line in the game.
4. **Through-line CMB lines** (~15–20) — write across the full arc together so the narrator's growing comprehension reads as a single thread.
5. **Named-connection breaks** (~30–50) — Act 2's heartbeat. Mood batches.
6. **Idle interjections** (~30–50) — connective tissue.
7. **Upgrade descriptions** (~30–50).
8. **Endgame** (~5–10).

The CMB through-line in particular should be drafted as a continuous body, then dispersed into placement, rather than written line-by-line in narrative position. Treating it as a single composition first preserves coherence; placement is a separate problem.

---

## 12. Tone & Atmosphere

### Visual

- **Act 1 ramp:** vibrant, dense cosmic backdrop — particles, drift, deep parallax, bloom-haloed stars.
- **The peak (Local Group transition):** maximum particles, maximum bloom, longest and most dramatic camera pull.
- **Act 2:** gradual desaturation, slower particle motion, the 3D scene begins splitting into distinct drifting regions.
- **Endgame:** mostly black; small bright pockets in their own areas; nothing connects.

### Audio chain

A pre-generated sequence of **~30–100 ambient tracks** from Suno, curated into an ordered chain matching the emotional curve: warm → fuller → grandest → first thinning → cold → silent.

Web Audio API crossfades between adjacent tracks over **~2 minutes**. Tone.js + Howler add reactive SFX on top.

---

## 13. Tech Stack (locked)

- **React 18 + TypeScript** for UI
- **Zustand** for state management
- **Tailwind** for styling
- **Three.js with WebGPU/TSL** for the 3D cosmic scene
- **Web Audio API** for the slow-crossfading ambient bed
- **Tone.js + Howler.js** for reactive SFX
- **Vite** as build tool and dev server
- **Static deployment** to Netlify or Cloudflare Pages
- **`localStorage`** for save state
- **Mobile-first responsive design**

### Domain & branding

- **darkfilaments.io** — primary
- **darkfilaments.com** — defensive
- **@darkfilaments** — claim on every relevant platform

### Mobile-first

Mobile is the primary form factor. Phone-in-pocket-checking-in-on-the-dying-universe is more on-theme than the desktop monitor experience.

### Visual architecture: the scale-tier swap

Discrete scale tiers, each with its own coordinate system, swapped via crossfade at tier transitions. Three.js's logarithmic depth buffer handles floating-point precision at extreme scales.

### Why not native engines

The Claude Code workflow is the deciding factor. Web stack means every piece of state lives in a text file Claude Code reads and edits.

---

## 14. Inspirations

- **Universal Paperclips** — structural template
- **A Dark Room** — slow reveal, atmosphere through restraint
- **Spaceplan** — short, cosmic, narrative-driven idle
- **Mountain** (David OReilly) — pure experience
- **Outer Wilds** — deepest mechanic as deepest theme
- **Kurzgesagt** — visual reference
- **Brian Eno's Ambient series** — particularly *Apollo: Atmospheres and Soundtracks*

---

## 15. Milestones

1. **Concept doc** — done, this file
2. **Project scaffold** — React + Vite + Three.js + Tailwind + Zustand + Web Audio + TypeScript boilerplate
3. **Numerical model in a spreadsheet** — simulate Act 1 progression curve, tier-up timing, descent acceleration
4. **CMB through-line workshop** — flesh out §6, draft the ~15–20 lines as a continuous body before placement
5. **Flavor text first batch** — tier-transition lines, the peak, the pivot, 10–15 idle interjections per act
6. **Act 1 prototype** — playable, ugly, complete first 3 tiers. Most important playtesting milestone.
7. **Scale-tier transition prototype**
8. **Audio bed prototype** — first 10 Suno tracks
9. **Hidden number + first reveal beat** — descent mechanic, Eridanus Reach line, label-fade-in
10. **Idle interjection system** — scheduled flavor lines during dead air
11. **Full Act 2 progression** — flavor completion, audio thinning, screen fragmentation
12. **Endgame** — final vigil, "I" reveal, save settling, new-universe flow, *The End* button decision
13. **Inventory implementation**
14. **Polish, additional audio, art pass, ship**

Solo timeline: 4–8 months of evening work to playable v1.

---

## 16. Risks

- **Act 1 has to be genuinely good and genuinely grand.**
- **The peak moment is high-stakes.** The Local Group tier transition is doing more work than any other single moment.
- **Reveal pacing.** Too early → just a sad game. Too late → players quit.
- **One shot per playtester.** Three or four naive testers is what you have.
- **Voice consistency at scale.** 100–150 lines is real authorial work.
- **The CMB through-line is unproven.** It's a strong idea on paper; whether it actually surfaces for players in practice depends entirely on placement and writing craft. Marked as needs-fleshing-out for a reason.
- **Idle interjection scheduling.** New system. Tuning required.
- **Scale-tier transition feel.** Hardest single piece of code.
- **Mobile fragmentation choreography.** Second-trickiest piece of code.
- **AI audio curation labor.** Real authorial work despite the AI assist.
- **Filament conflict.** A 2020 Steam puzzle game called *Filament* exists. Manageable but real.
- **WebGPU adoption.** Test the WebGL fallback path before committing to WebGPU-only effects.
- **Visual ambition vs. shader inexperience.** The visual direction (procedural realism) is the most technically demanding part of the project. Open-source galaxy/nebula shaders exist and Claude Code can carry much of the load, but aesthetic tuning will be the hobbyist team's most consequential skill investment.

---

## 16.5 Cosmological Time-Arc Per Tier (science-director grounding)

The narrator's voice is anchored in real cosmological time. Each tier corresponds to a real epoch of the universe's evolution:

| Tier | Scale | Cosmic epoch | Approximate time |
|---|---|---|---|
| T1 | Solar System | Stelliferous Era, present | Now |
| T2 | Stellar Neighborhood | Stelliferous, present | Now to near-future |
| T3 | Dwarf Spheroidal | Stelliferous, present (dark-matter-dominated relics) | Now (dSphs are the surviving fossils of mergers ~10⁹-10¹⁰ yr ago) |
| T4 | Galactic Arm | Stelliferous, present | Now to near-future |
| T5 | Galaxy | Stelliferous, present-to-medium-future | Now to ~10⁹-10¹⁰ yr |
| T6 | Local Group | Stelliferous, present-to-Andromeda-merger (THE PEAK) | ~4.5 Gyr (Andromeda merger) |
| T7 | Galactic Cluster | Stelliferous twilight | ~10¹¹ yr |
| T8 | Supercluster | Late Stelliferous; most non-LG galaxies past event horizon | ~10¹²-10¹³ yr |
| T9 | Filament | Stelliferous end / Degenerate begins | ~10¹⁴ yr |
| T10 | Cosmic Web | Degenerate Era (INVERSION) | ~10¹⁵-10⁴⁰ yr |
| T11 | Causal Horizon | Black Hole Era → Dark Era | ~10⁴⁰-10¹⁰⁰⁺ yr |

The narrator's late voice implies approach to heat death, not arrival. Heat death is asymptotic — "Goodnight" works because it is the narrator's act, not the universe's; the universe continues, infinitely slowly, after the screen fades. The CMB cools monotonically across the arc; by the final tier (T11 Causal Horizon) it is below detectability.

The "Causal Horizon" of the final tier refers specifically to the cosmological **event horizon** (what we can ever reach), not the particle horizon (what we've seen). In a Λ-dominated universe these diverge; the design specifically commits to event horizon as the player's true horizon.

The cosmological time-arc gains a presentation surface in the Inventory's curated spiral layout: T1 near screen center, T11 at periphery (visual-design.md §9 hybrid composition). The arc is encoded spatially (radial position by tier) and temporally (brightness-as-recency across the deep field of dim points).

---

## 17. Open Questions

A short list:

1. **The End button** — keep it (player chooses when to sever the last connection) or remove it (the universe ends on its own)? Both feel right; revisit during prototyping.
2. **Endgame fade duration.** 5–10 minutes is a guess. Tune in playtesting.
3. **CMB through-line placement strategy.** Scheduled, opportunistic, or hybrid? Workshop in milestone #4.
4. **CMB vocabulary discipline.** Need consistent shorter phrasings ("the first light," "the ancient warmth") that recur and accrete meaning.
5. **The Inventory's structural prominence.** Is the final-tier *Inventory* upgrade visible in the upgrade tree from the start (creating curiosity), or only revealed when the player reaches the final tier (preserving surprise)?

---

## 18. Idea captures *(NEW 2026-05-13 — CD T1-T3 holistic review closing pass)*

Creative-direction surfaces preserved for future workstreams. Each capture preserves the originating context — the CD's T1-T3 closing review (2026-05-13 evening) — so the workstream that picks one up can see where it came from. None of these are blocking T4 retune; each has a proposed timing window for when it becomes load-bearing.

### 18.1 "Mass counter rises faster than stats line" as a teachable pattern

The Subhalo upgrade prototypes a pattern that §9 commits to as a Dark Filaments signature: mechanical effects whose source is not luminous, not shown in the stats panel, and not represented in the 3D scene — only inferred from gravitational consequence on what is shown.

**Open creative question:** should the player's *first* encounter with this asymmetry have a one-time narrator beat? An idle interjection landing on the discrepancy without naming it — registering the surge without explaining the source. Not at T3 (would over-signpost; the design intent is for the asymmetry to be perceived quietly, not announced). Somewhere in T4-T5, after the player has lived with the pattern for a tier or two, a confession line could land — a moment where the narrator notices what the player has already half-noticed.

**Proposed workstream:** **CMB through-line workshop scope expansion candidate.** The CMB workshop is already the next major writing milestone after the design corpus settles (per §6 elevated-priority note). The "mass counter vs stats line" beat is a natural sibling to the CMB through-line's "we had not noticed when" register — both are instances of the narrator catching up to what was always there. Workshop scope could expand to include one or two of these inferred-channel beats alongside the ~15-20 CMB lines.

**Originating context:** CD T1-T3 holistic review 2026-05-13 evening, in the new-idea-surfaces section.

### 18.2 "We are doing this" register — sibling line for T5 Galaxy

Sagittarius Stream's T3 line carries the *"we are doing this"* register: *"A dwarf galaxy is being torn apart along our orbit. Its stars unspool into a stream that wraps us twice. We are doing this. The arm we are about to become is being made from the things we are eating."* The phrase commits the narrator (and the player, included in the "we") to an action that has consequence.

**The cadence intent:** one quiet shadow per tier through Act 1. T4 has *feed* (Active Nucleus, Fermi Bubbles); T3 has *we are doing this* (Sagittarius Stream). T5 — now renamed Galaxy under the 2026-05-13 11-tier renumber — currently has nothing in this register. Surface for the T5 redesign workstream: the tier wants a sibling line in the *we are doing this* / *feed* shadow register, voiced in keeping with T5's scale (~10¹¹-10¹² M☉, single massive galaxy).

**Proposed workstream:** **T5 Galaxy slate redesign** (queues after T4 retune; T5 numbers were declared stale under the 11-tier renumber and slate redesign is part of the renumber follow-through). Writer + creative-director pass during the slate-design step; one shadow line carried into one named one-shot.

**Originating context:** CD T1-T3 holistic review 2026-05-13 evening, in the new-idea-surfaces section.

### 18.3 Moderate engagement-profile creative-design surface

Sim-tuner's sweep interpretation reads ±15% drift detection as engaged-only — moderate, casual, and drift profiles render `n/a` in drift columns by design (the calibration target is the engaged profile; other profiles inform). The moderate profile (1× check-in/day at 15 min) has a structurally different felt experience from engaged: fewer Subhalo saves per tier, fewer narrator beats per calendar week, longer dark-matter-accumulation phases between visits, fewer named-connection-break encounters in Act 2.

**Open creative question:** after T5-T6 lands and the engaged profile's emotional curve is calibrated, does moderate read as *"the contemplative way to play"* (more space between events, more time with the patient universe, a slower vigil) — or as *"the impoverished way to play"* (the player feels they're missing things, the curve goes flat between visits)? Both are real possibilities. The answer depends on how Act 2's three content channels (named-connection breaks, baseline progress, CMB through-line) cluster in calendar time vs active session time.

**Proposed workstream:** **Capture as future creative-direction workstream after T5-T6 numerical calibration lands.** Pre-T6, this is speculative — the post-peak emotional shape isn't yet on the engine. Once it is, run a moderate-profile sweep and have creative-director read the per-calendar-week emotional trajectory. If "impoverished," tune CMB / narrator beat distribution. If "contemplative," surface as a recommended way to play.

**Originating context:** CD T1-T3 holistic review 2026-05-13 evening, in the new-idea-surfaces section.

### 18.4 Cosmological time-arc weight — Draco Dwarf / Inventory artifact

§16.5 places dwarf spheroidals as fossils of mergers ~10⁹-10¹⁰ yr ago. The current T3 tier-up line — *"We are inside something we cannot see. The stars we can count are the small part. The rest holds."* — correctly stays in the present-tense embedment register; it would over-spend the moment to gesture at temporal depth in the tier-up itself. Draco Dwarf's own flavor line gestures lightly toward the temporal weight — *"the name is old"* — without committing.

**The capture:** don't touch the locked line. The temporal weight that the live line correctly understates is exactly the kind of accreted meaning the **Inventory artifact** (final-tier reveal, persistent past the final fade, §9) is designed to hold. The Inventory presents named structures chronologically; Draco's entry there can carry the *"older than its visible parts; here when the merger ended; here when the merger that named it ended; here, still"* weight that the live encounter understates by design.

**Proposed workstream:** **Inventory artifact's eventual presentation pass.** Currently §9 commits to chronological scroll + appearance-line + break-line preservation; the presentation pass (when the artifact gets a designed surface) is the moment to decide whether each entry can also carry a short *time-since* or *epoch* annotation, and whether dSph entries specifically (Draco, Sculptor, Ursa Minor, Sextans) get the temporal-depth lift the live tier intentionally avoided. Queues after final-tier T11 design + Inventory UX scoping.

**Originating context:** CD T1-T3 holistic review 2026-05-13 evening, in the new-idea-surfaces section.

### 18.5 Dim points + Fork C as one design idea *(2026-05-14)*

The Causal Connections mystery number and the Inventory artifact are one composition presented in two parts, separated by the endgame fade.

**Live play.** One number ticks; the scene visibly changes in sync; each lost named structure leaves a dim point at its position. No second visible count — Fork C of the Causal Connections discussion locks one number plus synchronized visual changes at each named-connection break (the named structure dims; the dim point persists at its position).

**After the endgame fade.** The universe is gone, the "I" lines persist on pure black, the dim points bloom up on a separate render layer over ~10s. The framing banner — *"We name what we remember. Names are the smallest acts of holding."* — fades in once with the dim points. The scroll lives alongside as the reading surface (chronological, no filter, no search). **The universe at completion IS the artifact.** The mystery number's final near-zero value is implicitly the count of dim points the player can see — the same fact, two presentations.

**Pointer.** Canonical presentation surface for this composition is `visual-design.md` §9 (Inventory artifact — hybrid composition with dim points + scroll, brightness-as-recency, curated spiral layout, two-line anchored-to-loss tap reveal with survivor revision, implicit-by-default activation, persistence semantics, Fork C composition note).

**Originating context:** 2026-05-14 four-item UX workstream — Two-voice UI + Prose-first upgrade cards + Inventory hybrid + Fork C lock.

---

## Companion documents

- [`voice-samples.md`](voice-samples.md) — current draft of ~25 sample lines covering the full arc; reference for voice consistency
- [`visual-design.md`](visual-design.md) — stages, UI, flavor text presentation, click feedback curve, endgame fade
- [`gameplay-design.md`](gameplay-design.md) — complete upgrade tree across all ten tiers, ~50 upgrades

These four documents form the complete pre-production package.

---

*Next session candidates: the spreadsheet progression model, the project scaffold, the CMB through-line workshop, or the next batch of flavor lines.*
