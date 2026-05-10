export const MAX_LEVEL = 100

// XP acumulado para atingir cada nível (índice = nível - 1)
// LEVEL_THRESHOLDS[0] = 0 → nível 1 começa em 0 XP
// LEVEL_THRESHOLDS[1] = 500 → nível 2 começa em 500 XP, etc.
function buildThresholds(): readonly number[] {
  const increments: number[] = [
    500, 800, 1200, 1800, 2500,   // níveis 1→2, 2→3, 3→4, 4→5, 5→6
    ...Array(5).fill(3000),        // níveis 6→7 … 10→11
    ...Array(10).fill(4000),       // níveis 11→12 … 20→21
    ...Array(10).fill(5500),       // níveis 21→22 … 30→31
    ...Array(10).fill(7000),       // níveis 31→32 … 40→41
    ...Array(10).fill(9000),       // níveis 41→42 … 50→51
    ...Array(10).fill(11000),      // níveis 51→52 … 60→61
    ...Array(10).fill(14000),      // níveis 61→62 … 70→71
    ...Array(10).fill(17000),      // níveis 71→72 … 80→81
    ...Array(10).fill(21000),      // níveis 81→82 … 90→91
    ...Array(9).fill(25000),       // níveis 91→92 … 99→100
  ] // 99 incrementos → 100 thresholds (níveis 1..100)

  const t = [0]
  for (const inc of increments) t.push(t[t.length - 1] + inc)
  return t
}

export const LEVEL_THRESHOLDS: readonly number[] = buildThresholds()

export function getLevelFromXP(xp: number): number {
  const safeXp = Math.max(0, xp)
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safeXp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getXPForNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  return LEVEL_THRESHOLDS[level] // LEVEL_THRESHOLDS[level] = threshold do próximo nível (level+1)
}

export function getXPProgress(xp: number): { current: number; needed: number; percentage: number } {
  const safeXp = Math.max(0, xp)
  const level = getLevelFromXP(safeXp)
  if (level >= MAX_LEVEL) return { current: safeXp, needed: safeXp, percentage: 100 }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1]
  const nextThreshold    = LEVEL_THRESHOLDS[level]
  const current    = safeXp - currentThreshold
  const needed     = nextThreshold - currentThreshold
  const percentage = Math.min((current / needed) * 100, 100)
  return { current, needed, percentage }
}
