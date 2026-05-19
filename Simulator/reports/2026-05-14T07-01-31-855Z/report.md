# Long-burn calibration — 2026-05-14T07:01:31.858Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T4
- Pairings: 1
- Total runs: 20, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 14 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × comp-hoarder (N=20, mode=completion)

- DNF: 0/20
- Time to complete target tier p10 / p50 / p90: 1d 23h / 2d 18h / 3d 16h
- Total target range: 2d 2h - 4d 8h  →  drift -13.5%  [within]
- Active engagement p10 / p50 / p90: 3h 0m / 3h 30m / 4h 15m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 11m 40s | 11m 40s / 11m 40s | 8m 0s - 15m 0s | +1.4% | within | 1 / 1 | 1.00× | within-band |
| T2 | 4h 29m | 1h 56m / 19h 23m | 2h 0m - 8h 0m | -10.1% | within | 186635 / 1764 | 105.81× | above-band |
| T3 | 1d 6h | 16h 12m / 2d 8h | 1d 0h - 2d 0h | -14.6% | within | 6.32e+7 / 8.04e+6 | 7.86× | above-band |
| T4 | 1d 2h | 15h 51m / 1d 22h | 1d 0h - 2d 0h | -27.4% | HIGH-under | 2.32e+11 / 1.00e+11 | 2.32× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T4 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-hoarder | completion | primary | 20 | 0/20 | 1d 23h | 2d 18h | 3d 16h | -13.5% [within] | 2.32× [above-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × comp-hoarder T4: p50 1d 2h vs target 1d 0h - 2d 0h → -27.4% [HIGH-under]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

