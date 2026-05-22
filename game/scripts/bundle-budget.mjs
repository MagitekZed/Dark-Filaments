// scripts/bundle-budget.mjs — bundle-size budget gate (scaffold plan §7 G7 / §9).
//
// Reads the built dist/assets/*.js chunks and fails (exit 1) if the MAIN entry
// chunk exceeds a gzipped ceiling. Three.js + R3F are heavy; this guards against
// real bloat creeping in without tripping on normal growth.
//
// Run AFTER `npm run build` (the CI step order in .github/workflows/ci.yml):
//   npm run build && node scripts/bundle-budget.mjs
//
// Measurement: gzipped (zlib.gzipSync), which is what the network actually pays.
// Budgets are picked with headroom over the v0.1 baseline:
//   main entry chunk  ~349 kB gzipped  → budget 450 kB gzipped
//   engine worker     ~14  kB gzipped  → budget 120 kB gzipped (separate)
// The worker chunk is budgeted on its own, NOT folded into the main-chunk check,
// because it is a distinct entry the browser loads off the render thread.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'dist', 'assets');

// --- Budgets (gzipped bytes) -------------------------------------------------
const KB = 1024;
const MAIN_BUDGET_GZIP = 450 * KB; // main entry: baseline ~349 kB, headroom to 450 kB
const WORKER_BUDGET_GZIP = 120 * KB; // engine worker: baseline ~14 kB, generous headroom

function fmt(bytes) {
  return `${(bytes / KB).toFixed(1)} kB`;
}

function gzipSize(filePath) {
  return gzipSync(readFileSync(filePath)).length;
}

let assets;
try {
  assets = readdirSync(ASSETS_DIR);
} catch (err) {
  console.error(`[bundle-budget] cannot read ${ASSETS_DIR} — run \`npm run build\` first.`);
  console.error(`[bundle-budget] ${err && err.message}`);
  process.exit(1);
}

const jsFiles = assets.filter((f) => f.endsWith('.js'));
if (jsFiles.length === 0) {
  console.error('[bundle-budget] no .js chunks found in dist/assets — build looks empty.');
  process.exit(1);
}

// Classify chunks. The Worker chunk is emitted with `engine.worker` in its name
// (Vite worker output); everything else that is an entry/main chunk is treated
// as the main bundle. We take the LARGEST non-worker chunk as the main entry —
// in this single-entry app there is exactly one, but taking the max is robust if
// code-splitting later introduces vendor chunks (the largest is the one to watch).
const workerFiles = jsFiles.filter((f) => f.includes('engine.worker'));
const mainFiles = jsFiles.filter((f) => !f.includes('engine.worker'));

if (mainFiles.length === 0) {
  console.error('[bundle-budget] could not identify a main (non-worker) chunk.');
  process.exit(1);
}

let failed = false;

// Main chunk: the largest non-worker chunk.
let mainFile = mainFiles[0];
let mainRaw = statSync(join(ASSETS_DIR, mainFile)).size;
for (const f of mainFiles) {
  const raw = statSync(join(ASSETS_DIR, f)).size;
  if (raw > mainRaw) {
    mainFile = f;
    mainRaw = raw;
  }
}
const mainGzip = gzipSize(join(ASSETS_DIR, mainFile));

console.log('[bundle-budget] chunk sizes (gzipped):');
console.log(
  `  main   ${mainFile}: ${fmt(mainGzip)} gzip (${fmt(mainRaw)} raw)` +
    `  budget ${fmt(MAIN_BUDGET_GZIP)} gzip`,
);
if (mainGzip > MAIN_BUDGET_GZIP) {
  console.error(
    `[bundle-budget] FAIL: main chunk ${fmt(mainGzip)} gzip exceeds budget ${fmt(MAIN_BUDGET_GZIP)} gzip.`,
  );
  failed = true;
}

// Worker chunk(s): budgeted separately.
for (const f of workerFiles) {
  const raw = statSync(join(ASSETS_DIR, f)).size;
  const gz = gzipSize(join(ASSETS_DIR, f));
  console.log(
    `  worker ${f}: ${fmt(gz)} gzip (${fmt(raw)} raw)` +
      `  budget ${fmt(WORKER_BUDGET_GZIP)} gzip`,
  );
  if (gz > WORKER_BUDGET_GZIP) {
    console.error(
      `[bundle-budget] FAIL: worker chunk ${f} ${fmt(gz)} gzip exceeds budget ${fmt(WORKER_BUDGET_GZIP)} gzip.`,
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('[bundle-budget] PASS: all chunks within budget.');
process.exit(0);
