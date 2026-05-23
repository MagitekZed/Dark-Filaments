// dev/OwnedUpgrades.tsx — owned upgrades by tier (scene-relevant state at a glance).
//
// While building/testing a tier's scene, the dev needs to see what's actually
// owned — which stackables (and at what level) and which named one-shots — since
// that is exactly what the scene reads to mount structures and scale density.
// One-shots (maxLevels 1) show as a bare name; stackables show ×level. Grouped
// by tier; only tiers with something owned appear. Dev-only.

import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import { selectLevels } from '../store/selectors';
import { UPGRADES, TIERS } from '../engine';
import { section, sectionTitle, note } from './devStyles';

export function OwnedUpgrades() {
  const levels = useStore(useShallow(selectLevels));

  // Group owned upgrades by tier, preserving the authored UPGRADES order.
  const byTier = new Map<number, string[]>();
  for (const u of UPGRADES) {
    const lvl = levels[u.name] ?? 0;
    if (lvl <= 0) continue;
    const label = u.maxLevels === 1 ? u.name : `${u.name} ×${lvl}`;
    const list = byTier.get(u.tier) ?? [];
    list.push(label);
    byTier.set(u.tier, list);
  }
  const tiers = [...byTier.keys()].sort((a, b) => a - b);

  return (
    <div style={section}>
      <p style={sectionTitle}>Owned upgrades</p>
      {tiers.length === 0 ? (
        <p style={note}>nothing owned yet</p>
      ) : (
        tiers.map((t) => (
          <p key={t} style={{ margin: '0 0 0.25rem', fontSize: 11, lineHeight: 1.4 }}>
            <span style={{ color: '#789' }}>T{t}</span>{' '}
            <span style={{ color: '#5c6b80' }}>{TIERS[t]?.name}</span>
            <br />
            <span style={{ color: '#cde' }}>{byTier.get(t)!.join(', ')}</span>
          </p>
        ))
      )}
    </div>
  );
}
