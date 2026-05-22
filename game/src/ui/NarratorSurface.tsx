// ui/NarratorSurface.tsx — ephemeral fading narrator lines (scaffold §3 G5).
//
// ── Two-voice UI rule: this is the FADING NARRATOR register ──────────────
// Two ephemeral surfaces, both narrator prose ("we"), both fading (never
// persistent):
//   1. Tier-up line — fires on a tier-up (off selectRecentTierUp). Centered,
//      top-third, large serif italic. Uses the LOCKED authored lines in
//      narratorLines.ts; tiers without a locked line show nothing.
//   2. First-purchase fade-in — fires the first time an upgrade is purchased
//      (off selectRecentPurchase). Smaller, offset slot. Uses the engine's
//      authored `desc` / `descByLevel` flavor via getUpgradeFlavor (this is the
//      relocation the flavor-relocation rule calls for — the narrator-voice
//      flavor moves off the persistent card to a one-time fade-in).
//
// Engine dedup note (flavor-relocation rule "engine dedups against idle
// interjection scheduling"): both fire from one-shot snapshot riders that the
// worker clears after the next snapshot, but a rider can appear on more than one
// snapshot before clearing, so we dedup by a stable key (from->to for tier-up;
// name@tier:level for first purchase) and queue lines so two rapid events do not
// overlap. v0.1 has no idle-interjection scheduler yet; when one lands it shares
// this queue.
//
// NO new authoring (§11): tier-up lines come from narratorLines.ts (locked),
// first-purchase lines from the engine's authored fields. Missing → nothing.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { UPGRADES, getUpgradeFlavor } from '../engine';
import type { Upgrade } from '../engine';
import { useStore } from '../store';
import { selectRecentPurchase, selectRecentTierUp } from '../store/selectors';
import { tierUpLineFor } from './narratorLines';

// ─── Timing (absorbed from spike T2NarratorSurface) ──────────────────────
const TIER_UP_FADE_IN_MS = 1500;
const TIER_UP_HOLD_MS = 8000;
const TIER_UP_FADE_OUT_MS = 5000;
const TIER_UP_TOTAL_MS = TIER_UP_FADE_IN_MS + TIER_UP_HOLD_MS + TIER_UP_FADE_OUT_MS;

const FP_FADE_IN_MS = 800;
const FP_HOLD_MS = 6000;
const FP_FADE_OUT_MS = 3000;
const FP_TOTAL_MS = FP_FADE_IN_MS + FP_HOLD_MS + FP_FADE_OUT_MS;
const FP_QUEUE_GAP_MS = 500;

// First-purchase slots — all in the top 38% so they never overlap the upgrade
// sheet (bottom 55%). Each upgrade hashes deterministically to one slot.
const FP_POSITIONS: Array<{ top: string; left: string; maxWidth: string }> = [
  { top: '12%', left: '18%', maxWidth: '320px' },
  { top: '12%', left: '82%', maxWidth: '320px' },
  { top: '26%', left: '15%', maxWidth: '320px' },
  { top: '26%', left: '85%', maxWidth: '320px' },
  { top: '36%', left: '22%', maxWidth: '360px' },
  { top: '36%', left: '78%', maxWidth: '360px' },
];

function slotForKey(key: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
  }
  return h % FP_POSITIONS.length;
}

const UPGRADE_BY_NAME = new Map<string, Upgrade>(UPGRADES.map((u) => [u.name, u]));

type Phase = 'fading-in' | 'hold' | 'fading-out' | 'idle';

interface QueuedLine {
  text: string;
  slot: number;       // FP slot index; -1 = tier-up (centered, large)
}

