// ⚠️ STALE — pre-M☉-retune harness (2026-05-12).
//
// This harness asserts numerical values calibrated against the pre-M☉
// arbitrary-mass-unit scale. After the T1 long-burn retune landed
// 2026-05-12 (DEFAULT_PARAMS.baseMpc 1.0→0.02; perTierEngagement steep
// curve; T1 mass rescaled ÷600), the numbers in this harness are
// no longer valid.
//
// EXPECTED OUTCOME: this harness FAILS until the T1 playtest-comparison
// reference data is regenerated against the M☉-denominated scale.
//
// Do NOT delete — the legacy assertions still document the prior
// calibration, useful as a reference point during retune passes.
//
// New canonical calibration apparatus: src/test/harness.js + profiles_smoke.js.
//
// Dark Filaments — sim validation harness (Node-only)
// Run via: node Prototype/src/test/validate.js
//
// For each real T1 playtest log (60/100/150 cpm):
//   1. Parse the log to extract ground-truth: avg cpm, total time, completionist
//      status (Mag-5 maxed + FP owned), final levels.
//   2. Run runSimulation with cpm matching the playtest's avg, engagement=1.0,
//      mode determined by completionist status.
//   3. Compare sim total_time vs playtest total_time. Print PASS if within 6%.
//
// Threshold for PASS: ±6%. Beyond that we surface diagnostic info.

'use strict';

const fs = require('fs');
const path = require('path');

// Load sim modules. Order matters because runner.js calls require() for the
// others when invoked from Node.
const data = require('../sim/data.js');
const core = require('../sim/core.js');
const strategy = require('../sim/strategy.js');
const runner = require('../sim/runner.js');

const PLAYTEST_DIR = path.resolve(__dirname, '..', '..', '..', 'Simulator', 'playtests');
const PLAYTESTS = [
  { cpm: 60,  file: 'playtest_log_60cpm.txt'  },
  { cpm: 100, file: 'playtest_log_100cpm.txt' },
  { cpm: 150, file: 'playtest_log_150cpm.txt' },
];
const PASS_THRESHOLD = 0.06;

// Parse a log file. Looks for the END line and the final summary comment lines.
//   [  517.0s] END   mass 40.2   clicks 854   time 517.0s   mag=Y   fp=Y
//   # Session summary: 11:35 total (7:40 to cohesion + 3:54 completionist). Avg 59.5 cpm.
//   # Final levels: SW=17, AB=14, SC=8, Mag=5, OR=Y, HP=Y, FP=Y. Total purchases: 47.
function parseLog(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);

  let endLine = null;
  let summaryLine = null;
  let levelsLine = null;

  for (const line of lines) {
    if (/]\s+END\b/.test(line)) endLine = line;
    if (/Session summary/.test(line)) summaryLine = line;
    if (/Final levels/.test(line)) levelsLine = line;
  }

  if (!endLine) throw new Error("No END line in log: " + filePath);

  // Extract total time from END line: "time 517.0s"
  const timeMatch = endLine.match(/time\s+(\d+(?:\.\d+)?)s/);
  if (!timeMatch) throw new Error("No time in END line: " + endLine);
  const totalTime_s = parseFloat(timeMatch[1]);

  // mag=Y / fp=Y flags
  const magMatch = endLine.match(/mag=([YN])/);
  const fpMatch = endLine.match(/fp=([YN])/);
  const magOwned = magMatch ? magMatch[1] === 'Y' : false;
  const fpOwned = fpMatch ? fpMatch[1] === 'Y' : false;

  const massMatch = endLine.match(/mass\s+(\d+(?:\.\d+)?)/);
  const finalMass = massMatch ? parseFloat(massMatch[1]) : null;

  const clicksMatch = endLine.match(/clicks\s+(\d+)/);
  const totalClicks = clicksMatch ? parseInt(clicksMatch[1], 10) : null;

  // Avg cpm from summary line, e.g. "Avg 59.5 cpm."
  let avgCpm = null;
  let consolidationTime_s = null;
  if (summaryLine) {
    const avgMatch = summaryLine.match(/Avg\s+(\d+(?:\.\d+)?)\s+cpm/);
    if (avgMatch) avgCpm = parseFloat(avgMatch[1]);
    // "11:35 total (7:40 to cohesion + 3:54 completionist)"
    const cohMatch = summaryLine.match(/\((\d+):(\d+)\s+to cohesion/);
    if (cohMatch) consolidationTime_s = parseInt(cohMatch[1], 10) * 60 + parseInt(cohMatch[2], 10);
  }

  // Final levels parse
  let levels = null;
  if (levelsLine) {
    levels = {};
    const map = { SW: "Solar Wind", AB: "Asteroid Belt", SC: "Stellar Coupling",
                  Mag: "Magnetosphere", OR: "Orbital Resonance",
                  HP: "Heliopause", FP: "First Photons" };
    const re = /(SW|AB|SC|Mag|OR|HP|FP)\s*=\s*([Y0-9]+)/g;
    let m;
    while ((m = re.exec(levelsLine)) !== null) {
      const key = map[m[1]];
      const val = m[2] === 'Y' ? 1 : (m[2] === 'N' ? 0 : parseInt(m[2], 10));
      levels[key] = val;
    }
  }

  // completionistDone: Mag=5 AND FP=Y
  const completionistDone = magOwned && fpOwned;

  return {
    filePath,
    totalTime_s,
    avgCpm,
    consolidationTime_s,
    completionistDone,
    magOwned,
    fpOwned,
    finalMass,
    totalClicks,
    levels,
  };
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(0).padStart(s < 10 ? 1 : 2, '0');
}

