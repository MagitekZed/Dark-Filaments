# Long-burn calibration — 2026-05-13T20:04:48.022Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T3
- Pairings: 1
- Total runs: 5, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 14 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × comp-hoarder (N=5, mode=completion)

- DNF: 0/5
- Time to complete target tier p10 / p50 / p90: 9h 58m / 18h 6m / 1d 15h
- Total target range: 1d 2h - 2d 8h  →  drift -56.0%  [HIGH-under]
- Active engagement p10 / p50 / p90: 1h 30m / 1h 30m / 1h 45m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 11m 40s | 11m 40s / 11m 40s | 8m 0s - 15m 0s | +1.4% | within | 0 / 0 | 0.65× | below-band |
| T2 | 4h 29m | 2h 57m / 10h 46m | 2h 0m - 8h 0m | -10.1% | within | 179040 / 18 | 10209.89× | above-band |
| T3 | 11h 25m | 2h 42m / 1d 11h | 1d 0h - 2d 0h | -68.3% | HIGH-under | 1.90e+7 / 398593 | 47.72× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T3 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-hoarder | completion | primary | 5 | 0/5 | 9h 58m | 18h 6m | 1d 15h | -56.0% [HIGH-under] | 47.72× [above-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × comp-hoarder total: drift -56.0% [HIGH-under]
- realistic-engaged × comp-hoarder T3: p50 11h 25m vs target 1d 0h - 2d 0h → -68.3% [HIGH-under]
- realistic-engaged × comp-hoarder T1 mass band: ratio p50 0.65× < 0.7 [below-band]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

