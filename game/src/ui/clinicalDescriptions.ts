// ui/clinicalDescriptions.ts — the persistent clinical one-line upgrade
// descriptions (Two-voice UI rule: the CLINICAL register).
//
// These are the second of Dark Filaments' two voice registers. They are
// PRESENTATION, not engine content, so they live in the UI layer (the engine's
// `desc` fields are the OTHER register — the narrator's fading "we" prose, which
// relocates to the one-time first-purchase fade-in). The two registers do not
// cross.
//
// Clinical register (locked calibration): a card line states what the named
// object or phenomenon IS, present tense, as a field-guide caption would — real
// cosmology only, with one concrete measurement or mechanism where it adds
// precision. NO first or second person, NO agency (never the player pulling /
// holding / reaching), NO editorializing or feeling, NO metaphor that isn't
// literal physics, NO exclamation points. The quiet beauty is carried by the
// accurate specifics, never by sentiment.
//
// Drafted by the writer agent, grounded in Design Documents/science-glossary.md.
// T1–T3 (25 lines); T4+ attach as their tiers are surfaced. A missing entry
// renders an empty line (the card holds its layout height), never invented prose.

export const CLINICAL_DESC: Record<string, string> = {
  // ── T1 Solar System ──
  'Solar Wind': 'Charged particles streaming outward from the stellar corona at roughly four hundred kilometers per second.',
  'Asteroid Belt': 'Rocky bodies orbiting between Mars and Jupiter, the largest a dwarf planet nine hundred kilometers across.',
  'Stellar Coupling': 'Gravitational interaction binding orbiting bodies to the central mass.',
  'Magnetosphere': "The region where a body's magnetic field deflects the surrounding charged plasma.",
  'Orbital Resonance': 'Bodies whose orbital periods relate as a ratio of small integers, perturbing one another in step.',
  'Heliopause': "The boundary where the solar wind's pressure meets the interstellar medium, the edge of the Sun's reach.",
  'First Photons': 'The first thermonuclear light, released as a core crosses the hydrogen-fusion threshold near ten million kelvin.',

  // ── T2 Stellar Neighborhood ──
  'Stellar Kinematics': 'The three-dimensional motion of nearby stars: proper motion, radial velocity, and parallax distance.',
  'Local Bubble': 'A cavity in the interstellar medium, hundreds of light-years across, filled with hot low-density plasma.',
  'Microlensing': 'A foreground mass bending and briefly brightening the light of a star behind it.',
  'Roche Lobe Overflow': 'Matter spilling from one star through the inner Lagrange point onto its close companion.',
  'Brown Dwarf': 'A substellar body too light for sustained hydrogen fusion, gravitating in the infrared.',
  'Wolf-Rayet Star': 'A massive evolved star whose stellar winds strip its outer hydrogen envelope into space.',
  'Binary Partner': 'A companion star sharing a gravitationally bound orbit about a common center of mass.',
  'Peculiar Velocity': "A star's motion that remains after subtracting the bulk rotation of the galactic disk.",
  'Open Cluster': 'A few hundred to a few thousand stars, loosely bound, born from one molecular cloud.',
  'Moving Group': 'Stars dispersed across the sky that still share a common origin and space velocity.',

  // ── T3 Dwarf Spheroidal ──
  'Population II': 'Old, metal-poor stars formed in the early universe, before later generations enriched the gas.',
  'Subhalo': 'A smaller dark-matter halo bound within a larger one, its mass inferred from gravity alone.',
  'RR Lyrae': 'A pulsating horizontal-branch star, its period and brightness fixing distances across the halo.',
  'Velocity Dispersion': 'The spread of stellar line-of-sight velocities, a measure of total gravitating mass.',
  'Orphan Stream': 'A long, cold stellar stream a hundred and fifty kiloparsecs across, with no identified parent.',
  'Sculptor Dwarf': 'A satellite galaxy eighty-six kiloparsecs out, holding two stellar populations of differing age.',
  'Draco Dwarf': 'A satellite galaxy dominated by dark matter, with hundreds of solar masses bound per solar mass of starlight.',
  'Sagittarius Stream': 'Stars torn from a disrupting dwarf galaxy, wrapping more than once around the Milky Way.',
};

export function clinicalDescFor(name: string): string {
  return CLINICAL_DESC[name] ?? '';
}
