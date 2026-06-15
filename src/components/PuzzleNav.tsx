import { useT } from '../i18n'
import { getMinPuzzleNumber, getMaxPuzzleNumber } from '../lib/puzzleProvider'

interface Props {
  puzzleNumber: number
  onPrev: () => void
  onNext: () => void
}

export default function PuzzleNav({ puzzleNumber, onPrev, onNext }: Props) {
  const t = useT()
  const max = getMaxPuzzleNumber()
  const min = getMinPuzzleNumber()

  return (
    <div className="flex items-center justify-center gap-4 py-2 text-sm text-slate-600 dark:text-slate-400">
      <NavButton onClick={onPrev} disabled={puzzleNumber <= min} label="Previous puzzle">
        &#8592;
      </NavButton>
      <span className="font-medium tracking-wide select-none">
        {t.daily_puzzle} #{puzzleNumber}
      </span>
      <NavButton onClick={onNext} disabled={puzzleNumber >= max} label="Next puzzle">
        &#8594;
      </NavButton>
    </div>
  )
}

function NavButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
    >
      {children}
    </button>
  )
}
