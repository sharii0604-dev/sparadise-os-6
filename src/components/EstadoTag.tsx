import type { ReactNode } from 'react'
import './components.css'

interface EstadoTagProps {
  variant: 'confirmada' | 'pendiente'
  children: ReactNode
}

export function EstadoTag({ variant, children }: EstadoTagProps) {
  return <span className={`estado estado--${variant}`}>{children}</span>
}
