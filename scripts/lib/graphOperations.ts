import type { RawGraph } from './shapes.js'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function clone(g: RawGraph): RawGraph {
  return {
    vertexCount: g.vertexCount,
    edges: g.edges.map((e) => ({ from: e.from, to: e.to })),
  }
}

function sanitize(g: RawGraph): RawGraph {
  const n = g.vertexCount
  const edges = g.edges.filter((e) => e.from >= 1 && e.from <= n && e.to >= 1 && e.to <= n && e.from !== e.to)
  const used = new Set<number>()
  for (const e of edges) { used.add(e.from); used.add(e.to) }
  return { vertexCount: n, edges }
}

export function subdivideEdge(g: RawGraph, seed = Date.now()): RawGraph | null {
  if (g.edges.length === 0) return null
  const rand = seededRandom(seed)
  const result = clone(g)
  const idx = Math.floor(rand() * result.edges.length)
  const edge = result.edges[idx]
  const newVertex = ++result.vertexCount
  result.edges.splice(idx, 1)
  result.edges.push({ from: edge.from, to: newVertex })
  result.edges.push({ from: newVertex, to: edge.to })
  return result
}

export function addRandomChord(g: RawGraph, seed = Date.now()): RawGraph | null {
  const rand = seededRandom(seed)
  const result = sanitize(clone(g))
  const adj = new Map<number, Set<number>>()
  for (let v = 1; v <= result.vertexCount; v++) adj.set(v, new Set())
  for (const e of result.edges) {
    adj.get(e.from)!.add(e.to)
    adj.get(e.to)!.add(e.from)
  }
  const candidates: [number, number][] = []
  for (let i = 1; i <= result.vertexCount; i++) {
    for (let j = i + 1; j <= result.vertexCount; j++) {
      if (!adj.get(i)!.has(j)) candidates.push([i, j])
    }
  }
  if (candidates.length === 0) return null
  const [from, to] = candidates[Math.floor(rand() * candidates.length)]
  result.edges.push({ from, to })
  return result
}

export function removeRandomEdge(g: RawGraph, seed = Date.now()): RawGraph | null {
  if (g.edges.length <= g.vertexCount - 1) return null
  const rand = seededRandom(seed)
  const result = clone(g)
  const idx = Math.floor(rand() * result.edges.length)
  result.edges.splice(idx, 1)
  return result
}

export function cartesianProduct(g1: RawGraph, g2: RawGraph): RawGraph {
  const n1 = g1.vertexCount
  const n2 = g2.vertexCount
  const edges: { from: number; to: number }[] = []
  const id = (a: number, b: number) => a * n2 + b + 1

  for (const e of g1.edges) {
    for (let b = 0; b < n2; b++) {
      edges.push({ from: id(e.from - 1, b), to: id(e.to - 1, b) })
    }
  }
  for (const e of g2.edges) {
    for (let a = 0; a < n1; a++) {
      edges.push({ from: id(a, e.from - 1), to: id(a, e.to - 1) })
    }
  }
  return { vertexCount: n1 * n2, edges }
}

export function graphJoin(g1: RawGraph, g2: RawGraph): RawGraph {
  const n1 = g1.vertexCount
  const n2 = g2.vertexCount
  const edges: { from: number; to: number }[] = []
  const remap = (v: number, offset: number) => v + offset
  for (const e of g1.edges) edges.push({ from: remap(e.from, 0), to: remap(e.to, 0) })
  for (const e of g2.edges) edges.push({ from: remap(e.from, n1), to: remap(e.to, n1) })
  for (let i = 1; i <= n1; i++) {
    for (let j = 1; j <= n2; j++) {
      edges.push({ from: i, to: n1 + j })
    }
  }
  return { vertexCount: n1 + n2, edges }
}

export function vertexSplit(g: RawGraph, seed = Date.now()): RawGraph | null {
  if (g.edges.length === 0 || g.vertexCount < 2) return null
  const rand = seededRandom(seed)
  const result = clone(g)
  const v = Math.floor(rand() * result.vertexCount) + 1
  const incident = result.edges.filter((e) => e.from === v || e.to === v)
  if (incident.length < 2) return null

  const k = Math.max(1, Math.floor(incident.length / 2))
  const newVertex = ++result.vertexCount

  for (let i = 0; i < k; i++) {
    const eIdx = result.edges.findIndex((e) => e.from === incident[i].from && e.to === incident[i].to)
    if (eIdx === -1) continue
    const e = result.edges[eIdx]
    if (e.from === v) {
      result.edges[eIdx] = { from: newVertex, to: e.to }
    } else {
      result.edges[eIdx] = { from: e.from, to: newVertex }
    }
  }

  return result
}

