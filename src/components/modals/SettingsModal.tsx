import Modal from './Modal'
import { useT } from '../../i18n'
import type { Settings } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  settings: Settings
  onSave: (s: Settings) => void
}

export default function SettingsModal({ open, onClose, settings, onSave }: Props) {
  const t = useT()
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">{t.settings}</h2>
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            {t.language}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['en', 'es'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => onSave({ ...settings, language: lang })}
                className={[
                  'py-3 rounded-xl text-sm font-semibold transition-all border-2',
                  settings.language === lang
                    ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400',
                ].join(' ')}
              >
                {lang === 'en' ? t.english : t.spanish}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          {t.close}
        </button>
      </div>
    </Modal>
  )
}
