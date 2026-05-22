// scene/tiers/DefaultTierScene.tsx — quiet deep-field fallback for tiers whose
// scene is not yet authored (scaffold §3: registry default).
//
// INNER Canvas content only. A contemplative deep field stands in until the
// real per-tier scene lands — never a black void. Click feedback still works
// (matter pulled toward the origin) so the tap loop is exercisable at any tier
// during dev.

import { DeepStarfield } from '../components/DeepStarfield';
import { MidStarfield } from '../components/MidStarfield';
import { MilkyWayBand } from '../components/MilkyWayBand';
import { PullParticles } from '../feedback/PullParticles';

export function DefaultTierScene() {
  return (
    <>
      <MilkyWayBand />
      <DeepStarfield />
      <MidStarfield />
      <PullParticles sunPosition={[0, 0, 0]} />
    </>
  );
}
