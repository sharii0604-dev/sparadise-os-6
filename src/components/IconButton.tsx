import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './components.css'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  showDot?: boolean
  label: string
}

export function IconButton({ children, showDot, label, ...rest }: IconButtonProps) {
  return (
    <button type="button" className="icon-btn" aria-label={label} {...rest}>
      {children}
      {showDot && <span className="dot" />}
    </button>
  )
}
