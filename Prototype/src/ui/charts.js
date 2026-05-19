// Dark Filaments — Simulator tab charts
// Lightweight canvas charts. No library — vanilla 2D API only. Each chart
// receives a HTMLCanvasElement and a small data shape; it clears, draws, and
// returns. Intended to be cheap enough to redraw on every parameter change.
//
// Palette is pulled from the prototype CSS variables (off-white text, muted
// accents, two cool-vs-warm series colors). All sizes are in CSS pixels;
// devicePixelRatio is honored so lines stay crisp on hi-dpi screens.
//
// Loaded as a plain <script> from file://. IIFE attaches to window.DF.ui.charts.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.ui = global.DF.ui || {};

  // Font constants. Charts are utility UI — monospace for tabular numerals.
  // Charts are NOT narrator voice; never use the serif here.
  const FONT_TICK   = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  const FONT_LABEL  = '10px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  const FONT_LEGEND = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  // Plot rect padding. T leaves room for the in-canvas legend gutter; B leaves
  // room for the X tick row + the X axis title beneath it.
  const PAD = { L: 48, R: 16, T: 32, B: 36 };

  // Read CSS variable values from the body so the chart palette tracks the
  // theme without duplicating hex codes. Falls back to sensible defaults if a
  // variable is missing.
  function cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name);
      return v && v.trim() ? v.trim() : fallback;
    } catch (e) { return fallback; }
  }

  function palette() {
    return {
      bg:        cssVar('--bg', '#0a0e1a'),
      bg2:       cssVar('--bg-2', '#121828'),
      fg:        cssVar('--fg', '#e8e6df'),
      fgDim:     cssVar('--fg-dim', '#8a8a96'),
      fgFaint:   cssVar('--fg-faint', '#4a4d5a'),
      accent:    cssVar('--accent', '#d9b56b'),
      cool:      cssVar('--consolidation-high', '#6ec0d9'),
      coolDim:   cssVar('--consolidation-low', '#2c4a6a'),
      border:    cssVar('--border', '#20263a'),
    };
  }

  // ---- Scaling helpers ------------------------------------------------

  // "Nice number" Y axis scale — 1 / 2 / 2.5 / 5 × 10^N.
  function niceScale(dataMax, targetCount) {
    targetCount = targetCount || 4;
    if (!isFinite(dataMax) || dataMax <= 0) {
      return { min: 0, max: 1, step: 0.25, ticks: [0, 0.25, 0.5, 0.75, 1] };
    }
    const rawStep = dataMax / targetCount;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    // Round UP to the next nice number so the resulting tick count stays at
    // most ~targetCount + 1. Previous thresholds (norm < 4 → 2.5) rounded
    // DOWN, producing step=250 for dataMax≈1274 → 7 ticks instead of the
    // intended 4-5.
    let niceNorm;
    if (norm <= 1) niceNorm = 1;
    else if (norm <= 2) niceNorm = 2;
    else if (norm <= 2.5) niceNorm = 2.5;
    else if (norm <= 5) niceNorm = 5;
    else niceNorm = 10;
    const step = niceNorm * mag;
    const niceMax = Math.ceil(dataMax / step) * step;
    const ticks = [];
    for (let v = 0; v <= niceMax + step * 1e-9; v += step) ticks.push(v);
    return { min: 0, max: niceMax, step, ticks };
  }

  // "Nice time" X axis. Picks the smallest predefined step where the
  // resulting tick count is <= targetCount. Default targetCount is 5 so the
  // axis breathes a bit — ratio raw = xMax/4 (the previous formulation)
  // skipped the 120s step at xMax=495 and jumped straight to 300s, leaving
  // only "0:00 / 5:00 / 10:00" on a five-minute run.
  const TIME_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
  function niceTimeStep(xMaxSeconds, targetCount) {
    targetCount = targetCount || 5;
    for (const s of TIME_STEPS) {
      if (Math.ceil(xMaxSeconds / s) <= targetCount) return s;
    }
    return TIME_STEPS[TIME_STEPS.length - 1];
  }
  function timeTicks(xMaxSeconds, targetCount) {
    if (!isFinite(xMaxSeconds) || xMaxSeconds <= 0) {
      return { step: 1, max: 1, ticks: [0, 1] };
    }
    const step = niceTimeStep(xMaxSeconds, targetCount);
    const niceMax = Math.ceil(xMaxSeconds / step) * step;
    const ticks = [];
    for (let v = 0; v <= niceMax + step * 1e-9; v += step) ticks.push(v);
    return { step, max: niceMax, ticks };
  }

  function fmtTick(v, step) {
    if (v === 0) return '0';
    if (step >= 1) return v.toFixed(0);
    if (step >= 0.1) return v.toFixed(1);
    return v.toFixed(2);
  }

  function fmtMmSs(seconds) {
    const total = Math.max(0, Math.round(seconds));
    const m = Math.floor(total / 60);
    const s = total - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ---- Canvas setup --------------------------------------------------

  // Resize a canvas's backing buffer to its CSS size × dpr, returning the 2d
  // context plotted in CSS-pixel coordinates. Each chart calls this first.
  // Fixes:
  //   1. Round CSS dims to integers so width × dpr lands on integer device px.
  //   2. Don't depend on the deprecated `height` HTML attribute — CSS height is
  //      the source of truth.
  //   3. Refuse to render when the canvas isn't laid out yet (parent is
  //      display:none, so clientWidth/clientHeight are 0). The previous fallback
  //      to `canvas.width || 600` / `canvas.height || 200` produced a 300×150
  //      buffer (the HTML canvas spec defaults), which the browser then
  //      stretched to fill the real CSS rect when the tab was finally shown —
  //      showing as huge, low-res, overlapping text. Caller must early-return
  //      on null.
  function setupCanvas(canvas) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = Math.round(canvas.clientWidth || 0);
    const cssH = Math.round(canvas.clientHeight || 0);
    if (cssW === 0 || cssH === 0) return null;
    const bw = Math.round(cssW * dpr);
    const bh = Math.round(cssH * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // imageSmoothingEnabled left at the default. Setting it to false here
    // (previous polish pass) caused near-vertical line segments — produced
    // when the gold mass curve drops sharply on a buy — to rasterize as
    // solid vertical columns spanning the full mass-drop height, reading
    // as catastrophic "vertical line" artifacts on the chart.
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.clearRect(0, 0, cssW, cssH);
    return { ctx, w: cssW, h: cssH, dpr };
  }

  // Common axis math: pad → plot rect.
  function plotRect(w, h, padL, padR, padT, padB) {
    return { x: padL, y: padT, w: w - padL - padR, h: h - padT - padB };
  }

  // Draws the L-shaped axis frame and the corner-placed axis labels (uppercase,
  // outside the data area).
  function drawAxes(ctx, rect, p, opts) {
    // 1px strokes — align to integer + 0.5 so they hit one device px row.
    const x0 = Math.round(rect.x) + 0.5;
    const y0 = Math.round(rect.y) + 0.5;
    const x1 = Math.round(rect.x + rect.w) + 0.5;
    const y1 = Math.round(rect.y + rect.h) + 0.5;

    ctx.strokeStyle = p.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // X axis
    ctx.moveTo(x0, y1);
    ctx.lineTo(x1, y1);
    // Y axis
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.stroke();

    if (opts && opts.yLabel) {
      ctx.save();
      ctx.fillStyle = p.fgFaint;
      ctx.font = FONT_LABEL;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      // Top-left, in the top gutter, above the Y axis.
      ctx.fillText(opts.yLabel.toUpperCase(), rect.x - 4, rect.y - 14);
      ctx.restore();
    }
    if (opts && opts.xLabel) {
      ctx.save();
      ctx.fillStyle = p.fgFaint;
      ctx.font = FONT_LABEL;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      // Bottom-right, in the bottom margin, below the tick row.
      ctx.fillText(opts.xLabel.toUpperCase(), rect.x + rect.w, rect.y + rect.h + 28);
      ctx.restore();
    }
  }

  // Draws the Y tick labels + faint horizontal gridlines on integer + 0.5 rows.
  function drawYTicks(ctx, rect, p, yScale) {
    ctx.font = FONT_TICK;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const v of yScale.ticks) {
      const y = Math.round(rect.y + rect.h - (v / yScale.max) * rect.h);
      ctx.fillStyle = p.fgFaint;
      ctx.fillText(fmtTick(v, yScale.step), rect.x - 6, y);
      ctx.strokeStyle = p.bg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(rect.x) + 0.5, y + 0.5);
      ctx.lineTo(Math.round(rect.x + rect.w) + 0.5, y + 0.5);
      ctx.stroke();
    }
  }

  // Draws the X tick labels for a time axis.
  function drawXTimeTicks(ctx, rect, p, xScale) {
    ctx.font = FONT_TICK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = p.fgFaint;
    for (const t of xScale.ticks) {
      const x = rect.x + (t / xScale.max) * rect.w;
      ctx.fillText(fmtMmSs(t), Math.round(x), rect.y + rect.h + 14);
    }
  }

  // Legend with optional alignment. Pre-measures total width so right-align
  // can place items at x as the right edge.
  function drawLegend(ctx, p, items, x, y, opts) {
    if (!items || items.length === 0) return;
    ctx.font = FONT_LEGEND;
    ctx.textBaseline = 'alphabetic';
    const align = (opts && opts.align) || 'left';
    const swatch = 8, gap = 6, item = 14;

    const widths = items.map(it => swatch + gap + Math.ceil(ctx.measureText(it.label).width));
    const total = widths.reduce((a, b) => a + b + item, -item);

    let cx = align === 'right' ? x - total : x;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      ctx.fillStyle = it.color;
      ctx.fillRect(Math.round(cx), Math.round(y - 7), swatch, swatch);
      ctx.fillStyle = it.dim ? p.fgFaint : p.fgDim;
      ctx.textAlign = 'left';
      ctx.fillText(it.label, cx + swatch + gap, y);
      cx += widths[i] + item;
    }
  }

  // Centered "no data" placeholder for empty plot states.
  function drawEmpty(ctx, rect, p) {
    ctx.save();
    ctx.fillStyle = p.fgFaint;
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('no data', rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
  }

  // ---- Mass over time (line, two series) -------------------------------
  // data: { series: [{ name, color, points: [{x, y}] }], xMax, yMax,
  //         xLabel?, yLabel? }
  // Despite the name this is a generic single/multi-series line chart over a
  // time axis. Default axis labels are Mass/Time; pass yLabel / xLabel to
  // repurpose for other quantities (e.g. CPM, MPS).
  function massOverTime(canvas, data) {
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, w, h } = setup;
    const p = palette();
    const rect = plotRect(w, h, PAD.L, PAD.R, PAD.T, PAD.B);
    const yLabel = (data && data.yLabel) ? data.yLabel : 'Mass';
    const xLabel = (data && data.xLabel) ? data.xLabel : 'Time';
    drawAxes(ctx, rect, p, { yLabel, xLabel });

    const series = data.series || [];
    if (series.length === 0) {
      drawEmpty(ctx, rect, p);
      return;
    }

    const rawY = data.yMax || 1;
    const rawX = data.xMax || 1;
    const yScale = niceScale(rawY);
    const xScale = timeTicks(rawX);

    drawYTicks(ctx, rect, p, yScale);
    drawXTimeTicks(ctx, rect, p, xScale);

    // Series lines. Draw order, back-to-front:
    //   1. main Completion (gold)
    //   2. Cmp Completion (muted green)  — comparison Threshold and Completion
    //                                       runs share a trajectory until the
    //                                       comparison threshold-hit; lavender
    //                                       must paint AFTER green so it stays
    //                                       visible during that shared portion
    //   3. main Threshold (cyan)         — end-marker zone wants a clean line
    //   4. Cmp Threshold (lavender)      — drawn LAST so it isn't occluded by
    //                                       Cmp Completion along the shared
    //                                       early trajectory
    // The Threshold end-marker is drawn after all series in a separate block
    // below, so it stays visible regardless of this order.
    const orderName = (s) => {
      if (s.name === 'Completion') return 0;
      if (s.name === 'Cmp · Completion') return 1;
      if (s.name === 'Threshold') return 2;
      if (s.name === 'Cmp · Threshold') return 3;
      return 0;
    };
    const ordered = series.slice().sort((a, b) => orderName(a) - orderName(b));
    for (const ser of ordered) {
      if (!ser.points || ser.points.length < 2) continue;
      ctx.strokeStyle = ser.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < ser.points.length; i++) {
        const pt = ser.points[i];
        const x = rect.x + (pt.x / xScale.max) * rect.w;
        const y = rect.y + rect.h - (pt.y / yScale.max) * rect.h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // End-marker on Threshold series at last point — vertical hash + dot + label.
    const thr = series.find(s => s.name === 'Threshold');
    if (thr && thr.points && thr.points.length) {
      const last = thr.points[thr.points.length - 1];
      const ex = Math.round(rect.x + (last.x / xScale.max) * rect.w) + 0.5;
      const ey = Math.round(rect.y + rect.h - (last.y / yScale.max) * rect.h);
      ctx.strokeStyle = p.cool;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex, ey - 6);
      ctx.lineTo(ex, ey + 6);
      ctx.stroke();
      ctx.fillStyle = p.cool;
      ctx.beginPath();
      ctx.arc(ex - 0.5, ey, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.cool;
      ctx.font = FONT_LABEL;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('threshold reached', ex - 0.5, ey - 10);
    }

    // Legend — top-right gutter.
    const items = series.map(s => ({ label: s.name, color: s.color }));
    drawLegend(ctx, p, items, rect.x + rect.w, rect.y - 14, { align: 'right' });
  }

  // ---- Consolidation progress (time-series line) ----------------------
  // data: {
  //   series: [{ name, color, points: [{x, y_0..1}] }],
  //   xMax,
  //   hits: [{ x, color, label }],
  //   separators: [{ x, label }] — optional vertical dashed lines for tier
  //                                transitions; label rendered at the top of
  //                                the plot area (e.g. "T2"). x is in seconds.
  // }
  function consolidationLine(canvas, data) {
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, w, h } = setup;
    const p = palette();
    // Slightly looser top padding (was 18) so the "1.0" Y-tick label sits
    // clear of the CONSOLIDATION title above it. With PAD_C.T = 18 the title's
    // descender row collided with the tick label's middle baseline, reading
    // as a single smudged line on the screenshot.
    const PAD_C = { L: 48, R: 16, T: 24, B: 28 };
    const rect = plotRect(w, h, PAD_C.L, PAD_C.R, PAD_C.T, PAD_C.B);

    // Title above plot — matches .sim-strip-title style. Pinned to the top of
    // the gutter so it doesn't crowd the top Y-tick. Player-facing label
    // and helper name aligned by the 2026-05-13 consolidation rename pass.
    ctx.save();
    ctx.fillStyle = p.fgFaint;
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('CONSOLIDATION', rect.x - 4, rect.y - 12);
    ctx.restore();

    // Frame.
    const x0 = Math.round(rect.x) + 0.5;
    const y0 = Math.round(rect.y) + 0.5;
    const x1 = Math.round(rect.x + rect.w) + 0.5;
    const y1 = Math.round(rect.y + rect.h) + 0.5;
    ctx.strokeStyle = p.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y1);
    ctx.lineTo(x1, y1);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.stroke();

    const series = data.series || [];
    const xRaw = data.xMax || 1;
    const xScale = timeTicks(xRaw);

    // Y axis fixed at 0..1 with ticks 0 / 0.5 / 1.0.
    const yScale = { min: 0, max: 1, step: 0.5, ticks: [0, 0.5, 1.0] };
    drawYTicks(ctx, rect, p, yScale);
    drawXTimeTicks(ctx, rect, p, xScale);

    // Gate dashed line at y = 1.0. The "1.0" Y-tick already names the level;
    // a separate "gate (1.00)" label was previously stacked under the threshold-
    // hit label, reading as overlapping illegibly. Drop it — the dashed line
    // plus the Y-tick carry the meaning.
    const gateY = Math.round(rect.y) + 0.5;
    ctx.save();
    ctx.strokeStyle = p.cool;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(Math.round(rect.x) + 0.5, gateY);
    ctx.lineTo(Math.round(rect.x + rect.w) + 0.5, gateY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (series.length === 0) {
      drawEmpty(ctx, rect, p);
      return;
    }

    // Series — Completion behind, Threshold front.
    const orderName = (s) => s.name === 'Threshold' ? 1 : 0;
    const ordered = series.slice().sort((a, b) => orderName(a) - orderName(b));
    for (const ser of ordered) {
      if (!ser.points || ser.points.length < 2) continue;
      ctx.strokeStyle = ser.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < ser.points.length; i++) {
        const pt = ser.points[i];
        const x = rect.x + (pt.x / xScale.max) * rect.w;
        const y = rect.y + rect.h - (Math.max(0, Math.min(1, pt.y)) / yScale.max) * rect.h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Tier separators — drawn first so hit hashes paint over them where the
    // two coincide. Each separator is a vertical dashed line + a tier badge
    // at the top of the plot. Labels are rendered as "T<n>" centered over
    // the segment that STARTS at the separator (or, when label is provided
    // explicitly, that text). Multi-tier playtest reports use these to make
    // tier boundaries visually obvious.
    const separators = data.separators || [];
    for (const sep of separators) {
      const sx = Math.round(rect.x + (sep.x / xScale.max) * rect.w) + 0.5;
      ctx.strokeStyle = p.fgFaint;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(sx, rect.y);
      ctx.lineTo(sx, rect.y + rect.h);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Tier badges: a small label centered at the top of each segment. Reads
    // the tierSegments via data.tierBadges if provided. Each badge is
    // { startX, endX, label }.
    const badges = data.tierBadges || [];
    for (const b of badges) {
      const x0 = rect.x + (b.startX / xScale.max) * rect.w;
      const x1 = rect.x + ((b.endX != null ? b.endX : xScale.max) / xScale.max) * rect.w;
      const cx = (x0 + x1) / 2;
      ctx.fillStyle = p.fgDim;
      ctx.font = FONT_LABEL;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(b.label, cx, rect.y - 2);
    }

    // Hits — vertical hash from the X axis up to y=1, plus top label.
    const hits = data.hits || [];
    for (const hit of hits) {
      const hx = Math.round(rect.x + (hit.x / xScale.max) * rect.w) + 0.5;
      ctx.strokeStyle = hit.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hx, rect.y + rect.h);
      ctx.lineTo(hx, rect.y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (hit.label) {
        ctx.fillStyle = hit.color;
        ctx.font = FONT_LABEL;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const labelX = Math.min(hx + 4, rect.x + rect.w - ctx.measureText(hit.label).width);
        ctx.fillText(hit.label, labelX, rect.y + 8);
      }
    }
  }

  // ---- Per-upgrade levels stacked (stacked area over time) ------------
  // data: { times: [s,...], series: [{ name, color, levels: [n,...] }],
  //          xMax, yMax, legend? (default true) }
  function levelsStacked(canvas, data) {
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, w, h } = setup;
    const p = palette();
    const rect = plotRect(w, h, PAD.L, PAD.R, PAD.T, PAD.B);
    drawAxes(ctx, rect, p, { yLabel: 'Levels', xLabel: 'Time' });

    const times = data.times || [];
    const series = data.series || [];

    if (times.length === 0 || series.length === 0) {
      drawEmpty(ctx, rect, p);
      return;
    }

    const rawY = data.yMax || 1;
    const rawX = data.xMax || 1;
    const yScale = niceScale(rawY);
    const xScale = timeTicks(rawX);

    drawYTicks(ctx, rect, p, yScale);
    drawXTimeTicks(ctx, rect, p, xScale);

    // Stacked area: render each band as a polygon (top edge = base + value;
    // bottom edge = base, traversed in reverse).
    const N = times.length;
    const cum = new Array(N).fill(0);

    for (const ser of series) {
      const lvls = ser.levels || [];
      // Build top points (cum + lvl) and the base for the next band.
      ctx.fillStyle = ser.color;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < N; i++) {
        const top = (cum[i] || 0) + (lvls[i] || 0);
        const x = rect.x + (times[i] / xScale.max) * rect.w;
        const y = rect.y + rect.h - (top / yScale.max) * rect.h;
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      // Back along the base.
      for (let i = N - 1; i >= 0; i--) {
        const x = rect.x + (times[i] / xScale.max) * rect.w;
        const y = rect.y + rect.h - ((cum[i] || 0) / yScale.max) * rect.h;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Update cumulative.
      for (let i = 0; i < N; i++) cum[i] = (cum[i] || 0) + (lvls[i] || 0);
    }

    // In-canvas legend suppressed when caller asked for HTML legend.
    if (data.legend !== false) {
      const items = series.map(s => ({ label: s.name, color: s.color }));
      drawLegend(ctx, p, items, rect.x + rect.w, rect.y - 14, { align: 'right' });
    }
  }

  // ---- Income breakdown stacked area -----------------------------------
  // data: { times: [s,...], click: [v,...], passive: [v,...], auto: [v,...],
  //          xMax, yMax, includeAuto? }
  function incomeStacked(canvas, data) {
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, w, h } = setup;
    const p = palette();
    const rect = plotRect(w, h, PAD.L, PAD.R, PAD.T, PAD.B);
    drawAxes(ctx, rect, p, { yLabel: 'Income/s', xLabel: 'Time' });

    const times = data.times || [];
    if (times.length < 2) {
      drawEmpty(ctx, rect, p);
      return;
    }

    const rawY = data.yMax || 0.5;
    const rawX = data.xMax || 1;
    const yScale = niceScale(rawY);
    const xScale = timeTicks(rawX);

    drawYTicks(ctx, rect, p, yScale);
    drawXTimeTicks(ctx, rect, p, xScale);

    const clickColor = p.accent;
    const passiveColor = p.cool;
    const autoColor = p.fgDim;

    function drawBand(values, baseValues, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < times.length; i++) {
        const x = rect.x + (times[i] / xScale.max) * rect.w;
        const top = (baseValues[i] || 0) + (values[i] || 0);
        const y = rect.y + rect.h - (top / yScale.max) * rect.h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      for (let i = times.length - 1; i >= 0; i--) {
        const x = rect.x + (times[i] / xScale.max) * rect.w;
        const base = baseValues[i] || 0;
        const y = rect.y + rect.h - (base / yScale.max) * rect.h;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }

    const click = data.click || [];
    const passive = data.passive || [];
    const auto = data.auto || [];
    const baseZero = times.map(() => 0);
    const baseClick = click.slice();
    const baseClickPassive = click.map((c, i) => c + (passive[i] || 0));

    drawBand(click, baseZero, clickColor);
    drawBand(passive, baseClick, passiveColor);
    drawBand(auto, baseClickPassive, autoColor);

    // Filter zero-only series out of the legend.
    const items = [
      { label: 'click', color: clickColor },
      { label: 'passive', color: passiveColor },
    ];
    const autoMax = auto.reduce((a, b) => Math.max(a, b || 0), 0);
    const includeAuto = data.includeAuto != null ? data.includeAuto : (autoMax > 0);
    if (includeAuto) items.push({ label: 'auto', color: autoColor });

    drawLegend(ctx, p, items, rect.x + rect.w, rect.y - 14, { align: 'right' });
  }

  global.DF.ui.charts = {
    palette,
    massOverTime,
    consolidationLine,
    levelsStacked,
    incomeStacked,
    // Exposed for tests / future callers.
    niceScale,
    niceTimeStep,
    timeTicks,
    fmtTick,
  };
})(typeof window !== 'undefined' ? window : globalThis);
