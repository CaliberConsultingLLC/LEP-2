import { motion } from 'framer-motion'
import { useAppStore, xpToNextLevel } from '../../store/useAppStore'

export function XPStrip() {
  const profile = useAppStore((s) => s.profile)
  const max = xpToNextLevel(profile.currentLevel)
  const pct = Math.min((profile.currentXp / max) * 100, 100)

  // Daily target (mock: 50% for now)
  const dailyPct = 50

  return (
    <div className="h-[52px] bg-[var(--surf)] border-b border-[var(--b0)] flex items-center px-4 gap-4">
      {/* Level badge */}
      <div className="clip-badge bg-[var(--amber-deep)] border border-[var(--amber-dim)] px-3 py-1 flex items-center gap-1 shrink-0">
        <span className="text-[9px] uppercase tracking-wider text-[var(--amber-dim)]">LVL</span>
        <span className="font-mono text-lg font-bold text-[var(--amber)]">
          {String(profile.currentLevel).padStart(2, '0')}
        </span>
      </div>

      {/* XP Bar */}
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 h-4 bg-[var(--panel2)] border border-[var(--b0)] clip-badge overflow-hidden relative xp-bar-glow">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--teal-dim)] to-[var(--teal)] relative"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          >
            {/* Leading bright edge */}
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-[var(--teal-hi)]" />
          </motion.div>
        </div>

        {/* XP text */}
        <div className="font-mono text-xs text-[var(--text)] shrink-0">
          <span className="text-[var(--teal)]">{profile.currentXp}</span>
          <span className="text-[var(--text-dim)]"> / {max}</span>
        </div>
      </div>

      {/* Rank */}
      <div className="text-center shrink-0 px-3">
        <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)]">RANK</div>
        <div className="text-xs font-semibold text-[var(--text-hi)] uppercase tracking-wider">{profile.rankName}</div>
      </div>

      {/* Total XP */}
      <div className="font-mono text-xs text-[var(--text-dim)] shrink-0">
        <span className="text-[var(--teal-dim)]">{profile.totalXp}</span> XP TOTAL
      </div>

      {/* Daily target */}
      <div className="shrink-0 flex items-center gap-2">
        <div className="text-[9px] uppercase tracking-wider text-[var(--amber-dim)]">DAILY</div>
        <div className="font-mono text-sm font-bold text-[var(--amber)]">{dailyPct}%</div>
      </div>
    </div>
  )
}
