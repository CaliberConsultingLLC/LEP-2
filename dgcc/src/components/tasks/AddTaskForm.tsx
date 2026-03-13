import { useState } from 'react'
import { ArcButton } from '../ui/ArcButton'
import type { Task } from './TaskItem'

interface Props {
  onAdd: (task: Omit<Task, 'id' | 'completed'>) => void
}

export function AddTaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [xp, setXp] = useState(25)
  const [priority, setPriority] = useState<'high' | 'med' | 'low'>('med')
  const [type, setType] = useState<'one-off' | 'recurring'>('one-off')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), xp, priority, type })
    setTitle('')
    setXp(25)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--panel2)] border border-[var(--b0)] p-3 mb-3 flex flex-col gap-2">
      <input
        className="arc-input w-full text-sm"
        placeholder="Mission objective..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-dim)]">XP:</span>
          <input
            type="number"
            className="arc-input w-14 text-xs text-center"
            value={xp}
            onChange={(e) => setXp(Number(e.target.value))}
            min={5}
            max={200}
          />
        </div>
        <select className="arc-select text-xs" value={priority} onChange={(e) => setPriority(e.target.value as 'high' | 'med' | 'low')}>
          <option value="high">HIGH</option>
          <option value="med">MED</option>
          <option value="low">LOW</option>
        </select>
        <select className="arc-select text-xs" value={type} onChange={(e) => setType(e.target.value as 'one-off' | 'recurring')}>
          <option value="one-off">ONE-OFF</option>
          <option value="recurring">RECURRING</option>
        </select>
        <div className="flex-1" />
        <ArcButton variant="teal" small type="submit">// DEPLOY</ArcButton>
      </div>
    </form>
  )
}
