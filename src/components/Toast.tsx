import { useEffect, useRef, useState } from 'react'

interface Props {
  message: string
  show: boolean
  onDone: () => void
}

export default function Toast({ message, show, onDone }: Props) {
  const [visible, setVisible] = useState(false)
  // Keep onDone in a ref so the effect never stales but also never re-fires
  // just because the parent re-renders and recreates the callback reference.
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone })

  useEffect(() => {
    if (!show) return
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDoneRef.current(), 400)
    }, 2000)
    return () => clearTimeout(t)
  }, [show])

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
