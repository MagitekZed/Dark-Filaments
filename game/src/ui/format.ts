// ui/format.ts — display formatting for the chrome (mass, rates, cost).
//
// The mass counter is a real-scale solar-mass (M☉) reading from ~1 M☉ at T1
// through ~5×10²² M☉ at the final tier, so formatting must adapt across many
// orders of magnitude. These are PURE display helpers — no engine knowledge,
// no rounding that affects the engine math. The unit symbol is M☉ throughout
// (the locked solar-mass denomination).

const SUN = ' M☉';

// Mass counter. Two-decimal under 10 for the early T1 feel; one-decimal to
// 1000; compact k below a million; exponential past a million so the counter
// stays legible at galactic scale.
export function fmtMass(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const v = n < 0 ? 0 : n;
  if (v < 10) return v.toFixed(2) + SUN;
  if (v < 1000) return v.toFixed(1) + SUN;
  if (v < 1e6) return (v / 1e3).toFixed(2) + 'k' + SUN;
  return v.toExponential(2) + SUN;
}

// Rate readout for the stats line (MPS / MPC). Compact, adaptive precision.
export function fmtRate(n: number, suffix: string): string {
  if (!Number.isFinite(n)) return '—';
  const v = n < 0 ? 0 : n;
  let num: string;
  if (v === 0) num = '0';
  else if (v < 0.01) num = v.toExponential(2);
  else if (v < 1000) num = v.toFixed(2);
  else if (v < 1e6) num = (v / 1e3).toFixed(2) + 'k';
  else num = v.toExponential(2);
  return num + SUN + suffix;
}

// AC/s line (autoclickers per second) — plain decimal, only shown when > 0.
export function fmtAps(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n < 1000) return n.toFixed(2);
  return n.toExponential(2);
}

// Upgrade-card cost. Same scale-adaptive formatting as mass so a 6M M☉ cost
// reads cleanly. Tabular-nums in CSS keeps the column aligned.
export function fmtCost(c: number): string {
  if (!Number.isFinite(c)) return '—';
  const v = c < 0 ? 0 : c;
  if (v < 10) return v.toFixed(2) + SUN;
  if (v < 1000) return v.toFixed(1) + SUN;
  if (v < 1e6) return (v / 1e3).toFixed(2) + 'k' + SUN;
  if (v < 1e9) return (v / 1e6).toFixed(2) + 'M' + SUN;
  return v.toExponential(2) + SUN;
}
