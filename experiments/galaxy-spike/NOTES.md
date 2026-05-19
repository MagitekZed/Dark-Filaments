# Galaxy spike — observations

Spike: prove out the locked Dark Filaments stack (Vite + React + TypeScript + Three.js) by procedurally rendering a barred spiral galaxy. Not production code — observations only.

## Iteration history (what we tried, what worked)

1. **Vanilla `<pointsMaterial>` + 12k random spiral particles** → recognizable galaxy shape but every star was a literal pixel square. Squares are the default sprite when no `map` is set.
2. **Three layered groups + procedural radial-gradient CanvasTexture** → round soft particles, real volumetric feel, but everything was the same population so it read as uniform fog. Background starfield added depth.
3. **Six populations (bulge / bar / disc / arm stars / blue clusters / HII regions) + two sprite textures (soft / sharp) + per-arm asymmetry** → recognizable barred spiral. The shape was right but arms were clean traces, not bands.
4. **Gaussian-band arms with layered-sine noise modulation of width and density** → organic feel. Arms now have variable thickness and clumps + gaps. This is the current state.
5. **Bloom via `@react-three/postprocessing`** → visually huge but broke; see "things that didn't work."

## What worked

- **R3F + drei feels right** for this game. The galaxy is a single React component (`<Galaxy>`), `useMemo` for geometry, `useFrame` for the rotation. The drei `<OrbitControls>` is a one-line drop-in. Code reads cleanly; HMR works.
- **Procedural CanvasTextures** beat ship-an-asset for sprite shapes. Two textures (soft glow + sharp pinprick) gave enough variety to read as different populations.
- **Population layering** (six different `<points>` groups with different sizes, colors, opacities) gave the eye real variety without needing per-particle size in a shader.
- **Layered sine "noise"** (a couple of sin waves at different frequencies summed) was sufficient for the organic-band feel. We did not need real Perlin/Simplex.
- **Gaussian cross-section** (Box-Muller-ish) made arms look like bands, not lines. Best single change for "organic."
- **`sizeAttenuation: false`** for the background starfield keeps dots legible regardless of camera distance — important when we'll eventually zoom across cosmic scales.
- **TypeScript** was friction-free for this work. R3F's typings are good.
- **Mobile-first responsive layout** from R3F's `<Canvas>` + full-viewport CSS was zero work.
- **WebGL renderer** at ~16k particles ran smooth. We never hit a frame-rate concern.

## What didn't work (initially), and the workaround that did

- **`@react-three/postprocessing` 3.0.4 + R3F 9 + React 19** floods the console with `Invalid hook call` errors. Bloom rendered visually but unshippable.
- **Workaround that landed**: direct `THREE.UnrealBloomPass` via R3F's `useFrame` priority mechanism. The `Bloom.tsx` component constructs an `EffectComposer` with `RenderPass + UnrealBloomPass + OutputPass`, then uses `useFrame((_, _delta) => composer.render(), 1)` — priority `> 0` makes R3F skip its default `gl.render` so the composer takes over the render path. Clean integration, no library involved, no console noise.
- **Gotcha discovered along the way**: after adding the `three/examples/jsm/postprocessing/*` imports, Vite's optimized-deps cache (`node_modules/.vite/`) returned `504 Outdated Optimize Dep` on follow-up requests, which manifested as a black canvas with no console errors. Fix: `rm -rf node_modules/.vite` and restart the dev server. Vite is supposed to detect new deps and re-optimize, but it didn't here. Worth recording in the real scaffold's troubleshooting.
- **Negative space (dust lanes)** doesn't come naturally with additive blending. Real galaxies have dark cracks where dust absorbs starlight; with additive blending you can only *add* light, not subtract it. Either: render arms with non-additive blending and modulate per-particle alpha, or skip dust lanes as a stylistic choice.
- **Bar/arm transition** still looks slightly disconnected. The arms start at the bar tip radii but the visual density bias makes the joint visible. Would benefit from a "bar-shoulder" population that fills the seam.

## Decisions this informs for the real `game/` scaffold

- **R3F should join the locked stack.** Worth surfacing for a rules-guardian pass — the locked stack mentions "Three.js" but doesn't specify the React wrapper. R3F + drei is dramatically cleaner than imperative Three with refs.
- **WebGPU/TSL revisit is a real decision, not automatic.** WebGL handled everything in this spike (additive blending, sprite textures, soft particles, ~16k geometry) with no headroom problems. WebGPU's benefits (better compute, custom shaders, modern pipeline) won't *visibly* matter for Dark Filaments-scale scenes. WebGPU also has worse browser support (mobile Safari just got it in 2024). Recommendation for `game/`: start on WebGL, revisit WebGPU when there's a specific need (compute particles, GPU-side culling at huge counts, etc.).
- **Procedural-only is viable.** The whole galaxy is 0 KB of assets. For Dark Filaments' "every named structure is a seeded variation" rule, this is exactly the right substrate: hash a name → seed RNG → generate populations → galaxy always looks like itself across saves / devices / players.
- **`sizeAttenuation: false` is the right call for background starfields** once we're zooming across tiers. Stars that exist at huge distances need to stay legible when the camera is close.
- **Additive blending + cool palettes against deep black** is the natural visual language. It's contemplative by default. Aligns well with Dark Filaments' tone.

