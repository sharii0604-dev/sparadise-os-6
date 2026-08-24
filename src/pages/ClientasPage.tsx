import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientasListado, type FiltroClientas } from '@/hooks/useClientasListado'
import { useCatalogos } from '@/hooks/useCatalogos'
import { NuevaClientaPanel } from '@/features/clientas/NuevaClientaPanel'
import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import { PrimaryButton } from '@/components/PrimaryButton'
import { IconMas, IconBuscar } from '@/components/icons'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/EstadosYFormularios'
import { Toast } from '@/components/Toast'
import '@/components/components.css'
import '@/components/shared.css'
import './ClientasPage.css'

const PESTANAS: { id: FiltroClientas; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'activas', label: 'Activas (30 días)' },
  { id: 'vip', label: 'VIP' },
  { id: 'sin_visitas', label: 'Sin visitas' },
]

export function ClientasPage() {
  const [termino, setTermino] = useState('')
  const [filtro, setFiltro] = useState<FiltroClientas>('todas')
  const { clientas, cargando, error, recargar } = useClientasListado(termino, filtro)
  const { canalesLlegada } = useCatalogos()
  const navigate = useNavigate()

  const [panelAbierto, setPanelAbierto] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  return (
    <div className="clientas">
      <div className="clientas-top">
        <h1>Clientas</h1>
        <PrimaryButton icon={<IconMas />} onClick={() => setPanelAbierto(true)}>
          Nueva clienta
        </PrimaryButton>
      </div>

      <div className="search search--ancho">
        <IconBuscar />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono, identificación o correo…"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: 13 }}
        />
      </div>

      <div className="pestanas">
        {PESTANAS.map((p) => (
          <button key={p.id} type="button" className={`pestana${filtro === p.id ? ' pestana--activa' : ''}`} onClick={() => setFiltro(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {error && <EstadoError onReintentar={recargar}>{error}</EstadoError>}
      {cargando && <EstadoCargando>Cargando clientas…</EstadoCargando>}

      {!cargando && !error && clientas.length === 0 && (
        <div className="card">
          <EstadoVacio>
            {termino ? 'Ninguna clienta coincide con la búsqueda.' : 'Todavía no hay clientas registradas.'}
          </EstadoVacio>
        </div>
      )}

      {!cargando && !error && clientas.length > 0 && (
        <div className="tabla-wrap card">
          <table className="tabla">
            <thead>
              <tr>
                <th>Clienta</th>
                <th>Teléfono</th>
                <th>Canal</th>
                <th>Última visita</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientas.map((c) => (
                <tr key={c.id_clienta} className="tabla-fila-clic" onClick={() => navigate(`/clientas/${c.id_clienta}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar nombre={c.nombre_completo} size="sm" />
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.nombre_completo}</div>
                        {c.es_vip && <Badge variant="vip">VIP</Badge>}
                      </div>
                    </div>
                  </td>
                  <td>{c.telefono}</td>
                  <td>{c.canal_nombre}</td>
                  <td>{c.fecha_ultima_visita ?? 'Sin visitas'}</td>
                  <td style={{ color: 'var(--coral-oscuro)', fontSize: 12.5 }}>Ver ficha →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NuevaClientaPanel
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        onCreada={(id) => {
          recargar()
          setToast('Clienta creada.')
          navigate(`/clientas/${id}`)
        }}
        canalesLlegada={canalesLlegada}
      />

      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
    </div>
  )
}
