// scene/transitions/cameraHandoff.ts — a one-shot module-level baton passed from
// a transition cinematic to the live CameraDrift that takes over after it.
//
// Why this exists: for the camera to flow seamlessly out of a transition into
// the tier's slow drift, the drift must START at the exact azimuth (and in the
// same rotational sense) the cinematic ENDED on — not at its generic default
// azimuth, which would force a snap. The cinematic doesn't know which CameraDrift
// instance will pick up; the drift doesn't know where the cinematic left off.
// This tiny module is the baton between them: the cinematic stashes its computed
// end azimuth here on its first frame, and the next CameraDrift that mounts with
// consumeHandoff consumes it ONCE (read-and-clear), starting its pan from there.
//
// Module-level (not the store) on purpose — same pattern as feedback/pullEvents:
// it's a transient frame-loop baton, not React state, so it never triggers a
// re-render and never needs a selector. Pure number in / number out.

let pendingDriftAzimuth: number | null = null;

/** Cinematic → stash the azimuth the live drift should continue from. */
export function setDriftHandoff(azimuth: number): void {
  pendingDriftAzimuth = azimuth;
}

/** CameraDrift → read-and-clear the pending handoff. Returns null if none is
 *  pending (a normal scene-start mount), in which case the drift uses its
 *  configured initial azimuth. */
export function consumeDriftHandoff(): number | null {
  const v = pendingDriftAzimuth;
  pendingDriftAzimuth = null;
  return v;
}
