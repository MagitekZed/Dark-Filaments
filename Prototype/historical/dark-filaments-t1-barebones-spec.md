# Dark Filaments — Tier 1 Barebones Prototype Build Spec

## Purpose

This is a throwaway T1-only playable prototype for playtesting. The goal is to validate the design simulation's predictions against actual player behavior. Specifically, we want data on:

- Real clicks-per-minute and engagement vs. the simulator's assumed 45 cpm × 50%
- Whether the predicted "purchase every ~15 seconds" cadence feels rewarding or annoying
- Whether the cohesion-met → tier-end moment lands as a meaningful threshold
- Whether the cosmological voice in upgrade descriptions reads as flavorful or gets skipped
- Whether players intuitively grasp the speedrun vs. completionist choice (Magnetosphere and First Photons are completionist; the build does NOT mark them visually — we want to see if players notice on their own)
- General friction: confusing states, "why can't I buy this?", visible tracking of what's possible vs. what's been bought

**This is not a polished build.** No art beyond CSS defaults. No sound. No save/load. No tier 2. No tutorial. The experience IS the tutorial.

## Tech recommendation

A single `.html` file with vanilla JavaScript and CSS. No build step. Should run by opening the file in any modern desktop or mobile browser. The point is portability for sharing with playtesters — "open this file" is the entire setup.

If you prefer, you can split into `index.html` + `game.js` + `style.css`, but a single file is fine and probably preferable for distribution.

## Game loop

The game runs at **1 Hz** — one tick per second. Use `setInterval(tick, 1000)` or equivalent.

At each tick:
1. Add `MPS` (mass per second) to the player's mass total
2. Update all UI displays

When the player clicks the main click button:
1. Add `MPC` (mass per click) to total
2. Increment the click counter (used for instrumentation)
3. Update displays

When the player buys an upgrade:
1. Verify they can afford it and it isn't maxed
2. Subtract cost from mass
3. Increment that upgrade's level
4. Add cohesion (if the upgrade has a cohesion reward)
5. Recompute derived stats
6. Log the event (instrumentation)
7. Update displays

When `cohesion >= 1.0`:
- Enable the "End Tier 1" button (it should have been disabled and visibly muted before this)

When the player clicks "End Tier 1":
1. Stop the tick interval
2. Disable all interactive elements
3. Display a session report screen

## State

Suggested shape:

```js
const state = {
  mass: 0,
  cohesion: 0,
  levels: {
    "Solar Wind": 0,
    "Asteroid Belt": 0,
    "Stellar Coupling": 0,
    "Magnetosphere": 0,
    "Orbital Resonance": 0,
    "Heliopause": 0,
    "First Photons": 0,
  },
  ended: false,
  sessionStart: Date.now(),
  clicks: 0,
  log: [],  // see Instrumentation
};
```

## Stat formulas

For an upgrade at level `N` with base value `B`, additive `A`, and self-multiplier `S`, its self-contribution to a stat is:

```js
function selfContrib(N, B, A, S) {
  if (N === 0) return 0;
  return (B + N * A) * Math.pow(S, N);
}
```

Total of a stat across all upgrades:

```js
function computeStat(stat) {
  // stat is an object describing which fields to read for this stat
  // e.g. for MPC: { selfBase: "baseMpc", selfAdd: "addMpc", selfMult: "selfMpc",
  //                globalMult: "allMpc", baseValue: 1.0 }
  // for MPS:      { ..., baseValue: 0 }
  // for APS:      { ..., baseValue: 0 }
  let sum = 0;
  let mult = 1;
  for (const u of UPGRADES) {
    const N = state.levels[u.name];
    sum += selfContrib(N, u[stat.selfBase], u[stat.selfAdd], u[stat.selfMult]);
    mult *= Math.pow(u[stat.globalMult], N);
  }
  return (sum + stat.baseValue) * mult;
}
```

In T1:
- **MPC** = `(1.0 + sum_of_self_mpc_contribs) × prod_of_global_mpc_mults`
- **MPS** = `(0 + sum_of_self_mps_contribs) × prod_of_global_mps_mults`
- **APS** = always 0 (no autoclickers in T1)

