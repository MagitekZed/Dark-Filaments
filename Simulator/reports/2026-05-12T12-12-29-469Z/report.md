# Long-burn calibration — 2026-05-12T12:12:29.473Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T4
- Pairings: 1
- Total runs: 3, DNFs: 3 (excluded from percentiles per plan §4 C2)
- DNFs by reason: budget-exhausted=3
- Seed: 1
- Max calendar budget: 3 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Ad-hoc pairings (--timing / --buyer)

| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | T4 mass ratio | Conf |
|---|---|---|---|---|---|---|---|---|---|
| drift-light × idle-clicker | threshold | 3 | 3/3 | — | — | — | n/a | — | low |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T4 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| drift-light × idle-clicker | threshold | ad-hoc | 3 | 3/3 | — | — | — | n/a | — | engagement-profile |

## Anomalies / flags

- drift-light × idle-clicker: low-confidence (DNF 100% > 50%; percentiles read off <half the population)

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

