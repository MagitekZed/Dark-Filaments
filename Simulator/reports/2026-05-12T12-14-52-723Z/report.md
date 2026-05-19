# Long-burn calibration — 2026-05-12T12:14:52.727Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T3
- Pairings: 12
- Total runs: 36, DNFs: 3 (excluded from percentiles per plan §4 C2)
- DNFs by reason: budget-exhausted=3
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

## Secondary pairings (informational; primary is gating)

| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | T3 mass ratio | Conf |
|---|---|---|---|---|---|---|---|---|---|
| engaged-high × completionist | completion | 3 | 0/3 | 18h 6m | 1d 1h | 2d 9h | -48.1% [HIGH-under] | 1682.28× [within-band] | ok |
| engaged-burst × completionist | completion | 3 | 0/3 | 1d 2h | 1d 13h | 3d 5h | -22.7% [HIGH-under] | 5358.36× [within-band] | ok |
| casual-steady × completionist | completion | 3 | 0/3 | 2d 4h | 3d 2h | 7d 0h | n/a | 1945.29× [within-band] | ok |
| casual-steady × consolidation-threshold | threshold | 3 | 0/3 | 2d 4h | 3d 2h | 6d 9h | n/a | 5296.72× [within-band] | ok |
| casual-evening × consolidation-threshold | threshold | 3 | 0/3 | 1d 21h | 2d 20h | 6d 9h | n/a | 2780.59× [within-band] | ok |
| drift-light × consolidation-threshold | threshold | 3 | 0/3 | 5d 8h | 7d 15h | 15.2d | n/a | 6081.14× [within-band] | ok |

## Stress pairings (adversarial profiles; high-DNF expected)

| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | T3 mass ratio | Conf |
|---|---|---|---|---|---|---|---|---|---|
| engaged-steady × lazy-stackable | threshold | 3 | 0/3 | 17h 51m | 1d 1h | 2d 3h | -38.6% [HIGH-under] | 1273.80× [within-band] | ok |
| engaged-steady × idle-clicker | threshold | 3 | 3/3 | — | — | — | — | — | low |

## Legacy reference (continuous-bot cross-check)

Continuous bot pairings use runner.runSimulation chained across tiers — same path as `t3_calibrate.js` / `t4_calibrate.js`. Numbers should match prior calibration probes; deviation here means the engine has drifted from its T1-T4 baseline.

| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | T3 mass ratio | Conf |
|---|---|---|---|---|---|---|---|---|---|
| bot-100cpm × greedy-vpc-1.5 | completion | 3 | 0/3 | 1h 13m | 1h 13m | 1h 13m | n/a | 1.00× [within-band] | ok |
| bot-60cpm × greedy-vpc-1.5 | completion | 3 | 0/3 | 1h 20m | 1h 20m | 1h 20m | n/a | 1.19× [within-band] | ok |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T3 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| engaged-steady × completionist | completion | primary | 3 | 0/3 | 17h 51m | 1d 1h | 2d 8h | -48.6% [HIGH-under] | 355.22× [within-band] | engagement-profile |
| engaged-steady × consolidation-threshold | threshold | primary | 3 | 0/3 | 17h 51m | 1d 1h | 2d 8h | -38.6% [HIGH-under] | 2081.70× [within-band] | engagement-profile |
| engaged-high × completionist | completion | secondary | 3 | 0/3 | 18h 6m | 1d 1h | 2d 9h | -48.1% [HIGH-under] | 1682.28× [within-band] | engagement-profile |
| engaged-burst × completionist | completion | secondary | 3 | 0/3 | 1d 2h | 1d 13h | 3d 5h | -22.7% [HIGH-under] | 5358.36× [within-band] | engagement-profile |
| casual-steady × completionist | completion | secondary | 3 | 0/3 | 2d 4h | 3d 2h | 7d 0h | n/a | 1945.29× [within-band] | engagement-profile |
| casual-steady × consolidation-threshold | threshold | secondary | 3 | 0/3 | 2d 4h | 3d 2h | 6d 9h | n/a | 5296.72× [within-band] | engagement-profile |
| casual-evening × consolidation-threshold | threshold | secondary | 3 | 0/3 | 1d 21h | 2d 20h | 6d 9h | n/a | 2780.59× [within-band] | engagement-profile |
| drift-light × consolidation-threshold | threshold | secondary | 3 | 0/3 | 5d 8h | 7d 15h | 15.2d | n/a | 6081.14× [within-band] | engagement-profile |
| engaged-steady × lazy-stackable | threshold | stress | 3 | 0/3 | 17h 51m | 1d 1h | 2d 3h | -38.6% [HIGH-under] | 1273.80× [within-band] | engagement-profile |
| engaged-steady × idle-clicker | threshold | stress | 3 | 3/3 | — | — | — | — | — | engagement-profile |
| bot-100cpm × greedy-vpc-1.5 | completion | legacy | 3 | 0/3 | 1h 13m | 1h 13m | 1h 13m | n/a | 1.00× [within-band] | continuous-bot |
| bot-60cpm × greedy-vpc-1.5 | completion | legacy | 3 | 0/3 | 1h 20m | 1h 20m | 1h 20m | n/a | 1.19× [within-band] | continuous-bot |

