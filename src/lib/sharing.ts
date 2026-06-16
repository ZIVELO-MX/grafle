import { formatTime } from './scoring'
import type { Translations } from '../i18n'

function scoreSymbols(score: number, maxScore: number): string {
  const ratio = score / maxScore
  const filled = Math.round(ratio * 4)
  return '■'.repeat(filled) + '□'.repeat(4 - filled)
}

export function generateShareText(
  puzzleNumber: number,
  score: number,
  elapsedSeconds: number,
  difficulty: 'easy' | 'medium' | 'hard',
  t: Pick<Translations, 'time_label' | 'score_label'>
): string {
  const maxScores = { easy: 1000, medium: 2000, hard: 3000 }
  const symbols = scoreSymbols(score, maxScores[difficulty])
  const time = formatTime(elapsedSeconds)
  const appUrl = window.location.origin
  return `Grafle #${puzzleNumber}\n\n${symbols}\n${t.time_label} ${time}\n${t.score_label} ${score}\n\n${appUrl}`
}
