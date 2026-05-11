export const PLAN_LIMITS = {
  free: {
    maxTasksPerDay: 5, maxActiveGoals: 3, maxMonthlyTransactions: 20,
    hasWeeklySummary: false, hasDailyMissions: false,
    maxThemes: 1, hasEliteBadge: false, hasAnimatedAvatar: false, premiumCovers: false,
  },
  pro: {
    maxTasksPerDay: null, maxActiveGoals: null, maxMonthlyTransactions: null,
    hasWeeklySummary: true, hasDailyMissions: true,
    maxThemes: 5, hasEliteBadge: false, hasAnimatedAvatar: false, premiumCovers: false,
  },
  elite: {
    maxTasksPerDay: null, maxActiveGoals: null, maxMonthlyTransactions: null,
    hasWeeklySummary: true, hasDailyMissions: true,
    maxThemes: null, hasEliteBadge: true, hasAnimatedAvatar: true, premiumCovers: true,
  },
}

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
}

export function isLimitReached(plan: string, feature: string, currentCount: number): boolean {
  const limits = getPlanLimits(plan)
  const limit = limits[feature as keyof typeof limits]
  if (limit === null) return false
  if (typeof limit === 'number') return currentCount >= limit
  return false
}
