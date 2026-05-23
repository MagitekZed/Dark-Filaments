// dev/CameraTools.tsx — gameplay ↔ free-look toggle + orientation capture.
//
// Gameplay mode is the shipped curated camera (CameraDrift). Free-look mounts
// OrbitControls so the dev can drag to any framing; while it's active the
// in-Canvas CameraReporter streams the live orientation into devSlice.cameraReadout
// and this panel shows it. Copy emits a sceneParams-shaped block (cameraPosition
// + cameraFov, plus target/distance) so the dev can hand back the exact numbers
// to set as a tier's default static view. Dev-only.

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import { selectTier, selectForcedTier } from '../store/selectors';
import { TIERS } from '../engine';
import { section, sectionTitle, btn, btnActive, row, note, input } from './devStyles';

function vec(v: [number, number, number]): string {
  return `[${v[0]}, ${v[1]}, ${v[2]}]`;
}

export function CameraTools() {
  const freeOrbit = useStore((s) => s.freeOrbit);
  const setFreeOrbit = useStore((s) => s.setFreeOrbit);
  const cam = useStore(useShallow((s) => s.cameraReadout));
  const engineTier = useStore(selectTier);
  const forcedTier = useStore(selectForcedTier);
  const [copied, setCopied] = useState(false);

  const mountedTier = forcedTier ?? engineTier;

  function snippet(): string {
    if (!cam) return '';
    return [
      `// T${mountedTier} ${TIERS[mountedTier]?.name ?? ''} — captured view`,
      `cameraPosition: ${vec(cam.position)},`,
      `cameraFov: ${cam.fov},`,
      `// target: ${vec(cam.target)}  distance: ${cam.distance}`,
    ].join('\n');
  }

  function copy() {
    const text = snippet();
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
        () => { /* clipboard blocked — the readout below is still copyable by hand */ },
      );
    }
  }

  return (
    <div style={section}>
      <p style={sectionTitle}>Camera</p>
      <div style={row}>
        <button style={!freeOrbit ? btnActive : btn} onClick={() => setFreeOrbit(false)}>
          Gameplay
        </button>
        <button style={freeOrbit ? btnActive : btn} onClick={() => setFreeOrbit(true)}>
          Free-look
        </button>
      </div>

      {freeOrbit && (
        <>
          {cam ? (
            <>
              <textarea
                readOnly
                value={snippet()}
                style={{
                  ...input,
                  width: '100%',
                  height: 70,
                  resize: 'none',
                  whiteSpace: 'pre',
                  lineHeight: 1.4,
                }}
              />
              <div style={row}>
                <button style={btn} onClick={copy}>
                  {copied ? 'copied' : 'Copy'}
                </button>
              </div>
            </>
          ) : (
            <p style={note}>orbit the camera to capture an orientation…</p>
          )}
          <p style={note}>
            Drag to frame the scene, then Copy to grab the numbers for a tier's
            default view. Viewing T{mountedTier}.
          </p>
        </>
      )}
    </div>
  );
}
