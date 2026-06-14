import type { ModalId } from '../types'
import { useT } from '../i18n'

interface Props {
  onOpen: (modal: ModalId) => void
  darkMode: boolean
  onToggleDark: () => void
}

export default function Header({ onOpen, darkMode, onToggleDark }: Props) {
  const t = useT()
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors duration-300">
      <span className="text-xl font-black tracking-widest text-slate-900 dark:text-slate-100 select-none">
        {t.title}
      </span>
      <div className="flex items-center gap-1">
        <IconBtn label="Help" onClick={() => onOpen('help')}>
          <span className="text-base font-semibold leading-none">?</span>
        </IconBtn>
        <IconBtn label="Language settings" onClick={() => onOpen('settings')}>
          <BookIcon />
        </IconBtn>
        <IconBtn label="Toggle dark mode" onClick={onToggleDark}>
          {darkMode ? <SunIcon /> : <MoonIcon />}
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
      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      {children}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="9" cy="9" r="3" />
      <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 10a6 6 0 0 1-7-7 7 7 0 1 0 7 7z" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15.5A2 2 0 0 1 5 13.5H15" />
      <path d="M5 1.5H15v14H5A2 2 0 0 1 3 13.5V3.5A2 2 0 0 1 5 1.5z" />
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
