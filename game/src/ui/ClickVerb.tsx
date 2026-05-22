// ui/ClickVerb.tsx — the clinical click verb at the tap point (scaffold §3 G5).
//
// CLINICAL register (Two-voice UI rule): the click verb is a physics label for
// what the tap does. See useClickVerb.ts for the verb map + hook. This component
// is DISPLAY ONLY. The actual tap income is fired by the whole-scene pointer-up
// handler in CosmicCanvas (firePull + sendClick) — the scene IS the tap surface.
// This label sits in the chrome's pointer-events:none bottom cluster and never
// intercepts the tap.

import { useClickVerb } from './useClickVerb';

export function ClickVerb() {
  const verb = useClickVerb();
  return <div className="dfui-click-verb">{verb}</div>;
}
