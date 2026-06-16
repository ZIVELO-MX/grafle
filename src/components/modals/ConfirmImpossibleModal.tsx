import Modal from './Modal'
import { useT } from '../../i18n'

interface Props {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmImpossibleModal({ open, onConfirm, onCancel }: Props) {
  const t = useT()
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="p-6 text-center">
        <p className="text-3xl mb-3">⚠️</p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t.impossible_confirm_title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {t.impossible_confirm_body}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl font-semibold text-sm transition-all"
          >
            {t.impossible_confirm_yes}
          </button>
          <button
            onClick={onCancel}
            className="py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition-colors"
          >
            {t.impossible_confirm_cancel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
