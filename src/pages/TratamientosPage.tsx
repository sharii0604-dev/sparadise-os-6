import { useState } from 'react'
import { useTratamientos } from '@/hooks/useTratamientos'
import { useCatalogos } from '@/hooks/useCatalogos'
import { NuevoTratamientoPanel } from '@/features/tratamientos/NuevoTratamientoPanel'
import { PrimaryButton } from '@/components/PrimaryButton'
import { IconMas } from '@/components/icons'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/EstadosYFormularios'
import { Toast } from '@/components/Toast'
import '@/components/components.css'
import '@/components/shared.css'
import './TratamientosPage.css'

export function TratamientosPage() {
  const { tratamientos, cargando, error, recargar } = useTratamientos()
  const { categoriasTratamiento } = useCatalogos()
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  return (
    <div className="tratamientos">
      <div className="tratamientos-top">
        <h1>Tratamientos</h1>
        <PrimaryButton icon={<IconMas />} onClick={() => setPanelAbierto(true)}>
          Nuevo tratamiento
        </PrimaryButton>
      </div>

      {error && <EstadoError onReintentar={recargar}>{error}</EstadoError>}
      {cargando && <EstadoCargando>Cargando catálogo…</EstadoCargando>}

      {!cargando && !error && tratamientos.length === 0 && (
        <div className="card">
          <EstadoVacio>Todavía no hay tratamientos en el catálogo.</EstadoVacio>
        </div>
      )}

      {!cargando && !error && tratamientos.length > 0 && (
        <div className="tabla-wrap card">
          <table className="tabla">
            <thead>
              <tr>
                <th>Tratamiento</th>
                <th>Categoría</th>
                <th>Duración</th>
                <th>Consentimientos requeridos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tratamientos.map((t) => (
                <tr key={t.id_tratamiento}>
                  <td style={{ fontWeight: 500 }}>{t.nombre}</td>
                  <td>{t.categoria_nombre}</td>
                  <td>{t.duracion_minutos} min</td>
                  <td>{t.consentimientosRequeridos.length > 0 ? t.consentimientosRequeridos.join(', ') : '—'}</td>
                  <td>
                    <span className={`estado estado--${t.activo ? 'confirmada' : 'pendiente'}`}>{t.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NuevoTratamientoPanel
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        onCreado={() => {
          recargar()
          setToast('Tratamiento creado.')
        }}
        categorias={categoriasTratamiento}
      />

      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
    </div>
  )
}
