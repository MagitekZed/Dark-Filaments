// src/test/ui/boot.smoke.spec.ts — the single end-to-end UI smoke (scaffold §7 G7).
//
// ONE test (not a suite). It exercises the whole player loop against the REAL
// PRODUCTION BUNDLE (Playwright's webServer runs `vite preview` over dist/):
//
//   1. boot → title screen → click Begin → T1 game chrome is visible
//   2. a tap on the scene raises the mass readout
//   3. opening the upgrade sheet and buying an affordable card increments its
//      level (L0 → L1) and drops mass
//   4. reload restores the owned level (exercises G3 persistence)
//   5. the Consolidate gate fires a T1 → T2 tier transition
//
// DETERMINISM: the prod build has NO dev tools (tree-shaken), so we cannot use
// TIME_SKIP / tier-skip to reach the consolidation gate. Instead we SEED a v5
// localStorage save (test-only) whose engine state is at T1 with consolidation
// ALREADY at threshold (so the Consolidate affordance is present right after
// Begin) and ample mass (so several upgrade cards are affordable for the buy
// step). The schemaSig is computed with the engine's real computeSchemaSig over
// the real UPGRADES, so deserializeState accepts the save. savedAt is stamped at
// injection time so the boot offline-accrual window is ~0 — no dependence on
// real elapsed/calendar time.
//
// The seed is written via addInitScript (runs before page scripts on every
// navigation, including reload) but GUARDED: it only writes when no save exists
// yet. So the first navigation seeds; the in-test purchase autosaves over it;
// the reload then restores the REAL purchased state rather than re-seeding.

import { test, expect, type Page } from '@playwright/test';
import { computeSchemaSig, UPGRADES } from '../../engine';
import type { SavePayloadV5, EngineState } from '../../engine';

const LOCAL_KEY = 'dark-filaments:save:v1';

// A buyable T1 stackable we assert L0 → L1 on. Solar Wind is the cheapest T1
// upgrade (initCost 0.012) and starts at level 0 in the seed.
const BUY_UPGRADE = 'Solar Wind';

// Build a fresh T1 levels map (every upgrade at 0) so the seed is a clean
// just-started-T1 universe — except consolidation, which we force to threshold.
function freshLevels(): Record<string, number> {
  const levels: Record<string, number> = {};
  for (const u of UPGRADES) levels[u.name] = 0;
  return levels;
}

// The seeded engine state: T1, consolidation already at the 1.0 gate, plenty of
// mass for the buy step. Everything else is a vanilla fresh-universe shape.
function seedGameState(): EngineState {
  return {
    // Small mass on purpose: at the ~0.5 M☉ range fmtMass renders TWO decimals
    // (0.50 M☉), so a tap (+baseMpc 0.0012) and a Solar Wind buy (−0.012) move
    // the DISPLAYED value across rounding boundaries — at mass=50 the one-decimal
    // format would swallow those sub-unit deltas and the assertions would be
    // blind. 0.5 still affords every cheap T1 card (Solar Wind initCost 0.012).
    mass: 0.5,
    consolidation: 1.0,            // == T1 threshold → Consolidate ready on Begin
    currentTier: 1,
    levels: freshLevels(),
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 },
    consolidationThreshold: 1.0,   // T1 gate
    consolidationHitMs: 0,
    totalClicks: 0,
    sessionStart: 0,               // overwritten by savedAt at injection
    totalPausedMs: 0,
    massGainedClicks: 0,
    massGainedPassive: 0,
    massGainedAuto: 0,
    tickCount: 0,
    tierSnapshots: [{
      tier: 1, startMs: 0, thresholdHitMs: 0, endMs: null,
      levelsAtEnd: null, massAtEnd: null, consolidationHitMs: 0,
    }],
  };
}

function seedPayload(savedAt: number): SavePayloadV5 {
  const game = seedGameState();
  game.sessionStart = savedAt;
  return {
    version: 5,
    savedAt,
    schemaSig: computeSchemaSig(UPGRADES),
    game,
    meta: { appBuild: 'smoke-seed', lastTier: 1 },
  };
}

