export interface Habit {
  id: string
  name: string
  xp: number
  streak: number
  days: [boolean, boolean, boolean, boolean, boolean, boolean, boolean]
}

interface Props {
  habit: Habit
  onLogToday: (id: string) => void
}

export function HabitRow({ habit, onLogToday }: Props) {
  const todayLogged = habit.days[6]

  return (
    <div className="flex items-center gap-3 bg-[var(--panel2)] border border-[var(--b0)] px-3 py-2">
      {/* Name + streak */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm font-semibold text-[var(--text-hi)] tracking-wider truncate">{habit.name}</span>
        <span className="font-mono text-xs text-[var(--amber)] shrink-0">
          ▲{habit.streak}
        </span>
      </div>

      {/* 7-day dots */}
      <div className="flex items-center gap-1.5">
        {habit.days.map((done, i) => {
          const isToday = i === 6
          if (isToday) {
            return (
              <button
                key={i}
                onClick={() => onLogToday(habit.id)}
                disabled={todayLogged}
                className="w-5 h-5 clip-btn-sm border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: todayLogged ? 'var(--amber)' : 'var(--amber-dim)',
                  background: todayLogged ? 'var(--amber-deep)' : 'transparent',
                }}
              >
                {todayLogged && <span className="text-[var(--amber)] text-xs">●</span>}
              </button>
            )
          }
          return (
            <div
              key={i}
              className="w-5 h-5 clip-btn-sm flex items-center justify-center"
              style={{
                background: done ? 'var(--green-dim)' : 'var(--panel)',
                border: done ? '1px solid var(--green-dim)' : '1px solid var(--b0)',
              }}
            >
              {done && <span className="text-[var(--green)] text-xs">●</span>}
            </div>
          )
        })}
      </div>

      {/* XP */}
      <div className="font-mono text-xs text-[var(--green-dim)] shrink-0">+{habit.xp}</div>
    </div>
  )
}
