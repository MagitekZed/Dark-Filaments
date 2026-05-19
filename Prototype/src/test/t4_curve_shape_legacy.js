// Dark Filaments — T3 curve-shape analyzer (Node-only)
// Run via: node Prototype/src/test/t3_curve_shape.js [--scenario comp|thr] [--compare]
//
// Drives runSimulation through T1+T2+T3 (Completion handoff, T3 mode by flag)
// and emits a per-quartile / per-decile MPS sample plus action mix.
//
// Two questions:
//   1. How flat is the middle? Sample MPS at 0%, 25%, 50%, 75%, 100% of runtime.
//      Plateau-then-wall = big jump between 75% and 100%; steady = roughly even.
//   2. What's the bot doing during the flat middle? Bucket actions per decile.
//
// Used to quantify "T3 feels like a slog" vs. "T3 feels like T2's steady climb".

'use strict';

const data = require('../sim/data.js');
const core = require('../sim/core.js');
const strategy = require('../sim/strategy.js');
const runner = require('../sim/runner.js');

function fmtTime(s) {
  const t = Math.round(s);
  const m = Math.floor(t / 60);
  const r = t - m * 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}

function pct(p) { const s = p >= 0 ? '+' : ''; return s + p.toFixed(1) + '%'; }

function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'k';
  return n.toFixed(2);
}

function runChain(handoffMode, t3Mode) {
  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };
  const t1 = runner.runSimulation(params, { tier: 1, mode: handoffMode });
  const t2 = runner.runSimulation(params, { tier: 2, mode: handoffMode, carryFrom: t1.finalState });
  const t3 = runner.runSimulation(params, { tier: 3, mode: t3Mode, carryFrom: t2.finalState });
  return { t1, t2, t3 };
}

function analyzeCurve(label, t3Result) {
  const trace = t3Result.trace;
  const total = trace.length - 1;  // ticks
  if (total <= 0) {
    console.log(label + ': empty trace');
    return null;
  }

  // Sample MPS + mass at deciles.
  const samples = [];
  for (let pct = 0; pct <= 100; pct += 10) {
    const idx = Math.min(trace.length - 1, Math.floor(total * pct / 100));
    const row = trace[idx];
    samples.push({
      pct,
      t: row.time_s,
      mps: row.mps,
      mass: row.mass_out,
      passInc: row.passive_income,
      autoInc: row.auto_income,
      clickInc: row.click_income,
    });
  }

  // Bucket action types per decile.
  const buckets = [];
  for (let i = 0; i < 10; i++) {
    buckets.push({ pct: i * 10, buys: 0, saves: 0, none: 0, buyNames: {} });
  }
  for (let i = 0; i < trace.length; i++) {
    const decile = Math.min(9, Math.floor(i / trace.length * 10));
    const r = trace[i];
    if (r.action === 'buy') {
      buckets[decile].buys++;
      buckets[decile].buyNames[r.upgrade] = (buckets[decile].buyNames[r.upgrade] || 0) + 1;
    } else if (r.action === 'save') {
      buckets[decile].saves++;
    } else if (r.action === 'none') {
      buckets[decile].none++;
    }
  }

  console.log('');
  console.log('=== ' + label + ' ===');
  console.log('  T3 total ticks: ' + total + '  (' + fmtTime(total) + ')');
  console.log('');
  console.log('  Decile  | time    | mps         | total inc/s | mass        | growth-vs-prev');
  console.log('  --------|---------|-------------|-------------|-------------|----------------');
  let prevMps = null;
  for (const s of samples) {
    const totalInc = s.passInc + s.autoInc + s.clickInc;
    const growth = prevMps != null && prevMps > 0 ? (s.mps / prevMps) : null;
    console.log('  ' + (s.pct + '%').padStart(6) + '  | ' +
      fmtTime(s.t).padStart(6) + '  | ' +
      fmtNum(s.mps).padStart(11) + ' | ' +
      fmtNum(totalInc).padStart(11) + ' | ' +
      fmtNum(s.mass).padStart(11) + ' | ' +
      (growth != null ? (growth.toFixed(2) + 'x') : '—'));
    prevMps = s.mps;
  }

  // Compute curve-shape metric: ratio of (mps@75→100 jump) / (mps@0→75 climb).
  // A perfect linear climb in log space → exponents are roughly equal per decile.
  const mpsAtP = function (pct) {
    const idx = Math.min(trace.length - 1, Math.floor(total * pct / 100));
    return trace[idx].mps;
  };
  const m0 = mpsAtP(0) + 1;  // +1 to avoid log(0)
  const m25 = mpsAtP(25);
  const m50 = mpsAtP(50);
  const m75 = mpsAtP(75);
  const m100 = mpsAtP(100);
  const ratio_75_100 = m100 / Math.max(m75, 1);
  const ratio_0_75 = m75 / Math.max(m0, 1);
  console.log('');
  console.log('  Curve metric:');
  console.log('    MPS 0%→75% growth:   ' + ratio_0_75.toFixed(1) + 'x');
  console.log('    MPS 75%→100% growth: ' + ratio_75_100.toFixed(1) + 'x');
  console.log('    Late-wall ratio (75→100 / 0→75): ' + (ratio_75_100 / ratio_0_75).toFixed(3));
  console.log('    Lower = steadier climb. T2 reference: see compare mode.');

  // Action buckets.
  console.log('');
  console.log('  Action mix per decile:');
  console.log('  Decile | buys | saves | none | top buys');
  for (const b of buckets) {
    const totalActions = b.buys + b.saves + b.none;
    if (totalActions === 0) continue;
    const top = Object.entries(b.buyNames)
      .sort((a, c) => c[1] - a[1])
      .slice(0, 3)
      .map(([n, k]) => n + '×' + k)
      .join(', ');
    console.log('  ' + (b.pct + '%').padStart(6) + ' | ' +
      b.buys.toString().padStart(4) + ' | ' +
      b.saves.toString().padStart(5) + ' | ' +
      b.none.toString().padStart(4) + ' | ' + top);
  }

  return { samples, buckets, ratio_75_100, ratio_0_75 };
}

function compareT2() {
  console.log('');
  console.log('### T2 reference (Completion-handoff Comp) ###');
  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };
  const t1 = runner.runSimulation(params, { tier: 1, mode: 'completion' });
  const t2 = runner.runSimulation(params, { tier: 2, mode: 'completion', carryFrom: t1.finalState });
  analyzeCurve('T2 Completion (reference)', t2);
}

function main() {
  const argv = process.argv.slice(2);
  const compare = argv.includes('--compare');
  const scenarioFlag = argv.find(a => a.startsWith('--scenario='));
  const scenario = scenarioFlag ? scenarioFlag.split('=')[1] : 'both';

  if (scenario === 'both' || scenario === 'comp') {
    const chain = runChain('completion', 'completion');
    analyzeCurve('T3 Comp-handoff Comp', chain.t3);
  }
  if (scenario === 'both' || scenario === 'thr') {
    const chain = runChain('completion', 'threshold');
    analyzeCurve('T3 Comp-handoff Thr', chain.t3);
  }

  if (compare) compareT2();
}

if (require.main === module) main();
