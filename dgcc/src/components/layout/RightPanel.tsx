import { useAppStore, xpToNextLevel } from '../../store/useAppStore'
import { StatBox } from '../ui/StatBox'
import { ArcButton } from '../ui/ArcButton'

const mockEvents = [
  { time: '09:00', title: 'Morning Standup', color: 'var(--teal)' },
  { time: '12:30', title: 'Lunch Break', color: 'var(--blue)' },
  { time: '15:00', title: 'Code Review', color: 'var(--amber)' },
]

export function RightPanel() {
  const profile = useAppStore((s) => s.profile)
  const addXp = useAppStore((s) => s.addXp)
  const setProfile = useAppStore((s) => s.setProfile)

  const handleDailyBonus = () => {
    if (profile.dailyBonusClaimed) return
    addXp(50, 'daily_bonus')
    setProfile({ dailyBonusClaimed: true })
  }

  const max = xpToNextLevel(profile.currentLevel)

  return (
    <div className="w-[230px] bg-[var(--surf)] border-l border-[var(--b0)] flex flex-col shrink-0 overflow-y-auto">
      {/* Sitrep */}
      <div className="p-3 border-b border-[var(--b0)]">
        <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] mb-2">// SITREP</div>
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="XP" value={`${profile.currentXp}/${max}`} accent="teal" />
          <StatBox label="Pending" value={3} accent="amber" />
        </div>
      </div>

      {/* Streak */}
      <div className="p-3 border-b border-[var(--b0)] text-center">
        <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] mb-1">// STREAK</div>
        <div className="font-mono text-4xl font-bold text-[var(--amber)]">{profile.streakDays}</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--amber-dim)]">DAYS</div>
      </div>

      {/* Daily XP target */}
      <div className="p-3 border-b border-[var(--b0)]">
        <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] mb-2">// DAILY TARGET</div>
        <div className="h-2 bg-[var(--panel2)] border border-[var(--b0)] clip-badge overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--amber-dim)] to-[var(--amber)]" style={{ width: '50%' }} />
        </div>
        <div className="font-mono text-xs text-[var(--amber-dim)] mt-1 text-right">50 / 100 XP</div>
      </div>

      {/* Incoming events */}
      <div className="p-3 border-b border-[var(--b0)]">
        <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] mb-2">// INCOMING</div>
        <div className="flex flex-col gap-1.5">
          {mockEvents.map((e, i) => (
            <div key={i} className="flex items-center gap-2 bg-[var(--panel2)] px-2 py-1.5 border-l-2" style={{ borderColor: e.color }}>
              <span className="font-mono text-[10px] text-[var(--text-dim)]">{e.time}</span>
              <span className="text-xs text-[var(--text)] truncate">{e.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily bonus */}
      <div className="p-3">
        <ArcButton
          variant="amber"
          className="w-full text-center"
          onClick={handleDailyBonus}
          disabled={profile.dailyBonusClaimed}
        >
          {profile.dailyBonusClaimed ? '// BONUS CLAIMED' : '// CLAIM DAILY BONUS'}
        </ArcButton>
        {!profile.dailyBonusClaimed && (
          <div className="font-mono text-[10px] text-[var(--amber-dim)] text-center mt-1">+50 XP</div>
        )}
      </div>
    </div>
  )
}