export function NarratorSurface() {
  const recentTierUp = useStore(useShallow(selectRecentTierUp));
  const recentPurchase = useStore(useShallow(selectRecentPurchase));

  const seenTierUpRef = useRef<Set<string>>(new Set());
  const seenPurchaseRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<QueuedLine[]>([]);
  const playingRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const [active, setActive] = useState<QueuedLine | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  }, []);

  // playNext recurses to drain the queue. The recursion goes through a ref so
  // the callback does not reference itself before declaration (the chained
  // setTimeout reads playNextRef.current, set once below).
  const playNextRef = useRef<() => void>(() => {});

  const playNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      playingRef.current = false;
      setActive(null);
      setPhase('idle');
      return;
    }
    playingRef.current = true;
    setActive(next);
    setPhase('fading-in');
    const tierUp = next.slot === -1;
    const fadeIn = tierUp ? TIER_UP_FADE_IN_MS : FP_FADE_IN_MS;
    const hold = tierUp ? TIER_UP_HOLD_MS : FP_HOLD_MS;
    const total = tierUp ? TIER_UP_TOTAL_MS : FP_TOTAL_MS;
    timersRef.current.push(window.setTimeout(() => setPhase('hold'), fadeIn));
    timersRef.current.push(window.setTimeout(() => setPhase('fading-out'), fadeIn + hold));
    timersRef.current.push(
      window.setTimeout(() => {
        timersRef.current.push(window.setTimeout(() => playNextRef.current(), FP_QUEUE_GAP_MS));
      }, total),
    );
  }, []);

  // Keep the recursion target current (set in an effect, not during render).
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const enqueue = useCallback(
    (line: QueuedLine) => {
      queueRef.current.push(line);
      if (!playingRef.current) playNext();
    },
    [playNext],
  );

  // Tier-up → enqueue the locked authored line (if one exists for that tier).
  useEffect(() => {
    if (!recentTierUp) return;
    const key = `${recentTierUp.fromTier}->${recentTierUp.toTier}`;
    if (seenTierUpRef.current.has(key)) return;
    seenTierUpRef.current.add(key);
    const text = tierUpLineFor(recentTierUp.toTier);
    if (text) enqueue({ text, slot: -1 });
  }, [recentTierUp, enqueue]);

  // First purchase → enqueue the engine's authored flavor line (if any).
  useEffect(() => {
    if (!recentPurchase) return;
    const key = `${recentPurchase.name}@${recentPurchase.tier}:${recentPurchase.level}`;
    // Dedup per upgrade per game by NAME — only the first purchase fires a line.
    const nameKey = `${recentPurchase.name}@${recentPurchase.tier}`;
    if (seenPurchaseRef.current.has(nameKey)) return;
    void key;
    seenPurchaseRef.current.add(nameKey);
    const upgrade = UPGRADE_BY_NAME.get(recentPurchase.name);
    const text = getUpgradeFlavor(upgrade, recentPurchase.level, null);
    if (text) enqueue({ text, slot: slotForKey(recentPurchase.name) });
  }, [recentPurchase, enqueue]);

  // Cleanup timers on unmount.
  useEffect(() => () => clearTimers(), [clearTimers]);

  if (!active) return null;

  const tierUp = active.slot === -1;
  const fadeInMs = tierUp ? TIER_UP_FADE_IN_MS : FP_FADE_IN_MS;
  const fadeOutMs = tierUp ? TIER_UP_FADE_OUT_MS : FP_FADE_OUT_MS;
  const pos = tierUp ? null : FP_POSITIONS[active.slot];

  const opacity =
    phase === 'fading-in' ? 0 : phase === 'fading-out' ? 0 : 1;
  const transition =
    phase === 'fading-in'
      ? `opacity ${fadeInMs}ms ease-out`
      : phase === 'fading-out'
        ? `opacity ${fadeOutMs}ms ease-in`
        : 'none';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 8,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          top: tierUp ? '22%' : pos!.top,
          left: tierUp ? '50%' : pos!.left,
          transform: 'translate(-50%, -50%)',
          maxWidth: tierUp ? '720px' : pos!.maxWidth,
          width: tierUp ? '88%' : undefined,
          textAlign: 'center',
          fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
          fontWeight: 400,
          fontStyle: 'italic',
          fontSize: tierUp ? '26pt' : '16pt',
          lineHeight: 1.35,
          color: tierUp ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.85)',
          WebkitTextStroke: tierUp ? '0.4px rgba(0,0,0,0.55)' : '0.3px rgba(0,0,0,0.45)',
          paintOrder: 'stroke fill',
          opacity,
          transition,
        }}
        ref={(el) => {
          // Kick the fade-in transition: paint at 0, then rAF to the target.
          if (el && phase === 'fading-in') {
            requestAnimationFrame(() => {
              el.style.opacity = '1';
            });
          }
        }}
      >
        {active.text}
      </div>
    </div>
  );
}
