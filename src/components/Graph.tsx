import { useRef, useState, useEffect, useCallback } from 'react'
import type { Puzzle, GameState, Edge } from '../types'

const VIEWBOX = 400
const VERTEX_R = 18
const HIT_R = 32
const EDGE_W = 5
const DRAG_THRESHOLD = 8
const SNAP_RADIUS = 60
const ZOOM_MIN = 0.4
const ZOOM_MAX = 3
const ZOOM_STEP = 0.15

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

function btnBg(dark: boolean) {
  return dark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700'
}

export default function Graph({ puzzle, state, onVertexClick, darkMode }: Props) {
  const won = state.status === 'won' || state.status === 'impossible-correct'
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{ dist: number } | null>(null)

  const [dragTip, setDragTip] = useState<{ x: number; y: number } | null>(null)
  const [snapTarget, setSnapTarget] = useState<number | null>(null)

  const [zoom, setZoomState] = useState(1)
  const zoomRef = useRef(1)
  const setZoom = useCallback((val: number) => {
    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, val))
    zoomRef.current = clamped
    setZoomState(clamped)
  }, [])

  useEffect(() => {
    setZoom(1)
  }, [puzzle]) // eslint-disable-line react-hooks/exhaustive-deps

  const reachableIds = getReachableIds(state.currentVertexId, puzzle.edges, state.usedEdgeIds)

  const viewSize = VIEWBOX / zoom
  const halfDiff = (VIEWBOX - viewSize) / 2
  const viewBox = `${halfDiff} ${halfDiff} ${viewSize} ${viewSize}`

  function clientToSvg(clientX: number, clientY: number) {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (viewSize / rect.width) + halfDiff,
      y: (clientY - rect.top) * (viewSize / rect.height) + halfDiff,
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

  // Native wheel listener for reliable preventDefault
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      if (won) return
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1 - ZOOM_STEP : 1 + ZOOM_STEP
      setZoom(zoomRef.current * factor)
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [won, setZoom])

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (won) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2) {
      dragRef.current = null
      setDragTip(null)
      setSnapTarget(null)
      const [p1, p2] = [...pointersRef.current.values()]
      pinchRef.current = { dist: Math.hypot(p2.x - p1.x, p2.y - p1.y) }
      return
    }

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
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [p1, p2] = [...pointersRef.current.values()]
      const newDist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      const ratio = newDist / pinchRef.current.dist
      pinchRef.current.dist = newDist
      setZoom(zoomRef.current * ratio)
      return
    }

    const d = dragRef.current
    if (!d) return

    const dx = e.clientX - d.startClientX
    const dy = e.clientY - d.startClientY
    const moved = Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD

    if (!moved) return
    d.hasMoved = true

    if (!d.isDragLine && d.vertexId === state.currentVertexId && state.currentVertexId !== null) {
      d.isDragLine = true
    }

    if (d.isDragLine) {
      const svgPos = clientToSvg(e.clientX, e.clientY)
      setDragTip(svgPos)
      setSnapTarget(findSnap(svgPos))
    }
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(e.pointerId)

    if (pointersRef.current.size < 2) {
      pinchRef.current = null
    }

    if (dragRef.current === null) return

    const d = dragRef.current

    if (d.isDragLine) {
      if (snapTarget !== null) {
        onVertexClick(snapTarget)
      }
      setDragTip(null)
      setSnapTarget(null)
    } else if (!d.hasMoved && d.vertexId !== null) {
      onVertexClick(d.vertexId)
    }

    dragRef.current = null
  }

  function handleZoomIn() { setZoom(zoomRef.current * (1 + ZOOM_STEP)) }
  function handleZoomOut() { setZoom(zoomRef.current * (1 - ZOOM_STEP)) }

  const currentVertex = puzzle.vertices.find((v) => v.id === state.currentVertexId) ?? null

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={viewBox}
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

        {/* Drag line */}
        {dragTip && currentVertex && (
          <>
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
                : '#94a3b8'}
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
              <circle cx={v.x} cy={v.y} r={HIT_R} fill="transparent" />

              {isSnapTgt && (
                <circle
                  cx={v.x} cy={v.y}
                  r={VERTEX_R + 12}
                  fill={darkMode ? '#166534' : '#dcfce7'}
                  stroke={darkMode ? '#4ade80' : '#16a34a'}
                  strokeWidth={3}
                />
              )}

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

              {isCurrent && (
                <circle
                  cx={v.x} cy={v.y}
                  r={VERTEX_R + 6}
                  fill="#dbeafe"
                  opacity={0.6}
                  className="animate-pulse"
                />
              )}

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

      {/* Zoom controls overlay */}
      {!won && (
        <div className="absolute bottom-2 right-2 flex flex-col gap-1.5">
          <button
            onClick={handleZoomIn}
            className={`w-9 h-9 rounded-xl shadow-sm flex items-center justify-center text-lg font-bold transition-colors ${btnBg(darkMode)}`}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className={`w-9 h-9 rounded-xl shadow-sm flex items-center justify-center text-lg font-bold transition-colors ${btnBg(darkMode)}`}
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      )}
    </div>
  )
}
