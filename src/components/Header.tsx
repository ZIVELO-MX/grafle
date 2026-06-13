import type { ModalId } from '../types'
import { useT } from '../i18n'

interface Props {
  onOpen: (modal: ModalId) => void
}

export default function Header({ onOpen }: Props) {
  const t = useT()
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
      <span className="text-xl font-black tracking-widest text-slate-900 select-none">
        {t.title}
      </span>
      <div className="flex items-center gap-1">
        <IconBtn label="Help" onClick={() => onOpen('help')}>
          <span className="text-base font-semibold leading-none">?</span>
        </IconBtn>
        <IconBtn label="Settings" onClick={() => onOpen('settings')}>
          <SettingsIcon />
        </IconBtn>
        <IconBtn label="Menu" onClick={() => onOpen('menu')}>
          <MenuIcon />
        </IconBtn>
      </div>
    </header>
  )
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
    >
      {children}
    </button>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="9" cy="9" r="2.5" />
      <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M3.93 3.93l1.06 1.06M13.01 13.01l1.06 1.06M3.93 14.07l1.06-1.06M13.01 4.99l1.06-1.06" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 5h12M3 9h12M3 13h12" />
    </svg>
  )
}
