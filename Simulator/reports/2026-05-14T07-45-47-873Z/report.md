# Long-burn calibration — 2026-05-14T07:45:47.901Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T3
- Pairings: 1
- Total runs: 50, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 7 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × comp-hoarder (N=50, mode=completion)

- DNF: 0/50
- Time to complete target tier p10 / p50 / p90: 1d 3h / 1d 13h / 2d 11h
- Total target range: 1d 2h - 2d 8h  →  drift -10.0%  [within]
- Active engagement p10 / p50 / p90: 2h 0m / 2h 30m / 3h 0m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 11m 40s | 11m 40s / 11m 40s | 8m 0s - 15m 0s | +1.4% | within | 1 / 1 | 1.00× | within-band |
| T2 | 5h 1m | 1h 41m / 13h 38m | 2h 0m - 8h 0m | +0.4% | within | 213263 / 1764 | 120.90× | above-band |
| T3 | 1d 7h | 19h 25m / 2d 4h | 1d 0h - 2d 0h | -12.1% | within | 5.74e+7 / 8.04e+6 | 7.14× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T3 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-hoarder | completion | primary | 50 | 0/50 | 1d 3h | 1d 13h | 2d 11h | -10.0% [within] | 7.14× [above-band] | engagement-profile |

## Anomalies / flags

- (none flagged)

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

