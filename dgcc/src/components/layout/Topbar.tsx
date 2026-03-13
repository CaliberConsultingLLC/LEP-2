import { useEffect, useState } from 'react'

export function Topbar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(i)
  }, [])

  const fmt = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="bg-[var(--surf)] border-b border-[var(--b0)]">
      <div className="h-[46px] flex items-center justify-between px-4">
        {/* Left — Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 clip-badge bg-[var(--teal-deep)] border border-[var(--teal-dim)] flex items-center justify-center">
            <span className="font-bold text-sm text-[var(--teal)]">DG</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-wider text-[var(--white)]">DGCC</span>
            <span className="text-[10px] tracking-widest text-[var(--text-dim)]">// COMMAND CENTER v1.0</span>
          </div>
        </div>

        {/* Right — Status + Clock */}
        <div className="flex items-center gap-5">
          {/* Status dots */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] dot-pulse" />
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-dim)]">SYS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] dot-pulse" style={{ animationDelay: '0.5s' }} />
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-dim)]">SYNC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-dim)]">CAL</span>
            </div>
          </div>

          {/* Clock */}
          <div className="font-mono text-sm text-[var(--text)] tracking-wider">{fmt}</div>
        </div>
      </div>
      <div className="topbar-line" />
    </div>
  )
}
