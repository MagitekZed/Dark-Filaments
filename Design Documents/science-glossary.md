# Dark Filaments — Science Glossary

> Reference document for all locked science terms used in the game.
> Current scope: T1–T4. Will extend to T5+ as later tiers retune.

**Version 0.3 · 2026-05-14 (T4 retune landing pass)**

## Changelog

- **0.3 (current)** — 2026-05-14 T4 retune landing pass. **Sgr B2 corrected T5 → T4** at three sites: forward-pointer block (Sgr B2 entry removed from forward-pointers and promoted to a full T4 entry in the new T4 section body); cross-references block (chain re-ordered to chronological-by-tier: Sgr Stream T3 → Sgr B2 **T4** → Sgr A* T5); precision-risk #6 (T5 reference → T4 reference; retune landing date noted). **Active Nucleus entry added to T4 body** per science-director Phase 1 recommendation, with the "Active Nucleus" (design name) vs "Active Galactic Nucleus" (literal astronomical term) gloss. **T4 entities glossed** (Phase 1 scope): Galactic Arm (tier definition), Dust Lane Density, HII Region, Proper Motion, Spiral Density Wave, High-Velocity Cloud, Galactic Bulge (with tiered-consolidation per-level physical-arc context), Globular Cluster. Forward-pointer block now contains only T5+ entities (Sgr A*, Hot Coronal Halo). No T1-T3 prose corrections.
- **0.2** — 2026-05-13 evening post-audit. Added Wolf-Rayet Star to T2 section (was missing — added to design in iter #23 same day glossary v0.1 was drafted). Added Sgr A* / Sgr B2 forward-pointer entries (T5 territory under 11-tier ladder). Added Sgr B2 mass precision-risk note flagged for T5 retune. No T1-T3 prose corrections — T1-T3 physics audited clean.
- **0.1** — 2026-05-13. Initial T1-T3 glossary pass — tier definitions, all T1-T3 upgrade entries, named structures in flavor, cross-references, precision risks 1-5, sources.

## How to use this doc

Each entry captures the **name as it appears in the game**, what **type** of element it is (tier name / stackable / one-shot / named structure in flavor), the **tier(s)** in which it appears, a **short physics or astronomy definition**, the **design reason** for placing it where it sits, and a **real-world anchor** (catalog name, paper, or canonical value).

This is a curator's reference, not narrator prose. Definitions are kept to one or two sentences. Where the real anchor is precise (Draco mass-to-light = ~440), the number is cited. Where the term is loose or generic (Stellar Neighborhood as a category rather than a specific catalog object), that looseness is flagged.

Sources are linked inline. The "Precision risks" section at the end flags any term whose in-game framing is more specific than the published literature strictly supports.

This doc may eventually become a player-facing artifact (an extension of the Inventory reveal at T11, or a no-log carve-out). For now it's a curator's reference for the design team.

---

## T1 — Solar System (~1 M☉)

**Type:** Tier name
**What it is:** The Sun plus its bound system — eight planets, asteroid belt, Kuiper belt, Oort cloud, the heliosphere. Total mass ~1.0014 M☉; the Sun dominates by orders of magnitude. The bound radius to the gravitational influence (the Hill sphere of the Sun against the galaxy) extends to roughly 1–2 light-years.
**Why it fits:** The smallest scale at which "we" is meaningful as a structure. T1 is the tutorial tier; the player begins as a star with planets.
**Anchor:** [Solar System (Wikipedia)](https://en.wikipedia.org/wiki/Solar_System); 1 M☉ = 1.989×10³⁰ kg (IAU 2015 nominal).

### T1 upgrades

**Solar Wind** — *Stackable, T1.* The continuous outflow of charged particles (mostly protons and electrons) from the Sun's corona at ~400 km/s, carrying ~10⁹ kg/s of mass into the solar system and shaping the heliosphere. Fits T1 because it's the smallest-scale "we reach outward" effect a single star has on its surroundings; first upgrade in the game. [Solar wind (NASA)](https://science.nasa.gov/heliophysics/focus-areas/solar-wind/).

**Asteroid Belt** — *Stackable, T1.* The region between Mars and Jupiter containing millions of rocky bodies; total mass ~3% of the Moon (~2.4×10²¹ kg, ~0.0004 M☉ — small but visually iconic). Composed of C-type, S-type and M-type asteroids with the largest, Ceres, ~940 km across. Fits T1 because it's the most familiar non-stellar mass reservoir in our own system. [Asteroid belt (NASA)](https://science.nasa.gov/solar-system/asteroids/).

**Stellar Coupling** — *Stackable click, T1.* Loose framing of gravitational coupling — the Sun's mass interacting with bound bodies through Newtonian gravity. The naming is consistent with the cross-tier "Coupling" family (T5 Galactic Coupling, T6 Group Coupling, etc.) that frames each tier's click upgrade as the player's gravitational pull at that scale. Generic term rather than a specific catalog reference; honest "physics in the subject slot" framing of the player's agency. (Precision-risk: see flagged terms below.)

**Magnetosphere** — *Stackable completionist, T1.* The region around the Sun (or any magnetized body) where its magnetic field dominates over the surrounding plasma; for the Sun, this is the heliosphere; for Earth, it's the magnetic cavity extending to ~10 Earth radii sunward and a long tail downwind. Charged particles arc and return along field lines rather than escaping. Fits T1 as the "invisible shell" of the system — what we catch that would otherwise escape. [Magnetosphere (NASA)](https://science.nasa.gov/heliophysics/focus-areas/magnetosphere-ionosphere/).

**Orbital Resonance** — *One-shot, T1.* A configuration where orbiting bodies exert regular periodic gravitational influence on each other because their orbital periods relate as a ratio of small integers (e.g., Jupiter's moons Io:Europa:Ganymede = 1:2:4; Neptune:Pluto = 2:3). The system "breathes in time." Fits T1 because it formalizes the design's "things in our system stay in our system" intuition mechanically — the resonance keeps mass bound. [Orbital resonance (Wikipedia)](https://en.wikipedia.org/wiki/Orbital_resonance).

**Heliopause** — *One-shot, T1 transition gate.* The boundary where the solar wind's pressure equals that of the surrounding interstellar medium — the outermost edge of the Sun's direct influence. Crossed by Voyager 1 in August 2012 at ~121 AU. Beyond it is true interstellar space. Fits T1 perfectly as the *transition gate*: it is literally the edge of our reach as a solar system, the threshold to the next scale. [Heliopause (NASA Voyager)](https://voyager.jpl.nasa.gov/mission/interstellar-mission/).

**First Photons** — *One-shot completionist, T1.* In stellar context: the moment a protostar's core temperature crosses the hydrogen-fusion threshold (~10⁷ K) and the first thermonuclear photons begin diffusing outward. The Sun's "first light" event ~4.6 Gyr ago. Fits T1 as the rhetorical completionist anchor — the moment "we" began as a star, retroactively claimed. [Star formation (NASA)](https://science.nasa.gov/universe/stars/).

---

## T2 — Stellar Neighborhood (~10³ M☉)

**Type:** Tier name
**What it is:** A few-hundred-parsec volume around the Sun containing the local disk's nearest stars, gas, and dust. The "neighborhood" is a generic descriptor anchored on the Pleiades-class open cluster scale (600–4,000 M☉) — a Pleiades-sized stellar association would be ~10³ M☉, comfortably matching the tier target.
**Why it fits:** Bridges the day-1 calendar gap between Solar System (~1 M☉) and Dwarf Spheroidal (~10⁶·⁵ M☉). The phrase "we are not alone" lands here — a few thousand other suns.
**Anchor:** [Pleiades (Wikipedia)](https://en.wikipedia.org/wiki/Pleiades) (M45, ~800 M☉, ~135 pc); [Solar neighborhood (Wikipedia)](https://en.wikipedia.org/wiki/Solar_neighbourhood).
**Precision note:** "Stellar Neighborhood" is not a single cataloged object. It's a category name anchored on Pleiades-class objects but reads loose by design — see flagged terms.

### T2 upgrades

**Stellar Kinematics** — *Stackable passive, T2.* The study of stellar motions in three-dimensional space: proper motion (transverse, measured on the sky), radial velocity (along the line of sight, measured spectroscopically), and parallax-derived distance. Each local star has its own vector through the galaxy. Fits T2 as the moment "we" first measure that other stars are *moving*. [Stellar kinematics (Wikipedia)](https://en.wikipedia.org/wiki/Stellar_kinematics).

**Local Bubble** — *Stackable passive, T2.* A cavity in the local interstellar medium ~1000 light-years across (current best estimate; see precision note), filled with hot (~10⁶ K) X-ray-emitting plasma at very low density (~0.05 atoms/cm³). Formed by a series of supernovae from the Scorpius–Centaurus association ~14 Myr ago. The Sun has been transiting it for the last 5–10 Myr. Fits T2 as the *first named structure* in the local interstellar medium. [Local Bubble (Wikipedia)](https://en.wikipedia.org/wiki/Local_Bubble); [Phys.org overview](https://phys.org/news/2025-04-blew-local.html).
**Precision note:** Game flavor says "three hundred light-years across." Modern measurements put it closer to 1,000 ly. See flagged terms.

**Microlensing** — *Stackable click, T2.* Gravitational lensing on a stellar scale: a foreground star's gravity bends the light of a more distant background star, briefly brightening it as the alignment passes. Used in Galactic surveys (OGLE, MACHO) to detect planets and dark compact objects. Fits T2 because it requires *two stars in alignment* — the click is the moment of crossing. [Microlensing (NASA)](https://science.nasa.gov/exoplanets/microlensing/); [Wikipedia](https://en.wikipedia.org/wiki/Gravitational_microlensing).

**Roche Lobe Overflow** — *Stackable APS, T2.* In a close binary system, the Roche lobe is the volume around each star where material is gravitationally bound to that star. If a star expands past its Roche lobe, mass flows through the inner Lagrange point (L1) onto its companion. The mechanism behind cataclysmic variables, X-ray binaries, and Type Ia supernova progenitors. Fits T2 as the *autoclicker* — a continuous mass stream between two bodies, the donor and the accretor. [Roche lobe (Wikipedia)](https://en.wikipedia.org/wiki/Roche_lobe).

**Brown Dwarf** — *Stackable max-5 completionist, T2.* A substellar object whose mass (~13–80 Jupiter masses, ~0.012–0.08 M☉) is too low to sustain hydrogen fusion but high enough for brief deuterium fusion. Cool, infrared-bright, "mass that never lit." Spectral types L, T, Y. Fits T2 as the completionist anchor on **unlit gravitating mass** — a physical first cousin to dark matter, foreshadowing T3's Subhalo. [Brown dwarf (NASA)](https://science.nasa.gov/exoplanets/brown-dwarfs/); [Wikipedia](https://en.wikipedia.org/wiki/Brown_dwarf).

**Wolf-Rayet Star** — *Stackable max-3 completionist, T2.* A class of massive (~10–25 M☉) evolved hot stars whose outer hydrogen envelope has been stripped by intense stellar winds (mass-loss rate ~10⁻⁶–10⁻⁴ M☉/yr; wind speed ~400–3,000 km/s), exposing the products of CNO-cycle and helium burning at the surface. Subdivided into WN (nitrogen-dominant), WC (carbon-dominant), and WO (oxygen-dominant) spectral types. WR phase lifetime ~10⁵ yr; ends typically as a Type Ib/Ic supernova. The Milky Way hosts ~600 known WR stars. Fits T2 as the third completionist — first Act 1 line carrying the "mass is leaving us" beat; foreshadows Act 2 loss without breaking T2's "we are building" surface. Sources: [Wolf–Rayet star (Wikipedia)](https://en.wikipedia.org/wiki/Wolf%E2%80%93Rayet_star); [Sander & Vink 2020, MNRAS (arXiv 1910.12886)](https://arxiv.org/abs/1910.12886).

**Binary Partner** — *One-shot, T2.* A companion star in a bound binary system. Roughly half of all Sun-like stars are in binaries or higher multiples. Fits T2 because the moment "we have a companion" is the most direct rendering of "we are not alone." Synergy provider to Microlensing — a partner is what makes the alignment readable. [Binary star (Wikipedia)](https://en.wikipedia.org/wiki/Binary_star).

**Peculiar Velocity** — *One-shot, T2.* A star's velocity component *not* shared with the local galactic rotation — the residual after subtracting bulk disk rotation. The Sun's peculiar velocity is ~13 km/s relative to the Local Standard of Rest. Fits T2 as the moment "we read our own motion," distinguishing what's individually ours from what we inherit from the galaxy. [Peculiar velocity (Wikipedia)](https://en.wikipedia.org/wiki/Peculiar_velocity).

**Open Cluster** — *One-shot, T2 transition gate.* A loosely gravitationally bound group of a few hundred to a few thousand stars formed from the same molecular cloud, typically a few light-years across. Open clusters dissolve over hundreds of millions of years as stars wander off. Examples: Pleiades, Hyades, Beehive Cluster. Fits T2 as the *transition gate* — "many became one" is the bridge to a larger scale. [Open cluster (Wikipedia)](https://en.wikipedia.org/wiki/Open_cluster); Pleiades = M45.

**Moving Group** — *One-shot completionist, T2.* A group of stars that share a common space motion and origin — they were born together but have since drifted apart enough to no longer look like a cluster. Examples: Ursa Major Moving Group, AB Doradus Moving Group. Fits T2 as the completionist coda — the *drift resolves*; even apparent dispersion has a shared origin. [Stellar kinematics (Wikipedia, §Moving groups)](https://en.wikipedia.org/wiki/Stellar_kinematics#Moving_groups).

---

## T3 — Dwarf Spheroidal (~10⁵–10⁷ M☉)

**Type:** Tier name
**What it is:** A class of small, gas-poor, dark-matter-dominated satellite galaxies of larger hosts like the Milky Way. Examples: Draco, Ursa Minor, Sculptor, Sextans, Carina, Leo I, Leo II, Fornax. Stellar masses 10⁵–10⁷ M☉; total masses (including dark matter) reach 10⁸ M☉ — mass-to-light ratios up to ~440 in Draco's case make them the most dark-matter-dominated objects known.
**Why it fits:** The first patient-universe return tier — the player ends a session in T3 and returns to find mass has accumulated. The narrative beat *"the dark matter we are embedded in has a name"* lands at the most dark-matter-dominated galaxy class in the Local Group.
**Anchors:** [Draco Dwarf (Wikipedia)](https://en.wikipedia.org/wiki/Draco_Dwarf); [Walker, "Dark Matter in Milky Way Dwarf Satellites" (NED level-5 review)](https://ned.ipac.caltech.edu/level5/Sept17/Walker/Walker5.html); Mateo (1998), *ARA&A* 36, 435.

### T3 upgrades

**Population II** — *Stackable passive, T3.* Old, metal-poor stars (low abundance of elements heavier than helium) formed in the early universe, before successive stellar generations enriched the interstellar medium. Found predominantly in the galactic halo, in globular clusters, and in dwarf spheroidals. Contrasts with Population I (young, metal-rich, in the disk). Fits T3 because dwarf spheroidals are *almost entirely* Population II — the surviving fossils of the earliest star formation. [Stellar population (Wikipedia)](https://en.wikipedia.org/wiki/Stellar_population).

**Subhalo** — *Stackable passive (hidden-channel), T3.* A smaller dark matter halo bound within a larger one — predicted by ΛCDM cosmology to populate galaxy halos in their thousands. Some host visible dwarf galaxies; most are dark. The "missing satellites problem" is the tension between predicted and observed counts. Fits T3 as the first **hidden-mechanics** upgrade in the game — its mechanical effect is invisible on the stats line, honoring SD-2 ("dark matter is inferred, not rendered"). [Subhalo / Dark matter halo (Wikipedia)](https://en.wikipedia.org/wiki/Dark_matter_halo); [Missing satellites problem (Wikipedia)](https://en.wikipedia.org/wiki/Missing_satellites_problem).

**RR Lyrae** — *Stackable click, T3.* Horizontal-branch pulsating variable stars with periods of ~0.2–1.0 days, old (>10 Gyr) and metal-poor. Their well-defined absolute magnitude makes them standard candles for distance measurement out to ~100 kpc. Abundant in globular clusters and dwarf spheroidals. Fits T3 as the click upgrade — *each beat is a measurement*; the click rhythm and the star's pulsation rhyme. [RR Lyrae variable (Wikipedia)](https://en.wikipedia.org/wiki/RR_Lyrae_variable).

**Velocity Dispersion** — *Stackable APS completionist, T3.* The statistical spread of line-of-sight velocities of stars within a gravitationally bound system. For a virialized system, σ² ∝ M/R, which lets observers infer total dynamical mass from observed motions. In dwarf spheroidals, the measured σ (~10 km/s, far higher than visible mass would predict) is the **smoking gun** for dark matter. Fits T3 as the completionist autoclicker — "the number that does not fit is the number we have been looking for." [Velocity dispersion (Wikipedia)](https://en.wikipedia.org/wiki/Velocity_dispersion).

**Orphan Stream** — *One-shot, T3.* A long, cold stellar stream in the Milky Way halo discovered independently in 2006 by Belokurov et al. (SDSS) and Grillmair — named "Orphan" because no obvious progenitor was identified at discovery (later associations with Grus II and the Chenab Stream remain debated). Extends ~150 kpc across the sky; ~2° wide. Fits T3 because it is **a galaxy that died and left a shape** — the obituary grammar T2 was rehearsing. [Belokurov et al. 2007, ApJ 658, 337](https://iopscience.iop.org/article/10.1086/511302); [Piercing the Milky Way: an all-sky view of the Orphan Stream (Koposov et al. 2019)](https://academic.oup.com/mnras/article/485/4/4726/5318650).

**Sculptor Dwarf** — *One-shot, T3.* A dwarf spheroidal galaxy ~86 kpc from the Milky Way in the constellation Sculptor, discovered by Shapley in 1937. Stellar mass ~10⁶ M☉, mass-to-light ratio ~10 (less DM-dominated than Draco but still substantial). Contains two distinct stellar populations of differing age and metallicity — early evidence of episodic star formation in dSph systems. Fits T3 as a *resolvable* dwarf galaxy — the line "the first time we have looked at another galaxy and seen the people in it" reflects that individual stars are visible at this distance. [Sculptor Dwarf Galaxy (Wikipedia)](https://en.wikipedia.org/wiki/Sculptor_Dwarf_Galaxy).

**Draco Dwarf** — *One-shot completionist, T3.* A dwarf spheroidal ~80 kpc from the Milky Way in the constellation Draco, discovered by Wilson in 1955. Among the most dark-matter-dominated objects known: mass-to-light ratios from kinematic analyses span ~60 (Mateo 1998) to ~440 (high-end estimates from later velocity-dispersion studies); the Milky Way halo's most extreme DM-to-stars ratio per resolved system. Fits T3 perfectly as the upgrade carrying the tier's emotional weight — *"the dark matter we have been embedded in this whole time has a name."* [Draco Dwarf (Wikipedia)](https://en.wikipedia.org/wiki/Draco_Dwarf); [Mateo 1998, ARA&A](https://ned.ipac.caltech.edu/level5/Sept17/Walker/Walker5.html).

**Sagittarius Stream** — *One-shot, T3 transition gate.* The most prominent tidal stellar stream around the Milky Way, produced by ongoing disruption of the Sagittarius dwarf spheroidal galaxy (discovered by Ibata, Gilmore, & Irwin 1994). Wraps the galaxy more than 360° in the sky; both leading and trailing arms span the celestial sphere. The progenitor is ~25 kpc from the Galactic center, being torn apart over each ~1 Gyr orbit. Fits T3 as the transition gate — *"we are doing this. The arm we are about to become is being made from the things we are eating."* [Ibata, Gilmore, & Irwin 1994, Nature 370, 194](https://www.nature.com/articles/370194a0); [Sagittarius Stream (Wikipedia)](https://en.wikipedia.org/wiki/Sagittarius_Stream).

---

## T4 — Galactic Arm (~10¹⁰ M☉)

**Type:** Tier name
**What it is:** A major spiral structure of a galaxy — a coherent density-wave-driven concentration of stars, gas, dust, and ongoing star formation winding outward from the galactic center. The Milky Way hosts roughly four major arms (Perseus, Scutum-Centaurus, Sagittarius, Norma, plus the Local/Orion spur) containing on the order of 10¹⁰ M☉ of stellar content across the spiral structure (Milky Way total disk ~6 × 10¹⁰ M☉).
**Why it fits:** The "arm, turning" tier — the player's structure becomes a place they can recognize as home, intermediate between the dark-matter-dominated dSph (T3) and the full galaxy (T5). The named anchor "Ten billion suns, quietly held" lands here as a ~10³·⁵× climb from dSph, dramatic from named scale and quiet verb rather than absolute cliff size.
**Anchor:** [Spiral arms (Wikipedia)](https://en.wikipedia.org/wiki/Spiral_galaxy#Spiral_arms); [Milky Way structure (Wikipedia)](https://en.wikipedia.org/wiki/Milky_Way#Structure); Reid et al. 2019, ApJ 885, 131 (BeSSeL VLBI mapping of MW spiral arms).

### T4 upgrades

**Dust Lane Density** — *Stackable passive, T4.* The dark, ribbon-like bands threading along spiral arms — concentrations of cold molecular gas and interstellar dust (silicates, graphite, ices) obscuring background starlight in the visible. Dust lanes typically front the spiral density wave on its leading edge; star formation begins inside them. Fits T4 as the dust scaffolding within which everything in the arm forms. [Dust lane (Wikipedia)](https://en.wikipedia.org/wiki/Dust_lane); [Interstellar dust (Wikipedia)](https://en.wikipedia.org/wiki/Cosmic_dust).

**HII Region** — *Stackable passive, T4.* A region of ionized hydrogen (H II = "H-two", hydrogen with one electron stripped) around young O- and B-type stars, where ultraviolet photons ionize the surrounding gas to ~10⁴ K. The classic pink emission glow of star-forming regions; examples include the Orion Nebula (M42), Eagle Nebula (M16), Carina Nebula (NGC 3372). Lifetime ~10⁷ yr, ending when the massive stars exhaust their fuel. Fits T4 as the youngest light in the arm — *the pink glow*. [H II region (Wikipedia)](https://en.wikipedia.org/wiki/H_II_region); [Orion Nebula (Wikipedia)](https://en.wikipedia.org/wiki/Orion_Nebula).

**Proper Motion** — *Stackable click, T4.* The transverse component of a star's motion across the sky, measured in arcseconds per year — the angle a star has moved against more distant background. Combined with radial velocity (line-of-sight, spectroscopic) it gives the full 3D space velocity. Gaia DR3 catalogues proper motions for ~1.5 billion stars. Fits T4 as the click upgrade — *we read the angle they have moved against the sky*. [Proper motion (Wikipedia)](https://en.wikipedia.org/wiki/Proper_motion); [Gaia mission (ESA)](https://www.esa.int/Science_Exploration/Space_Science/Gaia).

**Spiral Density Wave** — *Stackable APS, T4.* The Lin–Shu (1964) model of spiral arms as standing wave patterns of mass density rotating at a fixed pattern speed slower than the disk's circular orbital speed. Gas and stars pile up at the wave's crest; the wave passes through the disk material rather than being a fixed clump. Triggers star formation at the leading edge. Fits T4 as the APS — *a wave of compression moves through the arm*; the autoclicker rhythm is the wave passing. [Density wave theory (Wikipedia)](https://en.wikipedia.org/wiki/Density_wave_theory); Lin & Shu 1964, ApJ 140, 646.

**High-Velocity Cloud** — *Stackable max-5 completionist, T4.* A neutral hydrogen (H I) cloud whose line-of-sight velocity is incompatible with Galactic rotation — typically Vlsr > 90 km/s — and which is therefore inferred to be infalling onto the disk from outside or to be a tidal remnant. Complex C is a prominent example (~10⁶ M☉, ~10 kpc above the disk, infalling at ~150 km/s). HVCs supply fresh gas that refuels disk star formation. Fits T4 as the completionist APS — *a cloud falling for an age*, its arrival adding to ours. [High-velocity cloud (Wikipedia)](https://en.wikipedia.org/wiki/High-velocity_cloud); Wakker & van Woerden 1997, ARA&A 35, 217.

**Galactic Bulge** — *One-shot (tiered consolidation, 7 levels), T4.* The dense, roughly spheroidal concentration of stars at the center of disk galaxies. The Milky Way bulge is ~2 × 10¹⁰ M☉, ~2 kpc in radius, dominated by old (~10 Gyr) Population II stars on randomized orbits supported by velocity dispersion rather than rotation. The MW bulge is also a "pseudobulge" / "boxy bulge" — partly the result of bar instability rather than pure dissipative collapse. Fits T4 as the tiered-consolidation upgrade — the only T4 one-shot with a 7-level physical-arc per-level flavor sequence (inward gas flow → first star formation → orbital crowding → dispersion → main sequence aging → metal enrichment → quiet weight) corresponding to the actual chronological assembly of the bulge over its multi-Gyr history. [Galactic bulge (Wikipedia)](https://en.wikipedia.org/wiki/Galactic_bulge); [Milky Way bulge (Wikipedia)](https://en.wikipedia.org/wiki/Milky_Way#Galactic_bulge); Kormendy & Kennicutt 2004, ARA&A 42, 603.

**Sagittarius B2** — *One-shot, T4.* The most massive molecular cloud complex in the Milky Way, ~3 × 10⁶ M☉ in the dense central core (with the full complex extending to ~10⁷ M☉ total gas mass on some studies), spanning ~45 pc (~150 ly), located ~120 pc (~390 ly) from the Galactic center. Chemically the richest known interstellar molecular environment: methanol (CH₃OH), ethanol (CH₃CH₂OH), vinyl alcohol (C₂H₃OH), formaldehyde, glycolaldehyde, formic acid, ethyl formate, propanenitrile, and 50+ other complex organic molecules detected. Sites of ongoing massive star formation (Sgr B2(N), Sgr B2(M)). Fits T4 as a named one-shot — *its mass enters our gravity*; provides synergy A (→ Proper Motion ×1.5 flat). Distinct from Sgr A* (T5 supermassive black hole) and Sgr Stream (T3 dwarf-spheroidal stream); the three share the Sagittarius constellation name but are astronomically distinct objects. [Sagittarius B2 (Wikipedia)](https://en.wikipedia.org/wiki/Sagittarius_B2); [Belloche et al. 2013, A&A 559, A47](https://www.aanda.org/articles/aa/full_html/2013/11/aa21956-13/aa21956-13.html) (molecular line survey).

**Globular Cluster** — *One-shot completionist, T4.* A tightly gravitationally bound spherical aggregation of ~10⁴–10⁶ Population II stars formed roughly contemporaneously, typically 10–13 Gyr old, with little gas or dust remaining. The Milky Way hosts ~150 known globulars distributed roughly spherically in the halo. M13 (Hercules Cluster), Omega Centauri, 47 Tucanae are prominent examples. Older than most of the disk; binds tight. Fits T4 as the completionist anchor — pure passive `allMps` multiplier with 0 consolidation, the rhetorical deep-time pause before the T4→T5 gate. [Globular cluster (Wikipedia)](https://en.wikipedia.org/wiki/Globular_cluster); [Harris 1996 catalogue (Wikipedia)](https://en.wikipedia.org/wiki/List_of_globular_clusters).

**Active Nucleus** — *One-shot, T4 transition gate.* Design name for what astronomy calls an **Active Galactic Nucleus (AGN)** — the central region of a galaxy hosting a supermassive black hole that is actively accreting matter and radiating with luminosity exceeding the surrounding stellar contribution. Subclasses (Seyfert galaxies, quasars, blazars, radio galaxies) differ mainly by viewing angle, accretion rate, and jet orientation per unified models. The Milky Way's central black hole (Sgr A*, T5) is currently quiescent but had AGN-like activity ~5 Myr ago, recorded in the Fermi Bubbles. Fits T4 as the transition gate — *"something massive at the heart of us begins to feed"* foreshadows T5's Sgr A* by one tier; the design uses "Active Nucleus" rather than "Active Galactic Nucleus" because the literal term reads as a label rather than a moment. Provides cross-tier synergy E (→ Sagittarius A* T5 ×1.5 flat). [Active galactic nucleus (Wikipedia)](https://en.wikipedia.org/wiki/Active_galactic_nucleus); [Urry & Padovani 1995, PASP 107, 803](https://iopscience.iop.org/article/10.1086/133630) (unified model).

---

## Named structures in flavor (T1–T4 prose)

Structures that appear in narrator prose or upgrade flavor but are not themselves upgrade names.

**Sun** — *T1 implicit.* The G2V main-sequence star at the center of the Solar System. 1.0 M☉, ~4.6 Gyr old, ~5,778 K surface, ~1 AU from Earth. The "we" of T1 is, mechanically, the Sun and its bound system. [Sun (NASA)](https://science.nasa.gov/sun/).

**Lagrange points (inner Lagrange point, L1)** — *T2 Roche Lobe Overflow flavor.* The five gravitationally distinguished points in the restricted three-body problem. L1 sits between two bodies and is the point through which Roche lobe overflow occurs in close binaries. [Lagrangian point (Wikipedia)](https://en.wikipedia.org/wiki/Lagrange_point).

**Local Standard of Rest** — *T2 Peculiar Velocity flavor (implicit).* The reference frame moving with the average motion of stars in the Sun's neighborhood; peculiar velocity is measured against it. [LSR (Wikipedia)](https://en.wikipedia.org/wiki/Local_standard_of_rest).

**Scorpius–Centaurus association** — *T2 Local Bubble flavor (implicit).* The nearest OB association to the Sun (~140 pc), source of the supernovae that excavated the Local Bubble. [Scorpius–Centaurus Association (Wikipedia)](https://en.wikipedia.org/wiki/Scorpius%E2%80%93Centaurus_association).

**Ursa Major Moving Group** — *T2 Moving Group anchor (implicit).* The nearest moving group; ~80 stars sharing kinematics from a common ~300 Myr-old origin. [Ursa Major Moving Group (Wikipedia)](https://en.wikipedia.org/wiki/Ursa_Major_Moving_Group).

**Milky Way halo** — *T3 framing throughout.* The roughly spherical extended region around the Milky Way disk containing old stars, globular clusters, dwarf satellites, stellar streams, and the bulk of the dark matter halo. [Galactic halo (Wikipedia)](https://en.wikipedia.org/wiki/Galactic_halo).

**Sagittarius dwarf spheroidal (Sgr dSph)** — *T3 Sagittarius Stream context.* The progenitor of the Sagittarius Stream; an ongoing tidal disruption event ~25 kpc out. Distinct from but related to the Sagittarius B2 (T4) / Sagittarius A* (T5) references that share the constellation name. [Sagittarius Dwarf Spheroidal Galaxy (Wikipedia)](https://en.wikipedia.org/wiki/Sagittarius_Dwarf_Spheroidal_Galaxy).

**Ursa Minor, Sextans, Carina, Leo I, Leo II, Fornax** — *T3 Dwarf Spheroidal tier framing (implicit).* The other classical Milky Way dSph satellites in the same class as Draco / Sculptor. [Dwarf spheroidal galaxy (Wikipedia)](https://en.wikipedia.org/wiki/Dwarf_spheroidal_galaxy).

**Galactic center** — *T4 Sagittarius B2 and Active Nucleus context (implicit).* The dynamical center of the Milky Way, ~8 kpc from the Sun in the direction of the constellation Sagittarius. Hosts the supermassive black hole Sgr A* (T5), the nuclear star cluster, and dense molecular cloud complexes including Sgr B2 (T4) and Sgr A West. [Galactic Center (Wikipedia)](https://en.wikipedia.org/wiki/Galactic_Center).

**Perseus, Scutum-Centaurus, Sagittarius, Norma arms** — *T4 Galactic Arm tier framing (implicit).* The four major spiral arms of the Milky Way as resolved by maser parallax measurements (BeSSeL VLBI survey). The Sun sits in the Local / Orion Spur, an inter-arm structure between Sagittarius and Perseus. [Milky Way spiral arms (Wikipedia)](https://en.wikipedia.org/wiki/Milky_Way#Spiral_arms); Reid et al. 2019, ApJ 885, 131.

**Fermi Bubbles** — *T4 Active Nucleus context (implicit forward-pointer; full glossary entry pending T5 retune).* Two gamma-ray-emitting lobes extending ~25,000 ly above and below the Galactic disk, evidence of past AGN activity by Sgr A* roughly 5 Myr ago. T4's "Active Nucleus" → T5's Fermi Bubbles is the design's chronological foreshadow: the nucleus brightens at T4, the bubbles linger at T5 as *what the feeding left behind*. [Fermi Bubbles (Wikipedia)](https://en.wikipedia.org/wiki/Fermi_bubbles).

**Forward-pointers (out of T1–T4 scope, flagged for future passes):**
- **Eridanus Reach** (Act 2 pivot; T7 territory) — the constellation Eridanus is real; "Eridanus Supervoid" is a real candidate void (~1 Gpc across, low CMB cold-spot association). The game uses the framing "Eridanus Reach" with intent. Will be glossed in the T7+ pass.
- **Andromeda, Triangulum** — referenced in voice-samples T6 peak but out of T1–T4 scope.
- **Sagittarius A\*** (T5 territory under the 11-tier ladder) — the supermassive black hole at the dynamical center of the Milky Way, ~4.15 × 10⁶ M☉, ~8 kpc from the Sun. Imaged in 2022 by the Event Horizon Telescope. Will be glossed in the T5 retune pass. Distinct from Sagittarius Stream (T3) and Sagittarius B2 (T4).
- **Hot Coronal Halo** (T5 territory) — the million-degree X-ray-emitting envelope of circumgalactic medium (CGM) wrapping the Milky Way disk, extending to ~200 kpc. Observed by Chandra, XMM-Newton, eROSITA via O VII / O VIII X-ray absorption and emission. Will be glossed in the T5 retune pass.

---

## Cross-references

Terms that appear in upgrade names **and** in flavor or other tiers' prose:

- **Heliopause (T1 upgrade)** → conceptually re-echoed in "causal threshold" / "Causal Horizon" (T7 pivot, T11 final tier). Both name the **edge of what we can ever reach** at radically different scales. (Different physics; same emotional shape.)
- **Brown Dwarf (T2 stackable)** → **Subhalo (T3 hidden-channel)**: the cross-tier synergy is the felt encoding of "unlit gravitating mass at one scale becoming unlit gravitating mass at the next." Voice-coherent: same physics-of-the-unseen, two tiers apart.
- **Velocity Dispersion** appears as a T3 stackable (the dark-matter-signal autoclicker) AND in voice-samples as a T6 Local Group one-shot (the click-multiplier-on-streak mechanic). Same term, two referents at two scales. This is by design — galaxy-group velocity dispersion is the cluster-scale analog of dwarf-galaxy velocity dispersion. Worth flagging to creative-director for naming distinctness if the T6 redesign keeps the same term.
- **Sagittarius Stream (T3 transition gate)** → **Sagittarius B2 (T4 one-shot)** → **Sagittarius A\* (T5 one-shot)**: three different "Sagittarius" referents at three tiers (chronological by tier). T3 = dwarf-spheroidal stream; T4 = a named molecular cloud ~120 pc from the Galactic center; T5 = the Milky Way's supermassive black hole. Astronomically distinct objects sharing the constellation name. Worth noting in player-facing material so the names don't read as a recurring upgrade family when they're not.
- **Active Nucleus (T4 transition gate)** → **Sagittarius A\* (T5 one-shot)**: the cross-tier synergy E. T4's "something massive at the heart of us begins to feed" is the foreshadow; T5's Sgr A* is the name. Voice-coherent: T4 names the *moment* (feeding center inferred from luminosity), T5 names the *object* (the black hole directly).
- **Population II (T3 stackable)** → **Stellar Halo (T5 stackable)**: the Stellar Halo is *by definition* a Population II structure at galactic scale. Coherent cross-tier scaling.
- **Dark matter / mass-to-light ratio** appears as the **subject** of T3 (Subhalo, Draco Dwarf, Velocity Dispersion) and the **scaffold** of T5 (Dark Matter Halo). T3 is where the dark matter *has a name*; T5 is where the dark matter *holds the galaxy together*. Same physics, intentional repetition at different scales.

---

## Precision risks (honest flags)

Five terms whose in-game framing is more specific than the published literature strictly supports — or whose flavor text contains a number worth refreshing:

1. **Local Bubble size — "three hundred light-years across" (T2 flavor).** Modern measurements put the Local Bubble at ~1,000 light-years across (Zucker et al. 2022, *Nature* 601, 334; recent estimates ~150–200 pc radius depending on direction). The "three hundred" reads as an older textbook value. **Recommendation:** soften to "hundreds of light-years across" or refresh to "a thousand light-years across" in a future voice pass. Not a real-cosmology violation — just a stale number.

2. **Draco mass-to-light ratio — "Four hundred forty solar masses for every one we can see" (T3 Draco Dwarf flavor).** This is the *high-end* dynamical-mass estimate (kinematic-based, derived from velocity dispersion with strong assumptions). Mateo (1998) — the seminal review — quotes a central M/L of ~60 for Draco. Later studies (Kleyna et al. 2002; Strigari et al. 2008) push the integrated M/L into the hundreds. The 440 figure is defensible but represents an upper-end value, not a consensus number. **Recommendation:** the design's use of 440 is honest if the line is intended as *Draco's most dark-matter-dominated end of the estimate range*. If the writer wants a more median-conservative number, ~100 is safer. Keep the line if the dramatic anchor matters more than the median.

3. **"Stellar Neighborhood" (T2 tier name).** Not a single cataloged object — it's a generic descriptor. Reads loose by design (the design-doc lock note says "Pleiades-class but not a single catalog name"). **No correction needed**; flagged so it's clear this is the only tier name in T1–T3 that isn't a specific astronomical referent.

4. **"Stellar Coupling" (T1 stackable click).** Generic framing of gravitational interaction; not a standard astronomical term. The "Coupling" naming family across tiers (T1 Stellar Coupling, T5 Galactic Coupling, T6 Group Coupling, etc.) is a *design* convention, not an astronomy convention. **No correction needed**; flagged for awareness. The poetic license here is in *arrangement* (the consistent naming family), not invention.

5. **"Subhalo" hidden-channel framing (T3).** Subhalos are a real, well-published ΛCDM prediction. The design's framing — that the player perceives unexplained extra mass flow from an upgrade with no visible footprint — is mechanically novel but physically honest (subhalos are gravitationally important but unilluminated; their effect is inferred from missing-mass arguments). **No correction needed**; flagged because the *mechanic* is fictional even though the *physics* is real.

6. **Sagittarius B2 mass — "three million solar masses"** (T4 Sgr B2 flavor; T4 retune landed 2026-05-14 iter #9 with locked numerical anchor). Published estimates range from ~3 × 10⁶ M☉ (lower-bound, central core) to ~10⁷ M☉ (full complex, total gas mass). The flavor's 3M figure is defensible as the dense central cloud, not the full complex. **No correction needed**; flagged so the central-core vs full-complex distinction is on the record.

---

## Sources

Core references used in this glossary:

- [Solar wind (NASA Heliophysics)](https://science.nasa.gov/heliophysics/focus-areas/solar-wind/)
- [Voyager Mission — Heliopause](https://voyager.jpl.nasa.gov/mission/interstellar-mission/)
- [Asteroid Belt (NASA Solar System)](https://science.nasa.gov/solar-system/asteroids/)
- [Orbital resonance (Wikipedia)](https://en.wikipedia.org/wiki/Orbital_resonance)
- [Pleiades / M45 (Wikipedia)](https://en.wikipedia.org/wiki/Pleiades)
- [Local Bubble (Wikipedia)](https://en.wikipedia.org/wiki/Local_Bubble)
- [Phys.org, "What blew up the local bubble?" (2025)](https://phys.org/news/2025-04-blew-local.html)
- [Gravitational microlensing (NASA)](https://science.nasa.gov/exoplanets/microlensing/)
- [Roche lobe (Wikipedia)](https://en.wikipedia.org/wiki/Roche_lobe)
- [Brown dwarf (NASA Exoplanets)](https://science.nasa.gov/exoplanets/brown-dwarfs/)
- [Stellar kinematics (Wikipedia)](https://en.wikipedia.org/wiki/Stellar_kinematics)
- [Peculiar velocity (Wikipedia)](https://en.wikipedia.org/wiki/Peculiar_velocity)
- [Open cluster (Wikipedia)](https://en.wikipedia.org/wiki/Open_cluster)
- [Stellar population (Wikipedia)](https://en.wikipedia.org/wiki/Stellar_population)
- [Dark matter halo / subhalo (Wikipedia)](https://en.wikipedia.org/wiki/Dark_matter_halo)
- [RR Lyrae variable (Wikipedia)](https://en.wikipedia.org/wiki/RR_Lyrae_variable)
- [Velocity dispersion (Wikipedia)](https://en.wikipedia.org/wiki/Velocity_dispersion)
- [Belokurov et al. 2007, "The Orphan Stream"](https://iopscience.iop.org/article/10.1086/511302)
- [Koposov et al. 2019, "Piercing the Milky Way: an all-sky view of the Orphan Stream"](https://academic.oup.com/mnras/article/485/4/4726/5318650)
- [Sculptor Dwarf Galaxy (Wikipedia)](https://en.wikipedia.org/wiki/Sculptor_Dwarf_Galaxy)
- [Draco Dwarf (Wikipedia)](https://en.wikipedia.org/wiki/Draco_Dwarf)
- [Walker, "Dark Matter in Milky Way Dwarf Satellites" (NED review)](https://ned.ipac.caltech.edu/level5/Sept17/Walker/Walker5.html)
- [Ibata, Gilmore, & Irwin 1994, *Nature* 370, 194 — Sagittarius dwarf discovery](https://www.nature.com/articles/370194a0)
- [Sagittarius Stream (Wikipedia)](https://en.wikipedia.org/wiki/Sagittarius_Stream)
- [Dwarf spheroidal galaxy (Wikipedia)](https://en.wikipedia.org/wiki/Dwarf_spheroidal_galaxy)
- [Spiral galaxy (Wikipedia)](https://en.wikipedia.org/wiki/Spiral_galaxy)
- [Milky Way (Wikipedia)](https://en.wikipedia.org/wiki/Milky_Way)
- [Density wave theory (Wikipedia)](https://en.wikipedia.org/wiki/Density_wave_theory)
- [H II region (Wikipedia)](https://en.wikipedia.org/wiki/H_II_region)
- [Orion Nebula (Wikipedia)](https://en.wikipedia.org/wiki/Orion_Nebula)
- [Cosmic dust (Wikipedia)](https://en.wikipedia.org/wiki/Cosmic_dust)
- [Proper motion (Wikipedia)](https://en.wikipedia.org/wiki/Proper_motion)
- [Gaia mission (ESA)](https://www.esa.int/Science_Exploration/Space_Science/Gaia)
- [High-velocity cloud (Wikipedia)](https://en.wikipedia.org/wiki/High-velocity_cloud)
- [Galactic bulge (Wikipedia)](https://en.wikipedia.org/wiki/Galactic_bulge)
- [Sagittarius B2 (Wikipedia)](https://en.wikipedia.org/wiki/Sagittarius_B2)
- [Belloche et al. 2013, A&A 559, A47 — Sgr B2 molecular line survey](https://www.aanda.org/articles/aa/full_html/2013/11/aa21956-13/aa21956-13.html)
- [Globular cluster (Wikipedia)](https://en.wikipedia.org/wiki/Globular_cluster)
- [Active galactic nucleus (Wikipedia)](https://en.wikipedia.org/wiki/Active_galactic_nucleus)
- [Urry & Padovani 1995, PASP 107, 803 — AGN unified model](https://iopscience.iop.org/article/10.1086/133630)
- [Galactic Center (Wikipedia)](https://en.wikipedia.org/wiki/Galactic_Center)
- [Fermi Bubbles (Wikipedia)](https://en.wikipedia.org/wiki/Fermi_bubbles)
