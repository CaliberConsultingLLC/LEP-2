export interface Reward {
  id: string
  title: string
  cost: number
  color: 'teal' | 'amber' | 'blue'
}

const colorMap = {
  teal: { accent: 'var(--teal)', dim: 'var(--teal-dim)', deep: 'var(--teal-deep)' },
  amber: { accent: 'var(--amber)', dim: 'var(--amber-dim)', deep: 'var(--amber-deep)' },
  blue: { accent: 'var(--blue)', dim: 'var(--blue-dim)', deep: 'var(--blue-deep)' },
}

interface Props {
  reward: Reward
  canAfford: boolean
  onClaim: (r: Reward) => void
}

export function RewardCard({ reward, canAfford, onClaim }: Props) {
  const c = colorMap[reward.color]

  return (
    <button
      onClick={() => canAfford && onClaim(reward)}
      disabled={!canAfford}
      className={`clip-card border pl-5 pr-4 py-3 text-left transition-all relative ${
        canAfford ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-30 cursor-not-allowed'
      }`}
      style={{
        background: 'var(--panel2)',
        borderColor: canAfford ? c.dim : 'var(--b0)',
      }}
    >
      {/* Top accent line */}
      {canAfford && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.dim}, transparent)` }}
        />
      )}
      <div className="text-sm font-semibold text-[var(--text-hi)] tracking-wider mb-1">{reward.title}</div>
      <div className="font-mono text-xs" style={{ color: c.accent }}>{reward.cost} XP</div>
      <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: canAfford ? c.accent : 'var(--text-dim)' }}>
        {canAfford ? 'AVAILABLE' : 'LOCKED'}
      </div>
    </button>
  )
}
