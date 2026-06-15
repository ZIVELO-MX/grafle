interface SimpleEdge { from: number; to: number }

/**
 * Compute a canonical graph signature for duplicate detection.
 * Based on degree sequence + neighborhood degree multisets.
 * Catches exact duplicates and most common isomorphs.
 */
export function graphSignature(vertexIds: number[], edges: SimpleEdge[]): string {
  // Compute degrees
  const degree = new Map<number, number>()
  for (const v of vertexIds) degree.set(v, 0)
  for (const e of edges) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1)
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1)
  }

  // Build adjacency list
  const adj = new Map<number, number[]>()
  for (const v of vertexIds) adj.set(v, [])
  for (const e of edges) {
    adj.get(e.from)!.push(e.to)
    adj.get(e.to)!.push(e.from)
  }

  // For each vertex, compute sorted neighbor degree sequence
  const vertexSigs: string[] = []
  for (const v of vertexIds) {
    const d = degree.get(v) ?? 0
    const neighborDegrees = (adj.get(v) ?? [])
      .map((nb) => degree.get(nb) ?? 0)
      .sort((a, b) => a - b)
    vertexSigs.push(`${d}:[${neighborDegrees.join(',')}]`)
  }

  // Sort vertex signatures to make it order-independent
  vertexSigs.sort()

  // Top-level: edgeCount + sorted vertex signatures
  return `e${edges.length}|${vertexSigs.join('|')}`
}

/** Check if a candidate graph is a duplicate of any puzzle in the catalog */
export function isDuplicate(
  sig: string,
  knownSignatures: Set<string>
): boolean {
  return knownSignatures.has(sig)
}
