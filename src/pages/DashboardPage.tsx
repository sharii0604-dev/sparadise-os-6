import { useDashboardData } from '@/hooks/useDashboardData'
import { Card } from '@/components/Card'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/EstadosYFormularios'
import '@/components/components.css'
import '@/components/shared.css'
import './DashboardPage.css'

function formatColones(v: number): string {
  return '₡' + Math.round(v).toLocaleString('es-CR')
}

export function DashboardPage() {
  const d = useDashboardData()

  if (d.cargando) return <EstadoCargando>Cargando dashboard…</EstadoCargando>
  if (d.error) return <EstadoError>{d.error}</EstadoError>

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stat-strip">
        <div className="stat-card">
          <div className="stat-card__valor">{formatColones(d.ingresosMes)}</div>
          <div className="stat-card__label">Ingresos del mes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__valor">{formatColones(d.ingresosSemana)}</div>
          <div className="stat-card__label">Ingresos últimos 7 días</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__valor">{d.clientasNuevasMes}</div>
          <div className="stat-card__label">Clientas nuevas (mes)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__valor">{d.sesionesRealizadasMes}</div>
          <div className="stat-card__label">Sesiones realizadas (mes)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__valor">{d.clientasVip}</div>
          <div className="stat-card__label">Clientas VIP</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__valor">{d.interesSinSeguimiento}</div>
          <div className="stat-card__label">Interés sin seguimiento</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__valor">{d.citasProximos7Dias}</div>
          <div className="stat-card__label">Citas próximos 7 días</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <Card titulo="Tratamientos más solicitados (mes)">
          {d.tratamientosMasSolicitados.length === 0 && <EstadoVacio>Sin citas registradas este mes.</EstadoVacio>}
          {d.tratamientosMasSolicitados.map((r) => (
            <BarraRanking key={r.nombre} item={r} max={d.tratamientosMasSolicitados[0]?.valor ?? 1} />
          ))}
        </Card>

        <Card titulo="Canales de llegada (clientas nuevas del mes)">
          {d.canalesLlegada.length === 0 && <EstadoVacio>Sin clientas nuevas este mes.</EstadoVacio>}
          {d.canalesLlegada.map((r) => (
            <BarraRanking key={r.nombre} item={r} max={d.canalesLlegada[0]?.valor ?? 1} />
          ))}
        </Card>
      </div>
    </div>
  )
}

function BarraRanking({ item, max }: { item: { nombre: string; valor: number }; max: number }) {
  const pct = max > 0 ? Math.round((item.valor / max) * 100) : 0
  return (
    <div className="barra-ranking">
      <div className="barra-ranking__cabecera">
        <span>{item.nombre}</span>
        <b>{item.valor}</b>
      </div>
      <div className="barra-ranking__pista">
        <div className="barra-ranking__relleno" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
