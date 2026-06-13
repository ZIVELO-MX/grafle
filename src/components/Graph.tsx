import { useRef, useState, useEffect } from 'react'
import type { Puzzle, GameState, Edge } from '../types'

const VIEWBOX = 400
const VERTEX_R = 18
const HIT_R = 32
const EDGE_W = 5

interface Props {
  puzzle: Puzzle
  state: GameState
  onVertexClick: (id: number) => void
  darkMode: boolean
}

function edgeColor(used: boolean, dark: boolean): string {
  if (used) return '#3b82f6'
  return dark ? '#374151' : '#d1d5db'
}

function vertexFill(id: number, state: GameState, dark: boolean): string {
  if (id === state.currentVertexId) return dark ? '#1e3a8a' : '#eff6ff'
  if (state.path.includes(id)) return dark ? '#1c3a5c' : '#f0f9ff'
  return dark ? '#1e293b' : '#ffffff'
}

function vertexStroke(id: number, state: GameState, isReachable: boolean, dark: boolean): string {
  if (id === state.currentVertexId) return '#2563eb'
  if (id === state.invalidVertexId) return '#ef4444'
  if (state.path.includes(id)) return '#60a5fa'
  if (isReachable) return '#10b981'
  return dark ? '#4b5563' : '#9ca3af'
}

function vertexStrokeWidth(id: number, state: GameState, isReachable: boolean): number {
  if (id === state.currentVertexId || id === state.invalidVertexId) return 3
  if (isReachable) return 2.5
  return 2
}

function getReachableIds(currentId: number | null, edges: Edge[], usedEdgeIds: Set<number>): Set<number> {
  if (currentId === null) return new Set()
  const ids = new Set<number>()
  for (const e of edges) {
    if (usedEdgeIds.has(e.id)) continue
    if (e.from === currentId) ids.add(e.to)
    else if (e.to === currentId) ids.add(e.from)
  }
  return ids
}

export default function Graph({ puzzle, state, onVertexClick, darkMode }: Props) {
  const won = state.status === 'won' || state.status === 'impossible-correct'
  const svgRef = useRef<SVGSVGElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{
    startX: number
    startY: number
    startPanX: number
    startPanY: number
    vertexId: number | null
    hasMoved: boolean
  } | null>(null)

  // Reset pan when puzzle changes
  useEffect(() => {
    setPan({ x: 0, y: 0 })
  }, [puzzle.id])

  function getSvgUnitScale(): number {
    if (!svgRef.current) return 1
    const rect = svgRef.current.getBoundingClientRect()
    return VIEWBOX / Math.max(rect.width, 1)
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const target = e.target as SVGElement
    const g = target.closest<SVGElement>('[data-vid]')
    const vertexId = g?.dataset.vid != null ? parseInt(g.dataset.vid) : null
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      vertexId,
      hasMoved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current) return
    const dx = e.clientX - drag.current.startX
    const dy = e.clientY - drag.current.startY
    if (!drag.current.hasMoved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return
    drag.current.hasMoved = true
    const scale = getSvgUnitScale()
    setPan({
      x: drag.current.startPanX + dx * scale,
      y: drag.current.startPanY + dy * scale,
    })
  }

  function handlePointerUp() {
    if (drag.current && !drag.current.hasMoved && drag.current.vertexId !== null) {
      if (!won) onVertexClick(drag.current.vertexId)
    }
    drag.current = null
  }

  const reachableIds = getReachableIds(state.currentVertexId, puzzle.edges, state.usedEdgeIds)

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className="w-full h-full select-none touch-none cursor-grab active:cursor-grabbing"
      aria-label="Puzzle graph"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <g transform={`translate(${pan.x} ${pan.y})`}>
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
              strokeWidth={24}
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
              stroke={edgeColor(used, darkMode)}
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
          const isReachable = reachableIds.has(v.id) && !won
          return (
            <g
              key={v.id}
              data-vid={v.id}
              aria-label={`Point ${v.id}`}
            >
              {/* Hit area */}
              <circle cx={v.x} cy={v.y} r={HIT_R} fill="transparent" />

              {/* Reachable hint ring */}
              {isReachable && (
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={VERTEX_R + 7}
                  fill="#d1fae5"
                  opacity={0.5}
                />
              )}

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
                fill={vertexFill(v.id, state, darkMode)}
                stroke={vertexStroke(v.id, state, isReachable, darkMode)}
                strokeWidth={vertexStrokeWidth(v.id, state, isReachable)}
                className={[
                  'transition-all duration-200',
                  isInvalid ? 'animate-shake' : '',
                ].join(' ')}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
