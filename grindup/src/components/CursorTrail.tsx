'use client'

import { useEffect, useRef, useState } from 'react'

export default function CursorGlow() {
  const [isTouch, setIsTouch] = useState(true)
  const glowRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: -400, y: -400 })
  const target = useRef({ x: -400, y: -400 })
  const rafRef = useRef<number>()

  useEffect(() => {
    if ('ontouchstart' in window) return
    if ('deviceMemory' in navigator && (navigator as Navigator & { deviceMemory: number }).deviceMemory < 4) return
    setIsTouch(false)

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX
      target.current.y = e.clientY
    }
    window.addEventListener('mousemove', onMove)

    function animate() {
      pos.current.x += (target.current.x - pos.current.x) * 0.08
      pos.current.y += (target.current.y - pos.current.y) * 0.08
      const glow = glowRef.current
      if (glow) {
        glow.style.transform = `translate(${pos.current.x - 150}px, ${pos.current.y - 150}px)`
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
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(124,58,237,0.05) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-400px, -400px)',
        willChange: 'transform',
      }}
    />
  )
}
