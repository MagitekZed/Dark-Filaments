# Long-burn calibration — 2026-05-13T12:14:29.879Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T5
- Pairings: 1
- Total runs: 1, DNFs: 1 (excluded from percentiles per plan §4 C2)
- DNFs by reason: budget-exhausted=1
- Seed: 1
- Max calendar budget: 365 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × comp-hoarder (N=1, mode=completion)

- DNF: 1/1  **low-confidence (DNF > 50%)**  (budget-exhausted=1)
- Time to complete target tier p10 / p50 / p90: — / — / —
- Total target range: 5d 2h - 8d 8h  →  drift —  [—]

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | — | — / — | 8m 0s - 15m 0s | — | (no data) | — | — | — |
| T2 | — | — / — | 2h 0m - 8h 0m | — | (no data) | — | — | — |
| T3 | — | — / — | 1d 0h - 2d 0h | — | (no data) | — | — | — |
| T4 | — | — / — | 1d 0h - 2d 0h | — | (no data) | — | — | — |
| T5 | — | — / — | 3d 0h - 4d 0h | — | (no data) | — | — | — |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T5 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-hoarder | completion | primary | 1 | 1/1 | — | — | — | — | — | engagement-profile |

## Anomalies / flags

- realistic-engaged × comp-hoarder: low-confidence (DNF 100% > 50%; percentiles read off <half the population)

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

