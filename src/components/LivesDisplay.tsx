import { useEffect, useRef, useState } from 'react'

interface Props {
  livesRemaining: number
  darkMode: boolean
}

export default function LivesDisplay({ livesRemaining }: Props) {
  const prevLives = useRef(livesRemaining)
  const [flashIndex, setFlashIndex] = useState<number | null>(null)

  useEffect(() => {
    if (livesRemaining < prevLives.current) {
      // Flash the heart that was just lost
      setFlashIndex(livesRemaining)
      const t = setTimeout(() => setFlashIndex(null), 600)
      prevLives.current = livesRemaining
      return () => clearTimeout(t)
    }
    prevLives.current = livesRemaining
  }, [livesRemaining])

  return (
    <div className="flex items-center justify-center gap-2 py-1">
      {Array.from({ length: 3 }, (_, i) => {
        const alive = i < livesRemaining
        const isFlashing = i === flashIndex
        return (
          <span
            key={i}
            className={[
              'text-xl transition-all duration-300 select-none',
              alive ? 'text-rose-500' : 'text-slate-300 dark:text-slate-600',
              isFlashing ? 'scale-125 opacity-40' : 'scale-100 opacity-100',
            ].join(' ')}
          >
            {alive ? '♥' : '♡'}
          </span>
        )
      })}
    </div>
  )
}
