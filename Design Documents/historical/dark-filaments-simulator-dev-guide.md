# Dark Filaments Simulator — Development Guide

> **⚠ Historical reference.** This guide describes the Python+xlsx simulator workflow (v1.2.1) which has been retired. The legacy build script and xlsx artifacts live in [`Simulator/legacy/`](../../Simulator/legacy/). The active simulator is being rebuilt in vanilla JS inside the prototype as part of an architectural pivot — see CLAUDE.md state of play. This document remains useful as a reference for the v1.2.1 strategy logic (greedy VPC, save mode, post-cohesion focus) being ported to JS.

How to work with `build_simulator_v12_1.py` and the spreadsheet it produces. Companion to the project primer; this is the technical-procedural document.

---

## 1. The mental model

The simulator is **generated**, not authored. The Python build script (`build_simulator_v12_1.py`) is the source of truth. The .xlsx file is a build output — like an executable. You don't edit the .xlsx; you edit the script and rebuild.

There are two kinds of changes to the simulator:

**Data changes** — tuning numbers, adding upgrades, changing parameters. These edit the `UPGRADES` list, `MACROS` dict, or other data definitions near the top of the script. Most changes are this kind.

**Structural changes** — modifying the simulation logic itself. New strategy formulas, new sheet structure, new schema columns. These edit the formula-generating code. Less common but more invasive.

Either change follows the same cycle:

```
edit script → run build → run recalc → inspect xlsx → iterate
```

If you find yourself wanting to "just edit a cell in the xlsx" — stop. The next build will overwrite it. Find the corresponding line in the script, edit there, rebuild. The xlsx is a derived artifact.

---

## 2. The development cycle (commands)

### Build — generates the .xlsx with formulas

```bash
python build_simulator_v12_1.py
```

Outputs `dark-filaments-simulation-v1.2.1.xlsx` in the same directory. This .xlsx contains all the formulas but their **cached values are zero or stale** — openpyxl writes formulas, doesn't compute them.

### Recalc — populates the cached values

```bash
python recalc.py dark-filaments-simulation-v1.2.1.xlsx 240
```

The 240 is timeout in seconds (typical full T1 recalc takes ~30-60 sec). The script uses LibreOffice in headless mode to recompute every formula and re-saves the file with cached values populated.

It outputs JSON with error counts:

```json
{ "status": "success", "total_errors": 0, "total_formulas": 19796 }
```

If `total_errors > 0`, something's broken. The recalc output also includes an `error_summary` dict listing the kinds of errors. Common ones:

- `#DIV/0!` — division by zero or empty cell
- `#VALUE!` — argument type mismatch (often number-vs-text)
- `#NAME?` — typo in a function name (e.g., `IFERROR(` written as `IFERROR (`)
- `#REF!` — broken cell reference

### Inspect — open in Excel/LibreOffice/Google Sheets

The cached values now reflect the calculation. If you change parameters in the Parameters tab, modern spreadsheet apps will auto-recalculate. If you don't see updated values, look for an "Automatic Calculation" toggle.

For quick programmatic inspection from Python:

```python
from openpyxl import load_workbook
wb = load_workbook("dark-filaments-simulation-v1.2.1.xlsx", data_only=True)
sim = wb["UpgradeSim"]
for tick in range(1, 401):
    r = 5 + tick
    buy = sim.cell(row=r, column=21).value  # column U (action mirror)
    if buy and buy != "":
        print(f"tick {tick} ({tick*10}s): {buy}")
```

The `data_only=True` flag is important — it reads cached values rather than formula text.

---

## 3. Anatomy of the build script

The script is ~1300 lines, structured top-to-bottom in roughly this order:

### Section A: Imports & styling (lines ~36-70)

`openpyxl` imports, font definitions, fill colors, borders. Mostly static — you rarely touch this.

### Section B: Helper functions (lines ~71-130)