## Upgrade values

All values for all 7 T1 upgrades. Display them top-to-bottom in the order shown.

| Name | Cost | Growth | Max | Cohesion+ | Self M/sec (B / + / ×) | Self M/click (B / + / ×) | × all M/sec | × all M/click | Completionist |
|---|---|---|---|---|---|---|---|---|---|
| Solar Wind | 7 | 1.16 | 99 | 0 | 0 / 0.020 / 1.0 | 0 / 0 / 1.0 | 1.0 | 1.0 | No |
| Asteroid Belt | 23 | 1.22 | 99 | 0 | 0 / 0.060 / 1.0 | 0 / 0 / 1.0 | 1.0 | 1.0 | No |
| Stellar Coupling | 17 | 1.28 | 99 | 0 | 0 / 0 / 1.0 | 0 / 0.500 / 1.0 | 1.0 | 1.0 | No |
| Magnetosphere | 80 | 1.80 | 3 | 0 | 0 / 0.500 / 1.0 | 0 / 0 / 1.0 | 1.0 | 1.0 | **Yes** |
| Orbital Resonance | 125 | 1.00 | 1 | 0.4 | 0 / 0 / 1.0 | 0 / 0 / 1.0 | 1.250 | 1.0 | No |
| Heliopause | 250 | 1.00 | 1 | 0.6 | 0 / 0 / 1.0 | 0 / 0 / 1.0 | 1.0 | 1.0 | No |
| First Photons | 350 | 1.00 | 1 | 0 | 1.0 / 0 / 1.0 | 0 / 0 / 1.0 | 1.0 | 1.200 | **Yes** |

All AC/sec fields (base, additive, self-mult) are `0 / 0 / 1.0` — they don't matter in T1. Include the schema for forward compatibility but don't worry about implementing autoclicker logic.

The "Completionist" flag is **internal metadata for instrumentation only**. Do NOT visually distinguish completionist upgrades in the UI. We want to test whether players notice the choice on their own.

## Cost formula

```js
function costToBuy(upgrade) {
  const L = state.levels[upgrade.name];  // current level
  if (L >= upgrade.maxLevels) return null;  // maxed
  return upgrade.initCost * Math.pow(upgrade.costGrowth, L);
}
```

Display "MAXED" instead of cost when the upgrade is at max level. The buy button should be disabled.

## Upgrade descriptions

These are part of what's being tested. Display them with each upgrade. Render as italic or in muted text — they should feel like flavor text the player encounters, not UI labels.

- **Solar Wind:** *Charged particles drift outward and return with company. We are pulling more than we used to.*
- **Asteroid Belt:** *The belt yields. Iron, ice, the slow gravel of the early system. Each rock finds us.*
- **Stellar Coupling:** *We pull harder. The center holds tighter.*
- **Magnetosphere:** *The system's invisible shell. Charged particles arc and return. We catch what would have escaped.*
- **Orbital Resonance:** *Periods align. The system breathes in time with us. Everything we touch becomes synchronous.*
- **Heliopause:** *We have reached the edge of our influence. Beyond it, the rest of the galaxy waits.*
- **First Photons:** *Light, finally. The first photons leave the surface and find us. Everything quickens.*

## UI requirements

Single-page layout. Rough hierarchy (not strict positioning):

1. **Mass display** — largest element on the page. Show current mass to 1 decimal place. This is the heartbeat of the game.
2. **Click button** — large and tap-friendly. Label: "Pull mass" or just "Pull". Each press = +MPC mass. Show MPC value next to the button so players can see what they're earning per click.
3. **Cohesion display** — show as a fraction "X.XX / 1.00" plus an optional progress bar. As cohesion fills, give it subtle visual emphasis (color shift, glow, whatever — minimal but noticeable).
4. **Stats summary** — small text, persistent: MPC, MPS, current cpm (sampled over the last 30 seconds for player feedback).
5. **Upgrades list** — for each upgrade, render:
   - Name
   - Level indicator: "Lv 3", "Owned", or "MAXED"
   - Description (italic, muted)
   - Cost (or "MAXED")
   - Buy button — disabled if can't afford or maxed
