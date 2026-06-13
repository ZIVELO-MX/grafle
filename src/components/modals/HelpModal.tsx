import Modal from './Modal'
import { useT } from '../../i18n'

interface Props {
  open: boolean
  onClose: () => void
}

export default function HelpModal({ open, onClose }: Props) {
  const t = useT()
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">{t.how_to_play}</h2>
        <ol className="space-y-3 mb-6">
          {[t.help_1, t.help_2, t.help_3, t.help_4].map((step, i) => (
            <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300">
              <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-700 dark:hover:bg-white transition-colors active:scale-95"
        >
          {t.got_it}
        </button>
      </div>
    </Modal>
  )
}
