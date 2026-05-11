'use client'

import { useEffect, useRef, useState } from 'react'

const COUNT = 12

export default function CursorTrail() {
  const [isTouch, setIsTouch] = useState(true)
  const dotsRef = useRef<(HTMLDivElement | null)[]>([])
  const positions = useRef(Array.from({ length: COUNT }, () => ({ x: -200, y: -200 })))
  const mouse = useRef({ x: -200, y: -200 })
  const rafRef = useRef<number>()

  useEffect(() => {
    if ('ontouchstart' in window) return
    setIsTouch(false)

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }
    window.addEventListener('mousemove', onMove)

    // Descending lerp factors: 0 is fastest (near cursor), COUNT-1 is slowest (tail)
    const lerps = Array.from({ length: COUNT }, (_, i) =>
      Math.max(0.04, 0.18 - i * 0.012)
    )

    function animate() {
      const pos = positions.current
      const m = mouse.current
      pos[0].x += (m.x - pos[0].x) * lerps[0]
      pos[0].y += (m.y - pos[0].y) * lerps[0]
      for (let i = 1; i < COUNT; i++) {
        pos[i].x += (pos[i - 1].x - pos[i].x) * lerps[i]
        pos[i].y += (pos[i - 1].y - pos[i].y) * lerps[i]
      }
      for (let i = 0; i < COUNT; i++) {
        const dot = dotsRef.current[i]
        if (dot) {
          const size = 6 - (4 / (COUNT - 1)) * i
          dot.style.transform = `translate(${pos[i].x - size / 2}px, ${pos[i].y - size / 2}px)`
        }
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (isTouch) return null

  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => {
        const size = 6 - (4 / (COUNT - 1)) * i
        const opacity = Math.max(0.05, 0.8 - (0.75 / (COUNT - 1)) * i)
        return (
          <div
            key={i}
            ref={el => { dotsRef.current[i] = el }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `rgba(124,58,237,${opacity})`,
              pointerEvents: 'none',
              zIndex: 9999,
              transform: 'translate(-200px, -200px)',
              willChange: 'transform',
            }}
          />
        )
      })}
    </>
  )
}
