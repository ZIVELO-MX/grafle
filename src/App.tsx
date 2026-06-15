import { useState, useEffect, useCallback, useRef } from 'react'
import Header from './components/Header'
import PuzzleNav from './components/PuzzleNav'
import Graph from './components/Graph'
import ImpossibleButton from './components/ImpossibleButton'
import LivesDisplay from './components/LivesDisplay'

import SolutionViewer from './components/SolutionViewer'
import Toast from './components/Toast'
import HelpModal from './components/modals/HelpModal'
import SettingsModal from './components/modals/SettingsModal'
import MenuDrawer from './components/modals/MenuDrawer'
import CompletionModal from './components/modals/CompletionModal'
import StatsModal from './components/modals/StatsModal'
import RankingsModal from './components/modals/RankingsModal'
import { I18nContext, translations } from './i18n'
import { useGame } from './hooks/useGame'
import {
  getPuzzleForDate,
  getPuzzleByNumber,
  getCurrentPuzzleNumber,
} from './lib/puzzleProvider'
import { loadSettings, saveSettings, getResultForDate } from './lib/storage'
import { formatTime } from './lib/scoring'
import type { GameState, ModalId, Puzzle, Settings } from './types'

function useTick(active: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [active])
}

/** Build a synthetic completed state for a past solved puzzle */
function buildCompletedState(puzzle: Puzzle, usedImpossible: boolean): GameState {
  const status = usedImpossible ? 'impossible-correct' : 'won'
  const allEdgeIds = new Set(puzzle.edges.map((e) => e.id))
  const sol = puzzle.officialSolution
  const lastVertex = sol && sol.length > 0 ? sol[sol.length - 1] : null
  return {
    path: puzzle.officialSolution ?? [],
    usedEdgeIds: usedImpossible ? new Set() : allEdgeIds,
    currentVertexId: usedImpossible ? null : lastVertex,
    status,
    startTime: null,
    endTime: null,
    attempts: 0,
    invalidVertexId: null,
    stuckVertexId: null,
    livesRemaining: 3,
  }
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [modal, setModal] = useState<ModalId>(null)
  const [puzzleNumber, setPuzzleNumber] = useState(getCurrentPuzzleNumber)
  const [showToast, setShowToast] = useState(false)

  const todayNumber = getCurrentPuzzleNumber()
  const isToday = puzzleNumber === todayNumber
  const hasStarted = useRef(false)

  const puzzleEntry = isToday
    ? { puzzle: getPuzzleForDate(), date: new Date() }
    : getPuzzleByNumber(puzzleNumber) ?? { puzzle: getPuzzleForDate(), date: new Date() }

  const puzzle = puzzleEntry.puzzle
  const puzzleDate = puzzleEntry.date.toISOString().slice(0, 10)

  // For past puzzles: check if already completed
  const pastResult = !isToday ? getResultForDate(puzzleDate) : null
  const isPastCompleted = pastResult?.won === true

  const { state, handleVertexClick, handleImpossible, restart, handleStart, elapsedSeconds, score } =
    useGame(puzzle, puzzleNumber, isToday)

  // Auto-start: skip the start screen entirely
  useEffect(() => {
    if (state.status === 'not-started' && !hasStarted.current) {
      hasStarted.current = true
      setTimeout(() => handleStart(), 50)
    }
  }, [state.status, handleStart])

  useEffect(() => {
    hasStarted.current = false
  }, [puzzleNumber])

  // Tick whenever the clock is running: from Start press until the game ends
  const isTimerRunning = state.startTime !== null &&
    state.status !== 'won' && state.status !== 'impossible-correct' && state.status !== 'lost'
  useTick(isTimerRunning)

  const handleSettingsSave = useCallback((s: Settings) => {
    setSettings(s)
    saveSettings(s)
  }, [])

  const openModal = useCallback((id: ModalId) => setModal(id), [])
  const closeModal = useCallback(() => setModal(null), [])

  const won = state.status === 'won' || state.status === 'impossible-correct'
  const lost = state.status === 'lost'
  const gameStarted = state.status !== 'not-started'

  const completionShownRef = useRef(false)
  useEffect(() => {
    if (!won) {
      completionShownRef.current = false
      return
    }
    if (completionShownRef.current) return
    completionShownRef.current = true
    setShowToast(true)
    const timer = setTimeout(() => setModal('completion'), 800)
    return () => clearTimeout(timer)
  }, [won])

  const t = translations[settings.language]

  const gameHint = (() => {
    if (state.status === 'impossible-wrong') return t.wrong_impossible
    if (state.stuckVertexId !== null) return t.stuck
    if (state.currentVertexId === null) return t.tap_to_start
    return t.tap_to_continue
  })()

  const liveElapsed =
    state.startTime && !won && !lost
      ? Math.floor((Date.now() - state.startTime) / 1000)
      : elapsedSeconds

  const dark = settings.darkMode

  // Determine what to render in the graph card
  const displayState: GameState | null = isPastCompleted
    ? buildCompletedState(puzzle, pastResult!.usedImpossible)
    : null

  const effectiveState = displayState ?? state

  return (
    <I18nContext.Provider value={t}>
      <div
        className={`min-h-dvh flex flex-col bg-[#f8f7f5] dark:bg-slate-900 transition-colors duration-300 ${dark ? 'dark' : ''}`}
      >
        <Header
          onOpen={openModal}
          darkMode={dark}
          onToggleDark={() => handleSettingsSave({ ...settings, darkMode: !settings.darkMode })}
        />
        <PuzzleNav
          puzzleNumber={puzzleNumber}
          onPrev={() => setPuzzleNumber((n) => Math.max(1, n - 1))}
          onNext={() => setPuzzleNumber((n) => Math.min(Math.max(todayNumber, 30), n + 1))}
        />

        {/* Lives — only show for today's active game */}
        {isToday && gameStarted && !lost && (
          <LivesDisplay livesRemaining={state.livesRemaining} darkMode={dark} />
        )}

        {/* Difficulty & Timer bar */}
        <div className="flex items-center justify-between px-4 py-1 text-xs text-slate-400 dark:text-slate-500">
          <DifficultyBadge difficulty={puzzle.difficulty} lang={settings.language} />
          <span className="font-mono tabular-nums">
            {isToday && state.startTime !== null ? formatTime(liveElapsed) : '00:00'}
          </span>
        </div>

        {/* Graph area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 min-h-0">
          <div className="w-full max-w-sm aspect-square bg-white dark:bg-slate-800 rounded-3xl shadow-sm p-2">
            {!isToday && isPastCompleted ? (
              <Graph
                puzzle={puzzle}
                state={displayState!}
                onVertexClick={() => {}}
                darkMode={dark}
              />
            ) : lost ? (
              <SolutionViewer puzzle={puzzle} darkMode={dark} />
            ) : (
              <Graph puzzle={puzzle} state={effectiveState} onVertexClick={handleVertexClick} darkMode={dark} />
            )}
          </div>
        </div>

        {/* Hint */}
        {gameStarted && !lost && !isPastCompleted && (
          <div className="text-center px-4 py-2 min-h-[2rem]">
            <p
              className={[
                'text-xs transition-colors duration-300',
                state.status === 'impossible-wrong'
                  ? 'text-amber-600 font-medium'
                  : 'text-slate-400 dark:text-slate-500',
              ].join(' ')}
            >
              {gameHint}
            </p>
          </div>
        )}

        {/* Game over message */}
        {lost && (
          <div className="text-center px-4 py-2 min-h-[2rem]">
            <p className="text-xs text-rose-500 font-medium">{t.game_over}</p>
          </div>
        )}

        {/* Past completed puzzle label */}
        {isPastCompleted && (
          <div className="text-center px-4 py-2 min-h-[2rem]">
            <p className="text-xs text-emerald-600 font-medium">
              {pastResult!.usedImpossible ? t.puzzle_impossible : t.puzzle_solved}
            </p>
          </div>
        )}

        {/* Action */}
        {gameStarted && !lost && !isPastCompleted && (
          <div className="flex justify-center pb-8 pt-2">
            <ImpossibleButton
              status={state.status}
              onImpossible={handleImpossible}
              onRestart={restart}
            />
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast
        message={t.puzzle_solved}
        show={showToast}
        onDone={() => setShowToast(false)}
      />

      {/* Modals */}
      <HelpModal open={modal === 'help'} onClose={closeModal} />
      <SettingsModal
        open={modal === 'settings'}
        onClose={closeModal}
        settings={settings}
        onSave={handleSettingsSave}
      />
      <MenuDrawer open={modal === 'menu'} onClose={closeModal} />
      <CompletionModal
        open={modal === 'completion'}
        onClose={closeModal}
        puzzle={puzzle}
        puzzleNumber={puzzleNumber}
        score={score}
        elapsedSeconds={elapsedSeconds}
        wasImpossible={state.status === 'impossible-correct'}
      />
      <StatsModal open={modal === 'stats'} onClose={closeModal} />
      <RankingsModal open={modal === 'rankings'} onClose={closeModal} />
    </I18nContext.Provider>
  )
}

function DifficultyBadge({
  difficulty,
  lang,
}: {
  difficulty: 'easy' | 'medium' | 'hard'
  lang: 'en' | 'es'
}) {
  const labels = {
    en: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    es: { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' },
  }
  const colors = {
    easy: 'text-emerald-600',
    medium: 'text-amber-600',
    hard: 'text-rose-600',
  }
  return (
    <span className={`uppercase tracking-widest font-semibold text-[10px] ${colors[difficulty]}`}>
      {labels[lang][difficulty]}
    </span>
  )
}
