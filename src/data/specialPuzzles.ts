import type { Puzzle } from '../types'

// June 16 — founder birthday
// A 6-pointed star (Star of David layout): outer hexagon + inner triangle chords
// 6 vertices on outer ring, 6 edges forming hexagon + 3 alternating chords = 9 edges
// Eulerian: every vertex has degree 3 (odd) → not Eulerian circuit but can have Eulerian path with exactly 2 odd-degree vertices
// Let's use a wheel graph W5: center + pentagon. Center has degree 5 (odd), two pentagon vertices will get extra chord.
// Simpler approach: decorated hexagon with exactly 2 odd-degree vertices.
// Hexagon (6 edges) + 2 chords (1-4 and 2-5) → degrees: 1:3,2:3,3:2,4:3,5:3,6:2 → 4 odd-degree vertices → not Eulerian
// Use: triangle with 3 internal chords creating a Star of David feel
// 6 vertices: 3 outer triangle + 3 inner triangle. Each outer connects to 2 inner + 1 outer neighbor.
// Degrees: outer vertices degree 3 (odd), inner vertices degree 3 (odd) → 6 odd → not Eulerian
// Let's just use a clean solvable graph that looks like a star.
// Diamond with extra: 5 vertices, 7 edges, 2 odd-degree vertices at top and bottom.
// Vertices: top(1), left(2), right(3), bottom(4), center(5)
// Edges: 1-2, 1-3, 2-5, 3-5, 2-4, 3-4, 1-5
// Degrees: 1:3, 2:3, 3:3, 4:2, 5:3 → 4 odd-degree → not Eulerian
// Adjusted: remove 1-5, add 4-5 → 1:2, 2:3, 3:3, 4:3, 5:3 → 4 odd → still no
// Use the figure-eight / bowtie for June 16: two triangles sharing a center
// Center(1), TL(2), TR(3), BL(4), BR(5)
// Edges: 1-2, 2-3, 3-1, 1-4, 4-5, 5-1 → degrees: 1:4, 2:2, 3:2, 4:2, 5:2 → all even → Eulerian circuit!
// That's a clean bowtie — memorable and solvable from any vertex.
// Let's make it more visually interesting: 7 vertices arranged as a star with a Eulerian path
// Using a house+base: 5 vertices (square + roof peak), add center cross
// Actually, let's keep it simple and beautiful: two squares sharing a vertex (figure-8)
// Top square: 1(TL),2(TR),3(BR),4(BL) + Bottom square: 3(TR),5(TR2),6(BR2),7(BL2)
// That would need shared vertex — complex. Let's go with the bowtie for June 16
// and a 4-leaf clover (two overlapping rectangles) for June 19.

// June 16 — Bowtie (two triangles sharing center) — clean, symmetric, memorable
// All even degrees → Eulerian circuit, start anywhere
const june16: Puzzle = {
  id: 100,
  difficulty: 'hard',
  solvable: true,
  isSpecial: true,
  specialDate: '06-16',
  vertices: [
    { id: 1, x: 200, y: 200 }, // center
    { id: 2, x: 80, y: 80 },   // top-left
    { id: 3, x: 320, y: 80 },  // top-right
    { id: 4, x: 80, y: 320 },  // bottom-left
    { id: 5, x: 320, y: 320 }, // bottom-right
  ],
  edges: [
    { id: 1, from: 1, to: 2 },
    { id: 2, from: 2, to: 3 },
    { id: 3, from: 3, to: 1 },
    { id: 4, from: 1, to: 4 },
    { id: 5, from: 4, to: 5 },
    { id: 6, from: 5, to: 1 },
  ],
  officialSolution: [1, 2, 3, 1, 4, 5, 1],
}

// June 19 — Envelope graph (K4 minus one edge) — looks like an envelope, memorable
// 4 vertices forming a rectangle + both diagonals + top edge
// Actually: 4 vertices, 5 edges — envelope shape (rectangle + one diagonal)
// Degrees: depends. Rectangle (4 edges) + diagonal 1-3: v1:3, v2:2, v3:3, v4:2 → 2 odd → Eulerian path!
// Layout: top-left(1), top-right(2), bottom-right(3), bottom-left(4)
// Edges: 1-2(top), 2-3(right), 3-4(bottom), 4-1(left), 1-3(diagonal)
// Degrees: 1:3, 2:2, 3:3, 4:2 → odd at 1 and 3 → Eulerian path from 1 to 3 or 3 to 1
// Add more edges for "hard" feel: also add 2-4(other diagonal) → degrees: 1:3, 2:3, 3:3, 4:3 → 4 odd → not Eulerian
// Keep envelope (5 edges, easy-ish) but classify hard for the special feel
// Let's go with 6 vertices for more visual interest: hexagon with one chord
// Hexagon: 1-2-3-4-5-6-1 (6 edges) + chord 1-4 (1 edge) = 7 edges
// Degrees: 1:3, 2:2, 3:2, 4:3, 5:2, 6:2 → 2 odd (1 and 4) → Eulerian path from 1 to 4!
const june19: Puzzle = {
  id: 101,
  difficulty: 'hard',
  solvable: true,
  isSpecial: true,
  specialDate: '06-19',
  vertices: [
    { id: 1, x: 200, y: 50 },   // top
    { id: 2, x: 340, y: 140 },  // top-right
    { id: 3, x: 340, y: 260 },  // bottom-right
    { id: 4, x: 200, y: 350 },  // bottom
    { id: 5, x: 60, y: 260 },   // bottom-left
    { id: 6, x: 60, y: 140 },   // top-left
  ],
  edges: [
    { id: 1, from: 1, to: 2 },
    { id: 2, from: 2, to: 3 },
    { id: 3, from: 3, to: 4 },
    { id: 4, from: 4, to: 5 },
    { id: 5, from: 5, to: 6 },
    { id: 6, from: 6, to: 1 },
    { id: 7, from: 1, to: 4 },
  ],
  officialSolution: [1, 2, 3, 4, 5, 6, 1, 4],
}

const specialPuzzles: Puzzle[] = [june16, june19]

export default specialPuzzles
