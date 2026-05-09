'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'

/* ─── Particle canvas ─────────────────────────────────────── */
function Particles({ count = 55 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    const c = canvas

    const resize = () => {
      c.width  = c.offsetWidth
      c.height = c.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const pts = Array.from({ length: count }, () => ({
      x:  Math.random() * c.width,
      y:  Math.random() * c.height,
      r:  Math.random() * 1.4 + 0.3,
      dx: (Math.random() - 0.5) * 0.22,
      dy: (Math.random() - 0.5) * 0.22,
      o:  Math.random() * 0.5 + 0.15,
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

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

/* ─── Scroll-reveal wrapper ───────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
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

/* ─── Main page ───────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClientSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  if (checking) return null

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes gradShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes pulse {
          0%,100% { text-shadow: 0 0 12px rgba(167,139,250,0.8), 0 0 30px rgba(124,58,237,0.5); }
          50%      { text-shadow: 0 0 28px rgba(167,139,250,1),   0 0 60px rgba(124,58,237,0.9), 0 0 100px rgba(124,58,237,0.3); }
        }
        @keyframes scrollBounce {
          0%,100% { transform: translateY(0); opacity: 1; }
          50%      { transform: translateY(8px); opacity: 0.4; }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 18px rgba(124,58,237,0.55); }
          50%      { box-shadow: 0 0 36px rgba(124,58,237,0.9), 0 0 64px rgba(124,58,237,0.35); }
        }
        @keyframes ctaGlow {
          0%,100% { box-shadow: 0 0 22px rgba(124,58,237,0.6); }
          50%      { box-shadow: 0 0 48px rgba(124,58,237,1), 0 0 80px rgba(124,58,237,0.4); }
        }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 14px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border: 1px solid rgba(167,139,250,0.4);
          color: #fff; font-size: 1rem; font-weight: 700;
          text-decoration: none; cursor: pointer;
          animation: btnGlow 2.4s ease-in-out infinite;
          transition: transform 0.18s ease, filter 0.18s ease;
        }
        .btn-primary:hover { transform: translateY(-2px); filter: brightness(1.12); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 14px;
          background: transparent;
          border: 1px solid rgba(167,139,250,0.35);
          color: rgba(255,255,255,0.75); font-size: 1rem; font-weight: 600;
          text-decoration: none; cursor: pointer;
          transition: all 0.18s ease;
        }
        .btn-outline:hover {
          background: rgba(124,58,237,0.12);
          border-color: rgba(167,139,250,0.65);
          color: #fff;
        }
        .step-card {
          flex: 1; padding: 32px 28px; border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(124,58,237,0.18);
          transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }
        .step-card:hover {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 32px rgba(124,58,237,0.2);
          transform: translateY(-4px);
        }
        .feat-card {
          padding: 28px 24px; border-radius: 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(124,58,237,0.13);
          transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }
        .feat-card:hover {
          border-color: rgba(124,58,237,0.4);
          box-shadow: 0 0 28px rgba(124,58,237,0.15);
          transform: translateY(-3px);
        }
        .plan-card {
          flex: 1; min-width: 260px; padding: 32px 28px; border-radius: 22px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(124,58,237,0.15);
          display: flex; flex-direction: column; gap: 0;
          transition: transform 0.2s ease;
        }
        .plan-card:hover { transform: translateY(-4px); }
        .plan-card.popular {
          border: 2px solid rgba(167,139,250,0.7);
          box-shadow: 0 0 40px rgba(124,58,237,0.3), 0 0 80px rgba(124,58,237,0.1);
          background: rgba(124,58,237,0.08);
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 2.4rem !important; }
          .hero-sub   { font-size: 1rem !important; }
          .steps-row  { flex-direction: column !important; }
          .feat-grid  { grid-template-columns: 1fr 1fr !important; }
          .game-row   { flex-direction: column !important; }
          .plans-row  { flex-direction: column !important; align-items: center !important; }
          .plan-card  { width: 100% !important; max-width: 400px !important; }
        }
        @media (max-width: 480px) {
          .feat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        id="hero"
        style={{
          position: 'relative', minHeight: '100vh',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '80px 24px 60px',
          background: 'linear-gradient(135deg, #0a0a0f, #0d0a1e, #0a0f1e, #080a0f, #0d0a1e, #0a0a0f)',
          backgroundSize: '400% 400%',
          animation: 'gradShift 8s ease infinite',
          overflow: 'hidden',
        }}
      >
        <Particles />

        {/* Nav */}
        <nav style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 48px',
          borderBottom: '1px solid rgba(124,58,237,0.1)',
          background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(16px)',
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Grind<span style={{ color: '#a78bfa', animation: 'pulse 2.5s ease-in-out infinite' }}>UP</span>
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/login" className="btn-outline" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
              Entrar
            </Link>
            <Link href="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.875rem', animation: 'none', boxShadow: '0 0 14px rgba(124,58,237,0.5)' }}>
              Começar grátis
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          <div style={{ marginBottom: 24 }}>
            <span style={{
              display: 'inline-block', padding: '6px 18px', borderRadius: 999,
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#a78bfa', marginBottom: 20,
            }}>
              ⚡ Gamificação de produtividade
            </span>
          </div>

          <h1 className="hero-title" style={{
            fontSize: 'clamp(2.6rem, 6vw, 4.2rem)',
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: '-1px', marginBottom: 24,
          }}>
            Sua vida tem um{' '}
            <span style={{ color: '#a78bfa', animation: 'pulse 2.5s ease-in-out infinite' }}>
              próximo nível.
            </span>
            <br />Está pronto para subir?
          </h1>

          <p className="hero-sub" style={{
            fontSize: '1.18rem', lineHeight: 1.65,
            color: 'rgba(255,255,255,0.58)', marginBottom: 44, maxWidth: 640, margin: '0 auto 44px',
          }}>
            Organize tarefas, finanças e metas enquanto sobe de nível na vida real.
            Gamificação que transforma sua rotina em conquistas.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-primary" style={{ fontSize: '1.05rem', padding: '15px 36px' }}>
              Começar grátis →
            </Link>
            <a href="#como-funciona" className="btn-outline" style={{ fontSize: '1.05rem', padding: '15px 36px' }}>
              Ver como funciona
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          animation: 'scrollBounce 1.8s ease-in-out infinite',
          color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          SCROLL
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────── */}
      <section id="como-funciona" style={{ background: '#0d0d1a', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: 12 }}>
                Simples assim
              </p>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.5px' }}>
                Como o GrindUP funciona
              </h2>
            </div>
          </Reveal>

          <div className="steps-row" style={{ display: 'flex', gap: 20 }}>
            {[
              {
                n: '01', title: 'Organize sua vida',
                desc: 'Adicione tarefas, metas, compromissos e transações financeiras em módulos dedicados para cada área da sua vida.',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.6} strokeLinecap="round">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                n: '02', title: 'Complete e ganhe XP',
                desc: 'Cada tarefa concluída, meta atingida e check-in diário te dá pontos de experiência reais. Sua produtividade tem recompensa.',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.6} strokeLinecap="round">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                ),
              },
              {
                n: '03', title: 'Suba de nível',
                desc: 'Evolua seu perfil, mantenha streaks e desbloqueie recompensas. Cada dia é uma chance de ser melhor que ontem.',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.6} strokeLinecap="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 120}>
                <div className="step-card">
                  <div style={{ marginBottom: 20 }}>{step.icon}</div>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.14em',
                    color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 10,
                  }}>
                    PASSO {step.n}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>{step.title}</h3>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.5)' }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ──────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(180deg, #0a0a0f, #0d0a1e)',
        padding: '100px 24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: 12 }}>
                Módulos completos
              </p>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.5px' }}>
                Tudo que você precisa em um só lugar
              </h2>
            </div>
          </Reveal>

          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {[
              { color: '#a78bfa', title: 'Tarefas', desc: 'Gerencie suas atividades diárias com prioridade, prazo e XP por conclusão.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { color: '#34d399', title: 'Finanças', desc: 'Registre receitas e despesas, acompanhe o saldo e controle seu orçamento.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg> },
              { color: '#60a5fa', title: 'Agenda', desc: 'Calendário completo com eventos coloridos e visualização mensal.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
              { color: '#f59e0b', title: 'Metas', desc: 'Defina objetivos com prazo e progresso. Ganhe 100 XP ao atingir cada meta.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></svg> },
              { color: '#f87171', title: 'Check-in', desc: 'Registre seu humor e energia 3x ao dia. Mantenha streaks e veja sua evolução.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 13.5s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={2.5} /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={2.5} /></svg> },
              { color: '#c084fc', title: 'Gamificação', desc: 'XP, níveis, streaks e badges. Cada ação vira progresso real no seu perfil.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg> },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="feat-card">
                  <div style={{ color: f.color, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.48)' }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMIFICAÇÃO DESTAQUE ─────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0d0a1e 0%, #1a0a3e 50%, #0d0a1e 100%)',
        padding: '100px 24px',
        borderTop: '1px solid rgba(124,58,237,0.2)',
        borderBottom: '1px solid rgba(124,58,237,0.2)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: 12 }}>
                🎮 Sistema de progressão
              </p>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                Sua vida virou um jogo.{' '}
                <span style={{ color: '#a78bfa', animation: 'pulse 2.5s ease-in-out infinite' }}>
                  E você vai vencer.
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="game-row" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              {
                icon: '⚡', title: 'XP & Níveis',
                desc: 'Cada ação conta. Tarefas, metas e check-ins te dão XP real que evolui seu nível.',
                color: '#a78bfa',
              },
              {
                icon: '🔥', title: 'Streaks',
                desc: 'Mantenha sequências diárias de check-in e veja sua dedicação virar estatística.',
                color: '#f97316',
              },
              {
                icon: '🎯', title: 'Missões diárias',
                desc: 'Complete desafios do dia a dia e ganhe recompensas extras pelo seu empenho.',
                color: '#34d399',
              },
              {
                icon: '🏆', title: 'Conquistas',
                desc: 'Desbloqueie badges e recompensas conforme você atinge marcos na sua jornada.',
                color: '#fbbf24',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div style={{
                  flex: '1 1 220px', maxWidth: 260,
                  padding: '30px 24px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${item.color}30`,
                  boxShadow: `0 0 24px ${item.color}12`,
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}>
                  <div style={{ fontSize: '2.4rem', marginBottom: 16 }}>{item.icon}</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: item.color, marginBottom: 10 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.5)' }}>
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ───────────────────────────────────────────── */}
      <section id="planos" style={{ background: '#0a0a0f', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: 12 }}>
                Sem surpresas
              </p>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.5px' }}>
                Escolha seu plano
              </h2>
            </div>
          </Reveal>

          <div className="plans-row" style={{ display: 'flex', gap: 20, alignItems: 'stretch', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Free */}
            <Reveal delay={0}>
              <div className="plan-card">
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 8 }}>Free</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 900 }}>R$ 0</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>/mês</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Para começar sua jornada</p>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, marginBottom: 28, flex: 1 }}>
                  {[
                    [true,  '20 tarefas por mês'],
                    [true,  '3 metas ativas'],
                    [true,  'Agenda completa'],
                    [true,  'Check-in diário'],
                    [false, 'Finanças avançadas'],
                    [false, 'Missões diárias'],
                    [false, 'Resumo semanal IA'],
                  ].map(([ok, label]) => (
                    <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ color: ok ? '#4ade80' : 'rgba(255,255,255,0.2)', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                        {ok ? '✓' : '✗'}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: ok ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)' }}>
                        {label as string}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/login" className="btn-outline" style={{ textAlign: 'center', justifyContent: 'center', width: '100%' }}>
                  Começar grátis
                </Link>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal delay={120}>
              <div className="plan-card popular" style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  padding: '5px 18px', borderRadius: 999,
                  fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#fff', whiteSpace: 'nowrap',
                  boxShadow: '0 0 16px rgba(124,58,237,0.6)',
                }}>
                  ⭐ MAIS POPULAR
                </div>
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', marginBottom: 8 }}>Pro</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 900 }}>R$ 9,90</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>/mês</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Para quem leva a sério</p>
                </div>
                <div style={{ borderTop: '1px solid rgba(124,58,237,0.2)', paddingTop: 24, marginBottom: 28, flex: 1 }}>
                  {[
                    [true, '200 tarefas por mês'],
                    [true, '10 metas ativas'],
                    [true, 'Agenda completa'],
                    [true, 'Check-in diário'],
                    [true, 'Finanças avançadas'],
                    [true, 'Missões diárias'],
                    [false,'Resumo semanal IA'],
                  ].map(([ok, label]) => (
                    <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ color: ok ? '#4ade80' : 'rgba(255,255,255,0.2)', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                        {ok ? '✓' : '✗'}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: ok ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)' }}>
                        {label as string}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/login" className="btn-primary" style={{ textAlign: 'center', justifyContent: 'center', width: '100%' }}>
                  Assinar Pro
                </Link>
              </div>
            </Reveal>

            {/* Elite */}
            <Reveal delay={240}>
              <div className="plan-card">
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fbbf24', marginBottom: 8 }}>Elite</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 900 }}>R$ 19,90</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>/mês</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Sem limites. Sem desculpas.</p>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, marginBottom: 28, flex: 1 }}>
                  {[
                    [true, 'Tarefas ilimitadas'],
                    [true, 'Metas ilimitadas'],
                    [true, 'Agenda completa'],
                    [true, 'Check-in diário'],
                    [true, 'Finanças avançadas'],
                    [true, 'Missões diárias'],
                    [true, 'Resumo semanal IA'],
                  ].map(([ok, label]) => (
                    <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ color: ok ? '#fbbf24' : 'rgba(255,255,255,0.2)', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                        {ok ? '✓' : '✗'}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: ok ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)' }}>
                        {label as string}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/login" style={{
                  display: 'block', textAlign: 'center', padding: '14px 24px', borderRadius: 14,
                  background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)',
                  color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
                  transition: 'all 0.18s ease',
                }}>
                  Assinar Elite
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0a0a0f, #0d0a1e, #0a0f1e)',
        backgroundSize: '400% 400%', animation: 'gradShift 8s ease infinite',
        padding: '120px 24px', textAlign: 'center', overflow: 'hidden',
      }}>
        <Particles count={35} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <Reveal>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 20, lineHeight: 1.15,
            }}>
              Pronto para{' '}
              <span style={{ color: '#a78bfa', animation: 'pulse 2.5s ease-in-out infinite' }}>
                subir de nível?
              </span>
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.55)', marginBottom: 44, lineHeight: 1.65 }}>
              Junte-se a quem já está evoluindo. Comece grátis hoje.
            </p>
            <Link href="/login" className="btn-primary" style={{
              fontSize: '1.1rem', padding: '17px 44px',
              animation: 'ctaGlow 2s ease-in-out infinite',
            }}>
              Criar conta grátis →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        background: '#050508',
        borderTop: '1px solid rgba(124,58,237,0.1)',
        padding: '40px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20,
      }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
          Grind<span style={{ color: '#a78bfa' }}>UP</span>
        </span>

        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {['Termos de uso', 'Privacidade', 'Contato'].map(l => (
            <a key={l} href="#" style={{
              fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)',
              textDecoration: 'none', transition: 'color 0.15s ease',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              {l}
            </a>
          ))}
        </div>

        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
          © 2026 GrindUP. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
