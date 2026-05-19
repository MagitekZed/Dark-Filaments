# Long-burn calibration — 2026-05-13T04:03:43.613Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T1
- Pairings: 1
- Total runs: 5, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 30 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × comp-hoarder (N=5, mode=completion)

- DNF: 0/5
- Total calendar p10 / p50 / p90: 1h 0m / 1h 0m / 1h 0m
- Total target range: 2h 0m - 4h 0m  →  drift -66.7%  [HIGH-under]
- Active engagement p10 / p50 / p90: 1h 0m / 1h 0m / 1h 0m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 1h 0m | 1h 0m / 1h 0m | 2h 0m - 4h 0m | -66.7% | HIGH-under | 0 / 0 | 0.65× | below-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T1 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-hoarder | completion | primary | 5 | 0/5 | 1h 0m | 1h 0m | 1h 0m | -66.7% [HIGH-under] | 0.65× [below-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × comp-hoarder total: drift -66.7% [HIGH-under]
- realistic-engaged × comp-hoarder T1: p50 1h 0m vs target 2h 0m - 4h 0m → -66.7% [HIGH-under]
- realistic-engaged × comp-hoarder T1 mass band: ratio p50 0.65× < 0.7 [below-band]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

