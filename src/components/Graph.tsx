import type { Puzzle, GameState } from '../types'

const VIEWBOX = 400
const VERTEX_R = 18
const HIT_R = 32
const EDGE_W = 5
const EDGE_HIT_W = 24

interface Props {
  puzzle: Puzzle
  state: GameState
  onVertexClick: (id: number) => void
}

function edgeColor(used: boolean): string {
  return used ? '#3b82f6' : '#d1d5db'
}

function vertexFill(id: number, state: GameState): string {
  if (id === state.currentVertexId) return '#eff6ff'
  if (state.path.includes(id)) return '#f0f9ff'
  return '#ffffff'
}

function vertexStroke(id: number, state: GameState): string {
  if (id === state.currentVertexId) return '#2563eb'
  if (id === state.invalidVertexId) return '#ef4444'
  if (state.path.includes(id)) return '#60a5fa'
  return '#9ca3af'
}

function vertexStrokeWidth(id: number, state: GameState): number {
  if (id === state.currentVertexId || id === state.invalidVertexId) return 3
  return 2
}

export default function Graph({ puzzle, state, onVertexClick }: Props) {
  const won = state.status === 'won' || state.status === 'impossible-correct'

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className="w-full h-full select-none touch-none"
      aria-label="Puzzle graph"
    >
      {/* Edges — hit layer first */}
      {puzzle.edges.map((edge) => {
        const from = puzzle.vertices.find((v) => v.id === edge.from)!
        const to = puzzle.vertices.find((v) => v.id === edge.to)!
        return (
          <line
            key={`hit-${edge.id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="transparent"
            strokeWidth={EDGE_HIT_W}
          />
        )
      })}

      {/* Edges — visual layer */}
      {puzzle.edges.map((edge) => {
        const from = puzzle.vertices.find((v) => v.id === edge.from)!
        const to = puzzle.vertices.find((v) => v.id === edge.to)!
        const used = state.usedEdgeIds.has(edge.id)
        return (
          <line
            key={edge.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={edgeColor(used)}
            strokeWidth={EDGE_W}
            strokeLinecap="round"
            className="transition-colors duration-300"
          />
        )
      })}

      {/* Vertices */}
      {puzzle.vertices.map((v) => {
        const isInvalid = v.id === state.invalidVertexId
        const isCurrent = v.id === state.currentVertexId
        const isClickable = !won && (state.currentVertexId === null || true)
        return (
          <g
            key={v.id}
            onClick={() => isClickable && onVertexClick(v.id)}
            className={isClickable ? 'cursor-pointer' : ''}
            aria-label={`Point ${v.id}`}
          >
            {/* Hit area */}
            <circle cx={v.x} cy={v.y} r={HIT_R} fill="transparent" />
            {/* Glow for current vertex */}
            {isCurrent && (
              <circle
                cx={v.x}
                cy={v.y}
                r={VERTEX_R + 6}
                fill="#dbeafe"
                opacity={0.6}
                className="animate-pulse"
              />
            )}
            {/* Main vertex */}
            <circle
              cx={v.x}
              cy={v.y}
              r={VERTEX_R}
              fill={vertexFill(v.id, state)}
              stroke={vertexStroke(v.id, state)}
              strokeWidth={vertexStrokeWidth(v.id, state)}
              className={[
                'transition-all duration-200',
                isInvalid ? 'animate-shake' : '',
              ].join(' ')}
            />
          </g>
        )
      })}
    </svg>
  )
}