## Anomalies / flags

- engaged-steady × completionist total: drift -48.6% [HIGH-under]
- engaged-steady × completionist T1: p50 3h 52m vs target 2h 0m - 4h 0m → +29.0% [HIGH-over]
- engaged-steady × completionist T2: p50 12h 3m vs target 8h 0m - 12h 0m → +20.5% [HIGH-over]
- engaged-steady × completionist T3: p50 2h 47m vs target 1d 0h - 2d 0h → -92.2% [HIGH-under]
- engaged-steady × consolidation-threshold total: drift -38.6% [HIGH-under]
- engaged-steady × consolidation-threshold T1: p50 3h 49m vs target 2h 0m - 4h 0m → +27.5% [HIGH-over]
- engaged-steady × consolidation-threshold T2: p50 12h 5m vs target 6h 0m - 10h 0m → +51.2% [HIGH-over]
- engaged-steady × consolidation-threshold T3: p50 2h 47m vs target 1d 0h - 1d 12h → -90.7% [HIGH-under]
- engaged-high × completionist total: drift -48.1% [HIGH-under]
- engaged-high × completionist T1: p50 3h 50m vs target 2h 0m - 4h 0m → +27.9% [HIGH-over]
- engaged-high × completionist T2: p50 12h 10m vs target 8h 0m - 12h 0m → +21.7% [HIGH-over]
- engaged-high × completionist T3: p50 2h 57m vs target 1d 0h - 2d 0h → -91.8% [HIGH-under]
- engaged-burst × completionist total: drift -22.7% [HIGH-under]
- engaged-burst × completionist T1: p50 5h 42m vs target 2h 0m - 4h 0m → +90.5% [HIGH-over]
- engaged-burst × completionist T2: p50 18h 12m vs target 8h 0m - 12h 0m → +82.1% [HIGH-over]
- engaged-burst × completionist T3: p50 3h 46m vs target 1d 0h - 2d 0h → -89.5% [HIGH-under]
- engaged-steady × lazy-stackable total: drift -38.6% [HIGH-under]
- engaged-steady × lazy-stackable T1: p50 3h 49m vs target 2h 0m - 4h 0m → +27.3% [HIGH-over]
- engaged-steady × lazy-stackable T2: p50 12h 6m vs target 6h 0m - 10h 0m → +51.3% [HIGH-over]
- engaged-steady × lazy-stackable T3: p50 2h 27m vs target 1d 0h - 1d 12h → -91.8% [HIGH-under]
- engaged-steady × idle-clicker: low-confidence (DNF 100% > 50%; percentiles read off <half the population)

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

