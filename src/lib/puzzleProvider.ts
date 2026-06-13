import puzzles from '../data/puzzles'
import type { Puzzle } from '../types'

const EPOCH = new Date('2024-01-01T00:00:00Z')

function daysSinceEpoch(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const epochUtc = EPOCH.getTime()
  return Math.floor((utc - epochUtc) / 86400000)
}

export function getPuzzleNumber(date?: Date): number {
  return daysSinceEpoch(date ?? new Date()) + 1
}

export function getPuzzleForDate(date?: Date): Puzzle {
  const day = daysSinceEpoch(date ?? new Date())
  return puzzles[day % puzzles.length]
}

export function getPuzzleById(id: number): Puzzle | null {
  return puzzles.find((p) => p.id === id) ?? null
}

export function getPuzzleByNumber(puzzleNumber: number): { puzzle: Puzzle; date: Date } | null {
  if (puzzleNumber < 1) return null
  const dayOffset = puzzleNumber - 1
  const date = new Date(EPOCH.getTime() + dayOffset * 86400000)
  const puzzle = puzzles[dayOffset % puzzles.length]
  return { puzzle, date }
}

export function getCurrentPuzzleNumber(): number {
  return getPuzzleNumber()
}

export function getMinPuzzleNumber(): number {
  return 1
}
