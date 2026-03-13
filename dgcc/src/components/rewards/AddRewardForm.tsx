import { useState } from 'react'
import { ArcButton } from '../ui/ArcButton'

interface Props {
  onAdd: (title: string, cost: number) => void
}

export function AddRewardForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [cost, setCost] = useState(200)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim(), cost)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--panel2)] border border-[var(--b0)] p-3 mb-3 flex gap-2 items-center">
      <input className="arc-input flex-1 text-sm" placeholder="Reward name..." value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-[var(--text-dim)]">COST:</span>
        <input type="number" className="arc-input w-16 text-xs text-center" value={cost} onChange={(e) => setCost(Number(e.target.value))} min={50} step={50} />
      </div>
      <ArcButton variant="amber" small type="submit">// ADD</ArcButton>
    </form>
  )
}
