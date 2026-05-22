// ui/MassReadout.tsx — top-left mass counter + stats line (scaffold §3 G5).
//
// The mass counter (large serif) and the global stats line (MPS · MPC · AC/s)
// read live engine state via selectors. The stats line is the GLOBAL readout,
// not an upgrade card — the prose-first four-field rule binds only the upgrade
// cards, so the stats line is allowed here. AC/s is shown only when > 0 (T1 has
// no autoclickers). No second person, no editorializing — clinical register.
//
// Object-returning selector (selectRates) is consumed via useShallow per the
// Zustand v5 getSnapshot-loop guard in selectors.ts.

import { useStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { selectMass, selectRates } from '../store/selectors';
import { fmtMass, fmtRate, fmtAps } from './format';

export function MassReadout() {
  const mass = useStore(selectMass);
  const rates = useStore(useShallow(selectRates));

  return (
    <>
      <div className="dfui-mass">
        <div className="dfui-mass-scrim" />
        <div className="dfui-mass-text">{fmtMass(mass)}</div>
      </div>

      <div className="dfui-stats">
        <span>{fmtRate(rates.mps, '/s')}</span>
        <span className="dfui-sep">·</span>
        <span>{fmtRate(rates.mpc, '/tap')}</span>
        {rates.aps > 0 && (
          <>
            <span className="dfui-sep">·</span>
            <span>{fmtAps(rates.aps)} AC/s</span>
          </>
        )}
      </div>
    </>
  );
}
