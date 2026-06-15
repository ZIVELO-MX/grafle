/**
 * Grafle Puzzle Generator v2 — Real Graph Engine
 * Run: npm run generate
 * Output: src/data/puzzles.ts
 *
 * Generates puzzles from:
 *   - Classic named graphs (Petersen, Chvátal, Wagner, etc.)
 *   - Random graph models (Erdős–Rényi, Watts–Strogatz, Barabási–Albert)
 *   - Graph operations (subdivision, chord addition, products)
 *   - Classical geometric shapes (cycles, theta, book, friendship, etc.)
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

import { findEulerianPath } from './lib/eulerianSolver.js'
import {
  pathGraph, cycleGraph, thetaGraph, lollipopGraph, wheelGraphFixed,
  ladderGraph, prismGraph, doubleStarGraph, bookGraph, friendshipGraph,
  petersenLike, doubleWheelGraph, gridGraph, starGraph,
} from './lib/shapes.js'
import {
  circularLayout, hubAndRim, doubleRowLayout,
  thetaLayout, lollipopLayout, bookLayout, friendshipLayout,
  petersenLayout, doubleWheelLayout, gridLayout, customLayout,
  starLayout,
} from './lib/layout.js'
import { forceDirectedLayout } from './lib/forceLayout.js'
import { erdosRenyi, wattsStrogatz, barabasiAlbert, randomRegular, randomBipartite } from './lib/randomGraphs.js'
import {
  petersenGraph, petersenStar, completeGraph, completeBipartiteGraph, cubeGraph,
  octahedronGraph, utilityGraph, wagnerGraph, chvatalGraph, herschelGraph,
  franklinGraph, mobiusKantorGraph, pappusGraph, desarguesGraph,
  grotzschGraph, folkmanGraph, coxeterGraph, hypercubeGraph, robertsonGraph,
} from './lib/classicGraphs.js'
import { addRandomChord, vertexSplit, cartesianProduct, graphJoin } from './lib/graphOperations.js'
import { graphSignature, isDuplicate } from './lib/isomorphism.js'
import { scoreVisualQuality } from './lib/quality.js'

interface Vertex { id: number; x: number; y: number }
interface Edge { id: number; from: number; to: number; curve?: number }

type Difficulty = 'easy' | 'hard'

function computeComplexity(vertexIds: number[], edges: { from: number; to: number }[]): number {
  const n = vertexIds.length
  const e = edges.length
  if (n === 0 || e === 0) return 0
  const deg = getVertexDegrees(vertexIds, edges)
  const maxDeg = Math.max(...deg.values())
  const branchNodes = [...deg.values()].filter((d) => d >= 3).length
  const cyclomatic = e - n + 1
  const density = e / n

  let score = 0
  score += density * 8
  score += branchNodes * 2.5
  score += Math.max(0, maxDeg - 3) * 4
  score += cyclomatic * 2
  score += Math.log2(n) * 3
  return Math.round(score * 10) / 10
}

interface GeneratedPuzzle {
  id: number
  difficulty: Difficulty
  solvable: boolean
  vertices: Vertex[]
  edges: Edge[]
  officialSolution?: number[]
  _qualityScore?: number
  _label?: string
  _family?: string
  _complexity?: number
}

interface RawGraph {
  vertexCount: number
  edges: { from: number; to: number }[]
}

interface Pt { x: number; y: number }

function getVertexDegrees(vertexIds: number[], edges: { from: number; to: number }[]) {
  const deg = new Map<number, number>()
  for (const v of vertexIds) deg.set(v, 0)
  for (const e of edges) {
    deg.set(e.from, (deg.get(e.from) ?? 0) + 1)
    deg.set(e.to, (deg.get(e.to) ?? 0) + 1)
  }
  return deg
}

function isConnected(vertexIds: number[], edges: { from: number; to: number }[]): boolean {
  if (vertexIds.length === 0) return true
  if (edges.length === 0) return vertexIds.length <= 1
  const adj = new Map<number, Set<number>>()
  for (const v of vertexIds) adj.set(v, new Set())
  for (const e of edges) {
    adj.get(e.from)?.add(e.to)
    adj.get(e.to)?.add(e.from)
  }
  const visited = new Set<number>()
  const stack = [vertexIds[0]]
  while (stack.length > 0) {
    const v = stack.pop()!
    if (visited.has(v)) continue
    visited.add(v)
    for (const nb of adj.get(v) ?? []) if (!visited.has(nb)) stack.push(nb)
  }
  return visited.size === vertexIds.length
}

function isSolvable(vertexIds: number[], edges: { from: number; to: number }[]): boolean {
  if (edges.length === 0) return true
  if (!isConnected(vertexIds, edges)) return false
  const deg = getVertexDegrees(vertexIds, edges)
  const oddCount = [...deg.values()].filter((d) => d % 2 !== 0).length
  return oddCount === 0 || oddCount === 2
}

function normalizeGraph(raw: RawGraph): RawGraph {
  const usedVertices = new Set<number>()
  for (const e of raw.edges) {
    usedVertices.add(e.from)
    usedVertices.add(e.to)
  }
  const maxVertex = Math.max(...usedVertices, 0)
  if (maxVertex > raw.vertexCount || usedVertices.size !== raw.vertexCount) {
    const sorted = [...usedVertices].sort((a, b) => a - b)
    const remap = new Map<number, number>()
    sorted.forEach((v, i) => remap.set(v, i + 1))
    return {
      vertexCount: sorted.length,
      edges: raw.edges.map((e) => ({
        from: remap.get(e.from)!,
        to: remap.get(e.to)!,
      })),
    }
  }
  return raw
}

function alwaysNormalize(raw: RawGraph): RawGraph {
  const n = raw.vertexCount
  const edges = raw.edges.filter((e) => e.from >= 1 && e.from <= n && e.to >= 1 && e.to <= n)
  const used = new Set<number>()
  for (const e of edges) { used.add(e.from); used.add(e.to) }
  if (used.size !== n || edges.length !== raw.edges.length) {
    return normalizeGraph({ vertexCount: n, edges })
  }
  return { vertexCount: n, edges }
}

interface Candidate {
  raw: RawGraph
  pts: Pt[]
  label: string
}

function repairProximity(verts: Pt[], margin = 35, minDist = 50): Pt[] {
  const pts: Pt[] = verts.map((p) => ({ x: p.x, y: p.y }))
  const W = 400, H = 400
  for (let iter = 0; iter < 30; iter++) {
    let moved = false
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x
        const dy = pts[i].y - pts[j].y
        const dist = Math.hypot(dx, dy)
        if (dist < minDist && dist > 0.01) {
          const push = (minDist - dist) / 2
          const nx = (dx / dist) * push
          const ny = (dy / dist) * push
          pts[i].x = Math.max(margin, Math.min(W - margin, pts[i].x + nx))
          pts[i].y = Math.max(margin, Math.min(H - margin, pts[i].y + ny))
          pts[j].x = Math.max(margin, Math.min(W - margin, pts[j].x - nx))
          pts[j].y = Math.max(margin, Math.min(H - margin, pts[j].y - ny))
          moved = true
        }
      }
    }
    if (!moved) break
  }
  return pts
}

function repairEdgeProximity(verts: Pt[], edges: { from: number; to: number }[], minDist = 22, margin = 35): Pt[] {
  const pts: Pt[] = verts.map((p) => ({ x: p.x, y: p.y }))
  const lo = margin, hi = 400 - margin
  for (let iter = 0; iter < 30; iter++) {
    let moved = false
    for (const e of edges) {
      const i1 = e.from - 1, i2 = e.to - 1
      const dx = pts[i2].x - pts[i1].x, dy = pts[i2].y - pts[i1].y
      const len2 = dx * dx + dy * dy
      if (len2 < 1) continue
      for (let vi = 0; vi < pts.length; vi++) {
        if (vi === i1 || vi === i2) continue
        const origX = pts[vi].x, origY = pts[vi].y
        if (origX < lo || origX > hi || origY < lo || origY > hi) continue
        const t = Math.max(0, Math.min(1, ((origX - pts[i1].x) * dx + (origY - pts[i1].y) * dy) / len2))
        const projX = pts[i1].x + t * dx, projY = pts[i1].y + t * dy
        const dist = Math.hypot(origX - projX, origY - projY)
        if (dist >= minDist) continue
        const push = (minDist - dist) + 8
        const nx = origX - projX, ny = origY - projY
        const nd = Math.hypot(nx, ny)
        if (nd > 0.01) {
          pts[vi].x = Math.max(lo, Math.min(hi, origX + (nx / nd) * push))
          pts[vi].y = Math.max(lo, Math.min(hi, origY + (ny / nd) * push))
        }
        const actualMove = Math.hypot(pts[vi].x - origX, pts[vi].y - origY)
        if (actualMove < push * 0.5) {
          const shift = push * 1.5
          const perpX = pts[i2].y - pts[i1].y, perpY = pts[i1].x - pts[i2].x
          const perpLen = Math.hypot(perpX, perpY)
          if (perpLen > 0.01) {
            let dir: number
            if (nd > 0.01) {
              dir = (nx * perpX + ny * perpY) >= 0 ? -1 : 1
            } else {
              const towardCenter = (200 - origX) * perpX + (200 - origY) * perpY
              dir = towardCenter >= 0 ? 1 : -1
            }
            pts[i1].x = Math.max(lo, Math.min(hi, pts[i1].x + dir * (perpX / perpLen) * shift))
            pts[i1].y = Math.max(lo, Math.min(hi, pts[i1].y + dir * (perpY / perpLen) * shift))
            pts[i2].x = Math.max(lo, Math.min(hi, pts[i2].x + dir * (perpX / perpLen) * shift))
            pts[i2].y = Math.max(lo, Math.min(hi, pts[i2].y + dir * (perpY / perpLen) * shift))
          }
        }
        moved = true
      }
    }
    if (!moved) break
  }
  return pts
}

function breakFalseAlignments(verts: Pt[], rawEdges: { from: number; to: number }[], margin = 35): Pt[] {
  const pts: Pt[] = verts.map((p) => ({ x: p.x, y: p.y }))
  const TOL = 8
  const W = 400, H = 400

  // Break vertical stacks (same x)
  for (let i = 0; i < pts.length; i++) {
    const stack: number[] = []
    for (let j = 0; j < pts.length; j++) {
      if (Math.abs(pts[j].x - pts[i].x) < TOL) stack.push(j)
    }
    if (stack.length < 3) continue
    const sorted = [...stack].sort((a, b) => pts[a].y - pts[b].y)
    for (let k = 0; k < sorted.length - 1; k++) {
      const a = sorted[k] + 1, b = sorted[k + 1] + 1
      const connected = rawEdges.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a))
      if (!connected) {
        const push = TOL * 2
        const dir = k % 2 === 0 ? 1 : -1
        for (const idx of sorted) pts[idx].x = Math.max(margin, Math.min(W - margin, pts[idx].x + dir * push))
        break
      }
    }
  }

  // Break horizontal rows (same y)
  for (let i = 0; i < pts.length; i++) {
    const row: number[] = []
    for (let j = 0; j < pts.length; j++) {
      if (Math.abs(pts[j].y - pts[i].y) < TOL) row.push(j)
    }
    if (row.length < 3) continue
    const sorted = [...row].sort((a, b) => pts[a].x - pts[b].x)
    for (let k = 0; k < sorted.length - 1; k++) {
      const a = sorted[k] + 1, b = sorted[k + 1] + 1
      const connected = rawEdges.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a))
      if (!connected) {
        const push = TOL * 2
        const dir = k % 2 === 0 ? 1 : -1
        for (const idx of sorted) pts[idx].y = Math.max(margin, Math.min(H - margin, pts[idx].y + dir * push))
        break
      }
    }
  }

  return pts
}

function buildPuzzle(cand: Candidate, nextId: number): GeneratedPuzzle | null {
  const { raw, pts } = cand
  const n = raw.vertexCount
  if (pts.length !== n) return null

  const deAligned = breakFalseAlignments(pts, raw.edges)
  const proxFixed = repairProximity(deAligned)
  const edgeFixed = repairEdgeProximity(proxFixed, raw.edges)
  const vertices: Vertex[] = edgeFixed.map((p, i) => ({ id: i + 1, x: Math.round(p.x), y: Math.round(p.y) }))
  const edges: Edge[] = raw.edges.map((e, i) => ({ id: i + 1, from: e.from, to: e.to }))
  const vertexIds = vertices.map((v) => v.id)
  const solvable = isSolvable(vertexIds, raw.edges)

  if (solvable) {
    const deg = getVertexDegrees(vertexIds, raw.edges)
    const maxDegree = Math.max(...deg.values())
    if (maxDegree < 3) return null
  }

  let officialSolution: number[] | undefined
  if (solvable) {
    const sol = findEulerianPath(
      vertexIds,
      edges.map((e) => ({ id: e.id, from: e.from, to: e.to }))
    )
    if (!sol) return null
    officialSolution = sol
  }

  const comp = computeComplexity(vertexIds, raw.edges)
  const difficulty: Difficulty = comp <= 35 ? 'easy' : 'hard'

  const qualityVertices = vertices.map((v) => ({ x: v.x, y: v.y }))
  const qualityEdges = edges.map((e) => ({ from: e.from, to: e.to }))
  const qualityScore = scoreVisualQuality(qualityVertices, qualityEdges)

  const label = cand.label ?? ''
  let family = label.replace(/-?\d+.*$/, '').replace(/-s\d+$/, '').replace(/-\w+$/, '')
  if (family.startsWith('erdos') || family.startsWith('watts') || family.startsWith('barabasi') ||
      family.startsWith('regular') || family.startsWith('bipartite')) family = 'random'
  else if (family.startsWith('k') && family.length <= 3) family = 'classic'
  else if (['petersen','cube','octa','wagner','chvatal','herschel','franklin',
    'mobius','pappus','desargues','grotzsch','folkman','robertson',
    'hypercube','product'].some((n) => family.startsWith(n))) family = 'classic'

  return {
    id: nextId,
    difficulty,
    solvable,
    vertices,
    edges,
    officialSolution,
    _qualityScore: qualityScore,
    _label: cand.label,
    _family: family,
    _complexity: comp,
  }
}

let _seedCounter = 1
function nextSeed(): number {
  return 1000 + _seedCounter++
}

function forceLayout(raw: RawGraph, label: string, seed = nextSeed()): Candidate {
  const norm = alwaysNormalize(raw)
  const nv = norm.vertexCount
  const iters = nv > 15 ? 120 : nv > 10 ? 100 : 80
  const pts = forceDirectedLayout(nv, norm.edges, 400, 400, iters, seed)
  return { raw: norm, pts, label }
}

function makeCand(raw: RawGraph, pts: Pt[], label: string): Candidate {
  return { raw: alwaysNormalize(raw), pts, label }
}

function allCandidates(): Candidate[] {
  const list: Candidate[] = []

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CLASSIC NAMED GRAPHS (Graph Theory Icons)
  // ═══════════════════════════════════════════════════════════════════════════

  list.push(forceLayout(petersenGraph(), 'petersen', 2001))

  list.push(forceLayout(petersenStar(), 'petersen-star', 2002))

  list.push(makeCand(completeGraph(5), circularLayout(5), 'k5'))
  list.push(makeCand(completeGraph(6), circularLayout(6), 'k6'))
  list.push(makeCand(completeBipartiteGraph(3, 3), circularLayout(6), 'k33-utility'))

  list.push(makeCand(completeBipartiteGraph(4, 4), circularLayout(8), 'k44'))

  list.push(forceLayout(cubeGraph(), 'cube-q3', 2003))

  list.push(forceLayout(octahedronGraph(), 'octahedron', 2004))

  list.push(forceLayout(wagnerGraph(), 'wagner', 2005))

  list.push(forceLayout(chvatalGraph(), 'chvatal', 2006))

  list.push(forceLayout(herschelGraph(), 'herschel', 2007))

  list.push(forceLayout(franklinGraph(), 'franklin', 2008))

  list.push(forceLayout(mobiusKantorGraph(), 'mobius-kantor', 2009))

  list.push(forceLayout(pappusGraph(), 'pappus', 2010))

  list.push(forceLayout(desarguesGraph(), 'desargues', 2011))

  list.push(forceLayout(grotzschGraph(), 'grotzsch', 2012))

  list.push(forceLayout(folkmanGraph(), 'folkman', 2013))

  list.push(forceLayout(robertsonGraph(), 'robertson', 2014))

  const h4 = hypercubeGraph(4)!
  list.push(forceLayout(h4, 'hypercube-4d', 2015))

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. RANDOM GRAPH MODELS (multiple seeds for variety)
  // ═══════════════════════════════════════════════════════════════════════════

  const randomSeeds = [42, 73, 101, 137, 199, 256, 314, 521, 666, 777, 888, 999, 1234, 1337, 3579, 5001]

  for (const seed of randomSeeds) {
    const n = 6 + (seed % 5)
    const maxE = (n * (n - 1)) / 2
    const m = n + (seed % (maxE - n))

    const er = erdosRenyi(n, m, seed)
    if (er) list.push(forceLayout(er, `erdos-renyi-${n}-${m}-s${seed}`, seed))
  }

  for (const seed of randomSeeds.slice(0, 12)) {
    const n = 6 + (seed % 6)
    const k = 2 * (1 + (seed % 4))
    const beta = 0.1 + (seed % 10) * 0.08

    const ws = wattsStrogatz(n, k, beta, seed)
    if (ws) list.push(forceLayout(ws, `watts-strogatz-${n}-k${k}-b${beta.toFixed(2)}-s${seed}`, seed))
  }

  for (const seed of randomSeeds.slice(0, 10)) {
    const n = 8 + (seed % 7)
    const m0 = 3 + (seed % 3)
    const m = 2 + (seed % 3)

    const ba = barabasiAlbert(n, m0, m, seed)
    if (ba) list.push(forceLayout(ba, `barabasi-${n}-m0${m0}-m${m}-s${seed}`, seed))
  }

  for (const seed of randomSeeds.slice(0, 8)) {
    const n = 6 + (seed % 5) * 2
    const d = 3 + (seed % 2)
    const rr = randomRegular(n, d, seed)
    if (rr) list.push(forceLayout(rr, `regular-${n}-d${d}-s${seed}`, seed))
  }

  for (const seed of randomSeeds.slice(0, 8)) {
    const n1 = 3 + (seed % 4)
    const n2 = 3 + ((seed * 7) % 4)
    const p = 0.4 + (seed % 5) * 0.1
    const rb = randomBipartite(n1, n2, p, seed)
    if (rb) list.push(forceLayout(rb, `bipartite-${n1}x${n2}-p${p.toFixed(1)}-s${seed}`, seed))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. GRAPH OPERATIONS ON CLASSIC GRAPHS
  // ═══════════════════════════════════════════════════════════════════════════

  const baseGraphs: [RawGraph, string][] = [
    [cubeGraph(), 'cube'],
    [completeGraph(4), 'k4'],
    [completeBipartiteGraph(3, 3), 'k33'],
    [petersenGraph(), 'petersen'],
    [wagnerGraph(), 'wagner'],
    [octahedronGraph(), 'octa'],
  ]

  for (const [base, baseName] of baseGraphs) {
    for (let i = 0; i < 3; i++) {
      const chord = addRandomChord(base, 5000 + i)
      if (chord) list.push(forceLayout(chord, `${baseName}-chord-${i}`, 6000 + i))
    }
    const split = vertexSplit(base, 7000)
    if (split) list.push(forceLayout(split, `${baseName}-split`, 7001))
  }

  const smallGraphs: [RawGraph, string][] = [
    [completeGraph(3), 'k3'],
    [cycleGraph(4), 'c4'],
  ]
  for (const [g1, n1] of smallGraphs) {
    for (const [g2, n2] of smallGraphs) {
      const prod = cartesianProduct(g1, g2)
      if (prod.vertexCount <= 25) {
        list.push(forceLayout(prod, `product-${n1}x${n2}`, 8000))
      }
    }
  }

  const joinA = completeGraph(3)
  const joinB = cycleGraph(4)
  const joinG = graphJoin(joinA, joinB)
  list.push(forceLayout(joinG, 'k3-join-c4', 9001))

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EXISTING SHAPE CANDIDATES (refined selection)
  // ═══════════════════════════════════════════════════════════════════════════

  for (const n of [4, 5, 6, 7, 8]) {
    list.push(makeCand(pathGraph(n), circularLayout(n, 200, 200, 155), `path-${n}-arc`))
  }
  for (const n of [4, 5, 6, 7, 8, 9, 10]) {
    list.push(makeCand(cycleGraph(n), circularLayout(n), `cycle-${n}`))
  }

  const thetaVariants: [number, number, number][] = [
    [2, 2, 2], [2, 2, 3], [2, 3, 3], [2, 2, 4],
    [3, 3, 3], [2, 4, 4], [3, 4, 5],
  ]
  for (const [k1, k2, k3] of thetaVariants) {
    list.push(makeCand(thetaGraph(k1, k2, k3), thetaLayout(k1, k2, k3), `theta-${k1}-${k2}-${k3}`))
  }

  for (const [n, k] of [[3, 2], [4, 3], [5, 2], [6, 2]] as [number, number][]) {
    list.push(makeCand(lollipopGraph(n, k), lollipopLayout(n, k), `lollipop-${n}-${k}`))
  }

  for (const n of [4, 6, 8, 10, 12]) {
    list.push(makeCand(wheelGraphFixed(n), hubAndRim(n), `wheel-${n}`))
  }

  for (const n of [2, 3, 4, 5, 6]) {
    list.push(makeCand(ladderGraph(n), doubleRowLayout(n), `ladder-${n}`))
  }

  for (const k of [2, 3, 4, 5, 6, 7, 8, 9]) {
    list.push(makeCand(bookGraph(k), bookLayout(k), `book-${k}`))
  }

  for (const k of [2, 3, 4, 5]) {
    list.push(makeCand(friendshipGraph(k), friendshipLayout(k), `friendship-${k}`))
  }

  for (const k of [1, 2, 3, 4]) {
    list.push(makeCand(doubleStarGraph(k), circularLayout(2 + 2 * k, 200, 200, 140), `doubleStar-${k}`))
  }

  for (const n of [4, 5, 6]) {
    list.push(makeCand(doubleWheelGraph(n), doubleWheelLayout(n), `doubleWheel-${n}`))
  }

  for (const n of [3, 4, 5, 6]) {
    list.push(makeCand(prismGraph(n), doubleRowLayout(n), `prism-${n}`))
  }

  for (const k of [3, 5, 7, 4, 6]) {
    list.push(makeCand(starGraph(k), hubAndRim(k), `star-${k}`))
  }

  list.push(makeCand(gridGraph(2, 3), gridLayout(2, 3), 'grid-2x3'))
  list.push(makeCand(gridGraph(3, 3), gridLayout(3, 3), 'grid-3x3'))
  list.push(makeCand(gridGraph(2, 4), gridLayout(2, 4), 'grid-2x4'))
  list.push(makeCand(gridGraph(3, 4), gridLayout(3, 4), 'grid-3x4'))

  // Diamond
  list.push(makeCand(
    { vertexCount: 4, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},{from:1,to:3}] },
    customLayout([[200,55],[335,200],[200,345],[65,200]]), 'diamond'
  ))

  // Envelope
  list.push(makeCand(
    { vertexCount: 4, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},{from:2,to:4}] },
    customLayout([[80,100],[320,100],[320,300],[80,300]]), 'envelope'
  ))

  // Bowtie
  list.push(makeCand(
    { vertexCount: 5, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:1},{from:1,to:4},{from:4,to:5},{from:5,to:1}] },
    customLayout([[200,200],[80,80],[80,320],[320,80],[320,320]]), 'bowtie'
  ))

  // House
  list.push(makeCand(
    { vertexCount: 5, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},{from:1,to:5},{from:2,to:5}] },
    customLayout([[100,300],[300,300],[300,150],[100,150],[200,60]]), 'house'
  ))

  // Barbell
  list.push(makeCand(
    { vertexCount: 6, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:1},{from:3,to:4},{from:4,to:5},{from:5,to:6},{from:6,to:4}] },
    customLayout([[70,140],[70,260],[170,200],[230,200],[330,140],[330,260]]), 'barbell'
  ))

  // Kite
  list.push(makeCand(
    { vertexCount: 4, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:1},{from:1,to:4},{from:2,to:4}] },
    customLayout([[200,60],[320,200],[200,340],[80,200]]), 'kite'
  ))

  // Cross
  list.push(makeCand(
    { vertexCount: 5, edges: [{from:1,to:5},{from:2,to:5},{from:3,to:5},{from:4,to:5},{from:1,to:2},{from:2,to:3}] },
    customLayout([[200,60],[340,200],[200,340],[60,200],[200,200]]), 'cross'
  ))

  // Figure-8
  list.push(makeCand(
    { vertexCount: 7, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},{from:1,to:5},{from:5,to:6},{from:6,to:7},{from:7,to:1}] },
    customLayout([[200,200],[80,110],[80,290],[200,60],[320,110],[320,290],[200,330]]), 'figure8'
  ))

  // Pinwheel
  list.push(makeCand(
    { vertexCount: 8, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},{from:1,to:5},{from:2,to:6},{from:3,to:7},{from:4,to:8}] },
    customLayout([[150,150],[250,150],[250,250],[150,250],[70,70],[330,70],[330,330],[70,330]]), 'pinwheel'
  ))

  // K4
  list.push(makeCand(
    { vertexCount: 4, edges: [{from:1,to:2},{from:1,to:3},{from:1,to:4},{from:2,to:3},{from:2,to:4},{from:3,to:4}] },
    circularLayout(4), 'k4-classic'
  ))

  // Hexagon triangulated
  list.push(makeCand(
    { vertexCount: 6, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:6},{from:6,to:1},{from:1,to:3},{from:3,to:5},{from:5,to:1}] },
    circularLayout(6), 'hex-triangulated'
  ))

  // Hexagon with 2 chords
  list.push(makeCand(
    { vertexCount: 6, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:6},{from:6,to:1},{from:1,to:4},{from:2,to:5}] },
    circularLayout(6), 'hex-2chords'
  ))

  // Pentagon with 2 diagonals
  list.push(makeCand(
    { vertexCount: 5, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:1},{from:1,to:3},{from:2,to:4}] },
    circularLayout(5), 'pent-2chords'
  ))

  // Star polygon (8-point)
  list.push(makeCand(
    { vertexCount: 8, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:6},{from:6,to:7},{from:7,to:8},{from:8,to:1},{from:1,to:3},{from:3,to:5},{from:5,to:7},{from:7,to:1}] },
    starLayout(4), 'star8-connected'
  ))

  return list
}

function generate(): GeneratedPuzzle[] {
  const candidates = allCandidates()
  const results: GeneratedPuzzle[] = []
  const knownSignatures = new Set<string>()
  let nextId = 200

  let built = 0, skippedBuild = 0, skippedQuality = 0, skippedDupe = 0

  for (const cand of candidates) {
    const puzzle = buildPuzzle(cand, nextId)
    if (!puzzle) { skippedBuild++; continue }
    built++

    const qualityThreshold = puzzle.difficulty === 'hard' ? 30 : 40
    if ((puzzle._qualityScore ?? 0) < qualityThreshold) {
      skippedQuality++
      continue
    }

    const sig = graphSignature(
      puzzle.vertices.map((v) => v.id),
      puzzle.edges
    )
    if (isDuplicate(sig, knownSignatures)) {
      skippedDupe++
      continue
    }

    knownSignatures.add(sig)
    results.push(puzzle)
    nextId++
  }

  console.log(`\nGeneration stats:`)
  console.log(`  Candidates:      ${candidates.length}`)
  console.log(`  Built:           ${built}`)
  console.log(`  Rejected (build fail): ${skippedBuild}`)
  console.log(`  Rejected (quality):    ${skippedQuality}`)
  console.log(`  Rejected (duplicate):  ${skippedDupe}`)
  console.log(`  Accepted:        ${results.length}`)

  return results
}

function generateJuneSchedule(): Array<{ difficulty: Difficulty; solvable: boolean; date: string }> {
  const days: Array<{ difficulty: Difficulty; solvable: boolean; date: string }> = []
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Exactly 2 impossible days per full week, non-consecutive, not both on weekend
  const weekImpossible: number[][] = [
    [0, 2],   // week 1 (days 1-7)   — Mon + Wed
    [1, 3],   // week 2 (days 8-14)  — Tue + Thu
    [0, 4],   // week 3 (days 15-21) — Mon + Fri
    [2, 5],   // week 4 (days 22-28) — Wed + Sat
    [0],      // week 5 (days 29-30) — partial, Mon only
  ]

  for (let day = 1; day <= 30; day++) {
    const weekIdx = Math.floor((day - 1) / 7)
    const dow = (day - 1) % 7
    const isHard = dow >= 4
    const impossibleSet = new Set(weekImpossible[weekIdx] ?? [])
    const solvable = !impossibleSet.has(dow)
    const difficulty: Difficulty = isHard ? 'hard' : 'easy'
    const dateStr = `Jun ${String(day).padStart(2)} ${dayNames[dow]} ${difficulty} ${solvable ? 'solvable' : 'impossible'}`
    days.push({ difficulty, solvable, date: dateStr })
  }
  return days
}

const JUNE_SCHEDULE = generateJuneSchedule()

function selectForSchedule(all: GeneratedPuzzle[]): GeneratedPuzzle[] {
  const DIVERSITY_WINDOW = 3

  const byQ = (a: GeneratedPuzzle, b: GeneratedPuzzle) =>
    (b._qualityScore ?? 0) - (a._qualityScore ?? 0)

  const pools: Record<string, GeneratedPuzzle[]> = {
    'easy-true':  all.filter((p) => p.difficulty === 'easy' && p.solvable).sort(byQ),
    'easy-false': all.filter((p) => p.difficulty === 'easy' && !p.solvable).sort(byQ),
    'hard-true':  all.filter((p) => p.difficulty === 'hard' && p.solvable).sort(byQ),
    'hard-false': all.filter((p) => p.difficulty === 'hard' && !p.solvable).sort(byQ),
  }

  console.log('\nPuzzle pools:')
  for (const [k, v] of Object.entries(pools)) {
    console.log(`  ${k}: ${v.length} candidates`)
  }

  const recentFamilies: string[] = []
  const consumed = new Set<string>()
  const result: GeneratedPuzzle[] = []
  const blockFamilies = new Set(['star', 'doubleStar'])
  // ── Birthday cake puzzles ──────────────────────────────────────────
  // Small cake (7 vertices, easy, Jun 16 — dark green accent)
  const smallCakeEdges: { from: number; to: number }[] = [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 3 },
    { from: 2, to: 4 }, { from: 2, to: 5 }, { from: 3, to: 4 },
    { from: 3, to: 5 }, { from: 4, to: 5 }, { from: 4, to: 6 },
    { from: 5, to: 7 }, { from: 6, to: 7 },
  ]
  // Layout: roof peak → wide base. No 3+ vertices share the same x or y.
  const smallCakeLayout: Pt[] = [
    { x: 200, y: 40 },   // 1 — roof peak
    { x: 120, y: 120 },  // 2 — roof left
    { x: 280, y: 120 },  // 3 — roof right
    { x: 80, y: 230 },   // 4 — body left
    { x: 320, y: 230 },  // 5 — body right
    { x: 50, y: 350 },   // 6 — base left
    { x: 350, y: 350 },  // 7 — base right
  ]
  const smallCakeSolution = [1, 2, 3, 5, 7, 6, 4, 2, 5, 4, 3, 1]

  // Big cake (11 vertices, hard, Jun 19 — red accent)
  // Tiered: roof → upper body → middle → base. All y-levels staggered to avoid false alignments.
  const bigCakeEdges: { from: number; to: number }[] = [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 3 },
    { from: 2, to: 4 }, { from: 2, to: 5 }, { from: 3, to: 4 },
    { from: 3, to: 5 }, { from: 4, to: 5 }, { from: 4, to: 6 },
    { from: 5, to: 8 }, { from: 6, to: 7 }, { from: 6, to: 8 },
    { from: 7, to: 8 }, { from: 8, to: 11 }, { from: 6, to: 9 },
    { from: 9, to: 10 }, { from: 10, to: 11 },
  ]
  const bigCakeLayout: Pt[] = [
    { x: 200, y: 30 },   // 1 — roof peak
    { x: 150, y: 100 },  // 2 — roof left
    { x: 250, y: 100 },  // 3 — roof right
    { x: 100, y: 180 },  // 4 — upper body left
    { x: 300, y: 180 },  // 5 — upper body right
    { x: 70, y: 275 },   // 6 — middle left
    { x: 195, y: 265 },  // 7 — middle centre (staggered up)
    { x: 330, y: 275 },  // 8 — middle right
    { x: 45, y: 360 },   // 9 — base left
    { x: 205, y: 350 },  // 10 — base centre (staggered up)
    { x: 355, y: 360 },  // 11 — base right
  ]
  const bigCakeSolution = [1, 2, 3, 4, 5, 8, 6, 7, 8, 11, 10, 9, 6, 4, 2, 5, 3, 1]

  const SPECIAL_SLOTS = new Set([15, 18])
  const SPECIAL_PUZZLES: Record<number, {
    difficulty: Difficulty; solvable: boolean; graph: RawGraph; layout: Pt[]
    solution: number[]; accent: string
  }> = {
    15: {
      difficulty: 'easy', solvable: true,
      graph: { vertexCount: 7, edges: smallCakeEdges },
      layout: smallCakeLayout,
      solution: smallCakeSolution,
      accent: '#166534',
    },
    18: {
      difficulty: 'hard',  solvable: true,
      graph: { vertexCount: 11, edges: bigCakeEdges },
      layout: bigCakeLayout,
      solution: bigCakeSolution,
      accent: '#dc2626',
    },
  }

  for (let i = 0; i < JUNE_SCHEDULE.length; i++) {
    if (SPECIAL_SLOTS.has(i)) {
      const sp = SPECIAL_PUZZLES[i]
      const pts = sp.layout.map((p) => ({ x: p.x, y: p.y }))
      const vertices: Vertex[] = pts.map((p, idx) => ({ id: idx + 1, x: Math.round(p.x), y: Math.round(p.y) }))
      const edges: Edge[] = sp.graph.edges.map((e, idx) => ({ id: idx + 1, from: e.from, to: e.to, curve: 25 }))
      const puzzle: GeneratedPuzzle = {
        id: i + 1,
        difficulty: sp.difficulty,
        solvable: sp.solvable,
        vertices,
        edges,
        officialSolution: sp.solution,
        _qualityScore: 100,
        _label: `cake-${sp.graph.vertexCount}`,
        _family: 'cake',
        _complexity: sp.graph.vertexCount,
      }
      ;(puzzle as any).accent = sp.accent
      console.log(`  #${i + 1} (${JUNE_SCHEDULE[i].date}): ${puzzle._label} [q=100] [fam=cake] [cpx=${puzzle._complexity}]`)
      result.push(puzzle)
      continue
    }

    const slot = JUNE_SCHEDULE[i]
    const key = `${slot.difficulty}-${slot.solvable}`
    const pool = pools[key]
    if (!pool || pool.length === 0) {
      throw new Error(`Not enough ${key} candidates for slot ${i + 1} (${slot.date})`)
    }

    const lastFamilies = new Set(recentFamilies.slice(-DIVERSITY_WINDOW))

    let picked: GeneratedPuzzle | null = null
    for (const candidate of pool) {
      const idKey = `${candidate._family ?? ''}:${candidate._label ?? ''}`
      if (consumed.has(idKey)) continue
      const family = candidate._family ?? 'unknown'
      if (blockFamilies.has(family)) continue
      if (!lastFamilies.has(family)) {
        picked = candidate
        break
      }
    }

    if (!picked) {
      for (const candidate of pool) {
        const idKey = `${candidate._family ?? ''}:${candidate._label ?? ''}`
        if (consumed.has(idKey)) continue
        const family = candidate._family ?? 'unknown'
        if (blockFamilies.has(family)) continue
        picked = candidate
        break
      }
    }

    if (!picked) {
      for (const candidate of pool) {
        const idKey = `${candidate._family ?? ''}:${candidate._label ?? ''}`
        if (consumed.has(idKey)) continue
        picked = candidate
        break
      }
    }

    if (!picked) throw new Error(`No available ${key} candidates for slot ${i + 1}`)

    const idKey = `${picked._family ?? ''}:${picked._label ?? ''}`
    consumed.add(idKey)
    recentFamilies.push(picked._family ?? 'unknown')
    console.log(`  #${i + 1} (${slot.date}): ${picked._label ?? 'unknown'} [q=${picked._qualityScore ?? '?'}] [fam=${picked._family ?? '?'}] [cpx=${picked._complexity ?? '?'}]`)
    result.push({ ...picked, id: i + 1 })
  }

  return result
}

function writePuzzlesFile(puzzles: GeneratedPuzzle[], outPath: string) {
  const lines: string[] = [
    '// AUTO-GENERATED by scripts/generatePuzzles.ts — do not hand-edit',
    "import type { Puzzle } from '../types'",
    '',
    'const puzzles: Puzzle[] = [',
  ]

  for (const p of puzzles) {
    const verts = p.vertices
      .map((v) => `{ id: ${v.id}, x: ${Math.round(v.x)}, y: ${Math.round(v.y)} }`)
      .join(', ')
    const edgs = p.edges
      .map((e) => {
        let s = `{ id: ${e.id}, from: ${e.from}, to: ${e.to}`
        if (e.curve !== undefined) s += `, curve: ${e.curve}`
        return s + ' }'
      })
      .join(', ')
    const sol = p.officialSolution
      ? `, officialSolution: [${p.officialSolution.join(', ')}]`
      : ''
    const acc = (p as any).accent ? `, accent: '${(p as any).accent}'` : ''

    lines.push(
      `  { id: ${p.id}, difficulty: '${p.difficulty}', solvable: ${p.solvable}, ` +
      `vertices: [${verts}], edges: [${edgs}]${sol}${acc} },`
    )
  }

  lines.push(']', '', 'export default puzzles', '')

  writeFileSync(outPath, lines.join('\n'), 'utf-8')
  console.log(`\nWrote ${puzzles.length} puzzles → ${outPath}`)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(__dirname, '../src/data/puzzles.ts')

console.log('Grafle Puzzle Generator v2 — Real Graph Engine\n')
console.log(`Seed range: 1000-${1000 + _seedCounter}`)
const all = generate()
const selected = selectForSchedule(all)
writePuzzlesFile(selected, outPath)

console.log('\nDone. Run `npm run build` to apply changes.')
