export interface RawGraph {
  vertexCount: number
  edges: { from: number; to: number }[] // 1-based vertex IDs
}

/** P_n: linear path, n vertices, n-1 edges. 2 odd-degree endpoints. */
export function pathGraph(n: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i < n; i++) edges.push({ from: i, to: i + 1 })
  return { vertexCount: n, edges }
}

/** C_n: cycle, n vertices, n edges. All degree 2 → Eulerian circuit. */
export function cycleGraph(n: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= n; i++) edges.push({ from: i, to: (i % n) + 1 })
  return { vertexCount: n, edges }
}

/**
 * Theta graph: vertices 1 and 2 connected by 3 internally-disjoint paths of
 * lengths k1, k2, k3. Total vertices = 2 + (k1-1) + (k2-1) + (k3-1).
 * Eulerian iff degree of endpoints is even (each has degree 3 if all ki≥1,
 * so NOT Eulerian unless modified) — validate externally.
 */
export function thetaGraph(k1: number, k2: number, k3: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  let nextId = 3

  function addPath(start: number, end: number, internalCount: number) {
    let prev = start
    for (let i = 0; i < internalCount; i++) {
      const cur = nextId++
      edges.push({ from: prev, to: cur })
      prev = cur
    }
    edges.push({ from: prev, to: end })
  }

  const internal1 = k1 - 1
  const internal2 = k2 - 1
  const internal3 = k3 - 1
  const totalVertices = 2 + internal1 + internal2 + internal3

  addPath(1, 2, internal1)
  addPath(1, 2, internal2)
  addPath(1, 2, internal3)

  return { vertexCount: totalVertices, edges }
}

/**
 * Lollipop graph: C_n cycle (vertices 1..n) + path P_k attached at vertex 1.
 * Path vertices: n+1, n+2, ..., n+k-1 (k-1 new vertices).
 * Eulerian path possible when exactly 2 odd-degree vertices exist.
 */
export function lollipopGraph(n: number, k: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  // Cycle
  for (let i = 1; i <= n; i++) edges.push({ from: i, to: (i % n) + 1 })
  // Tail attached at vertex 1
  let prev = 1
  for (let j = 0; j < k - 1; j++) {
    const cur = n + 1 + j
    edges.push({ from: prev, to: cur })
    prev = cur
  }
  return { vertexCount: n + k - 1, edges }
}

/**
 * Wheel graph: center vertex (id=1) + C_n rim (vertices 2..n+1).
 * Center has degree n. Rim vertices have degree 3.
 * Eulerian circuit iff n is even (center degree even, rim degrees all 3 = odd → NOT circuit).
 * Actually wheel is Eulerian iff all degrees even → n even AND rim degree even → impossible
 * since rim degree = 3 always. So wheel is never Eulerian circuit.
 * BUT wheel has Eulerian PATH if exactly 2 odd-degree vertices:
 *   center degree = n (odd iff n is odd)
 *   rim degree = 3 (always odd)
 * With n rim vertices all odd + center possibly odd → n+1 or n odd-degree vertices.
 * For Eulerian path need exactly 2 odd vertices. Needs n rim vertices to be even (all have
 * degree 3 = odd) → impossible since 3 is always odd. So pure wheel is never Eulerian.
 *
 * Modified wheel: add extra chord to make things work. Or just return and let validate catch.
 * We return it and validate externally.
 */
export function wheelGraph(n: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  // Spokes: center=1 connects to rim vertices 2..n+1
  for (let i = 2; i <= n + 1; i++) edges.push({ from: 1, to: i })
  // Rim cycle
  for (let i = 2; i <= n + 1; i++) edges.push({ from: i, to: (i % (n + 1)) + 2 > n + 1 ? 2 : (i % n) + 2 })
  return { vertexCount: n + 1, edges }
}

/** Fixed wheel: rim cycle for wheelGraph */
export function wheelGraphFixed(n: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 2; i <= n + 1; i++) edges.push({ from: 1, to: i })
  for (let i = 0; i < n; i++) edges.push({ from: i + 2, to: ((i + 1) % n) + 2 })
  return { vertexCount: n + 1, edges }
}

/**
 * Ladder graph: two parallel paths of length n, connected by n rungs.
 * Vertices: top row 1..n, bottom row n+1..2n.
 * Edges: top path + bottom path + rungs.
 * Endpoints (1, n, n+1, 2n) have degree 2; intermediate vertices have degree 3.
 * Corner vertices have degree 2 (even), intermediate have degree 3 (odd).
 * For n=2: all vertices degree 2 → Eulerian circuit. For n>2: 2*(n-2) odd vertices → not Eulerian.
 * So we only use n=2 (square) or add modifications.
 */
export function ladderGraph(n: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  // Top path
  for (let i = 1; i < n; i++) edges.push({ from: i, to: i + 1 })
  // Bottom path
  for (let i = n + 1; i < 2 * n; i++) edges.push({ from: i, to: i + 1 })
  // Rungs
  for (let i = 1; i <= n; i++) edges.push({ from: i, to: i + n })
  return { vertexCount: 2 * n, edges }
}

/**
 * Prism graph (Y_n = C_n × K_2): two n-cycles connected by n rungs.
 * Top: 1..n, Bottom: n+1..2n.
 * All vertices have degree 3 → Eulerian iff 0 odd-degree vertices → never (all are odd).
 * So prism is impossible. Valid for impossible puzzles.
 */
