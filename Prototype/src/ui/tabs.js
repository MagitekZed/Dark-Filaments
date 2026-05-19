// Dark Filaments — tab-switching glue
// Drives the three-tab shell (Parameters / Simulator / Playtest) added in Phase 2
// of the JS sim migration. Visual chrome only — no game state.
//
// Tab buttons carry data-tab="<id>" and panels carry data-tab-panel="<id>".
// init({ defaultTab: "playtest" }) wires click handlers and shows the default.
//
// Loaded as a plain <script> from file://. Pattern: IIFE attaches to window.DF.ui.tabs.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.ui = global.DF.ui || {};

  // Per-tab callback registry. Listeners fire after a tab becomes visible —
  // used by the simulator tab to defer chart rendering until its canvases
  // have a real laid-out size (clientWidth/clientHeight return 0 while the
  // panel is hidden via display: none, which produces stretched, low-res
  // charts if rendering happens at init).
  const onShowCallbacks = {};

  function onShow(tabId, fn) {
    if (typeof fn !== 'function') return;
    if (!onShowCallbacks[tabId]) onShowCallbacks[tabId] = [];
    onShowCallbacks[tabId].push(fn);
  }

  function setActive(tabId) {
    const buttons = document.querySelectorAll('[data-tab]');
    const panels  = document.querySelectorAll('[data-tab-panel]');
    buttons.forEach(b => {
      const on = b.getAttribute('data-tab') === tabId;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach(p => {
      const on = p.getAttribute('data-tab-panel') === tabId;
      p.classList.toggle('hidden', !on);
    });
    const cbs = onShowCallbacks[tabId];
    if (cbs && cbs.length) {
      for (const fn of cbs) {
        try { fn(); }
        catch (e) { console.error('tab onShow callback for "' + tabId + '" threw:', e); }
      }
    }
  }

  function init(opts) {
    const defaultTab = (opts && opts.defaultTab) || 'playtest';
    const buttons = document.querySelectorAll('[data-tab]');
    buttons.forEach(b => {
      b.addEventListener('click', () => setActive(b.getAttribute('data-tab')));
    });
    setActive(defaultTab);
  }

  global.DF.ui.tabs = { init, setActive, onShow };
})(typeof window !== 'undefined' ? window : globalThis);
