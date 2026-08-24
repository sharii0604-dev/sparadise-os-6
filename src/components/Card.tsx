import type { ReactNode } from 'react'
import './components.css'

interface CardProps {
  titulo?: string
  contador?: number | string
  accionTexto?: string
  onAccion?: () => void
  children: ReactNode
  tituloFontSize?: string
}

export function Card({ titulo, contador, accionTexto, onAccion, children, tituloFontSize }: CardProps) {
  return (
    <div className="card">
      {(titulo || accionTexto) && (
        <div className="card-h">
          {titulo && (
            <div className="card-h__t" style={tituloFontSize ? { fontSize: tituloFontSize } : undefined}>
              {titulo}
            </div>
          )}
          {contador !== undefined && <span className="card-h__n">{contador}</span>}
          {accionTexto && (
            <button type="button" className="ver-todas" onClick={onAccion} style={{ background: 'none', border: 'none', padding: 0 }}>
              {accionTexto}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
