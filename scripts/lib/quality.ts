interface Vertex { x: number; y: number }
interface Edge { from: number; to: number }

const VIEWBOX = 400
const MIN_MARGIN = 30
const MIN_VERTEX_SEP = 50

/** Check if two line segments (p1-p2) and (p3-p4) intersect (excluding shared endpoints) */
function segmentsIntersect(
  p1: Vertex, p2: Vertex,
  p3: Vertex, p4: Vertex
): boolean {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y
  const denom = d1x * d2y - d1y * d2x
  if (Math.abs(denom) < 1e-10) return false // parallel

  const dx = p3.x - p1.x, dy = p3.y - p1.y
  const t = (dx * d2y - dy * d2x) / denom
  const u = (dx * d1y - dy * d1x) / denom

  // Strict interior intersection (not touching at endpoints)
  return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99
}

export function countEdgeCrossings(vertices: Vertex[], edges: Edge[]): number {
  let count = 0
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const ea = edges[i], eb = edges[j]
      // Skip if they share a vertex
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

/** Detect approximate reflective or rotational symmetry */
export function detectSymmetry(vertices: Vertex[]): boolean {
  if (vertices.length < 2) return false
  const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length
  const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length
  const EPS = 8

  // Check vertical axis (x = cx)
  const reflectedV = vertices.map((v) => ({ x: 2 * cx - v.x, y: v.y }))
  const hasVertical = reflectedV.every((rv) =>
    vertices.some((v) => Math.hypot(v.x - rv.x, v.y - rv.y) < EPS)
  )
  if (hasVertical) return true

  // Check horizontal axis (y = cy)
  const reflectedH = vertices.map((v) => ({ x: v.x, y: 2 * cy - v.y }))
  const hasHorizontal = reflectedH.every((rv) =>
    vertices.some((v) => Math.hypot(v.x - rv.x, v.y - rv.y) < EPS)
  )
  if (hasHorizontal) return true

  // Check 180° rotation
  const rotated = vertices.map((v) => ({ x: 2 * cx - v.x, y: 2 * cy - v.y }))
  const has180 = rotated.every((rv) =>
    vertices.some((v) => Math.hypot(v.x - rv.x, v.y - rv.y) < EPS)
  )
  return has180
}

/** Score visual quality 0–100. Returns < 40 for rejected layouts. */
export function scoreVisualQuality(
  vertices: Vertex[],
  edges: Edge[]
): number {
  let score = 100

  // 1. Edge crossings (−10 each)
  const crossings = countEdgeCrossings(vertices, edges)
  score -= crossings * 10

  // 2. Minimum vertex separation
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const d = Math.hypot(vertices[i].x - vertices[j].x, vertices[i].y - vertices[j].y)
      if (d < MIN_VERTEX_SEP) {
        score -= 25
      }
    }
  }

  // 3. Viewport margin (−15 if any vertex too close to border)
  for (const v of vertices) {
    if (
      v.x < MIN_MARGIN || v.x > VIEWBOX - MIN_MARGIN ||
      v.y < MIN_MARGIN || v.y > VIEWBOX - MIN_MARGIN
    ) {
      score -= 15
    }
  }

  // 4. Vertex spread: reward if avg pairwise distance is good
  if (vertices.length >= 3) {
    let totalDist = 0, pairs = 0
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        totalDist += Math.hypot(vertices[i].x - vertices[j].x, vertices[i].y - vertices[j].y)
        pairs++
      }
    }
    const avgDist = totalDist / pairs
    if (avgDist >= 100) score += 15
    else if (avgDist < 60) score -= 15
  }

  // 5. Symmetry bonus
  if (detectSymmetry(vertices)) score += 15

  return Math.max(0, Math.min(100, score))
}
