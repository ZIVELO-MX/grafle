/**
 * Grafle Puzzle Generator
 * Run: npm run generate
 * Output: src/data/generatedPuzzles.ts
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

import { findEulerianPath } from './lib/eulerianSolver.js'
import {
  pathGraph, cycleGraph, thetaGraph, lollipopGraph, wheelGraphFixed,
  ladderGraph, prismGraph, doubleStarGraph, bookGraph, friendshipGraph,
  petersenLike, doubleWheelGraph, gridGraph, starGraph, RawGraph,
} from './lib/shapes.js'
import {
  circularLayout, hubAndRim, horizontalLayout, doubleRowLayout,
  thetaLayout, lollipopLayout, bookLayout, friendshipLayout,
  petersenLayout, doubleWheelLayout, gridLayout, customLayout,
  starLayout,
} from './lib/layout.js'
import { graphSignature, isDuplicate } from './lib/isomorphism.js'
import { scoreVisualQuality } from './lib/quality.js'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Vertex { id: number; x: number; y: number }
interface Edge { id: number; from: number; to: number }

type Difficulty = 'easy' | 'hard'

interface GeneratedPuzzle {
  id: number
  difficulty: Difficulty
  solvable: boolean
  vertices: Vertex[]
  edges: Edge[]
  officialSolution?: number[]
  _qualityScore?: number
}

// ─── Graph utilities (local copies — avoid import issues with src/) ──────────

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

// ─── Candidate builder ───────────────────────────────────────────────────────

interface Candidate {
  raw: RawGraph
  pts: { x: number; y: number }[]
  label: string
}

function buildPuzzle(cand: Candidate, nextId: number): GeneratedPuzzle | null {
  const { raw, pts } = cand
  const n = raw.vertexCount

  if (pts.length !== n) return null

  const vertices: Vertex[] = pts.map((p, i) => ({ id: i + 1, x: p.x, y: p.y }))
  const edges: Edge[] = raw.edges.map((e, i) => ({ id: i + 1, from: e.from, to: e.to }))
  const vertexIds = vertices.map((v) => v.id)

  const solvable = isSolvable(vertexIds, raw.edges)

  let officialSolution: number[] | undefined
  if (solvable) {
    const sol = findEulerianPath(
      vertexIds,
      edges.map((e) => ({ id: e.id, from: e.from, to: e.to }))
    )
    if (!sol) return null // isSolvable said true but solver returned null → bad graph
    officialSolution = sol
  }

  // Difficulty: easy ≤ 8 vertices AND ≤ 12 edges; otherwise hard
  const difficulty: Difficulty = n <= 8 && edges.length <= 12 ? 'easy' : 'hard'

  // Quality score uses 0-based vertex indices via mapping
  const qualityVertices = vertices.map((v) => ({ x: v.x, y: v.y }))
  const qualityEdges = edges.map((e) => ({ from: e.from, to: e.to }))
  const qualityScore = scoreVisualQuality(qualityVertices, qualityEdges)

  return {
    id: nextId,
    difficulty,
    solvable,
    vertices,
    edges,
    officialSolution,
    _qualityScore: qualityScore,
  }
}

// ─── Candidate pool definition ───────────────────────────────────────────────

function allCandidates(): Candidate[] {
  const list: Candidate[] = []

  // ── PATH GRAPHS (arc layouts only — horizontal layouts are visually boring) ──
  for (const n of [4, 5, 6, 7, 8]) {
    list.push({ raw: pathGraph(n), pts: circularLayout(n, 200, 200, 155), label: `path-${n}-arc` })
  }

  // ── CYCLE GRAPHS ──
  for (const n of [4, 5, 6, 7, 8]) {
    list.push({ raw: cycleGraph(n), pts: circularLayout(n), label: `cycle-${n}` })
  }
  // Cycles with rotated start angle
  list.push({ raw: cycleGraph(4), pts: circularLayout(4, 200, 200, 150, 0), label: 'cycle-4-rot45' })
  list.push({ raw: cycleGraph(6), pts: circularLayout(6, 200, 200, 155, 0), label: 'cycle-6-rot30' })

  // ── THETA GRAPHS ──
  // Exclude any variant where ki=1: those create a direct horizontal edge between the two
  // poles at y=200, which visually passes through any middle-path nodes (also at y=200).
  const thetaVariants: [number, number, number][] = [
    // Easy (all ki ≥ 2, sum ≤ 9)
    [2, 2, 2], [2, 2, 3], [2, 3, 3], [2, 2, 4], [2, 3, 4], [3, 3, 3],
    // Hard (all ki ≥ 2, sum ≥ 10)
    [2, 4, 4], [3, 3, 4], [2, 3, 5], [2, 4, 5],
    [3, 4, 4], [3, 3, 5], [2, 5, 5], [4, 4, 4],
    [3, 4, 5], [4, 4, 5], [3, 5, 5],
  ]
  for (const [k1, k2, k3] of thetaVariants) {
    list.push({
      raw: thetaGraph(k1, k2, k3),
      pts: thetaLayout(k1, k2, k3),
      label: `theta-${k1}-${k2}-${k3}`,
    })
  }

  // ── LOLLIPOP GRAPHS ──
  for (const [n, k] of [[3, 2], [4, 2], [4, 3], [5, 2], [3, 3], [5, 3], [6, 2]] as [number,number][]) {
    list.push({
      raw: lollipopGraph(n, k),
      pts: lollipopLayout(n, k),
      label: `lollipop-${n}-${k}`,
    })
  }

  // ── WHEEL GRAPHS ──
  for (const n of [4, 6, 8, 10, 12]) {
    list.push({ raw: wheelGraphFixed(n), pts: hubAndRim(n), label: `wheel-${n}` })
  }

  // ── LADDER GRAPHS ──
  for (const n of [2, 3, 4, 5, 6]) {
    list.push({ raw: ladderGraph(n), pts: doubleRowLayout(n), label: `ladder-${n}` })
  }

  // ── BOOK GRAPHS ──
  // book(k): k=even → Eulerian circuit, k=odd → Eulerian path
  // v = k+2, e = 2k+1. Hard when v>8 (k>6) or e>12 (k>5).
  for (const k of [2, 3, 4, 5, 6, 7, 8, 9]) {
    list.push({ raw: bookGraph(k), pts: bookLayout(k), label: `book-${k}` })
  }

  // ── FRIENDSHIP GRAPHS ──
  // friendship(k): all degrees even → Eulerian circuit. v = 2k+1, e = 3k. Hard when v>8 (k≥4).
  for (const k of [2, 3, 4, 5]) {
    list.push({ raw: friendshipGraph(k), pts: friendshipLayout(k), label: `friendship-${k}` })
  }

  // ── DOUBLE STAR ──
  for (const k of [1, 2, 3, 4]) {
    list.push({
      raw: doubleStarGraph(k),
      pts: circularLayout(2 + 2 * k, 200, 200, 140),
      label: `doubleStar-${k}`,
    })
  }

  // ── PETERSEN-LIKE ──
  list.push({ raw: petersenLike(), pts: petersenLayout(), label: 'petersen' })

  // ── DOUBLE WHEEL ──
  for (const n of [4, 5, 6]) {
    list.push({ raw: doubleWheelGraph(n), pts: doubleWheelLayout(n), label: `doubleWheel-${n}` })
  }

  // ── PRISM GRAPHS (impossible) ──
  for (const n of [3, 4, 5, 6]) {
    list.push({ raw: prismGraph(n), pts: doubleRowLayout(n), label: `prism-${n}` })
  }

  // ── STAR GRAPHS (impossible candidates) ──
  for (const k of [3, 5, 7, 4, 6]) {
    list.push({ raw: starGraph(k), pts: hubAndRim(k), label: `star-${k}` })
  }

  // ── GRID GRAPHS ──
  list.push({ raw: gridGraph(2, 3), pts: gridLayout(2, 3), label: 'grid-2x3' })
  list.push({ raw: gridGraph(3, 3), pts: gridLayout(3, 3), label: 'grid-3x3' })
  list.push({ raw: gridGraph(2, 4), pts: gridLayout(2, 4), label: 'grid-2x4' })
  list.push({ raw: gridGraph(3, 4), pts: gridLayout(3, 4), label: 'grid-3x4' })

  // ── HANDCRAFTED MEMORABLE SHAPES ──

  // Diamond (rhombus): 4 vertices
  list.push({
    raw: { vertexCount: 4, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},{from:1,to:3}] },
    pts: customLayout([[200,55],[335,200],[200,345],[65,200]]),
    label: 'diamond-diagonal',
  })

  // Envelope shape: rectangle + one diagonal
  list.push({
    raw: { vertexCount: 4, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},{from:2,to:4}] },
    pts: customLayout([[80,100],[320,100],[320,300],[80,300]]),
    label: 'envelope',
  })

  // Butterfly / bowtie: two triangles at center
  list.push({
    raw: { vertexCount: 5, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:1},{from:1,to:4},{from:4,to:5},{from:5,to:1}] },
    pts: customLayout([[200,200],[80,80],[80,320],[320,80],[320,320]]),
    label: 'bowtie',
  })

  // Arrow shape: path + extra edge making a filled arrowhead
  list.push({
    raw: { vertexCount: 5, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:3},{from:1,to:5}] },
    pts: customLayout([[200,330],[200,200],[200,70],[80,200],[320,200]]),
    label: 'arrow',
  })

  // House shape: square + roof
  list.push({
    raw: { vertexCount: 5, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},{from:1,to:5},{from:2,to:5}] },
    pts: customLayout([[100,300],[300,300],[300,150],[100,150],[200,60]]),
    label: 'house',
  })

  // Barbell: two triangles connected by a bridge
  list.push({
    raw: {
      vertexCount: 6,
      edges: [
        {from:1,to:2},{from:2,to:3},{from:3,to:1},
        {from:3,to:4},
        {from:4,to:5},{from:5,to:6},{from:6,to:4},
      ],
    },
    pts: customLayout([[80,130],[80,270],[200,200],[200,200],[320,130],[320,270]]),
    label: 'barbell-raw',
  })

  // Better barbell with more separation
  list.push({
    raw: {
      vertexCount: 6,
      edges: [
        {from:1,to:2},{from:2,to:3},{from:3,to:1},
        {from:3,to:4},
        {from:4,to:5},{from:5,to:6},{from:6,to:4},
      ],
    },
    pts: customLayout([[70,140],[70,260],[170,200],[230,200],[330,140],[330,260]]),
    label: 'barbell',
  })

  // Kite: 4 vertices, 5 edges
  list.push({
    raw: { vertexCount: 4, edges: [{from:1,to:2},{from:2,to:3},{from:3,to:1},{from:1,to:4},{from:2,to:4}] },
    pts: customLayout([[200,60],[320,200],[200,340],[80,200]]),
    label: 'kite',
  })

  // Cross / plus shape
  list.push({
    raw: {
      vertexCount: 5,
      edges: [{from:1,to:5},{from:2,to:5},{from:3,to:5},{from:4,to:5},{from:1,to:2},{from:2,to:3}],
    },
    pts: customLayout([[200,60],[340,200],[200,340],[60,200],[200,200]]),
    label: 'cross-partial',
  })

  // Figure-8 / two loops sharing a vertex
  list.push({
    raw: {
      vertexCount: 7,
      edges: [
        {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},
        {from:1,to:5},{from:5,to:6},{from:6,to:7},{from:7,to:1},
      ],
    },
    pts: customLayout([[200,200],[100,100],[100,300],[300,300],[200,200],[300,100],[300,300]]),
    label: 'figure8-raw',
  })

  // Better figure-8
  list.push({
    raw: {
      vertexCount: 7,
      edges: [
        {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},
        {from:1,to:5},{from:5,to:6},{from:6,to:7},{from:7,to:1},
      ],
    },
    pts: customLayout([[200,200],[90,120],[90,280],[200,340],[310,120],[310,280],[200,340]]),
    label: 'figure8-v2',
  })

  // Correct figure-8: separate bottom vertices
  list.push({
    raw: {
      vertexCount: 7,
      edges: [
        {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},
        {from:1,to:5},{from:5,to:6},{from:6,to:7},{from:7,to:1},
      ],
    },
    pts: customLayout([[200,200],[80,110],[80,290],[200,60],[320,110],[320,290],[200,330]]),
    label: 'figure8-v3',
  })

  // Pinwheel: 4-cycle + 4 outward spokes
  list.push({
    raw: {
      vertexCount: 8,
      edges: [
        {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:1},
        {from:1,to:5},{from:2,to:6},{from:3,to:7},{from:4,to:8},
      ],
    },
    pts: customLayout([
      [150,150],[250,150],[250,250],[150,250],
      [70,70],[330,70],[330,330],[70,330],
    ]),
    label: 'pinwheel',
  })

  // Snowflake: 6-cycle + 6 spokes to center
  list.push({
    raw: { vertexCount: 7, edges: [
      {from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:6},{from:6,to:7},{from:7,to:2},
      {from:1,to:2},{from:1,to:4},{from:1,to:6},
    ]},
    pts: [
      {x:200,y:200},
      ...circularLayout(6, 200, 200, 155),
    ],
    label: 'snowflake-3spoke',
  })

  // Complete graph K4
  list.push({
    raw: { vertexCount: 4, edges: [
      {from:1,to:2},{from:1,to:3},{from:1,to:4},
      {from:2,to:3},{from:2,to:4},{from:3,to:4},
    ]},
    pts: circularLayout(4),
    label: 'k4',
  })

  // Complete graph K5 minus one edge (sometimes Eulerian)
  list.push({
    raw: { vertexCount: 5, edges: [
      {from:1,to:2},{from:1,to:3},{from:1,to:4},{from:1,to:5},
      {from:2,to:3},{from:2,to:4},{from:2,to:5},
      {from:3,to:4},{from:3,to:5},
      {from:4,to:5},
    ]},
    pts: circularLayout(5),
    label: 'k5',
  })

  // K4 minus one edge
  list.push({
    raw: { vertexCount: 4, edges: [
      {from:1,to:2},{from:1,to:3},{from:1,to:4},
      {from:2,to:3},{from:2,to:4},
    ]},
    pts: circularLayout(4),
    label: 'k4-minus1',
  })

  // Hexagon with 3 chords (triangulated)
  list.push({
    raw: { vertexCount: 6, edges: [
      {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:6},{from:6,to:1},
      {from:1,to:3},{from:3,to:5},{from:5,to:1},
    ]},
    pts: circularLayout(6),
    label: 'hex-inner-triangle',
  })

  // Hexagon with 2 long chords
  list.push({
    raw: { vertexCount: 6, edges: [
      {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:6},{from:6,to:1},
      {from:1,to:4},{from:2,to:5},
    ]},
    pts: circularLayout(6),
    label: 'hex-2chords',
  })

  // Hexagon with cross-chord
  list.push({
    raw: { vertexCount: 6, edges: [
      {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:6},{from:6,to:1},
      {from:1,to:4},
    ]},
    pts: circularLayout(6),
    label: 'hex-1chord',
  })

  // Pentagon with one diagonal
  list.push({
    raw: { vertexCount: 5, edges: [
      {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:1},
      {from:1,to:3},
    ]},
    pts: circularLayout(5),
    label: 'pent-1chord',
  })

  // Pentagon with two diagonals
  list.push({
    raw: { vertexCount: 5, edges: [
      {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},{from:5,to:1},
      {from:1,to:3},{from:2,to:4},
    ]},
    pts: circularLayout(5),
    label: 'pent-2chords',
  })

  // Octagon simple cycle
  list.push({ raw: cycleGraph(8), pts: circularLayout(8), label: 'octagon' })

  // Star polygon (8 points, alternating inner/outer ring)
  list.push({
    raw: {
      vertexCount: 8,
      edges: [
        {from:1,to:2},{from:2,to:3},{from:3,to:4},{from:4,to:5},
        {from:5,to:6},{from:6,to:7},{from:7,to:8},{from:8,to:1},
        {from:1,to:3},{from:3,to:5},{from:5,to:7},{from:7,to:1},
      ],
    },
    pts: starLayout(4),
    label: 'star8-connected',
  })

  return list
}

// ─── Main generation logic ───────────────────────────────────────────────────

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

    if ((puzzle._qualityScore ?? 0) < 40) {
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

function categorize(puzzles: GeneratedPuzzle[]) {
  const easySolvable   = puzzles.filter((p) => p.difficulty === 'easy' && p.solvable)
  const easyImpossible = puzzles.filter((p) => p.difficulty === 'easy' && !p.solvable)
  const hardSolvable   = puzzles.filter((p) => p.difficulty === 'hard' && p.solvable)
  const hardImpossible = puzzles.filter((p) => p.difficulty === 'hard' && !p.solvable)

  // Sort by quality descending
  const byQ = (a: GeneratedPuzzle, b: GeneratedPuzzle) =>
    (b._qualityScore ?? 0) - (a._qualityScore ?? 0)

  console.log(`\nPuzzle categories:`)
  console.log(`  Easy solvable:   ${easySolvable.length}`)
  console.log(`  Easy impossible: ${easyImpossible.length}`)
  console.log(`  Hard solvable:   ${hardSolvable.length}`)
  console.log(`  Hard impossible: ${hardImpossible.length}`)

  // Select top per category
  const selected = [
    ...easySolvable.sort(byQ).slice(0, 40),
    ...easyImpossible.sort(byQ).slice(0, 10),
    ...hardSolvable.sort(byQ).slice(0, 35),
    ...hardImpossible.sort(byQ).slice(0, 10),
  ]

  // Re-assign sequential IDs
  selected.forEach((p, i) => { p.id = 200 + i })

  return selected
}

function writeOutput(puzzles: GeneratedPuzzle[], outPath: string) {
  const clean = puzzles.map(({ _qualityScore: _, ...p }) => p)

  const lines: string[] = [
    '// AUTO-GENERATED by scripts/generatePuzzles.ts — do not hand-edit',
    "import type { Puzzle } from '../types'",
    '',
    'const generatedPuzzles: Puzzle[] = [',
  ]

  for (const p of clean) {
    const verts = p.vertices
      .map((v) => `{ id: ${v.id}, x: ${v.x}, y: ${v.y} }`)
      .join(', ')
    const edgs = p.edges
      .map((e) => `{ id: ${e.id}, from: ${e.from}, to: ${e.to} }`)
      .join(', ')
    const sol = p.officialSolution
      ? `, officialSolution: [${p.officialSolution.join(', ')}]`
      : ''

    lines.push(
      `  { id: ${p.id}, difficulty: '${p.difficulty}', solvable: ${p.solvable}, ` +
      `vertices: [${verts}], edges: [${edgs}]${sol} },`
    )
  }

  lines.push(']', '', 'export default generatedPuzzles', '')

  writeFileSync(outPath, lines.join('\n'), 'utf-8')
  console.log(`\nWrote ${puzzles.length} puzzles → ${outPath}`)
}

// ─── Entry ───────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(__dirname, '../src/data/generatedPuzzles.ts')

console.log('Grafle Puzzle Generator\n')
const all = generate()
const selected = categorize(all)
writeOutput(selected, outPath)

console.log('\nDone. Run `npm run build` to include generated puzzles in the app.')
