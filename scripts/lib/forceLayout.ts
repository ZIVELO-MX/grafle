interface Pt { x: number; y: number }

const VIEWBOX = 400
const MARGIN = 40

function r(n: number): number {
  return Math.round(n * 10) / 10
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function forceDirectedLayout(
  n: number,
  edges: { from: number; to: number }[],
  width = VIEWBOX,
  height = VIEWBOX,
  iterations = 150,
  seed = Date.now()
): Pt[] {
  const rand = seededRandom(seed)
  const margin = MARGIN
  const area = width * height
  const k = Math.sqrt(area / n) * 1.2

  const pos: Pt[] = Array.from({ length: n }, () => ({
    x: r(margin + rand() * (width - 2 * margin)),
    y: r(margin + rand() * (height - 2 * margin)),
  }))

  const adj: Set<number>[] = Array.from({ length: n }, () => new Set())
  const validEdges = edges.filter((e) => {
    const u = e.from - 1
    const v = e.to - 1
    return u >= 0 && u < n && v >= 0 && v < n && u !== v
  })
  for (const e of validEdges) {
    const u = e.from - 1
    const v = e.to - 1
    adj[u].add(v)
    adj[v].add(u)
  }

  for (let iter = 0; iter < iterations; iter++) {
    const temp = (1 - iter / iterations) * k

    const disp: Pt[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }))

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x
        let dy = pos[i].y - pos[j].y
        let dist = Math.hypot(dx, dy)
        if (dist < 0.1) {
          dx = rand() * 2 - 1
          dy = rand() * 2 - 1
          dist = Math.hypot(dx, dy)
        }
        const repForce = (k * k) / dist
        const fx = (dx / dist) * repForce
        const fy = (dy / dist) * repForce
        disp[i].x += fx
        disp[i].y += fy
        disp[j].x -= fx
        disp[j].y -= fy
      }
    }

    for (const e of validEdges) {
      const i = e.from - 1
      const j = e.to - 1
      const dx = pos[i].x - pos[j].x
      const dy = pos[i].y - pos[j].y
      const dist = Math.max(Math.hypot(dx, dy), 0.1)
      const attForce = (dist * dist) / k
      const fx = (dx / dist) * attForce
      const fy = (dy / dist) * attForce
      disp[i].x -= fx
      disp[i].y -= fy
      disp[j].x += fx
      disp[j].y += fy
    }

    for (let i = 0; i < n; i++) {
      const d = Math.hypot(disp[i].x, disp[i].y)
      if (d > 0) {
        const scale = Math.min(d, temp) / d
        pos[i].x += disp[i].x * scale
        pos[i].y += disp[i].y * scale
      }
      pos[i].x = Math.max(margin, Math.min(width - margin, pos[i].x))
      pos[i].y = Math.max(margin, Math.min(height - margin, pos[i].y))
    }
  }

  return pos.map((p) => ({ x: r(p.x), y: r(p.y) }))
}

export function concentricForceLayout(
  n: number,
  edges: { from: number; to: number }[],
  rings: number[],
  width = VIEWBOX,
  height = VIEWBOX,
  seed = Date.now()
): Pt[] {
  const pos: Pt[] = []
  const rand = seededRandom(seed * 37)
  const cx = width / 2
  const cy = height / 2
  const maxR = Math.min(width, height) / 2 - MARGIN

  let idx = 0
  for (let r = 0; r < rings.length; r++) {
    const count = rings[r]
    const radius = (maxR * (r + 1)) / rings.length
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count + rand() * 0.1
      pos.push({
        x: r(cx + radius * Math.cos(angle)),
        y: r(cy + radius * Math.sin(angle)),
      })
      idx++
    }
  }

  if (pos.length !== n) {
    return forceDirectedLayout(n, edges, width, height, 150, seed)
  }

  const adj: Set<number>[] = Array.from({ length: n }, () => new Set())
  for (const e of edges) {
    adj[e.from - 1].add(e.to - 1)
    adj[e.to - 1].add(e.from - 1)
  }

  const k = Math.sqrt((width * height) / n) * 1.5

  for (let iter = 0; iter < 80; iter++) {
    const temp = (1 - iter / 80) * k
    const disp: Pt[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }))

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x
        let dy = pos[i].y - pos[j].y
        let dist = Math.max(Math.hypot(dx, dy), 0.1)
        const repForce = (k * k) / dist
        disp[i].x += (dx / dist) * repForce
        disp[i].y += (dy / dist) * repForce
        disp[j].x -= (dx / dist) * repForce
        disp[j].y -= (dy / dist) * repForce
      }
    }

    for (const e of edges) {
      const i = e.from - 1
      const j = e.to - 1
      if (i === j) continue
      const dx = pos[i].x - pos[j].x
      const dy = pos[i].y - pos[j].y
      const dist = Math.max(Math.hypot(dx, dy), 0.1)
      const attForce = (dist * dist) / k
      disp[i].x -= (dx / dist) * attForce
      disp[i].y -= (dy / dist) * attForce
      disp[j].x += (dx / dist) * attForce
      disp[j].y += (dy / dist) * attForce
    }

    for (let i = 0; i < n; i++) {
      const d = Math.hypot(disp[i].x, disp[i].y)
      if (d > 0) {
        const scale = Math.min(d, temp) / d
        pos[i].x += disp[i].x * scale
        pos[i].y += disp[i].y * scale
      }
      pos[i].x = Math.max(MARGIN, Math.min(width - MARGIN, pos[i].x))
      pos[i].y = Math.max(MARGIN, Math.min(height - MARGIN, pos[i].y))
    }
  }

  return pos.map((p) => ({ x: r(p.x), y: r(p.y) }))
}
