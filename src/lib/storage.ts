import type { PlayerStats, DailyResult, Settings, RankingEntry } from '../types'

const KEYS = {
  stats: 'grafle:stats',
  results: 'grafle:results',
  settings: 'grafle:settings',
  rankings: 'grafle:rankings',
  nickname: 'grafle:nickname',
  playerId: 'grafle:playerId',
  progress: 'grafle:progress',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable
  }
}

const defaultStats: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalTime: 0,
  bestScore: 0,
  lastPlayedDate: null,
}

export function loadStats(): PlayerStats {
  return load<PlayerStats>(KEYS.stats, defaultStats)
}

export function saveStats(stats: PlayerStats) {
  save(KEYS.stats, stats)
}

export function recordResult(result: DailyResult) {
  const results = load<DailyResult[]>(KEYS.results, [])
  const idx = results.findIndex((r) => r.date === result.date)
  if (idx >= 0) results[idx] = result
  else results.push(result)
  save(KEYS.results, results.slice(-90))

  const stats = loadStats()
  stats.gamesPlayed += 1
  if (result.won) {
    stats.wins += 1
    stats.totalTime += result.time
    if (result.score > stats.bestScore) stats.bestScore = result.score

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)
    if (stats.lastPlayedDate === yStr || stats.lastPlayedDate === result.date) {
      stats.currentStreak += 1
    } else {
      stats.currentStreak = 1
    }
    if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak
  } else {
    stats.currentStreak = 0
  }
  stats.lastPlayedDate = result.date
  saveStats(stats)
}

export function loadResults(): DailyResult[] {
  return load<DailyResult[]>(KEYS.results, [])
}

export function getResultForDate(date: string): DailyResult | null {
  const results = loadResults()
  return results.find((r) => r.date === date) ?? null
}

const defaultSettings: Settings = { language: 'en', darkMode: false }

export function loadSettings(): Settings {
  return load<Settings>(KEYS.settings, defaultSettings)
}

export function saveSettings(settings: Settings) {
  save(KEYS.settings, settings)
}

export function loadNickname(): string {
  return load<string>(KEYS.nickname, '')
}

export function saveNickname(name: string) {
  save(KEYS.nickname, name)
}

export function loadPlayerId(): string {
  let id = load<string>(KEYS.playerId, '')
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    save(KEYS.playerId, id)
  }
  return id
}

export function loadRankings(): RankingEntry[] {
  return load<RankingEntry[]>(KEYS.rankings, [])
}

export function saveRanking(entry: RankingEntry) {
  const rankings = loadRankings()
  rankings.push(entry)
  rankings.sort((a, b) => b.score - a.score)
  save(KEYS.rankings, rankings.slice(0, 100))
}

export interface GameProgress {
  puzzleNumber: number
  path: number[]
  usedEdgeIds: number[]
  currentVertexId: number | null
  startTime: number | null
  attempts: number
  livesRemaining: number
  status: string
}

export function loadProgress(): GameProgress | null {
  const saved = load<GameProgress | null>(KEYS.progress, null)
  if (saved && typeof saved.livesRemaining !== 'number') return null
  return saved
}

export function saveProgress(progress: GameProgress) {
  save(KEYS.progress, progress)
}

export function clearProgress() {
  localStorage.removeItem(KEYS.progress)
}
