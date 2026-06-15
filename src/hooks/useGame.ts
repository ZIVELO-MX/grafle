import { useState, useCallback, useEffect, useRef } from 'react'
import type { Puzzle, GameState, GameStatus } from '../types'
import { findEdgeBetween, getUnusedAdjacentEdges } from '../lib/graphUtils'
import { calculateScore } from '../lib/scoring'
import { recordResult, saveProgress, clearProgress, loadProgress } from '../lib/storage'

const MAX_LIVES = 3

function initialState(): GameState {
  return {
    path: [],
    usedEdgeIds: new Set(),
    currentVertexId: null,
    status: 'not-started',
    startTime: null,
    endTime: null,
    attempts: 0,
    invalidVertexId: null,
    stuckVertexId: null,
    livesRemaining: MAX_LIVES,
  }
}

export function useGame(puzzle: Puzzle, puzzleNumber: number, isToday: boolean) {
  const [state, setState] = useState<GameState>(() => {
    if (isToday) {
      const saved = loadProgress()
      if (saved && saved.puzzleNumber === puzzleNumber) {
        const savedStatus = saved.status as GameStatus
        const restoredStatus: GameStatus =
          savedStatus === 'not-started'
            ? 'not-started'
            : saved.path.length > 0
              ? 'playing'
              : 'idle'
        return {
          ...initialState(),
          path: saved.path,
          usedEdgeIds: new Set(saved.usedEdgeIds),
          currentVertexId: saved.currentVertexId,
          startTime: saved.startTime,
          attempts: saved.attempts,
          livesRemaining: saved.livesRemaining,
          status: restoredStatus,
        }
      }
    }
    return initialState()
  })

  // Prevents tap-through: ignore vertex clicks for 300ms after pressing Start
  const startedAtRef = useRef<number>(0)

  // Track stuck timeout so we can cancel it if user restarts before it fires
  const stuckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (stuckTimeoutRef.current) {
      clearTimeout(stuckTimeoutRef.current)
      stuckTimeoutRef.current = null
    }
    setState(initialState())
  }, [puzzle.id])

  useEffect(() => {
    if (!isToday) return
    const { status } = state
    if (status === 'playing' || status === 'idle' || status === 'not-started') {
      saveProgress({
        puzzleNumber,
        path: state.path,
        usedEdgeIds: [...state.usedEdgeIds],
        currentVertexId: state.currentVertexId,
        startTime: state.startTime,
        attempts: state.attempts,
        livesRemaining: state.livesRemaining,
        status,
      })
    }
    if (status === 'won' || status === 'impossible-correct' || status === 'lost') {
      clearProgress()
    }
  }, [state, isToday, puzzleNumber])

  const handleStart = useCallback(() => {
    const now = Date.now()
    setState((prev) => {
      if (prev.status !== 'not-started') return prev
      return { ...prev, status: 'idle', startTime: now }
    })
    // Record when Start was pressed to guard against tap-through
    startedAtRef.current = now
  }, [])

  const handleVertexClick = useCallback(
    (vertexId: number) => {
      // Guard: ignore clicks for 300ms after pressing Start (tap-through prevention)
      if (Date.now() - startedAtRef.current < 300) return

      setState((prev) => {
        if (
          prev.status === 'won' ||
          prev.status === 'impossible-correct' ||
          prev.status === 'lost' ||
          prev.status === 'not-started'
        )
          return prev

        if (prev.currentVertexId === null) {
          return {
            ...prev,
            currentVertexId: vertexId,
            path: [vertexId],
            startTime: Date.now(),
            status: 'playing' as GameStatus,
            stuckVertexId: null,
          }
        }

        if (vertexId === prev.currentVertexId) return prev

        const edge = findEdgeBetween(prev.currentVertexId, vertexId, puzzle.edges, prev.usedEdgeIds)

        if (!edge) {
          return { ...prev, invalidVertexId: vertexId }
        }

        const newUsedEdges = new Set(prev.usedEdgeIds)
        newUsedEdges.add(edge.id)
        const newPath = [...prev.path, vertexId]

        const allUsed = newUsedEdges.size === puzzle.edges.length
        const remaining = getUnusedAdjacentEdges(vertexId, puzzle.edges, newUsedEdges)
        const stuck = !allUsed && remaining.length === 0

        if (allUsed) {
          const endTime = Date.now()
          if (isToday) {
            const elapsed = Math.floor((endTime - (prev.startTime ?? endTime)) / 1000)
            const score = calculateScore(puzzle.difficulty, elapsed)
            const today = new Date().toISOString().slice(0, 10)
            recordResult({
              puzzleId: puzzle.id,
              date: today,
              won: true,
              score,
              time: elapsed,
              usedImpossible: false,
              livesLost: MAX_LIVES - prev.livesRemaining,
            })
          }
          return {
            ...prev,
            path: newPath,
            usedEdgeIds: newUsedEdges,
            currentVertexId: vertexId,
            status: 'won',
            endTime,
            invalidVertexId: null,
            stuckVertexId: null,
          }
        }

        if (stuck) {
          // Cancel any pending stuck timeout to prevent double life loss
          if (stuckTimeoutRef.current) {
            clearTimeout(stuckTimeoutRef.current)
          }
          stuckTimeoutRef.current = setTimeout(() => {
            stuckTimeoutRef.current = null
            setState((s) => {
              // Only fire if still in playing state (user didn't restart already)
              if (s.status !== 'playing') return s
              const newLives = s.livesRemaining - 1
              if (newLives <= 0) {
                const now = Date.now()
                if (isToday) {
                  const elapsed = Math.floor((now - (s.startTime ?? now)) / 1000)
                  const today = new Date().toISOString().slice(0, 10)
                  recordResult({
                    puzzleId: puzzle.id,
                    date: today,
                    won: false,
                    score: 0,
                    time: elapsed,
                    usedImpossible: false,
                    livesLost: MAX_LIVES,
                  })
                }
                return {
                  ...s,
                  livesRemaining: 0,
                  status: 'lost',
                  endTime: now,
                  stuckVertexId: null,
                }
              }
              return {
                ...initialState(),
                livesRemaining: newLives,
                status: 'idle',
                startTime: s.startTime,
                attempts: s.attempts + 1,
              }
            })
          }, 1500)

          return {
            ...prev,
            path: newPath,
            usedEdgeIds: newUsedEdges,
            currentVertexId: vertexId,
            invalidVertexId: null,
            stuckVertexId: vertexId,
          }
        }

        return {
          ...prev,
          path: newPath,
          usedEdgeIds: newUsedEdges,
          currentVertexId: vertexId,
          status: 'playing',
          invalidVertexId: null,
          stuckVertexId: null,
        }
      })

      setTimeout(() => {
        setState((prev) => ({ ...prev, invalidVertexId: null }))
      }, 600)
    },
    [puzzle, isToday]
  )

  const handleImpossible = useCallback(() => {
    setState((prev) => {
      if (
        prev.status === 'won' ||
        prev.status === 'impossible-correct' ||
        prev.status === 'lost' ||
        prev.status === 'not-started'
      )
        return prev

      if (puzzle.solvable) {
        return { ...prev, status: 'impossible-wrong', attempts: prev.attempts + 1 }
      }

      const endTime = Date.now()
      if (isToday) {
        const elapsed = prev.startTime ? Math.floor((endTime - prev.startTime) / 1000) : 0
        const score = calculateScore(puzzle.difficulty, elapsed)
        const today = new Date().toISOString().slice(0, 10)
        recordResult({
          puzzleId: puzzle.id,
          date: today,
          won: true,
          score,
          time: elapsed,
          usedImpossible: true,
          livesLost: MAX_LIVES - prev.livesRemaining,
        })
      }

      return {
        ...prev,
        status: 'impossible-correct',
        endTime,
        startTime: prev.startTime ?? endTime,
      }
    })

    if (puzzle.solvable) {
      setTimeout(() => {
        setState((prev) =>
          prev.status === 'impossible-wrong' ? { ...prev, status: 'playing' } : prev
        )
      }, 2000)
    }
  }, [puzzle, isToday])

  const restart = useCallback(() => {
    // Cancel any pending stuck timeout to prevent double life loss
    if (stuckTimeoutRef.current) {
      clearTimeout(stuckTimeoutRef.current)
      stuckTimeoutRef.current = null
    }

    setState((prev) => {
      if (
        prev.status === 'won' ||
        prev.status === 'impossible-correct' ||
        prev.status === 'lost' ||
        prev.status === 'not-started'
      )
        return prev

      const newLives = prev.livesRemaining - 1
      if (newLives <= 0) {
        const now = Date.now()
        if (isToday) {
          const elapsed = Math.floor((now - (prev.startTime ?? now)) / 1000)
          const today = new Date().toISOString().slice(0, 10)
          recordResult({
            puzzleId: puzzle.id,
            date: today,
            won: false,
            score: 0,
            time: elapsed,
            usedImpossible: false,
            livesLost: MAX_LIVES,
          })
        }
        return {
          ...initialState(),
          livesRemaining: 0,
          status: 'lost',
          startTime: prev.startTime,
          endTime: now,
          attempts: prev.attempts + 1,
        }
      }

      return {
        ...initialState(),
        livesRemaining: newLives,
        status: 'idle',
        attempts: prev.attempts + 1,
      }
    })
  }, [puzzle, isToday])

  const elapsedSeconds = state.startTime
    ? state.endTime
      ? Math.floor((state.endTime - state.startTime) / 1000)
      : Math.floor((Date.now() - state.startTime) / 1000)
    : 0

  const score =
    state.status === 'won' || state.status === 'impossible-correct'
      ? calculateScore(puzzle.difficulty, elapsedSeconds)
      : 0

  return { state, handleVertexClick, handleImpossible, restart, handleStart, elapsedSeconds, score }
}
