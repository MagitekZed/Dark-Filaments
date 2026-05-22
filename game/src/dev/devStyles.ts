// dev/devStyles.ts — shared inline styles for the dev panel.
//
// Plain CSSProperties objects (no CSS file, no class names) so the whole dev
// surface is self-contained and tree-shakes cleanly. The dev panel is a
// developer instrument — exempt from the two-voice / prose-first chrome rules
// under the dev-tooling carve-out — so it is deliberately utilitarian.

import type { CSSProperties } from 'react';

export const section: CSSProperties = {
  borderTop: '1px solid #1d2839',
  padding: '0.7rem 0',
};

export const sectionTitle: CSSProperties = {
  color: '#8ab',
  fontSize: 12,
  fontWeight: 600,
  margin: '0 0 0.45rem',
  letterSpacing: 0.3,
};

export const btn: CSSProperties = {
  marginRight: '0.35rem',
  marginBottom: '0.35rem',
  padding: '0.32rem 0.55rem',
  background: '#1a2434',
  color: '#cde',
  border: '1px solid #2a3a52',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: 'inherit',
};

export const btnActive: CSSProperties = {
  ...btn,
  background: '#2c4068',
  borderColor: '#4a6aa0',
  color: '#dfeaff',
};

export const input: CSSProperties = {
  width: 86,
  padding: '0.28rem 0.4rem',
  background: '#0d1119',
  color: '#cde',
  border: '1px solid #2a3a52',
  borderRadius: 4,
  fontSize: 11,
  fontFamily: 'monospace',
};

export const select: CSSProperties = {
  ...input,
  width: 'auto',
  minWidth: 120,
};

export const label: CSSProperties = {
  color: '#789',
  fontSize: 11,
  marginRight: '0.4rem',
};

export const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.4rem',
  marginBottom: '0.4rem',
};

export const note: CSSProperties = {
  color: '#5c6b80',
  fontSize: 10,
  lineHeight: 1.4,
  margin: '0.2rem 0 0',
};
