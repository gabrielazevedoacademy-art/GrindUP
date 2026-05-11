'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'

// ─── Particles canvas ────────────────────────────────────────
function Particles({ count = 40 }: { count?: number }) {
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
      r:  Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
      o:  Math.random() * 0.45 + 0.1,
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

// ─── Animated counter ────────────────────────────────────────
function useCounter(target: number, duration = 1600, enabled = true): number {
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

// ─── Dashboard mockup ────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{ width: '100%', maxWidth: 340, margin: '0 auto', animation: 'floatMock 4s ease-in-out infinite' }}>
      <div style={{
        background: 'linear-gradient(145deg, #0e0b22, #0a0a12)',
        border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 0 60px rgba(124,58,237,0.18), 0 24px 48px rgba(0,0,0,0.55)',
      }}>

        {/* Profile */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.82rem', fontWeight: 900, color: '#fff',
            boxShadow: '0 0 16px rgba(124,58,237,0.6)',
          }}>
            GA
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#fff' }}>Gabriel A.</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>Membro desde 2024</div>
          </div>
          <span style={{
            padding: '3px 9px', borderRadius: 999, fontSize: '0.58rem', fontWeight: 900,
            letterSpacing: '0.08em', textTransform: 'uppercase' as const,
            background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(217,119,6,0.14))',
            border: '1px solid rgba(251,191,36,0.45)', color: '#fbbf24',
          }}>
            ELITE
          </span>
        </div>

        {/* 4 stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { icon: '⭐', label: 'Nível',   value: '93',    color: '#a78bfa' },
            { icon: '⚡', label: 'XP',      value: '975K',  color: '#60a5fa' },
            { icon: '🔥', label: 'Streak',  value: '198d',  color: '#f97316' },
            { icon: '🎯', label: 'Missões', value: '3 / 5', color: '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '9px 11px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.32)', marginBottom: 3, fontWeight: 600 }}>
                {s.icon} {s.label}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* XP Progress */}
        <div style={{
          padding: '9px 11px', borderRadius: 10, marginBottom: 10,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>Progresso — Nível 93</span>
            <span style={{ fontSize: '0.6rem', color: '#a78bfa', fontWeight: 700 }}>78%</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: '78%', borderRadius: 999,
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              boxShadow: '0 0 10px rgba(124,58,237,0.8)',
            }} />
          </div>
        </div>

        {/* Module mini cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {/* Tarefas */}
          <div style={{
            padding: '9px 11px', borderRadius: 10,
            background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.22)',
          }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa', marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              Tarefas
            </div>
            {[
              { label: 'Estudar TypeScript', done: false },
              { label: 'Meditação',          done: false },
              { label: 'Academia',           done: true  },
            ].map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <div style={{
                  width: 9, height: 9, borderRadius: 3, flexShrink: 0,
                  background: t.done ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'transparent',
                  border: t.done ? 'none' : '1.5px solid rgba(124,58,237,0.5)',
                }} />
                <span style={{
                  fontSize: '0.58rem', color: t.done ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.5)',
                  textDecoration: t.done ? 'line-through' : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                }}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>

          {/* Finanças */}
          <div style={{
            padding: '9px 11px', borderRadius: 10,
            background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.18)',
          }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#4ade80', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              Finanças
            </div>
            <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.32)', marginBottom: 2 }}>Saldo do mês</div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#4ade80', marginBottom: 5 }}>R$ 2.840</div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '62%', background: '#4ade80', borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.22)', marginTop: 3 }}>62% da meta mensal</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Entry page ──────────────────────────────────────────────
