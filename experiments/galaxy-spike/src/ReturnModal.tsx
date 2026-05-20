import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Return modal — save-code restore (stubbed) ─────────────────────
//
// Triggered by the Return button on the title screen. The codec itself
// (engineering plan E2 — token codec) is not built; this modal is a
// UX placeholder. Clicking Restore with any non-empty input shows a
// clinical "Decoder not yet implemented." line below the textarea.
//
// Dismissal: Cancel button, backdrop tap, Escape key. Focus is trapped
// inside the modal while open; Tab cycles within. First focusable on
// open is the textarea.

export interface ReturnModalProps {
  open: boolean
  onClose: () => void
}

export function ReturnModal({ open, onClose }: ReturnModalProps) {
  const [code, setCode] = useState('')
  const [showStub, setShowStub] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  // Reset stub message when modal closes.
  useEffect(() => {
    if (!open) {
      setShowStub(false)
      setCode('')
    }
  }, [open])

  // Focus the textarea when modal opens.
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => textareaRef.current?.focus(), 80)
      return () => window.clearTimeout(id)
    }
  }, [open])

  // Escape key dismissal.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Focus trap — keep Tab cycling inside the modal.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const root = modalRef.current
      if (!root) return
      const focusables = root.querySelectorAll<HTMLElement>(
        'textarea, button, [href], input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const onRestoreClick = useCallback(() => {
    if (code.trim().length === 0) return
    setShowStub(true)
  }, [code])

  if (!open) return null

  return (
    <div
      className="titleui-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="titleui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titleui-modal-heading"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="titleui-modal-heading" className="titleui-modal-heading">
          Restore from save code
        </h2>
        <textarea
          ref={textareaRef}
          className="titleui-modal-textarea"
          value={code}
          onChange={e => {
            setCode(e.target.value)
            if (showStub) setShowStub(false)
          }}
          rows={4}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Save code"
          placeholder=""
        />
        {showStub && (
          <div className="titleui-modal-stub" aria-live="polite">
            Decoder not yet implemented.
          </div>
        )}
        <div className="titleui-modal-actions">
          <button
            type="button"
            className="titleui-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="titleui-modal-restore"
            onClick={onRestoreClick}
            disabled={code.trim().length === 0}
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  )
}
