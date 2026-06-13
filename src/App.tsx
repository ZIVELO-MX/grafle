import { useState, useEffect, useCallback, useRef } from 'react'
import Header from './components/Header'
import PuzzleNav from './components/PuzzleNav'
import Graph from './components/Graph'
import ImpossibleButton from './components/ImpossibleButton'
import HelpModal from './components/modals/HelpModal'
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
import { loadSettings, saveSettings } from './lib/storage'
import { formatTime } from './lib/scoring'
import type { ModalId, Settings } from './types'

function useTick(active: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [active])
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [modal, setModal] = useState<ModalId>(null)
  const [puzzleNumber, setPuzzleNumber] = useState(getCurrentPuzzleNumber)

  const todayNumber = getCurrentPuzzleNumber()
  const isToday = puzzleNumber === todayNumber

  const puzzle = isToday
    ? getPuzzleForDate()
    : (getPuzzleByNumber(puzzleNumber)?.puzzle ?? getPuzzleForDate())

  const { state, handleVertexClick, handleImpossible, restart, elapsedSeconds, score } = useGame(
    puzzle,
    puzzleNumber,
    isToday
  )

  useTick(state.status === 'playing')

  const handleSettingsSave = useCallback((s: Settings) => {
    setSettings(s)
    saveSettings(s)
  }, [])

  const openModal = useCallback((id: ModalId) => setModal(id), [])
  const closeModal = useCallback(() => setModal(null), [])

  const won = state.status === 'won' || state.status === 'impossible-correct'

  // Fix: track whether completion modal has been shown for this win
  // so closing it doesn't cause it to reopen immediately.
  const completionShownRef = useRef(false)
  useEffect(() => {
    if (!won) {
      completionShownRef.current = false
      return
    }
    if (completionShownRef.current) return
    completionShownRef.current = true
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

  const liveElapsed = state.startTime && state.status === 'playing'
    ? Math.floor((Date.now() - state.startTime) / 1000)
    : elapsedSeconds

  const dark = settings.darkMode

  return (
    <I18nContext.Provider value={t}>
      <div className={`min-h-dvh flex flex-col bg-[#f8f7f5] dark:bg-slate-900 transition-colors duration-300 ${dark ? 'dark' : ''}`}>
        <Header
          onOpen={openModal}
          darkMode={dark}
          onToggleDark={() => handleSettingsSave({ ...settings, darkMode: !settings.darkMode })}
          onToggleLang={() => handleSettingsSave({ ...settings, language: settings.language === 'en' ? 'es' : 'en' })}
        />
        <PuzzleNav
          puzzleNumber={puzzleNumber}
          onPrev={() => setPuzzleNumber((n) => Math.max(1, n - 1))}
          onNext={() => setPuzzleNumber((n) => Math.min(todayNumber, n + 1))}
        />

        {/* Difficulty & Timer bar */}
        <div className="flex items-center justify-between px-4 py-1 text-xs text-slate-400 dark:text-slate-500">
          <DifficultyBadge difficulty={puzzle.difficulty} lang={settings.language} />
          <span className="font-mono tabular-nums">
            {state.status !== 'idle' ? formatTime(liveElapsed) : '00:00'}
          </span>
        </div>

        {/* Graph area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 min-h-0">
          <div className="w-full max-w-sm aspect-square bg-white dark:bg-slate-800 rounded-3xl shadow-sm p-2">
            <Graph puzzle={puzzle} state={state} onVertexClick={handleVertexClick} darkMode={dark} />
          </div>
        </div>

        {/* Hint */}
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

        {/* Action */}
        <div className="flex justify-center pb-8 pt-2">
          <ImpossibleButton
            status={state.status}
            onImpossible={handleImpossible}
            onRestart={restart}
          />
        </div>
      </div>

      {/* Modals */}
      <HelpModal open={modal === 'help'} onClose={closeModal} />
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