function fmtMmSs(seconds) {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return m.toString().padStart(2, ' ') + ':' + s.toString().padStart(2, '0');
}

function fmtPct(p) {
  const sign = p >= 0 ? '+' : '';
  return sign + p.toFixed(1) + '%';
}

function summarizeLevels(levels) {
  return [
    'SW=' + (levels["Solar Wind"] ?? 0),
    'AB=' + (levels["Asteroid Belt"] ?? 0),
    'SC=' + (levels["Stellar Coupling"] ?? 0),
    'Mag=' + (levels["Magnetosphere"] ?? 0),
    'OR=' + (levels["Orbital Resonance"] ? 'Y' : 'N'),
    'HP=' + (levels["Heliopause"] ? 'Y' : 'N'),
    'FP=' + (levels["First Photons"] ? 'Y' : 'N'),
  ].join(' ');
}

function runOne(playtest) {
  const log = parseLog(path.join(PLAYTEST_DIR, playtest.file));
  const cpm = log.avgCpm != null ? log.avgCpm : playtest.cpm;
  const mode = log.completionistDone ? "completion" : "threshold";

  const params = {
    cpm,
    engagement: 1.0,
    saveVpcThreshold: 1.5,
  };
  const scenario = { tier: 1, mode };

  const result = runner.runSimulation(params, scenario);
  const simTime_s = result.headline.totalTime_s;
  const realTime_s = log.totalTime_s;
  const delta = (simTime_s - realTime_s) / realTime_s;
  const pass = Math.abs(delta) <= PASS_THRESHOLD;

  return { playtest, log, result, simTime_s, realTime_s, delta, pass, cpm, mode };
}

function diagnose(report) {
  const { log, result, cpm, mode } = report;
  const lines = [];
  lines.push('  --- diagnostic ---');
  lines.push('  cpm used: ' + cpm.toFixed(1) + '   mode: ' + mode);
  lines.push('  sim levels:  ' + summarizeLevels(result.headline.levels));
  if (log.levels) lines.push('  real levels: ' + summarizeLevels(log.levels));
  lines.push('  sim final mass: ' + result.headline.finalMass.toFixed(1)
           + '   real final mass: ' + (log.finalMass != null ? log.finalMass.toFixed(1) : '?'));
  lines.push('  sim consolidation: ' + result.headline.consolidation.toFixed(2)
           + '   sim threshold-hit: ' + (result.headline.thresholdHit_s != null ? result.headline.thresholdHit_s + 's' : '—')
           + '   real threshold-hit: ' + (log.consolidationTime_s != null ? log.consolidationTime_s + 's' : '—'));
  lines.push('  sim completionistDone: ' + result.headline.completionistDone
           + '   real completionistDone: ' + log.completionistDone);
  lines.push('  exit reason: ' + result.headline.exitReason);

  // Save-mode invocation count + first 5 buys.
  let saveCount = 0, buyCount = 0;
  const firstBuys = [];
  for (const row of result.trace) {
    if (row.action === 'save') saveCount++;
    if (row.action === 'buy') {
      buyCount++;
      if (firstBuys.length < 6) {
        firstBuys.push('t=' + row.tick + 's ' + row.upgrade + ' (cost=' + row.cost.toFixed(0) + ')');
      }
    }
  }
  lines.push('  total buys: ' + buyCount + '   save-mode ticks: ' + saveCount);
  lines.push('  first buys: ' + firstBuys.join(', '));
  return lines.join('\n');
}

function main() {
  console.log('Dark Filaments T1 simulator validation');
  console.log('======================================');
  const reports = [];
  for (const pt of PLAYTESTS) {
    try {
      const r = runOne(pt);
      reports.push(r);
    } catch (e) {
      console.log(pt.cpm + ' cpm → ERROR: ' + e.message);
    }
  }

  for (const r of reports) {
    const cpm = r.cpm.toFixed(1).padStart(5, ' ');
    const real = fmtMmSs(r.realTime_s);
    const sim = fmtMmSs(r.simTime_s);
    const pct = fmtPct(r.delta * 100).padStart(7, ' ');
    const tag = r.pass ? 'PASS' : 'FAIL';
    console.log(cpm + ' cpm  → real ' + real + ' / sim ' + sim + ' (' + pct + ')  ' + tag);
  }

  let anyFail = false;
  for (const r of reports) if (!r.pass) anyFail = true;

  if (anyFail) {
    console.log('');
    console.log('--- FAIL diagnostics ---');
    for (const r of reports) {
      if (!r.pass) {
        console.log('');
        console.log(r.cpm.toFixed(1) + ' cpm:');
        console.log(diagnose(r));
      }
    }
    process.exitCode = 1;
  } else {
    console.log('');
    console.log('All three playtests within ±' + (PASS_THRESHOLD * 100) + '%.');
  }
}

if (require.main === module) main();

module.exports = { parseLog, runOne, main };
