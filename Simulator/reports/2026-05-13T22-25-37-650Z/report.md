# Long-burn calibration — 2026-05-13T22:25:37.654Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T1
- Pairings: 1
- Total runs: 1, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 7 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Legacy reference (continuous-bot cross-check)

Continuous bot pairings use runner.runSimulation chained across tiers — same path as `t3_calibrate.js` / `t4_calibrate.js`. Numbers should match prior calibration probes; deviation here means the engine has drifted from its T1-T4 baseline.

| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | T1 mass ratio | Conf |
|---|---|---|---|---|---|---|---|---|---|
| bot-60cpm × comp-hoarder | completion | 1 | 0/1 | 11m 40s | 11m 40s | 11m 40s | n/a | 1.00× [within-band] | ok |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T1 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| bot-60cpm × comp-hoarder | completion | legacy | 1 | 0/1 | 11m 40s | 11m 40s | 11m 40s | n/a | 1.00× [within-band] | continuous-bot |

## Anomalies / flags

- (none flagged)

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