export function prismGraph(n: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  // Top cycle
  for (let i = 1; i <= n; i++) edges.push({ from: i, to: (i % n) + 1 })
  // Bottom cycle
  for (let i = n + 1; i <= 2 * n; i++) edges.push({ from: i, to: ((i - n) % n) + n + 1 })
  // Rungs
  for (let i = 1; i <= n; i++) edges.push({ from: i, to: i + n })
  return { vertexCount: 2 * n, edges }
}

/**
 * Double star: two hubs (1 and 2) each connected to k leaves, plus connected to each other.
 * Hub degrees = k+1 each. Leaves degree = 1 each.
 * Odd-degree vertices: both hubs (if k+1 is odd → k is even) + all 2k leaves.
 * Total odd = 2k + 2 (if k even) or 2k (if k odd).
 * For Eulerian path: need exactly 2 odd vertices.
 * If k=1: hubs degree 2 (even), leaves degree 1 (odd) → 2 odd vertices → Eulerian path!
 * If k=2: hubs degree 3 (odd), leaves degree 1 (odd) → 2+4=6 odd vertices → impossible.
 */
export function doubleStarGraph(k: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  // Hub-to-hub
  edges.push({ from: 1, to: 2 })
  // Hub 1 leaves: 3, 4, ..., k+2
  for (let i = 0; i < k; i++) edges.push({ from: 1, to: 3 + i })
  // Hub 2 leaves: k+3, k+4, ..., 2k+2
  for (let i = 0; i < k; i++) edges.push({ from: 2, to: k + 3 + i })
  return { vertexCount: 2 + 2 * k, edges }
}

/**
 * Star graph: center (1) connected to k leaves.
 * Center degree = k, leaf degree = 1.
 * Impossible if k is odd (center + all k leaves = k+1 odd-degree vertices, ≠ 0 or 2).
 * Solvable if k=2 (path) — trivial. Not useful as star for k=2, use pathGraph instead.
 */
export function starGraph(k: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 2; i <= k + 1; i++) edges.push({ from: 1, to: i })
  return { vertexCount: k + 1, edges }
}

/**
 * Book graph B_k: k triangles sharing a common edge (spine 1-2).
 * Vertices: 1, 2, then k apex vertices 3..k+2.
 * Each apex connects to both 1 and 2.
 * Degrees: 1 and 2 have degree k+1 each. Apex vertices have degree 2.
 * If k is odd: 1 and 2 are odd → exactly 2 odd → Eulerian path!
 * If k is even: 1 and 2 are even → 0 odd → Eulerian circuit!
 */
export function bookGraph(k: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  edges.push({ from: 1, to: 2 }) // spine
  for (let i = 3; i <= k + 2; i++) {
    edges.push({ from: 1, to: i })
    edges.push({ from: 2, to: i })
  }
  return { vertexCount: k + 2, edges }
}

/**
 * Friendship graph F_k: k triangles sharing a common center vertex.
 * Center (1) connected to k pairs (2,3), (4,5), ..., (2k, 2k+1).
 * Center degree = 2k (even). Outer vertices degree = 2 (even) → Eulerian circuit!
 * Plus each pair is also connected: (2,3), (4,5), etc.
 */
export function friendshipGraph(k: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 0; i < k; i++) {
    const a = 2 + 2 * i
    const b = 3 + 2 * i
    edges.push({ from: 1, to: a })
    edges.push({ from: 1, to: b })
    edges.push({ from: a, to: b })
  }
  return { vertexCount: 2 * k + 1, edges }
}

/**
 * Möbius-Kantor inspired: two C_n with cross-connections.
 * For variety in hard puzzles. n must be even for Eulerian properties.
 */
export function doubleWheelGraph(n: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  // Two centers: 1 and 2
  // Inner ring: 3..n+2
  // Outer ring: n+3..2n+2
  // Center 1 to inner ring
  for (let i = 3; i <= n + 2; i++) edges.push({ from: 1, to: i })
  // Center 2 to outer ring
  for (let i = n + 3; i <= 2 * n + 2; i++) edges.push({ from: 2, to: i })
  // Inner cycle
  for (let i = 0; i < n; i++) edges.push({ from: 3 + i, to: 3 + ((i + 1) % n) })
  // Outer cycle
  for (let i = 0; i < n; i++) edges.push({ from: n + 3 + i, to: n + 3 + ((i + 1) % n) })
  // Connect inner to outer
  for (let i = 0; i < n; i++) edges.push({ from: 3 + i, to: n + 3 + i })
  return { vertexCount: 2 * n + 2, edges }
}

/** Grid graph (rows × cols). Interior vertices have degree 4, edge=3, corner=2. */
export function gridGraph(rows: number, cols: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  const id = (r: number, c: number) => r * cols + c + 1
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) edges.push({ from: id(r, c), to: id(r, c + 1) })
      if (r + 1 < rows) edges.push({ from: id(r, c), to: id(r + 1, c) })
    }
  }
  return { vertexCount: rows * cols, edges }
}

/** Petersen-like: outer C_5 + inner pentagram + 5 spokes */
export function petersenLike(): RawGraph {
  const edges: { from: number; to: number }[] = []
  // Outer: 1-2-3-4-5-1
  for (let i = 1; i <= 5; i++) edges.push({ from: i, to: (i % 5) + 1 })
  // Inner star: 6-8-10-7-9-6 (connects every other)
  const inner = [6, 7, 8, 9, 10]
  for (let i = 0; i < 5; i++) edges.push({ from: inner[i], to: inner[(i + 2) % 5] })
  // Spokes
  for (let i = 0; i < 5; i++) edges.push({ from: i + 1, to: inner[i] })
  return { vertexCount: 10, edges }
}
