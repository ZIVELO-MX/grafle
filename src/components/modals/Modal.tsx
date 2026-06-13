import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  fullScreen?: boolean
}

export default function Modal({ open, onClose, children, fullScreen }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      {/* Content */}
      <div
        className={[
          'relative bg-white shadow-2xl z-10 w-full animate-slide-up',
          fullScreen
            ? 'rounded-t-3xl sm:rounded-2xl sm:max-w-sm sm:mx-4'
            : 'rounded-t-3xl sm:rounded-2xl sm:max-w-sm sm:mx-4',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
