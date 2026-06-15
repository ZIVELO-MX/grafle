interface SimpleEdge {
  id: number
  from: number
  to: number
}

/**
 * Hierholzer's algorithm for finding an Eulerian path or circuit.
 * Returns the vertex sequence (officialSolution) or null if not Eulerian.
 */
export function findEulerianPath(
  vertexIds: number[],
  edges: SimpleEdge[]
): number[] | null {
  if (edges.length === 0) return vertexIds.length <= 1 ? [...vertexIds] : null

  // Compute degrees
  const degree = new Map<number, number>()
  for (const v of vertexIds) degree.set(v, 0)
  for (const e of edges) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1)
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1)
  }

  const oddVertices = vertexIds.filter((v) => (degree.get(v) ?? 0) % 2 === 1)
  if (oddVertices.length !== 0 && oddVertices.length !== 2) return null

  const start = oddVertices.length === 2 ? oddVertices[0] : vertexIds[0]

  // Build adjacency list: each entry is {to, edgeId}
  const adj = new Map<number, { to: number; edgeId: number }[]>()
  for (const v of vertexIds) adj.set(v, [])
  for (const e of edges) {
    adj.get(e.from)!.push({ to: e.to, edgeId: e.id })
    adj.get(e.to)!.push({ to: e.from, edgeId: e.id })
  }

  const usedEdges = new Set<number>()
  const path: number[] = []
  const stack: number[] = [start]

  while (stack.length > 0) {
    const v = stack[stack.length - 1]
    const neighbors = adj.get(v)!
    // Find next unused edge
    let found = false
    while (neighbors.length > 0) {
      const next = neighbors[neighbors.length - 1]
      if (usedEdges.has(next.edgeId)) {
        neighbors.pop()
        continue
      }
      usedEdges.add(next.edgeId)
      neighbors.pop()
      stack.push(next.to)
      found = true
      break
    }
    if (!found) {
      path.push(stack.pop()!)
    }
  }

  // Validate: must have used all edges and path length = edges.length + 1
  if (usedEdges.size !== edges.length) return null
  if (path.length !== edges.length + 1) return null

  return path.reverse()
}