```python
def set_widths(ws, widths)       # sets column widths from a dict
def label(ws, row, col, text)    # writes a left-aligned text cell
def input_cell(ws, row, col, value)   # writes an editable input cell (yellow fill)
def formula_cell(ws, row, col, formula, number_format=None)  # writes a formula
def header_cell(ws, row, col, text)   # writes a bold dark-fill header
```

These are the primitives. Almost every cell in the sheet is written through one of these so styling stays consistent.

### Section C: README sheet (~lines 130-225)

Builds the title sheet with version notes. Update the version string and notes here when bumping.

### Section D: Parameters tab (~lines 230-330)

All macro values. The `add_param(name, label_text, value, note, fmt)` helper appends one row. The `add_section("...")` helper draws a section divider.

After all params are added, every later cell can reference a parameter by name using `P("active_clicks_per_min")`, which returns `Parameters!$B$10` (the cell with that param's value). This is the indirection that lets you change parameters without hunting through formula references.

### Section E: Upgrades tab (~lines 550-625)

The data table for upgrade definitions. The `UPGRADES` dict at the top of this section defines each upgrade with all its mechanical fields:

```python
UPGRADES = [
    {"name": "Solar Wind",   "tier": 1, "type": "stackable",
     "init_cost": 7,    "cost_growth": 1.15,  "max_levels": 99,
     "add_mpc": 0,      "add_mps": 0.080,    "add_aps": 0,
     "mult_mpc": 0,     "mult_mps": 0,
     "base_mpc": 0,     "base_mps": 0,        "base_aps": 0,
     "cohesion": 0,     "completionist": False,
     "synergy_target": "", "synergy_mult": 0,
     "description": "Charged particles streaming outward..."},
    # ... more upgrades
]
```

After this, every later cell can reference an upgrade's field using `U("Solar Wind", "C")`, which returns the cell address for the cost field of Solar Wind. The letter mapping is:

| Letter | Field |
|---|---|
| A | name |
| B | tier |
| C | init_cost |
| D | cost_growth |
| E | max_levels |
| F | type |
| G | add_mpc |
| H | add_mps |
| I | add_aps |
| J | mult_mpc |
| K | mult_mps |
| L | base_mpc |
| M | base_mps |
| N | base_aps |
| O | cohesion |
| P | completionist |
| Q | synergy_target |
| R | synergy_mult |

Two more important constants right below `UPGRADES`:

```python
STACKABLES = ["Solar Wind", "Asteroid Belt", "Stellar Coupling", "Magnetosphere"]
COMPLETIONIST = ["Magnetosphere", "First Photons"]
```

These are referenced throughout the simulator construction. If you add or change which upgrades belong to these categories, update them here.

### Section F: Formula generators (~lines 740-925)

Reusable formula-building functions. These are the workhorses of the simulator.

**`self_contrib_formula(name, stat, r)`** — what a single upgrade contributes to a stat at row `r`. For passive stackables (Solar Wind contributes to MPS): `H_upgrade × level × N_per_level_factor`. The formula references the upgrade's level (column E-K of UpgradeSim at row `r`) and the upgrade's per-level value (from Upgrades tab).

**`synergy_mult_formula(target_name, r)`** — compound multiplier on a target upgrade from all its synergy providers. Iterates through all upgrades, finds those whose `synergy_target` is `target_name`, and computes the geometric product of their level-raised multipliers.

**`global_mult_formula(stat, r)`** — total global multiplier for a stat (e.g., MPS gets ×1.25 from OR if owned). Iterates through one-shots that have a `mult_mps` or `mult_mpc` field set.

**`aggregate_formula(stat, r, base_value=None)`** — total for a stat across all upgrades, applying synergies and globals. This is the one that produces "MPC" and "MPS" in the simulation.

**`cost_formula(name, r)`** — cost of the next purchase at row `r`. For a stackable: `init_cost × growth^level`. For a one-shot: empty string if owned, else `init_cost`.

**`col_idx(letter)`** — converts column letter to 1-indexed number. `col_idx("AX")` returns 50. Used internally by `formula_cell` because openpyxl wants column indexes.

These functions are written once and called dozens of times during sheet construction. If you change the schema (e.g., add a new field to upgrades), you'll likely modify one of these functions to use the new field.

### Section G: UpgradeSim construction (~lines 930-1100)

This is the largest and most complex section. It builds the simulation tick-by-tick. Three parts:

**G.1 — Headers (row 5)**: column titles. ~50 cells.

**G.2 — Init row (row 6, tick 0)**: starting state. Levels = 0, mass = 0, all derived = 0 or empty. The init row uses simpler formulas because nothing's accumulated yet.

**G.3 — Per-tick rows (rows 7-405, ticks 1-400)**: the meat. A loop over 400 ticks, and within each iteration ~50 cells get formulas. The formulas reference the **previous tick's row** for state (mass, levels) and the **current tick's row** for derived values.

Each tick:
1. Read levels from previous tick (E-K)
2. Apply previous tick's purchase to current levels
3. Compute MPC, MPS, APS for current state
4. Compute income for this tick (clicks + passive + auto)
5. Compute mass-after-income (T)
6. Run decision logic: VPC helpers (AS-AW), action (AX)
7. Compute mass-after-purchase (X) — the closing mass

After all 400 ticks, the final state is at row 405. Whether the simulation completes (transitions tier) before then depends on parameters.

### Section H: Curves tab (~lines 1100-1240)

Derived metrics across all 400 ticks. Per-upgrade level-over-time, per-upgrade contribution-over-time, click vs passive split, completion progress, etc. The Curves formulas mostly use `COUNTIFS`, `SUMIFS`, `INDEX/MATCH` against UpgradeSim.

If you change the row range of UpgradeSim (e.g., extend to 500 ticks for a longer tier), the Curves formulas need to be updated too. There's a constant near the top of this section:

```python
CURVES_END = 405  # SIM_START + SIM_ROWS = 5 + 400
```

### Section I: Final styling, save (~lines 1240-1328)

Hidden columns, freezing panes, the final `wb.save(out_path)` call.

---

## 4. The simulation tick — formula architecture

A single tick row has ~50 cells in five logical groups:

### Group 1: State (E-L)
Levels per upgrade for this tick. The "levels" are read from the previous tick's level + the previous tick's purchase. So tick `r`'s levels reflect the state *after* tick `r-1`'s action.

### Group 2: Income computation (M-T)
- **M (MPC)**: aggregate of all click contributions, with synergies and globals applied
- **N (MPS)**: aggregate of all passive contributions
- **O (APS)**: aggregate of all auto-click contributions
- **Q-S**: per-tick income from clicks, passive, auto (each multiplied by 10 because 1 tick = 10 sim seconds)
- **T**: `mass_before + Q + R + S` — mass available for purchase decisions

### Group 3: Decision helpers (AG-AW)
All the intermediate values the action formula needs.

- **AG-AM**: per-upgrade cost helpers
- **AN**: trans (cohesion + completionist all met)
- **AO**: could-trans (cohesion alone met)
- **AP**: cheapest unowned one-shot's cost
- **AQ**: cheapest stackable's cost (legacy, less used now)
- **AR**: save mode flag
- **AS-AV**: per-stackable VPC (value-per-cost)
- **AW**: max VPC across save targets (unaffordable upgrades)

### Group 4: Action decision (AX)
The big formula. Decision tree:
1. If AN=1, output `"transition"`
2. Else if any one-shot is affordable, output the cheapest's code (`"OR"`, `"HP"`, `"FP"`)
3. Else if AR=TRUE (save mode), output `""` (do nothing this tick)
4. Else if no stackable is affordable, output `""`
5. Else output the highest-VPC stackable's code (`"SW"`, `"AB"`, `"SC"`, `"Mag"`)

The post-cohesion completionist focus (AO=1 AND AN<>1) gates non-completionist stackables out of the affordable VPC pool, which makes their `_aff` contribution 0.

### Group 5: Closing mass (X)
`T − cost_of_action`. If action is `""`, cost is 0 and X = T. The result feeds into next tick's mass-before.

### Why this architecture?

Three reasons:

1. **Excel-native, no macros.** Every cell is a single formula. Anyone with Excel/Sheets can open and inspect. No VBA, no scripts inside the sheet.

2. **Hierarchical helpers.** Building the action formula as one giant nested IF would be unmaintainable. Splitting it into 10+ helper columns, each with one job, makes individual logic readable and inspectable.

3. **Per-tick determinism.** Each tick is a pure function of the previous tick + parameters. No randomness, no path dependence beyond the simulation's own choices. This makes runs reproducible and bisectable.

---

## 5. The action decision logic in detail

This is where the simulator's "AI" lives. The formula has gone through several iterations (see primer, Part 2). Current shape (v1.2.1):

```
=IF(AN_r=1, "transition",
   IF(any_affordable_one_shot, cheapest_one_shot_code,
      IF(save_mode, "",
         IF(no_affordable_stackable, "",
            highest_vpc_stackable_code))))
```

Where `save_mode` is:

```
NEXT_OS_VPC > save_vpc_threshold × MAX_AFFORDABLE_STACKABLE_VPC
```

And `MAX_AFFORDABLE_STACKABLE_VPC` is computed inline as:

```
MAX(
  IF(NOT(post_coh_focus) AND SW_affordable, SW_VPC, 0),
  IF(NOT(post_coh_focus) AND AB_affordable, AB_VPC, 0),
  IF(NOT(post_coh_focus) AND SC_affordable, SC_VPC, 0),
  IF(Mag_affordable, Mag_VPC, 0)
)
```

The `post_coh_focus` flag is `AND(AO=1, AN<>1)` — cohesion met but transition not yet. When it's true, SW/AB/SC contributions are zeroed out, leaving only Mag in consideration. This is the post-cohesion focus that closed the simulator's endgame gap against real playtests.

`NEXT_OS_VPC` is the max VPC across all unaffordable buyable upgrades. Includes one-shots (when not yet owned) and stackables (when their cost > current mass). This way save mode triggers when *anything* the player would want is more efficient than what they can currently afford.

---

## 6. Procedures for common changes

### A. Tune a number (no script changes)

If the change is just numerical — "make Solar Wind a bit cheaper" — you can edit the Parameters tab or the Upgrades tab directly *temporarily for testing*, but understand that:

- Your edits won't survive the next `python build_simulator_v12_1.py` run
- For permanent changes, edit the corresponding line in the script

For permanent: find the entry in the `UPGRADES` list and edit the value. Rebuild + recalc.

### B. Tune the strategy threshold

Change `save_vpc_threshold` in the Parameters tab. This is one of the few parameters that doesn't require a rebuild — it's referenced by formulas, so changing the cell value and recalculating updates everything.

### C. Add a new upgrade

1. Append a new dict to the `UPGRADES` list. Set all 19 fields (use 0 for fields that don't apply).
2. If it's a stackable, add its name to the `STACKABLES` list.
3. If it's a completionist, add to `COMPLETIONIST`.
4. **Critical: the simulator's column allocation.** UpgradeSim has hardcoded column letters for each upgrade's level (E, F, G, H for stackables; I, J, K for one-shots). Adding an 8th upgrade shifts everything. You'll need to:
   - Update the `LVL_COL` dict mapping upgrade name → level column letter
   - Update the `COST_COL` dict
   - Update the `VPC_COL` dict (for stackables)
   - Possibly extend the column-width and hidden-column lists
5. Rebuild + recalc + verify zero formula errors.

### D. Add a new tier (T2)

The current script is T1-only. Adding T2 is a more substantial change:

1. Add T2 upgrades to the `UPGRADES` list with `tier: 2`.
2. Add a tier selector parameter, or build the script to filter `UPGRADES` by current tier.
3. The cohesion threshold should pull from a tier-indexed parameter (`cohesion_T1_to_T2 = 1.0`, `cohesion_T2_to_T3 = 2.5`).
4. The simulator runs for one tier at a time. To test T2, point the tier selector at 2 and the cohesion threshold at 2.5.
5. Reset the starting state for T2: levels 0, mass 0 (cohesion progress doesn't carry over between tiers per current design).

In practice, the cleanest path is probably to refactor the script into a `build_simulator(tier)` function that takes a tier argument and produces a tier-specific xlsx. Then T1 and T2 each get their own .xlsx file from the same script.

### E. Change a strategy formula

Edit the per-tick row construction in section G. Common edits:

- **Tighten/loosen save mode**: change `1.5` in the save_mode formula. Or move it to a Parameters cell so it's tunable without rebuild.
- **Change action priority**: modify the IF tree in the AX formula.
- **Add a new helper column**: pick an unused column letter (typically AY or beyond), define its formula in the per-tick loop, optionally add to hidden-column list.

### F. Schema change (new field on Upgrades tab)

E.g., adding a `seasonal_multiplier` field:

1. Add the field to every dict in `UPGRADES` (default value 1.0 if not relevant).
2. Add the column to the Upgrades tab construction (insert before `description`).
3. Update the `U(name, letter)` field-letter mapping if you inserted before existing fields.
4. Use the new field in formulas where it applies.

---

## 7. Validation & debugging

### Before declaring a change "done"

1. **Rebuild without errors.** `python build_simulator_v12_1.py` should print only the save path.
2. **Recalc with zero formula errors.** `total_errors` in the recalc output must be 0. Even one error usually means a downstream problem.
3. **Sanity-check known milestones.** At default parameters (100 cpm × 1.0 active), the sim should hit HP at ~5:00 and total ~8:30. Significant drift means a regression.

### Debugging a specific tick

To understand why the sim made a particular decision at tick `t`, unhide columns AG-AX and read the values at row `5 + t`. Each helper tells one piece of the story:

- AN=1? Should have transitioned, didn't — bug in transition gating.
- AP < 9E15? A one-shot is affordable.
- AR=TRUE? Save mode is active.
- AS-AV? Each stackable's VPC. Compare to AW for save threshold check.
- AX? The decision.

### Comparing strategies

The pattern I used in this conversation:

```python
# Save current strategy result
shutil.copy(src, "/tmp/baseline.xlsx")
# Modify parameter
wb = load_workbook("/tmp/baseline.xlsx")
wb["Parameters"]["B21"] = 1.0  # save_vpc_threshold
wb.save("/tmp/test.xlsx")
# Recalc both
subprocess.run(["python", "recalc.py", "/tmp/test.xlsx", "240"])
# Read milestones from each, print comparison table
```

This pattern is much faster than rebuild-from-script for parameter-only experiments.

### Inspecting a specific formula

Sometimes you want to see exactly what formula is in a cell:

```python
wb = load_workbook("dark-filaments-simulation-v1.2.1.xlsx")  # without data_only
sim = wb["UpgradeSim"]
print(sim.cell(row=10, column=44).value)  # AR10 = save mode formula
```

---

## 8. Common gotchas

### Column letter math

`col_idx("AX")` returns 50. `col_idx("AY")` returns 51. The `col_idx` helper handles the letter-to-index conversion. Don't hardcode column indexes — they break when you shift things.

### Formulas vs values in openpyxl

- `wb = load_workbook(path)` — reads formulas (text starting with `=`)
- `wb = load_workbook(path, data_only=True)` — reads cached values

If you modify formulas and reload with `data_only=True` before recalculating, you'll see stale values. If you modify formulas and reload without `data_only`, you'll see your formulas back as text.

### Excel function names

Python case sensitivity bites here. In the formulas you write into cells, use Excel's case: `IFERROR`, `MAX`, `IF`, `AND`, `NOT`, `ISNUMBER`, `MIN`. LibreOffice's recalc accepts most case variations but Excel proper is stricter. Stick to all-caps for safety.

`TRUE` and `FALSE` should be written as `TRUE()` and `FALSE()` in formulas — the parentheses make them explicit Excel function calls and avoid ambiguity with text strings named "TRUE."

### Division by empty string

Many helper formulas wrap division in `IFERROR(... , 0)` because the denominator might be empty (e.g., a maxed-out stackable's cost cell is `""`). Without `IFERROR`, the cell becomes `#VALUE!` and propagates up.

### Init row vs per-tick row

The init row (row 6) uses **different formulas** than per-tick rows. Most cells in init are constants (0 or "") because nothing has accumulated. If you add a new helper column for per-tick rows, also add the init-row equivalent or you'll get a `#REF!` when row 7 tries to reference row 6.

### Cell references in a generated formula

When building a formula string in Python, decide carefully whether you want absolute or relative references:

- Relative (`A1`): adjusts when copied. We don't actually copy formulas, so this is safe-ish, but be deliberate.
- Absolute (`$A$1`): pinned. Use for parameter references that shouldn't shift.
- Mixed (`A$1`, `$A1`): one axis pinned. Sometimes useful for table lookups.

Most parameter references via `P("name")` return `$Cell$Row` (absolute), which is what you want.

### Recalc dependency order

Excel/LibreOffice automatically figure out cell dependency order when recalculating, so you can write helpers in any column and they'll be evaluated correctly. Don't worry about "AS depends on AT, but AT comes after AS" — it's fine.

### Hidden columns

Helper columns are hidden by default for visual clarity. The hidden-column list lives in the styling section of UpgradeSim construction. When debugging, you can unhide manually in the spreadsheet (right-click column → Unhide) — these unhides won't survive the next build, but for inspection that's fine.

### LibreOffice path

The `recalc.py` script depends on LibreOffice being installed. On Linux it expects `soffice` in the PATH. On macOS the binary is at `/Applications/LibreOffice.app/Contents/MacOS/soffice`. On Windows you'll need to set the `SOFFICE_PATH` env var or modify recalc.py.

---

## 9. Validation checklist for any structural change

When you change something non-trivial (new column, new strategy logic, new tier):

- [ ] Build runs without Python errors
- [ ] Recalc shows `total_errors: 0`
- [ ] Open the xlsx and visually scan UpgradeSim for `#REF!`, `#VALUE!`, `#DIV/0!`, `#NAME?`
- [ ] Sim reaches transition state by tick 100 at default parameters (otherwise something's stalled)
- [ ] Sanity-check a known parameter combo against historical results (100 cpm × 1.0 → ~8:30 total)
- [ ] If you added a new helper column, verify the init row sets it to a sensible value (usually 0 or "")
- [ ] If you added a new upgrade, verify it appears in the Curves tab's per-upgrade tracking

---

## 10. Performance notes

The simulator currently has ~19,800 formulas. Recalc takes ~30-60 seconds with LibreOffice headless. This is fine for development cycles.

If you extend to all 10 tiers in a single workbook, the formula count would grow proportionally and recalc time with it. At that point, consider:

- Splitting into per-tier workbooks (keep T1, T2, ... separate)
- Using a shorter SIM_ROWS for faster tiers
- Profiling what's slow with `recalc.py --time` (if supported by your version)

For T1 alone, performance has not been a problem.

---

## 11. Where to start when picking this up cold

Order of operations for a new session:

1. Read this guide.
2. Read the project primer (Parts 1-3).
3. Read the build script header docstring.
4. Open the latest .xlsx in Excel/LibreOffice. Click around. Look at the Parameters, Upgrades, UpgradeSim tabs.
5. Make a tiny change (e.g., bump SW per-level value from 0.080 to 0.100). Rebuild, recalc, see how the times shift. This validates your local setup.
6. Whatever the actual task is, start there.

If something breaks, the recalc error log + a `data_only=False` read of the offending cell almost always tells you what's wrong.

---

*Last updated alongside simulator v1.2.1 with VPC + post-cohesion focus strategy. T1 only.*
