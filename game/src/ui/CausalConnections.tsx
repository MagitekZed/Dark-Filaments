// ui/CausalConnections.tsx — the unlabeled static hidden number (scaffold §3 G5).
//
// LOAD-BEARING (the hidden-number rule): the number is shown from minute one,
// UNLABELED, and STATIC through Act 1. The "Causal Connections" label fades in
// only at the first named-connection break (T7, Act 2) — which is OUT of v0.1
// scope. So in v0.1 this is just the unlabeled static number, rendered as a
// literal constant. The engine snapshot carries the placeholder value
// (8,419,302,776,043) and never moves it in Act 1; any earlier movement would
// undercut the reveal, so the worker holds it constant by design.
//
// We render the snapshot value formatted with thousands separators. There is no
// label, no tooltip, no aria text that names it — it accumulates perceptual
// weight precisely because nothing explains it.

import { useStore } from '../store';
import { selectCausalConnections } from '../store/selectors';

export function CausalConnections() {
  const value = useStore(selectCausalConnections);

  return (
    <div className="dfui-causal" aria-hidden>
      <div className="dfui-causal-scrim" />
      <div className="dfui-causal-text">{value.toLocaleString('en-US')}</div>
    </div>
  );
}
