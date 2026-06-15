import { useEffect, useState, useRef, useMemo } from 'react'

interface Props {
  active: boolean
  accent?: string
}

function pick(accent: string): string[] {
  return [accent, '#fbbf24', '#f59e0b', '#ffffff', '#fcd34d']
}

const EMOJIS = ['🎉', '🎊', '🎈', '🎂', '✨', '💫', '⭐', '🎀']

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export default function Confetti({ active, accent }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active || !accent) {
      setVisible(false)
      return
    }
    setVisible(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 5000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, accent])

  const rand = useMemo(() => rng(Date.now()), [active, accent])

  if (!visible) return null

  const colors = accent ? pick(accent) : ['#22c55e', '#3b82f6', '#fbbf24', '#ef4444']

  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: rand() * 100,
    y: -5 - rand() * 15,
    color: colors[Math.floor(rand() * colors.length)],
    w: 4 + rand() * 10,
    h: 4 + rand() * 10,
    rounded: rand() > 0.5,
    duration: 2 + rand() * 2.5,
    delay: rand() * 0.8,
  }))

  const emojis = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 5 + rand() * 90,
    emoji: EMOJIS[Math.floor(rand() * EMOJIS.length)],
    size: 20 + rand() * 16,
    duration: 2.5 + rand() * 2,
    delay: 0.2 + rand() * 0.6,
    rotation: rand() * 30 - 15,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.rounded ? '50%' : '1px',
            opacity: 0,
            animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
          } as React.CSSProperties}
        />
      ))}
      {emojis.map((e) => (
        <span
          key={`emoji-${e.id}`}
          className="absolute"
          style={{
            left: `${e.x}%`,
            top: '-5%',
            fontSize: `${e.size}px`,
            opacity: 0,
            animation: `confetti-fall ${e.duration}s ease-out ${e.delay}s forwards`,
            transform: `rotate(${e.rotation}deg)`,
          } as React.CSSProperties}
        >
          {e.emoji}
        </span>
      ))}
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: 'confetti-pop 0.6s ease-out forwards' }}
      >
        <span
          className="text-5xl inline-block"
          style={{ animation: 'confetti-pop 0.6s ease-out 0.3s forwards', opacity: 0 }}
        >
          🎉
        </span>
      </div>
    </div>
  )
}
