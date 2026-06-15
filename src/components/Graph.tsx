import { useRef, useState } from 'react'
import type { Puzzle, GameState, Edge } from '../types'

const VIEWBOX = 400
const VERTEX_R = 18
const HIT_R = 32
const EDGE_W = 5
const DRAG_THRESHOLD = 8   // px before drag line activates
const SNAP_RADIUS = 60     // SVG units to snap to a vertex

interface Props {
  puzzle: Puzzle
  state: GameState
  onVertexClick: (id: number) => void
  darkMode: boolean
}

function edgeColor(used: boolean, won: boolean, dark: boolean): string {
  if (used && won) return '#22c55e'
  if (used) return '#3b82f6'
  return dark ? '#374151' : '#d1d5db'
}

function vertexFill(id: number, state: GameState, dark: boolean): string {
  const won = state.status === 'won' || state.status === 'impossible-correct'
  if (won) return dark ? '#14532d' : '#f0fdf4'
  if (id === state.currentVertexId) return dark ? '#1e3a8a' : '#eff6ff'
  if (state.path.includes(id)) return dark ? '#1c3a5c' : '#f0f9ff'
  return dark ? '#1e293b' : '#ffffff'
}

function vertexStroke(id: number, state: GameState, isReachable: boolean, isSnapTarget: boolean, dark: boolean): string {
  const won = state.status === 'won' || state.status === 'impossible-correct'
  if (won) return '#22c55e'
  if (id === state.currentVertexId) return '#2563eb'
  if (id === state.invalidVertexId) return '#ef4444'
  if (isSnapTarget) return dark ? '#86efac' : '#16a34a'
  if (state.path.includes(id)) return '#60a5fa'
  if (isReachable) return dark ? '#4ade80' : '#16a34a'
  return dark ? '#4b5563' : '#9ca3af'
}

