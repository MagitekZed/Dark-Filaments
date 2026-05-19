# Long-burn calibration — 2026-05-14T06:44:28.202Z

- Build: long-burn-v1
- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)
- Target tier: T4
- Pairings: 1
- Total runs: 20, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 14 days
- Mass-band-low: 0.7 (per-tier exit mass / bot reference; below = below-band flag)

## Primary pairings (calibration-deciding)

Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.

### realistic-engaged × thr-hoarder (N=20, mode=threshold)

- DNF: 0/20
- Time to complete target tier p10 / p50 / p90: 1d 8h / 1d 17h / 2d 11h
- Total target range: 1d 23h - 3d 14h  →  drift -38.7%  [HIGH-under]
- Active engagement p10 / p50 / p90: 2h 15m / 3h 0m / 3h 15m

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |
|---|---|---|---|---|---|---|---|---|
| T1 | 13m 1s | 13m 1s / 13m 1s | 7m 0s - 12m 0s | +37.0% | HIGH-over | 1 / 1 | 0.99× | within-band |
| T2 | 4h 28m | 1h 54m / 19h 22m | 1h 30m - 6h 0m | +19.2% | HIGH-over | 133324 / 963 | 138.46× | above-band |
| T3 | 1d 1h | 18h 32m / 1d 15h | 22h 0m - 1d 20h | -21.7% | HIGH-under | 5.33e+6 / 1.22e+6 | 4.39× | above-band |
| T4 | 6h 44m | 2h 55m / 17h 12m | 1d 0h - 1d 12h | -77.5% | HIGH-under | 6.20e+10 / 1.00e+10 | 6.19× | above-band |

## Cross-pairing comparison (all pairings)

| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T4 band | Kind |
|---|---|---|---|---|---|---|---|---|---|---|
| realistic-engaged × thr-hoarder | threshold | primary | 20 | 0/20 | 1d 8h | 1d 17h | 2d 11h | -38.7% [HIGH-under] | 6.19× [above-band] | engagement-profile |

## Anomalies / flags

- realistic-engaged × thr-hoarder total: drift -38.7% [HIGH-under]
- realistic-engaged × thr-hoarder T1: p50 13m 1s vs target 7m 0s - 12m 0s → +37.0% [HIGH-over]
- realistic-engaged × thr-hoarder T2: p50 4h 28m vs target 1h 30m - 6h 0m → +19.2% [HIGH-over]
- realistic-engaged × thr-hoarder T3: p50 1d 1h vs target 22h 0m - 1d 20h → -21.7% [HIGH-under]
- realistic-engaged × thr-hoarder T4: p50 6h 44m vs target 1d 0h - 1d 12h → -77.5% [HIGH-under]

## What to do next

- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).
- Secondary / stress / legacy pairings inform — they are not calibration targets.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

