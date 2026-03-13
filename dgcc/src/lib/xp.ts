/**
 * XP required for a specific level transition.
 * Level N requires N * 200 XP to advance to Level N+1.
 */
export function xpToNextLevel(level: number): number {
  return level * 200
}

/**
 * Total XP required to reach a given level from level 1.
 */
export function totalXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += i * 200
  }
  return total
}

/**
 * Given total lifetime XP, calculate current level and XP within that level.
 */
export function calculateLevelFromTotalXp(totalXp: number): {
  level: number
  currentXp: number
  xpNeeded: number
} {
  let level = 1
  let remaining = totalXp

  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level)
    level++
  }

  return {
    level,
    currentXp: remaining,
    xpNeeded: xpToNextLevel(level),
  }
}

const RANK_NAMES: Record<number, string> = {
  1: 'Recruit',
  2: 'Field Agent',
  3: 'Operator',
  4: 'Field Operator',
  5: 'Senior Operator',
  6: 'Specialist',
  7: 'Elite',
  8: 'Veteran',
  9: 'Commander',
  10: 'Arc Raider',
}

export function getRankName(level: number): string {
  if (level >= 11) return 'Legendary Arc Raider'
  return RANK_NAMES[level] || 'Recruit'
}

/**
 * Streak milestone bonus XP values.
 */
export const STREAK_MILESTONES: Record<number, number> = {
  7: 50,
  14: 100,
  30: 200,
  60: 350,
  100: 500,
}

export function getStreakMilestoneBonus(streakDays: number): number | null {
  return STREAK_MILESTONES[streakDays] ?? null
}
