import puzzles from '../data/puzzles'
import generatedPuzzles from '../data/generatedPuzzles'
import specialPuzzles from '../data/specialPuzzles'
import type { Puzzle } from '../types'

const allPuzzles = [...puzzles, ...generatedPuzzles]

// Grafle officially starts June 1, 2026 (Puzzle #1). June 1, 2026 is a Monday.
const EPOCH = new Date('2026-06-01T00:00:00Z')

function daysSinceEpoch(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((utc - EPOCH.getTime()) / 86400000)
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
  // Puzzle numbers only exist from Puzzle #1 onward (day 0 = Puzzle #1)
  return Math.max(1, offset + 1)
}

export function getPuzzleForDate(date?: Date): Puzzle {
  const d = date ?? new Date()

  // Special date check (any year): June 16 and June 19
  const month = d.getMonth() + 1
  const day = d.getDate()
  if (month === 6 && day === 16) return specialPuzzles[0]
  if (month === 6 && day === 19) return specialPuzzles[1]

  const dayOffset = daysSinceEpoch(d)
  const weekNumber = Math.floor(dayOffset / 7)
  // dayOffset % 7 === 0 is Monday (epoch is a Monday)
  const dayOfWeek = ((dayOffset % 7) + 7) % 7

  // Mon–Thu (0–3) = easy/medium; Fri–Sun (4–6) = hard
  const isHard = dayOfWeek >= 4
  const impossibleDays = getWeekImpossibleSchedule(weekNumber)
  const requiredSolvable = !impossibleDays.includes(dayOfWeek)

  const pool = allPuzzles.filter((p) => {
    const difficultyMatch = isHard ? p.difficulty === 'hard' : p.difficulty !== 'hard'
    return difficultyMatch && p.solvable === requiredSolvable
  })

  const safePool = pool.length > 0 ? pool : allPuzzles
  return safePool[((dayOffset % safePool.length) + safePool.length) % safePool.length]
}

export function getPuzzleById(id: number): Puzzle | null {
  const special = specialPuzzles.find((p) => p.id === id)
  if (special) return special
  return allPuzzles.find((p) => p.id === id) ?? null
}

export function getPuzzleByNumber(puzzleNumber: number): { puzzle: Puzzle; date: Date } | null {
  if (puzzleNumber < 1) return null
  const dayOffset = puzzleNumber - 1
  const date = new Date(EPOCH.getTime() + dayOffset * 86400000)
  const puzzle = getPuzzleForDate(date)
  return { puzzle, date }
}

export function getCurrentPuzzleNumber(): number {
  return getPuzzleNumber()
}

export function getMinPuzzleNumber(): number {
  return 1
}
