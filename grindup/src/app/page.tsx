'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'

// ─── Particles ───────────────────────────────────────────────
function Particles({ count = 55 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const c = canvas
    const ctx = c.getContext('2d')!
    let raf: number

    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const pts = Array.from({ length: count }, () => ({
      x:  Math.random() * c.width,
      y:  Math.random() * c.height,
      r:  Math.random() * 1.6 + 0.3,
      dx: (Math.random() - 0.5) * 0.18,
      dy: (Math.random() - 0.5) * 0.18,
      o:  Math.random() * 0.4 + 0.08,
    }))

    function draw() {
      ctx.clearRect(0, 0, c.width, c.height)
      for (const p of pts) {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0) p.x = c.width
        if (p.x > c.width) p.x = 0
        if (p.y < 0) p.y = c.height
        if (p.y > c.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167,139,250,${p.o})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}

// ─── Counter hook ────────────────────────────────────────────
function useCounter(target: number, duration = 1500, enabled = true): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let current = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(id) }
      else setCount(Math.floor(current))
    }, 16)
    return () => clearInterval(id)
  }, [target, duration, enabled])
  return count
}

// ─── Entry page ──────────────────────────────────────────────
export default function EntryPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  const streak = useCounter(198,  1200, !checking)
  const level  = useCounter(93,   1000, !checking)
  const tasks  = useCounter(1247, 1500, !checking)

  useEffect(() => {
    const supabase = createClientSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  if (checking) return null

  return (
    <div style={{
      position: 'relative',
      height: '100dvh',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0a1e 35%, #0a0f1e 65%, #0d0a1e 85%, #0a0a0f 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradShift 9s ease infinite',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes gradShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes logoPulse {
          0%,100% { text-shadow: 0 0 16px rgba(167,139,250,0.9), 0 0 40px rgba(124,58,237,0.65); }
          50%      { text-shadow: 0 0 36px rgba(167,139,250,1), 0 0 72px rgba(124,58,237,1), 0 0 120px rgba(124,58,237,0.35); }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 22px rgba(124,58,237,0.6); }
          50%      { box-shadow: 0 0 44px rgba(124,58,237,1), 0 0 80px rgba(124,58,237,0.4); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .btn-cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 15px 34px; border-radius: 14px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border: 1px solid rgba(167,139,250,0.45);
          color: #fff; font-size: 1.05rem; font-weight: 800;
          text-decoration: none; cursor: pointer; white-space: nowrap;
          animation: btnGlow 2.5s ease-in-out infinite;
          transition: transform 0.18s ease, filter 0.18s ease;
        }
        .btn-cta:hover { transform: translateY(-2px); filter: brightness(1.12); }
        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 15px 28px; border-radius: 14px;
          background: transparent; border: 1px solid rgba(167,139,250,0.3);
          color: rgba(255,255,255,0.65); font-size: 0.95rem; font-weight: 600;
          text-decoration: none; cursor: pointer; white-space: nowrap;
          transition: all 0.18s ease;
        }
        .btn-ghost:hover {
          background: rgba(124,58,237,0.12);
          border-color: rgba(167,139,250,0.6);
          color: #fff;
        }
        .stat-card {
          flex: 1; min-width: 0;
          padding: 16px 20px; border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(124,58,237,0.18);
          text-align: center;
          backdrop-filter: blur(8px);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .stat-card:hover {
          border-color: rgba(124,58,237,0.45);
          box-shadow: 0 0 24px rgba(124,58,237,0.18);
          transform: translateY(-2px);
        }
        @media (max-width: 600px) {
          .hero-btns   { flex-direction: column !important; width: 90% !important; }
          .hero-btns a { width: 100% !important; }
          .stats-row   { flex-direction: column !important; width: 90% !important; }
          .stats-row .stat-card { flex: none !important; width: 100% !important; }
        }
      `}</style>

      {/* Particles */}
      <Particles count={55} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '0 24px',
        gap: 0,
        animation: 'fadeUp 0.7s ease forwards',
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 28, lineHeight: 1 }}>
          <span style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Grind
            <span style={{ color: '#a78bfa', animation: 'logoPulse 2.5s ease-in-out infinite' }}>UP</span>
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
          fontWeight: 900, lineHeight: 1.08,
          letterSpacing: '-2px', marginBottom: 20,
          maxWidth: 700,
        }}>
          Eleve sua vida para outro nível.
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
          lineHeight: 1.7, color: 'rgba(255,255,255,0.5)',
          maxWidth: 500, marginBottom: 36,
        }}>
          Organize tarefas, finanças e metas enquanto sobe de nível na vida real.
          Gamificação que transforma sua rotina em conquistas.
        </p>

        {/* Buttons */}
        <div className="hero-btns" style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <Link href="/login" className="btn-cta">
            Criar conta grátis →
          </Link>
          <Link href="/login" className="btn-ghost">
            Já tenho conta
          </Link>
        </div>

        {/* Trust line */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['✓ Grátis para começar', '✓ Sem cartão necessário'].map(t => (
            <span key={t} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>
              {t}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          width: '100%', maxWidth: 480, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)',
          marginBottom: 28,
        }} />

        {/* Stats */}
        <div className="stats-row" style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 480 }}>
          <div className="stat-card">
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f97316', letterSpacing: '-0.5px', marginBottom: 4 }}>
              🔥 {streak}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Streak recorde
            </div>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#a78bfa', letterSpacing: '-0.5px', marginBottom: 4 }}>
              ⭐ {level}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Nível máximo
            </div>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ade80', letterSpacing: '-0.5px', marginBottom: 4 }}>
              ✅ {tasks.toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Tarefas concluídas
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
