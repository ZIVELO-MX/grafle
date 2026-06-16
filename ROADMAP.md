# Grafle — Roadmap

Items are listed in priority order.

---

## ✅ 0. Real Graph Engine (v2)

**Status:** Shipped — June 2026

Replaced the static shape-based puzzle generation with a graph-theoretic engine:

- **Random graph models**: Erdős–Rényi, Watts–Strogatz (small-world), Barabási–Albert (scale-free), random regular, random bipartite
- **Classic named graphs**: Petersen, Chvátal, Wagner, Franklin, Herschel, Möbius–Kantor, Pappus, Desargues, Folkman, Coxeter, Robertson, cube Q3, octahedron, and more
- **Graph operations**: chord addition, vertex split, Cartesian product, graph join
- **Force-directed layout**: Fruchterman–Reingold algorithm for automatic, organic graph visualization
- **Enhanced quality scoring**: edge length uniformity, angle resolution, degree bonuses

Run `npm run generate` to produce a fresh set of puzzles.

---

## ✅ 0.1. Special Day Puzzles

**Status:** Shipped — June 2026

Certain calendar dates get hand-crafted puzzle shapes with a distinct visual theme:

- Custom graph layout pinned to a specific date slot in the June schedule
- `accent` color field on the puzzle drives themed node fills, edge colors, and win-state background
- Confetti fires on solve only for special-day puzzles (gated on `puzzle.accent`)
- **Jun 16**: house graph (square + triangular roof, easy) — green accent `#166534`
- **Jun 19**: house graph with diagonal chord (harder) — red accent `#dc2626`

New special days are added by extending `SPECIAL_PUZZLES` in `scripts/generatePuzzles.ts`. The `Graph.tsx` color helpers (`wonBg`, `snapFill`, `reachableFill`, `idleNodeFill`, etc.) already branch on the two accent values.

---

## 0.2. Impossible Button — Confirmation + Penalty

**Status:** Planned

Improve the UX and stakes of the "Impossible" button to make it a meaningful risk:

- **Confirmation dialog**: pressing "Impossible" shows a modal asking the player to confirm. This prevents accidental presses and makes the decision feel deliberate.
- **All-lives penalty**: if the player confirms and the puzzle is actually solvable, they lose all remaining lives at once (instant game over). This makes the Impossible button a high-risk call, not a free guess.
- **Ran-out-of-lives + was impossible**: if a player loses all their lives through normal attempts and the puzzle turns out to be impossible, show a 😂 emoji with a message indicating the puzzle was in fact impossible (e.g. "That one was impossible — you couldn't have solved it!"). This rewards players who suspected it but ran out of lives trying.

The current `ImpossibleButton` component and `handleImpossible` hook logic are the entry points for this change.

---

## 1. Survival Mode

**Status:** Planned

Endless procedurally-generated puzzles with increasing difficulty:

- Difficulty scales per round: more vertices, higher degrees, tighter degree constraints
- Lives system carries over from daily mode
- Leaderboard: most edges traversed in a single survival run
- Practice mode with unlimited, low-stakes puzzles derived from the random graph engine

The `randomGraphs.ts` module already provides the building blocks.

---

## 2. Classic Graph Challenges

**Status:** Planned

Specially curated puzzles based on famous graphs from mathematics:

- "Name That Graph" — identify the classic graph from its structure
- "The Impossible Collection" — a sequence of graphs with no Eulerian path
- "Graph of the Day" spotlight: a classic graph with a historical note
- Unlockable achievements: solve Petersen, solve all cubic graphs, etc.

The `classicGraphs.ts` module contains the growing library of named graphs.

---

## 3. Graph Operations & Transformations

**Status:** Planned

Puzzles where the graph changes during gameplay:

- **Subdivision rounds**: an edge splits mid-puzzle, adding a new vertex
- **Edge deletion**: after each traversal, a random edge disappears
- **Graph evolution**: start simple, watch the graph grow via operations each turn
- **Dual challenges**: solve the dual graph instead of the primal

---

## 4. Persistent Puzzle Storage

**Status:** Next up

- Database (Postgres / Supabase) storing puzzles with metadata
- Admin CLI for generating, reviewing, and scheduling puzzles
- API endpoint to fetch today's puzzle by date
- Versioned puzzle format for backwards compatibility

---

## 5. Global Leaderboard

- Server-side ranking API
- Anonymous submissions with player identifier + nickname
- Daily, weekly, and all-time leaderboards
- Anti-cheat: server validates solution path

---

## 6. Puzzle Editor

- Visual drag-and-drop graph editor
- Automatic solvability verification
- Difficulty estimation algorithm (uses the quality scoring engine)
- Batch import/export

---

## 7. Streak Sharing & Social

- Daily share cards with puzzle artwork
- Twitter/X card preview
- Open Graph meta tags for link previews

---

## 8. Accounts (Optional)

- Optional sign-up for cross-device sync
- Email digest with daily puzzle reminder
- Leaderboard profile page

---

## 9. Additional Languages

- French, Portuguese, German
- RTL language support (Arabic, Hebrew)

---

## 10. Accessibility

- Full keyboard navigation for the graph
- Screen reader support with ARIA live regions
- High-contrast theme
- Reduced motion option

---

## 11. Native App

- React Native port
- App Store / Play Store distribution
- Push notifications for daily puzzle reminder
