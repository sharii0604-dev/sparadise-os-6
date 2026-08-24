import { useEffect } from 'react'
import './shared.css'

interface ToastProps {
  mensaje: string
  variante?: 'ok' | 'error'
  onCerrar: () => void
}

export function Toast({ mensaje, variante = 'ok', onCerrar }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onCerrar, 3200)
    return () => clearTimeout(t)
  }, [onCerrar])

  return (
    <div className={`toast${variante === 'error' ? ' toast--error' : ''}`} role="status">
      {mensaje}
    </div>
  )
}
