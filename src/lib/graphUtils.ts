import type { Vertex, Edge } from '../types'

export function getVertexDegrees(vertices: Vertex[], edges: Edge[]): Map<number, number> {
  const degrees = new Map<number, number>()
  for (const v of vertices) degrees.set(v.id, 0)
  for (const e of edges) {
    degrees.set(e.from, (degrees.get(e.from) ?? 0) + 1)
    degrees.set(e.to, (degrees.get(e.to) ?? 0) + 1)
  }
  return degrees
}

export function oddDegreeVertices(vertices: Vertex[], edges: Edge[]): number[] {
  const degrees = getVertexDegrees(vertices, edges)
  return [...degrees.entries()].filter(([, d]) => d % 2 !== 0).map(([id]) => id)
}

function isConnected(vertices: Vertex[], edges: Edge[]): boolean {
  if (vertices.length === 0) return true
  if (edges.length === 0) return vertices.length <= 1

  const adj = new Map<number, Set<number>>()
  for (const v of vertices) adj.set(v.id, new Set())
  for (const e of edges) {
    adj.get(e.from)?.add(e.to)
    adj.get(e.to)?.add(e.from)
  }

  const visited = new Set<number>()
  const stack = [vertices[0].id]
  while (stack.length > 0) {
    const v = stack.pop()!
    if (visited.has(v)) continue
    visited.add(v)
    for (const neighbor of adj.get(v) ?? []) {
      if (!visited.has(neighbor)) stack.push(neighbor)
    }
  }

  return visited.size === vertices.length
}

export function isSolvable(vertices: Vertex[], edges: Edge[]): boolean {
  if (edges.length === 0) return true
  if (!isConnected(vertices, edges)) return false
  const odd = oddDegreeVertices(vertices, edges)
  return odd.length === 0 || odd.length === 2
}

export function findEdgeBetween(
  from: number,
  to: number,
  edges: Edge[],
  usedEdgeIds: Set<number>
): Edge | null {
  return (
    edges.find(
      (e) =>
        !usedEdgeIds.has(e.id) &&
        ((e.from === from && e.to === to) || (e.from === to && e.to === from))
    ) ?? null
  )
}

export function getUnusedAdjacentEdges(
  vertexId: number,
  edges: Edge[],
  usedEdgeIds: Set<number>
): Edge[] {
  return edges.filter(
    (e) =>
      !usedEdgeIds.has(e.id) && (e.from === vertexId || e.to === vertexId)
  )
}
