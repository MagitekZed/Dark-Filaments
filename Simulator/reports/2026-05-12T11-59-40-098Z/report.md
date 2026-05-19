# Long-burn calibration — 2026-05-12T11:59:40.100Z

- Build: long-burn-v1
- Harness: S3 (12-pairing matrix with weight-grouped sections; drift detection gated on engaged-timing profiles per plan §4 C1)
- Target tier: T3
- Pairings: 12
- Total runs: 60, DNFs: 5 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 30 days

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### engaged-steady × completionist (N=5, mode=completion)

- DNF: 0/5
- Total calendar p10 / p50 / p90: 12h 26m / 23h 41m / 2d 8h
- Total target range: 1d 10h - 2d 16h  →  drift -51.6%  [HIGH-under]
- Active engagement p10 / p50 / p90: 45m 0s / 45m 0s / 45m 0s

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag |
|---|---|---|---|---|---|
| T1 | 5h 3m | 3h 0m / 13h 26m | 2h 0m - 4h 0m | +68.5% | HIGH-over |
| T2 | 9h 17m | 2h 15m / 1d 23h | 8h 0m - 12h 0m | -7.1% | within |
| T3 | 2h 47m | 52m 21s / 16h 23m | 1d 0h - 2d 0h | -92.2% | HIGH-under |

### engaged-steady × consolidation-threshold (N=5, mode=threshold)

- DNF: 0/5
- Total calendar p10 / p50 / p90: 12h 26m / 23h 41m / 2d 8h
- Total target range: 1d 8h - 2d 2h  →  drift -42.2%  [HIGH-under]
- Active engagement p10 / p50 / p90: 45m 0s / 45m 0s / 45m 0s

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag |
|---|---|---|---|---|---|
| T1 | 5h 0m | 2h 58m / 13h 23m | 2h 0m - 4h 0m | +67.0% | HIGH-over |
| T2 | 9h 19m | 2h 17m / 1d 23h | 6h 0m - 10h 0m | +16.6% | HIGH-over |
| T3 | 2h 47m | 52m 27s / 16h 23m | 1d 0h - 1d 12h | -90.7% | HIGH-under |

## Secondary pairings (informational; primary is gating)

| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | Conf |
|---|---|---|---|---|---|---|---|---|
| engaged-high × completionist | completion | 5 | 0/5 | 12h 41m | 23h 56m | 2d 9h | -51.1% [HIGH-under] | ok |
| engaged-burst × completionist | completion | 5 | 0/5 | 18h 46m | 1d 11h | 3d 5h | -27.2% [HIGH-under] | ok |
| casual-steady × completionist | completion | 5 | 0/5 | 1d 11h | 2d 21h | 7d 0h | n/a | ok |
| casual-steady × consolidation-threshold | threshold | 5 | 0/5 | 1d 11h | 2d 21h | 6d 9h | n/a | ok |
| casual-evening × consolidation-threshold | threshold | 5 | 0/5 | 22h 10m | 1d 21h | 6d 9h | n/a | ok |
| drift-light × consolidation-threshold | threshold | 5 | 0/5 | 3d 16h | 7d 4h | 15.2d | n/a | ok |

## Stress pairings (adversarial profiles; high-DNF expected)

| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | Conf |
|---|---|---|---|---|---|---|---|---|
| engaged-steady × lazy-stackable | threshold | 5 | 0/5 | 12h 26m | 23h 41m | 2d 3h | -42.2% [HIGH-under] | ok |
| engaged-steady × idle-clicker | threshold | 5 | 5/5 | — | — | — | — | low |

## Legacy reference (continuous-bot cross-check)

Continuous bot pairings use runner.runSimulation chained across tiers — same path as `t3_calibrate.js` / `t4_calibrate.js`. Numbers should match prior calibration probes; deviation here means the engine has drifted from its T1-T4 baseline.

| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | Conf |
|---|---|---|---|---|---|---|---|---|
| bot-100cpm × greedy-vpc-1.5 | completion | 5 | 0/5 | 1h 13m | 1h 13m | 1h 13m | n/a | ok |
| bot-60cpm × greedy-vpc-1.5 | completion | 5 | 0/5 | 1h 20m | 1h 20m | 1h 20m | n/a | ok |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | Kind |
|---|---|---|---|---|---|---|---|---|---|
| engaged-steady × completionist | completion | primary | 5 | 0/5 | 12h 26m | 23h 41m | 2d 8h | -51.6% [HIGH-under] | engagement-profile |
| engaged-steady × consolidation-threshold | threshold | primary | 5 | 0/5 | 12h 26m | 23h 41m | 2d 8h | -42.2% [HIGH-under] | engagement-profile |
| engaged-high × completionist | completion | secondary | 5 | 0/5 | 12h 41m | 23h 56m | 2d 9h | -51.1% [HIGH-under] | engagement-profile |
| engaged-burst × completionist | completion | secondary | 5 | 0/5 | 18h 46m | 1d 11h | 3d 5h | -27.2% [HIGH-under] | engagement-profile |
| casual-steady × completionist | completion | secondary | 5 | 0/5 | 1d 11h | 2d 21h | 7d 0h | n/a | engagement-profile |
| casual-steady × consolidation-threshold | threshold | secondary | 5 | 0/5 | 1d 11h | 2d 21h | 6d 9h | n/a | engagement-profile |
| casual-evening × consolidation-threshold | threshold | secondary | 5 | 0/5 | 22h 10m | 1d 21h | 6d 9h | n/a | engagement-profile |
| drift-light × consolidation-threshold | threshold | secondary | 5 | 0/5 | 3d 16h | 7d 4h | 15.2d | n/a | engagement-profile |
| engaged-steady × lazy-stackable | threshold | stress | 5 | 0/5 | 12h 26m | 23h 41m | 2d 3h | -42.2% [HIGH-under] | engagement-profile |
| engaged-steady × idle-clicker | threshold | stress | 5 | 5/5 | — | — | — | — | engagement-profile |
| bot-100cpm × greedy-vpc-1.5 | completion | legacy | 5 | 0/5 | 1h 13m | 1h 13m | 1h 13m | n/a | continuous-bot |
| bot-60cpm × greedy-vpc-1.5 | completion | legacy | 5 | 0/5 | 1h 20m | 1h 20m | 1h 20m | n/a | continuous-bot |

## Anomalies / flags

- engaged-steady × completionist total: drift -51.6% [HIGH-under]
- engaged-steady × completionist T1: p50 5h 3m vs target 2h 0m - 4h 0m → +68.5% [HIGH-over]
- engaged-steady × completionist T3: p50 2h 47m vs target 1d 0h - 2d 0h → -92.2% [HIGH-under]
- engaged-steady × consolidation-threshold total: drift -42.2% [HIGH-under]
- engaged-steady × consolidation-threshold T1: p50 5h 0m vs target 2h 0m - 4h 0m → +67.0% [HIGH-over]
- engaged-steady × consolidation-threshold T2: p50 9h 19m vs target 6h 0m - 10h 0m → +16.6% [HIGH-over]
- engaged-steady × consolidation-threshold T3: p50 2h 47m vs target 1d 0h - 1d 12h → -90.7% [HIGH-under]
- engaged-high × completionist total: drift -51.1% [HIGH-under]
- engaged-high × completionist T1: p50 5h 1m vs target 2h 0m - 4h 0m → +67.3% [HIGH-over]
- engaged-high × completionist T3: p50 2h 57m vs target 1d 0h - 2d 0h → -91.8% [HIGH-under]
- engaged-burst × completionist total: drift -27.2% [HIGH-under]
- engaged-burst × completionist T1: p50 7h 29m vs target 2h 0m - 4h 0m → +149.6% [HIGH-over]
- engaged-burst × completionist T2: p50 14h 3m vs target 8h 0m - 12h 0m → +40.6% [HIGH-over]
- engaged-burst × completionist T3: p50 3h 46m vs target 1d 0h - 2d 0h → -89.5% [HIGH-under]
- engaged-steady × lazy-stackable total: drift -42.2% [HIGH-under]
- engaged-steady × lazy-stackable T1: p50 5h 0m vs target 2h 0m - 4h 0m → +66.8% [HIGH-over]
- engaged-steady × lazy-stackable T2: p50 9h 20m vs target 6h 0m - 10h 0m → +16.7% [HIGH-over]
- engaged-steady × lazy-stackable T3: p50 2h 27m vs target 1d 0h - 1d 12h → -91.8% [HIGH-under]
- engaged-steady × idle-clicker: low-confidence (DNF 100% > 50%; percentiles read off <half the population)

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

