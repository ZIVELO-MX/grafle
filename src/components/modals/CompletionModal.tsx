import { useState } from 'react'
import Modal from './Modal'
import { useT } from '../../i18n'
import { formatTime } from '../../lib/scoring'
import { generateShareText } from '../../lib/sharing'
import type { Puzzle } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  puzzle: Puzzle
  puzzleNumber: number
  score: number
  elapsedSeconds: number
  wasImpossible: boolean
}

export default function CompletionModal({
  open,
  onClose,
  puzzle,
  puzzleNumber,
  score,
  elapsedSeconds,
  wasImpossible,
}: Props) {
  const t = useT()
  const [copied, setCopied] = useState(false)

  const shareText = generateShareText(puzzleNumber, score, elapsedSeconds, puzzle.difficulty, t)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({ text: shareText })
    } catch {
      // user cancelled or share unavailable
    }
  }

  const difficultyLabel = t[puzzle.difficulty]
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 text-center">
        <div className="text-3xl mb-1">
          {wasImpossible ? '■■■■' : ''}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {wasImpossible ? t.puzzle_impossible : t.puzzle_solved}
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
          {difficultyLabel}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label={t.time_label} value={formatTime(elapsedSeconds)} />
          <StatCard label={t.score_label} value={score.toString()} />
        </div>

        <div className="space-y-3">
          <div className={`grid gap-3 ${canShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              onClick={handleCopy}
              className="py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95"
            >
              {copied ? t.copied : t.copy}
            </button>
            {canShare && (
              <button
                onClick={handleShare}
                className="py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-700 dark:hover:bg-white transition-colors active:scale-95"
              >
                {t.share}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700 rounded-xl py-3 px-2">
      <p className="text-xs text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}
