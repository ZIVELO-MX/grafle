interface Vertex { x: number; y: number }
interface Edge { from: number; to: number }

const VIEWBOX = 400
const MIN_MARGIN = 30
const MIN_VERTEX_SEP = 45
const IDEAL_EDGE_LENGTH = 90

function r(n: number): number {
  return Math.round(n * 10) / 10
}

function segmentsIntersect(
  p1: Vertex, p2: Vertex,
  p3: Vertex, p4: Vertex
): boolean {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y
  const denom = d1x * d2y - d1y * d2x
  if (Math.abs(denom) < 1e-10) return false
  const dx = p3.x - p1.x, dy = p3.y - p1.y
  const t = (dx * d2y - dy * d2x) / denom
  const u = (dx * d1y - dy * d1x) / denom
  return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98
}

export function countEdgeCrossings(vertices: Vertex[], edges: Edge[]): number {
  let count = 0
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const ea = edges[i], eb = edges[j]
      if (ea.from === eb.from || ea.from === eb.to || ea.to === eb.from || ea.to === eb.to) continue
      const p1 = vertices[ea.from - 1]
      const p2 = vertices[ea.to - 1]
      const p3 = vertices[eb.from - 1]
      const p4 = vertices[eb.to - 1]
      if (!p1 || !p2 || !p3 || !p4) continue
      if (segmentsIntersect(p1, p2, p3, p4)) count++
    }
  }
  return count
}

export function detectSymmetry(vertices: Vertex[]): 'reflective' | 'rotational' | 'both' | null {
  if (vertices.length < 2) return null
  const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length
  const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length
  const EPS = 10

  const reflectedV = vertices.map((v) => ({ x: 2 * cx - v.x, y: v.y }))
  const hasVertical = reflectedV.every((rv) =>
    vertices.some((v) => Math.hypot(v.x - rv.x, v.y - rv.y) < EPS)
  )

  const reflectedH = vertices.map((v) => ({ x: v.x, y: 2 * cy - v.y }))
  const hasHorizontal = reflectedH.every((rv) =>
    vertices.some((v) => Math.hypot(v.x - rv.x, v.y - rv.y) < EPS)
  )

  const rotated = vertices.map((v) => ({ x: 2 * cx - v.x, y: 2 * cy - v.y }))
  const has180 = rotated.every((rv) =>
    vertices.some((v) => Math.hypot(v.x - rv.x, v.y - rv.y) < EPS)
  )

  const hasReflective = hasVertical || hasHorizontal
  const hasRotational = has180

  if (hasReflective && hasRotational) return 'both'
  if (hasReflective) return 'reflective'
  if (hasRotational) return 'rotational'
  return null
}

export function scoreVisualQuality(
  vertices: Vertex[],
  edges: Edge[]
): number {
  let score = 100

  const crossings = countEdgeCrossings(vertices, edges)
  score -= crossings * 8

  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const d = Math.hypot(vertices[i].x - vertices[j].x, vertices[i].y - vertices[j].y)
      if (d < MIN_VERTEX_SEP) {
        score -= Math.max(0, MIN_VERTEX_SEP - d) * 0.8
      }
    }
  }

  for (const v of vertices) {
    if (v.x < MIN_MARGIN || v.x > VIEWBOX - MIN_MARGIN ||
        v.y < MIN_MARGIN || v.y > VIEWBOX - MIN_MARGIN) {
      score -= 12
    }
  }

  if (vertices.length >= 3) {
    let totalDist = 0, pairs = 0
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        totalDist += Math.hypot(vertices[i].x - vertices[j].x, vertices[i].y - vertices[j].y)
        pairs++
      }
    }
    const avgDist = totalDist / pairs
    if (avgDist >= 90) score += 12
    else if (avgDist < 55) score -= 12
  }

  const symType = detectSymmetry(vertices)
  if (symType === 'both') score += 20
  else if (symType) score += 12

  let edgeLenUniformity = 0
  if (edges.length > 0) {
    const lengths = edges.map((e) => {
      const p1 = vertices[e.from - 1]
      const p2 = vertices[e.to - 1]
      return p1 && p2 ? Math.hypot(p1.x - p2.x, p1.y - p2.y) : 0
    })
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const maxDev = Math.max(...lengths.map((l) => Math.abs(l - avgLen)))
    const cv = avgLen > 0 ? maxDev / avgLen : 0
    if (cv < 0.4) edgeLenUniformity = 10
    else if (cv < 0.7) edgeLenUniformity = 5
    else if (cv > 1.2) edgeLenUniformity = -5
  }
  score += edgeLenUniformity

  let minAngle = 360
  for (let v = 0; v < vertices.length; v++) {
    const neighbors = edges
      .filter((e) => e.from === v + 1 || e.to === v + 1)
      .map((e) => {
        const nb = e.from === v + 1 ? e.to - 1 : e.from - 1
        return Math.atan2(vertices[nb].y - vertices[v].y, vertices[nb].x - vertices[v].x)
      })
      .sort((a, b) => a - b)

    if (neighbors.length >= 2) {
      for (let i = 0; i < neighbors.length; i++) {
        const next = (i + 1) % neighbors.length
        let angle = ((neighbors[next] - neighbors[i]) * 180) / Math.PI
        if (angle < 0) angle += 360
        if (angle < minAngle) minAngle = angle
      }
    }
  }

  if (minAngle < 15) score -= 15
  else if (minAngle > 60) score += 8

  const degreeCounts = new Map<number, number>()
  for (const e of edges) {
    degreeCounts.set(e.from, (degreeCounts.get(e.from) ?? 0) + 1)
    degreeCounts.set(e.to, (degreeCounts.get(e.to) ?? 0) + 1)
  }
  const maxDeg = Math.max(...degreeCounts.values(), 0)
  if (maxDeg >= 6) score += 8

  return Math.max(0, Math.min(100, Math.round(score)))
}
