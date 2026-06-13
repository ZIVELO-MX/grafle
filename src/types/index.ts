export interface Vertex {
  id: number
  x: number
  y: number
  label?: string
}

export interface Edge {
  id: number
  from: number
  to: number
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Puzzle {
  id: number
  vertices: Vertex[]
  edges: Edge[]
  difficulty: Difficulty
  solvable: boolean
  officialSolution?: number[]
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'impossible-correct' | 'impossible-wrong'

export interface GameState {
  path: number[]
  usedEdgeIds: Set<number>
  currentVertexId: number | null
  status: GameStatus
  startTime: number | null
  endTime: number | null
  attempts: number
  invalidVertexId: number | null
  stuckVertexId: number | null
}

export interface PlayerStats {
  gamesPlayed: number
  wins: number
  currentStreak: number
  bestStreak: number
  totalTime: number
  bestScore: number
  lastPlayedDate: string | null
}

export interface DailyResult {
  puzzleId: number
  date: string
  won: boolean
  score: number
  time: number
  usedImpossible: boolean
}

export interface RankingEntry {
  nickname: string
  playerId: string
  score: number
  time: number
  puzzleId: number
  date: string
}

export interface Settings {
  language: 'en' | 'es'
  darkMode: boolean
}

export type ModalId = 'help' | 'settings' | 'menu' | 'completion' | 'stats' | 'rankings' | null