export default function EntryPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  const streak = useCounter(198,  1400, !checking)
  const level  = useCounter(93,   1200, !checking)
  const tasks  = useCounter(1247, 1800, !checking)

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
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff',
      height: '100dvh',
      overflow: 'hidden',
      display: 'flex',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes gradShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes logoPulse {
          0%,100% { text-shadow: 0 0 14px rgba(167,139,250,0.9), 0 0 36px rgba(124,58,237,0.6); }
          50%      { text-shadow: 0 0 32px rgba(167,139,250,1), 0 0 64px rgba(124,58,237,1), 0 0 110px rgba(124,58,237,0.35); }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 20px rgba(124,58,237,0.55); }
          50%      { box-shadow: 0 0 42px rgba(124,58,237,1), 0 0 76px rgba(124,58,237,0.4); }
        }
        @keyframes floatMock {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .entry-left {
          position: relative;
          flex: 0 0 60%;
          display: flex;
          align-items: center;
          padding: 0 72px;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0a0f 0%, #0d0a1e 35%, #0a0f1e 65%, #0d0a1e 85%, #0a0a0f 100%);
          background-size: 400% 400%;
          animation: gradShift 9s ease infinite;
        }
        .entry-right {
          flex: 0 0 40%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 48px;
          background: rgba(255,255,255,0.015);
          border-left: 1px solid rgba(124,58,237,0.1);
          overflow: hidden;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 520px;
          width: 100%;
          animation: fadeIn 0.65s ease forwards;
        }
        .btn-cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 30px; border-radius: 13px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border: 1px solid rgba(167,139,250,0.4);
          color: #fff; font-size: 1rem; font-weight: 800;
          text-decoration: none; cursor: pointer;
          animation: btnGlow 2.4s ease-in-out infinite;
          transition: transform 0.18s ease, filter 0.18s ease;
          white-space: nowrap;
        }
        .btn-cta:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 14px 24px; border-radius: 13px;
          background: transparent; border: 1px solid rgba(167,139,250,0.28);
          color: rgba(255,255,255,0.6); font-size: 0.9rem; font-weight: 600;
          text-decoration: none; cursor: pointer;
          transition: all 0.18s ease; white-space: nowrap;
        }
        .btn-ghost:hover {
          background: rgba(124,58,237,0.1);
          border-color: rgba(167,139,250,0.55);
          color: #fff;
        }
        .stat-chip {
          flex: 1; min-width: 0;
          padding: 11px 14px; border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(124,58,237,0.15);
          text-align: center;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-chip:hover {
          border-color: rgba(124,58,237,0.4);
          box-shadow: 0 0 16px rgba(124,58,237,0.15);
        }
        @media (max-width: 900px) {
          .entry-left  { flex: 1 1 100% !important; padding: 0 28px !important; }
          .entry-right { display: none !important; }
          .hero-btns   { flex-direction: column !important; }
          .hero-btns .btn-cta,
          .hero-btns .btn-ghost { width: 100% !important; }
          .stats-row   { gap: 8px !important; }
        }
      `}</style>

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="entry-left">
        <Particles count={40} />

        <div className="hero-content">

          {/* Logo */}
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
              Grind
              <span style={{ color: '#a78bfa', animation: 'logoPulse 2.5s ease-in-out infinite' }}>UP</span>
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2rem, 3.6vw, 2.9rem)',
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: '-1px', marginBottom: 16,
          }}>
            Eleve sua vida para<br />
            <span style={{ color: '#a78bfa', animation: 'logoPulse 2.5s ease-in-out infinite' }}>
              outro nível.
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '0.975rem', lineHeight: 1.7,
            color: 'rgba(255,255,255,0.48)',
            marginBottom: 32, maxWidth: 430,
          }}>
            Organize tarefas, finanças e metas enquanto sobe de nível na vida real.
            Gamificação que transforma sua rotina em conquistas.
          </p>

          {/* Buttons */}
          <div className="hero-btns" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-cta">
              Criar conta grátis →
            </Link>
            <Link href="/login" className="btn-ghost">
              Já tenho conta
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
            {['✓ Grátis para começar', '✓ Sem cartão necessário', '✓ Configure em 2 min'].map(t => (
              <span key={t} style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>
                {t}
              </span>
            ))}
          </div>

          {/* Stat counters */}
          <div className="stats-row" style={{ display: 'flex', gap: 10 }}>
            <div className="stat-chip">
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.32)', marginBottom: 5, fontWeight: 600 }}>🔥 Streak recorde</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f97316', letterSpacing: '-0.5px' }}>
                {streak} dias
              </div>
            </div>
            <div className="stat-chip">
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.32)', marginBottom: 5, fontWeight: 600 }}>⭐ Nível máximo</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#a78bfa', letterSpacing: '-0.5px' }}>
                Nível {level}
              </div>
            </div>
            <div className="stat-chip">
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.32)', marginBottom: 5, fontWeight: 600 }}>✅ Concluídas</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4ade80', letterSpacing: '-0.5px' }}>
                {tasks.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className="entry-right">
        <DashboardMockup />
      </div>
    </div>
  )
}
