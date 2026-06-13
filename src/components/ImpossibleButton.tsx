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
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-slate-900 text-white hover:bg-slate-700 active:scale-95 shadow-sm',
        ].join(' ')}
      >
        {t.impossible}
      </button>
      {(status === 'playing' || status === 'idle') && (
        <button
          onClick={onRestart}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
        >
          {t.restart}
        </button>
      )}
    </div>
  )
}
