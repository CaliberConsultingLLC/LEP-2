import { useState } from 'react'
import { Panel } from '../ui/Panel'
import { ArcButton } from '../ui/ArcButton'
import { TaskItem, type Task } from './TaskItem'
import { AddTaskForm } from './AddTaskForm'
import { useAppStore } from '../../store/useAppStore'

const initialTasks: Task[] = [
  { id: '1', title: 'Review deployment logs', xp: 30, priority: 'high', type: 'one-off', completed: false },
  { id: '2', title: 'Update project documentation', xp: 25, priority: 'med', type: 'one-off', completed: false },
  { id: '3', title: 'Morning workout', xp: 20, priority: 'low', type: 'recurring', recurrence: 'daily', completed: false },
  { id: '4', title: 'Check emails', xp: 15, priority: 'med', type: 'recurring', recurrence: 'daily', completed: true },
  { id: '5', title: 'Team sync meeting', xp: 20, priority: 'high', type: 'recurring', recurrence: 'mon,wed,fri', completed: false },
]

type Filter = 'all' | 'today' | 'recurring'

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<Filter>('all')
  const [showAdd, setShowAdd] = useState(false)
  const addXp = useAppStore((s) => s.addXp)

  const filtered = tasks.filter((t) => {
    if (filter === 'recurring') return t.type === 'recurring'
    return true // 'all' and 'today' show everything for now
  })

  const handleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id && !t.completed) {
          addXp(t.xp, 'task')
          return { ...t, completed: true }
        }
        return t
      })
    )
  }

  const handleAdd = (task: Omit<Task, 'id' | 'completed'>) => {
    setTasks((prev) => [...prev, { ...task, id: Math.random().toString(36).slice(2), completed: false }])
    setShowAdd(false)
  }

  return (
    <Panel
      accent="teal"
      title="OPERATIONS"
      ticker="SYS::TASK_QUEUE >> PRIORITY_SORT ACTIVE >> RECURRING_CHECK 0800 >> OVERDUE_SCAN ENABLED >> COMPLETION_RATE 78.4%"
      className="h-full"
    >
      {/* Filter tabs */}
      <div className="flex gap-2 mb-3">
        {(['all', 'today', 'recurring'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 clip-btn-sm border transition-all ${
              filter === f
                ? 'bg-[var(--teal-deep)] border-[var(--teal-dim)] text-[var(--teal)]'
                : 'bg-transparent border-[var(--b0)] text-[var(--text-dim)] hover:text-[var(--text)]'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="flex-1" />
        <ArcButton variant="teal" small onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '// CANCEL' : '// DEPLOY'}
        </ArcButton>
      </div>

      {/* Add form */}
      {showAdd && <AddTaskForm onAdd={handleAdd} />}

      {/* Task list */}
      <div className="flex flex-col gap-1">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-[var(--text-dim)] text-sm tracking-wider">
            // NO OPERATIONS DEPLOYED — ADD YOUR FIRST MISSION
          </div>
        )}
        {filtered.map((t) => (
          <TaskItem key={t.id} task={t} onComplete={handleComplete} />
        ))}
      </div>
    </Panel>
  )
}
