type AccentColor = 'teal' | 'amber' | 'blue' | 'green' | 'red'

const colorMap: Record<AccentColor, string> = {
  teal: 'var(--teal)',
  amber: 'var(--amber)',
  blue: 'var(--blue)',
  green: 'var(--green)',
  red: 'var(--red)',
}

interface Props {
  label: string
  value: string | number
  accent?: AccentColor
}

export function StatBox({ label, value, accent = 'teal' }: Props) {
  return (
    <div className="bg-[var(--panel2)] border border-[var(--b0)] p-2 relative">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, ${colorMap[accent]}, transparent)` }}
      />
      <div className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] mb-0.5">{label}</div>
      <div className="font-mono text-lg" style={{ color: colorMap[accent] }}>{value}</div>
    </div>
  )
}
