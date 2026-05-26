// scene/tiers/T3DwarfSpheroidal.tsx — the T3 Dwarf Spheroidal scene content.
//
// INNER Canvas content only — CosmicCanvas owns renderer/bloom/camera.
//
// The T3 scale jump (10³ → 10⁶·⁵ M☉) changes the frame: the player no longer
// has a single star. The STRUCTURE is the player — a diffuse, gas-poor,
// dark-matter-dominated swarm of old Population II stars, held by velocity
// dispersion in a halo we cannot see. The first patient-universe-return tier:
// quiet, old, "the rest holds." Clicks pull matter toward the cloud's
// gravitational center (the dark matter well at the origin).
//
// Engine wiring — the two scene hooks are REAL here (not the T1/T2 stubs):
//   • useStackableDensity(3) drives the old population's density (Population II
//     is the dominant contributor) — generalizing the T2 ad-hoc lvl() reads.
//   • useNamedOneShots(3) drives the named tidal-stream / companion-dwarf
//     structures via a name→component registry (see oneShotRegistry).
//
// Reads the STORE only (§12.7) — no engineClient import.

import { Fragment, type ReactNode } from 'react'
import { DeepStarfield } from '../components/DeepStarfield'
import { MidStarfield } from '../components/MidStarfield'
import { DwarfSpheroidalCloud } from '../components/DwarfSpheroidalCloud'
import { RRLyraePulsators } from '../components/RRLyraePulsators'
import { VelocityDispersion } from '../components/VelocityDispersion'
import { SubhaloSignature } from '../components/SubhaloSignature'
import { StellarStream } from '../components/StellarStream'
import { CompanionDwarf } from '../components/CompanionDwarf'
import { PullParticles } from '../feedback/PullParticles'
import { useStackableDensity } from '../hooks/useStackableDensity'
import { useNamedOneShots } from '../hooks/useNamedOneShots'

// The dwarf spheroidal sits at the origin; clicks pull toward its center.
export const DSPH_CENTER: [number, number, number] = [0, 0, 0]
export const DSPH_RADIUS = 16

// ─── Named one-shot registry (CD-7, generalized) ────────────────────────────
//
// useNamedOneShots(3) reports which named one-shots are owned and whether each
// was just purchased (freshStart). The scene owns the mapping from name → scene
// structure here, so the mount loop is generic: any owned one-shot whose name is
// in this registry mounts its structure; freshStart drives the fade-in envelope.
// (This generalizes the T2 scene's hand-coded owned() branches.)
const T3_ONE_SHOTS: Record<string, (freshStart: boolean) => ReactNode> = {
  // A long, thin, dim cold stream off to one side — a galaxy that died and left
  // a shape, with no obvious progenitor.
  'Orphan Stream': (fresh) => (
    <StellarStream
      center={DSPH_CENTER}
      radius={22}
      orientation={[0.5, 0.3, -0.4]}
      arcStart={1.6}
      arcSpan={2.0}
      width={1.0}
      count={700}
      color="#c6d0ea"
      brightness={0.55}
      progenitorBias={0.7}
      freshStart={fresh}
      seed={11}
    />
  ),
  // The grand sweeping stream that wraps the cloud — the T3→T4 gate. The brightest
  // one-shot: the arm we are about to become, being made from what we are eating.
  'Sagittarius Stream': (fresh) => (
    <StellarStream
      center={DSPH_CENTER}
      radius={30}
      orientation={[-0.35, 0.8, 0.5]}
      arcStart={0.2}
      arcSpan={4.7}
      width={2.4}
      count={1700}
      color="#dfe2f0"
      brightness={0.92}
      progenitorBias={0.5}
      freshStart={fresh}
      seed={23}
    />
  ),
  // A resolvable companion dwarf — the first time we look at another galaxy and
  // see the people in it.
  'Sculptor Dwarf': (fresh) => (
    <CompanionDwarf
      center={[11, 17, -9]}
      radius={4.5}
      count={540}
      brightness={0.7}
      freshStart={fresh}
      seed={31}
    />
  ),
  // The most dark-matter-dominated dwarf known: a sparse scatter of stars over a
  // deep, mostly-invisible mass implied by a faint lensing halo (SD-2). The
  // dark matter we have been embedded in this whole time has a name.
  'Draco Dwarf': (fresh) => (
    <Fragment>
      <CompanionDwarf
        center={[-10, -16, 12]}
        radius={5.0}
        count={240}
        brightness={0.6}
        darkDominated
        freshStart={fresh}
        seed={41}
      />
      <SubhaloSignature level={28} center={[-10, -16, 12]} radius={7} />
    </Fragment>
  ),
}

// Soft saturation, mirroring useStackableDensity — used to map the LUMINOUS
// population level to a reveal fraction without pulling in the dark Subhalo.
function saturate(x: number, k: number): number {
  return x / (x + k)
}

export function T3DwarfSpheroidal() {
  // The hook gives per-stackable levels + the aggregate. We deliberately drive
  // the VISIBLE cloud only from the LUMINOUS old population (Population II) — NOT
  // the full aggregate. Subhalo is dark matter (SD-2: inferred, not rendered),
  // so buying it must never add luminous stars; it surfaces only as the lensing
  // signature below. The result is the tier's thesis made visual: the player
  // pours mass into the unseen mass, the lensing ring strengthens, and the
  // stars they can count stay the small part. The rest holds.
  const density = useStackableDensity(3)
  const populationII = density.byName['Population II'] ?? 0
  const lumFrac = saturate(populationII, 55) // [0, 1) as Population II stacks
  const cloudDensityScale = 1 + lumFrac
  const cloudGlow = 0.35 * lumFrac

  // Named one-shots owned this tier (the tidal streams + companion dwarfs).
  // Each owned one-shot whose name is in T3_ONE_SHOTS mounts its structure;
  // freshStart drives the fade-in on first purchase. (CD-7, via the registry.)
  const oneShots = useNamedOneShots(3)

  return (
    <>
      <DeepStarfield />
      <MidStarfield />

      {/* The tier body — the diffuse old-star swarm, luminous-density-driven. */}
      <DwarfSpheroidalCloud
        densityScale={cloudDensityScale}
        glowBoost={cloudGlow}
        center={DSPH_CENTER}
        radius={DSPH_RADIUS}
      />

      {/* Subhalo — SD-2 inferred-not-rendered: a faint lensing ring of bent
          background light at the cloud's edge (its top/bottom arcs read against
          the dark margins; the unseen mass itself is never drawn). */}
      <SubhaloSignature
        level={density.byName['Subhalo'] ?? 0}
        center={DSPH_CENTER}
        radius={DSPH_RADIUS + 1}
      />

      {/* RR Lyrae — pulsating standard-candle variables embedded in the cloud. */}
      <RRLyraePulsators level={density.byName['RR Lyrae'] ?? 0} radius={DSPH_RADIUS * 0.78} />

      {/* Velocity Dispersion — the dark-matter smoking gun: isotropic motion. */}
      <VelocityDispersion level={density.byName['Velocity Dispersion'] ?? 0} radius={DSPH_RADIUS * 0.82} />

      {/* Named one-shots — tidal streams + companion dwarfs (CD-7), mounted off
          the owned-one-shot list with per-structure fresh-start fade-ins. */}
      {oneShots.map((m) => {
        const render = T3_ONE_SHOTS[m.name]
        return render ? <Fragment key={m.name}>{render(m.freshStart)}</Fragment> : null
      })}

      {/* Click feedback — matter pulled toward the cloud's dark matter well. */}
      <PullParticles sunPosition={DSPH_CENTER} />
    </>
  )
}
