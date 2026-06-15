interface Pt { x: number; y: number }

const VIEWBOX = 400
const CX = VIEWBOX / 2
const CY = VIEWBOX / 2

/** Round to 1 decimal for clean coordinates */
function r(n: number): number { return Math.round(n * 10) / 10 }

/** Place n vertices evenly on a circle */
export function circularLayout(
  n: number,
  cx = CX,
  cy = CY,
  radius = 155,
  startAngle = -Math.PI / 2
): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = startAngle + (2 * Math.PI * i) / n
    return { x: r(cx + radius * Math.cos(angle)), y: r(cy + radius * Math.sin(angle)) }
  })
}

/** Star layout: alternating outer/inner ring vertices */
export function starLayout(
  outerN: number,
  cx = CX,
  cy = CY,
  outerR = 155,
  innerR = 75
): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < outerN; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / outerN
    const halfAngle = angle + Math.PI / outerN
    pts.push({ x: r(cx + outerR * Math.cos(angle)), y: r(cy + outerR * Math.sin(angle)) })
    pts.push({ x: r(cx + innerR * Math.cos(halfAngle)), y: r(cy + innerR * Math.sin(halfAngle)) })
  }
  return pts
}

/** Hub at center + n rim vertices on a circle */
export function hubAndRim(n: number, cx = CX, cy = CY, rimR = 150): Pt[] {
  const rim = circularLayout(n, cx, cy, rimR)
  return [{ x: r(cx), y: r(cy) }, ...rim]
}

/**
 * Path layout: n vertices evenly spaced on a horizontal line,
 * optionally bent into a gentle arc.
 */
export function horizontalLayout(n: number, margin = 60, cy = CY): Pt[] {
  const spacing = (VIEWBOX - 2 * margin) / (n - 1)
  return Array.from({ length: n }, (_, i) => ({
    x: r(margin + i * spacing),
    y: r(cy),
  }))
}

/** Two parallel horizontal rows (for ladder/prism layouts) */
export function doubleRowLayout(n: number, margin = 60, yTop = 140, yBot = 260): Pt[] {
  const spacing = (VIEWBOX - 2 * margin) / (n - 1)
  const top = Array.from({ length: n }, (_, i) => ({ x: r(margin + i * spacing), y: r(yTop) }))
  const bot = Array.from({ length: n }, (_, i) => ({ x: r(margin + i * spacing), y: r(yBot) }))
  return [...top, ...bot]
}

/** Grid layout: rows × cols evenly spaced */
export function gridLayout(rows: number, cols: number, margin = 65): Pt[] {
  const pts: Pt[] = []
  const xStep = (VIEWBOX - 2 * margin) / (cols - 1)
  const yStep = (VIEWBOX - 2 * margin) / (rows - 1)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      pts.push({ x: r(margin + col * xStep), y: r(margin + row * yStep) })
    }
  }
  return pts
}

/** Custom layout: explicit [x,y] coordinate pairs */
export function customLayout(coords: [number, number][]): Pt[] {
  return coords.map(([x, y]) => ({ x: r(x), y: r(y) }))
}

/**
 * Concentric circles: inner ring of n_inner + outer ring of n_outer.
 * Used for friendship graphs, double-wheel, etc.
 */
export function concentricLayout(
  nInner: number,
  nOuter: number,
  cx = CX,
  cy = CY,
  innerR = 80,
  outerR = 155
): Pt[] {
  const inner = circularLayout(nInner, cx, cy, innerR)
  const outer = circularLayout(nOuter, cx, cy, outerR)
  return [...inner, ...outer]
}

