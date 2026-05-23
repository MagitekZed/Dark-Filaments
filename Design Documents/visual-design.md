# Dark Filaments — Visual & UI Design

> The look, feel, and motion of the game. Stages, click reactivity, UI architecture, flavor text presentation, and the endgame visual landing.

This document covers what the player sees and how it moves. It is the companion to the [design notes](design-notes.md) and [voice samples](voice-samples.md) docs.

**Version 0.4 · Last updated 2026-05-22**

## Changelog

- **0.4 (current, rolling)** — *(In-version edit 2026-05-22, return-straight-in decision — game/ scaffold post-G7 phase: §6 gained an "Entry & welcome-back (return-straight-in)" subsection — a restored save lands straight in the game (the dignified, unannounced welcome-back; affirms the existing rule, not a revision), only a fresh start shows the title (ceremonial first-entry threshold), the title is reserved as a future on-demand Settings destination, and save-code load + a player-facing Start-over are rehomed to Settings; the rejected every-return title gate is recorded. §6 Settings & meta gained a one-line tie-in. The Settings modal + save-token UX remain deferred / out of v0.1 scaffold scope.)* Closing pass after 2026-05-14 UX workstream. §9 Inventory artifact subsection rewritten as the hybrid surface (dim points + scroll, brightness-as-recency, curated spiral layout, two-line anchored-to-loss tap reveal with survivor revision, implicit-by-default activation, persistence semantics, Fork C composition note). §7 gained the first-purchase flavor-line paragraph (sibling pattern to drift-and-fade ambient interjections). §6 added a one-line reference to the new Prose-first upgrade cards rule in CLAUDE.md. §11 example numbers refreshed from current data.js engine state. *(In-version edit 2026-05-21, renderer lock to WebGL2: §1 "GLSL/TSL shader work" → "GLSL shader work" — GLSL is the WebGL2 register. Renderer-agnostic phrases ("GPU-driven", "shader work degrades gracefully") left untouched; no design intent changed.)*
- **0.3** — 2026-05-14 peak-tier renumber pass. The 2026-05-13 ladder reshape moved the peak from T5 → T6 (Local Group), the filament tier from T8 → T9, and the final tier from T10 → T11; this doc had been written under the prior 10-tier ladder. All ordinal tier references rephrased using the renumber-proof pattern from CLAUDE.md (named-scene first, "the PEAK tier" / "the final tier" instead of bare tier numbers where appropriate; bare ordinals shifted to the new ladder where they remain useful). §1 anchor-visuals bullets, §2 color-language tier references, §3 dark-matter rule, §3 per-tier headings (T3 Galactic Arm → T4; T4 Galaxy → T5; T5 Local Group → T6 PEAK; T6 → T7; T7 → T8; T8 Filament → T9; T9 → T10; T10 Causal Horizon → T11; new T3 Dwarf Spheroidal stub entry added pending future design pass), §4 click-feedback-curve table rows, §5 click-verb tier ranges, §6 tier-transition camera reference, §7 line-types table peak-line label + surface-taxonomy table peak entry + Inventory artifact T10→final-tier + CMB through-line 10→11 tiers, §10 tier-reuse-strategy three anchors + variants, §11 PEAK-tier-inflection subhead + body (T1–T5 → T1–T6; T5→T6 → T6→T7; T6–T10 → T7–T11) + Active Nucleus T3 → T4 + Galactic Bulge T3 → T4 + Andromeda Bound T5 → T6 PEAK + T4→T5 camera pull → T5→T6 into the PEAK + T10 final-tier reference relaxed. §13 open-question Tier 4→5 camera-framing reference updated. **No design intent changed.** Anchor scenes locked to named structures (Galaxy, Local Group, Filament); only the ordinal labels and reach-of-rule phrasing renumber-proofed.
- **0.2** — Long-burn design philosophy lock 2026-05-11. §3 gained the named-one-shot-in-scene intent (CD-7): every one-shot upgrade with a real-cosmology name corresponds to a visible structure that appears in the scene on purchase and remains until a named-connection break removes it. §3 also gained the dark-matter rendering rule (SD-2): dark matter is rendered through gravitational signatures (lensing distortion, orbital velocities, gas pooling), not direct luminosity — the T4 Dark Matter Halo is the first implementation case. §7 (no-log) sharpened: the scene is the universe, not a log; structures disappearing on named-connection breaks are the loss itself, not a record of it; the Inventory is the only post-completion textual record and is canonical. §9 gained the Inventory presentation note: chronological scroll, persistent past the final fade, returnable indefinitely. §11 verified accurate under long-burn (expanding bar, asymptotic 40% entry ratio, T5 motion inflection all hold).
- **0.1** — Initial visual & UI design. §7 six-surface taxonomy + registers-collapse principle + CMB through-line register + click-accelerated fade-out (open design idea) added 2026-05-10. §11 "Consolidation bar — HUD philosophy" (expanding-progress-bar design) added 2026-05-11 with the consolidation rename pass (term "cohesion" retired in favor of "Consolidation").

---

## 1. Visual Direction (locked)

**Procedural realism, schematic where it serves clarity.**

The aesthetic is bright points on darkness. The screen is mostly empty. The bright things are crafted — particle systems, custom shaders, real-physics-inspired motion — and they look like a stylized telescope image. Not photoreal. Not flat. Somewhere closer to a scientifically-grounded fever dream of cosmology, where the structures look *correct* but slightly more beautiful than reality.

