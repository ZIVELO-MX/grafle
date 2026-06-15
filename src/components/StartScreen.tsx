import type { Difficulty } from '../types'

interface Props {
  puzzleNumber: number
  difficulty: Difficulty
  onStart: () => void
  isPast?: boolean
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'text-emerald-600',
  medium: 'text-amber-600',
  hard: 'text-rose-600',
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export default function StartScreen({ puzzleNumber, difficulty, onStart, isPast = false }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 font-medium">
          {isPast ? 'Past Puzzle' : 'Daily Puzzle'}
        </p>
        <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">
          #{puzzleNumber}
        </p>
        <span className={`text-xs uppercase tracking-widest font-semibold ${difficultyColors[difficulty]}`}>
          {difficultyLabels[difficulty]}
        </span>
      </div>

      {/* Lives preview — only for today's puzzle */}
      {!isPast && (
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className="text-xl text-rose-500 select-none">♥</span>
          ))}
        </div>
      )}

      <button
        onClick={onStart}
        className="px-10 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold tracking-wide text-sm hover:bg-slate-700 dark:hover:bg-white active:scale-95 transition-all duration-200 shadow-sm"
      >
        {isPast ? 'View' : 'Start'}
      </button>
    </div>
  )
}
