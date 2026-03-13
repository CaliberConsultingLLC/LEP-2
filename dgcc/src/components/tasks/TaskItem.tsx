import { motion } from 'framer-motion'

export interface Task {
  id: string
  title: string
  xp: number
  priority: 'high' | 'med' | 'low'
  type: 'one-off' | 'recurring'
  recurrence?: string
  dueDate?: string
  notes?: string
  completed: boolean
}

const priorityColors = {
  high: 'var(--red)',
  med: 'var(--amber)',
  low: 'var(--blue)',
}

interface Props {
  task: Task
  onComplete: (id: string) => void
}

export function TaskItem({ task, onComplete }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 bg-[var(--panel2)] border border-[var(--b0)] px-3 py-2 relative ${
        task.completed ? 'opacity-50' : ''
      }`}
      style={{ borderLeft: `3px solid ${priorityColors[task.priority]}` }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onComplete(task.id)}
        disabled={task.completed}
        className="w-5 h-5 clip-btn-sm border flex items-center justify-center shrink-0 transition-all"
        style={{
          borderColor: task.completed ? 'var(--teal)' : 'var(--b1)',
          background: task.completed ? 'var(--teal-deep)' : 'transparent',
        }}
      >
        {task.completed && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[var(--teal)] text-xs"
          >
            ✓
          </motion.span>
        )}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-semibold tracking-wider ${task.completed ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text-hi)]'}`}
        >
          {task.title}
        </span>
        {task.type === 'recurring' && (
          <span className="ml-2 text-[9px] uppercase tracking-wider text-[var(--text-dim)]">
            [{task.recurrence}]
          </span>
        )}
      </div>

      {/* XP badge */}
      <div className="font-mono text-xs text-[var(--teal-dim)] shrink-0">+{task.xp} XP</div>
    </motion.div>
  )
}
