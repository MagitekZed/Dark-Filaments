# Long-burn calibration — 2026-05-12T11:47:04.979Z

- Build: long-burn-v1
- Harness: S2 (multi-window engagement-profile loop; primary pairings produce real numbers)
- Target tier: T3
- Pairings: 2
- Total runs: 10, DNFs: 0 (excluded from percentiles per plan §4 C2)
- Seed: 1
- Max calendar budget: 90 days

## Primary pairings (calibration-deciding)

### engaged-steady × completionist (N=5, mode=completion)

- DNF: 0/5
- Total calendar p10 / p50 / p90: 12h 26m / 23h 41m / 2d 8h
- Total target range: 1d 10h - 2d 16h  →  drift -51.6%  [HIGH-under]
- Active engagement p10 / p50 / p90: 45m 0s / 45m 0s / 45m 0s

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag |
|---|---|---|---|---|---|
| T1 | 5h 3m | 3h 0m / 13h 26m | 2h 0m - 4h 0m | +68.5% | HIGH-over |
| T2 | 9h 17m | 2h 15m / 1d 23h | 8h 0m - 12h 0m | -7.1% | within |
| T3 | 2h 47m | 52m 21s / 16h 23m | 1d 0h - 2d 0h | -92.2% | HIGH-under |

### engaged-steady × consolidation-threshold (N=5, mode=threshold)

- DNF: 0/5
- Total calendar p10 / p50 / p90: 12h 26m / 23h 41m / 2d 8h
- Total target range: 1d 8h - 2d 2h  →  drift -42.2%  [HIGH-under]
- Active engagement p10 / p50 / p90: 45m 0s / 45m 0s / 45m 0s

| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag |
|---|---|---|---|---|---|
| T1 | 5h 0m | 2h 58m / 13h 23m | 2h 0m - 4h 0m | +67.0% | HIGH-over |
| T2 | 9h 19m | 2h 17m / 1d 23h | 6h 0m - 10h 0m | +16.6% | HIGH-over |
| T3 | 2h 47m | 52m 27s / 16h 23m | 1d 0h - 1d 12h | -90.7% | HIGH-under |

## Cross-pairing comparison

| Pairing | Mode | N | DNF | p10 | p50 | p90 | T3 drift | Kind |
|---|---|---|---|---|---|---|---|---|
| engaged-steady × completionist | completion | 5 | 0/5 | 12h 26m | 23h 41m | 2d 8h | -51.6% [HIGH-under] | engagement-profile |
| engaged-steady × consolidation-threshold | threshold | 5 | 0/5 | 12h 26m | 23h 41m | 2d 8h | -42.2% [HIGH-under] | engagement-profile |

## Anomalies / flags

- engaged-steady × completionist total: drift -51.6% [HIGH-under]
- engaged-steady × completionist T1: p50 5h 3m vs target 2h 0m - 4h 0m → +68.5% [HIGH-over]
- engaged-steady × completionist T3: p50 2h 47m vs target 1d 0h - 2d 0h → -92.2% [HIGH-under]
- engaged-steady × consolidation-threshold total: drift -42.2% [HIGH-under]
- engaged-steady × consolidation-threshold T1: p50 5h 0m vs target 2h 0m - 4h 0m → +67.0% [HIGH-over]
- engaged-steady × consolidation-threshold T2: p50 9h 19m vs target 6h 0m - 10h 0m → +16.6% [HIGH-over]
- engaged-steady × consolidation-threshold T3: p50 2h 47m vs target 1d 0h - 1d 12h → -90.7% [HIGH-under]

## What to do next

- S2 produces real engagement-profile numbers for the primary pairings.
- S3 fills in secondary pairings + stress profiles + legacy reference cross-checks at correct N.
- S4 formalizes mass-target band + DNF rules.
- S5 adds top-down/mid-tier-seeded runs (depends on E4).
- S6 runs the baseline sweep + retune recommendations.

