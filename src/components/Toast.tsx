import { useEffect, useState } from 'react'

interface Props {
  message: string
  show: boolean
  onDone: () => void
}

export default function Toast({ message, show, onDone }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      // Allow fade-out before notifying parent
      setTimeout(onDone, 400)
    }, 2000)
    return () => clearTimeout(t)
  }, [show, onDone])

  return (
    <div
      aria-live="polite"
      className={[
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-50',
        'bg-green-500 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-lg',
        'transition-all duration-400 pointer-events-none select-none',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      {message}
    </div>
  )
}
