import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCentroInteligencia } from '@/hooks/useCentroInteligencia'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/EstadosYFormularios'
import '@/components/components.css'
import '@/components/shared.css'
import './CentroInteligenciaPage.css'

const TABS = ['Interés sin agendar', 'Valoraciones pendientes', 'Paquetes por vencer', 'Días con menos citas'] as const
type Tab = (typeof TABS)[number]

export function CentroInteligenciaPage() {
  const { interesSinAgendar, valoracionesPendientes, paquetesPorVencer, diasConMenosCitas, cargando, error, recargar } = useCentroInteligencia()
  const [tab, setTab] = useState<Tab>('Interés sin agendar')
  const navigate = useNavigate()

  return (
    <div className="inteligencia">
      <h1>Centro de inteligencia</h1>

      <div className="pestanas">
        {TABS.map((t) => (
          <button key={t} type="button" className={`pestana${tab === t ? ' pestana--activa' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {error && <EstadoError onReintentar={recargar}>{error}</EstadoError>}
      {cargando && <EstadoCargando>Analizando datos…</EstadoCargando>}

      {!cargando && !error && (
        <div className="card">
          {tab === 'Interés sin agendar' && (
            <>
              {interesSinAgendar.length === 0 && <EstadoVacio>Todo el interés reciente tiene seguimiento al día.</EstadoVacio>}
              {interesSinAgendar.map((i) => (
                <div key={i.id_interes} className="fila-ia">
                  <div>
                    <b>{i.clienta_nombre}</b>
                    <span>
                      {i.tratamiento_nombre} · {i.dias_sin_seguimiento} días sin seguimiento
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'Valoraciones pendientes' && (
            <>
              {valoracionesPendientes.length === 0 && <EstadoVacio>No hay valoraciones en "lo está pensando".</EstadoVacio>}
              {valoracionesPendientes.map((v) => (
                <div key={v.id_evaluacion} className="fila-ia tabla-fila-clic" onClick={() => navigate(`/clientas`)}>
                  <div>
                    <b>{v.clienta_nombre}</b>
                    <span>Evaluada el {v.fecha}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'Paquetes por vencer' && (
            <>
              {paquetesPorVencer.length === 0 && <EstadoVacio>Ningún paquete vence en los próximos 14 días.</EstadoVacio>}
              {paquetesPorVencer.map((p) => (
                <div key={p.id_paquete} className="fila-ia">
                  <span className="chip">{p.dias_restantes} días</span>
                  <div>
                    <b>{p.clienta_nombre}</b>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'Días con menos citas' && (
            <>
              <p className="hint" style={{ marginBottom: 14 }}>
                Promedio de citas por día de la semana, últimos 60 días — útil para planear promociones o mantenimiento en los días más flojos.
              </p>
              {diasConMenosCitas.map((d) => (
                <div key={d.diaSemana} className="fila-ia">
                  <div>
                    <b>{d.diaSemana}</b>
                    <span>{d.promedioCitas} citas/semana en promedio</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
