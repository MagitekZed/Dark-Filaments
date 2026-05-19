# Dark Filaments — Gameplay Design (v0.1)

> First draft of the upgrade tree, mechanical structure, and gameplay systems. Numbers and scaling are deliberately deferred — this document defines *what* upgrades exist and *what they do* in conceptual terms, leaving exact values for the spreadsheet model phase.

This is the gameplay companion to the design notes (v0.5), voice samples (v0.1), and visual design (v0.1) docs.

---

## 1. Design Constraints (recap from main doc)

- Two currencies: **Mass** (frequent) and **Cohesion** (rare, gates tier progression)
- Idle game — both active clicking and passive accumulation
- ~10 tiers from Solar System to Causal Horizon
- No upgrade may directly affect the hidden Causal Connections counter
- Act 1 / Act 2 voice shift in *descriptions* only; upgrade *names* stay astronomically clean throughout
- Real cosmological vocabulary only

---

## 2. Mechanical Structure

### Upgrade types

Three kinds of upgrades, with different roles:

- **Stackable upgrades** — buy multiple times; each level adds a multiplier or additive bonus. The bread and butter of an idle game's "number-go-up." Example: *Tidal Streams* — each level adds another autoclicker. Always available within their tier; cost scales with each purchase.
- **One-shot upgrades** — buy once, permanent. Big moments. Example: *Dark Matter Halo* — a singular structural upgrade that changes how passive accumulation works. Often gated behind specific conditions (reach Tier 4, accumulate X Mass at once).
- **Tier transitions** — special one-shots that advance you to the next scale. Cost Cohesion, not Mass. Triggers the camera pull-out, the tier-transition flavor line, the audio chain advancement, and unlocks a new batch of upgrades.

### Resource flow

- **Mass** comes from clicking and from passive accumulation. Spent on most upgrades.
- **Cohesion** comes from one-shot upgrade purchases (each one-shot rewards a small amount) and from tier-transition completions (each one rewards a moderate amount). Spent only on tier transitions and a small number of high-impact one-shots.

This keeps Cohesion feeling *significant* — you don't grind for it the way you grind for Mass. It accumulates as a side effect of meaningful progress.

### Unlock structure

Each tier transition unlocks a new batch of 4–8 upgrades. Earlier upgrades remain available — they don't expire — but their stackable purchases get exponentially more expensive, naturally pulling the player toward newer upgrades without forcing them to abandon old ones.

### Tier transitions

A tier transition is the one upgrade purchase that *isn't* in the upgrade menu. It appears as its own moment when the player has accumulated enough Cohesion. A small persistent prompt appears in the UI when a transition is available. The player chooses when to take it — there's no auto-advance. (Some players will defer transitioning to maximize Mass accumulation at the current scale; this is intentional and fine.)

### Autoclickers

Several upgrades function as autoclickers — they trigger periodic "pulls" automatically. These should *visually* show themselves: when *Tidal Streams* fires, the player sees a small pulse on screen, just like a manual click. The player should always feel like things are happening, even when idle.

### Click multipliers

The player's click power scales linearly with click upgrades. The number on the button isn't shown, but the *reactivity* of the scene reflects it — bigger clicks = bigger visual pulses.

### Soft caps and the descent

In Act 2, several upgrades — particularly the late ones — have *diminishing returns* baked in. *Final Approach* gives +500% pull rate but the description hints that there's less to pull. The player's effective progression *slows* even as their nominal multipliers increase. This is the math of the descent expressed in upgrade design: number-go-up doesn't help when the universe is running out.

---

## 3. The Upgrade Tree by Tier

Each tier has a mix of:
- 1–2 **passive pull** upgrades (Mass per second)
- 1–2 **click power** upgrades (Mass per click)
- 1–2 **autoclickers** (special pull events)
- 1–2 **one-shots** (structural, named, memorable)
- 1 **tier transition** (advances to next tier; costs Cohesion)

Counts are rough — some tiers have more, some fewer, depending on what's interesting at that scale.

---

### Tier 1 — Solar System (tutorial)

Light upgrade content. The goal here is to teach the loop: click, accumulate Mass, buy upgrade, watch number go up, feel good. The first 10 minutes of gameplay live here.

