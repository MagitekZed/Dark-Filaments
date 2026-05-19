// Dark Filaments — flavor-helper smoke test (Node-only)
// Run via: node Prototype/src/test/flavor_smoke.js
//
// Verifies the four resolution branches of core.getUpgradeFlavor for each of
// the three upgrades currently carrying synergyVariants:
//   - T2 Roche Lobe Overflow (variants B / C — Local Bubble / Brown Dwarf)
//   - T3 HII Region          (variant D     — Local Bubble cross-tier)
//
// Branches exercised per upgrade:
//   1. level=0,    state with no providers owned     → fallback (descByLevel[0] or desc)
//   2. level>=1,   state with no providers owned     → fallback (descByLevel[level-1] or desc)
//   3. level=0,    state with provider owned         → synergyVariants entry's text
//   4. level>=1,   state with provider owned         → synergyVariants entry's text
//
// Plus a control case: state=null with provider levels populated should still
// fall back (rule 1 only fires when state is provided).
//
// Exit code 0 on all-pass, 1 on any miss.

'use strict';

const data = require('../sim/data.js');
const core = require('../sim/core.js');

const UPGRADES = data.UPGRADES;
const findUpgrade = (name) => {
  const u = UPGRADES.find(u => u.name === name);
  if (!u) throw new Error("Upgrade not found in data.js: " + name);
  return u;
};

// Build a state shell with all upgrade levels at 0; flip specific providers to 1
// per case. Mirrors the playtest.js state.levels shape.
function emptyState() {
  return { levels: Object.fromEntries(UPGRADES.map(u => [u.name, 0])) };
}

let pass = 0, fail = 0;
const failures = [];

function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) {
    pass++;
  } else {
    fail++;
    failures.push({ label, actual, expected });
  }
}

// ---- T2 Roche Lobe Overflow ----
const rlo = findUpgrade("Roche Lobe Overflow");
const rloDesc = rlo.desc;
const rloVariantBD = rlo.synergyVariants.find(v => v.provider === "Brown Dwarf").text;
const rloVariantLB = rlo.synergyVariants.find(v => v.provider === "Local Bubble").text;

// 1. level=0, no providers → desc
{
  const s = emptyState();
  check("RLO L0 no providers", core.getUpgradeFlavor(rlo, 0, s), rloDesc);
}
// 2. level=3, no providers → desc (no descByLevel on RLO)
{
  const s = emptyState();
  check("RLO L3 no providers", core.getUpgradeFlavor(rlo, 3, s), rloDesc);
}
// 3. level=0, Local Bubble owned → B variant
{
  const s = emptyState();
  s.levels["Local Bubble"] = 1;
  check("RLO L0 with Local Bubble", core.getUpgradeFlavor(rlo, 0, s), rloVariantLB);
}
// 4. level=5, Brown Dwarf owned → C variant
{
  const s = emptyState();
  s.levels["Brown Dwarf"] = 1;
  check("RLO L5 with Brown Dwarf", core.getUpgradeFlavor(rlo, 5, s), rloVariantBD);
}
// Priority case: both providers owned → first match wins (Brown Dwarf listed first)
{
  const s = emptyState();
  s.levels["Local Bubble"] = 1;
  s.levels["Brown Dwarf"] = 1;
  check("RLO L5 with both providers (BD wins by ordering)",
        core.getUpgradeFlavor(rlo, 5, s), rloVariantBD);
}
// state=null with providers nominally owned: synergyVariants ignored, fallback to desc
{
  check("RLO L3 state=null", core.getUpgradeFlavor(rlo, 3, null), rloDesc);
}

// ---- T3 HII Region ----
const hii = findUpgrade("HII Region");
const hiiDesc = hii.desc;
const hiiVariantLB = hii.synergyVariants.find(v => v.provider === "Local Bubble").text;

{
  const s = emptyState();
  check("HII L0 no providers", core.getUpgradeFlavor(hii, 0, s), hiiDesc);
}
{
  const s = emptyState();
  check("HII L7 no providers", core.getUpgradeFlavor(hii, 7, s), hiiDesc);
}
{
  const s = emptyState();
  s.levels["Local Bubble"] = 1;
  check("HII L0 with Local Bubble", core.getUpgradeFlavor(hii, 0, s), hiiVariantLB);
}
{
  const s = emptyState();
  s.levels["Local Bubble"] = 12;
  check("HII L7 with Local Bubble (LB level >1)",
        core.getUpgradeFlavor(hii, 7, s), hiiVariantLB);
}
// state=null: fallback
{
  check("HII L0 state=null", core.getUpgradeFlavor(hii, 0, null), hiiDesc);
}

// ---- Control: Galactic Bulge (descByLevel only, no synergyVariants) ----
// Make sure the synergyVariants check doesn't perturb descByLevel resolution.
const bulge = findUpgrade("Galactic Bulge");
const bulgeArr = bulge.descByLevel;
{
  const s = emptyState();
  check("Bulge L0 → arr[0]", core.getUpgradeFlavor(bulge, 0, s), bulgeArr[0]);
  check("Bulge L1 → arr[0]", core.getUpgradeFlavor(bulge, 1, s), bulgeArr[0]);
  check("Bulge L4 → arr[3]", core.getUpgradeFlavor(bulge, 4, s), bulgeArr[3]);
  check("Bulge L7 → arr[6]", core.getUpgradeFlavor(bulge, 7, s), bulgeArr[6]);
  // state=null still works for descByLevel
  check("Bulge L4 state=null", core.getUpgradeFlavor(bulge, 4, null), bulgeArr[3]);
}

// ---- Control: Solar Wind (flat desc only) ----
const sw = findUpgrade("Solar Wind");
{
  const s = emptyState();
  check("Solar Wind L0 → desc", core.getUpgradeFlavor(sw, 0, s), sw.desc);
  check("Solar Wind L17 → desc", core.getUpgradeFlavor(sw, 17, s), sw.desc);
  check("Solar Wind state=null → desc", core.getUpgradeFlavor(sw, 0, null), sw.desc);
}

// ---- Report ----
console.log("Dark Filaments — flavor-helper smoke test");
console.log("=========================================");
console.log("PASS: " + pass + "   FAIL: " + fail);
if (fail > 0) {
  console.log("");
  console.log("--- failures ---");
  for (const f of failures) {
    console.log(f.label);
    console.log("  expected: " + JSON.stringify(f.expected));
    console.log("  actual:   " + JSON.stringify(f.actual));
  }
  process.exitCode = 1;
} else {
  console.log("All flavor-resolution branches return expected strings.");
}
