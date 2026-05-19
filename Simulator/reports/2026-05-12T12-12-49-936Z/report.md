# Long-burn calibration — 2026-05-12T12:12:49.941Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T3
- Pairings: 2
- Total runs: 6, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 30 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### engaged-steady × completionist (N=3, mode=completion)

- DNF: 0/3
- Total calendar p10 / p50 / p90: 17h 51m / 1d 1h / 2d 8h
- Total target range: 1d 10h - 2d 16h  →  drift -48.6%  [HIGH-under]
- Active engagement p10 / p50 / p90: 45m 0s / 45m 0s / 45m 0s

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 3h 52m | 3h 0m / 13h 26m | 2h 0m - 4h 0m | +29.0% | HIGH-over | 37 / 37 | 1.00× | within-band |
| T2 | 12h 3m | 9h 17m / 1d 23h | 8h 0m - 12h 0m | +20.5% | HIGH-over | 3.38e+6 / 1177 | 2875.74× | within-band |
| T3 | 2h 47m | 2h 27m / 5h 36m | 1d 0h - 2d 0h | -92.2% | HIGH-under | 6.27e+8 / 1.76e+6 | 355.22× | within-band |

### engaged-steady × consolidation-threshold (N=3, mode=threshold)

- DNF: 0/3
- Total calendar p10 / p50 / p90: 17h 51m / 1d 1h / 2d 8h
- Total target range: 1d 8h - 2d 2h  →  drift -38.6%  [HIGH-under]
- Active engagement p10 / p50 / p90: 45m 0s / 45m 0s / 45m 0s

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 3h 49m | 2h 58m / 13h 23m | 2h 0m - 4h 0m | +27.5% | HIGH-over | 18 / 18 | 1.00× | within-band |
| T2 | 12h 5m | 9h 19m / 1d 23h | 6h 0m - 10h 0m | +51.2% | HIGH-over | 3.46e+6 / 360 | 9613.73× | within-band |
| T3 | 2h 47m | 2h 27m / 5h 37m | 1d 0h - 1d 12h | -90.7% | HIGH-under | 6.06e+8 / 291081 | 2081.70× | within-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T3 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| engaged-steady × completionist | completion | primary | 3 | 0/3 | 17h 51m | 1d 1h | 2d 8h | -48.6% [HIGH-under] | 355.22× [within-band] | engagement-profile |
| engaged-steady × consolidation-threshold | threshold | primary | 3 | 0/3 | 17h 51m | 1d 1h | 2d 8h | -38.6% [HIGH-under] | 2081.70× [within-band] | engagement-profile |

## Anomalies / flags

- engaged-steady × completionist total: drift -48.6% [HIGH-under]
- engaged-steady × completionist T1: p50 3h 52m vs target 2h 0m - 4h 0m → +29.0% [HIGH-over]
- engaged-steady × completionist T2: p50 12h 3m vs target 8h 0m - 12h 0m → +20.5% [HIGH-over]
- engaged-steady × completionist T3: p50 2h 47m vs target 1d 0h - 2d 0h → -92.2% [HIGH-under]
- engaged-steady × consolidation-threshold total: drift -38.6% [HIGH-under]
- engaged-steady × consolidation-threshold T1: p50 3h 49m vs target 2h 0m - 4h 0m → +27.5% [HIGH-over]
- engaged-steady × consolidation-threshold T2: p50 12h 5m vs target 6h 0m - 10h 0m → +51.2% [HIGH-over]
- engaged-steady × consolidation-threshold T3: p50 2h 47m vs target 1d 0h - 1d 12h → -90.7% [HIGH-under]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