function vertexStrokeWidth(id: number, state: GameState, isReachable: boolean, isSnapTarget: boolean): number {
  if (id === state.currentVertexId || id === state.invalidVertexId) return 3
  if (isSnapTarget) return 5
  if (isReachable) return 4
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

interface DragState {
  startClientX: number
  startClientY: number
  vertexId: number | null
  isDragLine: boolean
  hasMoved: boolean
}

export default function Graph({ puzzle, state, onVertexClick, darkMode }: Props) {
  const won = state.status === 'won' || state.status === 'impossible-correct'
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<DragState | null>(null)

  // Tip of the drag line in SVG coordinates
  const [dragTip, setDragTip] = useState<{ x: number; y: number } | null>(null)
  // Vertex being snapped to during drag
  const [snapTarget, setSnapTarget] = useState<number | null>(null)

  const reachableIds = getReachableIds(state.currentVertexId, puzzle.edges, state.usedEdgeIds)

  function clientToSvg(clientX: number, clientY: number) {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (VIEWBOX / rect.width),
      y: (clientY - rect.top) * (VIEWBOX / rect.height),
    }
  }

  function findSnap(svgPos: { x: number; y: number }): number | null {
    let best: number | null = null
    let bestDist = SNAP_RADIUS
    for (const vid of reachableIds) {
      const v = puzzle.vertices.find((v) => v.id === vid)
      if (!v) continue
      const d = Math.hypot(v.x - svgPos.x, v.y - svgPos.y)
      if (d < bestDist) { bestDist = d; best = vid }
    }
    return best
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (won) return
    const target = e.target as SVGElement
    const g = target.closest<SVGElement>('[data-vid]')
    const vertexId = g?.dataset.vid != null ? parseInt(g.dataset.vid) : null
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      vertexId,
      isDragLine: false,
      hasMoved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = dragRef.current
    if (!d) return

    const dx = e.clientX - d.startClientX
    const dy = e.clientY - d.startClientY
    const moved = Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD

    if (!moved) return
    d.hasMoved = true

    // Only show drag line when dragging from the current vertex
    if (!d.isDragLine && d.vertexId === state.currentVertexId && state.currentVertexId !== null) {
      d.isDragLine = true
    }

    if (d.isDragLine) {
      const svgPos = clientToSvg(e.clientX, e.clientY)
      setDragTip(svgPos)
      setSnapTarget(findSnap(svgPos))
    }
  }

  function handlePointerUp() {
    const d = dragRef.current
    if (!d) return

    if (d.isDragLine) {
      // Drag from current vertex: select snap target if any
      if (snapTarget !== null) {
        onVertexClick(snapTarget)
      }
      setDragTip(null)
      setSnapTarget(null)
    } else if (!d.hasMoved && d.vertexId !== null) {
      // Plain tap: select vertex
      onVertexClick(d.vertexId)
    }

    dragRef.current = null
  }

  // Current vertex position (for drag line origin)
  const currentVertex = puzzle.vertices.find((v) => v.id === state.currentVertexId) ?? null

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className="w-full h-full select-none touch-none"
      aria-label="Puzzle graph"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Edges — hit layer */}
      {puzzle.edges.map((edge) => {
        const from = puzzle.vertices.find((v) => v.id === edge.from)!
        const to = puzzle.vertices.find((v) => v.id === edge.to)!
        return (
          <line
            key={`hit-${edge.id}`}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
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
        const isWon = state.status === 'won' || state.status === 'impossible-correct'
        return (
          <line
            key={edge.id}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            stroke={edgeColor(used, isWon, darkMode)}
            strokeWidth={EDGE_W}
            strokeLinecap="round"
            className="transition-colors duration-300"
          />
        )
      })}

      {/* Drag line from current vertex to finger tip */}
      {dragTip && currentVertex && (
        <>
          {/* Shadow/glow behind line */}
          <line
            x1={currentVertex.x} y1={currentVertex.y}
            x2={snapTarget !== null
              ? (puzzle.vertices.find(v => v.id === snapTarget)?.x ?? dragTip.x)
              : dragTip.x}
            y2={snapTarget !== null
              ? (puzzle.vertices.find(v => v.id === snapTarget)?.y ?? dragTip.y)
              : dragTip.y}
            stroke={darkMode ? '#4ade80' : '#16a34a'}
            strokeWidth={10}
            strokeLinecap="round"
            opacity={0.15}
          />
          {/* Main drag line */}
          <line
            x1={currentVertex.x} y1={currentVertex.y}
            x2={snapTarget !== null
              ? (puzzle.vertices.find(v => v.id === snapTarget)?.x ?? dragTip.x)
              : dragTip.x}
            y2={snapTarget !== null
              ? (puzzle.vertices.find(v => v.id === snapTarget)?.y ?? dragTip.y)
              : dragTip.y}
            stroke={snapTarget !== null
              ? (darkMode ? '#4ade80' : '#16a34a')
              : (darkMode ? '#94a3b8' : '#94a3b8')}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={snapTarget !== null ? undefined : '10 6'}
            opacity={0.85}
          />
        </>
      )}

      {/* Vertices */}
      {puzzle.vertices.map((v) => {
        const isInvalid = v.id === state.invalidVertexId
        const isCurrent = v.id === state.currentVertexId
        const isReachable = reachableIds.has(v.id) && !won
        const isSnapTgt = v.id === snapTarget

        return (
          <g key={v.id} data-vid={v.id} aria-label={`Point ${v.id}`}>
            {/* Hit area */}
            <circle cx={v.x} cy={v.y} r={HIT_R} fill="transparent" />

            {/* Snap target: bright solid ring that scales up */}
            {isSnapTgt && (
              <circle
                cx={v.x} cy={v.y}
                r={VERTEX_R + 12}
                fill={darkMode ? '#166534' : '#dcfce7'}
                stroke={darkMode ? '#4ade80' : '#16a34a'}
                strokeWidth={3}
              />
            )}

            {/* Reachable: outer pulsing glow + inner solid ring */}
            {isReachable && !isSnapTgt && (
              <>
                <circle
                  cx={v.x} cy={v.y}
                  r={VERTEX_R + 16}
                  fill={darkMode ? '#14532d' : '#86efac'}
                  opacity={0.55}
                  className="animate-pulse"
                />
                <circle
                  cx={v.x} cy={v.y}
                  r={VERTEX_R + 8}
                  fill={darkMode ? '#166534' : '#dcfce7'}
                  stroke={darkMode ? '#4ade80' : '#16a34a'}
                  strokeWidth={2.5}
                />
              </>
            )}

            {/* Glow for current vertex */}
            {isCurrent && (
              <circle
                cx={v.x} cy={v.y}
                r={VERTEX_R + 6}
                fill="#dbeafe"
                opacity={0.6}
                className="animate-pulse"
              />
            )}

            {/* Main vertex circle */}
            <circle
              cx={v.x} cy={v.y}
              r={VERTEX_R}
              fill={vertexFill(v.id, state, darkMode)}
              stroke={vertexStroke(v.id, state, isReachable, isSnapTgt, darkMode)}
              strokeWidth={vertexStrokeWidth(v.id, state, isReachable, isSnapTgt)}
              className={[
                'transition-all duration-150',
                isInvalid ? 'animate-shake' : '',
              ].join(' ')}
            />
          </g>
        )
      })}
    </svg>
  )
}
