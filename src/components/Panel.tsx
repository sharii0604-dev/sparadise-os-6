import type { ReactNode } from 'react'
import { useEffect } from 'react'
import './shared.css'

interface PanelProps {
  titulo: string
  abierto: boolean
  onCerrar: () => void
  children: ReactNode
  ancho?: number
}

/**
 * Panel lateral deslizante (usado por "Nueva cita", "Nueva clienta", etc.).
 * En móvil ocupa toda la pantalla, tal como especifica el Documento Maestro
 * UX para el panel "Nueva cita" ("pasa a pantalla completa tipo asistente").
 */
export function Panel({ titulo, abierto, onCerrar, children, ancho = 440 }: PanelProps) {
  useEffect(() => {
    if (!abierto) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="panel-overlay" onClick={onCerrar}>
      <div
        className="panel"
        style={{ maxWidth: ancho }}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h2>{titulo}</h2>
          <button type="button" className="panel-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  )
}
