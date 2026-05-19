# Long-burn calibration — 2026-05-13T22:25:25.968Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T1
- Pairings: 1
- Total runs: 5, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 7 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × comp-hoarder (N=5, mode=completion)

- DNF: 0/5
- Time to complete target tier p10 / p50 / p90: 11m 40s / 11m 40s / 11m 40s
- Total target range: 8m 0s - 15m 0s  →  drift +1.4%  [within]
- Active engagement p10 / p50 / p90: 1h 0m / 1h 0m / 1h 0m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 1h 0m | 1h 0m / 1h 0m | 8m 0s - 15m 0s | +421.7% | HIGH-over | 1 / 1 | 1.00× | within-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T1 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-hoarder | completion | primary | 5 | 0/5 | 11m 40s | 11m 40s | 11m 40s | +1.4% [within] | 1.00× [within-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × comp-hoarder T1: p50 1h 0m vs target 8m 0s - 15m 0s → +421.7% [HIGH-over]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