| Upgrade | Type | Effect | Description voice (Act 1: confident, narrator's "we") |
|---|---|---|---|
| **Solar Wind** | Stackable passive | +Mass/sec | *Charged particles drift outward and return with company. We are pulling more than we used to.* |
| **Asteroid Belt** | Stackable passive | +Mass/sec | *The belt yields. Iron, ice, the slow gravel of the early system. Each rock finds us.* |
| **Stellar Coupling** | Stackable click | +Mass/click | *We pull harder. The center holds tighter.* |
| **Orbital Resonance** | One-shot | Doubles base passive rate | *Periods align. The system breathes in time with us. Everything we touch becomes synchronous.* |
| **Heliopause** | One-shot | Unlocks Tier 2 transition | *We have reached the edge of our influence. Beyond it, the rest of the galaxy waits.* |

Tier transition cost: small Cohesion amount (tutorial-friendly).

---

### Tier 2 — Stellar Neighborhood

The first sense of scale beyond a single star system. Other stars become visible; the player starts to understand they're part of something larger.

| Upgrade | Type | Effect | Description voice |
|---|---|---|---|
| **Tidal Streams** | Stackable autoclicker | +1 autoclick per level, slow | *Tendrils of matter flow toward us between actions. We do not need to be looking.* |
| **Stellar Drift** | Stackable passive | +Mass/sec | *Nearby stars pass close enough to give us their dust. Some of it stays.* |
| **Gravitational Lensing** | Stackable click | +Mass/click | *Our gravity bends the light of distant things. What bends, we may also pull.* |
| **Binary Partner** | One-shot | +1 powerful slow autoclicker | *A second star answers our pull. We are no longer alone in our gravity.* |
| **Open Cluster** | One-shot | Unlocks Tier 3 transition | *A loose family of stars finds the same center. Many became one.* |

---

### Tier 3 — Galactic Arm

The pinwheel becomes visible. Star formation regions glow in the visual scene. Mechanical content thickens — the player has the basic loop down, and now we add depth.

| Upgrade | Type | Effect | Description voice |
|---|---|---|---|
| **Dust Lane Density** | Stackable passive | +Mass/sec | *The dark bands within our arm grow heavier. New stars will be born from them. They will all be ours.* |
| **HII Region** | Stackable passive | +Mass/sec, glow effect | *A nursery, hot and pink. Stars form by the dozen. The youngest universe within us.* |
| **Proper Motion** | Stackable click | +Mass/click | *We tug. Stars far from our center adjust their paths in answer.* |
| **Spiral Density Wave** | Stackable autoclicker | +1 autoclick per level | *A wave of compression travels through our arm. Where it passes, stars are pressed into being.* |
| **Globular Cluster** | One-shot | Adds a permanent passive bonus tied to a "named" cluster (the upgrade visually adds a small bright sphere to the scene) | *A dense ancient sphere of stars binds to us. Twelve billion years old. Older than most things we will ever consume.* |
| **Active Nucleus** | One-shot | Unlocks Tier 4 transition | *Our center brightens. Something massive at the heart of us begins to feed.* |

---

### Tier 4 — Galaxy *(first major anchor)*

The first "wow" moment. The full procedural spiral becomes the playfield. Mechanically, this is where the game opens up — multiple parallel upgrade lines, the first sense that there are choices to make.

| Upgrade | Type | Effect | Description voice |
|---|---|---|---|
| **Galactic Rotation** | Stackable passive | +Mass/sec | *Two hundred billion stars turn around our center. Each rotation brings them closer.* |
| **Bar Structure** | One-shot | Unlocks a second passive upgrade line | *A great bar of stars forms across our middle. Matter flows along it from the rim to the core.* |
| **Black Hole Core** | One-shot | Doubles all click power; permanent | *Sagittarius A\*. Four million solar masses, hungry. We are not just pulling now. We are devouring.* |
| **Dark Matter Halo** | One-shot | Significant passive multiplier | *We are larger than we appear. A halo of unseen matter cradles everything we have. The visible part was always the small part.* |
| **Satellite Galaxies** | Stackable autoclicker | Each level adds a small "satellite" autoclicker, visualized as a small companion galaxy in the scene | *The Magellanic Clouds. Sagittarius Dwarf. Smaller galaxies we have captured. They turn around us, feeding us as they go.* |
| **Stellar Coupling II** | Stackable click | +Mass/click (replaces Tier 1 stackable's growth ceiling) | *We pull at galactic scale now. A single act of attention reaches across a hundred thousand light-years.* |
| **Local Group** | One-shot | Unlocks Tier 5 transition | *Andromeda answers. The smaller galaxies answer. We are about to become the largest thing we have ever been.* |

---

### Tier 5 — Local Group *(THE PEAK — most polish; emotional climax of Act 1)*

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

---

### Tier 6 — Galactic Cluster *(the descent has begun, in voice — the player doesn't yet know)*

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

### Tier 7 — Supercluster *(Act 2 has clearly begun)*

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

### Tier 8 — Filament *(the title resonates — the player IS a Dark Filament)*

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

### Tier 9 — Cosmic Web *(late descent)*

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

### Tier 10 — Causal Horizon *(endgame)*

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

- **Tidal Streams**: a small particle pulse on the playfield
- **Spiral Density Wave**: a wave traveling along the visible spiral arm
- **Satellite Galaxies**: each satellite emits a small pulse on its own rhythm
- **Dwarf Galaxy Cascade**: stacked satellite pulses
- **Galaxy Mergers**: occasional bright collision events between visible galaxies
- **Galaxy Migration**: galaxies along the filament shift in small visible jolts
- **Last Reach**: a faint pulse from somewhere off-frame; the player sees the *response*, not the source

Autoclickers shouldn't pile into noise — frequencies are tuned so the screen feels alive but never busy. Late-game autoclickers fire less often than early-game ones, mirroring the descent.

---

## 7. Cohesion as a Gating Mechanism

Cohesion is earned in small amounts from one-shot upgrades and larger amounts from tier transitions themselves. The player accumulates Cohesion as a side effect of meaningful progression, not by grinding.

This means:
- A player who only does stackable Mass upgrades and never buys one-shots will earn Cohesion slowly
- A player who pursues every one-shot will reach tier transitions faster
- Tier transitions cost increasing amounts of Cohesion as the game progresses

There's an implicit recommendation here: the player should be encouraged to engage with the named one-shots (which carry the strongest flavor and lore) by making them mechanically rewarding. The economy steers players toward the parts of the game with the best writing. The flavor *is* the reward.

---

## 8. What Is *Not* Here (deliberately deferred)

These need a separate spreadsheet pass:

- Exact Mass costs and scaling curves for stackable upgrades
- Exact Cohesion costs for tier transitions
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
