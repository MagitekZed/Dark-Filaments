# Long-burn calibration — 2026-05-14T07:27:05.045Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T4
- Pairings: 4
- Total runs: 200, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 14 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × comp-hoarder (N=50, mode=completion)

- DNF: 0/50
- Time to complete target tier p10 / p50 / p90: 2d 1h / 2d 19h / 4d 8h
- Total target range: 2d 2h - 4d 8h  →  drift -12.5%  [within]
- Active engagement p10 / p50 / p90: 3h 15m / 3h 30m / 4h 15m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 11m 40s | 11m 40s / 11m 40s | 8m 0s - 15m 0s | +1.4% | within | 1 / 1 | 1.00× | within-band |
| T2 | 5h 1m | 1h 41m / 13h 38m | 2h 0m - 8h 0m | +0.4% | within | 213263 / 1764 | 120.90× | above-band |
| T3 | 1d 7h | 19h 10m / 2d 4h | 1d 0h - 2d 0h | -12.8% | within | 5.74e+7 / 8.04e+6 | 7.14× | above-band |
| T4 | 1d 3h | 15h 37m / 2d 6h | 1d 0h - 2d 0h | -24.2% | HIGH-under | 3.39e+11 / 1.00e+11 | 3.39× | above-band |

### realistic-engaged × comp-rusher (N=50, mode=completion)

- DNF: 0/50
- Time to complete target tier p10 / p50 / p90: 2d 12h / 3d 6h / 4d 12h
- Total target range: 2d 2h - 4d 8h  →  drift +2.1%  [within]
- Active engagement p10 / p50 / p90: 3h 30m / 4h 0m / 5h 0m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 9m 47s | 9m 47s / 9m 47s | 8m 0s - 15m 0s | -14.9% | within | 1 / 1 | 1.00× | within-band |
| T2 | 5h 3m | 1h 43m / 13h 40m | 2h 0m - 8h 0m | +1.0% | within | 222120 / 1764 | 125.92× | above-band |
| T3 | 1d 9h | 23h 0m / 2d 8h | 1d 0h - 2d 0h | -7.8% | within | 5.43e+7 / 8.04e+6 | 6.75× | above-band |
| T4 | 1d 13h | 1d 1h / 2d 14h | 1d 0h - 2d 0h | +2.8% | within | 2.43e+11 / 1.00e+11 | 2.43× | above-band |

### realistic-engaged × thr-hoarder (N=50, mode=threshold)

- DNF: 0/50
- Time to complete target tier p10 / p50 / p90: 2d 5h / 2d 18h / 3d 8h
- Total target range: 1d 23h - 3d 14h  →  drift -0.2%  [within]
- Active engagement p10 / p50 / p90: 3h 15m / 3h 45m / 4h 15m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 13m 1s | 13m 1s / 13m 1s | 7m 0s - 12m 0s | +37.0% | HIGH-over | 1 / 1 | 0.99× | within-band |
| T2 | 4h 59m | 1h 40m / 13h 36m | 1h 30m - 6h 0m | +33.3% | HIGH-over | 152323 / 963 | 158.19× | above-band |
| T3 | 1d 5h | 22h 24m / 1d 15h | 22h 0m - 1d 20h | -12.0% | within | 5.73e+6 / 1.22e+6 | 4.72× | above-band |
| T4 | 1d 5h | 20h 48m / 1d 17h | 1d 0h - 1d 12h | -3.3% | within | 4.40e+10 / 2.00e+10 | 2.20× | above-band |

### realistic-engaged × thr-rusher (N=50, mode=threshold)

- DNF: 0/50
- Time to complete target tier p10 / p50 / p90: 2d 13h / 3d 0h / 3d 20h
- Total target range: 1d 23h - 3d 14h  →  drift +9.1%  [within]
- Active engagement p10 / p50 / p90: 3h 15m / 4h 0m / 4h 30m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 9m 29s | 9m 29s / 9m 29s | 7m 0s - 12m 0s | -0.2% | within | 1 / 1 | 0.99× | within-band |
| T2 | 5h 3m | 1h 43m / 13h 40m | 1h 30m - 6h 0m | +34.8% | HIGH-over | 202493 / 963 | 210.29× | above-band |
| T3 | 1d 6h | 1d 1h / 1d 14h | 22h 0m - 1d 20h | -6.9% | within | 5.01e+6 / 1.22e+6 | 4.13× | above-band |
| T4 | 1d 10h | 1d 1h / 2d 5h | 1d 0h - 1d 12h | +16.2% | HIGH-over | 4.53e+10 / 2.00e+10 | 2.27× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T4 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-hoarder | completion | primary | 50 | 0/50 | 2d 1h | 2d 19h | 4d 8h | -12.5% [within] | 3.39× [above-band] | engagement-profile |
| realistic-engaged × comp-rusher | completion | primary | 50 | 0/50 | 2d 12h | 3d 6h | 4d 12h | +2.1% [within] | 2.43× [above-band] | engagement-profile |
| realistic-engaged × thr-hoarder | threshold | primary | 50 | 0/50 | 2d 5h | 2d 18h | 3d 8h | -0.2% [within] | 2.20× [above-band] | engagement-profile |
| realistic-engaged × thr-rusher | threshold | primary | 50 | 0/50 | 2d 13h | 3d 0h | 3d 20h | +9.1% [within] | 2.27× [above-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × comp-hoarder T4: p50 1d 3h vs target 1d 0h - 2d 0h → -24.2% [HIGH-under]
- realistic-engaged × thr-hoarder T1: p50 13m 1s vs target 7m 0s - 12m 0s → +37.0% [HIGH-over]
- realistic-engaged × thr-hoarder T2: p50 4h 59m vs target 1h 30m - 6h 0m → +33.3% [HIGH-over]
- realistic-engaged × thr-rusher T2: p50 5h 3m vs target 1h 30m - 6h 0m → +34.8% [HIGH-over]
- realistic-engaged × thr-rusher T4: p50 1d 10h vs target 1d 0h - 1d 12h → +16.2% [HIGH-over]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

