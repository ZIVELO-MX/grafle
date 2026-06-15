import type { RawGraph } from './shapes.js'

export function petersenGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 5; i++) edges.push({ from: i, to: (i % 5) + 1 })
  const inner = [6, 7, 8, 9, 10]
  for (let i = 0; i < 5; i++) edges.push({ from: inner[i], to: inner[(i + 2) % 5] })
  for (let i = 0; i < 5; i++) edges.push({ from: i + 1, to: inner[i] })
  return { vertexCount: 10, edges }
}

export function petersenStar(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 5; i++) edges.push({ from: i, to: (i % 5) + 1 })
  const inner = [6, 7, 8, 9, 10]
  for (let i = 0; i < 5; i++) edges.push({ from: inner[i], to: inner[(i + 3) % 5] })
  for (let i = 0; i < 5; i++) edges.push({ from: i + 1, to: inner[i] })
  return { vertexCount: 10, edges }
}

export function completeGraph(n: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      edges.push({ from: i, to: j })
    }
  }
  return { vertexCount: n, edges }
}

export function completeBipartiteGraph(n1: number, n2: number): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= n1; i++) {
    for (let j = 1; j <= n2; j++) {
      edges.push({ from: i, to: n1 + j })
    }
  }
  return { vertexCount: n1 + n2, edges }
}

export function cubeGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 0; i < 4; i++) {
    const bit = 1 << i
    for (let v = 0; v < 8; v++) {
      if ((v & bit) === 0) {
        edges.push({ from: v + 1, to: (v | bit) + 1 })
      }
    }
  }
  return { vertexCount: 8, edges }
}

export function octahedronGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 6; i++) {
    for (let j = i + 1; j <= 6; j++) {
      if (i + j !== 7) edges.push({ from: i, to: j })
    }
  }
  return { vertexCount: 6, edges }
}

export function utilityGraph(): RawGraph {
  return completeBipartiteGraph(3, 3)
}

export function wagnerGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 7; i++) edges.push({ from: i, to: i + 1 })
  edges.push({ from: 8, to: 1 })
  for (let i = 1; i <= 4; i++) edges.push({ from: i, to: i + 4 })
  edges.push({ from: 1, to: 5 })
  edges.push({ from: 4, to: 8 })
  edges.push({ from: 3, to: 7 })
  edges.push({ from: 2, to: 6 })
  return { vertexCount: 8, edges }
}

export function chvatalGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 11; i++) edges.push({ from: i, to: i + 1 })
  edges.push({ from: 12, to: 1 })
  for (let i = 1; i <= 12; i++) edges.push({ from: i, to: ((i + 3) % 12) + 1 })
  for (let i = 1; i <= 12; i++) edges.push({ from: i, to: ((i + 7) % 12) + 1 })
  return { vertexCount: 12, edges }
}

export function herschelGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  edges.push({ from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 4, to: 5 })
  edges.push({ from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8 }, { from: 8, to: 1 })
  edges.push({ from: 1, to: 9 }, { from: 2, to: 9 }, { from: 3, to: 10 }, { from: 4, to: 10 })
  edges.push({ from: 5, to: 11 }, { from: 6, to: 11 }, { from: 7, to: 9 }, { from: 8, to: 11 })
  edges.push({ from: 9, to: 10 }, { from: 10, to: 11 })
  return { vertexCount: 11, edges }
}

export function franklinGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 11; i++) edges.push({ from: i, to: i + 1 })
  edges.push({ from: 12, to: 1 })
  for (let i = 1; i <= 6; i++) edges.push({ from: i, to: i + 6 })
  edges.push({ from: 1, to: 8 }, { from: 3, to: 10 }, { from: 5, to: 12 })
  edges.push({ from: 7, to: 2 }, { from: 9, to: 4 }, { from: 11, to: 6 })
  return { vertexCount: 12, edges }
}

export function mobiusKantorGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 15; i++) edges.push({ from: i, to: i + 1 })
  edges.push({ from: 16, to: 1 })
  for (let i = 0; i < 8; i++) {
    edges.push({ from: i + 1, to: ((i + 5) % 8) + 9 })
  }
  return { vertexCount: 16, edges }
}

export function pappusGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 17; i++) edges.push({ from: i, to: i + 1 })
  edges.push({ from: 18, to: 1 })
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const a = i * 6 + j + 1
      const b = (i * 6 + j + 3) % 18 + 1
      edges.push({ from: a, to: b })
    }
  }
  return { vertexCount: 18, edges }
}

export function desarguesGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 19; i++) edges.push({ from: i, to: i + 1 })
  edges.push({ from: 20, to: 1 })
  for (let i = 0; i < 10; i++) {
    edges.push({ from: i + 1, to: ((i + 10) % 20) + 1 })
  }
  return { vertexCount: 20, edges }
}