This direction is locked despite the implementation challenge: procedural visuals require GLSL shader work, and the team is new to shaders. The bet is that the cosmic-particle/nebula/starfield genre is one of the most well-trodden in WebGL — Three.js community examples, Shadertoy demos, fifteen years of open-source space scenes — and that Claude Code can carry most of the load. The path is well-lit even when the work is hard.

**Scope hedge: anchor visuals.** Rather than trying to make all eleven tiers equally polished, the project commits to **three "anchor" looks** that get disproportionate craft investment:

- **Galaxy tier (T5)** — the first true masterpiece moment
- **The PEAK tier (Local Group, T6)** — the peak, the most visually overwhelming moment in the game
- **Filament tier (T9)** — where the title's meaning lands and the descent visually accelerates

Other tiers reuse these anchor assets at different scales, with appropriate adjustments. The peak anchor (Local Group) absorbs the most polish budget of any single visual moment in the project.

---

## 2. Color Language

The cosmic palette is restricted on purpose. The full spectrum is reserved for the peak; the descent uses progressively less of it.

**Act 1 ramp:**
- Backgrounds: pure black, deepening to a faint indigo-violet at scale extremes
- Bright points: warm whites with golden undertones for stars; soft blues for younger stellar populations; deep red-pinks for nebulae and nurseries
- Bloom halos: warm, generous, large at small scales (a single sun fills a quarter of the screen with bloom in Tier 1)

**The PEAK tier (Local Group):** the full palette, all at once. Warm gold, cool blue, deep magenta, the works. The single brightest, most chromatic moment of the game.

**Act 2 descent:**
- Saturation drops slowly across tiers
- Warm tones leave first — by the Filament tier the palette is cool blue and white only
- By the Cosmic Web tier, only white-on-black remains
- Endgame: white and black. No color survives.

This is the *visual* expression of the audio chain shape. Sight thins on the same curve as sound.

---

## 3. Stage Visuals — Per Tier

What you see at each scale, and what it does when you tap.

### Named one-shots in the scene (CD-7, load-bearing)

Every one-shot upgrade with a real-cosmology name corresponds to a **visible structure that appears in the 3D scene on purchase** and remains until a named-connection break removes it. The scene is the universe assembling itself in Act 1 and unmaking itself in Act 2. The visual mechanic IS the emotional mechanic.

