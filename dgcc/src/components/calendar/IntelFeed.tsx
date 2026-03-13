import { Panel } from '../ui/Panel'

const mockEvents = [
  { time: '09:00', title: 'Morning Standup', cal: 'Work', color: 'var(--teal)' },
  { time: '10:30', title: 'Sprint Planning', cal: 'Work', color: 'var(--teal)' },
  { time: '12:00', title: 'Lunch w/ Alex', cal: 'Personal', color: 'var(--amber)' },
  { time: '14:00', title: 'Code Review Session', cal: 'Work', color: 'var(--blue)' },
  { time: '16:00', title: 'Gym', cal: 'Personal', color: 'var(--green)' },
  { time: '18:30', title: 'Dinner Plans', cal: 'Personal', color: 'var(--amber)' },
]

export function IntelFeed() {
  return (
    <Panel
      accent="blue"
      title="INTEL FEED"
      ticker="SYS::CALENDAR_LINK >> STATUS: PHASE_2 >> GOOGLE_OAUTH PENDING >> SKYLIGHT_BRIDGE STANDBY >> REFRESH_RATE 300s"
      className="h-full"
    >
      {/* Phase 2 notice */}
      <div className="bg-[var(--blue-deep)] border border-[var(--blue-dim)] p-3 mb-4 clip-card">
        <div className="text-[10px] uppercase tracking-widest text-[var(--blue)] mb-1">// GOOGLE CALENDAR</div>
        <div className="text-xs text-[var(--text)]">CONNECTION PENDING — PHASE 2 INTEGRATION</div>
        <div className="text-[9px] text-[var(--text-dim)] mt-1">Preview data shown below</div>
      </div>

      {/* Mock timeline */}
      <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] mb-2">// TODAY'S INTEL</div>
      <div className="flex flex-col gap-1.5">
        {mockEvents.map((e, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-[var(--panel2)] border border-[var(--b0)] px-3 py-2"
            style={{ borderLeft: `3px solid ${e.color}` }}
          >
            <span className="font-mono text-xs text-[var(--text-dim)] w-12 shrink-0">{e.time}</span>
            <span className="text-sm text-[var(--text-hi)] flex-1 truncate">{e.title}</span>
            <span className="text-[9px] uppercase tracking-wider text-[var(--text-dim)]">{e.cal}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
