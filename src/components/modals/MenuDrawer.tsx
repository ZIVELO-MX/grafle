import Modal from './Modal'
import { useT } from '../../i18n'

interface Props {
  open: boolean
  onClose: () => void
}

const MENU_ITEMS = [
  { key: 'blog', href: 'https://grafle.com/blog' },
  { key: 'donate', href: 'https://grafle.com/donate' },
] as const

export default function MenuDrawer({ open, onClose }: Props) {
  const t = useT()
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">{t.menu}</h2>
        <nav className="space-y-2">
          {MENU_ITEMS.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-3 px-4 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              onClick={onClose}
            >
              {t[key as 'blog' | 'donate']}
              <span className="text-slate-400 dark:text-slate-500">&#8594;</span>
            </a>
          ))}
        </nav>
      </div>
    </Modal>
  )
}
