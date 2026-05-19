# Dark Filaments — Visual Capability Scoping (code-only)

> Implementation-side reference for what the React + Three.js scaffold can render with code only — no custom art assets, only publicly available libraries. Companion to [visual-design.md](visual-design.md), which holds the locked aesthetic intent; this doc maps that intent onto the technical surface and is refreshed as the scaffold takes shape.

**Version 0.1 · Last updated 2026-05-13**

## Changelog

- **0.1 (current)** — Initial code-only capability scoping. Converged opinion of `engineering-director` (technical feasibility + library landscape) and `creative-director` (aesthetic direction the constraint should drive us toward). Captured during a parallel scoping session while T4 numerical calibration ran on its own track.

---

## 1. Purpose and audience

This document sets expectations for what the React + Three.js scaffold can render under a code-only constraint: no custom art assets, only publicly available libraries. It is meant to be read end-to-end before the scaffold milestone begins, then revisited at scaffold-start to confirm the chosen library stack and the anchor-moment build sketches still hold.

It is a companion to [visual-design.md](visual-design.md). The visual-design doc holds the locked aesthetic intent — color language, per-tier scene descriptions, click feedback curve, flavor-text presentation, endgame fade, the consolidation HUD philosophy. This doc holds the *implementation-side reference*: what's reachable, what's not, what libraries to commit to, how the three anchor moments would actually be built in code. When the two docs disagree, visual-design.md is canonical for intent and this doc is canonical for capability.

---

## 2. Aesthetic frame — the constraint is the language

The code-only constraint is not a compromise. For Dark Filaments specifically, procedural visualization is the *correct* visual language, and the locked direction in [visual-design.md](visual-design.md) §1 ("procedural realism, schematic where it serves clarity") already commits to it.

The thesis: **the bright things are crafted, the dark spaces are honest.** Every star rendered is something the engine chose to put there. Every gap between stars is mathematically real — not a missing texture, not an unrendered region of an asset, just space the simulation correctly leaves empty. That epistemological move maps directly onto the SD-2 load-bearing rule: *dark matter is inferred, not rendered.* Procedural visualization is the native medium for showing-by-implication. A screen-space gravitational-lensing shader has no halo asset hiding behind it; the distortion is the entire statement. A photographic-nebula approach would contradict the rule by rendering the un-renderable. Hubble heritage images are themselves processed — false-color, contrast-stretched, composited — they are already a procedural aesthetic with extra steps. The code-only approach simply removes the steps.

A second reason the constraint serves the design: long-burn pacing rewards a look the player can return to for weeks without exhausting. Procedural scenes drift and rotate; the frame is never the same twice. Asset-driven scenes are static by construction. The universe under code-only is continuously dynamic by default, which is what the patient-universe rule (CD-5) needs the rendering layer to deliver.

---

## 3. What's confidently reachable (code-only)

- **Vast star fields and parametric spiral galaxies.** The three.js community galaxy-generator pattern (log-spiral angle + radial falloff + per-particle color ramp + additive blending, ~200 lines) gets a respectable spiral on day one. Add dust-lane noise subtraction along the arm phase, HDR-bright bulge under bloom, and the result is the T4 anchor.
- **Cosmic-web filaments.** `CatmullRomCurve3` between node positions, sampled into a point cloud with noise-jittered offset, additive-blended at low alpha. The Millennium-Simulation register reads correctly because the underlying mathematics is the same — points along filaments.
- **"Plausible" gravitational lensing.** Screen-space UV deflection: `uv += deflection · r̂ · m / r²` with a falloff radius. Reads as "mass is present" without rendering the mass. Honors SD-2.
- **Volumetric nebulae.** 3D simplex noise sampled in a fragment shader — billboarded sprites for cheap, fullscreen raymarched volume for hero shots. Color-temperature mapping from temperature field gives the Hubble-evocative register without claiming photographic accuracy.
- **Full post-FX stack out of the box.** Bloom (UnrealBloom equivalent), vignette, chromatic aberration, film grain, ACES tonemapping — all in `@react-three/postprocessing`. The chromatic palette curve described in visual-design.md §2 is a tonemap-exposure curve plus a saturation lerp.
- **The endgame fade (visual-design.md §9).** One decay uniform on a timer. Particles cull deterministically by hash; bloom strength interpolates down; tonemap exposure compresses toward 0 over 5-10 minutes of real time. The DOM-overlay "I" text persists against pure black when the render target empties. This is the cheapest anchor to build because nothing new appears — there is only less of what was already there.

---

## 4. What's NOT reachable (the honest hard list)