## Couplings to fix in the real scaffold

- **Spin rate is duplicated.** `Galaxy.tsx` rotates its inner `spinRef` at `delta * 0.04 rad/s`, and `TwinklingStars.tsx` independently rotates its own inner group at the same rate so the embedded stars stay locked to the disc. If one changes, the other has to. The real scaffold should pull these per-tier scene constants (spin rate, tilt angle, R_BAR, R_DISC, ARM_SPIN, default camera position, etc.) into a `sceneParams.ts` module per tier, and components that need them import from there rather than redefine them inline.
- More broadly: any "magic number that must match across two components" is a future bug. The spike has at least one (above) and probably more (e.g., the `rotation={[Math.PI / 2.3, 0.18, 0]}` repeated across the BlackHole, BlackHoleAccretionDisc, BlackHoleJets, BlackHoleInfall, and BlackHoleLensing components — all the BH-axis-aligned features share that rotation and would drift apart if any one changed independently).

## Open questions for the real scaffold

- **Bloom strategy**: settled. Direct `UnrealBloomPass` via R3F's `useFrame` priority is the path forward until `@react-three/postprocessing` catches up to R3F 9. Working integration shown in `src/Bloom.tsx`.
- **Per-particle attribute variation** (each star has its own size, individual brightness pulse, etc.) needs a custom `ShaderMaterial` reading per-vertex attributes. Population-layering got us most of the way without one, but for the named one-shot reveals we'll want individual sprite control.
- **Asset format for named structures**: hash-seeded procedural is one approach; pre-baked JSON of (x,y,z) tuples per structure is another (deterministic, no re-roll). Probably the latter once we lock the visual identity of each named one-shot.
- **Mobile feel**: didn't test on a real phone this session. Touch pinch/drag should "just work" via drei's `<OrbitControls>` + `touch-action: none` on the canvas, but worth verifying before the scaffold commitment.

## Files of interest

- `src/Galaxy.tsx` — populations + generators (~330 lines)
- `src/Starfield.tsx` — sphere-shell background starfield
- `src/discTexture.ts` — procedural soft + sharp sprite textures
- `src/App.tsx` — `<Canvas>` + camera tilt + `<OrbitControls>`

---

# T1 — Solar System spike (post-galaxy session)

After the T5 (galaxy) spike, app shell was refactored to support multiple per-tier scenes via tab nav. T1 (Solar System) was built up over a single long session as a sandbox for solar-scale visuals.

## Architecture

