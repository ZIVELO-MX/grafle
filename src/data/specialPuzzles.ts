import type { Puzzle } from '../types'

// Friendship graph F₃: center + 3 triangle pairs = 7 vertices, 9 edges
// All vertices even degree → Eulerian circuit — start anywhere
// Symmetric like a 3-leaf clover — celebratory feel
const june16: Puzzle = {
  id: 16,
  difficulty: 'easy',
  solvable: true,
  isSpecial: true,
  specialDate: '06-16',
  vertices: [
    { id: 1, x: 200, y: 200 },
    { id: 2, x: 148, y: 70 },
    { id: 3, x: 252, y: 70 },
    { id: 4, x: 338, y: 220 },
    { id: 5, x: 287, y: 310 },
    { id: 6, x: 113, y: 310 },
    { id: 7, x: 62, y: 220 },
  ],
  edges: [
    { id: 1, from: 1, to: 2 },
    { id: 2, from: 2, to: 3 },
    { id: 3, from: 3, to: 1 },
    { id: 4, from: 1, to: 4 },
    { id: 5, from: 4, to: 5 },
    { id: 6, from: 5, to: 1 },
    { id: 7, from: 1, to: 6 },
    { id: 8, from: 6, to: 7 },
    { id: 9, from: 7, to: 1 },
  ],
  officialSolution: [1, 2, 3, 1, 4, 5, 1, 6, 7, 1],
}

// Friendship graph F₄: center + 4 triangle pairs = 9 vertices, 12 edges
// All vertices even degree → Eulerian circuit
// Fuller, more festive flower shape
const june19: Puzzle = {
  id: 19,
  difficulty: 'hard',
  solvable: true,
  isSpecial: true,
  specialDate: '06-19',
  vertices: [
    { id: 1, x: 200, y: 200 },
    { id: 2, x: 215, y: 64 },
    { id: 3, x: 319, y: 99 },
    { id: 4, x: 340, y: 200 },
    { id: 5, x: 319, y: 301 },
    { id: 6, x: 215, y: 336 },
    { id: 7, x: 185, y: 336 },
    { id: 8, x: 81, y: 301 },
    { id: 9, x: 60, y: 200 },
    { id: 10, x: 81, y: 99 },
    { id: 11, x: 185, y: 64 },
  ],
  edges: [
    { id: 1, from: 1, to: 11 },
    { id: 2, from: 11, to: 2 },
    { id: 3, from: 2, to: 1 },
    { id: 4, from: 1, to: 3 },
    { id: 5, from: 3, to: 4 },
    { id: 6, from: 4, to: 1 },
    { id: 7, from: 1, to: 5 },
    { id: 8, from: 5, to: 6 },
    { id: 9, from: 6, to: 1 },
    { id: 10, from: 1, to: 7 },
    { id: 11, from: 7, to: 8 },
    { id: 12, from: 8, to: 1 },
    { id: 13, from: 1, to: 9 },
    { id: 14, from: 9, to: 10 },
    { id: 15, from: 10, to: 1 },
  ],
  officialSolution: [1, 11, 2, 1, 3, 4, 1, 5, 6, 1, 7, 8, 1, 9, 10, 1],
}

const specialPuzzles: Puzzle[] = [june16, june19]

export default specialPuzzles
