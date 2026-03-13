import { useState } from 'react'
import { Panel } from '../ui/Panel'
import { ArcButton } from '../ui/ArcButton'
import { HabitRow, type Habit } from './HabitRow'
import { AddHabitForm } from './AddHabitForm'
import { useAppStore } from '../../store/useAppStore'

const initialHabits: Habit[] = [
  { id: '1', name: 'Morning Workout', xp: 15, streak: 12, days: [true, true, true, true, true, false, false] },
  { id: '2', name: 'Read 30 Minutes', xp: 15, streak: 5, days: [true, true, false, true, true, false, false] },
  { id: '3', name: 'Drink 8 Glasses Water', xp: 10, streak: 8, days: [true, true, true, true, true, true, false] },
  { id: '4', name: 'Meditation', xp: 15, streak: 3, days: [false, true, false, true, true, false, false] },
]

export function HabitList() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits)
  const [showAdd, setShowAdd] = useState(false)
  const addXp = useAppStore((s) => s.addXp)

  const handleLogToday = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id && !h.days[6]) {
          addXp(h.xp, 'habit')
          return {
            ...h,
            days: [...h.days.slice(0, 6), true] as Habit['days'],
            streak: h.streak + 1,
          }
        }
        return h
      })
    )
  }

  const handleAdd = (name: string, xp: number) => {
    setHabits((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), name, xp, streak: 0, days: [false, false, false, false, false, false, false] },
    ])
    setShowAdd(false)
  }

  return (
    <Panel
      accent="green"
      title="PROTOCOLS"
      ticker="SYS::HABIT_ENGINE >> STREAK_MONITOR ACTIVE >> MILESTONE_CHECK 0000 >> DAILY_RESET ENABLED >> CONSISTENCY_INDEX 82.1%"
      className="h-full"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)]">
          ACTIVE PROTOCOLS: {habits.length}
        </div>
        <ArcButton variant="green" small onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '// CANCEL' : '// ADD PROTOCOL'}
        </ArcButton>
      </div>

      {showAdd && <AddHabitForm onAdd={handleAdd} />}

      {/* Day labels */}
      <div className="flex items-center gap-3 mb-2 pl-[calc(100%-220px)]">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="w-5 text-center font-mono text-[9px] text-[var(--text-dim)]">{d}</span>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {habits.map((h) => (
          <HabitRow key={h.id} habit={h} onLogToday={handleLogToday} />
        ))}
      </div>
    </Panel>
  )
}
