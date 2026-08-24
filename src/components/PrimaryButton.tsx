import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './components.css'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  children: ReactNode
}

export function PrimaryButton({ icon, children, ...rest }: PrimaryButtonProps) {
  return (
    <button type="button" className="btn-primario" {...rest}>
      {icon}
      {children}
    </button>
  )
}
