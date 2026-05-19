# Long-burn calibration — 2026-05-13T22:26:01.938Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T2
- Pairings: 4
- Total runs: 12, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 7 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × comp-hoarder (N=3, mode=completion)

- DNF: 0/3
- Time to complete target tier p10 / p50 / p90: 3h 9m / 3h 48m / 10h 58m
- Total target range: 2h 8m - 8h 15m  →  drift -26.8%  [HIGH-under]
- Active engagement p10 / p50 / p90: 1h 15m / 1h 15m / 1h 15m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 11m 40s | 11m 40s / 11m 40s | 8m 0s - 15m 0s | +1.4% | within | 1 / 1 | 1.00× | within-band |
| T2 | 3h 51m | 3h 12m / 11h 1m | 2h 0m - 8h 0m | -22.9% | HIGH-under | 141802 / 1764 | 80.39× | above-band |

### realistic-engaged × comp-rusher (N=3, mode=completion)

- DNF: 0/3
- Time to complete target tier p10 / p50 / p90: 3h 9m / 3h 48m / 10h 58m
- Total target range: 2h 8m - 8h 15m  →  drift -26.8%  [HIGH-under]
- Active engagement p10 / p50 / p90: 1h 15m / 1h 15m / 1h 15m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 9m 47s | 9m 47s / 9m 47s | 8m 0s - 15m 0s | -14.9% | within | 1 / 1 | 1.00× | within-band |
| T2 | 3h 53m | 3h 14m / 11h 3m | 2h 0m - 8h 0m | -22.3% | HIGH-under | 147775 / 1764 | 83.78× | above-band |

### realistic-engaged × thr-hoarder (N=3, mode=threshold)

- DNF: 0/3
- Time to complete target tier p10 / p50 / p90: 3h 9m / 3h 48m / 10h 58m
- Total target range: 1h 37m - 6h 12m  →  drift -2.8%  [within]
- Active engagement p10 / p50 / p90: 1h 15m / 1h 15m / 1h 15m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 13m 1s | 13m 1s / 13m 1s | 7m 0s - 12m 0s | +37.0% | HIGH-over | 1 / 1 | 0.99× | within-band |
| T2 | 3h 50m | 3h 11m / 11h 0m | 1h 30m - 6h 0m | +2.2% | within | 101334 / 963 | 105.23× | above-band |

### realistic-engaged × thr-rusher (N=3, mode=threshold)

- DNF: 0/3
- Time to complete target tier p10 / p50 / p90: 3h 9m / 3h 48m / 10h 58m
- Total target range: 1h 37m - 6h 12m  →  drift -2.8%  [within]
- Active engagement p10 / p50 / p90: 1h 15m / 1h 15m / 1h 15m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 9m 29s | 9m 29s / 9m 29s | 7m 0s - 12m 0s | -0.2% | within | 1 / 1 | 0.99× | within-band |
| T2 | 3h 53m | 3h 14m / 11h 4m | 1h 30m - 6h 0m | +3.8% | within | 134752 / 963 | 139.94× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T2 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-hoarder | completion | primary | 3 | 0/3 | 3h 9m | 3h 48m | 10h 58m | -26.8% [HIGH-under] | 80.39× [above-band] | engagement-profile |
| realistic-engaged × comp-rusher | completion | primary | 3 | 0/3 | 3h 9m | 3h 48m | 10h 58m | -26.8% [HIGH-under] | 83.78× [above-band] | engagement-profile |
| realistic-engaged × thr-hoarder | threshold | primary | 3 | 0/3 | 3h 9m | 3h 48m | 10h 58m | -2.8% [within] | 105.23× [above-band] | engagement-profile |
| realistic-engaged × thr-rusher | threshold | primary | 3 | 0/3 | 3h 9m | 3h 48m | 10h 58m | -2.8% [within] | 139.94× [above-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × comp-hoarder total: drift -26.8% [HIGH-under]
- realistic-engaged × comp-hoarder T2: p50 3h 51m vs target 2h 0m - 8h 0m → -22.9% [HIGH-under]
- realistic-engaged × comp-rusher total: drift -26.8% [HIGH-under]
- realistic-engaged × comp-rusher T2: p50 3h 53m vs target 2h 0m - 8h 0m → -22.3% [HIGH-under]
- realistic-engaged × thr-hoarder T1: p50 13m 1s vs target 7m 0s - 12m 0s → +37.0% [HIGH-over]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