// Read the mass readout text (the large serif counter) as a comparable number.
async function readMass(page: Page): Promise<number> {
  const txt = (await page.locator('.dfui-mass-text').first().textContent()) ?? '';
  // fmtMass output may carry unit suffixes / separators; strip non-numeric/non-dot.
  const cleaned = txt.replace(/[^0-9.]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
}

test('boot → tap → buy → reload → consolidate (T1 → T2)', async ({ page }) => {
  const savedAt = Date.now();
  const payload = seedPayload(savedAt);
  const serialized = JSON.stringify(payload);

  // Seed the save before any page script runs — but only if none exists, so the
  // post-purchase autosave survives the reload (re-seeding would wipe the buy).
  await page.addInitScript(
    ({ key, value }) => {
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, value);
      }
    },
    { key: LOCAL_KEY, value: serialized },
  );

  // ---- 1. boot → title → Begin → T1 chrome -------------------------------
  await page.goto('/');

  const beginBtn = page.getByRole('button', { name: 'Begin' });
  await expect(beginBtn).toBeVisible({ timeout: 15_000 });
  await beginBtn.click();

  // The game chrome surfaces (mass readout + the unlabeled causal number).
  const massText = page.locator('.dfui-mass-text').first();
  await expect(massText).toBeVisible({ timeout: 15_000 });
  // The unlabeled static 13-digit number is present (Act-1 literal constant).
  await expect(page.locator('.dfui-causal-text')).toContainText('8,419,302,776,043');

  // ---- 2. a tap raises mass ----------------------------------------------
  const massBefore = await readMass(page);
  // Tap the scene (center of viewport, away from chrome corners). CosmicCanvas
  // owns the tap → optimistic reflect + CLICK; mass rises by mpc. 30 taps at
  // baseMpc 0.0012 ≈ +0.036 M☉ — several display units (0.01 each) at the 0.5
  // range, so the rise is unambiguous even if a tap or two miss.
  const vp = page.viewportSize() ?? { width: 1280, height: 720 };
  for (let i = 0; i < 30; i++) {
    await page.mouse.click(vp.width / 2, vp.height / 2);
  }
  await expect
    .poll(async () => readMass(page), { timeout: 10_000, message: 'mass should rise after taps' })
    .toBeGreaterThan(massBefore);

  // ---- 3. a purchase increments a level (L0 → L1) and spends mass --------
  await page.locator('.dfui-upgrade-hit').click();
  const card = page.locator('.dfui-card', { hasText: BUY_UPGRADE });
  await expect(card).toBeVisible({ timeout: 10_000 });
  // Pre-buy: level reads L0.
  await expect(card.locator('.dfui-card-level')).toHaveText('L0');

  const massBeforeBuy = await readMass(page);
  await card.click();

  // Post-buy: level reads L1 — the AUTHORITATIVE proof of purchase (the worker
  // validated cost, decremented mass, incremented the level, and the snapshot
  // reconciled it). This is the load-bearing purchase assertion.
  await expect(card.locator('.dfui-card-level')).toHaveText('L1', { timeout: 10_000 });

  // Mass spend: the displayed counter must NOT rise after the buy. We do not tap
  // post-buy, and Solar Wind L1 passive income (mps 0.00013/s) is far below the
  // 0.01 display precision over the wait, so the value holds or drops — never
  // climbs. (Note the optimistic-mass design in selectors.ts: selectMass shows
  // max(optimistic, authoritative); the optimistic value, bumped by the taps,
  // holds the display steady at the pre-buy figure until authoritative income
  // overtakes it — so we assert ≤, not strict <, which faithfully encodes the
  // spend without fighting the deliberate no-flicker-down behavior.)
  await page.waitForTimeout(1500);
  expect(await readMass(page)).toBeLessThanOrEqual(massBeforeBuy);

  // Close the sheet before reloading (tidy; the close-zone is the scrim).
  await page.locator('.dfui-sheet-close-zone').click();

  // ---- 4. reload restores the owned level --------------------------------
  // Persistence is the gate here, not real time: the autosave interval is 10 s
  // and beforeunload's save is async (may not round-trip before navigation), so
  // we must wait for an autosave tick to flush the purchase to localStorage
  // BEFORE reloading — otherwise the buy is lost and the restore check is moot.
  // Poll the localStorage save until it reflects Solar Wind L1 (deterministic:
  // gated on the persisted payload, not on a fixed sleep).
  await expect
    .poll(
      async () =>
        page.evaluate((key) => {
          const raw = window.localStorage.getItem(key);
          if (!raw) return -1;
          try {
            const parsed = JSON.parse(raw) as { game?: { levels?: Record<string, number> } };
            return parsed.game?.levels?.['Solar Wind'] ?? -1;
          } catch {
            return -1;
          }
        }, LOCAL_KEY),
      { timeout: 20_000, message: 'autosave should flush the purchase (Solar Wind L1) to localStorage' },
    )
    .toBe(1);

  await page.reload();
  // Begin again (title shows on every load; the engine is already restored).
  const beginAgain = page.getByRole('button', { name: 'Begin' });
  await expect(beginAgain).toBeVisible({ timeout: 15_000 });
  await beginAgain.click();
  await expect(page.locator('.dfui-mass-text').first()).toBeVisible({ timeout: 15_000 });

  // Re-open the sheet → the owned level persisted (L1, not reset to L0).
  await page.locator('.dfui-upgrade-hit').click();
  const cardAfter = page.locator('.dfui-card', { hasText: BUY_UPGRADE });
  await expect(cardAfter.locator('.dfui-card-level')).toHaveText('L1', { timeout: 10_000 });
  await page.locator('.dfui-sheet-close-zone').click();

  // ---- 5. a forced consolidation fires a T1 → T2 tier transition ---------
  // The seed put consolidation at threshold, so the Consolidate affordance is
  // present. (Buying Solar Wind adds 0 consolidation, so the gate stays open.)
  const consolidateBtn = page.locator('.dfui-consolidate-btn');
  await expect(consolidateBtn).toBeVisible({ timeout: 10_000 });
  await consolidateBtn.click();

  // After the tier-up the engine advances to T2. The clearest engine-truth
  // assertion available to the smoke is the T2 upgrade slate: re-open the sheet
  // and assert a T2-only upgrade card appears (Stellar Kinematics is the first
  // T2 stackable; it never exists in the T1 slate). Its presence proves the
  // worker recomposed carry and switched the active tier to 2.
  await expect
    .poll(
      async () => {
        // Re-open the sheet each poll (a tier transition may re-render / the
        // sheet may have been left closed); the hit target is idempotent.
        const hit = page.locator('.dfui-upgrade-hit');
        if (await hit.isVisible()) await hit.click();
        return page.locator('.dfui-card', { hasText: 'Stellar Kinematics' }).count();
      },
      { timeout: 15_000, message: 'T2 slate (Stellar Kinematics) should appear after consolidation' },
    )
    .toBeGreaterThan(0);
});
