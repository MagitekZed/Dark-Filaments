# Long-burn calibration — 2026-05-12T11:05:43.724Z

- Build: long-burn-v1
- Harness: S1 skeleton (engagement-profile windowing stubbed; legacy bot pairings produce real numbers)
- Target tier: T2
- Pairings: 2
- Total runs: 2, DNFs: 2

## Primary pairings (calibration-deciding)

### engaged-steady × completionist (N=1)

- DNF: 1/1
- p10 / p50 / p90 totalSeconds: — / — / —
- Status: STUBBED (S2 will populate)

### engaged-steady × consolidation-threshold (N=1)

- DNF: 1/1
- p10 / p50 / p90 totalSeconds: — / — / —
- Status: STUBBED (S2 will populate)

## Cross-pairing comparison

| Pairing | DNF | p10 | p50 | p90 | Kind |
|---|---|---|---|---|---|
| engaged-steady × completionist | 1/1 | — | — | — | engagement-profile-stub |
| engaged-steady × consolidation-threshold | 1/1 | — | — | — | engagement-profile-stub |

## Anomalies / flags

- 2 DNF(s) recorded. Engagement-profile pairings will remain DNF until S2 lands real windowing.

## What to do next

- S1 produces the apparatus; numerical interpretation is S6's deliverable.
- Next: S2 fills in engagement-profile windowing using reconstructFromOfflineWindow.

