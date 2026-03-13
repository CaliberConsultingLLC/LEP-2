import { Panel } from '../ui/Panel'
import { StatBox } from '../ui/StatBox'
import { useAppStore } from '../../store/useAppStore'

export function StatsPanel() {
  const profile = useAppStore((s) => s.profile)

  return (
    <Panel
      accent="blue"
      title="STATS"
      ticker="SYS::ANALYTICS_ENGINE >> DATA_AGGREGATION ACTIVE >> PERFORMANCE_INDEX CALCULATING >> REPORT_GEN ENABLED"
      className="h-full"
    >
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox label="Total XP" value={profile.totalXp} accent="teal" />
        <StatBox label="Level" value={profile.currentLevel} accent="amber" />
        <StatBox label="Rank" value={profile.rankName} accent="blue" />
        <StatBox label="Streak" value={`${profile.streakDays}d`} accent="amber" />
        <StatBox label="Tasks Done" value={12} accent="teal" />
        <StatBox label="Habits Logged" value={34} accent="green" />
      </div>

      {/* Weekly performance mock */}
      <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] mb-2">// WEEKLY PERFORMANCE</div>
      <div className="flex items-end gap-1 h-24 bg-[var(--panel2)] border border-[var(--b0)] p-2">
        {[40, 65, 80, 55, 90, 70, 45].map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm"
              style={{
                height: `${v}%`,
                background: `linear-gradient(to top, var(--teal-dim), var(--teal))`,
              }}
            />
            <span className="font-mono text-[8px] text-[var(--text-dim)]">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
            </span>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] mt-4 mb-2">// MILESTONES</div>
      <div className="flex flex-col gap-1">
        {[
          { label: 'First Task Complete', done: true },
          { label: '7-Day Streak', done: true },
          { label: 'Level 5 Reached', done: false },
          { label: '100 Tasks Complete', done: false },
          { label: 'First Reward Claimed', done: false },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={m.done ? 'text-[var(--green)]' : 'text-[var(--text-dim)]'}>
              {m.done ? '■' : '□'}
            </span>
            <span className={m.done ? 'text-[var(--text-hi)]' : 'text-[var(--text-dim)]'}>
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