- **Photoreal *specific* named galaxies.** Procgen gets a spiral. It does not get *that* spiral. Real galaxies carry idiosyncratic dust structure that is painted, not generated.
- **Hubble-grade nebulae.** Evocative, not photographic. The Pillars of Creation are matte paintings of data; the code-only approach gets colored noise volumes that read as nebulae without claiming to be any one of them.
- **Star surface granulation or coronae.** Bloomed points only. No prominences, no spicules, no resolved photosphere. Sun-from-orbit is out of reach.
- **Real ray-traced gravitational lensing of a known background.** Plausible distortion reads correctly; a real Einstein-ring lensing of a specific background galaxy field would betray the trick to anyone who knows what one looks like.
- **Rigged props, matte paintings, normal-mapped meshes.** None of this without an artist.
- **10M+ particles on mobile.** Auto-tune by device tier. Realistic budgets: ~100k-200k points at 60fps on a mid-tier phone shaded simply, ~500k at 30fps with constrained overdraw, ~1-2M on desktop. The "millions of GPU-driven particles" line in visual-design.md §3 (T4 entry) is a desktop-class target that downsamples gracefully on mobile.

---

## 5. Library shortlist (opinionated)

The recommended stack, with one-line rationales:

- **`@react-three/fiber`** — declarative React-shaped Three.js scene graph; plays cleanly with the locked Zustand state layer.
- **`@react-three/drei`** — utility belt (camera helpers, instance helpers, `shaderMaterial` factory, dev `Stats` overlay).
- **`@react-three/postprocessing`** (pmndrs fork of vanruesc's library) — bloom, lensing-shaped distortion effects, vignette, tonemap, chromatic aberration, film grain. The whole effect list in §3 above.
- **`leva`** — dev-only tuning GUI for shader parameter calibration. Tree-shaken from production builds.
- **`maath`** — small vec math, easing, random helpers (`randomInSphere`, etc.). Saves writing them.
- **Raw `three`** for the hot inner loops: custom `BufferGeometry`, `ShaderMaterial`, instanced mesh attribute buffers.
- **Skip `lygia` and `gl-noise` initially.** Vendor inline the 3-4 noise functions actually needed (simplex 2D, simplex 3D, hash, smoothstep). Smaller surface, no dependency churn.

The WebGPU/TSL caveat: classic Three.js GLSL fragment/vertex shaders are the right commitment for v1. WebGPU mobile support is uneven through 2026 and TSL is still churning. The locked tech stack in [CLAUDE.md](../CLAUDE.md) lists "Three.js with WebGPU/TSL" as aspirational; a rules-guardian-vetted revision to "Three.js with classic GLSL fragment/vertex shaders" is the recommended course at scaffold-start. See §9 below for the open flag.

---

## 6. Anchor moments — concrete build sketches

[visual-design.md](visual-design.md) §1 commits to three anchor visuals that absorb the bulk of polish budget. Below is what each one looks like under code-only, with rough effort sizing. Phrasing follows the renumber-proof convention used in [CLAUDE.md](../CLAUDE.md) load-bearing rules so future ladder revisions do not require re-vetting this doc.

### T4 Galaxy — the first masterpiece moment (≈ 1 week)

Three.js galaxy-generator base: 50k-100k points, log-spiral parameterization, additive blending, per-point color ramp from warm core to cool outer arms. Custom `ShaderMaterial` for the bulge — gaussian falloff multiplied by HDR brightness greater than 1.0, so the UnrealBloom equivalent catches it and produces the halo. Dust lanes are a second 3D noise sample subtracted from particle alpha along the arm-phase coordinate. Slow rotation around the y-axis. Tap reactivity writes to `uTapCenter` and `uTapTime` uniforms; the fragment shader brightens points within a propagating ring whose radius grows from the contact point.

### PEAK tier — Local Group (≈ 2-3 weeks)

The most chromatic moment in the game; under the 2026-05-13 ladder reshape, this is T6 Local Group. N instances of the T4 galaxy shader, parameterized for size, orientation, color profile, and bulge ratio, placed via `InstancedMesh` or grouped meshes. Intergalactic medium between galaxies as point clouds along `CatmullRomCurve3` curves between galaxy centers, with noise-jittered offsets and a faint additive-blended shader. Full post-FX stack engaged: bloom strength at maximum budget, ACES tonemapping for the chromatic-peak palette, a small chromatic-aberration nudge for the saturated-color register described in [visual-design.md](visual-design.md) §2. The polish ceiling here is high — this is the tier that absorbs the most polish budget of any single visual moment per visual-design.md §1.

### Final tier — Causal Horizon fade (≈ 1 week once scene grammar exists)

Mechanism: a global `uDecay ∈ [0, 1]` uniform driven by a 5-10 minute real-time timer. The vertex shader culls particles whose `hash(id) < uDecay` — deterministic attrition; the same particles always go in the same order. Bloom strength and emissive multipliers interpolate downward against the same uniform. ACES tonemap exposure compresses toward 0. When `uDecay → 1`, the render target reads pure black, leaving only the React DOM-overlay "I" text from visual-design.md §9. This is the cheapest anchor of the three because nothing new is being rendered; the work is purely the *un-rendering* of what was already there.

---

## 7. Captured ideas — held as candidates, not locked

Two ideas surfaced during the scoping conversation that are strong enough to record but not load-bearing enough to commit before scaffold work actually begins. Both decisions revisit at scaffold-start.

### Name-seeded procedural signatures

Every named one-shot upgrade is generated from a deterministic hash of its name string. `hash("Andromeda")` produces a reproducible particle distribution, arm-pitch angle, bulge ratio, dust-lane phase, and color-temperature offset. Andromeda always looks like Andromeda — across saves, across devices, across players. Sagittarius A* always has the same accretion-disk seed. Draco Dwarf always carries the same orbital morphology. The Sagittarius Stream always traces the same path through the local halo.

The aesthetic argument: under an asset workflow it would not be feasible to art-direct every named one-shot in the game. Under procgen, the constraint "we cannot hand-author each one" inverts to "every named structure has a literal name-derived signature." That is the most on-theme thing the rendering layer could do for a game whose Inventory framing line is *"We name what we remember. Names are the smallest acts of holding."* The name *is* the seed. The structure is what the name produces.

Natural extension of [design-notes.md](design-notes.md) §9 (dark-filaments signature pattern). Decision deferred to scaffold-start.

### Scene-swap with framing continuity for tier transitions

The peak's "longest, most dramatic pull-out" described in [visual-design.md](visual-design.md) §3 and §6 is not a single continuous camera dolly through coordinate space. Float32 position precision breaks down around 10⁷ world units; the cosmological scale ratio of 10²² M☉ across the full ladder exceeds what one coordinate frame can carry. The `logarithmicDepthBuffer: true` flag on the renderer extends near/far precision but does not extend the coordinate range.

The realistic approach: each tier owns its own Three.js scene at a sensible local scale (T4 in units of kpc, the peak in units of Mpc, the final tier in units of Gpc). Tier transitions are 2-second cross-dissolves with pixel handoff — the outgoing tier's central bright object lands at the same screen position as the incoming tier's framed point, then the new camera dollies back. The continuity is compositional, not coordinate. The player reads one move; the engine renders two. A render-to-texture quad of the outgoing scene's final frame can serve as the bright central point of the incoming scene during the handoff, giving literal pixel-level continuity.

Two-day implementation if planned at scaffold-start; significantly more painful if discovered late in build. Decision deferred to scaffold-start.

---

## 8. Risk to surface — text and HUD vs. spectacle

[visual-design.md](visual-design.md) §7 (flavor-text presentation) and §11 (Consolidation bar HUD philosophy) describe surfaces that the player reads on every check-in. Typography, the five fade-in patterns, the radial-glow text treatment, the bar's compress-and-extend at tier transitions — these are where the narrator's voice lives. The 3D scene carries the awe; the typographic system carries the voice.

The practical risk: early build sessions naturally gravitate toward shader and particle work because those wins are most visible in dev. Under-investing in the typography and HUD layer is the most likely failure mode for the first prototype milestone.

**Recommendation:** land the flavor-text rendering layer first — serif typeface, radial-glow background treatment, the five fade-in patterns from visual-design.md §7.4, and the full per-line-type presentation table — *before* the T4 anchor scene. The voice surface should be stable before the spectacle competes for attention. The consolidation bar follows on the same milestone, since both share the typographic system.

---

## 9. Known drifts and open questions

- **Peak-tier renumber drift in [visual-design.md](visual-design.md).** §3, §10, and §11 still phrase the peak as "Tier 5" — predates the 2026-05-13 11-tier reshape, under which the peak is T6 Local Group. The fix is a renumber-proof rephrasing pass following the convention already established in [CLAUDE.md](../CLAUDE.md) load-bearing rules (*"the PEAK tier"* instead of *"Tier 5"*). A doc-keeper follow-up has been flagged for this; tracked separately so the diff stays reviewable on its own.
- **WebGPU/TSL → classic GLSL stack revision.** [CLAUDE.md](../CLAUDE.md) lists "Three.js with WebGPU/TSL" as part of the locked tech stack. Engineering-director's recommendation is to commit to classic Three.js GLSL fragment/vertex shaders for v1 — WebGPU mobile support is uneven through 2026, TSL is still churning, and the cosmic-particle/nebula/starfield work the project needs has 15+ years of GLSL precedent. A rules-guardian follow-up has been flagged to surface the tradeoff to the user at scaffold-start. Not a decision for today; surfaced when it actually matters.
- **Mood-board touchstones to keep nearby.** Millennium Simulation and IllustrisTNG cosmic-web renders (the right register for T7-T9 and the final tier). Iñigo Quilez and Shadertoy galaxy + volumetric-nebula entries (the right ceiling for T4 anchor work). EVE Online star map for sparse blue-white abstraction at large scales; Bruno Simon-tier interactive WebGL polish for the *interaction* quality — click feedback, camera moves, the signal that this is craft rather than a toy.

---

*This document is the implementation-side companion to [visual-design.md](visual-design.md) and [design-notes.md](design-notes.md). When the React + Three.js scaffold milestone begins, this doc and the locked stack in [CLAUDE.md](../CLAUDE.md) are the two references the scaffold-start session reads first.*
