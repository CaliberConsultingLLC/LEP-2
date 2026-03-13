import { ReactNode } from 'react'

type AccentColor = 'teal' | 'amber' | 'blue' | 'green' | 'red'

const accentGradients: Record<AccentColor, string> = {
  teal: 'linear-gradient(90deg, var(--teal), var(--teal-dim), transparent)',
  amber: 'linear-gradient(90deg, var(--amber), var(--amber-dim), transparent)',
  blue: 'linear-gradient(90deg, var(--blue), var(--blue-dim), transparent)',
  green: 'linear-gradient(90deg, var(--green), var(--green-dim), transparent)',
  red: 'linear-gradient(90deg, var(--red), var(--red-dim), transparent)',
}

const cornerColors: Record<AccentColor, string> = {
  teal: 'var(--teal)',
  amber: 'var(--amber)',
  blue: 'var(--blue)',
  green: 'var(--green)',
  red: 'var(--red)',
}

interface Props {
  accent?: AccentColor
  title?: string
  ticker?: string
  children: ReactNode
  className?: string
  noPad?: boolean
}

export function Panel({ accent = 'teal', title, ticker, children, className = '', noPad }: Props) {
  return (
    <div
      className={`relative bg-[var(--panel)] border border-[var(--b0)] panel-scan noise flex flex-col ${className}`}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px z-10"
        style={{ background: accentGradients[accent] }}
      />
      {/* Corner brackets */}
      <div
        className="absolute top-0 left-0 w-3 h-3 z-10"
        style={{ borderTop: `1px solid ${cornerColors[accent]}`, borderLeft: `1px solid ${cornerColors[accent]}` }}
      />
      <div className="corner-br z-10" />

      {/* Title */}
      {title && (
        <div className="px-3 py-1.5 border-b border-[var(--b0)] flex items-center gap-2 z-10">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: cornerColors[accent] }}>
            // {title}
          </span>
        </div>
      )}

      {/* Body */}
      <div className={`flex-1 overflow-y-auto z-10 ${noPad ? '' : 'p-3'}`}>
        {children}
      </div>

      {/* Ticker */}
      {ticker && (
        <div className="ticker z-10">
          <div className="ticker-inner">{ticker}</div>
        </div>
      )}
    </div>
  )
}
