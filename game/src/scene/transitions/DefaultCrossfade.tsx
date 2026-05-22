// scene/transitions/DefaultCrossfade.tsx — fallback transition cinematic
// (scaffold §6.1 step 5: "default crossfade fallback until authored").
//
// INNER Canvas content. For any (fromTier, toTier) pair without an authored
// cinematic, this is the stand-in: a short hold that fires onComplete after a
// brief beat so the tier mount proceeds. The actual visual crossfade between
// the outgoing and incoming tier scenes is owned by CosmicCanvas's mount
// overlap; this component just paces the timing and provides a quiet deep
// field during the swap.
//
// When a real cinematic is authored for a pair, it registers in
// transitionRegistry and supersedes this fallback.

import { useEffect, useRef } from 'react';
import { DeepStarfield } from '../components/DeepStarfield';
import { MilkyWayBand } from '../components/MilkyWayBand';

const DEFAULT_CROSSFADE_MS = 1200;

export function DefaultCrossfade({ onComplete }: { onComplete: () => void }) {
  const firedRef = useRef(false);

  useEffect(() => {
    const tid = setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      onComplete();
    }, DEFAULT_CROSSFADE_MS);
    return () => clearTimeout(tid);
  }, [onComplete]);

  return (
    <>
      <MilkyWayBand />
      <DeepStarfield />
    </>
  );
}
