// ui/UpgradeCard.tsx — PROSE-FIRST upgrade card (scaffold §3 G5).
//
// ── LOAD-BEARING: the prose-first rule ──────────────────────────────────
// EXACTLY FOUR content fields and nothing else:
//   1. name         — real-cosmology term (from UPGRADES).
//   2. clinical desc — one-line clinical register (Two-voice UI). NO first or
//                      second person, no editorializing, no agency.
//   3. cost          — cost of the NEXT purchase (or "Maxed" / "Owned").
//   4. level         — current owned level.
// FORBIDDEN (exhaustively): efficiency badges, MPS/MPC/AC summaries, ROI,
// speed multipliers, completion %, sort/best-buy/recommended markers, synergy
// indicators, max-buy/multi-buy buttons, tooltips revealing numeric effects.
// None of those appear here.
//
// AFFORDABILITY GLOW carve-out: a single subtle "within reach" warmth — the
// .dfui-affordable class warms the top hairline + the cost color. It is (a)
// subtle warmth, not pulse/blink; (b) IDENTICAL for every affordable card with
// no cost / best-buy differentiation; (c) a static state class, not animated
// past the first-affordable moment. The CSS transition on `color` is a one-shot
// fade as the card crosses into affordability, never a loop.
//
// CLINICAL DESCRIPTION SOURCE: the engine's `desc` fields are narrator-voice
// prose ("we are pulling more than we used to") — that is the FADING register
// and relocates to the first-purchase NarratorSurface line, NOT the persistent
// card. The persistent clinical one-liners live in ui/clinicalDescriptions.ts
// (the CLINICAL register — no first/second person, no agency) and are rendered
// here. The two registers do not cross. T1–T3 are written; an upgrade with no
// clinical entry renders an empty line (CSS min-height holds the layout height
// so cards stay uniform) — we never invent prose or borrow the narrator line.
//
// Tapping an affordable card fires sendBuy(name). A maxed/owned card is inert.

import type { Upgrade } from '../engine';
import { cost } from '../engine';
import { sendBuy } from '../workers/engineClient';
import { fmtCost } from './format';
import { clinicalDescFor } from './clinicalDescriptions';

interface UpgradeCardProps {
  upgrade: Upgrade;
  level: number;
  affordable: boolean;
}

export function UpgradeCard({ upgrade, level, affordable }: UpgradeCardProps) {
  const maxed = level >= upgrade.maxLevels;
  const oneShot = upgrade.maxLevels === 1;
  const nextCost = maxed ? null : cost(upgrade, level);

  // Terminal-state slot text per the prose-first rule: max-N stackables show
  // "Maxed"; purchased one-shots show "Owned".
  let costText: string;
  let terminal = false;
  if (maxed) {
    terminal = true;
    costText = oneShot ? 'Owned' : 'Maxed';
  } else {
    costText = nextCost != null ? fmtCost(nextCost) : '—';
  }

  // Only an affordable, non-maxed card is interactive. A maxed card is inert
  // (it stays in the sheet until tier transition per the terminal-state rule).
  const interactive = affordable && !maxed;

  const onBuy = () => {
    if (interactive) sendBuy(upgrade.name);
  };

  return (
    <button
      type="button"
      data-ui
      className={`dfui-card ${affordable && !maxed ? 'dfui-affordable' : ''}`}
      onClick={onBuy}
      disabled={!interactive}
      aria-label={`${upgrade.name}, level ${level}, cost ${costText}`}
    >
      {/* 1. name */}
      <div className="dfui-card-name">{upgrade.name}</div>

      {/* 2. clinical description — the persistent CLINICAL register (Two-voice
          UI). Distinct from the narrator's fading "we" flavor, which relocates
          to the one-time first-purchase fade-in via NarratorSurface. A missing
          entry renders empty (the slot holds its layout height). */}
      <div className="dfui-card-desc">{clinicalDescFor(upgrade.name)}</div>

      <div className="dfui-card-row">
        {/* 3. cost (or terminal Maxed/Owned) */}
        <div className={`dfui-card-cost ${terminal ? 'dfui-terminal' : ''}`}>{costText}</div>
        {/* 4. current level */}
        <div className="dfui-card-level">L{level}</div>
      </div>
    </button>
  );
}
