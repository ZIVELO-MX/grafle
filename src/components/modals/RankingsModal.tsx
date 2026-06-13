import { useState } from 'react'
import Modal from './Modal'
import { useT } from '../../i18n'
import { loadRankings, loadNickname, saveNickname } from '../../lib/storage'
import { formatTime } from '../../lib/scoring'

interface Props {
  open: boolean
  onClose: () => void
}

export default function RankingsModal({ open, onClose }: Props) {
  const t = useT()
  const [nickname, setNickname] = useState(loadNickname())
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(nickname)
  const rankings = loadRankings()

  const handleSave = () => {
    const trimmed = draft.trim().slice(0, 20)
    setNickname(trimmed)
    saveNickname(trimmed)
    setEditing(false)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">{t.rankings}</h2>

        {/* Nickname */}
        <div className="mb-5 flex items-center gap-2">
          {editing ? (
            <>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                maxLength={20}
                placeholder={t.nickname_prompt}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
              />
              <button
                onClick={handleSave}
                className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                {t.save}
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-slate-600 flex-1">
                {nickname || <span className="italic text-slate-400">{t.nickname_prompt}</span>}
              </span>
              <button
                onClick={() => { setDraft(nickname); setEditing(true) }}
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors underline underline-offset-2"
              >
                Edit
              </button>
            </>
          )}
        </div>

        {/* Table */}
        {rankings.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">{t.no_results_yet}</p>
        ) : (
          <div className="space-y-0 mb-6 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
              <span>#</span>
              <span className="text-right">{t.score}</span>
              <span className="text-right">{t.time}</span>
              <span className="text-right">{t.date}</span>
            </div>
            {rankings.slice(0, 20).map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-4 py-2 border-b border-slate-50 text-sm text-slate-700"
              >
                <span className="font-bold text-slate-900">{i + 1}</span>
                <span className="text-right">{r.score}</span>
                <span className="text-right">{formatTime(r.time)}</span>
                <span className="text-right text-slate-400 text-xs">{r.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}

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
