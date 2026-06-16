import { useState } from 'react'
import Graph from './Graph'
import type { GameState, Puzzle } from '../types'

interface Props {
  puzzle: Puzzle
  darkMode: boolean
}

function buildDisplayState(solution: number[], stepIndex: number, puzzle: Puzzle): GameState {
  const path = solution.slice(0, stepIndex + 1)
  const usedEdgeIds = new Set<number>()

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]
    // Find an unused edge between these two vertices
    const edge = puzzle.edges.find(
      (e) => !usedEdgeIds.has(e.id) && ((e.from === from && e.to === to) || (e.from === to && e.to === from))
    )
    if (edge) usedEdgeIds.add(edge.id)
  }

  const isComplete = usedEdgeIds.size === puzzle.edges.length

  return {
    path,
    usedEdgeIds,
    currentVertexId: path[path.length - 1] ?? null,
    status: isComplete ? 'won' : 'playing',
    startTime: null,
    endTime: null,
    attempts: 0,
    invalidVertexId: null,
    stuckVertexId: null,
    livesRemaining: 0,
    lostByImpossible: false,
  }
}

export default function SolutionViewer({ puzzle, darkMode }: Props) {
  const solution = puzzle.officialSolution ?? []
  const [stepIndex, setStepIndex] = useState(0)

  if (solution.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center">
          No official solution available for this puzzle.
        </p>
      </div>
    )
  }

  const totalSteps = solution.length - 1
  const displayState = buildDisplayState(solution, stepIndex, puzzle)

  return (
    <div className="w-full h-full flex flex-col">
      {/* Graph takes up most of the space */}
      <div className="flex-1 min-h-0">
        <Graph
          puzzle={puzzle}
          state={displayState}
          onVertexClick={() => {}}
          darkMode={darkMode}
        />
      </div>

      {/* Step navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className={[
            'text-sm font-medium transition-colors',
            stepIndex === 0
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
          ].join(' ')}
        >
          ← Prev
        </button>

        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
          {stepIndex === 0 ? 'Start' : `Move ${stepIndex} / ${totalSteps}`}
        </span>

        <button
          onClick={() => setStepIndex((i) => Math.min(solution.length - 1, i + 1))}
          disabled={stepIndex === solution.length - 1}
          className={[
            'text-sm font-medium transition-colors',
            stepIndex === solution.length - 1
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
          ].join(' ')}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
