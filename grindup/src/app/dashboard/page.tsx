'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClientSupabase } from '@/lib/supabase'

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  plan: string
  xp: number
  level: number
  streak_days: number
}

// ─────────────────────────────────────────────────────────────
// INIT ANIMATION
// ─────────────────────────────────────────────────────────────
const INIT_TEXT = 'SISTEMA INICIALIZANDO...'

function progressLabel(p: number): string {
  if (p < 25) return 'Carregando perfil...'
  if (p < 50) return 'Sincronizando dados...'
  if (p < 75) return 'Ativando gamificação...'
  return 'PRONTO'
}

// Phases: 1=black 2=typing 3=progress 4=flash 5=welcome 6=stats 7=button
function InitAnimation({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const [phase, setPhase]           = useState(1)
  const [typed, setTyped]           = useState(0)
  const [progress, setProgress]     = useState(0)
  const [shownStats, setShownStats] = useState(0)
  const [exiting, setExiting]       = useState(false)

  const name  = (profile.full_name || profile.username || 'USUÁRIO').toUpperCase()
  const stats = [`NÍVEL ${profile.level}`, `${profile.xp} XP`, 'RANK: INICIANTE']

  // Master sequencer
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = []
    t.push(setTimeout(() => setPhase(2), 120))       // start typing
    t.push(setTimeout(() => setPhase(3), 1600))      // typing → progress
    t.push(setTimeout(() => setPhase(4), 3900))      // progress → flash
    t.push(setTimeout(() => setPhase(5), 4020))      // flash → welcome
    t.push(setTimeout(() => setShownStats(1), 5050)) // stat 1
    t.push(setTimeout(() => setShownStats(2), 5420)) // stat 2
    t.push(setTimeout(() => setShownStats(3), 5790)) // stat 3
    t.push(setTimeout(() => setPhase(7), 6350))      // → button
    return () => t.forEach(clearTimeout)
  }, [])

  // Typewriter
  useEffect(() => {
    if (phase !== 2 || typed >= INIT_TEXT.length) return
    const t = setTimeout(() => setTyped((c) => c + 1), 58)
    return () => clearTimeout(t)
  }, [phase, typed])

  // Progress bar  (100 ticks × 23ms ≈ 2.3s)
  useEffect(() => {
    if (phase !== 3 || progress >= 100) return
    const t = setTimeout(() => setProgress((p) => Math.min(p + 1, 100)), 23)
    return () => clearTimeout(t)
  }, [phase, progress])

  function handleStart() {
    setExiting(true)
    setTimeout(onDone, 520)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#00000d',
        transition: exiting ? 'opacity 0.5s ease' : undefined,
        opacity: exiting ? 0 : 1,
      }}
    >
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }
        @keyframes flashWhite {
          0%   { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes welcomeIn {
          0%   { opacity: 0; transform: scale(0.85) translateY(16px); }
          60%  { transform: scale(1.03) translateY(-3px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes nameGlow {
          0%, 100% {
            text-shadow: 0 0 14px rgba(167,139,250,0.9), 0 0 35px rgba(124,58,237,0.6);
          }
          50% {
            text-shadow: 0 0 28px rgba(167,139,250,1), 0 0 70px rgba(124,58,237,0.9),
                         0 0 100px rgba(79,70,229,0.5);
          }
        }
        @keyframes statRegister {
          0%   { opacity: 0; }
          18%  { opacity: 1; }
          36%  { opacity: 0; }
          54%  { opacity: 1; }
          72%  { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes btnGlow {
          0%, 100% {
            box-shadow: 0 0 18px rgba(124,58,237,0.5), 0 0 0 0 rgba(124,58,237,0.3);
          }
          50% {
            box-shadow: 0 0 38px rgba(124,58,237,0.95), 0 0 0 10px rgba(124,58,237,0);
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Flash overlay */}
      {phase === 4 && (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: '#fff', animation: 'flashWhite 0.1s ease-out forwards' }}
        />
      )}

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8 px-8 text-center">

        {/* ── Typewriter ── */}
        {(phase === 2 || phase === 3) && (
          <div>
            <p
              style={{
                fontFamily: '"Courier New", Courier, monospace',
                color: '#00ff88',
                fontSize: '1.05rem',
                letterSpacing: '0.14em',
                textShadow: '0 0 14px rgba(0,255,136,0.75)',
              }}
            >
              {INIT_TEXT.slice(0, typed)}
              <span style={{ animation: 'cursorBlink 0.7s step-end infinite' }}>█</span>
            </p>

            {/* Progress bar (only in phase 3) */}
            {phase === 3 && (
              <div style={{ marginTop: 28 }}>
                <div
                  style={{
                    height: 5,
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: 999,
                    overflow: 'hidden',
                    width: 320,
                    margin: '0 auto',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #7c3aed, #00ff88)',
                      borderRadius: 999,
                      transition: 'width 0.02s linear',
                    }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: '"Courier New", Courier, monospace',
                    color: 'rgba(0,255,136,0.6)',
                    fontSize: '0.7rem',
                    marginTop: 10,
                    letterSpacing: '0.12em',
                  }}
                >
                  {progressLabel(progress)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Welcome ── */}
        {phase >= 5 && (
          <div style={{ animation: 'welcomeIn 0.55s cubic-bezier(0.34,1.4,0.64,1) both' }}>
            <p
              style={{
                fontFamily: '"Courier New", Courier, monospace',
                color: 'rgba(0,255,136,0.45)',
                fontSize: '0.72rem',
                letterSpacing: '0.22em',
                marginBottom: 12,
              }}
            >
              BEM-VINDO AO GRINDUP
            </p>
            <h1
              style={{
                fontSize: 'clamp(2rem, 5.5vw, 3.4rem)',
                fontWeight: 900,
                color: '#a78bfa',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                animation: 'nameGlow 1.2s ease-in-out infinite',
              }}
            >
              {name}
            </h1>
          </div>
        )}

        {/* ── Stats ── */}
        {phase >= 6 && (
          <div className="flex gap-10">
            {stats.map((stat, i) => (
              <span
                key={stat}
                style={{
                  fontFamily: '"Courier New", Courier, monospace',
                  color: '#00ff88',
                  fontSize: '0.8rem',
                  letterSpacing: '0.13em',
                  textShadow: '0 0 10px rgba(0,255,136,0.65)',
                  opacity: shownStats > i ? 1 : 0,
                  animation: shownStats === i + 1 ? 'statRegister 0.65s ease-out forwards' : undefined,
                }}
              >
                {stat}
              </span>
            ))}
          </div>
        )}

        {/* ── CTA button ── */}
        {phase >= 7 && (
          <button
            onClick={handleStart}
            style={{
              padding: '13px 38px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              letterSpacing: '0.13em',
              cursor: 'pointer',
              animation: 'btnGlow 1.6s ease-in-out infinite',
            }}
          >
            INICIAR JORNADA →
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD CONTENT
// ─────────────────────────────────────────────────────────────
const PLAN_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  free:  { bg: 'rgba(100,100,110,0.18)', color: '#9ca3af', border: 'rgba(100,100,110,0.3)'  },
  pro:   { bg: 'rgba(124,58,237,0.18)',  color: '#a78bfa', border: 'rgba(124,58,237,0.4)'   },
  elite: { bg: 'rgba(234,179,8,0.14)',   color: '#fbbf24', border: 'rgba(234,179,8,0.35)'   },
}

const MODULES = [
  {
    href: '/dashboard/tarefas',
    title: 'Tarefas',
    subtitle: 'Organize suas atividades diárias e ganhe XP',
    preview: 'Nenhuma tarefa pendente',
    iconColor: '#a78bfa',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/financas',
    title: 'Finanças',
    subtitle: 'Controle receitas, despesas e construa riqueza',
    preview: 'R$ 0,00 registrado',
    iconColor: '#34d399',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <line x1="12" y1="2" x2="12" y2="22" strokeLinecap="round" />
        <path strokeLinecap="round" d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/agenda',
    title: 'Agenda',
    subtitle: 'Planeje seus compromissos e não perca nada',
    preview: 'Nenhum evento hoje',
    iconColor: '#60a5fa',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/dashboard/metas',
    title: 'Metas',
    subtitle: 'Defina objetivos e acompanhe seu progresso',
    preview: 'Nenhuma meta ativa',
    iconColor: '#f97316',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

function DashboardContent({ profile }: { profile: Profile }) {
  const displayName = profile.full_name || profile.username || 'Usuário'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const planStyle = PLAN_STYLE[profile.plan as keyof typeof PLAN_STYLE] ?? PLAN_STYLE.free

  const xpForNextLevel    = profile.level * 1000
  const xpInCurrentLevel  = profile.xp % xpForNextLevel
  const xpPct             = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100)

  // avatar_url is '' (empty string) when not set by the trigger
  const hasAvatar = Boolean(profile.avatar_url && profile.avatar_url.trim() !== '')

  const gamingStats = [
    {
      label: 'Nível',
      value: profile.level,
      color: '#a78bfa',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ),
    },
    {
      label: 'XP Total',
      value: profile.xp.toLocaleString('pt-BR'),
      color: '#60a5fa',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
        </svg>
      ),
    },
    {
      label: 'Streak',
      value: `${profile.streak_days}d`,
      color: '#f97316',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
    },
    {
      label: 'Missões hoje',
      value: 0,
      color: '#fbbf24',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="8" r="6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen">

      {/* ── Cover banner 160px ── */}
      <div
        style={{
          height: 160,
          width: '100%',
          background: 'linear-gradient(135deg, #1a0533 0%, #0d0a1e 30%, #0a1230 60%, #1e0a3a 85%, #12063a 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 6s ease infinite',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glows */}
        <div aria-hidden="true" style={{ position: 'absolute', right: 60,  top: 20,  width: 180, height: 180, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', filter: 'blur(50px)' }} />
        <div aria-hidden="true" style={{ position: 'absolute', left: 80,   bottom: 0, width: 120, height: 120, borderRadius: '50%', background: 'rgba(79,70,229,0.15)',  filter: 'blur(35px)' }} />
        <div aria-hidden="true" style={{ position: 'absolute', right: 220, top: 10,  width: 80,  height: 80,  borderRadius: '50%', background: 'rgba(167,139,250,0.08)', filter: 'blur(25px)' }} />
      </div>

      <div className="px-8 pb-10" style={{ marginTop: -48 }}>

        {/* ── Profile row ── */}
        <div className="mb-8 flex items-end gap-5">

          {/* Avatar — 96px, border + glow */}
          {hasAvatar ? (
            // referrerPolicy="no-referrer" is required for Google profile photos
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url!}
              alt={displayName}
              referrerPolicy="no-referrer"
              width={96}
              height={96}
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: '3px solid rgba(124,58,237,0.75)',
                boxShadow: '0 0 28px rgba(124,58,237,0.6)',
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 900,
                color: '#fff',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                border: '3px solid rgba(124,58,237,0.75)',
                boxShadow: '0 0 28px rgba(124,58,237,0.6)',
              }}
            >
              {initials}
            </div>
          )}

          {/* Name + badge */}
          <div style={{ marginBottom: 6 }}>
            <h2 className="mb-2 text-2xl font-black text-white">{displayName}</h2>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
              style={{
                background: planStyle.bg,
                color: planStyle.color,
                border: `1px solid ${planStyle.border}`,
              }}
            >
              {profile.plan}
            </span>
          </div>
        </div>

        {/* ── Gamification stat cards ── */}
        <div className="mb-5 grid grid-cols-4 gap-4">
          {gamingStats.map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="mt-1 text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── XP progress bar ── */}
        <div
          className="mb-6 rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(124,58,237,0.14)',
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              Progresso para o Nível {profile.level + 1}
            </span>
            <span className="text-sm font-bold text-violet-400">{xpPct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden' }}>
            <div className="xp-bar-fill" style={{ width: `${xpPct}%`, transition: 'width 0.6s ease' }} />
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-xs text-gray-600">{profile.xp.toLocaleString('pt-BR')} XP</span>
            <span className="text-xs text-gray-600">{xpForNextLevel.toLocaleString('pt-BR')} XP</span>
          </div>
        </div>

        {/* ── Module grid 2×2 ── */}
        <div className="grid grid-cols-2 gap-4">
          {MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href} className="module-card">
              <div style={{ color: mod.iconColor, marginBottom: 14 }}>{mod.icon}</div>
              <h3 className="mb-1 text-base font-bold text-white">{mod.title}</h3>
              <p className="mb-3 text-xs leading-relaxed text-gray-500">{mod.subtitle}</p>
              <p className="mb-5 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{mod.preview}</p>
              <span
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: 'rgba(124,58,237,0.14)',
                  color: '#a78bfa',
                  border: '1px solid rgba(124,58,237,0.25)',
                }}
              >
                Acessar →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [showInit, setShowInit] = useState(false)

  useEffect(() => {
    const supabase = createClientSupabase()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setShowInit(!localStorage.getItem('grindup_initialized'))
      setLoading(false)
    })
  }, [])

  function handleInitDone() {
    localStorage.setItem('grindup_initialized', 'true')
    setShowInit(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          style={{
            width: 36, height: 36,
            border: '3px solid rgba(124,58,237,0.22)',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!profile) return null

  return (
    <>
      {showInit && <InitAnimation profile={profile} onDone={handleInitDone} />}
      <DashboardContent profile={profile} />
    </>
  )
}
