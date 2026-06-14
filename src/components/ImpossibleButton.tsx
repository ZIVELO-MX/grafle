import { useT } from '../i18n'
import type { GameStatus } from '../types'

interface Props {
  status: GameStatus
  onImpossible: () => void
  onRestart: () => void
}

export default function ImpossibleButton({ status, onImpossible, onRestart }: Props) {
  const t = useT()
  const done = status === 'won' || status === 'impossible-correct'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onImpossible}
        disabled={done}
        className={[
          'px-8 py-3 rounded-2xl font-semibold tracking-wide text-sm transition-all duration-200',
          done
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white active:scale-95 shadow-sm',
        ].join(' ')}
      >
        {t.impossible}
      </button>
      <button
        onClick={!done ? onRestart : undefined}
        disabled={done}
        className={[
          'text-xs transition-colors underline underline-offset-2',
          done
            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
        ].join(' ')}
      >
        {t.restart}
      </button>
    </div>
  )
}
