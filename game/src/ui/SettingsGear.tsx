// ui/SettingsGear.tsx — top-right gear glyph + a modal stub (scaffold §3 G5).
//
// The gear opens a Settings modal STUB (§11 out-of-scope: Settings page
// functionality is later). The modal carries no functional controls in v0.1 —
// just a clinical placeholder line. Reuses the titleui-modal styles. Opening /
// closing is driven through the uiSlice (activeModal: 'settings' | null) so the
// title screen and in-game chrome share one modal-open state.
//
// Clinical register everywhere: no "you", no editorializing, no exclamation.

import { useEffect } from 'react';
import { useStore } from '../store';

export function SettingsGear() {
  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const open = activeModal === 'settings';

  // Escape closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setActiveModal]);

  return (
    <>
      <button
        type="button"
        className="dfui-settings"
        data-ui
        aria-label="settings"
        title="settings"
        onClick={() => setActiveModal('settings')}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 14.6a7.7 7.7 0 0 0 .07-1.2 7.7 7.7 0 0 0-.07-1.2l2.0-1.55a.5.5 0 0 0 .12-.62l-1.9-3.28a.5.5 0 0 0-.6-.22l-2.36.95a7.4 7.4 0 0 0-2.07-1.2l-.36-2.5a.5.5 0 0 0-.5-.43h-3.78a.5.5 0 0 0-.5.43l-.36 2.5a7.4 7.4 0 0 0-2.07 1.2l-2.36-.95a.5.5 0 0 0-.6.22l-1.9 3.28a.5.5 0 0 0 .12.62l2.0 1.55a7.7 7.7 0 0 0-.07 1.2 7.7 7.7 0 0 0 .07 1.2l-2.0 1.55a.5.5 0 0 0-.12.62l1.9 3.28a.5.5 0 0 0 .6.22l2.36-.95a7.4 7.4 0 0 0 2.07 1.2l.36 2.5a.5.5 0 0 0 .5.43h3.78a.5.5 0 0 0 .5-.43l.36-2.5a7.4 7.4 0 0 0 2.07-1.2l2.36.95a.5.5 0 0 0 .6-.22l1.9-3.28a.5.5 0 0 0-.12-.62z" />
        </svg>
      </button>

      {open && (
        <div
          className="titleui-modal-backdrop"
          role="presentation"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="titleui-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dfui-settings-heading"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dfui-settings-heading" className="titleui-modal-heading">
              Settings
            </h2>
            <p className="titleui-modal-body">Not yet implemented.</p>
            <div className="titleui-modal-actions">
              <button
                type="button"
                className="titleui-modal-cancel"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
