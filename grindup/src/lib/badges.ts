import type { CSSProperties } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type BadgeDef = {
  minLevel:     number
  title:        string
  styles:       CSSProperties
  animationCSS: string   // @keyframes block(s) to inject; empty string if none
}

export type FrameDef = {
  minLevel:     number
  title:        string
  padding:      number   // ring thickness in px
  styles:       CSSProperties  // applied to the outer ring wrapper div
  animationCSS: string
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE TIERS — sorted descending so find() returns the best match
// ─────────────────────────────────────────────────────────────────────────────
const BADGE_TIERS: BadgeDef[] = [
  // ── MÁXIMO (100) ────────────────────────────────────────────────────────────
  {
    minLevel: 100,
    title: 'MÁXIMO ✦',
    styles: {
      color: '#fff',
      background: 'rgba(0,0,0,0.35)',
      border: '1.5px solid rgba(255,255,255,0.35)',
      animation: 'lb-epic 1.2s linear infinite',
    },
    animationCSS: `
@keyframes lb-epic {
  0%   { filter: hue-rotate(0deg)   drop-shadow(0 0 6px rgba(255,100,200,0.9)); }
  50%  { filter: hue-rotate(180deg) drop-shadow(0 0 14px rgba(100,200,255,0.9)); }
  100% { filter: hue-rotate(360deg) drop-shadow(0 0 6px rgba(255,100,200,0.9)); }
}`,
  },

  // ── Transcendente (90-99) ────────────────────────────────────────────────
  {
    minLevel: 90,
    title: 'Transcendente',
    styles: {
      color: '#fbbf24',
      background: 'rgba(120,53,15,0.25)',
      border: '1.5px solid rgba(251,191,36,0.7)',
      animation: 'lb-thunder 0.9s ease-in-out infinite',
    },
    animationCSS: `
@keyframes lb-thunder {
  0%,100% { box-shadow: 0 0 6px rgba(251,191,36,0.5); }
  20%     { box-shadow: 0 0 18px rgba(255,255,100,1), 0 0 32px rgba(251,191,36,0.6); }
  22%     { box-shadow: 0 0 4px  rgba(251,191,36,0.3); }
  40%     { box-shadow: 0 0 20px rgba(255,220,100,1), 0 0 36px rgba(251,191,36,0.5); }
  42%     { box-shadow: 0 0 6px  rgba(251,191,36,0.4); }
}`,
  },

  // ── Ascendido (75-89) ────────────────────────────────────────────────────
  {
    minLevel: 75,
    title: 'Ascendido',
    styles: {
      color: '#e2e8f0',
      background: 'rgba(148,163,184,0.12)',
      border: '1.5px solid rgba(226,232,240,0.65)',
      animation: 'lb-silver 2.5s ease-in-out infinite',
    },
    animationCSS: `
@keyframes lb-silver {
  0%,100% { box-shadow: 0 0 6px  rgba(226,232,240,0.4); }
  50%     { box-shadow: 0 0 18px rgba(226,232,240,0.9), 0 0 32px rgba(148,163,184,0.5); }
}`,
  },

  // ── Imortal (60-74) ─────────────────────────────────────────────────────
  {
    minLevel: 60,
    title: 'Imortal',
    styles: {
      color: '#fcd34d',
      background: 'rgba(120,53,15,0.2)',
      border: '1.5px solid rgba(252,211,77,0.6)',
      animation: 'lb-sparkle-gold 1.8s ease-in-out infinite',
    },
    animationCSS: `
@keyframes lb-sparkle-gold {
  0%,100% { box-shadow: 0 0 6px  rgba(252,211,77,0.5); filter: brightness(1); }
  50%     { box-shadow: 0 0 18px rgba(252,211,77,0.9), 0 0 30px rgba(251,191,36,0.4);
            filter: brightness(1.25); }
}`,
  },

  // ── Lendário (50-59) ────────────────────────────────────────────────────
  {
    minLevel: 50,
    title: 'Lendário',
    styles: {
      color: '#fff',
      background: 'rgba(30,0,60,0.35)',
      border: '1.5px solid rgba(200,100,255,0.6)',
      animation: 'lb-rainbow 2s linear infinite',
    },
    animationCSS: `
@keyframes lb-rainbow {
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}`,
  },

  // ── Mestre (40-49) ──────────────────────────────────────────────────────
  {
    minLevel: 40,
    title: 'Mestre',
    styles: {
      color: '#fbbf24',
      background: 'rgba(88,28,135,0.25)',
      border: '1.5px solid rgba(167,139,250,0.6)',
      animation: 'lb-gradient-drift 3s ease-in-out infinite',
    },
    animationCSS: `
@keyframes lb-gradient-drift {
  0%,100% { box-shadow: 0 0 8px rgba(167,139,250,0.5); border-color: rgba(167,139,250,0.6); }
  50%     { box-shadow: 0 0 16px rgba(251,191,36,0.7); border-color: rgba(251,191,36,0.7); }
}`,
  },

  // ── Expert (30-39) ──────────────────────────────────────────────────────
  {
    minLevel: 30,
    title: 'Expert',
    styles: {
      color: '#fcd34d',
      background: 'rgba(120,53,15,0.2)',
      border: '1.5px solid rgba(252,211,77,0.55)',
      animation: 'lb-glow-gold 2s ease-in-out infinite',
    },
    animationCSS: `
@keyframes lb-glow-gold {
  0%,100% { box-shadow: 0 0 5px rgba(252,211,77,0.35); }
  50%     { box-shadow: 0 0 14px rgba(252,211,77,0.8), 0 0 24px rgba(251,191,36,0.35); }
}`,
  },

  // ── Veterano (20-29) ────────────────────────────────────────────────────
  {
    minLevel: 20,
    title: 'Veterano',
    styles: {
      color: '#c4b5fd',
      background: 'rgba(88,28,135,0.18)',
      border: '1.5px solid rgba(167,139,250,0.55)',
      animation: 'lb-pulse-purple 2.5s ease-in-out infinite',
    },
    animationCSS: `
@keyframes lb-pulse-purple {
  0%,100% { box-shadow: 0 0 5px rgba(167,139,250,0.3); }
  50%     { box-shadow: 0 0 14px rgba(167,139,250,0.85), 0 0 26px rgba(124,58,237,0.35); }
}`,
  },

  // ── Guerreiro (10-19) ───────────────────────────────────────────────────
  {
    minLevel: 10,
    title: 'Guerreiro',
    styles: {
      color: '#93c5fd',
      background: 'rgba(30,58,138,0.18)',
      border: '1.5px solid rgba(96,165,250,0.55)',
      animation: 'lb-glow-blue 2s ease-in-out infinite',
    },
    animationCSS: `
@keyframes lb-glow-blue {
  0%,100% { box-shadow: 0 0 4px rgba(96,165,250,0.3); }
  50%     { box-shadow: 0 0 12px rgba(96,165,250,0.75), 0 0 20px rgba(59,130,246,0.3); }
}`,
  },

  // ── Aprendiz (5-9) ──────────────────────────────────────────────────────
  {
    minLevel: 5,
    title: 'Aprendiz',
    styles: {
      color: '#fff',
      background: 'transparent',
      border: '1.5px solid rgba(156,163,175,0.45)',
    },
    animationCSS: '',
  },

  // ── Iniciante (1-4) ─────────────────────────────────────────────────────
  {
    minLevel: 1,
    title: 'Iniciante',
    styles: {
      color: '#9ca3af',
      background: 'rgba(55,65,81,0.45)',
      border: '1px solid rgba(75,85,99,0.4)',
    },
    animationCSS: '',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// FRAME TIERS — sorted descending
// ─────────────────────────────────────────────────────────────────────────────
const FRAME_TIERS: FrameDef[] = [
  // ── Nível 100 — moldura épica ────────────────────────────────────────────
  {
    minLevel: 100, title: 'Épica', padding: 4,
    styles: {
      background: 'conic-gradient(#ff0080,#ff8c00,#ffff00,#00ff00,#00ffff,#0080ff,#8000ff,#ff0080)',
      animation: 'af-spin 1s linear infinite, af-epic-glow 0.8s ease-in-out infinite',
    },
    animationCSS: `
@keyframes af-spin  { to { transform: rotate(360deg); } }
@keyframes af-epic-glow {
  0%,100% { filter: brightness(1.1) drop-shadow(0 0 4px rgba(255,100,200,0.45)); }
  50%     { filter: brightness(1.3) drop-shadow(0 0 8px rgba(100,200,255,0.5)); }
}`,
  },

  // ── Nível 90 — portal ───────────────────────────────────────────────────
  {
    minLevel: 90, title: 'Portal', padding: 4,
    styles: {
      background: 'conic-gradient(#7c3aed,#fff,#7c3aed,#4f46e5,#fff,#7c3aed)',
      animation: 'af-portal 0.8s linear infinite',
      filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.45))',
    },
    animationCSS: `
@keyframes af-portal { to { transform: rotate(360deg); } }`,
  },

  // ── Nível 75 — aura prateada ────────────────────────────────────────────
  {
    minLevel: 75, title: 'Aura', padding: 3,
    styles: {
      background: 'linear-gradient(135deg,#94a3b8,#e2e8f0,#64748b,#e2e8f0)',
      animation: 'af-silver-aura 2s ease-in-out infinite',
      filter: 'drop-shadow(0 0 3px rgba(226,232,240,0.35))',
    },
    animationCSS: `
@keyframes af-silver-aura {
  0%,100% { filter: drop-shadow(0 0 3px rgba(226,232,240,0.3)); }
  50%     { filter: drop-shadow(0 0 6px rgba(226,232,240,0.5)) drop-shadow(0 0 3px rgba(148,163,184,0.3)); }
}`,
  },

  // ── Nível 60 — raios elétricos ──────────────────────────────────────────
  {
    minLevel: 60, title: 'Elétrica', padding: 3,
    styles: {
      background: '#1d4ed8',
      animation: 'af-electric 0.6s ease-in-out infinite',
    },
    animationCSS: `
@keyframes af-electric {
  0%,100% { filter: drop-shadow(0 0 2px rgba(59,130,246,0.35)); background: #1d4ed8; }
  15%     { filter: drop-shadow(0 0 6px rgba(147,197,253,0.5)); background: #93c5fd; }
  17%     { filter: drop-shadow(0 0 2px rgba(59,130,246,0.25)); background: #1d4ed8; }
  50%     { filter: drop-shadow(0 0 7px rgba(147,197,253,0.5)); background: #bfdbfe; }
  52%     { filter: drop-shadow(0 0 3px rgba(59,130,246,0.3)); background: #1d4ed8; }
}`,
  },

  // ── Nível 50 — partículas douradas ──────────────────────────────────────
  {
    minLevel: 50, title: 'Partículas', padding: 3,
    styles: {
      background: 'linear-gradient(135deg,#78350f,#d97706,#fbbf24,#d97706,#78350f)',
      animation: 'af-sparkle 1.5s ease-in-out infinite',
    },
    animationCSS: `
@keyframes af-sparkle {
  0%,100% { filter: drop-shadow(0 0 3px rgba(251,191,36,0.35)); }
  33%     { filter: drop-shadow(0 0 6px rgba(252,211,77,0.5)) brightness(1.1); }
  66%     { filter: drop-shadow(0 0 4px rgba(251,191,36,0.4)); }
}`,
  },

  // ── Nível 40 — arco-íris girando ────────────────────────────────────────
  {
    minLevel: 40, title: 'Arco-Íris', padding: 3,
    styles: {
      background: 'conic-gradient(#f43f5e,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6,#f43f5e)',
      animation: 'af-rainbow-spin 3s linear infinite',
    },
    animationCSS: `
@keyframes af-rainbow-spin { to { transform: rotate(360deg); } }`,
  },

  // ── Nível 30 — chamas ───────────────────────────────────────────────────
  {
    minLevel: 30, title: 'Chamas', padding: 3,
    styles: {
      background: 'conic-gradient(#dc2626,#ea580c,#eab308,#ea580c,#dc2626)',
      animation: 'af-fire-spin 2s linear infinite',
      filter: 'drop-shadow(0 0 4px rgba(234,88,12,0.4))',
    },
    animationCSS: `
@keyframes af-fire-spin { to { transform: rotate(360deg); } }`,
  },

  // ── Nível 20 — shimmer dourado ──────────────────────────────────────────
  {
    minLevel: 20, title: 'Dourada', padding: 3,
    styles: {
      background: 'linear-gradient(135deg,#78350f,#d97706,#fbbf24)',
      animation: 'af-gold-pulse 2s ease-in-out infinite',
    },
    animationCSS: `
@keyframes af-gold-pulse {
  0%,100% { box-shadow: 0 0 4px rgba(251,191,36,0.3); }
  50%     { box-shadow: 0 0 8px rgba(251,191,36,0.5), 0 0 4px 2px rgba(234,179,8,0.2); }
}`,
  },

  // ── Nível 10 — degradê azul/roxo animado ────────────────────────────────
  {
    minLevel: 10, title: 'Gradient', padding: 3,
    styles: {
      background: 'linear-gradient(135deg,#3b82f6,#8b5cf6,#3b82f6)',
      backgroundSize: '200% 200%',
      animation: 'af-blue-purple 2s ease-in-out infinite',
    },
    animationCSS: `
@keyframes af-blue-purple {
  0%   { background-position: 0% 50%; box-shadow: 0 0 5px rgba(59,130,246,0.35); }
  50%  { background-position: 100% 50%; box-shadow: 0 0 5px rgba(139,92,246,0.4); }
  100% { background-position: 0% 50%; box-shadow: 0 0 5px rgba(59,130,246,0.35); }
}`,
  },

  // ── Nível 5 — borda azul pulsante ───────────────────────────────────────
  {
    minLevel: 5, title: 'Pulsante', padding: 3,
    styles: {
      background: '#3b82f6',
      animation: 'af-blue-pulse 2s ease-in-out infinite',
    },
    animationCSS: `
@keyframes af-blue-pulse {
  0%,100% { box-shadow: 0 0 4px rgba(59,130,246,0.3); }
  50%     { box-shadow: 0 0 8px rgba(59,130,246,0.5), 0 0 4px 2px rgba(96,165,250,0.2); }
}`,
  },

  // ── Nível 1 — roxo simples ───────────────────────────────────────────────
  {
    minLevel: 1, title: 'Clássica', padding: 3,
    styles: {
      background: '#7c3aed',
      boxShadow: '0 0 6px rgba(124,58,237,0.35)',
    },
    animationCSS: '',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export function getBadgeForLevel(level: number): BadgeDef {
  return BADGE_TIERS.find(t => level >= t.minLevel) ?? BADGE_TIERS[BADGE_TIERS.length - 1]
}

export function getFrameForLevel(level: number): FrameDef {
  return FRAME_TIERS.find(t => level >= t.minLevel) ?? FRAME_TIERS[FRAME_TIERS.length - 1]
}

export function getAllUnlockedFrames(currentLevel: number) {
  return [...FRAME_TIERS]
    .reverse()  // ascending order for the selector UI
    .map(f => ({ ...f, unlocked: currentLevel >= f.minLevel }))
}

export const ALL_BADGE_KEYFRAMES = BADGE_TIERS.map(b => b.animationCSS).join('\n')
export const ALL_FRAME_KEYFRAMES = FRAME_TIERS.map(f => f.animationCSS).join('\n')
