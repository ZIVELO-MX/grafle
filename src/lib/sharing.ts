import { formatTime } from './scoring'

function scoreSymbols(score: number, maxScore: number): string {
  const ratio = score / maxScore
  const filled = Math.round(ratio * 4)
  return '■'.repeat(filled) + '□'.repeat(4 - filled)
}

export function generateShareText(
  puzzleNumber: number,
  score: number,
  elapsedSeconds: number,
  difficulty: 'easy' | 'medium' | 'hard'
): string {
  const maxScores = { easy: 1000, medium: 2000, hard: 3000 }
  const symbols = scoreSymbols(score, maxScores[difficulty])
  const time = formatTime(elapsedSeconds)
  return `Grafle #${puzzleNumber}\n\n${symbols}\nTime ${time}\nScore ${score}\n\ngrafle.com`
}
