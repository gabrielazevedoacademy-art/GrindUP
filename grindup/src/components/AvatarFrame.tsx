'use client'

import { useState } from 'react'
import { getFrameForLevel, getAllUnlockedFrames, type FrameDef } from '@/lib/badges'

const LS_KEY = 'grindup_selected_frame'

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────
export interface AvatarFrameProps {
  avatarUrl:   string | null
  displayName: string
  initials:    string
  level:       number
  size?:       number    // default 96
  selectable?: boolean   // default true — shows modal on click
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL RING PREVIEW (used inside the selector modal)
// ─────────────────────────────────────────────────────────────────────────────
function RingPreview({ frame, size = 40 }: { frame: FrameDef; size?: number }) {
  const pad = Math.max(2, Math.round(frame.padding * (size / 96)))
  return (
    <div
      style={{
        position: 'relative',
        width: size + pad * 2,
        height: size + pad * 2,
        borderRadius: '50%',
        flexShrink: 0,
        ...frame.styles,
        animation: frame.styles.animation
          ? `${frame.styles.animation}`
          : undefined,
      }}
    >
      {frame.animationCSS && <style>{frame.animationCSS}</style>}
      <div style={{
        position: 'absolute',
        inset: pad,
        borderRadius: '50%',
        background: '#100c1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size * 0.22}rem`,
        fontWeight: 900,
        color: 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
      }}>
        ✦
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FRAME SELECTOR MODAL
// ─────────────────────────────────────────────────────────────────────────────
function FrameModal({
  level,
  currentMinLevel,
  onSelect,
  onClose,
}: {
  level: number
  currentMinLevel: number
  onSelect: (minLevel: number) => void
  onClose: () => void
}) {
  const frames = getAllUnlockedFrames(level)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '90%', maxWidth: 480,
        background: 'linear-gradient(160deg, #0f0a1a 0%, #100c1e 100%)',
        border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20,
        boxShadow: '0 0 0 1px rgba(124,58,237,0.1), 0 24px 64px rgba(0,0,0,0.6), 0 0 48px rgba(124,58,237,0.12)',
        overflow: 'hidden',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          background: 'rgba(124,58,237,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(167,139,250,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
              Personalizar
            </p>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              Moldura do Avatar
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
              fontSize: '1.1rem', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Grid */}
        <div style={{
          overflowY: 'auto',
          padding: '20px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}>
          {frames.map(f => {
            const isActive = f.minLevel === currentMinLevel
            return (
              <div
                key={f.minLevel}
                onClick={() => f.unlocked ? onSelect(f.minLevel) : undefined}
                style={{
                  borderRadius: 12,
                  border: isActive
                    ? '1.5px solid rgba(167,139,250,0.8)'
                    : '1px solid rgba(255,255,255,0.07)',
                  background: isActive
                    ? 'rgba(124,58,237,0.12)'
                    : 'rgba(255,255,255,0.025)',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: f.unlocked ? 'pointer' : 'not-allowed',
                  opacity: f.unlocked ? 1 : 0.45,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 0 12px rgba(124,58,237,0.3)' : 'none',
                  position: 'relative',
                }}
              >
                {/* Ring preview */}
                <RingPreview frame={f} size={44} />

                {/* Frame title */}
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                  textAlign: 'center',
                }}>
                  {f.title}
                </span>

                {/* Level requirement */}
                <span style={{
                  fontSize: '0.6rem',
                  color: f.unlocked ? 'rgba(255,255,255,0.3)' : 'rgba(255,100,100,0.7)',
                  fontWeight: 600,
                }}>
                  Nível {f.minLevel}
                </span>

                {/* Lock icon */}
                {!f.unlocked && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    fontSize: '0.7rem',
                  }}>🔒</div>
                )}

                {/* Active check */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#a78bfa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.55rem', color: '#fff', fontWeight: 900,
                  }}>✓</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid rgba(124,58,237,0.1)',
          flexShrink: 0,
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
            Molduras desbloqueadas conforme você sobe de nível
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AvatarFrame({
  avatarUrl,
  displayName,
  initials,
  level,
  size = 96,
  selectable = true,
}: AvatarFrameProps) {
  // Read saved preference from localStorage
  const [selectedMinLevel, setSelectedMinLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LS_KEY)
      if (saved !== null) {
        const n = parseInt(saved, 10)
        if (!isNaN(n)) return n
      }
    }
    return -1  // -1 = use level-based default
  })
  const [modalOpen, setModalOpen] = useState(false)

  // Clamp stored frame to only unlocked levels
  const activeFrame = (() => {
    if (selectedMinLevel >= 1) {
      const frames = getAllUnlockedFrames(level)
      const found = frames.find(f => f.minLevel === selectedMinLevel && f.unlocked)
      if (found) return found
    }
    return getFrameForLevel(level)
  })()

  function handleSelect(minLevel: number) {
    setSelectedMinLevel(minLevel)
    localStorage.setItem(LS_KEY, String(minLevel))
    setModalOpen(false)
  }

  const hasAvatar = Boolean(avatarUrl?.trim())
  const pad = activeFrame.padding

  // Scale padding for smaller sizes
  const scaledPad = Math.max(2, Math.round(pad * (size / 96)))

  // Font size for initials
  const initialsSize = size * 0.28

  return (
    <>
      {activeFrame.animationCSS && <style>{activeFrame.animationCSS}</style>}

      {/* Outer ring wrapper */}
      <div
        onClick={selectable ? () => setModalOpen(true) : undefined}
        title={selectable ? 'Alterar moldura' : undefined}
        style={{
          position: 'relative',
          width: size + scaledPad * 2,
          height: size + scaledPad * 2,
          borderRadius: '50%',
          flexShrink: 0,
          cursor: selectable ? 'pointer' : 'default',
          ...activeFrame.styles,
        }}
      >
        {/* Dark gap + avatar content */}
        <div style={{
          position: 'absolute',
          inset: scaledPad,
          borderRadius: '50%',
          background: '#0a0a0f',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {hasAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl!}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: initialsSize,
              fontWeight: 900,
              color: '#fff',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            }}>
              {initials}
            </div>
          )}
        </div>

        {/* Clickable camera hint for selectable */}
        {selectable && (
          <div
            className="af-hover-hint"
            style={{
              position: 'absolute',
              inset: scaledPad,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.18s ease',
              fontSize: `${size * 0.16}px`,
              zIndex: 2,
            }}
          >
            🖼
          </div>
        )}
      </div>

      {/* CSS for hover hint */}
      {selectable && (
        <style>{`
          .af-hover-hint { opacity: 0 !important; }
          div:hover > .af-hover-hint { opacity: 1 !important; }
        `}</style>
      )}

      {/* Frame selector modal */}
      {modalOpen && (
        <FrameModal
          level={level}
          currentMinLevel={selectedMinLevel >= 1 ? selectedMinLevel : activeFrame.minLevel}
          onSelect={handleSelect}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
