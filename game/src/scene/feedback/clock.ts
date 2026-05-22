// scene/feedback/clock.ts — wall-clock time helper (salvaged from the spike's
// clickBoost.ts per scaffold §3).
//
// THREE.Clock.elapsedTime is canvas-scoped and does NOT match performance.now()
// (NOTES.md "Bugs hit and fixed" — mixing the two gives negative elapsed values
// and silently broken timers). Any useFrame consumer that needs wall-clock time
// — and any cross-module timer that must agree with it — standardises on this.
//
// The spike's components/clickBoost.ts (the dead-code per-body boost path) still
// exports its own nowSeconds() for the dual-write pattern Star/Planet carry; this
// module is the canonical wall-clock source for the live feedback systems.
export function nowSeconds(): number {
  return performance.now() / 1000;
}
