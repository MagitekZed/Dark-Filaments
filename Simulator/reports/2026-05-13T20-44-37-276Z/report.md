# Long-burn calibration — 2026-05-13T20:44:37.280Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T3
- Pairings: 4
- Total runs: 200, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 14 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × comp-hoarder (N=50, mode=completion)

- DNF: 0/50
- Time to complete target tier p10 / p50 / p90: 1d 3h / 1d 13h / 2d 11h
- Total target range: 1d 2h - 2d 8h  →  drift -10.0%  [within]
- Active engagement p10 / p50 / p90: 2h 0m / 2h 30m / 3h 0m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 11m 40s | 11m 40s / 11m 40s | 8m 0s - 15m 0s | +1.4% | within | 0 / 0 | 0.65× | below-band |
| T2 | 5h 1m | 1h 41m / 13h 38m | 2h 0m - 8h 0m | +0.4% | within | 205667 / 18 | 11728.36× | above-band |
| T3 | 1d 7h | 19h 25m / 2d 4h | 1d 0h - 2d 0h | -12.1% | within | 4.28e+7 / 192245 | 222.66× | above-band |

### realistic-engaged × comp-rusher (N=50, mode=completion)

- DNF: 0/50
- Time to complete target tier p10 / p50 / p90: 1d 7h / 1d 16h / 2d 12h
- Total target range: 1d 2h - 2d 8h  →  drift -0.9%  [within]
- Active engagement p10 / p50 / p90: 2h 15m / 2h 45m / 3h 30m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 9m 47s | 9m 47s / 9m 47s | 8m 0s - 15m 0s | -14.9% | within | 0 / 0 | 0.71× | within-band |
| T2 | 5h 3m | 1h 43m / 13h 40m | 2h 0m - 8h 0m | +1.0% | within | 216915 / 18 | 12369.77× | above-band |
| T3 | 1d 9h | 23h 15m / 2d 8h | 1d 0h - 2d 0h | -7.1% | within | 4.16e+7 / 192245 | 216.37× | above-band |

### realistic-engaged × thr-hoarder (N=50, mode=threshold)

- DNF: 0/50
- Time to complete target tier p10 / p50 / p90: 1d 3h / 1d 12h / 1d 23h
- Total target range: 19h 37m - 1d 18h  →  drift +18.4%  [HIGH-over]
- Active engagement p10 / p50 / p90: 2h 0m / 2h 30m / 3h 0m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 13m 1s | 13m 1s / 13m 1s | 7m 0s - 12m 0s | +37.0% | HIGH-over | 0 / 0 | 0.62× | below-band |
| T2 | 4h 59m | 1h 40m / 13h 36m | 1h 30m - 6h 0m | +33.3% | HIGH-over | 151384 / 27 | 5631.52× | above-band |
| T3 | 1d 5h | 22h 39m / 1d 15h | 18h 0m - 1d 12h | +8.5% | within | 3.23e+6 / 627082 | 5.15× | above-band |

### realistic-engaged × thr-rusher (N=50, mode=threshold)

- DNF: 0/50
- Time to complete target tier p10 / p50 / p90: 1d 6h / 1d 13h / 1d 22h
- Total target range: 19h 37m - 1d 18h  →  drift +21.3%  [HIGH-over]
- Active engagement p10 / p50 / p90: 2h 0m / 2h 30m / 3h 0m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 9m 29s | 9m 29s / 9m 29s | 7m 0s - 12m 0s | -0.2% | within | 0 / 0 | 0.60× | below-band |
| T2 | 5h 3m | 1h 43m / 13h 40m | 1h 30m - 6h 0m | +34.8% | HIGH-over | 201557 / 27 | 7497.98× | above-band |
| T3 | 1d 6h | 1d 1h / 1d 14h | 18h 0m - 1d 12h | +14.7% | within | 2.51e+6 / 627082 | 4.01× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T3 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × comp-hoarder | completion | primary | 50 | 0/50 | 1d 3h | 1d 13h | 2d 11h | -10.0% [within] | 222.66× [above-band] | engagement-profile |
| realistic-engaged × comp-rusher | completion | primary | 50 | 0/50 | 1d 7h | 1d 16h | 2d 12h | -0.9% [within] | 216.37× [above-band] | engagement-profile |
| realistic-engaged × thr-hoarder | threshold | primary | 50 | 0/50 | 1d 3h | 1d 12h | 1d 23h | +18.4% [HIGH-over] | 5.15× [above-band] | engagement-profile |
| realistic-engaged × thr-rusher | threshold | primary | 50 | 0/50 | 1d 6h | 1d 13h | 1d 22h | +21.3% [HIGH-over] | 4.01× [above-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × comp-hoarder T1 mass band: ratio p50 0.65× < 0.7 [below-band]
- realistic-engaged × thr-hoarder total: drift +18.4% [HIGH-over]
- realistic-engaged × thr-hoarder T1: p50 13m 1s vs target 7m 0s - 12m 0s → +37.0% [HIGH-over]
- realistic-engaged × thr-hoarder T2: p50 4h 59m vs target 1h 30m - 6h 0m → +33.3% [HIGH-over]
- realistic-engaged × thr-hoarder T1 mass band: ratio p50 0.62× < 0.7 [below-band]
- realistic-engaged × thr-rusher total: drift +21.3% [HIGH-over]
- realistic-engaged × thr-rusher T2: p50 5h 3m vs target 1h 30m - 6h 0m → +34.8% [HIGH-over]
- realistic-engaged × thr-rusher T1 mass band: ratio p50 0.60× < 0.7 [below-band]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

