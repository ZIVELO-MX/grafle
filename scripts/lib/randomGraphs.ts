import type { RawGraph } from './shapes.js'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function erdosRenyi(n: number, m: number, seed = Date.now()): RawGraph | null {
  const rand = seededRandom(seed)
  const maxPossible = (n * (n - 1)) / 2
  if (m > maxPossible) return null
  if (m < n - 1) return null

  const allEdges: [number, number][] = []
  for (let i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      allEdges.push([i, j])
    }
  }

  const selected = shuffle(allEdges, rand).slice(0, m)
  const edges = selected.map(([from, to]) => ({ from, to }))

  const deg = new Map<number, number>()
  for (let v = 1; v <= n; v++) deg.set(v, 0)
  for (const e of edges) {
    deg.set(e.from, deg.get(e.from)! + 1)
    deg.set(e.to, deg.get(e.to)! + 1)
  }
  const oddCount = [...deg.values()].filter((d) => d % 2 === 1).length
  if (oddCount !== 0 && oddCount !== 2) return null

  return { vertexCount: n, edges }
}

export function erdosRenyiBypass(n: number, m: number, seed = Date.now()): RawGraph | null {
  const rand = seededRandom(seed)
  const maxPossible = (n * (n - 1)) / 2
  if (m > maxPossible) return null
  if (m < n - 1) return null

  const allEdges: [number, number][] = []
  for (let i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      allEdges.push([i, j])
    }
  }

  const selected = shuffle(allEdges, rand).slice(0, m)
  return { vertexCount: n, edges: selected.map(([from, to]) => ({ from, to })) }
}

export function wattsStrogatz(n: number, k: number, beta: number, seed = Date.now()): RawGraph | null {
  if (k >= n || k % 2 !== 0) return null

  const rand = seededRandom(seed)
  const edges: { from: number; to: number }[] = []

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const neighbor = ((i + j - 1) % n) + 1
      if (rand() < beta) {
        let target = Math.floor(rand() * n) + 1
        for (let attempts = 0; attempts < 100; attempts++) {
          if (target !== i && !edges.some((e) => (e.from === i && e.to === target) || (e.from === target && e.to === i))) break
          target = Math.floor(rand() * n) + 1
        }
        if (target !== i && !edges.some((e) => (e.from === i && e.to === target) || (e.from === target && e.to === i))) {
          edges.push({ from: i, to: target })
        } else {
          edges.push({ from: i, to: neighbor })
        }
      } else {
        edges.push({ from: i, to: neighbor })
      }
    }
  }

  const deg = new Map<number, number>()
  for (let v = 1; v <= n; v++) deg.set(v, 0)
  for (const e of edges) {
    deg.set(e.from, deg.get(e.from)! + 1)
    deg.set(e.to, deg.get(e.to)! + 1)
  }
  const oddCount = [...deg.values()].filter((d) => d % 2 === 1).length
  if (oddCount !== 0 && oddCount !== 2) return null

  return { vertexCount: n, edges }
}

export function barabasiAlbert(n: number, m0: number, m: number, seed = Date.now()): RawGraph | null {
  if (m0 < 2 || m < 1 || m >= n) return null

  const rand = seededRandom(seed)

  const edges: { from: number; to: number }[] = []

  for (let i = 1; i <= m0; i++) {
    for (let j = i + 1; j <= m0; j++) {
      edges.push({ from: i, to: j })
    }
  }

  const degrees = new Map<number, number>()
  for (let v = 1; v <= m0; v++) degrees.set(v, m0 - 1)

  for (let v = m0 + 1; v <= n; v++) {
    const totalDegree = [...degrees.values()].reduce((a, b) => a + b, 0)
    const targets = new Set<number>()
    const validTargets = [...degrees.keys()]

    const maxTargets = Math.min(m, validTargets.length)
    for (let attempt = 0; attempt < 500 && targets.size < maxTargets; attempt++) {
      const r = rand() * totalDegree
      let cumulative = 0
      for (const [vertex, deg] of degrees) {
        cumulative += deg
        if (r <= cumulative && !targets.has(vertex)) {
          targets.add(vertex)
          break
        }
      }
    }

    for (const t of targets) {
      edges.push({ from: v, to: t })
      degrees.set(v, (degrees.get(v) ?? 0) + 1)
      degrees.set(t, (degrees.get(t) ?? 0) + 1)
    }
  }

  const deg = new Map<number, number>()
  for (let v = 1; v <= n; v++) deg.set(v, 0)
  for (const e of edges) {
    deg.set(e.from, deg.get(e.from)! + 1)
    deg.set(e.to, deg.get(e.to)! + 1)
  }
  const oddCount = [...deg.values()].filter((d) => d % 2 === 1).length
  if (oddCount !== 0 && oddCount !== 2) return null

  return { vertexCount: n, edges }
}

