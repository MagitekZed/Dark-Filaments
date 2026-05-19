# Long-burn calibration — 2026-05-13T09:11:28.889Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T2
- Pairings: 1
- Total runs: 5, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 30 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T2 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| hyper-onboard × comp-hoarder | completion | floor | 5 | 0/5 | 56m 6s | 56m 6s | 56m 6s | n/a | 0.94× [within-band] | engagement-profile |

## Anomalies / flags

- hyper-onboard × comp-hoarder T1 mass band: ratio p50 0.65× < 0.7 [below-band]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

