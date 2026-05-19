# Long-burn calibration — 2026-05-13T02:09:47.325Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T1
- Pairings: 1
- Total runs: 10, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 7 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### engaged-steady × completionist (N=10, mode=completion)

- DNF: 0/10
- Total calendar p10 / p50 / p90: 2h 41m / 5h 9m / 1d 15h
- Total target range: 2h 0m - 4h 0m  →  drift +72.2%  [HIGH-over]
- Active engagement p10 / p50 / p90: 15m 0s / 15m 0s / 15m 0s

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 5h 9m | 2h 41m / 1d 15h | 2h 0m - 4h 0m | +72.2% | HIGH-over | 9 / 9 | 1.00× | within-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T1 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| engaged-steady × completionist | completion | primary | 10 | 0/10 | 2h 41m | 5h 9m | 1d 15h | +72.2% [HIGH-over] | 1.00× [within-band] | engagement-profile |

## Anomalies / flags

- engaged-steady × completionist total: drift +72.2% [HIGH-over]
- engaged-steady × completionist T1: p50 5h 9m vs target 2h 0m - 4h 0m → +72.2% [HIGH-over]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

