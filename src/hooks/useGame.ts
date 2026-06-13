import { useState, useCallback, useEffect } from 'react'
import type { Puzzle, GameState, GameStatus } from '../types'
import { findEdgeBetween, getUnusedAdjacentEdges } from '../lib/graphUtils'
import { calculateScore } from '../lib/scoring'
import { recordResult, saveProgress, clearProgress, loadProgress } from '../lib/storage'

function initialState(): GameState {
  return {
    path: [],
    usedEdgeIds: new Set(),
    currentVertexId: null,
    status: 'idle',
    startTime: null,
    endTime: null,
    attempts: 0,
    invalidVertexId: null,
    stuckVertexId: null,
  }
}

export function useGame(puzzle: Puzzle, puzzleNumber: number, isToday: boolean) {
  const [state, setState] = useState<GameState>(() => {
    if (isToday) {
      const saved = loadProgress()
      if (saved && saved.puzzleNumber === puzzleNumber) {
        return {
          ...initialState(),
          path: saved.path,
          usedEdgeIds: new Set(saved.usedEdgeIds),
          currentVertexId: saved.currentVertexId,
          startTime: saved.startTime,
          attempts: saved.attempts,
          status: saved.path.length > 0 ? 'playing' : 'idle',
        }
      }
    }
    return initialState()
  })

  useEffect(() => {
    setState(initialState())
  }, [puzzle.id])

  useEffect(() => {
    if (!isToday) return
    if (state.status === 'playing' || state.status === 'idle') {
      saveProgress({
        puzzleNumber,
        path: state.path,
        usedEdgeIds: [...state.usedEdgeIds],
        currentVertexId: state.currentVertexId,
        startTime: state.startTime,
        attempts: state.attempts,
      })
    }
    if (state.status === 'won' || state.status === 'impossible-correct') {
      clearProgress()
    }
  }, [state, isToday, puzzleNumber])

  const handleVertexClick = useCallback(
    (vertexId: number) => {
      setState((prev) => {
        if (prev.status === 'won' || prev.status === 'impossible-correct') return prev

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

        let newStatus: GameStatus = 'playing'
        let endTime: number | null = prev.endTime

        if (allUsed) {
          newStatus = 'won'
          endTime = Date.now()
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
            })
          }
        }

        return {
          ...prev,
          path: newPath,
          usedEdgeIds: newUsedEdges,
          currentVertexId: vertexId,
          status: newStatus,
          endTime,
          invalidVertexId: null,
          stuckVertexId: stuck ? vertexId : null,
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
      if (prev.status === 'won' || prev.status === 'impossible-correct') return prev

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
    setState((prev) => ({
      ...initialState(),
      attempts: prev.attempts + 1,
    }))
  }, [])

  const elapsedSeconds = state.startTime
    ? state.endTime
      ? Math.floor((state.endTime - state.startTime) / 1000)
      : Math.floor((Date.now() - state.startTime) / 1000)
    : 0

  const score =
    state.status === 'won' || state.status === 'impossible-correct'
      ? calculateScore(puzzle.difficulty, elapsedSeconds)
      : 0

  return { state, handleVertexClick, handleImpossible, restart, elapsedSeconds, score }
}
