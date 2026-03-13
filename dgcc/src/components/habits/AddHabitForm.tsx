import { useState } from 'react'
import { ArcButton } from '../ui/ArcButton'

interface Props {
  onAdd: (name: string, xp: number) => void
}

export function AddHabitForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [xp, setXp] = useState(15)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), xp)
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--panel2)] border border-[var(--b0)] p-3 mb-3 flex gap-2 items-center">
      <input
        className="arc-input flex-1 text-sm"
        placeholder="Protocol name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-[var(--text-dim)]">XP:</span>
        <input type="number" className="arc-input w-14 text-xs text-center" value={xp} onChange={(e) => setXp(Number(e.target.value))} min={5} max={50} />
      </div>
      <ArcButton variant="green" small type="submit">// ADD</ArcButton>
    </form>
  )
}