export function grotzschGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  const C5 = [1, 2, 3, 4, 5]
  for (let i = 0; i < 5; i++) edges.push({ from: C5[i], to: C5[(i + 1) % 5] })
  let nextId = 6
  for (let i = 0; i < 5; i++) {
    const a = nextId++
    const b = nextId++
    edges.push({ from: C5[i], to: a })
    edges.push({ from: C5[(i + 2) % 5], to: a })
    edges.push({ from: C5[(i + 3) % 5], to: b })
    edges.push({ from: a, to: b })
  }
  return { vertexCount: 15, edges }
}

export function folkmanGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 19; i++) edges.push({ from: i, to: i + 1 })
  edges.push({ from: 20, to: 1 })
  for (let i = 0; i < 10; i++) {
    const a = i + 1
    const b = ((i + 4) % 10) + 1
    const c = i + 11
    const d = ((i + 4) % 10) + 11
    edges.push({ from: a, to: c }, { from: b, to: d })
  }
  for (let i = 0; i < 10; i++) edges.push({ from: i + 1, to: ((i + 1) % 10) + 11 })
  for (let i = 0; i < 10; i++) edges.push({ from: i + 11, to: ((i + 4) % 10) + 11 })
  return { vertexCount: 20, edges }
}

export function coxeterGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let g = 0; g < 5; g++) {
    const offset = g * 6
    for (let i = 0; i < 5; i++) edges.push({ from: offset + i + 1, to: offset + ((i + 1) % 5) + 1 })
    edges.push({ from: offset + 1, to: offset + 6 })
    edges.push({ from: offset + 3, to: offset + 6 })
    edges.push({ from: offset + 5, to: offset + 6 })
  }
  for (let g = 0; g < 5; g++) {
    const offset = g * 6
    const nextOffset = ((g + 1) % 5) * 6
    edges.push({ from: offset + 2, to: nextOffset + 4 })
    edges.push({ from: offset + 4, to: nextOffset + 2 })
  }
  return { vertexCount: 30, edges }
}

export function hypercubeGraph(dim: number): RawGraph | null {
  if (dim < 2 || dim > 5) return null
  const n = 1 << dim
  const edges: { from: number; to: number }[] = []
  for (let i = 0; i < dim; i++) {
    const bit = 1 << i
    for (let v = 0; v < n; v++) {
      if ((v & bit) === 0) {
        edges.push({ from: v + 1, to: (v | bit) + 1 })
      }
    }
  }
  return { vertexCount: n, edges }
}

export function robertsonGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 1; i <= 18; i++) edges.push({ from: i, to: i + 1 })
  edges.push({ from: 19, to: 1 })
  for (let i = 0; i < 19; i++) {
    const a = i + 1
    const b = ((i + 5) % 19) + 1
    const c = ((i + 8) % 19) + 1
    edges.push({ from: a, to: b })
    edges.push({ from: a, to: c })
  }
  return { vertexCount: 19, edges }
}

export function tutteGraph(): RawGraph {
  const edges: { from: number; to: number }[] = []
  for (let i = 0; i < 3; i++) {
    const off = i * 12
    for (let j = 0; j < 5; j++) edges.push({ from: off + j + 1, to: off + ((j + 1) % 5) + 1 })
    edges.push({ from: off + 1, to: off + 6 })
    edges.push({ from: off + 3, to: off + 6 })
    edges.push({ from: off + 5, to: off + 6 })
    for (let j = 0; j < 5; j++) edges.push({ from: off + j + 7, to: off + ((j + 1) % 5) + 7 })
    edges.push({ from: off + 7, to: off + 12 })
    edges.push({ from: off + 9, to: off + 12 })
    edges.push({ from: off + 11, to: off + 12 })
    edges.push({ from: off + 1, to: off + 9 })
    edges.push({ from: off + 3, to: off + 11 })
    edges.push({ from: off + 5, to: off + 7 })
  }
  for (let i = 0; i < 3; i++) {
    const off = i * 12
    const nextOff = ((i + 1) % 3) * 12
    edges.push({ from: off + 2, to: nextOff + 10 })
    edges.push({ from: off + 4, to: nextOff + 8 })
    edges.push({ from: off + 6, to: nextOff + 12 })
    edges.push({ from: off + 8, to: nextOff + 4 })
    edges.push({ from: off + 10, to: nextOff + 2 })
    edges.push({ from: off + 12, to: nextOff + 6 })
  }
  return { vertexCount: 36, edges }
}

export function cageGraph(girth: number, degree: number): RawGraph | null {
  const cages: Record<string, () => RawGraph> = {
    '3-3': () => completeGraph(4),
    '4-3': () => utilityGraph(),
    '5-3': () => petersenGraph(),
    '6-3': () => wagnerGraph(),
    '6-4': () => completeBipartiteGraph(4, 4),
  }
  const key = `${girth}-${degree}`
  if (cages[key]) return cages[key]()
  return null
}
