import Modal from './Modal'
import { useT } from '../../i18n'
import { loadStats } from '../../lib/storage'
import { formatTime } from '../../lib/scoring'

interface Props {
  open: boolean
  onClose: () => void
}

export default function StatsModal({ open, onClose }: Props) {
  const t = useT()
  const stats = loadStats()

  const successRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.wins / stats.gamesPlayed) * 100)
      : 0

  const avgTime =
    stats.wins > 0 ? formatTime(Math.round(stats.totalTime / stats.wins)) : '--:--'

  const rows: { label: string; value: string | number }[] = [
    { label: t.games_played, value: stats.gamesPlayed },
    { label: t.wins, value: stats.wins },
    { label: t.success_rate, value: `${successRate}%` },
    { label: t.current_streak, value: stats.currentStreak },
    { label: t.best_streak, value: stats.bestStreak },
    { label: t.avg_time, value: avgTime },
    { label: t.best_score, value: stats.bestScore },
  ]

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">{t.statistics}</h2>
        <div className="space-y-0 mb-6">
          {rows.map(({ label, value }, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0"
            >
              <span className="text-sm text-slate-600">{label}</span>
              <span className="text-sm font-bold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
        >
          {t.close}
        </button>
      </div>
    </Modal>
  )
}