- **Stackables** contribute to aggregate scene density (more particles, more glow, more medium) but do not get individual markers — they are the universe's body, not its landmarks.
- **One-shots** get named, persistent visual presence. Buying Sagittarius A* places Sagittarius A* in the scene; buying Galactic Bulge grows the bulge tier-by-tier as the upgrade levels up; buying Andromeda Bound (PEAK tier — Local Group, T6) places the Andromeda Galaxy beside the player's own.
- **Tiered consolidation upgrades** (Galactic Bulge T4, plus reserved tiered devices in the post-PEAK descent) visibly grow per level. Each level of Galactic Bulge thickens the central bulge in the scene; the seven physical-arc flavor lines correspond to seven visual states.
- **Named-connection breaks** remove the visual structure from the scene at the moment the break lands. The gap remains visible (see §7's anchored-to-loss register).

Concrete designer specs (asset list, fade-in timing, position-in-scene logic, break-removal animation) are **deferred** until the React/Three.js scaffold begins. What's locked here is the design intent: scene is universe, not log.

### Dark matter — inferred, not rendered (SD-2, load-bearing)

Dark matter is gravitationally important but not luminous. **Any visual representation must work through gravitational signatures** — lensing distortion, orbital velocities, gas pooling — rather than direct luminosity. We infer its presence from what flows along it.

The **Galaxy-tier (T5) Dark Matter Halo** is the first implementation case. When Dark Matter Halo is purchased, the visual response is not a brightening — it is a **subtle distortion of light from background galaxies**, a faint warping near the disk's edge that suggests mass without showing it, and the orbital velocities of outer-disk material visibly stabilizing at distances where Keplerian physics would slow them. The disk holds together more visibly. The halo itself is never drawn.

This rule extends to all dark-matter-related upgrades in the PEAK tier and beyond (when they appear in the redesigned post-PEAK tier slates).

### Tier 1 — Solar System
**Scene:** A bright central star, generous bloom. A few planets in real elliptical orbits, slow. A field of asteroids and dust visible as fine particles drifting toward the center.

**Tap reactivity:** Tap creates a small bright pulse at the contact point. Nearby asteroids and dust visibly *jerk* toward the center. Planets shift slightly closer to the star. Reactive and personal — you can see exactly what your tap did.

### Tier 2 — Stellar Neighborhood
**Scene:** Your star is now a single bright point with bloom halo, off-center. Several other stars hang nearby in 3D space. A faint gas medium connects them — interstellar dust as a translucent shader-driven volume.

**Tap reactivity:** Tap creates a gravitational ripple visible in the gas medium — a subtle distortion radiating outward. Nearby stars shimmer and edge fractionally toward the central group.

### Tier 3 — Dwarf Spheroidal
*Scene + tap reactivity specs deferred.* The Dwarf Spheroidal tier was inserted into the ladder on 2026-05-13; its scene treatment has not yet been authored. Design intent (to be drafted in a future pass): a sparse, diffuse stellar population embedded in a dark-matter halo that is visually *inferred, not rendered* (per the SD-2 rule above) — the player sees the bound stars and infers the mass that holds them. The first patient-universe-return tier; the scene should reward returning calmly to find the structure quietly there.

### Tier 4 — Galactic Arm
**Scene:** A long curved arm of stars, the camera positioned along its length. Dust lanes run through it. Star formation regions glow pink. The arm has visible structure — denser regions, gaps, curving.

**Tap reactivity:** Tap energizes the arm. Stars along it brighten in a wave traveling outward from the tap point. The arm's curve subtly tightens.

### Tier 5 — Galaxy *(anchor visual)*
**Scene:** A full procedural spiral galaxy — particles forming the disk, custom shader for the central bulge bloom, dust lanes as darker bands. The galaxy slowly rotates. Hundreds of thousands of particles, GPU-driven.

This is the first visual moment that should make players *stop and look*. They've been playing in galactic-arm scale; suddenly they're outside an entire galaxy. The scale shift is the experience.

**Tap reactivity:** Tap triggers a wave of brightening that travels through the disk. Stars shimmer along the wave. The whole galaxy rotates one degree. Outer-arm material visibly drifts inward.

### Tier 6 — Local Group *(THE PEAK — anchor visual, top polish budget)*
**Scene:** Andromeda and the Milky Way and Triangulum, plus dozens of smaller galaxies, suspended in 3D space. The camera can see them all at once. Each one is a real procedural galaxy at this scale, but smaller than at the Galaxy tier. Filaments of intergalactic medium connect them — faint shader-driven volumetric light.

The peak palette: full chromatic range, maximum bloom, maximum particle counts the device can handle.

**Tier transition:** when the player advances *into* this tier, the camera does the longest, most dramatic pull-out of the entire game. The Galaxy-tier galaxy they were managing becomes one of the bright points in this new scene. The transition takes ~2 seconds. Audio swells to its peak track. The peak flavor line fades in.

**Tap reactivity:** Entire galaxies drift slightly toward each other on each tap. The reaction is *scale-changing*. This is the tier where every tap feels enormous. The intergalactic filaments pulse with light.

### Tier 7 — Galactic Cluster
**Scene:** A thousand galaxies as bright points, organized in a roughly spherical halo. Larger structures still visible as resolved spirals near the camera; distant ones reduce to bloom-haloed points. The intergalactic medium is more visible here — wisps of shader volume between groups.

**Tap reactivity:** Pull rate is high — the cluster's center grows brighter on each tap. But the *visible* movement is smaller relative to scale. The first hint of diminishing physical feedback.

### Tier 8 — Supercluster
**Scene:** Laniakea-scale structure. Galaxies as points, organized along visible filaments stretching across the field. The cosmic web is now visible. The spaces between filaments are large — large enough that the camera can see emptiness.

**Visual descent begins:** saturation has dropped slightly. Warm tones are beginning to leave.

**Tap reactivity:** Filaments brighten along their length on each tap. Galaxies migrate toward filament intersections. The motion is grand but *slower*.

### Tier 9 — Filament *(anchor visual — title resonance)*
**Scene:** The camera is looking down the length of a single cosmic filament — hundreds of millions of light-years long, depicted as a glowing thread of galaxies and intergalactic medium against vast empty regions. The filament itself is the protagonist of this scene.

This is where the title clicks open. The player is *inside* a dark filament — they *are* a dark filament. The scene depicts them.

**Tap reactivity:** The filament pulses along its length with each tap. Galaxies along the thread shimmer. But the visible motion is small — the universe has thinned to the point where the filament can no longer pull material from outside itself. There is no outside left.

### Tier 10 — Cosmic Web
**Scene:** Multiple filaments visible, intersecting at nodes. Most of the screen is empty. The web is more *gaps* than threads now. Color is mostly gone — white and cool blue only.

**Tap reactivity:** Filaments stretch and *don't quite reach*. The visual feedback is *resistance* — taps produce strain, not motion. The universe can no longer be drawn together. Same input, smaller response.

### Tier 11 — Causal Horizon
**Scene:** Most of the screen is black. Small isolated bright pockets — galaxies, groups — float in their own areas, each with a faint glow halo, none touching. The fragmentation is visible.

**Tap reactivity:** Taps produce almost nothing. A faint pulse at the contact point that doesn't propagate. The screen is mostly listening, not doing.

---

## 4. The Click Feedback Curve

The physical satisfaction of tapping diminishes across the descent. This is its own descent system, parallel to the audio thinning and the narrator's quieting.

| Tier | Tap response | Feel |
|---|---|---|
| 1–3 | Strong, local, personal | thumb has weight |
| 4–5 | Bigger, more diffuse | thumb is moving a galaxy |
| 6 (PEAK) | Scale-changing | thumb is moving the universe |
| 7–8 | Grand but slower | first hint of resistance |
| 9 | Pulses along filament length, small motion | something is wrong |
| 10 | Strain, not motion | the universe is not responding |
| 11 | Almost nothing | thumb has lost its weight |

The game never says this is happening. The player just feels it.

---

## 5. The Click Verb at the Tap Point

**The current click verb appears at the tap location each time you tap, then fades.**

- Tier 1–3: the word *Pull* fades up at the contact point, drifts upward by ~20px, fades out over ~600ms
- Tier 4–5: the word *Bind*
- Tier 6–7: the word *Consolidate*
- Tier 8–9: the word *Hold*
- Tier 10–11: the word *Reach*

The verb is small (~12pt), serif, white with the same dark glow used for flavor text (see §7). It does not announce itself. It is just *there*, where the player's finger is.

The verb's appearance at the post-Eridanus-pivot transition is its own quiet moment — the first time *Hold* appears under your finger, the player may pause. That pause is the descent introducing itself.

There is no other UI label for the verb. The button does not exist. The play area is the click target.

---

## 6. UI Architecture

### The play area
The 3D scene fills the entire screen at all times. There is no fixed "play area" with borders. The cosmos is the interface.

### Persistent UI elements
A small, low-weight set of elements overlaying the cosmos:

- **Mass counter** — top-left, small serif numeral with current value. No label. The player figures out what it is from context. Updates with subtle particle-pulse on increase.
- **Consolidation counter** — beside Mass when it exists. Slightly different typographic weight to distinguish. Same no-label treatment. (See §11 for the expanding-progress-bar that lives alongside this counter and visualizes consolidation toward each tier transition.)
- **The hidden number** — opposite corner from the resource counters. Bottom-right or top-right. Small. Never labeled until the reveal moment, when *Causal Connections* fades in beside it.
- **Upgrades icon** — single small icon, bottom edge or corner. Low visual weight. Tappable to expand the upgrade menu. Persistent gesture: swipe-up from bottom edge also opens the menu (mobile-native pattern).

That's the entire persistent UI. Five elements. No HUD. No status bars. No notifications.

### Upgrade menu (popup/popdown)
Bottom sheet pattern. Drag up from the bottom edge or tap the upgrades icon. The sheet slides up over the bottom ~60% of the screen. The play area remains visible above it — the player can still see what their gravity is doing while shopping.

Sheet contents:
- Available upgrades, named with real cosmological terminology (*Orbital Resonance*, *Tidal Streams*, *Gravitational Lensing*)
- Each upgrade shows: name, brief description (one line, in narrator voice), cost, current level
- Tap an upgrade to purchase. No confirmation dialog — speed of interaction matters in idle games
- Drag the sheet down or tap outside to dismiss

Card surface composition is governed by the **Upgrade cards are prose-first** load-bearing rule in CLAUDE.md (four content fields only: name, clinical one-line description, cost, level; affordability-glow carve-out applies; author-curated order; max-level cards show "Maxed" or "Owned" until tier transition).

The game does not pause when the menu is open. Passive accumulation continues. Time still passes. The universe doesn't pause for shopping. Pausing would be the universe granting a mercy it doesn't grant.

### Tier transition
Not a UI screen. A 3D camera pull-out (~2 seconds). The play area transforms continuously. Audio crossfades to the next track. The peak flavor line fades in *during* the camera move, not after.

The Galaxy → Local Group transition (T5→T6, the PEAK) is given the longest and most dramatic camera move in the game.

### Entry & welcome-back (return-straight-in)

The title screen is a **ceremonial first-entry threshold, not a return gate.** Entry behavior splits on the boot decision:

- **Returning player** (a valid save was restored on boot) lands **straight in the game.** No menu, no gate, no "Continue" button. The counter just reads what it reads. This is the *dignified, unannounced* welcome-back (load-bearing rule: *"Welcome-back locked: dignified, unannounced"*) — the patient universe was always running; the player simply re-enters it. (Decided 2026-05-22; **affirms** the existing rule, not a revision.)
- **Fresh start** (no valid save) shows the title — the ceremonial first-entry threshold, with *Begin a new universe* and *Return* (load a save code).

The **rejected alternative** was a title-screen gate on every return (Continue / Start-Over, plus a save-code submenu). It was rejected because it breaks the dignified/unannounced welcome-back and the patient-universe continuity illusion, and because surfacing "Start Over" on every return invites a runs/roguelike framing alien to the one-way entropy meditation.

The title is reserved as a **future on-demand destination** — reachable from the Settings modal, rendering the live tier behind it — rather than a screen the player must pass through. Save-code load and a player-facing Start-over are **rehomed to Settings.** The Settings modal and the save-token UX are deferred and out of v0.1 scaffold scope; this records the plan, not a built surface.

### Settings & meta
A single small icon in a corner — gear or similar — opens a modal for audio levels, particle quality (auto-detected but tunable), saved-universes list, restart confirmation, and credits. Standard idle-game settings UX. Visually present but unobtrusive. Settings is also the home for the **on-demand title destination, save-code load, and a player-facing Start-over** (see *Entry & welcome-back* above) — all deferred, recorded as plan; the modal is currently a stub in the v0.1 scaffold.

### What is *not* in the UI
- No achievement notifications
- No "new upgrade available!" popups
- No tutorial overlays after the very first session
- No daily/login-streak rewards
- No notification badges
- No tooltips
- No onboarding walkthrough beyond the first 60 seconds

The game trusts the player to find things. It does not nag.

---

## 7. Flavor Text Presentation (the most important visual system)

The flavor text is the narrator's voice rendered as light in the dark. It is not UI. It is part of the cosmos.

### Typography
- **Serif** — humanist, slightly imperfect. Candidates: *Cormorant Garamond*, *EB Garamond*, *Crimson Pro*. The serif gives the words *weight* — the narrator is a witness, and witnesses use letterforms with history.
- **Pure white** (#FFFFFF) — the same color as the brightest stars. The text is part of the cosmic light.
- **Variable size** by line type (see §7.4 below)
- **Generous letter-spacing** — the narrator does not crowd their words

### Readability over the cosmic field
Not a stroke. Not a shadow box. **A subtle dark radial glow** beneath the text — inverted bloom. The text *displaces light* around itself, the way a gravitational lens does. This keeps the text readable against bright stars without ever looking like UI.

The radial glow extends ~1.5x the height of the letterforms in soft black falloff. The effect is barely visible against pure black space; it asserts itself only when the text overlaps a bright region.

### Variable fade-in patterns

This is the system that makes the text feel *authored* rather than *delivered*. Every line uses one of several fade-in patterns, varied by line type and (for idle interjections) randomized:

- **Left-to-right** — letters fade in sequentially, ~30ms apart. Like a wave passing through.
- **Top-to-bottom** — for multi-line text, lines fade in from top down. Like settling.
- **Inside-out** — text fades in from the center outward. Like coalescence.
- **Patchy** — letters fade in in a randomized order, like matter clumping.
- **All-at-once** — for the Eridanus Reach pivot only. The line *appears*, fully formed. The narrator interrupting themselves.

The pattern variation is gravitational in feel: each pattern echoes a physical process the universe of the game is doing. The text writes itself the way the universe assembles itself.

**Hold time** is long. Long enough to read twice. Players will want to.

**Fade-out** is slower than fade-in. 4–6 seconds for milestone lines. 2–3 for idle interjections. The text doesn't snap away; it *dissolves*, the same way the structures it describes dissolve.

### Line types and presentation

| Line type | Position | Size | Fade-in | Hold | Fade-out |
|---|---|---|---|---|---|
| **Tier-up flavor** | Center, slightly above midline | Large (24–28pt) | Inside-out or top-to-bottom | 8–10s | 5s |
| **Peak line (PEAK tier — Local Group)** | Center | Largest in the game (32pt) | Inside-out, slow (~4s) | 12s | 6s |
| **Eridanus Reach pivot** | Center | Large (28pt) | All-at-once | 12s | 6s |
| **Named-connection break** | Positioned at the location of the broken structure | Medium (18–22pt) | Left-to-right or patchy | 8s | 4s |
| **Idle interjection** | Off-center, peripheral, randomized | Small (14–16pt) | Random pattern, slow | 6–8s | 3s |
| **Endgame singular voice** | Center | Medium-large (24pt) | Inside-out, very slow | Persistent (see §9) | Does not fade |

### Named-connection breaks — text occupies the loss

When a named connection breaks, the flavor text appears *in the area where the now-lost structure used to be visible.* The text doesn't just announce the loss; it occupies the space the loss left behind. Then it fades — and that area of space remains empty.

This is one of the most important small touches in the entire game. It is the difference between *being told something is gone* and *seeing the gap where it was*.

### No log, no history (CD-4, load-bearing)

Flavor text fades and is not stored. There is no scrollback. Lines the player misses are gone. Some players will hate this. But it is the only behavior consistent with the game's theme — connections lost cannot be recovered. A scrollback log of past flavor text would be a *causal record* of things that have left, and the game cannot have that.

**The scene is the universe — it is not a log.** Structures disappearing on named-connection breaks are the loss itself, not a record of it. The 3D scene is exempt from "no-log" for the same reason a real universe is: things visibly appear and visibly leave; the universe doesn't keep notes on what it used to contain.

Known exceptions:
- The endgame "I" lines persist forever (see §9).
- The **Inventory artifact** (final-tier reveal): a chronological scroll of every named structure the game has mentioned, with their break-lines preserved. The Inventory persists past the final fade and is returnable to indefinitely. **It is the only post-completion textual record in the entire game and is canonical.** (See §9 below.)
- **Named one-shot structures in the 3D scene on purchase** (per §3 above): the scene is universe, not log.

### Surface taxonomy (canonical)

All flavor text in the game lives on one of six surfaces. Each surface gets exactly one of four registers. The line-type table above (§7.4) specifies sizes and timings for each line; the taxonomy below organizes those line types into registers, so the *physical behavior* of text is consistent across the game.

| Surface | Register | Behavior |
|---|---|---|
| Upgrade card prose | Inline-persistent | Lives in the upgrade menu while open; fades when dismissed. Not rendered in the void. *Specs TBD.* |
| Tier-up flavor lines | Centered-and-paused | Long hold, slow fade, no drift. (Per §7.4: 8–10s hold, 5s fade.) |
| PEAK-tier line (Local Group, specifically) | Centered-and-paused (max) | Largest size, longest hold, slowest fade. Time-stopping treatment. (Per §7.4: 32pt, 12s hold, 6s fade.) |
| Ambient narrator interjections | Drift-and-fade | Off-center, peripheral, gentle vertical drift toward the cosmic background as the line fades. **The only surface that drifts.** (Per §7.4: 14–16pt, 6–8s hold, 3s fade.) |
| Named-connection breaks | Anchored-to-loss-and-fade | Text appears at the location of the lost structure, holds, fades in place. The gap remains visible. (Per §7.4: 18–22pt, 8s hold, 4s fade.) |
| Eridanus Reach pivot | Anchored-to-loss-and-fade (centered) | Same register, centered because this is the systemic break. (Per §7.4: 28pt, all-at-once fade-in, 12s hold, 6s fade.) |
| Endgame "I" lines + Inventory reveal | No fade, ever | Persistent. The universe fades around them. (Per §9.) |

### First-purchase flavor lines

Existing narrator-voice flavor text authored for each upgrade fires as a one-time ephemeral fade-in on the player's first purchase of that upgrade, in the drift-and-fade register (off-center, peripheral, 14-16pt, 6-8s hold, 3s fade). The line fires once per upgrade per game; repurchases of stackables (including additional levels of max-N completionists) do not fire it. Event-driven, not cadence-scheduled — the engine queue/dedups against idle interjection scheduling so the two surfaces never overlap. Sibling pattern to ambient interjections (same register, different trigger). Honors the Two-voice UI rule (narrator on a fading surface only) and CD-7 (each named purchase gets its own narrator moment).

### Editorial principle — registers collapse with the curve

All flavor text is ephemeral (per the no-log rule), but ephemerality has registers. Drift-and-fade is reserved for ambient interjections — applying drift universally would flatten the emotional curve by giving routine and load-bearing lines the same physical behavior. The descent of the curve is partly carried by registers progressively collapsing: Act 1 holds the full range (drift, hold, anchor); Act 2 sheds variety; the endgame is one register — text that no longer fades.

### CMB through-line register

~15–20 lines spread across all 11 tiers. Same drift-and-fade behavior as ambient interjections (intentionally indistinguishable from ordinary ambient text on first encounter), with one near-invisible signature: **all-at-once fade-in** (no progressive reveal). This rhymes with the Eridanus Reach pivot's fade-in pattern, so the pivot lands as a callback to a hum the player has been near the whole game without quite noticing. The lines self-identify by content (*hum, oldest light, everywhere*), not by visual register.

### Open design ideas

> **Click-accelerated fade-out.** Active clicking subtly accelerates the fade-out rate of any flavor text currently on screen. Thematically: the active player accelerates the dissolution; the clicker's own engagement makes the text vanish faster. Rate not yet specified — likely small per-click increment (~0.1% range or similar). Mark for prototyping; not committed.

---

## 8. Idle Interjection Scheduling

Cadence is tied to the progression math with small random variance, so the rhythm naturally tracks the emotional curve without separately authoring it.

**Rough targets:**
- Act 1 (wonder): one interjection every 60–180 seconds during active play
- Mid-Act 2 (grief): every 90–240 seconds
- Late Act 2 (exhaustion): every 180–360 seconds — sparser, heavier
- Endgame: very rare, near-silence

**Active-detection requirement:** interjections only appear when the player is currently in the game. Browser visibility events (`document.visibilitychange`) plus a "recent input" heuristic (last tap or upgrade purchase within ~2 minutes) gate the system. If the player is not present, the line is held until they return.

**A hidden mercy:** if the player has been away for a long time and returns to a universe that has lost many connections in their absence, the next idle interjection is one of the *quieter* lines. The narrator does not greet a returning player with the worst news. The narrator waits.

---

## 9. The Endgame Visual Landing

This is the single most important moment in the entire visual design, and it inverts every rule the game has established.

Throughout the game, **the universe has been (apparently) permanent and the text has been ephemeral.** Stars persist. Galaxies persist. Filaments persist. The text fades.

At the endgame, this relationship swaps.

### Sequence

1. The last named connection breaks. The standard breaking-text appears, fades.
2. Brief pause — perhaps 30 seconds of true silence. No narrator. No music. The fragmented universe holds its breath.
3. The narrator speaks for the last time, in singular voice. The text fades in extremely slowly — inside-out, over ~6 seconds:

   > *I remain.*
   > *I do not know for whom I am still recording this.*
   > *If you are reading these words, then somewhere, against everything, a connection has held.*
   > *Goodnight.*

4. Once the text is fully visible, **the universe begins to fade.** Not the text — the universe. The remaining bright pockets dim slowly. Stars in the small isolated frames go dark. The bloom halos shrink and fade. Particles thin to nothing.

5. The fade is **very long.** Five to ten minutes of real time. The player can watch every star they have left blink out. They can also walk away and come back later; the text and a mostly-dark screen will be waiting.

6. When the universe has fully faded, the only thing remaining on screen is **the text**. White serif against pure black. No stars. No bloom. No particles. Just the words.

7. The text **never fades.** It stays. The save remains. The player closes the tab when they are ready.

### What this does

- The relationship between matter and meaning swaps. The words outlast the stars.
- The universe goes quietly — not malicious, not violent. It just turns its lights off.
- The player has nothing to *do* during the fade. They watch. This is the vigil the game has been preparing them for since the first idle interjection.
- The "Goodnight" of the narrator is the universe's actual goodnight. Soft. Final. Not a verdict — a benediction.

This is the only persistent text in the entire game. The single exception to the no-log rule. A mercy. The universe takes everything else; it leaves the words.

### The Inventory artifact (post-completion presentation — hybrid)

After the endgame fade settles, the **Inventory** becomes available — the only player-facing surface that survives the universe. It is **a hybrid composition**: dim points are the visual signature (atmosphere); a quiet scrollable text list lives alongside as the reading surface. Both surfaces exist; neither replaces the other.

- **Dim points.** Persist permanently at the 3D scene positions where the lost named structures used to be. ~50-70 dim points total across the full game (rough estimate; exact count depends on final upgrade slate counts T4-T11).
- **Curated spiral layout.** The cosmological time-arc is encoded spatially: T1 near screen center (oldest), T11 at periphery (newest). Constraint: structures that already appeared in scene at purchase keep their original positions — the spiral is authored to accommodate them, not override them. (x,y,z) tuples are static authoring data (~50-70 tuples; trivial save-file footprint).
- **Brightness-as-recency.** Dim points are not equally dim. Recent losses (last session, last ~10 broken) are less dim. Older losses fade further into the deep field. The eye picks out the most recent layer first; the deep field is there but does not compete. Solves the mobile tap-target problem and decorates the artifact with the cosmological time-arc temporally as well as spatially.
- **Two-line anchored-to-loss register on tap.** Break-line first, left-to-right fade-in per §7.4's anchored-to-loss specs (18-22pt, 8s hold, 4s fade) at the dim point's location. Appearance-line second, starts fading in as the break-line begins to fade out, 14-16pt stacked below. Both lines are in the anchored-to-loss register; the size hierarchy distinguishes them as moments, not as voices. Both are quoted narrator on a persistent surface (carved out under the Two-voice UI rule's Inventory exception). **Survivor revision:** one-shots that lasted to endgame (no break-line preserved) get their appearance-line at the full break-line size (18-22pt), alone. Solitude reads as quiet, not diminishment.
- **Implicit-by-default activation.** No glyph, no "enter Inventory mode" button. After the universe fade completes and the "I" lines persist on pure black, the dim points bloom up to dim visibility over ~10s (inside-out fade-in, matching endgame text register). The framing banner — *"We name what we remember. Names are the smallest acts of holding."* — fades in once with the dim points, holds 15-20s, fades out with the same long curve as the universe. After that, the screen is silent. Tapping a dim point activates its two-line reveal. The screen IS the Inventory. There is no separate mode.
- **Scroll surface.** A quiet scrollable text list lives alongside the dim points. Chronological, no filter, no search, no sort beyond chronological. Banner line at top (same line as above; appears once per Inventory entry). Each scroll entry: structure name (clinical), preserved break-line (anchored-to-loss register, quoted narrator), preserved appearance-line if available. The scroll is accessible via a small gesture/icon (specs deferred to scaffold time).
- **Pinch-to-zoom** on the dim-points field is available as a standard mobile gesture for the spatially curious, but not load-bearing — the recent-layer-plus-scroll covers the navigation case without it.
- **Persistence semantics.** The dim points are a separate render layer that is invisible during the 5-10 minute universe fade. After the universe has fully faded and only the "I" lines persist on pure black, the dim points bloom up to dim visibility over ~10s. From that moment forward they persist indefinitely. The framing line appears only on the player's first-ever entry; from the second entry on, the dim points alone are the surface (the scroll's banner repeats the line at the top of the scroll, which is allowed because the scroll is structured text rather than ambient atmosphere).
- **Composition with the single mystery number (Fork C).** One number, synchronized visual changes. During live play: each named-connection break ticks the big number down, dims the structure in the scene, and leaves a dim point at its position. After the endgame fade: the dim points remain. **The universe at completion IS the artifact.** The mystery number's final value at zero or near-zero is implicitly the count of dim points the player can see — the same fact, two presentations, separated by the endgame fade.
- **Returnable indefinitely.** The player can open and close the Inventory as often as they want, weeks or months after the universe ended. The save persists. This is part of the long-burn shape — the artifact outlasts the play.

Concrete designer specs (spiral coordinate authoring, brightness-as-recency curve values, pinch-to-zoom thresholds, mobile tap-target sizing, scroll-surface visual layout, icon design where applicable) are deferred until the React/Three.js scaffold begins.

---

## 10. Tier-Reuse Strategy

Not every tier gets bespoke art. The three anchors (Galaxy T5, Local Group T6 PEAK, Filament T9) absorb the major shader and particle craft. Other tiers are constructed from those building blocks:

- **Tier 1–4** can share a "small-scale solar/stellar/sub-galactic" visual system, with parameters tuned per tier (number of bodies, distance, dust density). The Dwarf Spheroidal tier (T3) adds the inferred-dark-matter signature treatment introduced in §3.
- **Tier 7–8** are variants of the PEAK anchor at different scales — galaxies-as-points distributed in increasingly large volumes, with progressively larger empty space.
- **Tier 10–11** are variants of the Filament anchor — first with multiple filaments visible, then with mostly empty space and isolated pockets.

This is the pragmatic version of "every tier is its own masterpiece." The player feels coherence across tiers because the visual systems share DNA. The PEAK tier (Local Group) is the only tier that gets unique, top-budget treatment; everything else inherits.

---

## 11. Consolidation bar — HUD philosophy

The Consolidation counter (introduced in §6 alongside the Mass counter) is accompanied by a single expanding-progress-bar that visualizes accumulated consolidation across all tiers. This section is the canonical reference for what the bar *is* and what it *does*. Designer motion specs are deferred until the React/Three.js game prototype begins; what's locked here is the design intent.

### Core concept

A single horizontal progress bar sits in the HUD alongside the Mass and Consolidation counters (top-left, low visual weight, integrated typography). The bar **never resets**.

At each tier transition, the filled portion compresses leftward and the bar extends rightward, ending at the new tier's entry fill ratio.

Math of the asymptote (from current engine state — `DEFAULT_PARAMS.consolidationThreshold: 1.0`, `consolidationGrowth: 2.50` in `Prototype/src/sim/data.js`):

- T1 entry: 0 / 1.0 (empty bar at the start of the game; T1→T2 gate is 1.0)
- T2 entry: 1.0 / 3.5 (~29%) — bar extends by T2→T3 gate (2.5); cumulative = 1.0 + 2.5
- T3 entry: 3.5 / 9.75 (~36%) — bar extends by T3→T4 gate (6.25); cumulative = 3.5 + 6.25
- T4 entry: 9.75 / 25.375 (~38%) — bar extends by T4→T5 gate (15.625); cumulative = 9.75 + 15.625 *(T4 retune is locked 2026-05-14; T5+ retunes still in queue)*
- **Asymptotes to ~40% from T3 onward** (= 1 / consolidationGrowth = 1 / 2.5)

The bar shows one continuous fill. **No segment dividers.** T1's segment shrinking to a vanishingly small fraction of bar width at the final tier is correct: the early universe IS small compared to what came after, but it's still there in the fill.

**Log-scale rejected.** A logarithmic axis would normalize each tier's segment to comparable visual width and would remove the physical sensation of expansion that is the whole point of the bar.

### Tier-up motion beat

The compress-and-extend at a tier transition is *one* motion, owned by the tier-up beat. Sequence:

1. Bar hits 100% on the consolidation-bearing transition purchase (Active Nucleus at T4, etc.).
2. Tier-up flavor line fades in centered (per §7.4's centered-and-paused register; 8–10s hold).
3. The bar extends and refills to its new entry ratio **during** the flavor line's hold — not after.
4. Camera pull-out (the long pull at T5→T6 into the PEAK, etc.) happens simultaneously.

The scene grows, the bar grows, the narrator speaks — one breath.

### PEAK-tier inflection (the key refinement)

Through T1–T6, the motion is crisp and triumphant: clean compress, clean extend, the bar's growth amplifies the player's accomplishment.

At the PEAK → post-PEAK transition (T6→T7), the same compress-and-extend motion **visibly hesitates**. The same vocabulary, slowed and chilled. New empty space comes in cooler.

The motion itself signals descent. Nothing on the bar says "the universe is dying"; the motion does. This rhymes with the registers-collapse principle in §7 — Act 1 holds the full motion vocabulary, Act 2 progressively drains it of energy.

### Through T7–T11 (descent)

The bar continues to extend and fill. The player keeps achieving — consolidation thresholds still get met, transitions still fire.

- Fill color cools toward white-on-black like everything else (§2's palette curve).
- Motion speed and energy continue to drop through each subsequent transition.
- The bar's *innocence* — it doesn't editorialize, doesn't accuse — is part of the game's voice. The system doesn't accuse; the player concludes.

### Endgame composition with §9

The bar fades with the universe, not with the text. By the time only the "I" lines ("*I remain.*" / "*Goodnight.*") persist, the bar is gone. The bar is part of the cosmos, not part of the text.

### Edge cases (explicit, for future implementer)

- **Eridanus Reach pivot.** Nothing special on the bar. The pivot is a narrator moment; the bar is structural. The hidden number (§4 of design notes) is what carries the reveal.
- **Galactic Bulge and other tiered consolidation upgrades.** Each level adds a small visible tick of fill to the bar — no special accommodation needed. The same compress-and-extend vocabulary handles partial-level fills.
- **Threshold vs. Completion paths.** Identical bar. Both paths fill to 100%; they just take different times to get there. The bar does not branch.
- **Tier transitions.** The compress-and-extend motion is one motion, owned by the tier-up beat above. No separate "tier-cleared" animation.

### Why this visualization (the design principle)

The bar inherits the game's signature trick: the *same artifact* reads differently in Act 1 than Act 2 because the *player* has changed, not the artifact.

It makes the carry-over rule legible without ever explaining it. The player sees their T1 fill carried across as a permanent floor; they don't need to be told "stats persist between tiers."

It is the only design surface where the visual is *naive* — it doesn't know it's also describing entropy. The bar's innocence is what makes it work.

---

## 12. Mobile Considerations

- **Portrait orientation primary.** Visual compositions framed for a vertical aspect ratio. The cosmic field uses the full vertical space; UI lives in unobtrusive corners and a bottom sheet.
- **Particle counts auto-tune** based on detected device performance. The shader work degrades gracefully — quality drops, presence remains.
- **Touch targets** for the upgrade icon are generous (44px minimum). Swipe-up from bottom edge for upgrade sheet is the primary mobile gesture.
- **Act 2 fragmentation on portrait** uses 3–6 visible fragments at a time. Additional fragments are accessed via swipe-pan (the player can drag horizontally to see other isolated pockets). This is a real piece of UX work and worth real attention during prototyping.
- **Tap verb display** is sized for thumb obstruction — appears slightly *above* the tap point, not at it, so the player can read it.

---

## 13. Open Visual Questions

A short list of things to resolve as we prototype:

1. **Final font choice.** Cormorant Garamond is the current front-runner. Worth typesetting all the sample lines in 2–3 candidates and seeing which carries.
2. **Mass and Consolidation counter typography.** Same serif as flavor text? Or a numerical face for clarity? A good readable old-style figures serif (like Cormorant's tabular variant) might do both.
3. **Camera framing for the peak.** The Galaxy → Local Group transition (T5→T6, into the PEAK) is the most important camera move. Storyboard it before implementing.
4. **The endgame fade duration.** 5–10 minutes is a guess. Real number comes from playtesting — long enough to feel deliberate, short enough that players don't think it's broken.
5. **Color of the hidden number before its label.** Is it the same white as everything else? Slightly dimmer? Slightly cooler? Worth thinking about whether the number *looks* different before and after its reveal.
6. **What the upgrade icon looks like.** Has to be unobtrusive enough to fade into the cosmos, recognizable enough to be discovered. Possibly a simple geometric glyph rather than any conventional menu icon.
7. **Tier transition between Act 1 and Act 2 visuals.** The shift from warm-saturated to cool-thinning is gradual. Does it correspond to specific tier transitions, or is it a continuous curve mapped to the hidden number? (Probably the latter, for consistency with the audio chain.)

---

*This document is the visual companion to the [design notes](design-notes.md) and [voice samples](voice-samples.md). When all three are in alignment, the project is ready for the scaffolding milestone.*
