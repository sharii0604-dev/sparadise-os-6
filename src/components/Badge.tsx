import type { ReactNode } from 'react'
import './components.css'

interface BadgeProps {
  variant: 'vip' | 'activo'
  children: ReactNode
}

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}