/** Theta layout: 2 poles + internal vertices on 3 vertically-offset curves */
export function thetaLayout(k1: number, k2: number, k3: number): Pt[] {
  const pts: Pt[] = []
  const yMid = CY
  const poleOffset = 50
  // Poles offset vertically so no path overlaps them
  pts.push({ x: 70, y: r(CY - poleOffset) })    // pole 1 above center
  pts.push({ x: 330, y: r(CY + poleOffset) })   // pole 2 below center

  function curvePoints(count: number, yOffset: number): Pt[] {
    if (count === 0) return []
    const spacing = 240 / (count + 1)
    return Array.from({ length: count }, (_, i) => ({
      x: r(80 + (i + 1) * spacing),
      y: r(yMid + yOffset),
    }))
  }

  // Three paths with slight arc (y varies by path position and x position)
  function arcPoints(count: number, baseY: number, arch: number): Pt[] {
    if (count === 0) return []
    const spacing = 240 / (count + 1)
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 1) / (count + 1)
      const x = 80 + i * spacing
      const arc = arch * Math.sin(t * Math.PI)
      return { x: r(x), y: r(baseY + arc) }
    })
  }

  pts.push(...arcPoints(k1 - 1, yMid - 110, -15))
  pts.push(...arcPoints(k2 - 1, yMid - 15, -10))
  pts.push(...arcPoints(k3 - 1, yMid + 80, 15))
  return pts
}

/** Lollipop layout: cycle on left side, tail extends right */
export function lollipopLayout(n: number, k: number): Pt[] {
  const cycleR = 90
  const cycleCx = 130
  const pts = circularLayout(n, cycleCx, CY, cycleR)
  // Tail exits from vertex 0 (rightmost point of cycle) toward right
  const tailStart = { x: cycleCx + cycleR, y: CY }
  const spacing = (VIEWBOX - (cycleCx + cycleR) - 40) / k
  for (let i = 1; i < k; i++) {
    pts.push({ x: r(tailStart.x + i * spacing), y: r(CY) })
  }
  return pts
}

/** Book graph: spine in center, fan of apexes above/below alternating */
export function bookLayout(k: number): Pt[] {
  const pts: Pt[] = []
  // Spine vertices: left and right center
  pts.push({ x: 160, y: CY }) // vertex 1
  pts.push({ x: 240, y: CY }) // vertex 2
  // Apex vertices fanned out
  const halfK = Math.ceil(k / 2)
  for (let i = 0; i < k; i++) {
    const side = i % 2 === 0 ? -1 : 1 // alternate top/bottom
    const idx = Math.floor(i / 2)
    const spread = 100 / halfK
    const xOffset = (idx - (halfK - 1) / 2) * 60
    pts.push({ x: r(200 + xOffset), y: r(CY + side * (70 + idx * 20)) })
  }
  return pts
}

/** Friendship graph: center + k pairs of outer vertices */
export function friendshipLayout(k: number): Pt[] {
  const pts: Pt[] = []
  pts.push({ x: CX, y: CY }) // center
  const pairAngle = (2 * Math.PI) / k
  for (let i = 0; i < k; i++) {
    const baseAngle = -Math.PI / 2 + i * pairAngle
    const r1 = 140
    const spread = pairAngle * 0.3
    pts.push({
      x: r(CX + r1 * Math.cos(baseAngle - spread)),
      y: r(CY + r1 * Math.sin(baseAngle - spread)),
    })
    pts.push({
      x: r(CX + r1 * Math.cos(baseAngle + spread)),
      y: r(CY + r1 * Math.sin(baseAngle + spread)),
    })
  }
  return pts
}

/** Petersen-like: outer pentagon + inner pentagram */
export function petersenLayout(): Pt[] {
  const outer = circularLayout(5, CX, CY, 155)
  const inner = circularLayout(5, CX, CY, 80, -Math.PI / 2 + Math.PI / 5)
  return [...outer, ...inner]
}

/** Double-wheel: two centers + two concentric rings */
export function doubleWheelLayout(n: number): Pt[] {
  const pts: Pt[] = []
  pts.push({ x: 165, y: CY }) // center 1
  pts.push({ x: 235, y: CY }) // center 2
  const inner = circularLayout(n, CX, CY, 90)
  const outer = circularLayout(n, CX, CY, 155, -Math.PI / 2 + Math.PI / n)
  return [...pts, ...inner, ...outer]
}
