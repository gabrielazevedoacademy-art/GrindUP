'use client'

import { useState } from 'react'
import { getBadgeForLevel } from '@/lib/badges'

interface LevelBadgeProps {
  level: number
  className?: string
}

export default function LevelBadge({ level, className }: LevelBadgeProps) {
  const [hovered, setHovered] = useState(false)
  const badge = getBadgeForLevel(level)

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {badge.animationCSS && <style>{badge.animationCSS}</style>}

      <span
        className={className}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 999,
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'default',
          userSelect: 'none',
          ...badge.styles,
        }}
      >
        {/* Level number pip */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          fontSize: '0.6rem',
          fontWeight: 900,
          flexShrink: 0,
        }}>
          {level}
        </span>
        {badge.title}
      </span>

      {/* Tooltip */}
      {hovered && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15,10,26,0.96)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(124,58,237,0.35)',
          borderRadius: 8,
          padding: '5px 10px',
          fontSize: '0.72rem',
          fontWeight: 500,
          color: '#fff',
          whiteSpace: 'nowrap',
          zIndex: 50,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          Nível {level} — {badge.title}
        </span>
      )}
    </span>
  )
}
