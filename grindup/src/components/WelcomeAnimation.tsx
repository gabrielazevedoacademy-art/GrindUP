'use client'

import { useState, useEffect, useRef } from 'react'

const INIT_TEXT = 'SISTEMA INICIALIZANDO...'

function progressLabel(p: number): string {
  if (p < 25) return 'Carregando perfil...'
  if (p < 50) return 'Sincronizando dados...'
  if (p < 75) return 'Ativando gamificação...'
  return 'PRONTO'
}

type Props = {
  userName: string
  userLevel?: number
  userXp?: number
  onComplete: () => void
}

// Phases: 0=checking 1=black 2=typing 3=progress 4=flash 5=welcome 6=stats 7=button
export default function WelcomeAnimation({
  userName,
  userLevel = 1,
  userXp = 0,
  onComplete,
}: Props) {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const [visible, setVisible]       = useState(false)   // true = show the overlay
  const [checked, setChecked]       = useState(false)   // true = localStorage read done
  const [phase, setPhase]           = useState(1)
  const [typed, setTyped]           = useState(0)
  const [progress, setProgress]     = useState(0)
  const [shownStats, setShownStats] = useState(0)
  const [exiting, setExiting]       = useState(false)

  const name  = (userName || 'USUÁRIO').toUpperCase()
  const stats = [`NÍVEL ${userLevel}`, `${userXp} XP`, 'RANK: INICIANTE']

  // ── Step 1: check localStorage (only on client, inside useEffect) ──
  useEffect(() => {
    const lastAccess = localStorage.getItem('grindup_last_access')
    const elapsed = lastAccess ? Date.now() - Number(lastAccess) : Infinity
    if (elapsed < 600000) {
      onCompleteRef.current()
    } else {
      setVisible(true)
    }
    setChecked(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 2: phase sequencer (only runs when visible) ──
  useEffect(() => {
    if (!visible) return
    const t: ReturnType<typeof setTimeout>[] = []
    t.push(setTimeout(() => setPhase(2), 150))
    t.push(setTimeout(() => setPhase(3), 1650))
    t.push(setTimeout(() => setPhase(4), 3950))
    t.push(setTimeout(() => setPhase(5), 4060))
    t.push(setTimeout(() => setShownStats(1), 5100))
    t.push(setTimeout(() => setShownStats(2), 5470))
    t.push(setTimeout(() => setShownStats(3), 5840))
    t.push(setTimeout(() => setPhase(7), 6400))
    return () => t.forEach(clearTimeout)
  }, [visible])

  // ── Typewriter ──
  useEffect(() => {
    if (phase !== 2 || typed >= INIT_TEXT.length) return
    const t = setTimeout(() => setTyped((c) => c + 1), 58)
    return () => clearTimeout(t)
  }, [phase, typed])

  // ── Progress bar (100 ticks × 23ms ≈ 2.3s) ──
  useEffect(() => {
    if (phase !== 3 || progress >= 100) return
    const t = setTimeout(() => setProgress((p) => Math.min(p + 1, 100)), 23)
    return () => clearTimeout(t)
  }, [phase, progress])

  function handleStart() {
    setExiting(true)
    localStorage.setItem('grindup_last_access', String(Date.now()))
    setTimeout(() => {
      setVisible(false)
      onCompleteRef.current()
    }, 520)
  }

  // Don't render anything until localStorage has been checked
  // (avoids flash of animation on subsequent visits during SSR hydration)
  if (!checked || !visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#00000d',
        transition: exiting ? 'opacity 0.5s ease' : undefined,
        opacity: exiting ? 0 : 1,
      }}
    >
      <style>{`
        @keyframes wa_cursorBlink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }
        @keyframes wa_flashWhite {
          0% { opacity: 1; } 100% { opacity: 0; pointer-events: none; }
        }
        @keyframes wa_welcomeIn {
          0%  { opacity: 0; transform: scale(0.82) translateY(18px); }
          65% { transform: scale(1.04) translateY(-4px); }
          100%{ opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wa_nameGlow {
          0%, 100% {
            text-shadow: 0 0 14px rgba(167,139,250,0.9), 0 0 36px rgba(124,58,237,0.65);
          }
          50% {
            text-shadow: 0 0 28px rgba(167,139,250,1), 0 0 72px rgba(124,58,237,0.95),
                         0 0 110px rgba(79,70,229,0.5);
          }
        }
        @keyframes wa_statRegister {
          0%  { opacity: 0; }
          18% { opacity: 1; }
          36% { opacity: 0; }
          54% { opacity: 1; }
          72% { opacity: 0; }
          100%{ opacity: 1; }
        }
        @keyframes wa_btnGlow {
          0%, 100% {
            box-shadow: 0 0 18px rgba(124,58,237,0.55), 0 0 0 0 rgba(124,58,237,0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(124,58,237,0.95), 0 0 0 12px rgba(124,58,237,0);
          }
        }
      `}</style>

      {/* White flash */}
      {phase === 4 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: '#fff',
            animation: 'wa_flashWhite 0.1s ease-out forwards',
          }}
        />
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          width: '100%',
          maxWidth: 520,
          padding: '0 32px',
          textAlign: 'center',
        }}
      >
        {/* ── Typewriter + progress bar ── */}
        {(phase === 2 || phase === 3) && (
          <div style={{ width: '100%' }}>
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
              <span style={{ animation: 'wa_cursorBlink 0.7s step-end infinite' }}>█</span>
            </p>

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
          <div style={{ animation: 'wa_welcomeIn 0.55s cubic-bezier(0.34,1.4,0.64,1) both' }}>
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
                animation: 'wa_nameGlow 1.2s ease-in-out infinite',
              }}
            >
              {name}
            </h1>
          </div>
        )}

        {/* ── Stats ── */}
        {phase >= 6 && (
          <div style={{ display: 'flex', gap: 40 }}>
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
                  animation:
                    shownStats === i + 1
                      ? 'wa_statRegister 0.65s ease-out forwards'
                      : undefined,
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
              animation: 'wa_btnGlow 1.6s ease-in-out infinite',
            }}
          >
            INICIAR JORNADA →
          </button>
        )}
      </div>
    </div>
  )
}
