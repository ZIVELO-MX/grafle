import { useState, useEffect, useRef } from 'react'

export function useTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000
      const tick = () => {
        setElapsed(Math.floor((Date.now() - startRef.current!) / 1000))
        frameRef.current = requestAnimationFrame(tick)
      }
      frameRef.current = requestAnimationFrame(tick)
    } else {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [running]) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setElapsed(0)
    startRef.current = null
  }

  return { elapsed, reset }
}
