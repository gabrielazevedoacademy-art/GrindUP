'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { COVERS, ALL_COVERS_CSS, getCoverById, type CoverDef } from '@/lib/covers'

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface CoverSelectorProps {
  userId: string
  plan: string                   // 'free' | 'pro' | 'elite'
  coverValue: string | null      // 'preset:aurora' | real URL | null
  onCoverChange: (value: string) => void
  onUploadClick: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function isPreset(value: string | null): value is string {
  return typeof value === 'string' && value.startsWith('preset:')
}

function getPresetId(value: string | null): string {
  if (isPreset(value)) return value.slice(7)
  return 'aurora'
}

function canUseCover(cover: CoverDef, plan: string): boolean {
  if (!cover.isPremium) return true
  return plan === 'elite'
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCK ICON
// ─────────────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width={11} height={11} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CoverSelector({
  userId,
  plan,
  coverValue,
  onCoverChange,
  onUploadClick,
}: CoverSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [lockedMsg, setLockedMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null) // cover id being saved
  const lockedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Determine current display ──────────────────────────────
  const showPreset = isPreset(coverValue) || coverValue === null
  const presetId   = getPresetId(coverValue)
  const activeCover = getCoverById(presetId)

  // ── Save cover to Supabase ─────────────────────────────────
  const saveCover = useCallback(async (cover: CoverDef) => {
    if (!canUseCover(cover, plan)) {
      if (lockedTimerRef.current) clearTimeout(lockedTimerRef.current)
      setLockedMsg('Exclusivo para assinantes Elite')
      lockedTimerRef.current = setTimeout(() => setLockedMsg(null), 2000)
      return
    }

    const newValue = `preset:${cover.id}`
    setSaving(cover.id)

    try {
      const supabase = createClientSupabase()
      await supabase
        .from('profiles')
        .update({ cover_url: newValue })
        .eq('id', userId)

      onCoverChange(newValue)
      setModalOpen(false)
    } finally {
      setSaving(null)
    }
  }, [plan, userId, onCoverChange])

  const handleUpload = useCallback(() => {
    setModalOpen(false)
    onUploadClick()
  }, [onUploadClick])

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setModalOpen(false)
  }, [])

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Inject all cover animations globally once */}
      <style>{ALL_COVERS_CSS}</style>
      <style>{`.cover-banner{height:180px}@media(max-width:767px){.cover-banner{height:120px}}`}</style>

      {/* ── Banner preview ────────────────────────────────── */}
      <div className="cover-banner" style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Cover layer */}
        {showPreset ? (
          <div
            className={activeCover?.className ?? 'cover-aurora'}
            style={{ position: 'absolute', inset: 0 }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverValue!}
            alt="Capa"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
          />
        )}

        {/* Change button */}
        <button
          onClick={() => setModalOpen(true)}
          style={{
            position: 'absolute', bottom: 12, right: 14,
            background: 'rgba(0,0,0,0.62)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 20,
            padding: '6px 14px',
            color: '#fff',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            letterSpacing: '0.02em',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(20,0,40,0.78)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.62)')}
        >
          <span style={{ fontSize: '0.85rem' }}>✦</span>
          Trocar capa
        </button>
      </div>

      {/* ── Modal ─────────────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={handleBackdropClick}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%', maxWidth: 'min(540px, 95vw)',
              maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              background: 'linear-gradient(160deg, #0f0a1a 0%, #100c1e 100%)',
              border: '1px solid rgba(124,58,237,0.45)',
              borderRadius: 20,
              boxShadow:
                '0 0 0 1px rgba(124,58,237,0.12), 0 24px 64px rgba(0,0,0,0.7), 0 0 60px rgba(124,58,237,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid rgba(124,58,237,0.18)',
                background: 'rgba(124,58,237,0.06)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                    Escolha sua capa
                  </h2>
                  <p style={{
                    margin: '4px 0 0', fontSize: '0.78rem',
                    color: 'rgba(167,139,250,0.75)',
                    fontWeight: 500,
                  }}>
                    Capas animadas em tempo real
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  aria-label="Fechar"
                  style={{
                    flexShrink: 0,
                    width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Locked message toast */}
            {lockedMsg && (
              <div
                style={{
                  margin: '12px 16px 0',
                  background: 'rgba(124,58,237,0.18)',
                  border: '1px solid rgba(124,58,237,0.45)',
                  borderRadius: 10,
                  padding: '8px 14px',
                  color: 'rgba(196,181,253,0.95)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                🔒 {lockedMsg}
              </div>
            )}

            {/* Grid */}
            <div
              style={{
                overflowY: 'auto',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                flex: 1,
              }}
            >
              {COVERS.map(cover => {
                const unlocked = canUseCover(cover, plan)
                const isActive =
                  (isPreset(coverValue) && coverValue === `preset:${cover.id}`) ||
                  (coverValue === null && cover.id === 'aurora')
                const isSavingThis = saving === cover.id

                return (
                  <button
                    key={cover.id}
                    onClick={() => saveCover(cover)}
                    disabled={isSavingThis}
                    title={cover.description}
                    style={{
                      position: 'relative',
                      border: isActive
                        ? '2px solid rgba(167,139,250,0.85)'
                        : '2px solid rgba(124,58,237,0.25)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: isSavingThis ? 'wait' : 'pointer',
                      padding: 0,
                      background: 'transparent',
                      opacity: unlocked ? 1 : 0.65,
                      transition: 'border-color 0.15s ease, transform 0.12s ease',
                      boxShadow: isActive
                        ? '0 0 16px rgba(167,139,250,0.4)'
                        : '0 2px 8px rgba(0,0,0,0.4)',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.65)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {/* Miniature animated banner */}
                    <div
                      className={cover.className}
                      style={{ height: 72, display: 'block' }}
                    />

                    {/* Cover name + badges */}
                    <div
                      style={{
                        padding: '6px 8px',
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 4,
                      }}
                    >
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {cover.name}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {isActive && (
                          <span style={{
                            fontSize: '0.62rem', fontWeight: 800,
                            color: 'rgba(196,181,253,0.9)',
                            background: 'rgba(124,58,237,0.35)',
                            borderRadius: 4, padding: '1px 5px',
                            letterSpacing: '0.06em',
                          }}>
                            ATIVA
                          </span>
                        )}
                        {cover.isPremium && !unlocked && (
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            fontSize: '0.62rem', fontWeight: 800,
                            color: 'rgba(251,191,36,0.9)',
                            background: 'rgba(120,53,15,0.45)',
                            border: '1px solid rgba(251,191,36,0.3)',
                            borderRadius: 4, padding: '1px 5px',
                            letterSpacing: '0.05em',
                          }}>
                            <LockIcon /> ELITE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Saving spinner overlay */}
                    {isSavingThis && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 20, height: 20,
                          border: '2px solid rgba(167,139,250,0.3)',
                          borderTopColor: '#a78bfa',
                          borderRadius: '50%',
                          animation: 'cs-spin 0.7s linear infinite',
                        }} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Modal footer */}
            <div
              style={{
                padding: '14px 16px',
                borderTop: '1px solid rgba(124,58,237,0.18)',
                background: 'rgba(124,58,237,0.04)',
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleUpload}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(124,58,237,0.4)',
                  background: 'rgba(124,58,237,0.1)',
                  color: 'rgba(196,181,253,0.9)',
                  fontSize: '0.85rem', fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(124,58,237,0.22)'
                  e.currentTarget.style.borderColor = 'rgba(124,58,237,0.7)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(124,58,237,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'
                }}
              >
                <span style={{ fontSize: '1rem' }}>↑</span>
                Usar minha própria foto
              </button>
            </div>
          </div>

          {/* Spinner keyframes — injected here so the modal has them */}
          <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </>
  )
}