- `src/App.tsx` — tab shell + reset-view button. State: `tier: 't1' | 't5'`, `resetCounter: number` (passed as `resetVersion` prop to scenes; when changed, the scene's `<CameraResetWatcher>` fires `OrbitControls.reset()`).
- `src/T1Scene.tsx` — declarative scene file. All planets/asteroid belt/Kuiper belt/comet/zodiacal/heliopause/nebulae are mounted from a config array or inline JSX. Camera at `[0, 3.5, 22]`, fov 60.
- `src/T5Scene.tsx` — original galaxy scene, extracted unchanged.

## T1 components landed (in render order)

| Component | Role | Key technique |
|---|---|---|
| `MilkyWayBand.tsx` | Full 360° galactic band wrapping the sky | Star + knot + diffuse-glow layers; centerline wave; width modulation; dust-lane noise; periodic frequencies (integer multiples of 2π) for seamless wrap |
| `Nebula.tsx` | Distant deep-field gas clouds | Sub-blob clusters with per-blob color phase; Gaussian particle scatter |
| `DeepStarfield.tsx` | Wide background pinpricks | Directional density modulation via summed sines |
| `Heliopause.tsx` | Outer system boundary shell | Particle shell with bow-shock asymmetry (compressed in motion direction) |
| `Star.tsx` | Procedural sun | Custom ShaderMaterial; FBM noise + multi-octave; sunspot decoupled noise field; corona on backside-rendered shell; slow self-rotation |
| `PlasmaArcs.tsx` | Solar prominences + coronal loops | Bezier-arc particle streams; per-arc lifecycle (fade in/hold/fade out/respawn); sum-of-sines wobble; width fluctuation; fire-gradient (scrolling yellow↔red bands) |
| `Planet.tsx` | All bodies (planets + moons recursively) | Custom shader with rocky/gas branch; FBM 9-octave; gas giants have multi-frequency banded sin stack + domain warping + Great Red Spot/Oval BA + storms; rocky has terrain palette + ice + clouds + craters; per-planet bandContrast prop; ring system (ringGeometry shader with fwidth-based AA, Cassini gap); ring shadow on planet via world-space ray-disc intersection (gated by diffuseRaw > 0); atmosphere fresnel shell; recursive moons via `moons?: PlanetProps[]` |
| `AsteroidBelt.tsx` | Asteroid + Kuiper belts | Keplerian per-particle ω (∝ r^-1.5); accepts `colors[]` prop for icy palette override |
| `ZodiacalLight.tsx` | Ecliptic dust haze | Static thin ring biased toward inner |
| `Comet.tsx` | Passing comet on elliptical orbit | Parametric ellipse with focus at origin; sun-away tail particles; sum-of-sines flicker on coma sprite scale + opacity |
| `Bloom.tsx` (existing) | Postprocess bloom | Direct UnrealBloomPass via useFrame priority |

## New techniques worth banking for the real `game/` scaffold

- **`fwidth()`-based shader antialiasing.** When a shader has high-frequency periodic patterns on a 3D surface (Saturn's rings, gas-giant bands, anything with visible periodic structure), use `fwidth()` of the parameter to detect when the period is approaching pixel size, and smoothly fade the variation toward a constant. Keeps the visual stable at any zoom level. Pattern exemplified in `Planet.tsx` ring shader.
- **Recursive component composition.** `Planet` accepts `moons?: PlanetProps[]` and renders them as nested `<Planet>` instances. Moons orbit their parent automatically because the inner orbit group is parented to the outer planet's orbit group. Lighting (`lightDir = normalize(starPos - vWorldPosition)`) uses world position so lighting works at any nesting depth. Could go moons-of-moons-of-moons trivially.
- **Steady-state particle systems.** Used everywhere (jets, accretion disc, prominences, comet tail, asteroid belt). Pattern: typed-array per-particle state (`life`, `speed`, `seed`), `useMemo` initialization with random per-particle values spread across the lifecycle range, `useFrame` advances each particle and respawns at end-of-life. Same particles each frame; positions/colors mutated in place; `geometry.attributes.position.needsUpdate = true`.
- **Per-feature lifecycle with fade envelopes.** `PlasmaArcs.tsx` has the most complete pattern: each arc has `birthTime / lifetime / alpha`, alpha computed from a fade-in/hold/fade-out envelope. When age exceeds lifetime, all arc geometry regenerates (random position, new seed) and the cycle restarts. Initial birthTimes are negative-randomized so arcs are at random life-positions at startup (no synchronized startup transient). Same pattern would work for any "ephemeral feature" like solar flares, supernovae, transient nebulae.
- **Per-arc seed (not per-particle) for path variation.** All particles flowing along the same arc share the same wobble/width noise seed → they trace the same wobbled curve like plasma along one magnetic field line. Per-particle seed gave a "swarm" look. The fix was a one-line refactor and a major visual upgrade.
- **Sum-of-sines beat noise.** Two sines at different frequencies (1.7× ratio is good) produce non-repeating beat envelopes. Used for plasma arc width modulation, fire gradient phase, comet flicker, twinkling stars. Cheap, organic, deterministic per-seed.
- **Domain warping.** Pre-distort the noise sample position by another noise field, get fluid-dynamics swirl. Major upgrade for gas-giant bands. ~3 extra noise samples per fragment, big visual return.
- **Camera reset via state-counter prop.** App-level `resetCounter` state, passed as `resetVersion` to scenes. Inside the Canvas tree, a `<CameraResetWatcher>` component holds the OrbitControls ref and calls `controls.reset()` in a `useEffect` keyed on the version prop. Clean cross-Canvas-boundary event mechanism using only React state.

## Camera/interaction philosophy decision

Discussed mid-session. **Curated camera by default in the real game; free orbit reserved for the Inventory artifact (post-completion).** Reasoning: Dark Filaments' load-bearing rules ("the universe is patient," "strategic choice locks at the peak," "narrator confesses, never accuses") all describe a contemplative/film-like experience rather than a sandbox. Per-tier authored shots; tier transitions become cinematic camera tweens. Subtle ambient camera motion (drift/breath) when "locked" so the scene feels alive without giving up framing control. Free orbit during dev (this spike) is essential for authoring; not for shipped gameplay.

## Performance notes

Final T1 scene runs at 60fps on a typical desktop:
- Star: custom shader with FBM (9 octaves) — fragment-bound, fine
- 6 planets + 5 moons, each with custom shader (gas giants do ~9 FBM samples × 9 octaves per fragment) — fine but Jupiter/Saturn are the heaviest
- Asteroid belt ~1000 + Kuiper belt ~1500 — particle updates per frame, cheap
- Comet tail 700 particles — cheap
- Zodiacal 1500, prominences ~6600 (6 arcs × 1100), coronal loops ~5040 (18 × 280) — all cheap
- Milky Way ~14,400 particles — generated once, never updated
- Heliopause 1800, Nebulae 4500 + 2000 — generated once
- DeepStarfield 6000 — generated once
- Bloom postprocess — moderate

Total ~25k animated particles and a moderate amount of fragment-shader work. WebGL handles it; would benefit from instanced sphere geometry if planet count grew significantly.

## What to bank for T2

The T1 spike was about establishing the **renderer architecture** and **content vocabulary** at one scale. T2 (Stellar Neighborhood, ~10³ M☉) should test:
- Whether Planet/Star scale up sensibly when "the star" becomes one of dozens
- Whether the recursive-moons trick generalizes (groups-of-stars-of-planets)
- Whether the `bandContrast` / palette-prop pattern extends to per-star variation (different spectral classes)
- **Additive upgrades** as discussed for next session — when a player buys an upgrade, what's the on-screen mechanism for "this feature appeared"? Per CD-7 (named one-shots are universe events), purchase = visible structure appears in the scene. T2 is the right place to spike this since it has its first one-shots in the design.

---

# T1 — UI Test session (Edge Vignette chrome + click feedback)

Iterative session building the first shipped-spec player UI on a copy of T1Scene, plus the click-feedback visual mechanic.

## What landed

### UI chrome — Edge Vignette direction
[T1UIChrome.tsx](src/T1UIChrome.tsx) + [T1UIChrome.css](src/T1UIChrome.css) — full DOM chrome layered over a Canvas-as-cosmos. Hairline elements at the four edges; cosmos fills the center.

- **Mass counter** (top-left): Cormorant Garamond 38pt with `-webkit-text-stroke: 0.5px rgba(0,0,0,.6)` + `paint-order: stroke fill` (1px outline outside the glyph), plus a localized `backdrop-filter: blur(8px) brightness(0.55)` scrim with a feathered ellipse mask. Survives any background luminance.
- **Stats line** (`MPS · MPC · AC/s` beneath Mass): Inter 11pt in a tight blur pill (`blur(6px) brightness(0.7)`).
- **Consolidation bar** (top edge): 2px track + 2px fill, fill has 0.5px black outer-shadow + 6px warm `#FFC890` leading-edge glow.
- **Causal Connections** (bottom-right): unlabeled 13-digit number, 14pt Cormorant, smaller scrim.
- **Settings gear** (top-right): 16px custom SVG, 35% alpha, hover-to-label.
- **Upgrade affordance** (bottom-center): 56px hairline + rotating clinical click verb above + invisible 320×88 hit area. Onboarding cues: first-tap point at scene center fading on first tap; hairline breathes once mass crosses the cheapest upgrade.
- **Sheet open** (translateY 100%→0 over 360ms, cubic-bezier(0.22, 1, 0.36, 1)) with three stub prose-first cards.
- **Mobile breakpoint at 480px** shrinks the corner stack.

Mock game state inside the chrome (mass per click 0.12, consolidation +5% per tap) makes it interactive without engine wiring.

### Click feedback — PullParticles + pullEvents
[PullParticles.tsx](src/PullParticles.tsx) + [pullEvents.ts](src/pullEvents.ts) — physics-driven dust burst on each tap.

- **Tap → world-space spawn point**: ray from camera through the tap, intersected with the orbital plane (y=0). Each particle in a burst samples a random depth ±3.5 along the camera ray so the burst occupies 3D space at the screen tap point, not a flat 2D dot.
- **Per-particle initial velocity**: random direction on the sphere (Y squashed ×0.35 to bias toward the disc), speed 1.75-4.75 units/sec.
- **Constant-magnitude gravity** (9.5 units/sec² toward Sun) + **drag 0.30/sec** (drains angular momentum so orbital particles spiral inward).
- **No lifetime cap** — particles only end on (a) photosphere contact or (b) the soft-cap fade when alive count exceeds 110.
- **Color**: warm gold at distance, lerp to white-hot near Sun, per-particle scintillation (sum-of-sines, 3-7 Hz with random phase, ±22% modulation).
- **Absorption flash**: on photosphere contact, particle locks position at the photosphere edge and renders via a SECOND `<points>` with a custom ShaderMaterial. Per-vertex size attribute lets each flash be 5-15× the in-fall particle size (rolled once at trigger, held). Fragment shader does gaussian radial falloff (`exp(-r² × 9)`) so each flash is a soft glow, not a hard disc. 100ms ease-in quadratic ramp to peak brightness 7.0, blue-white tint (0.82, 0.94, 1.05).

### App harness
[App.tsx](src/App.tsx) — added a fourth tab "T1 — UI Test" mounting [T1UITestScene.tsx](src/T1UITestScene.tsx) (a copy of T1's scene composition + T1UIChrome). Original T1 tab untouched as the no-chrome reference.

## Bugs hit and fixed (worth remembering)

- **R3F clones uniforms inside ShaderMaterial construction.** Writing to a React-`useMemo`'d uniforms object is a dead write — the GPU reads from `material.uniforms`. Pattern: write to BOTH `myUniforms.foo.value` AND `meshRef.current.material.uniforms.foo.value` each frame. Bit us hard during the abandoned click-boost experiment ([Star.tsx](src/Star.tsx), [Planet.tsx](src/Planet.tsx) still carry the dual-write pattern though no consumer passes `boostId` anymore).
- **`THREE.Clock.elapsedTime` is canvas-scoped, NOT wall-clock.** Mixing it with `performance.now()/1000` between modules gives negative elapsed values and silently broken timers. The `nowSeconds()` export in [clickBoost.ts](src/clickBoost.ts) standardises on `performance.now()/1000` and is shared by PullParticles (and was used by the dead boost path).
- **Frustum culling kills points with off-screen "dead slot" sentinels.** Parking dead particles at y=-10000 yielded a bounding sphere centered way below the camera, so Three.js culled the entire Points object. Fix: `frustumCulled={false}` on the Points.
- **`pointsMaterial.size` is material-wide.** For per-particle size you need a custom ShaderMaterial with an `aSize` attribute (the flash material does this).
- **Vite's source serves minified literals (`0.98 → .98`).** Verification scripts that grep for exact decimal strings need to use the minified form or fetch the source-map'd version.

## Dead code worth flagging

- **clickBoost.ts**, **boostId prop on Star.tsx / Planet.tsx**, and the per-frame dual-write inside both. No consumer passes `boostId` anymore — the chrome's `handleTap` no longer calls `fireRandomBoost`. The infrastructure is harmless but should be either deleted in a cleanup pass or revisited as the basis for a different mechanic (e.g., a generalised "named-body highlight" hook).

## Decisions / specs locked this session

- **Click feedback at T1 is matter-pulled-inward** (warm-gold dust at tap point → curve inward via gravity → absorption flash). Different tiers will get tier-appropriate variants; the click verb already rotates per CLAUDE.md (PULL → BIND → CONSOLIDATE → HOLD → REACH), and the visual mechanic should rotate with it.
- **Particle behaviour is physics-driven, not time-bound.** Particles end on photosphere contact, full stop. Soft-cap fade kicks in only as a performance fallback.
- **Per-particle randomness wins.** Each tap produces a burst that looks different because each particle has its own seed (depth, velocity vector, speed, twinkle phase + frequency, flash size). Bursts never look identical.
- **The Edge Vignette chrome is the locked direction for shipped UI.** Designer's shipped-spec pass (Mass scrim + stroke, blur-pill stats, etc.) survives empirically — chrome remains legible against bright Sun, deep starfield, and the bright bloomed photosphere.

---

# T2 — UI Test session (functional mockup + iterations)

The previous session's "Next session" scope landed in full, plus two iteration rounds of user feedback. Three discrete deliveries within the session:

## What landed

### 1. T2 — UI Test tab (initial scope from prior session)

- **New tab** `T2 — UI Test` mounted between `T2 — Stellar Neighborhood` and `T5 — Galaxy`. [App.tsx](src/App.tsx) gets a fifth tab entry; the new scene is conditionally rendered when active.
- **[T2UITestScene.tsx](src/T2UITestScene.tsx)** mirrors T2Scene's composition (player star group, 12 field stars, conditional upgrade components, OrbitControls + Bloom) and lifts the `T2Controls` state so both the chrome's "Buy" cards and the existing dev panel feed into it.
- **[T2UIChrome.tsx](src/T2UIChrome.tsx)** + **[T2UIChrome.css](src/T2UIChrome.css)** — Edge Vignette chrome adapted to T2. Identical shape to T1UIChrome (mass top-left, stats line, consolidation bar, settings gear, unlabeled Causal Connections, click verb + hairline + bottom-rising sheet). Differences: 10 prose-first cards instead of 3 stub cards; scrollable sheet grid (with subtle scrollbar); terminal-state `Owned` / `Maxed` styling; mock economy derived from the lifted controls (MPC = Microlensing × 0.060 + Wolf-Rayet × 0.025 + base; MPS = stack contributions × ×1.40 Peculiar-Velocity all-mult when owned; APS = RLO × 0.000667 gated on Binary Partner; consolidation = sum of purchased one-shots).
- **[T2NarratorSurface.tsx](src/T2NarratorSurface.tsx)** — two ephemeral narrator surfaces under the Two-voice UI rule. Tier-up line fires once on mount (`"A scattering of stars finds us. A thousand solar masses, gathered. We are no longer just one sun."`); first-purchase per-upgrade lines fade in once each, queue-serialised so they don't overlap. Both use Cormorant Garamond italic, scrim-less.
- **Click feedback** — chose "Player-Sun pull" per user answer: reuse `<PullParticles>` with `sunPosition={PLAYER_STAR_POSITION}` so particles curve toward the off-center sun instead of origin.
- **Dev panel key-toggle** — `T2ControlsPanel` mounts only when ` ` (backtick) or Shift+D is pressed. Keeps the screenshot-clean view as default but preserves the existing state-jump testing surface.
- **T2Scene.tsx exports** — added `export` to ~13 authoring constants (`PLAYER_STAR_POSITION`, `FIELD_STARS`, `MICROLENS_TARGETS`, `MOVING_GROUP_TARGETS`, `WOLF_RAYET_HOST_INDICES`, `DEFAULT_CONTROLS`, the controls interface, etc.) so T2UITestScene can import without duplicating the authoring data. Zero behavior change in T2Scene itself.

### 2. Five-item feedback round

User feedback during browser verification. All five items landed in one batch:

- **Auto-hide top dev nav on T2 — UI Test only.** `.spike-tabs` and `.spike-camera-controls` get an `auto-hidden` class only when `tier === 't2ui'`. A `.top-hover-zone` covers the top 80px of viewport. CSS `:has()` couples the hover state across all three so hovering any of them keeps both visible. Fades on 240ms opacity transition. T1 — UI Test still shows tabs always (intentional — only the T2 mockup needs the clean view).
- **Stop random regeneration of background nebula + open cluster on every state change.** Root cause: `useMemo` deps in `Nebula.tsx` included `position` (inline array prop) — every parent re-render created a fresh array reference, invalidating the memo and re-rolling `Math.random()`. Two-part fix: (a) `Nebula` now uses a **seeded mulberry32 RNG**, either from an explicit `seed` prop or auto-derived from a hash of `position + scale + subBlobs + colors`; (b) primitive `useMemo` deps `[px, py, pz, scale, ...]` instead of the array reference. `OpenCluster` got the same primitive-deps treatment for its `center` prop. Same fix pattern would apply to any other component with similar invalidation.
- **First-purchase narrator surface in top-third pool** (was lower-third, got buried under the upgrade sheet). 6 authored slots all within top 38% of viewport — well above the 55% sheet. Each upgrade hashes deterministically to one slot via FNV-1a (`slotForKey`), so Binary Partner always lands at the same spot, etc. Stays varied across upgrades but never overlaps the sheet.
- **+/- buttons on dev panel stackables.** New 22×22 `−` and `+` controls next to each stackable's toggle. Disabled at min/max. Wired through a new `nudgeStackable(key, delta, min, max)` prop that uses the **functional `setC` updater** — critical fix for the stale-closure bug where 3 rapid `onSet(level+1)` clicks would all read `level=0` from the same closure and produce L1 instead of L3.
- **Causal Connections static during Act 1.** Removed the per-one-shot decrement and tracking ref from T2UIChrome. The number renders as a literal constant `8,419,302,776,043`. **CLAUDE.md load-bearing rule extended**: "*The hidden number is shown from minute one, unlabeled, and does not change during Act 1.*" — sits static, ticking begins only at the first named-connection break (concurrent with the *Causal Connections* label fade-in). Each named-structure loss in Act 2 decrements by one. Any earlier movement would undercut the reveal.

### 3. Wolf-Rayet activation transition (two iterations)

Originally an instant snap from `wolfRayetActive=false` to the bigger/brighter/blue WR star with full plumes. Refined in two rounds.

**Iteration 1 — scale-growth + delayed plumes.** Star renders at WR target values from activation; wrapper group's scale lerps from `(baseRadius/effRadius) ≈ 0.645` to `1.0` over 4 seconds via smoothstep. Plumes mount via `setTimeout` at 3 seconds. Problem reported: color shift was still abrupt (snapped to hot blue immediately); plumes "popped in" mid-lifecycle because `WolfRayetPlumes` initialises plumes with random ages staggered across each plume's lifetime.

**Iteration 2 — 3-phase sequential, plumes fresh-start.** Each beat reads as its own moment:
- **Phase 1 (0 → 1.5s) — color shift.** Temperature lerps `baseline → effTemp` (cooler → hot blue-white) via smoothstep. Brightness and scale untouched. The surface visibly shifts toward blue first.
- **Phase 2 (1.5 → 3.5s) — brightness + scale.** Brightness lerps `baseline → effBrightness` and the scale wrapper lerps `(baseRadius/effRadius) → 1.0`. Star (already at WR temperature) ignites and grows.
- **Phase 3 (3.5s onward) — plumes mount with `freshStart=true`.** Every initial plume's `age = 0` instead of random-staggered. All plumes sweep outward from their surface foot together; no mid-arc pop.

**Mechanism for per-frame uniform writes without re-renders:** [Star.tsx](src/Star.tsx) gained `tempOverrideRef?: MutableRefObject<number | null>` and `brightnessOverrideRef?: MutableRefObject<number | null>` props. When non-null, Star's own `useFrame` writes the ref values into `material.uniforms.uTemperature` and into the brightness pipeline as the baseline. [FieldStarSystem.tsx](src/FieldStarSystem.tsx) owns the refs and updates them each frame from the phase-window lerps. No React re-render, no useMemo churn, no R3F uniform-cloning trap.

**WolfRayetPlumes** gained `freshStart?: boolean` (defaults false; preserves prior default behaviour for any other use).

Snap-off (toggle WR false) is still instant — refs cleared, scale reset, plumes unmount. Per the design note that there's no reverse progress in the real game.

## Bugs hit and fixed (worth banking)

- **Inline-array props in JSX cause silent `useMemo` invalidation in children.** Every parent re-render allocates a fresh array reference. Components that depend on `position` (or any object/array prop) in `useMemo` deps will re-run their memo body on every state change. Symptom: things like Nebula geometry visibly "reshuffling" on each upgrade purchase. Two fixes you'll want both of: (a) spread the array into primitive `useMemo` deps (`px, py, pz` not `position`), and (b) belt+suspenders, give the component a seeded RNG so identical inputs produce identical output even if the memo *did* re-run.
- **Stale closure on rapid React click handlers.** `() => onSet(level + 1)` reads `level` from the closure at render time. Three rapid programmatic clicks all see `level = 0` and produce L1, not L3. (Real user clicks usually avoid this because the renders interleave with the clicks.) Always provide a functional-update variant for state-mutating UI primitives that might fire rapidly.
- **Per-frame uniform writes without re-renders.** If a parent needs to drive a shader uniform smoothly (the WR color lerp here), pass a `MutableRefObject` down and let the child component apply it in its own `useFrame`. Avoids React re-rendering the consumer (which would re-create useMemo'd uniforms and lose the surface boil clock).
- **Long-lived particle systems "pop in" when mounted mid-game.** Default behavior of staggering initial particle ages across lifetime (which looks great for ambient continuity from scene init) reads as "popping in mid-flight" when the component first mounts in response to a player action. Toggle: a `freshStart` prop that sets all initial ages to 0 so particles visibly emerge from their start state.
- **Preview-tool pointer events don't trigger CSS `:hover`.** Synthetic `MouseEvent`s don't change the browser's hit-test position. Hover-driven UI (like the new auto-hide top nav) has to be verified by inspecting CSS classes apply correctly + trusting the selector, not by simulating hover.
- **R3F's scene tree is invisible to standard DOM-fiber traversal.** R3F uses a separate custom-renderer reconciler. `__reactFiber$` on the canvas only finds DOM components and the R3F internals (`CanvasImpl`), not the scene's groups/meshes. To introspect the scene from outside, use `useThree` inside a child or expose a window-global; you can't walk into it from devtools-style fiber traversal.
- **HMR + cross-edit testing is flaky.** Multiple rapid file edits during browser verification can produce stale Vite "Failed to reload" errors that look like genuine syntax errors but aren't. After a flurry of edits, give HMR a beat to settle before trusting any reload-failure message — re-check console after the dust settles.

## Decisions / specs locked this session

- **Auto-hide top dev nav** is scoped to shipped-look tabs (currently just T2 — UI Test). Expand to other UI-Test tabs as their chromes mature.
- **Seeded RNG / primitive useMemo deps** is the codebase pattern for any procedural component going forward. Nebula's auto-seed-from-input-hash is a good template.
- **Wolf-Rayet activation reads as three sequenced beats.** Don't fold them back into one continuous animation — the user explicitly wanted "color → brightness → plumes" as distinct moments. The 1.5s / 2s / continuous timings are tunable but the sequencing is the point.
- **`freshStart`-style props** belong on any long-lived particle system that can be mounted mid-game. Default to staggered (good for ambient scene mounting); flip to fresh for activation moments.
- **`tempOverrideRef` / `brightnessOverrideRef` pattern on Star** is the path for any future "smooth visual transition on a star without re-rendering" need.
- **First-purchase narrator pool, top-third only.** Six slots, hash-keyed per upgrade. This is the locked positioning rule for first-purchase fades while the upgrade sheet remains open.

## Files touched (this session)

New: [T2UITestScene.tsx](src/T2UITestScene.tsx), [T2UIChrome.tsx](src/T2UIChrome.tsx), [T2UIChrome.css](src/T2UIChrome.css), [T2NarratorSurface.tsx](src/T2NarratorSurface.tsx).
Edited: [App.tsx](src/App.tsx) (fifth tab + auto-hide wiring), [T2Scene.tsx](src/T2Scene.tsx) (exports + +/- buttons + nudgeStackable + OpenCluster primitive-dep fix), [Nebula.tsx](src/Nebula.tsx) (seeded RNG + primitive deps), [OpenCluster.tsx](src/OpenCluster.tsx) (primitive deps), [FieldStarSystem.tsx](src/FieldStarSystem.tsx) (WR 3-phase transition + scale wrapper + override refs), [Star.tsx](src/Star.tsx) (tempOverrideRef + brightnessOverrideRef), [WolfRayetPlumes.tsx](src/WolfRayetPlumes.tsx) (freshStart prop), [index.css](src/index.css) (auto-hide tabs CSS + +/- nudge button styles).
Outside the experiments workspace: `../../CLAUDE.md` Causal-Connections-static rule clarification.

---

# Next session — Title screen mockup

Goal: build a mockup of the Dark Filaments title screen. Same workspace (Vite + R3F + Three.js + Cormorant Garamond/Inter type system) and same shipped-look bar as the T2 — UI Test surface. Pre-game / non-diegetic surface — different rules apply than the in-game chrome.

## Design seeds (from project context)

- **Aesthetic.** Deep field, contemplative. Real cosmology only. No exclamation points anywhere (including the title screen itself). The Cormorant Garamond italic + Inter type system from T1/T2 UI Test carries forward — title in Cormorant, supporting text in Inter at reduced weight/scale.
- **Title text.** "Dark Filaments" — likely the only required text. Subtitle, tagline, or marketing copy: open question. The voice rules (we-narrator, no second person, no metaphors that aren't physics, never explain) suggest restraint. A subtitle, if any, would be a quiet declarative — or a real cosmological coordinate, or absent.
- **Call to action.** "Begin" feels heavy-handed for this project. Possibilities to explore: a single quiet word ("begin", "enter"), no word with an interactive starting point (similar to the breathing tap-cue in T1UIChrome's onboarding), or a phrasal CTA in the narrator voice ("we begin"). Open.
- **Background scenery.** Likely deep field — `DeepStarfield` + `MidStarfield` + `MilkyWayBand` + possibly a single distant `Nebula`. Slow camera drift on a curated path (mirrors the "curated camera by default" decision from the T1 session). Maybe a single distant bright star or a hint of cosmic-web filament structure.
- **Settings affordance.** Same gear glyph as in-game (top-right) — for parity. Functional behaviour out of scope for the mockup.
- **Causal Connections.** Per the load-bearing rule extended this session, the number does not change during Act 1 — and a title screen is pre-Act-1. Decision needed: render the static number in the same lower-right position (establishing the iconography), or omit it entirely from the title and let it appear when the game proper begins. Lean toward rendering it static — the long pre-game stare at the same unchanged thirteen digits builds the perceptual weight the reveal later cashes in on.
- **Continue vs New game.** When a localStorage save exists, the title screen probably offers both. Out of scope for a v1 mockup unless trivial — could ship as a single "begin" path and add the branch later.
- **Audio.** Audio architecture is deferred per CLAUDE.md state-of-play. Out of scope for this mockup.

## Likely scope

1. **New "Title" tab** in App.tsx between `T1 — Solar System` and the existing UI test tabs (or at the very start). Auto-hide top dev nav scoped to include this tab too.
2. **New `TitleScene.tsx`** — Canvas with `DeepStarfield`, `MidStarfield`, `MilkyWayBand`, possibly `Nebula`, possibly a slow camera path. No OrbitControls (the title is non-interactive camera-wise — curated).
3. **New `TitleChrome.tsx`** + CSS — DOM chrome over the canvas. Title text, optional subtitle, CTA, settings gear, possibly the static Causal Connections number. Same `t2ui-*` → `titleui-*` selector-prefix pattern; duplicate the relevant Edge Vignette pieces rather than refactor to a shared component yet (refactor when patterns stabilise across three+ surfaces).
4. **Decision moments before coding** — title text exact form, subtitle yes/no, CTA wording, whether Causal Connections renders. These are aesthetic calls the user should make; ask them up front rather than implement-then-iterate.

## Files that will need editing / creating

New: `TitleScene.tsx`, `TitleChrome.tsx`, `TitleChrome.css`.
Edit: `App.tsx` (add tab + auto-hide-tier list). Possibly `index.css` if title-specific selectors need to share rules.
Reuse as-is: `DeepStarfield.tsx`, `MidStarfield.tsx`, `MilkyWayBand.tsx`, possibly `Nebula.tsx` (with explicit `seed` prop). Type system already loaded globally.

## Open questions to surface to the user up front

- **Title text exact wording.** "Dark Filaments" alone, or with a subtitle?
- **CTA wording / form.** Single word? Phrase? Wordless interactive starting point?
- **Causal Connections visibility on the title.** Static-from-minute-one (establishes the iconography), or wait for in-game start?
- **Scene framing.** Deep field at rest, slow curated camera drift, or a single named distant structure as a focal point?
- **Continue / New game branching.** Scope it for v1, or single-path mockup first?

## Pickup checklist

1. Skim this NOTES.md section's "Bugs hit and fixed" + "Decisions / specs locked" — the seeded-RNG / primitive-deps pattern and the override-ref pattern from this session are both directly applicable.
2. Read CLAUDE.md's voice rules (no exclamation points, no second person, real cosmology only, never explain) — these constrain title-screen copy too.
3. Read [T2UIChrome.tsx](src/T2UIChrome.tsx) and [T2UIChrome.css](src/T2UIChrome.css) as the templates for the chrome layout pattern + the type system in use.
4. Before writing code, ask the user the four open questions above. Title screen is largely aesthetic — don't implement first.
5. Verify the running dev server still works (regression: T1 — UI Test, T2 — UI Test, T1 → T2 cinematic). Add the new tab last so the rest of the app is known-good.

## Session-close addendum — Causal Connections rule cleanup

After the wrap-up, a doc-keeper + rules-guardian audit pass surfaced three follow-ups on the Causal Connections clarification. User answered all three in the closing turn; captured here so the next session inherits the resolutions.

1. **Act boundaries** confirmed and now anchored explicitly in CLAUDE.md: **Act 1 = T1 through T6 Local Group (the peak); Act 2 = T7 Galactic Cluster onward (the decline).** The "pre-Act-2" wording in the Causal Connections rule resolves to "T1 through T6 inclusive."
2. **"Named-connection break" definition** is now in CLAUDE.md inside the Causal Connections rule: *an authored narrative event in Act 2 in which a named cosmic structure — like the Eridanus Reach — falls below causal threshold as the universe expands, severing the player from a region they will never reach again. These are narrative beats authored against the cosmological decline, not upgrade losses.* So the ticks are sync'd to authored Act-2 story moments, not to player upgrade interactions.
3. **The 13-digit value `8,419,302,776,043` is a placeholder.** Marked as such in CLAUDE.md state-of-play (the Fork C bullet) and in [T2UIChrome.tsx](src/T2UIChrome.tsx)'s `CAUSAL_NUMBER_STATIC` comment. TO-DO before canon: a scientifically sound value (cosmologically motivated, of an order of magnitude that matches what the digits are supposed to represent). Any mock that displays this string should expect the digits to change.

**Implication for title-screen mockup.** Open question #3 in the pickup section ("Causal Connections visibility on the title — render static or omit?") is unchanged by these answers — that's still the user's call. If the answer is "render," the title screen uses the same placeholder digits as the in-game chromes and inherits the placeholder caveat. Worth re-asking up front.

**Implication for any future Design-Document pass.** The named-connection-break definition currently lives only in CLAUDE.md (inside the load-bearing rule). It might want a parallel home in [design-notes.md](../../Design%20Documents/design-notes.md) §6 as the canonical narrative source. Out of scope for the title-screen mockup session; flag for a future doc-keeper pass before T7 authoring begins.
