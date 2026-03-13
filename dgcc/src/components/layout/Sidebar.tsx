import { useAppStore, type TabId } from '../../store/useAppStore'

const navItems: { id: TabId; icon: string; label: string; color: string }[] = [
  { id: 'operations', icon: '◈', label: 'Operations', color: 'var(--teal)' },
  { id: 'protocols', icon: '◉', label: 'Protocols', color: 'var(--green)' },
  { id: 'rewards', icon: '◇', label: 'Reward Vault', color: 'var(--amber)' },
  { id: 'intel', icon: '▦', label: 'Intel Feed', color: 'var(--blue)' },
  { id: 'stats', icon: '▲', label: 'Stats', color: 'var(--blue)' },
]

export function Sidebar() {
  const active = useAppStore((s) => s.activeTab)
  const setActive = useAppStore((s) => s.setActiveTab)
  const profile = useAppStore((s) => s.profile)

  return (
    <div className="w-[210px] bg-[var(--surf)] border-r border-[var(--b0)] flex flex-col shrink-0">
      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 relative"
              style={{
                borderLeft: `2px solid ${isActive ? item.color : 'transparent'}`,
                background: isActive ? 'rgba(0,200,180,0.05)' : 'transparent',
                color: isActive ? item.color : 'var(--text-dim)',
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-sm font-semibold tracking-wider uppercase">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Operator footer */}
      <div className="border-t border-[var(--b0)] p-3 flex items-center gap-3">
        <div className="w-8 h-8 clip-badge bg-[var(--panel2)] border border-[var(--b1)] flex items-center justify-center">
          <span className="text-xs font-bold text-[var(--teal)]">D</span>
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--text-hi)] tracking-wider">{profile.displayName}</div>
          <div className="text-[9px] text-[var(--text-dim)] tracking-wider">// {profile.rankName}</div>
        </div>
      </div>
    </div>
  )
}
