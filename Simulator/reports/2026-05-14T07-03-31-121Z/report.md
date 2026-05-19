# Long-burn calibration — 2026-05-14T07:03:31.123Z

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

### realistic-engaged × comp-rusher (N=20, mode=completion)

- DNF: 0/20
- Time to complete target tier p10 / p50 / p90: 2d 10h / 3d 15h / 4d 19h
- Total target range: 2d 2h - 4d 8h  →  drift +13.0%  [within]
- Active engagement p10 / p50 / p90: 3h 15m / 4h 30m / 5h 15m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 9m 47s | 9m 47s / 9m 47s | 8m 0s - 15m 0s | -14.9% | within | 1 / 1 | 1.00× | within-band |
| T2 | 4h 31m | 1h 57m / 19h 25m | 2h 0m - 8h 0m | -9.5% | within | 194418 / 1764 | 110.22× | above-band |
| T3 | 1d 11h | 21h 0m / 2d 11h | 1d 0h - 2d 0h | -0.7% | within | 5.33e+7 / 8.04e+6 | 6.62× | above-band |
| T4 | 1d 12h | 23h 12m / 2d 23h | 1d 0h - 2d 0h | +1.7% | within | 3.45e+11 / 1.00e+11 | 3.44× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T4 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-rusher | completion | primary | 20 | 0/20 | 2d 10h | 3d 15h | 4d 19h | +13.0% [within] | 3.44× [above-band] | engagement-profile |

## Anomalies / flags

- (none flagged)

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