export function randomRegular(n: number, d: number, seed = Date.now()): RawGraph | null {
  if (n * d % 2 !== 0) return null
  if (d >= n) return null
  if (d === 0) return { vertexCount: n, edges: [] }

  const rand = seededRandom(seed)

  for (let attempt = 0; attempt < 200; attempt++) {
    let vertices: number[] = []
    for (let v = 1; v <= n; v++) {
      for (let j = 0; j < d; j++) vertices.push(v)
    }
    vertices = shuffle(vertices, rand)

    const edges: { from: number; to: number }[] = []
    const adj = new Map<number, Set<number>>()
    for (let v = 1; v <= n; v++) adj.set(v, new Set())
    let success = true

    for (let i = 0; i < vertices.length; i += 2) {
      const u = vertices[i]
      const v = vertices[i + 1]
      if (u === v || adj.get(u)!.has(v)) {
        success = false
        break
      }
      if (adj.get(u)!.size >= d || adj.get(v)!.size >= d) {
        success = false
        break
      }
      edges.push({ from: u, to: v })
      adj.get(u)!.add(v)
      adj.get(v)!.add(u)
    }

    if (success && edges.length === (n * d) / 2) {
      return { vertexCount: n, edges }
    }
  }

  return null
}

export function randomTree(n: number, seed = Date.now()): RawGraph {
  const rand = seededRandom(seed)
  const edges: { from: number; to: number }[] = []
  for (let i = 2; i <= n; i++) {
    const parent = Math.floor(rand() * (i - 1)) + 1
    edges.push({ from: parent, to: i })
  }
  return { vertexCount: n, edges }
}

export function randomBipartite(n1: number, n2: number, p: number, seed = Date.now()): RawGraph | null {
  const rand = seededRandom(seed)
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= n1; i++) {
    for (let j = 1; j <= n2; j++) {
      if (rand() < p) {
        edges.push({ from: i, to: n1 + j })
      }
    }
  }
  if (edges.length < n1 + n2 - 1) return null

  const deg = new Map<number, number>()
  for (let v = 1; v <= n1 + n2; v++) deg.set(v, 0)
  for (const e of edges) {
    deg.set(e.from, deg.get(e.from)! + 1)
    deg.set(e.to, deg.get(e.to)! + 1)
  }
  const oddCount = [...deg.values()].filter((d) => d % 2 === 1).length
  if (oddCount !== 0 && oddCount !== 2) return null

  return { vertexCount: n1 + n2, edges }
}

export function randomMaximalPlanar(n: number, seed = Date.now()): RawGraph | null {
  if (n < 3) return null
  const rand = seededRandom(seed)
  const edges: { from: number; to: number }[] = []
  edges.push({ from: 1, to: 2 })
  edges.push({ from: 2, to: 3 })
  edges.push({ from: 3, to: 1 })

  for (let v = 4; v <= n; v++) {
    const faceEdges = edges.filter((e) => e.from < v && e.to < v)
    if (faceEdges.length === 0) continue
    const picked = faceEdges[Math.floor(rand() * faceEdges.length)]
    edges.push({ from: picked.from, to: v })
    edges.push({ from: picked.to, to: v })
  }

  const deg = new Map<number, number>()
  for (let v = 1; v <= n; v++) deg.set(v, 0)
  for (const e of edges) {
    deg.set(e.from, deg.get(e.from)! + 1)
    deg.set(e.to, deg.get(e.to)! + 1)
  }
  const oddCount = [...deg.values()].filter((d) => d % 2 === 1).length
  if (oddCount !== 0 && oddCount !== 2) return null

  return { vertexCount: n, edges }
}
