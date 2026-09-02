import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

/**
 * Blocking confirmation for destructive admin actions. Deletes are
 * irreversible in the mock backend as they would be against Flask, so
 * nothing is removed without an explicit second step.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <div className="text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(var(--c-danger)/0.13)] text-danger">
          <AlertTriangle className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <h2 className="mt-4 text-[16px] font-semibold text-ink">{title}</h2>
        {description && (
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{description}</p>
        )}
      </div>

      <div className="mt-6 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
