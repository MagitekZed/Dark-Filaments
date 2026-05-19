# Long-burn calibration — 2026-05-14T07:04:22.012Z

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

### realistic-engaged × thr-rusher (N=20, mode=threshold)

- DNF: 0/20
- Time to complete target tier p10 / p50 / p90: 2d 12h / 2d 20h / 4d 7h
- Total target range: 1d 23h - 3d 14h  →  drift +2.1%  [within]
- Active engagement p10 / p50 / p90: 3h 15m / 4h 0m / 4h 45m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 9m 29s | 9m 29s / 9m 29s | 7m 0s - 12m 0s | -0.2% | within | 1 / 1 | 0.99× | within-band |
| T2 | 4h 31m | 1h 58m / 19h 25m | 1h 30m - 6h 0m | +20.8% | HIGH-over | 177252 / 963 | 184.07× | above-band |
| T3 | 1d 6h | 21h 0m / 1d 14h | 22h 0m - 1d 20h | -6.9% | within | 5.34e+6 / 1.22e+6 | 4.40× | above-band |
| T4 | 1d 9h | 1d 0h / 2d 12h | 1d 0h - 1d 12h | +12.0% | within | 4.21e+10 / 2.00e+10 | 2.10× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T4 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × thr-rusher | threshold | primary | 20 | 0/20 | 2d 12h | 2d 20h | 4d 7h | +2.1% [within] | 2.10× [above-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × thr-rusher T2: p50 4h 31m vs target 1h 30m - 6h 0m → +20.8% [HIGH-over]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

