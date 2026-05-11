'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'
import CursorTrail from '@/components/CursorTrail'

// ─── ParallaxLayers ───────────────────────────────────────────
// Layer 1: small distant stars  (speed 0.10)
// Layer 2: medium mid stars     (speed 0.25)
// Layer 3: nebulae blobs        (speed 0.40)
function ParallaxLayers() {
  const c1Ref = useRef<HTMLCanvasElement>(null)
  const c2Ref = useRef<HTMLCanvasElement>(null)
  const l3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const c1Raw = c1Ref.current
    const c2Raw = c2Ref.current
    const l3Raw = l3Ref.current
    if (!c1Raw || !c2Raw || !l3Raw) return
    // Aliases so TypeScript carries the non-null narrowing into closures
    const c1: HTMLCanvasElement = c1Raw
    const c2: HTMLCanvasElement = c2Raw
    const l3: HTMLDivElement = l3Raw

    let drawRaf: number
    let scrollRafId = 0
    let ticking = false
    let sy = 0

    const ctx1 = c1.getContext('2d')!
    const ctx2 = c2.getContext('2d')!

    const resize = () => {
      c1.width = window.innerWidth; c1.height = window.innerHeight
      c2.width = window.innerWidth; c2.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Layer 1 — small, dim, 1px
    const stars1 = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      phase: Math.random() * Math.PI * 2,
      spd: Math.random() * 0.012 + 0.003,
    }))

    // Layer 2 — medium, brighter, 2px
    const stars2 = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      phase: Math.random() * Math.PI * 2,
      spd: Math.random() * 0.018 + 0.005,
    }))

    let t = 0
    function drawStars() {
      t++
      ctx1.clearRect(0, 0, c1.width, c1.height)
      for (const s of stars1) {
        const o = 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(s.phase + t * s.spd))
        ctx1.beginPath()
        ctx1.arc(s.x, s.y, 0.6, 0, Math.PI * 2)
        ctx1.fillStyle = `rgba(210,200,255,${o})`
        ctx1.fill()
      }
      ctx2.clearRect(0, 0, c2.width, c2.height)
      for (const s of stars2) {
        const o = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(s.phase + t * s.spd))
        ctx2.beginPath()
        ctx2.arc(s.x, s.y, 1.2, 0, Math.PI * 2)
        ctx2.fillStyle = `rgba(200,190,255,${o})`
        ctx2.fill()
      }
      drawRaf = requestAnimationFrame(drawStars)
    }
    drawRaf = requestAnimationFrame(drawStars)

    const onScroll = () => {
      sy = window.scrollY
      if (!ticking) {
        scrollRafId = requestAnimationFrame(() => {
          const m = window.innerWidth < 768 ? 0.5 : 1
          c1.style.transform = `translateY(${-sy * 0.1 * m}px)`
          c2.style.transform = `translateY(${-sy * 0.25 * m}px)`
          l3.style.transform = `translateY(${-sy * 0.4 * m}px)`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(drawRaf)
      cancelAnimationFrame(scrollRafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const base: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none', willChange: 'transform',
  }

  return (
    <>
      <canvas ref={c1Ref} style={base} />
      <canvas ref={c2Ref} style={base} />
      <div
        ref={l3Ref}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', willChange: 'transform' }}
      >
        <div style={{
          position: 'absolute', top: '8%', left: '-12%',
          width: 650, height: 650, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'nebulaPulse 7s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '45%', right: '-15%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'nebulaPulse 9s ease-in-out infinite 2s',
        }} />
        <div style={{
          position: 'absolute', bottom: '8%', left: '28%',
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
          filter: 'blur(55px)',
          animation: 'nebulaPulse 11s ease-in-out infinite 4s',
        }} />
      </div>
    </>
  )
}

// ─── Reveal ───────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── useCounterOnView ─────────────────────────────────────────
function useCounterOnView(target: number, duration = 1600): [number, React.RefObject<HTMLDivElement>] {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          let current = 0
          const step = target / (duration / 16)
          const id = setInterval(() => {
            current += step
            if (current >= target) { setCount(target); clearInterval(id) }
            else setCount(Math.floor(current))
          }, 16)
          obs.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])

  return [count, ref as React.RefObject<HTMLDivElement>]
}

// ─── Entry page ───────────────────────────────────────────────
export default function EntryPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  const [streakCount, streakRef] = useCounterOnView(12800, 1800)
  const [tasksCount,  tasksRef]  = useCounterOnView(487000, 2000)
  const [goalsCount,  goalsRef]  = useCounterOnView(96, 1400)
  const [usersCount,  usersRef]  = useCounterOnView(3200, 1600)

  useEffect(() => {
    const supabase = createClientSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  const onScroll = useCallback(() => setScrollY(window.scrollY), [])
  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  if (checking) return null

  const heroOpacity = Math.max(0, 1 - scrollY / 400)

  return (
    <div style={{
      background: 'linear-gradient(180deg, #05050f 0%, #0a0520 40%, #0d0a1e 70%, #05050f 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes gradShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes logoPulse {
          0%,100% { text-shadow: 0 0 16px rgba(167,139,250,0.9), 0 0 40px rgba(124,58,237,0.65); }
          50%      { text-shadow: 0 0 48px rgba(167,139,250,1), 0 0 96px rgba(124,58,237,1); }
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ringRotateReverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 24px rgba(124,58,237,0.55); }
          50%      { box-shadow: 0 0 52px rgba(124,58,237,0.95), 0 0 96px rgba(124,58,237,0.35); }
        }
        @keyframes scrollBounce {
          0%,100% { transform: translateY(0); opacity: 0.5; }
          50%      { transform: translateY(8px); opacity: 1; }
        }
        @keyframes ctaGlow {
          0%,100% { box-shadow: 0 0 40px rgba(124,58,237,0.5), 0 8px 40px rgba(0,0,0,0.6); }
          50%      { box-shadow: 0 0 80px rgba(124,58,237,0.9), 0 8px 40px rgba(0,0,0,0.6); }
        }
        @keyframes nebulaPulse {
          0%,100% { opacity: 0.18; transform: scale(1); }
          50%      { opacity: 0.28; transform: scale(1.08); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }

        .btn-cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 16px 38px; border-radius: 14px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border: 1px solid rgba(167,139,250,0.45);
          color: #fff; font-size: 1.05rem; font-weight: 800;
          text-decoration: none; cursor: pointer; white-space: nowrap;
          animation: btnGlow 2.5s ease-in-out infinite;
          transition: transform 0.18s ease, filter 0.18s ease;
        }
        .btn-cta:hover { transform: translateY(-2px) scale(1.02); filter: brightness(1.12); }
        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 16px 32px; border-radius: 14px;
          background: transparent; border: 1px solid rgba(167,139,250,0.3);
          color: rgba(255,255,255,0.65); font-size: 0.95rem; font-weight: 600;
          text-decoration: none; cursor: pointer; white-space: nowrap;
          transition: all 0.18s ease;
        }
        .btn-ghost:hover {
          background: rgba(124,58,237,0.15);
          border-color: rgba(167,139,250,0.65);
          color: #fff;
        }

        .section { position: relative; z-index: 2; padding: 100px 24px; }
        .section-inner { max-width: 1100px; margin: 0 auto; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }

        .glass-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 18px;
          padding: 28px 24px;
          backdrop-filter: blur(10px);
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .glass-card:hover {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 36px rgba(124,58,237,0.15);
          transform: translateY(-4px);
        }

        .plan-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 22px;
          padding: 32px 28px;
          display: flex; flex-direction: column;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
          position: relative; overflow: hidden;
        }
        .plan-card.featured {
          border-color: rgba(124,58,237,0.6);
          background: rgba(124,58,237,0.1);
          box-shadow: 0 0 48px rgba(124,58,237,0.2);
          animation: ctaGlow 3s ease-in-out infinite;
        }
        .plan-card:hover { transform: translateY(-6px); }

        .tag {
          display: inline-block;
          padding: 4px 12px; border-radius: 20px;
          font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        .step-connector {
          width: 2px; height: 60px;
          background: linear-gradient(180deg, rgba(124,58,237,0.5), rgba(124,58,237,0.1));
          margin: 0 auto;
        }

        @media (max-width: 900px) {
          .grid-4 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr; }
          .grid-3 { grid-template-columns: 1fr; }
          .grid-4 { grid-template-columns: 1fr; }
          .hero-btns { flex-direction: column !important; width: 100% !important; }
          .hero-btns a, .hero-btns button { width: 100% !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .section { padding: 72px 20px; }
          .numbers-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .numbers-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Background parallax layers + cursor trail */}
      <CursorTrail />
      <ParallaxLayers />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', zIndex: 2,
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
        textAlign: 'center',
      }}>
        {/* Rotating rings decoration */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', overflow: 'hidden',
          opacity: heroOpacity,
        }}>
          {[480, 620, 760].map((size, i) => (
            <div key={size} style={{
              position: 'absolute',
              width: size, height: size,
              borderRadius: '50%',
              border: `1px solid rgba(124,58,237,${0.18 - i * 0.04})`,
              animation: `${i % 2 === 0 ? 'ringRotate' : 'ringRotateReverse'} ${22 + i * 8}s linear infinite`,
            }} />
          ))}
          <div style={{
            position: 'absolute',
            width: 340, height: 340, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }} />
        </div>

        <div style={{
          position: 'relative', zIndex: 1,
          animation: 'fadeUp 0.8s ease forwards',
          maxWidth: 760,
        }}>
          {/* Badge */}
          <div style={{ marginBottom: 20 }}>
            <span className="tag" style={{
              background: 'rgba(124,58,237,0.25)',
              border: '1px solid rgba(167,139,250,0.4)',
              color: '#a78bfa',
            }}>
              Produtividade Gamificada
            </span>
          </div>

          {/* Logo */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.1rem)', fontWeight: 900, letterSpacing: '-0.5px' }}>
              Grind<span style={{ color: '#a78bfa', animation: 'logoPulse 2.5s ease-in-out infinite' }}>UP</span>
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            fontWeight: 900, lineHeight: 1.06,
            letterSpacing: '-2.5px', marginBottom: 24,
            background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Suba de nível<br />na vida real.
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 2.2vw, 1.18rem)',
            lineHeight: 1.75, color: 'rgba(255,255,255,0.5)',
            maxWidth: 560, margin: '0 auto 40px',
          }}>
            Organize tarefas, metas e finanças enquanto ganha XP, sobe de nível e mantém streaks.
            A rotina virou um jogo — e você está ganhando.
          </p>

          {/* Buttons */}
          <div className="hero-btns" style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 20 }}>
            <Link href="/login" className="btn-cta">
              Começar grátis →
            </Link>
            <Link href="/login" className="btn-ghost">
              Já tenho conta
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['✓ Grátis para começar', '✓ Sem cartão necessário', '✓ Cancele quando quiser'].map(t => (
              <span key={t} style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          animation: 'scrollBounce 2s ease-in-out infinite',
          zIndex: 2,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ── NUMBERS ── */}
      <section className="section">
        <div className="section-inner">
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
                Uma comunidade que não para.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem' }}>
                Pessoas reais conquistando metas reais todos os dias.
              </p>
            </div>
          </Reveal>
          <div className="numbers-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16,
          }}>
            {[
              { ref: usersRef,  count: usersCount,  suffix: '+', label: 'usuários ativos', color: '#a78bfa', icon: '👥' },
              { ref: tasksRef,  count: tasksCount,  suffix: '+', label: 'tarefas concluídas', color: '#4ade80', icon: '✅' },
              { ref: streakRef, count: streakCount, suffix: '+', label: 'dias de streak somados', color: '#f97316', icon: '🔥' },
              { ref: goalsRef,  count: goalsCount,  suffix: '%',  label: 'de metas alcançadas', color: '#60a5fa', icon: '🎯' },
            ].map(({ ref, count, suffix, label, color, icon }) => (
              <Reveal key={label} delay={100}>
                <div ref={ref} className="glass-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
                  <div style={{
                    fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color,
                    letterSpacing: '-1px', lineHeight: 1, marginBottom: 8,
                  }}>
                    {count.toLocaleString('pt-BR')}{suffix}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" style={{ paddingTop: 60 }}>
        <div className="section-inner">
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="tag" style={{
                background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(167,139,250,0.3)',
                color: '#a78bfa', marginBottom: 16, display: 'inline-block',
              }}>
                Como funciona
              </span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-1px', marginTop: 12 }}>
                Simples assim.
              </h2>
            </div>
          </Reveal>
          <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {[
              { n: '01', title: 'Crie sua conta grátis', desc: 'Cadastre-se em menos de 1 minuto, sem cartão de crédito. Seu painel gamificado está pronto para usar.', icon: '🚀' },
              { n: '02', title: 'Defina tarefas e metas', desc: 'Adicione suas tarefas diárias, metas de curto e longo prazo e eventos na agenda integrada.', icon: '🎯' },
              { n: '03', title: 'Complete e suba de nível', desc: 'Cada tarefa concluída gera XP. Mantenha streaks, desbloqueie conquistas e veja seu personagem evoluir.', icon: '⭐' },
            ].map((step, i) => (
              <div key={step.n} style={{ width: '100%' }}>
                <Reveal delay={i * 120}>
                  <div className="glass-card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    <div style={{
                      minWidth: 52, height: 52, borderRadius: 14,
                      background: 'rgba(124,58,237,0.25)',
                      border: '1px solid rgba(124,58,237,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem',
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>
                        PASSO {step.n}
                      </div>
                      <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>{step.title}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.65 }}>{step.desc}</p>
                    </div>
                  </div>
                </Reveal>
                {i < 2 && <div className="step-connector" style={{ margin: '4px auto' }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section" style={{ paddingTop: 60 }}>
        <div className="section-inner">
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="tag" style={{
                background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(167,139,250,0.3)',
                color: '#a78bfa', marginBottom: 16, display: 'inline-block',
              }}>
                Módulos
              </span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-1px', marginTop: 12, marginBottom: 12 }}>
                Tudo que você precisa. Em um só lugar.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
                Seis módulos integrados que cobrem cada área da sua vida produtiva.
              </p>
            </div>
          </Reveal>
          <div className="grid-3">
            {[
              { icon: '✅', title: 'Tarefas', desc: 'Gerencie suas tarefas diárias com prioridades, prazos e ganho de XP por conclusão.', color: '#4ade80' },
              { icon: '🎯', title: 'Metas', desc: 'Defina objetivos de curto e longo prazo, acompanhe o progresso e celebre cada conquista.', color: '#a78bfa' },
              { icon: '💰', title: 'Finanças', desc: 'Controle receitas e despesas, visualize saldos e acompanhe sua saúde financeira.', color: '#fbbf24' },
              { icon: '📅', title: 'Agenda', desc: 'Organize eventos e compromissos em um calendário visual integrado com suas tarefas.', color: '#60a5fa' },
              { icon: '⭐', title: 'Gamificação', desc: 'XP, níveis, streaks e conquistas que tornam cada tarefa concluída uma vitória real.', color: '#f97316' },
              { icon: '📊', title: 'Dashboard', desc: 'Visão geral completa: progresso, streaks ativos, metas próximas e resumo financeiro.', color: '#c084fc' },
            ].map((feat, i) => (
              <Reveal key={feat.title} delay={i * 80}>
                <div className="glass-card" style={{ height: '100%' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, marginBottom: 16,
                    background: 'rgba(124,58,237,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    {feat.icon}
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 10, color: feat.color }}>
                    {feat.title}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', lineHeight: 1.65 }}>
                    {feat.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMIFICATION ── */}
      <section className="section" style={{
        paddingTop: 60,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)',
      }}>
        <div className="section-inner">
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="tag" style={{
                background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)',
                color: '#fb923c', marginBottom: 16, display: 'inline-block',
              }}>
                Gamificação
              </span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-1px', marginTop: 12, marginBottom: 12 }}>
                Sua vida virou um RPG.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>
                Cada ação tem peso. Cada dia conta. Evolua seu personagem enquanto evolui sua vida.
              </p>
            </div>
          </Reveal>
          <div className="grid-2">
            {[
              {
                icon: '⚡', color: '#facc15', title: 'Sistema de XP',
                desc: 'Cada tarefa concluída, meta atingida ou hábito mantido gera pontos de experiência. Suba de nível e desbloqueie novas conquistas.',
                items: ['Tarefas = XP imediato', 'Metas = bônus ao concluir', 'Consistência = multiplicador'],
              },
              {
                icon: '🔥', color: '#f97316', title: 'Streaks de fogo',
                desc: 'Mantenha sua sequência de dias ativos. Quanto mais longa a streak, maior o multiplicador de XP. Não quebre a corrente.',
                items: ['Streak diário de atividade', 'Multiplicador crescente de XP', 'Ranking entre usuários'],
              },
              {
                icon: '🏆', color: '#a78bfa', title: 'Conquistas',
                desc: 'Mais de 50 conquistas desbloqueáveis. Cada milestone da sua jornada é reconhecido e celebrado com badges exclusivos.',
                items: ['50+ badges únicos', 'Conquistas por área', 'Recompensas especiais'],
              },
              {
                icon: '📈', color: '#4ade80', title: 'Evolução de nível',
                desc: 'De Iniciante a Lendário — 10 níveis distintos com títulos exclusivos. Cada nível exige mais e recompensa mais.',
                items: ['10 níveis progressivos', 'Título e status únicos', 'Benefícios por nível'],
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                    <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: item.color }}>{item.title}</h3>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 16 }}>
                    {item.desc}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {item.items.map(it => (
                      <div key={it} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section className="section" style={{ paddingTop: 60 }}>
        <div className="section-inner">
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <span className="tag" style={{
                background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.4)',
                color: '#93c5fd', marginBottom: 16, display: 'inline-block',
              }}>
                Planos
              </span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-1px', marginTop: 12, marginBottom: 12 }}>
                Comece grátis. Evolua quando precisar.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
                Sem truques. Sem cobrança escondida.
              </p>
            </div>
          </Reveal>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {[
              {
                name: 'Free', price: 'R$0', period: '/mês', color: '#94a3b8',
                badge: null,
                features: [
                  '5 tarefas por dia',
                  '3 metas ativas',
                  '20 transações/mês',
                  'Gamificação básica',
                  'Dashboard simples',
                ],
                cta: 'Começar grátis',
                featured: false,
              },
              {
                name: 'Pro', price: 'R$14,90', period: '/mês', color: '#a78bfa',
                badge: 'MAIS POPULAR',
                features: [
                  'Tarefas ilimitadas',
                  'Metas ilimitadas',
                  'Transações ilimitadas',
                  'Agenda completa',
                  'Conquistas exclusivas',
                  'Suporte prioritário',
                ],
                cta: 'Assinar Pro →',
                featured: true,
              },
              {
                name: 'Elite', price: 'R$19,90', period: '/mês', color: '#fbbf24',
                badge: 'ELITE',
                features: [
                  'Tudo do Pro',
                  'Relatórios avançados',
                  'Export de dados',
                  'Badge Elite exclusivo',
                  'Acesso antecipado',
                  'Suporte VIP',
                ],
                cta: 'Assinar Elite →',
                featured: false,
              },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div className={`plan-card ${plan.featured ? 'featured' : ''}`}>
                  {plan.badge && (
                    <div style={{
                      position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                      background: plan.featured ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(251,191,36,0.2)',
                      border: plan.featured ? 'none' : '1px solid rgba(251,191,36,0.5)',
                      color: plan.featured ? '#fff' : '#fbbf24',
                      fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em',
                      padding: '4px 14px', borderRadius: '0 0 10px 10px',
                    }}>
                      {plan.badge}
                    </div>
                  )}
                  <div style={{ marginBottom: 8, marginTop: plan.badge ? 16 : 0 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: plan.color }}>{plan.name}</span>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px' }}>{plan.price}</span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{plan.period}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ color: plan.color, fontSize: '0.85rem', flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/login"
                    style={{
                      display: 'block', textAlign: 'center',
                      padding: '13px 24px', borderRadius: 12,
                      background: plan.featured
                        ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                        : 'rgba(255,255,255,0.06)',
                      border: plan.featured
                        ? '1px solid rgba(167,139,250,0.4)'
                        : '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="section" style={{ paddingTop: 60, paddingBottom: 120 }}>
        <div className="section-inner">
          <Reveal>
            <div style={{
              textAlign: 'center',
              padding: '72px 40px',
              borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.12) 100%)',
              border: '1px solid rgba(124,58,237,0.35)',
              position: 'relative', overflow: 'hidden',
              animation: 'ctaGlow 4s ease-in-out infinite',
            }}>
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 60%)',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚀</div>
                <h2 style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16,
                }}>
                  Pronto para subir de nível?
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem',
                  maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7,
                }}>
                  Junte-se a milhares de pessoas que já transformaram sua rotina em conquistas reais.
                  Grátis para sempre no plano básico.
                </p>
                <div className="hero-btns" style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                  <Link href="/login" className="btn-cta" style={{ fontSize: '1.1rem', padding: '18px 44px' }}>
                    Criar conta grátis →
                  </Link>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.78rem', marginTop: 18 }}>
                  Sem cartão necessário · Cancele quando quiser
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 2,
        borderTop: '1px solid rgba(124,58,237,0.15)',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 900 }}>
              Grind<span style={{ color: '#a78bfa' }}>UP</span>
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
            Produtividade gamificada para quem leva a sério a própria evolução.
          </p>
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            {[
              { label: 'Entrar', href: '/login' },
              { label: 'Criar conta', href: '/login' },
            ].map(link => (
              <Link key={link.label} href={link.href} style={{
                color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem',
                textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>
            © {new Date().getFullYear()} GrindUP. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
