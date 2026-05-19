// Dark Filaments — tiny pub/sub store
// Shape mirrors Zustand's vanilla contract so the future React port is a literal swap:
//   const store = DF.sim.createStore(initialState);
//   store.getState();
//   store.setState(updater | partial);
//   const unsubscribe = store.subscribe(fn);
//
// Not used by the T1 prototype's existing tick loop in Phase 1 — present so Phase 2
// (UI extraction) and beyond can adopt it incrementally.
//
// Loaded as a plain <script> from file://. Pattern: IIFE attaches to window.DF.sim.
// UMD-style module.exports shim at the bottom for Node test harness use (Phase 3+).

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.sim = global.DF.sim || {};

  // createStore(initialState)
  // Zustand-compatible: setState accepts an updater fn or a partial object;
  // partial objects are shallow-merged.
  function createStore(initialState) {
    let state = initialState;
    const listeners = new Set();

    function getState() {
      return state;
    }

    function setState(updater) {
      const next = (typeof updater === 'function')
        ? updater(state)
        : updater;
      if (next === state || next == null) return;
      // Shallow-merge if updater returned a partial (the Zustand convention).
      // If it returned the same reference, no-op above.
      state = (typeof next === 'object' && !Array.isArray(next))
        ? Object.assign({}, state, next)
        : next;
      listeners.forEach(fn => fn(state));
    }

    function subscribe(fn) {
      listeners.add(fn);
      return function unsubscribe() {
        listeners.delete(fn);
      };
    }

    return { getState, setState, subscribe };
  }

  // Deep clone for the params + upgrades snapshot. The shared store uses this
  // so resets and per-store snapshots cannot mutate DEFAULT_PARAMS / UPGRADES.
  // Sufficient for the value shapes here (numbers, strings, plain objects, arrays).
  function clone(value) {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(clone);
    const out = {};
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) out[k] = clone(value[k]);
    }
    return out;
  }

  // Shared params store singleton. Holds { params, upgrades } cloned from
  // DF.sim.data's defaults. Both the Simulator-tab quick-strip and the
  // Parameters-tab full editor subscribe to this — edits in either place
  // propagate to the other and trigger a re-run.
  //
  // Lazy-created so Node test harnesses that don't need the singleton can
  // continue to work without instantiating it.
  let _paramsStore = null;
  function getParamsStore() {
    if (_paramsStore) return _paramsStore;
    const data = global.DF && global.DF.sim && global.DF.sim.data;
    if (!data) {
      throw new Error("DF.sim.data must load before DF.sim.getParamsStore() is called.");
    }
    _paramsStore = createStore({
      params: clone(data.DEFAULT_PARAMS),
      upgrades: clone(data.UPGRADES),
    });
    return _paramsStore;
  }

  function resetParamsStore() {
    const data = global.DF && global.DF.sim && global.DF.sim.data;
    if (!data) return;
    const store = getParamsStore();
    store.setState({
      params: clone(data.DEFAULT_PARAMS),
      upgrades: clone(data.UPGRADES),
    });
  }

  global.DF.sim.createStore = createStore;
  global.DF.sim.getParamsStore = getParamsStore;
  global.DF.sim.resetParamsStore = resetParamsStore;
  global.DF.sim._cloneForStore = clone;
})(typeof window !== 'undefined' ? window : globalThis);

// UMD shim — for Node test harness use (Phase 3+). Harmless in browser.
if (typeof module !== 'undefined' && module.exports) {
  const ns = (typeof window !== 'undefined' ? window : globalThis).DF.sim;
  module.exports = {
    createStore: ns.createStore,
    getParamsStore: ns.getParamsStore,
    resetParamsStore: ns.resetParamsStore,
  };
}
