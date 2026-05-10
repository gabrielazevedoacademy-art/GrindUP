export type CoverDef = {
  id: string
  name: string
  description: string
  isPremium: boolean
  css: string       // FULL CSS string: @keyframes + .cover-{id} { ... }
  className: string // just the class name: 'cover-aurora', etc.
}

export const COVERS: CoverDef[] = [
  // ──────────────────────────────────────────
  // 1. AURORA (free)
  // ──────────────────────────────────────────
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Gradiente cíclico roxo-índigo-teal flutuando suavemente',
    isPremium: false,
    className: 'cover-aurora',
    css: `
@keyframes aurora {
  0%   { background-position: 0% 50%; }
  25%  { background-position: 50% 100%; }
  50%  { background-position: 100% 50%; }
  75%  { background-position: 50% 0%; }
  100% { background-position: 0% 50%; }
}
.cover-aurora {
  background: linear-gradient(135deg, #1a0533, #2d1b4e, #0d2d4e, #0d4a4e, #1a3a4e, #2d1b4e, #1a0533);
  background-size: 400% 400%;
  animation: aurora 8s ease-in-out infinite;
}
`.trim(),
  },

  // ──────────────────────────────────────────
  // 2. PLASMA (free)
  // ──────────────────────────────────────────
  {
    id: 'plasma',
    name: 'Plasma',
    description: 'Bolhas de energia roxa e rosa pulsando no escuro',
    isPremium: false,
    className: 'cover-plasma',
    css: `
@keyframes plasmaShift {
  0%   { background-position: 20% 50%, 80% 20%, 50% 80%; }
  33%  { background-position: 35% 30%, 65% 70%, 20% 50%; }
  66%  { background-position: 70% 60%, 30% 40%, 80% 20%; }
  100% { background-position: 20% 50%, 80% 20%, 50% 80%; }
}
@keyframes plasmaGlow {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}
.cover-plasma {
  background:
    radial-gradient(ellipse 55% 55% at 20% 50%, rgba(168,85,247,0.55) 0%, transparent 70%),
    radial-gradient(ellipse 45% 45% at 80% 20%, rgba(236,72,153,0.45) 0%, transparent 65%),
    radial-gradient(ellipse 40% 40% at 50% 80%, rgba(139,92,246,0.40) 0%, transparent 60%),
    #0d0014;
  background-size: 200% 200%, 200% 200%, 200% 200%, 100% 100%;
  animation: plasmaShift 6s ease-in-out infinite, plasmaGlow 4s ease-in-out infinite;
}
`.trim(),
  },

  // ──────────────────────────────────────────
  // 3. MATRIX (free)
  // ──────────────────────────────────────────
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Chuva verde digital descendo em loop',
    isPremium: false,
    className: 'cover-matrix',
    css: `
@keyframes matrixRain {
  0%   { background-position: 0 0, 0 0, 0 0; }
  100% { background-position: 0 0, 0 200px, 0 400px; }
}
@keyframes matrixPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.75; }
}
.cover-matrix {
  background-color: #000;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,255,70,0.04) 2px,
      rgba(0,255,70,0.04) 4px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 18px,
      rgba(0,255,70,0.12) 18px,
      rgba(0,255,70,0.12) 20px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 38px,
      rgba(0,255,100,0.22) 38px,
      rgba(0,255,100,0.22) 40px
    );
  background-size: 100% 4px, 100% 20px, 100% 40px;
  animation: matrixRain 2s linear infinite, matrixPulse 4s ease-in-out infinite;
}
`.trim(),
  },

  // ──────────────────────────────────────────
  // 4. INFERNO (free)
  // ──────────────────────────────────────────
  {
    id: 'inferno',
    name: 'Inferno',
    description: 'Chamas laranja e vermelho girando em loop ardente',
    isPremium: false,
    className: 'cover-inferno',
    css: `
@keyframes inferno {
  0%   { background-position: 0% 50%; }
  25%  { background-position: 100% 0%; }
  50%  { background-position: 100% 100%; }
  75%  { background-position: 0% 100%; }
  100% { background-position: 0% 50%; }
}
@keyframes infernoGlow {
  0%, 100% { filter: brightness(1) saturate(1.1); }
  50%       { filter: brightness(1.15) saturate(1.3); }
}
.cover-inferno {
  background: linear-gradient(
    135deg,
    #1a0000, #7c1200, #b84500, #e05e00,
    #f59e0b, #ea580c, #b91c1c, #7c1200, #1a0000
  );
  background-size: 400% 400%;
  animation: inferno 7s ease-in-out infinite, infernoGlow 3.5s ease-in-out infinite;
}
`.trim(),
  },

  // ──────────────────────────────────────────
  // 5. OCEANO (free)
  // ──────────────────────────────────────────
  {
    id: 'oceano',
    name: 'Oceano',
    description: 'Ondas azuis profundas deslizando horizontalmente',
    isPremium: false,
    className: 'cover-oceano',
    css: `
@keyframes oceanoWave {
  0%   { background-position: 0% 50%, 100% 50%, 0% 50%; }
  33%  { background-position: 50% 30%, 50% 70%, 100% 50%; }
  66%  { background-position: 100% 50%, 0% 50%, 50% 30%; }
  100% { background-position: 0% 50%, 100% 50%, 0% 50%; }
}
@keyframes oceanoBreath {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.8; }
}
.cover-oceano {
  background:
    radial-gradient(ellipse 70% 50% at 0% 50%, rgba(6,182,212,0.35) 0%, transparent 65%),
    radial-gradient(ellipse 60% 60% at 100% 50%, rgba(14,165,233,0.3) 0%, transparent 60%),
    linear-gradient(180deg, #020b1a 0%, #0c2a4a 40%, #0a3d5c 70%, #042b44 100%);
  background-size: 200% 200%, 200% 200%, 100% 100%;
  animation: oceanoWave 8s ease-in-out infinite, oceanoBreath 5s ease-in-out infinite;
}
`.trim(),
  },

  // ──────────────────────────────────────────
  // 6. GALÁXIA (free)
  // ──────────────────────────────────────────
  {
    id: 'galaxia',
    name: 'Galáxia',
    description: 'Nebulosa roxo-violeta girando lentamente no espaço',
    isPremium: false,
    className: 'cover-galaxia',
    css: `
@keyframes galaxiaOrbit {
  0%   { background-position: 20% 50%, 80% 50%, 50% 20%; }
  25%  { background-position: 80% 20%, 20% 80%, 80% 50%; }
  50%  { background-position: 80% 80%, 20% 20%, 50% 80%; }
  75%  { background-position: 20% 80%, 80% 20%, 20% 50%; }
  100% { background-position: 20% 50%, 80% 50%, 50% 20%; }
}
@keyframes galaxiaTwinkle {
  0%, 100% { opacity: 1; }
  40%       { opacity: 0.6; }
  70%       { opacity: 0.85; }
}
.cover-galaxia {
  background:
    radial-gradient(ellipse 45% 55% at 20% 50%, rgba(139,92,246,0.5) 0%, transparent 65%),
    radial-gradient(ellipse 40% 40% at 80% 50%, rgba(167,139,250,0.3) 0%, transparent 60%),
    radial-gradient(ellipse 30% 30% at 50% 20%, rgba(196,181,253,0.2) 0%, transparent 55%),
    #02000a;
  background-size: 200% 200%, 200% 200%, 200% 200%, 100% 100%;
  animation: galaxiaOrbit 12s ease-in-out infinite, galaxiaTwinkle 6s ease-in-out infinite;
}
`.trim(),
  },

  // ──────────────────────────────────────────
  // 7. DOURADO (elite)
  // ──────────────────────────────────────────
  {
    id: 'dourado',
    name: 'Dourado',
    description: 'Shimmer dourado premium com brilho diagonal varrendo',
    isPremium: true,
    className: 'cover-dourado',
    css: `
@keyframes douradoSweep {
  0%   { background-position: 0% 50%, -100% 50%; }
  50%  { background-position: 100% 50%, 200% 50%; }
  100% { background-position: 0% 50%, -100% 50%; }
}
@keyframes douradoGlow {
  0%, 100% { filter: brightness(1) saturate(1.2); }
  50%       { filter: brightness(1.2) saturate(1.5); }
}
.cover-dourado {
  background:
    linear-gradient(
      105deg,
      transparent 30%,
      rgba(251,191,36,0.45) 50%,
      rgba(253,230,138,0.6) 55%,
      rgba(251,191,36,0.45) 60%,
      transparent 70%
    ),
    linear-gradient(
      135deg,
      #78350f, #92400e, #b45309, #d97706,
      #fbbf24, #d97706, #b45309, #92400e, #78350f
    );
  background-size: 300% 100%, 300% 300%;
  animation: douradoSweep 4s ease-in-out infinite, douradoGlow 4s ease-in-out infinite;
}
`.trim(),
  },

  // ──────────────────────────────────────────
  // 8. CRIMSON (elite)
  // ──────────────────────────────────────────
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Vermelho profundo pulsando como um coração de energia',
    isPremium: true,
    className: 'cover-crimson',
    css: `
@keyframes crimsonPulse {
  0%, 100% {
    background-size: 100% 100%, 140% 140%;
    filter: brightness(1) saturate(1.1);
  }
  50% {
    background-size: 100% 100%, 180% 180%;
    filter: brightness(1.2) saturate(1.4);
  }
}
@keyframes crimsonFlicker {
  0%, 90%, 100% { opacity: 1; }
  93%            { opacity: 0.85; }
  96%            { opacity: 0.95; }
}
.cover-crimson {
  background:
    radial-gradient(circle at 50% 50%, rgba(220,38,38,0.9) 0%, rgba(153,27,27,0.75) 40%, rgba(69,10,10,1) 100%),
    radial-gradient(circle at 50% 50%, rgba(239,68,68,0.4) 0%, transparent 70%);
  background-size: 100% 100%, 140% 140%;
  background-position: center, center;
  animation: crimsonPulse 3s ease-in-out infinite, crimsonFlicker 8s ease-in-out infinite;
}
`.trim(),
  },

  // ──────────────────────────────────────────
  // 9. VOID (elite)
  // ──────────────────────────────────────────
  {
    id: 'void',
    name: 'Void',
    description: 'Espaço negro com estrelas piscando em diferentes ritmos',
    isPremium: true,
    className: 'cover-void',
    css: `
@keyframes voidStars {
  0%   { background-position:
    10% 20%, 85% 15%, 45% 75%, 70% 45%, 25% 60%, 60% 85%,
    0 0; }
  50%  { background-position:
    10% 20%, 85% 15%, 45% 75%, 70% 45%, 25% 60%, 60% 85%,
    0 0; }
  100% { background-position:
    10% 20%, 85% 15%, 45% 75%, 70% 45%, 25% 60%, 60% 85%,
    0 0; }
}
@keyframes voidPulse1 {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.1; }
}
@keyframes voidPulse2 {
  0%, 30%, 100% { opacity: 0.2; }
  65%            { opacity: 1; }
}
@keyframes voidPulse3 {
  0%, 60%, 100% { opacity: 0.8; }
  30%            { opacity: 0.05; }
}
.cover-void {
  background:
    radial-gradient(circle 2px at 10% 20%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(circle 1.5px at 85% 15%, rgba(200,200,255,0.85) 0%, transparent 100%),
    radial-gradient(circle 2.5px at 45% 75%, rgba(255,255,255,0.7) 0%, transparent 100%),
    radial-gradient(circle 1px at 70% 45%, rgba(220,220,255,0.95) 0%, transparent 100%),
    radial-gradient(circle 2px at 25% 60%, rgba(255,255,255,0.8) 0%, transparent 100%),
    radial-gradient(circle 1.5px at 60% 85%, rgba(200,220,255,0.75) 0%, transparent 100%),
    #000005;
  background-size:
    100% 100%, 100% 100%, 100% 100%,
    100% 100%, 100% 100%, 100% 100%,
    100% 100%;
  animation:
    voidPulse1 3.1s ease-in-out infinite,
    voidPulse2 4.7s ease-in-out infinite 1.2s,
    voidPulse3 2.8s ease-in-out infinite 0.6s;
}
`.trim(),
  },

  // ──────────────────────────────────────────
  // 10. GLITCH (elite)
  // ──────────────────────────────────────────
  {
    id: 'glitch',
    name: 'Glitch',
    description: 'Distorção digital com mudança de matiz e tremor RGB',
    isPremium: true,
    className: 'cover-glitch',
    css: `
@keyframes glitchHue {
  0%   { filter: hue-rotate(0deg)   saturate(1.4) brightness(1); }
  20%  { filter: hue-rotate(15deg)  saturate(1.8) brightness(1.1); }
  21%  { filter: hue-rotate(-30deg) saturate(2.2) brightness(1.3); }
  22%  { filter: hue-rotate(15deg)  saturate(1.8) brightness(1.1); }
  40%  { filter: hue-rotate(60deg)  saturate(1.5) brightness(1); }
  60%  { filter: hue-rotate(90deg)  saturate(1.6) brightness(1.05); }
  61%  { filter: hue-rotate(-20deg) saturate(2.0) brightness(1.2); }
  62%  { filter: hue-rotate(90deg)  saturate(1.6) brightness(1.05); }
  80%  { filter: hue-rotate(180deg) saturate(1.4) brightness(1); }
  100% { filter: hue-rotate(360deg) saturate(1.4) brightness(1); }
}
@keyframes glitchShake {
  0%, 89%, 100% { transform: translateX(0); }
  90%            { transform: translateX(-3px); }
  92%            { transform: translateX(3px); }
  94%            { transform: translateX(-2px); }
  96%            { transform: translateX(2px); }
  98%            { transform: translateX(0); }
}
.cover-glitch {
  background: linear-gradient(
    135deg,
    #0a001a 0%, #1a0040 20%, #0d1a3e 35%,
    #001a2e 50%, #0a2e1a 65%, #1a003e 80%, #0a001a 100%
  );
  background-size: 200% 200%;
  animation: glitchHue 6s linear infinite, glitchShake 9s ease-in-out infinite;
}
`.trim(),
  },
]

// ──────────────────────────────────────────────────────────
// Derived exports
// ──────────────────────────────────────────────────────────

export const ALL_COVERS_CSS: string = COVERS.map(c => c.css).join('\n\n')

export function getCoverById(id: string): CoverDef | undefined {
  return COVERS.find(c => c.id === id)
}

export const FREE_COVER_IDS = ['aurora', 'plasma', 'matrix', 'inferno', 'oceano', 'galaxia']
export const ELITE_COVER_IDS = ['dourado', 'crimson', 'void', 'glitch']
