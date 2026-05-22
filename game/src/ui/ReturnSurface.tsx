// ui/ReturnSurface.tsx — quiet welcome-back line (scaffold §3 G5).
//
// ── LOAD-BEARING: the welcome-back rule ─────────────────────────────────
// Dignified, unannounced. NO "+X while away" popup, NO scroll-up animation,
// NO numbers. A single quiet held line, fading (narrator register). The
// counter reads what it reads; this held line is the only acknowledgment, and
// a longer absence is greeted by a quieter line, never the loudest. The
// narrator does not perform to an empty room.
//
// CONTENT (§11 — no new authoring): the quiet welcome-back lines are TO-WRITE
// on the writing backlog; none are locked in the corpus yet. So this component
// wires the MECHANISM (detect a boot offline-return window via
// selectOfflineReturn, fade a held line in then out, fire once per return) but
// renders NOTHING when no authored line exists — we do not invent narrator
// prose. When a line is authored it drops into RETURN_LINES and the mechanism
// already plays it. The presence of the offline window is also visible
// elsewhere (the mass counter simply reads higher) — that, plus this line when
// authored, is the entire acknowledgment.

import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import { selectOfflineReturn } from '../store/selectors';

// Authored quiet welcome-back lines, by absence length band. EMPTY in v0.1
// (TO-WRITE) — see the header note. Longer absence → quieter line; the
// selection logic is ready, the lines are not authored yet, so this stays empty
// and the surface renders nothing. We do NOT invent prose here.
const RETURN_LINES: { shortAbsence: string | null; longAbsence: string | null } = {
  shortAbsence: null,
  longAbsence: null,
};

// A "long" absence threshold (seconds) for picking the quieter line, once lines
// exist. ~12 hours.
const LONG_ABSENCE_SEC = 12 * 60 * 60;

const FADE_IN_MS = 1600;
const HOLD_MS = 7000;
const FADE_OUT_MS = 4000;

type Phase = 'in' | 'hold' | 'out' | 'done';

export function ReturnSurface() {
  const offlineReturn = useStore(useShallow(selectOfflineReturn));
  const seenRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const [line, setLine] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('done');

  useEffect(() => {
    if (!offlineReturn) return;
    if (seenRef.current) return;
    seenRef.current = true;

    // Quieter line for a longer absence (welcome-back rule). Both are null in
    // v0.1 (TO-WRITE), so `text` is null → nothing renders. The dedup still
    // fires so we never re-show on a later snapshot carrying the same rider.
    const text =
      offlineReturn.elapsedSec >= LONG_ABSENCE_SEC
        ? RETURN_LINES.longAbsence
        : RETURN_LINES.shortAbsence;
    if (!text) return;

    setLine(text);
    setPhase('in');
    timersRef.current.push(window.setTimeout(() => setPhase('hold'), FADE_IN_MS));
    timersRef.current.push(window.setTimeout(() => setPhase('out'), FADE_IN_MS + HOLD_MS));
    timersRef.current.push(
      window.setTimeout(() => setPhase('done'), FADE_IN_MS + HOLD_MS + FADE_OUT_MS),
    );
  }, [offlineReturn]);

  useEffect(
    () => () => {
      for (const t of timersRef.current) window.clearTimeout(t);
    },
    [],
  );

  if (!line || phase === 'done') return null;

  const cls =
    phase === 'in'
      ? 'dfui-return dfui-return-in'
      : phase === 'out'
        ? 'dfui-return dfui-return-out'
        : 'dfui-return dfui-return-in';

  return (
    <div className={cls} aria-hidden>
      {line}
    </div>
  );
}
