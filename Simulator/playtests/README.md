# Simulator/playtests/

Real-player playtest logs used as calibration ground truth. New logs land here; the simulator is tuned to match them within target bands per tier.

## Naming convention (going forward)

`dark-filaments-t<TIER>-<DATE>_<CPM>cpm_<HANDOFF>[_<NOTES>].json`

- `<TIER>` — `t3`, `t2`, etc. The tier where the run was played (or which it last advanced to).
- `<DATE>` — ISO date `YYYY-MM-DD`.
- `<CPM>` — autoclicker setting in clicks-per-minute (e.g. `60`, `100`, `150`).
- `<HANDOFF>` — the mode chain used at skip-to-tier, joined with `-` (e.g. `comp-comp`, `thresh-thresh`, `comp-thresh`). For T1-native runs, omit.
- `<NOTES>` — optional flags, e.g. `throttle-corrected`, `pre-tuning-v5M`.

Each cleaned/corrected log carries a sidecar `.meta.json` of the same stem with `correction`, `raw_headline`, `corrected_headline`, and any flags worth knowing.

Older T1 playtest logs (May 2026, pre-multi-tier) use the prior `playtest_log_<CPM>cpm.txt` plain-text format; preserved for lineage.

## Index

| File | Tier | CPM | Handoff | Date | Notes |
|---|---|---|---|---|---|
| `playtest_log_60cpm.txt` | T1 | 60 | n/a | 2026-05-07 | Original T1 calibration set; plain-text format |
| `playtest_log_100cpm.txt` | T1 | 100 | n/a | 2026-05-07 | Original T1 calibration set; plain-text format |
| `playtest_log_150cpm.txt` | T1 | 150 | n/a | 2026-05-07 | Original T1 calibration set; plain-text format |
| `dark-filaments-t3-2026-05-11_60cpm_comp-comp_throttle-corrected.json` | T3 | 60 | Comp -> Comp | 2026-05-11 | First real T3 data point. Browser-tab throttle window (8.70 min) removed from raw timeline. See sidecar `.meta.json`. Headline: 28.82 min Threshold / 50.12 min Completion. |

When a new playtest is added, append a row.
