import { useState } from 'react'
import { Panel } from '../ui/Panel'
import { ArcButton } from '../ui/ArcButton'
import { RewardCard, type Reward } from './RewardCard'
import { ClaimModal } from './ClaimModal'
import { AddRewardForm } from './AddRewardForm'
import { useAppStore } from '../../store/useAppStore'

const initialRewards: Reward[] = [
  { id: '1', title: 'Pizza Night', cost: 200, color: 'amber' },
  { id: '2', title: 'Movie Night', cost: 300, color: 'teal' },
  { id: '3', title: 'Amazon $25', cost: 500, color: 'amber' },
  { id: '4', title: 'New Game', cost: 800, color: 'blue' },
  { id: '5', title: 'Day Off', cost: 1200, color: 'teal' },
  { id: '6', title: 'New Gear', cost: 2000, color: 'amber' },
]

export function RewardVault() {
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [claiming, setClaiming] = useState<Reward | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const profile = useAppStore((s) => s.profile)
  const spendXp = useAppStore((s) => s.spendXp)

  const handleClaim = (reward: Reward) => {
    if (profile.totalXp >= reward.cost) {
      setClaiming(reward)
    }
  }

  const confirmClaim = () => {
    if (claiming && spendXp(claiming.cost)) {
      setClaiming(null)
    }
  }

  const handleAdd = (title: string, cost: number) => {
    setRewards((prev) => [...prev, { id: Math.random().toString(36).slice(2), title, cost, color: 'teal' }])
    setShowAdd(false)
  }

  return (
    <Panel
      accent="amber"
      title="REWARD VAULT"
      ticker={`SYS::REWARD_VAULT >> XP_BALANCE VERIFIED >> CLAIM_HISTORY TRACKED >> VAULT_STATUS ACTIVE >> REWARDS_AVAILABLE ${rewards.length}`}
      className="h-full"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="font-mono text-xs text-[var(--amber-dim)]">
          BALANCE: <span className="text-[var(--amber)]">{profile.totalXp} XP</span>
        </div>
        <ArcButton variant="amber" small onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '// CANCEL' : '// ADD REWARD'}
        </ArcButton>
      </div>

      {showAdd && <AddRewardForm onAdd={handleAdd} />}

      <div className="grid grid-cols-2 gap-2">
        {rewards.map((r) => (
          <RewardCard key={r.id} reward={r} canAfford={profile.totalXp >= r.cost} onClaim={handleClaim} />
        ))}
      </div>

      {claiming && (
        <ClaimModal reward={claiming} onConfirm={confirmClaim} onCancel={() => setClaiming(null)} />
      )}
    </Panel>
  )
}
