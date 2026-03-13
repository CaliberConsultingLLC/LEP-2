import { create } from 'zustand'

export type TabId = 'operations' | 'protocols' | 'rewards' | 'intel' | 'stats'

export interface XPToast {
  id: string
  amount: number
  source: string
  timestamp: number
}

export interface UserProfile {
  displayName: string
  currentXp: number
  totalXp: number
  currentLevel: number
  rankName: string
  streakDays: number
  dailyBonusClaimed: boolean
}

interface AppState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void

  profile: UserProfile
  setProfile: (p: Partial<UserProfile>) => void

  xpToasts: XPToast[]
  addXpToast: (amount: number, source: string) => void
  removeXpToast: (id: string) => void

  showLevelUp: boolean
  levelUpData: { level: number; rank: string } | null
  triggerLevelUp: (level: number, rank: string) => void
  dismissLevelUp: () => void

  // XP helpers
  addXp: (amount: number, source: string) => void
  spendXp: (amount: number) => boolean
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

export function xpForLevel(level: number): number {
  // Total XP needed to reach this level
  let total = 0
  for (let i = 1; i < level; i++) {
    total += i * 200
  }
  return total
}

export function xpToNextLevel(level: number): number {
  return level * 200
}

export function getRankName(level: number): string {
  if (level >= 11) return 'Legendary Arc Raider'
  return RANK_NAMES[level] || 'Recruit'
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'operations',
  setActiveTab: (tab) => set({ activeTab: tab }),

  profile: {
    displayName: 'DUSTIN',
    currentXp: 150,
    totalXp: 350,
    currentLevel: 2,
    rankName: 'Field Agent',
    streakDays: 5,
    dailyBonusClaimed: false,
  },
  setProfile: (p) =>
    set((s) => ({ profile: { ...s.profile, ...p } })),

  xpToasts: [],
  addXpToast: (amount, source) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({
      xpToasts: [...s.xpToasts, { id, amount, source, timestamp: Date.now() }],
    }))
    setTimeout(() => get().removeXpToast(id), 2200)
  },
  removeXpToast: (id) =>
    set((s) => ({ xpToasts: s.xpToasts.filter((t) => t.id !== id) })),

  showLevelUp: false,
  levelUpData: null,
  triggerLevelUp: (level, rank) =>
    set({ showLevelUp: true, levelUpData: { level, rank } }),
  dismissLevelUp: () =>
    set({ showLevelUp: false, levelUpData: null }),

  addXp: (amount, source) => {
    const { profile, addXpToast, triggerLevelUp } = get()
    let newXp = profile.currentXp + amount
    let newTotal = profile.totalXp + amount
    let newLevel = profile.currentLevel
    let newRank = profile.rankName

    // Check level ups
    while (newXp >= xpToNextLevel(newLevel)) {
      newXp -= xpToNextLevel(newLevel)
      newLevel++
      newRank = getRankName(newLevel)
      setTimeout(() => triggerLevelUp(newLevel, newRank), 300)
    }

    set({
      profile: {
        ...profile,
        currentXp: newXp,
        totalXp: newTotal,
        currentLevel: newLevel,
        rankName: newRank,
      },
    })
    addXpToast(amount, source)
  },

  spendXp: (amount) => {
    const { profile, addXpToast } = get()
    if (profile.totalXp < amount) return false
    set({
      profile: {
        ...profile,
        totalXp: profile.totalXp - amount,
      },
    })
    addXpToast(-amount, 'reward_spend')
    return true
  },
}))
