import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePagosData, type FiltroPagos, type PaqueteConSaldo } from '@/hooks/usePagosData'
import { usePlantillasPaquete } from '@/hooks/usePlantillasPaquete'
import { useCatalogos } from '@/hooks/useCatalogos'
import { RegistrarAbonoPanel } from '@/features/pagos/RegistrarAbonoPanel'
import { VenderPaquetePanel } from '@/features/pagos/VenderPaquetePanel'
import { NuevaPlantillaPanel } from '@/features/pagos/NuevaPlantillaPanel'
import { PrimaryButton } from '@/components/PrimaryButton'
import { IconMas } from '@/components/icons'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/EstadosYFormularios'
import { Toast } from '@/components/Toast'
import '@/components/components.css'
import '@/components/shared.css'
import './PagosPage.css'

function formatColones(v: number): string {
  return '₡' + Math.round(v).toLocaleString('es-CR')
}

type Seccion = 'paquetes' | 'plantillas'

const PESTANAS_PAQUETES: { id: FiltroPagos; label: string }[] = [
  { id: 'todos', label: 'Todos los paquetes' },
  { id: 'con_saldo', label: 'Con saldo pendiente' },
  { id: 'vencidos', label: 'Vencidos' },
]

export function PagosPage() {
  const [seccion, setSeccion] = useState<Seccion>('paquetes')
  const [filtro, setFiltro] = useState<FiltroPagos>('todos')
  const { paquetes, cargando, error, recargar } = usePagosData(filtro)
  const { plantillas, cargando: cargandoPlantillas, recargar: recargarPlantillas } = usePlantillasPaquete()
  const { metodosPago, tratamientos } = useCatalogos()
  const navigate = useNavigate()

  const [panelAbierto, setPanelAbierto] = useState(false)
  const [panelVentaAbierto, setPanelVentaAbierto] = useState(false)
  const [panelPlantillaAbierto, setPanelPlantillaAbierto] = useState(false)
  const [paqueteParaAbono, setPaqueteParaAbono] = useState<PaqueteConSaldo | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const totalPendiente = paquetes.reduce((acc, p) => acc + Math.max(p.saldo, 0), 0)

  return (
    <div className="pagos">
      <div className="pagos-top">
        <div>
          <h1>Pagos</h1>
          {seccion === 'paquetes' && <p className="hint">Saldo pendiente total: {formatColones(totalPendiente)}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {seccion === 'paquetes' ? (
            <>
              <button type="button" className="btn-secundario" onClick={() => setPanelVentaAbierto(true)}>
                Vender paquete
              </button>
              <PrimaryButton
                icon={<IconMas />}
                onClick={() => {
                  setPaqueteParaAbono(null)
                  setPanelAbierto(true)
                }}
              >
                Registrar abono
              </PrimaryButton>
            </>
          ) : (
            <PrimaryButton icon={<IconMas />} onClick={() => setPanelPlantillaAbierto(true)}>
              Nueva plantilla
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="pestanas">
        <button type="button" className={`pestana${seccion === 'paquetes' ? ' pestana--activa' : ''}`} onClick={() => setSeccion('paquetes')}>
          Paquetes
        </button>
        <button type="button" className={`pestana${seccion === 'plantillas' ? ' pestana--activa' : ''}`} onClick={() => setSeccion('plantillas')}>
          Plantillas
        </button>
      </div>

      {seccion === 'paquetes' && (
        <>
          <div className="pestanas pestanas--secundarias">
            {PESTANAS_PAQUETES.map((p) => (
              <button key={p.id} type="button" className={`pestana${filtro === p.id ? ' pestana--activa' : ''}`} onClick={() => setFiltro(p.id)}>
                {p.label}
              </button>
            ))}
          </div>

          {error && <EstadoError onReintentar={recargar}>{error}</EstadoError>}
          {cargando && <EstadoCargando>Cargando pagos…</EstadoCargando>}

          {!cargando && !error && paquetes.length === 0 && (
            <div className="card">
              <EstadoVacio>No hay paquetes para este filtro.</EstadoVacio>
            </div>
          )}

          {!cargando && !error && paquetes.length > 0 && (
            <div className="tabla-wrap card">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Clienta</th>
                    <th>Paquete</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Abonado</th>
                    <th>Saldo</th>
                    <th>Vence</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paquetes.map((p) => (
                    <tr key={p.id_paquete}>
                      <td className="tabla-fila-clic" onClick={() => navigate(`/clientas/${p.id_clienta}`)}>
                        {p.clienta_nombre}
                      </td>
                      <td>{p.nombre}</td>
                      <td>
                        <span className={`estado estado--${p.estado === 'activo' ? 'confirmada' : 'pendiente'}`}>{p.estado}</span>
                      </td>
                      <td>{formatColones(p.precio_total)}</td>
                      <td>{formatColones(p.totalAbonado)}</td>
                      <td style={{ fontWeight: p.saldo > 0 ? 600 : 400 }}>{formatColones(p.saldo)}</td>
                      <td>{p.fecha_vencimiento ?? '—'}</td>
                      <td>
                        {p.saldo > 0 && (
                          <button
                            type="button"
                            className="btn-texto"
                            onClick={() => {
                              setPaqueteParaAbono(p)
                              setPanelAbierto(true)
                            }}
                          >
                            Abonar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {seccion === 'plantillas' && (
        <>
          {cargandoPlantillas && <EstadoCargando>Cargando plantillas…</EstadoCargando>}
          {!cargandoPlantillas && plantillas.length === 0 && (
            <div className="card">
              <EstadoVacio>Todavía no hay plantillas de paquete creadas.</EstadoVacio>
            </div>
          )}
          {!cargandoPlantillas && plantillas.length > 0 && (
            <div className="tabla-wrap card">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Plantilla</th>
                    <th>Precio sugerido</th>
                    <th>Tratamientos incluidos</th>
                  </tr>
                </thead>
                <tbody>
                  {plantillas.map((p) => (
                    <tr key={p.id_plantilla_paquete}>
                      <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                      <td>{p.precio_sugerido !== null ? formatColones(p.precio_sugerido) : '—'}</td>
                      <td>{p.detalles.map((d) => `${d.tratamiento_nombre} × ${d.cantidad_sesiones}`).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <RegistrarAbonoPanel
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        onRegistrado={() => {
          recargar()
          setToast('Abono registrado.')
        }}
        metodosPago={metodosPago}
        paqueteFijado={paqueteParaAbono}
      />

      <VenderPaquetePanel
        abierto={panelVentaAbierto}
        onCerrar={() => setPanelVentaAbierto(false)}
        onVendido={() => {
          recargar()
          setToast('Paquete vendido.')
        }}
        metodosPago={metodosPago}
      />

      <NuevaPlantillaPanel
        abierto={panelPlantillaAbierto}
        onCerrar={() => setPanelPlantillaAbierto(false)}
        onCreada={() => {
          recargarPlantillas()
          setToast('Plantilla creada.')
        }}
        tratamientos={tratamientos}
      />

      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
    </div>
  )
}
