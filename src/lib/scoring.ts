import type { Difficulty } from '../types'

const BASE_SCORES: Record<Difficulty, number> = { easy: 1000, medium: 2000, hard: 3000 }
const MAX_TIMES: Record<Difficulty, number> = { easy: 60, medium: 180, hard: 300 }

export function calculateScore(difficulty: Difficulty, elapsedSeconds: number): number {
  const base = BASE_SCORES[difficulty]
  const maxTime = MAX_TIMES[difficulty]
  const ratio = Math.max(0, 1 - elapsedSeconds / maxTime)
  return Math.round(base * ratio)
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