export function addLeaf(g: RawGraph, seed = Date.now()): RawGraph {
  const rand = seededRandom(seed)
  const result = clone(g)
  const newVertex = ++result.vertexCount
  const attachTo = Math.floor(rand() * (result.vertexCount - 1)) + 1
  result.edges.push({ from: attachTo, to: newVertex })
  return result
}

export function addPathBetween(g: RawGraph, seed = Date.now()): RawGraph | null {
  const rand = seededRandom(seed)
  const result = clone(g)
  const adj = new Map<number, Set<number>>()
  for (let v = 1; v <= result.vertexCount; v++) adj.set(v, new Set())
  for (const e of result.edges) {
    adj.get(e.from)!.add(e.to)
    adj.get(e.to)!.add(e.from)
  }
  const candidates: [number, number][] = []
  for (let i = 1; i <= result.vertexCount; i++) {
    for (let j = i + 1; j <= result.vertexCount; j++) {
      if (!adj.get(i)!.has(j)) candidates.push([i, j])
    }
  }
  if (candidates.length === 0) return null
  const [from, to] = candidates[Math.floor(rand() * candidates.length)]
  const pathLen = Math.floor(rand() * 3) + 1
  let prev = from
  for (let i = 0; i < pathLen; i++) {
    const mid = ++result.vertexCount
    result.edges.push({ from: prev, to: mid })
    prev = mid
  }
  result.edges.push({ from: prev, to })
  return result
}

export function dualGraph(g: RawGraph): RawGraph | null {
  const adj = new Map<number, Set<number>>()
  for (let v = 1; v <= g.vertexCount; v++) adj.set(v, new Set())
  for (const e of g.edges) {
    adj.get(e.from)!.add(e.to)
    adj.get(e.to)!.add(e.from)
  }
  const faces: number[][] = findFaces(g, adj)
  if (!faces || faces.length < 2) return null
  const faceMap = new Map<string, number>()
  const dualEdges: { from: number; to: number }[] = []
  let faceId = 1
  for (const e of g.edges) {
    const f1 = faceIndex(faces, e)
    if (f1 === -1) continue
    const reversed = { from: e.to, to: e.from }
    const f2 = faceIndex(faces, reversed)
    if (f2 === -1) continue
    if (f1 >= 0 && f2 >= 0 && f1 !== f2) {
      const key1 = `${f1}:${f2}`
      const key2 = `${f2}:${f1}`
      if (!faceMap.has(key1) && !faceMap.has(key2)) {
        faceMap.set(key1, faceId)
        dualEdges.push({ from: f1 + 1, to: f2 + 1 })
      }
    }
  }
  if (dualEdges.length === 0) return null
  return { vertexCount: faces.length, edges: dualEdges }
}

function findFaces(g: RawGraph, adj: Map<number, Set<number>>): number[][] {
  const used = new Set<string>()
  const faces: number[][] = []
  for (const e of g.edges) {
    const key = `${e.from}-${e.to}`
    if (used.has(key)) continue
    const face: number[] = []
    let cur = e.from
    let prev = e.to
    while (true) {
      face.push(cur)
      const edgeKey = `${cur}-${prev}`
      const reverseKey = `${prev}-${cur}`
      used.add(edgeKey)
      used.add(reverseKey)
      const neighbors = [...(adj.get(prev) || [])]
      const idx = neighbors.indexOf(cur)
      const nextNb = neighbors[(idx + 1) % neighbors.length]
      cur = prev
      prev = nextNb
      if (cur === e.from && prev === e.to) break
      if (face.length > g.edges.length + 1) break
    }
    if (face.length >= 3) faces.push(face)
  }
  return faces.length > 0 ? faces : []
}

function faceIndex(faces: number[][], edge: { from: number; to: number }): number {
  for (let i = 0; i < faces.length; i++) {
    for (let j = 0; j < faces[i].length; j++) {
      const a = faces[i][j]
      const b = faces[i][(j + 1) % faces[i].length]
      if (a === edge.from && b === edge.to) return i
    }
  }
  return -1
}
