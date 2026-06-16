import puzzles from '../data/puzzles'
import type { Puzzle } from '../types'

// Grafle officially starts June 1, 2026 (Puzzle #1). June 1, 2026 is a Monday.
const EPOCH = new Date('2026-06-01T00:00:00Z')

function daysSinceEpoch(date: Date): number {
  // Use local date components so the puzzle changes at midnight LOCAL time
  const localMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((localMidnight.getTime() - EPOCH.getTime()) / 86400000)
}

// Returns weekday indices (0=Mon…6=Sun) that are impossible for a given week.
// Constraints: max 2 impossible days, non-consecutive, not both on weekend (4=Fri,5=Sat,6=Sun).
// [4,6] is excluded (Fri+Sun — both weekend). All other pairs with gap >= 2 are valid.
const WEEK_IMPOSSIBLE_SCHEDULES: number[][] = [
  [],
  [0], [1], [2], [3], [4], [5], [6],
  [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 3], [1, 4], [1, 5], [1, 6],
  [2, 4], [2, 5], [2, 6],
  [3, 5], [3, 6],
  // [4, 6] excluded: both weekend
]

function getWeekImpossibleSchedule(weekNumber: number): number[] {
  const len = WEEK_IMPOSSIBLE_SCHEDULES.length
  return WEEK_IMPOSSIBLE_SCHEDULES[((weekNumber % len) + len) % len]
}

export function getPuzzleNumber(date?: Date): number {
  const offset = daysSinceEpoch(date ?? new Date())
  return Math.max(1, offset + 1)
}

export function getPuzzleForDate(date?: Date): Puzzle {
  const d = date ?? new Date()
  const dayOffset = daysSinceEpoch(d)

  if (dayOffset >= 0 && dayOffset < puzzles.length) {
    return puzzles[dayOffset]
  }

  const weekNumber = Math.floor(dayOffset / 7)
  const dayOfWeek = ((dayOffset % 7) + 7) % 7

  const isHard = dayOfWeek >= 4
  const impossibleDays = getWeekImpossibleSchedule(weekNumber)
  const requiredSolvable = !impossibleDays.includes(dayOfWeek)

  const pool = puzzles.filter((p) => {
    const difficultyMatch = isHard ? p.difficulty === 'hard' : p.difficulty !== 'hard'
    return difficultyMatch && p.solvable === requiredSolvable
  })

  const safePool = pool.length > 0 ? pool : puzzles
  return safePool[((dayOffset % safePool.length) + safePool.length) % safePool.length]
}

export function getPuzzleById(id: number): Puzzle | null {
  return puzzles.find((p) => p.id === id) ?? null
}

export function getPuzzleByNumber(puzzleNumber: number): { puzzle: Puzzle; date: Date } | null {
  if (puzzleNumber < 1) return null
  const dayOffset = puzzleNumber - 1
  if (dayOffset < puzzles.length) {
    return { puzzle: puzzles[dayOffset], date: new Date(EPOCH.getTime() + dayOffset * 86400000) }
  }
  const date = new Date(EPOCH.getTime() + dayOffset * 86400000)
  return { puzzle: getPuzzleForDate(date), date }
}

export function getCurrentPuzzleNumber(): number {
  return getPuzzleNumber()
}

export function getMinPuzzleNumber(): number {
  return 1
}

const ALLOW_FUTURE_PUZZLES = import.meta.env.VITE_ALLOW_FUTURE_PUZZLES === 'true'

export function getMaxPuzzleNumber(): number {
  return ALLOW_FUTURE_PUZZLES ? Math.max(getCurrentPuzzleNumber(), 30) : getCurrentPuzzleNumber()
}
