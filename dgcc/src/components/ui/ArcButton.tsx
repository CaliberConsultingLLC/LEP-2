import { ButtonHTMLAttributes } from 'react'

type Variant = 'teal' | 'amber' | 'red' | 'green' | 'blue'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  small?: boolean
}

export function ArcButton({ variant = 'teal', small, className = '', children, ...props }: Props) {
  return (
    <button
      className={`arc-btn arc-btn-${variant} ${small ? 'px-3 py-1 text-xs' : 'px-5 py-1.5 text-sm'} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
