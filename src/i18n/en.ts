const en = {
  title: 'GRAFLE',
  tagline: 'Connect every edge. Or prove it can\'t be done.',
  daily_puzzle: 'Daily Puzzle',
  impossible: 'Impossible',
  restart: 'Restart',
  share: 'Share Result',
  copied: 'Copied!',

  // Game messages
  tap_to_start: 'Tap any point to start',
  tap_to_continue: 'Tap an adjacent point',
  stuck: 'No more moves — restart to try a different path',
  wrong_impossible: 'This puzzle can be solved. Keep trying!',
  correct_impossible: 'Correct — this one really is impossible!',

  // Completion modal
  puzzle_solved: 'Puzzle Solved',
  puzzle_impossible: 'Impossible!',
  time_label: 'Time',
  score_label: 'Score',

  // Help modal
  how_to_play: 'How to Play',
  help_1: 'Start from any point.',
  help_2: 'Draw a route through the graph.',
  help_3: 'Use every connection exactly once.',
  help_4: 'Think it can\'t be done? Press Impossible.',
  got_it: 'Got It',

  // Settings modal
  settings: 'Settings',
  language: 'Language',
  english: 'English',
  spanish: 'Spanish',
  close: 'Close',

  // Menu
  menu: 'Menu',
  blog: 'Blog',
  donate: 'Donate',

  // Stats modal
  statistics: 'Statistics',
  games_played: 'Games Played',
  wins: 'Wins',
  success_rate: 'Success Rate',
  current_streak: 'Current Streak',
  best_streak: 'Best Streak',
  avg_time: 'Average Time',
  best_score: 'Best Score',

  // Rankings modal
  rankings: 'Rankings',
  your_best: 'Your Best',
  rank: 'Rank',
  score: 'Score',
  time: 'Time',
  date: 'Date',
  no_results_yet: 'No results yet. Play a puzzle to get on the board!',
  nickname_prompt: 'Your nickname',
  save: 'Save',

  // Difficulty
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
} as const

export type I18nKeys = keyof typeof en
export default en
