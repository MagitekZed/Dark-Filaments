# Long-burn calibration — 2026-05-13T19:59:36.434Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T3
- Pairings: 1
- Total runs: 3, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 10 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × thr-hoarder (N=3, mode=threshold)

- DNF: 0/3
- Time to complete target tier p10 / p50 / p90: 12h 21m / 18h 6m / 1d 15h
- Total target range: 19h 37m - 1d 18h  →  drift -41.4%  [HIGH-under]
- Active engagement p10 / p50 / p90: 1h 30m / 1h 30m / 1h 30m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 13m 1s | 13m 1s / 13m 1s | 7m 0s - 12m 0s | +37.0% | HIGH-over | 0 / 0 | 0.62× | below-band |
| T2 | 3h 35m | 2h 56m / 10h 45m | 1h 30m - 6h 0m | -4.4% | within | 100395 / 27 | 3734.71× | above-band |
| T3 | 9h 27m | 7h 22m / 1d 11h | 18h 0m - 1d 12h | -65.0% | HIGH-under | 1.12e+6 / 1790 | 625.19× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T3 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × thr-hoarder | threshold | primary | 3 | 0/3 | 12h 21m | 18h 6m | 1d 15h | -41.4% [HIGH-under] | 625.19× [above-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × thr-hoarder total: drift -41.4% [HIGH-under]
- realistic-engaged × thr-hoarder T1: p50 13m 1s vs target 7m 0s - 12m 0s → +37.0% [HIGH-over]
- realistic-engaged × thr-hoarder T3: p50 9h 27m vs target 18h 0m - 1d 12h → -65.0% [HIGH-under]
- realistic-engaged × thr-hoarder T1 mass band: ratio p50 0.62× < 0.7 [below-band]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

