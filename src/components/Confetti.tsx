import { useEffect, useState, useRef } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  color: string
  w: number
  h: number
  rounded: boolean
  duration: number
  delay: number
  drift: number
}

interface Props {
  active: boolean
  accent?: string
}

function pick(accent: string): string[] {
  return [accent, '#fbbf24', '#f59e0b', '#ffffff', '#fcd34d']
}

export default function Confetti({ active, accent }: Props) {
  const [particles, setParticles] = useState<Particle[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active || !accent) {
      setParticles([])
      return
    }

    const colors = pick(accent)
    const items: Particle[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -5 - Math.random() * 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      w: 4 + Math.random() * 10,
      h: 4 + Math.random() * 10,
      rounded: Math.random() > 0.5,
      duration: 2 + Math.random() * 2.5,
      delay: Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 40,
    }))
    setParticles(items)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setParticles([]), 5000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, accent])

  if (particles.length === 0) return null

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
            '--drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
      {/* center burst */}
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: 'confetti-pop 0.6s ease-out forwards' }}
      >
        <span
          className="text-4xl inline-block"
          style={{ animation: 'confetti-pop 0.6s ease-out 0.3s forwards', opacity: 0 }}
        >
          🎉
        </span>
      </div>
    </div>
  )
}
