# Grafle — Roadmap

Items are listed in priority order. The MVP ships without any of these.

---

## 1. Persistent Puzzle Storage

**Status:** Planned  
Replace the static `src/data/puzzles.ts` file with a real puzzle management system:

- Database (Postgres, PlanetScale, etc.) storing puzzles with metadata
- Admin UI or CLI for adding and scheduling new puzzles
- API endpoint to fetch today's puzzle by date
- Versioned puzzle format for backwards compatibility

The game engine is already decoupled from the puzzle source via `puzzleProvider.ts`.

---

## 2. Global Leaderboard

- Server-side ranking API
- Anonymous submissions with player identifier + nickname
- Daily, weekly, and all-time leaderboards
- Anti-cheat: server validates solution path

---

## 3. Puzzle Editor

- Visual drag-and-drop graph editor
- Automatic solvability verification
- Difficulty estimation algorithm
- Batch import/export

---

## 4. Streak Sharing & Social

- Daily share cards with puzzle artwork
- Twitter/X card preview
- Open Graph meta tags for link previews

---

## 5. Accounts (Optional)

- Optional sign-up for cross-device sync
- Email digest with daily puzzle reminder
- Leaderboard profile page

---

## 6. Additional Languages

- French, Portuguese, German
- RTL language support (Arabic, Hebrew)

---

## 7. Accessibility

- Full keyboard navigation for the graph
- Screen reader support with ARIA live regions
- High-contrast theme
- Reduced motion option

---

## 8. Native App

- React Native port
- App Store / Play Store distribution
- Push notifications for daily puzzle reminder

---

## 9. Puzzle Variations

- Timed challenge mode
- Multi-player head-to-head
- Hint system (limited hints per day)
- Practice mode with unlimited puzzles