6. **End Tier 1 button** — disabled and visually muted until `cohesion >= 1.0`. When enabled, make it prominent. Clicking it ends the session.
7. **Session report screen** — replaces the play UI when End is clicked.

### Session report contents

- Total play time (`mm:ss`)
- Final mass
- Final level for each upgrade (table)
- Average clicks per minute
- Total clicks
- Whether each completionist upgrade was bought (Magnetosphere fully maxed? First Photons owned?)
- A "Copy session log" button that copies the full JSON log to clipboard

### Visual style

Pick a single subdued color scheme. Cosmological palette suggestions: dark blue/indigo background, off-white text, accent color for affordable buttons (pale gold or cyan). Avoid loud or playful colors. The mood is contemplative.

Don't spend time on layout. A single column on mobile, two columns on desktop is fine. Use `flexbox` or `grid` for whatever simple arrangement comes naturally.

## Instrumentation

Every meaningful event gets logged to `state.log`:

```js
state.log.push({
  t_ms: Date.now() - state.sessionStart,
  type: "click" | "purchase" | "tick" | "end",
  payload: { /* event-specific */ }
});
```

What to capture per event type:

- **click**: `{ mass_after, mpc_at_click, cpm_window }` (cpm_window = clicks/min over last 30s)
- **purchase**: `{ upgrade, new_level, cost_paid, mass_after, cohesion_after, completionist }`
- **tick**: every 5th tick or so (don't spam): `{ mass_after, mps, mpc, cpm_window }`
- **end**: `{ final_mass, final_levels, total_clicks, total_time_ms, completionist_complete: { magnetosphere: bool, firstPhotons: bool } }`

Also `console.log(JSON.stringify(event))` every event so playtesters can grab logs from the browser console even if the clipboard button doesn't work for them.

## Out of scope

Do NOT build any of the following — explicitly skip:

- Save/load (refresh = start over; that's fine)
- Animations beyond CSS hover/transition states
- Sound or music
- Tutorial or onboarding popups
- Tier 2 or any post-T1 logic
- Localization (English only)
- Accessibility audit beyond sane defaults (semantic HTML, contrast)
- Server-side anything
- Build tooling (no webpack, no bundler, no TypeScript transpile step)

## Acceptance checklist

When complete, the prototype should:

- [ ] Run as a single `.html` file (or 2-3 sibling files) opened directly in a browser
- [ ] Tick at 1Hz, adding MPS mass per tick
- [ ] Each click adds MPC mass and increments the click counter
- [ ] All 7 upgrades buyable when affordable, with correct costs and effects per the table above
- [ ] Cost grows as `init_cost × growth^current_level`
- [ ] One-shots become unpurchasable and labeled "Owned" after purchase
- [ ] Magnetosphere maxes at 3 levels and labeled "MAXED" after the third
- [ ] Cohesion accumulates ONLY from OR (+0.4) and HP (+0.6) — no other upgrade contributes
- [ ] End Tier button disabled and muted until cohesion ≥ 1.0
- [ ] End Tier press freezes state, displays the session report
- [ ] Session log captured per spec
- [ ] "Copy log" button on report writes the log JSON to clipboard
- [ ] Sanity-tested: a speedrun playthrough (skip Mag and FP) reaches the End button in roughly 8-15 minutes; a completionist playthrough (buy everything maxed) reaches it in roughly 13-27 minutes, depending on how aggressively the tester clicks

## Reference: simulation predictions

For comparing real player data against:

| Engagement | Speedrun | Completion | Premium | Click share |
|---|---|---|---|---|
| 45 cpm × 50% (casual baseline) | 15.17 min | 27.33 min | 80% | 64.5% |
| 45 cpm × 90% (engaged) | 9.67 min | 16.67 min | 72% | 66.6% |
| 60 cpm × 90% (high engagement) | 7.67 min | 13.17 min | 72% | 71.3% |

If real-player data falls *outside* this range, the simulation is miscalibrated and we'll need to revisit assumptions before designing T2. If it falls *inside* the range, we're good to scale the model up.
