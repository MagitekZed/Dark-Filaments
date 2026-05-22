// scene/tiers/T5Galaxy.tsx — the T5 Galaxy scene content (absorbed from the
// spike's T5Scene, scaffold §6.1). Out-of-arc reference for v0.1 — the T1→T2
// arc is what the engine drives; T5 mounts so the absorbed galaxy is reachable
// (dev SceneSwitcher / forced tier) and the registry has a real T5 entry.
//
// INNER Canvas content only — CosmicCanvas owns renderer/bloom/camera. The
// galaxy view tilt is shared via sceneParams.GALAXY_VIEW_TILT (the same tilt
// TwinklingStars uses), so the disc and the embedded named stars align.

import { Galaxy } from '../components/Galaxy';
import { Starfield } from '../components/Starfield';
import { DeepStarfield } from '../components/DeepStarfield';
import { BackgroundGalaxies } from '../components/BackgroundGalaxies';
import { ForegroundStars } from '../components/ForegroundStars';
import { TwinklingStars } from '../components/TwinklingStars';
import { BlackHole } from '../components/BlackHole';
import { BlackHoleAccretionDisc } from '../components/BlackHoleAccretionDisc';
import { BlackHoleJets } from '../components/BlackHoleJets';
import { BlackHoleLensing } from '../components/BlackHoleLensing';
import { BlackHoleInfall } from '../components/BlackHoleInfall';
import { GALAXY_VIEW_TILT } from '../sceneParams';

export function T5Galaxy() {
  return (
    <>
      <DeepStarfield />
      <BackgroundGalaxies />
      <Starfield />
      <ForegroundStars />
      <TwinklingStars />
      {/* tilt the galaxy so we view it 3/4 from above (shared via sceneParams) */}
      <group rotation={GALAXY_VIEW_TILT}>
        <Galaxy />
        <BlackHole />
        <BlackHoleAccretionDisc />
        <BlackHoleInfall />
        <BlackHoleLensing />
        <BlackHoleJets />
      </group>
    </>
  );
}
