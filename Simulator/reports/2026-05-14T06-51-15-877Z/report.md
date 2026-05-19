# Long-burn calibration — 2026-05-14T06:51:15.881Z

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
- Time to complete target tier p10 / p50 / p90: 2d 5h / 2d 19h / 4d 12h
- Total target range: 2d 2h - 4d 8h  →  drift -12.1%  [within]
- Active engagement p10 / p50 / p90: 3h 15m / 3h 45m / 4h 30m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 9m 47s | 9m 47s / 9m 47s | 8m 0s - 15m 0s | -14.9% | within | 1 / 1 | 1.00× | within-band |
| T2 | 4h 31m | 1h 57m / 19h 25m | 2h 0m - 8h 0m | -9.5% | within | 194418 / 1764 | 110.22× | above-band |
| T3 | 1d 11h | 21h 0m / 2d 11h | 1d 0h - 2d 0h | -0.7% | within | 5.33e+7 / 8.04e+6 | 6.62× | above-band |
| T4 | 1d 0h | 18h 27m / 2d 11h | 1d 0h - 2d 0h | -31.1% | HIGH-under | 8.66e+10 / 3.13e+10 | 2.77× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T4 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-rusher | completion | primary | 20 | 0/20 | 2d 5h | 2d 19h | 4d 12h | -12.1% [within] | 2.77× [above-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × comp-rusher T4: p50 1d 0h vs target 1d 0h - 2d 0h → -31.1% [HIGH-under]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

