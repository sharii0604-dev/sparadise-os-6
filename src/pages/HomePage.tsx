import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useHomeData } from '@/hooks/useHomeData'
import { Card } from '@/components/Card'
import { Avatar } from '@/components/Avatar'
import { IconButton } from '@/components/IconButton'
import { PrimaryButton } from '@/components/PrimaryButton'
import { EstadoTag } from '@/components/EstadoTag'
import { IconBuscar, IconCorazon, IconNotificacion, IconMas, IconWhatsapp } from '@/components/icons'
import '@/components/components.css'
import './HomePage.css'

function formatColones(valor: number): string {
  return '₡' + Math.round(valor).toLocaleString('es-CR')
}

function formatFechaLarga(): string {
  const texto = new Intl.DateTimeFormat('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function saludoSegunHora(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function HomePage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { citasHoy, seguimientos, cumpleanos, cobros, paquetesPorVencer, cargando, error } = useHomeData()

  const primerNombre = usuario?.nombre_completo?.split(' ')[0] ?? ''
  const pendientesHoy = citasHoy.filter((c) => c.estado === 'sin_confirmar').length

  return (
    <div className="home">
      {/* ---- Encabezado desktop ---- */}
      <div className="top-row home-top-row--desktop">
        <div className="saludo">
          <h1>
            {saludoSegunHora()}
            {primerNombre ? `, ${primerNombre}` : ''}
          </h1>
          <p>
            {formatFechaLarga()}
            {citasHoy.length > 0 &&
              ` · ${citasHoy.length} cita${citasHoy.length === 1 ? '' : 's'} hoy${
                pendientesHoy > 0 ? `, ${pendientesHoy} pendiente${pendientesHoy === 1 ? '' : 's'} de confirmar` : ''
              }`}
          </p>
        </div>
        <div className="top-actions">
          <div className="search">
            <IconBuscar />
            Buscar clienta…
          </div>
          <IconButton label="Favoritas">
            <IconCorazon />
          </IconButton>
          <IconButton label="Notificaciones" showDot>
            <IconNotificacion />
          </IconButton>
          <PrimaryButton icon={<IconMas />} onClick={() => navigate('/agenda')}>
            Nueva cita
          </PrimaryButton>
        </div>
      </div>

      {/* ---- Encabezado móvil ---- */}
      <div className="m-top home-top-row--mobile">
        <div className="m-hola">
          <Avatar nombre={usuario?.nombre_completo ?? ''} size="md" variant="durazno" />
          <div>
            <h1>
              Hola{primerNombre ? `, ${primerNombre}` : ''}
            </h1>
            <p>{formatFechaLarga()}</p>
          </div>
        </div>
        <div className="m-icons">
          <IconButton label="Buscar">
            <IconBuscar />
          </IconButton>
          <IconButton label="Notificaciones" showDot>
            <IconNotificacion />
          </IconButton>
        </div>
      </div>

      {error && <div className="form-error home-error">{error}</div>}

      <div className="home-grid">
        <div className="home-citas">
          <Card
            titulo={`Hoy · ${citasHoy.length} cita${citasHoy.length === 1 ? '' : 's'}`}
            accionTexto="Ver agenda →"
            onAccion={() => navigate('/agenda')}
          >
            {cargando && <p className="home-vacio">Cargando citas…</p>}
            {!cargando && citasHoy.length === 0 && <p className="home-vacio">No hay citas agendadas para hoy.</p>}
            {citasHoy.map((c) => (
              <div className="cita" key={c.id_cita}>
                <div className="cita__hora">{c.hora_inicio.slice(0, 5)}</div>
                <Avatar nombre={c.clienta_nombre} size="md" />
                <div className="cita__info">
                  <div className="cita__nom">{c.clienta_nombre}</div>
                  <div className="cita__trat">
                    {c.tratamiento_nombre}
                    {c.numero_sesion && c.sesiones_totales ? ` · sesión ${c.numero_sesion}/${c.sesiones_totales}` : ''}
                    {' · '}
                    {c.terapeuta_nombre}
                  </div>
                </div>
                <EstadoTag variant={c.estado === 'confirmada' || c.estado === 'completada' ? 'confirmada' : 'pendiente'}>
                  {c.estado === 'confirmada' || c.estado === 'completada' ? 'Confirmada' : 'Sin confirmar'}
                </EstadoTag>
                <a
                  className="wa-btn"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label={`WhatsApp a ${c.clienta_nombre}`}
                >
                  <IconWhatsapp />
                </a>
              </div>
            ))}
          </Card>
        </div>

        <div className="home-cumple">
          <Card titulo="Cumpleaños hoy" tituloFontSize="14.5px">
            {!cargando && cumpleanos.length === 0 && <p className="home-vacio home-vacio--sm">Ninguno hoy.</p>}
            <div className="lista-simple">
              {cumpleanos.map((c) => (
                <div className="item-simple" key={c.id_clienta}>
                  <Avatar nombre={c.nombre_completo} size="sm" />
                  <div className="item-simple__txt">
                    <b>{c.nombre_completo}</b>
                    <span>Clienta desde {c.clienta_desde}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="home-cobros">
          <Card titulo="Cobros programados" tituloFontSize="14.5px">
            {!cargando && cobros.length === 0 && <p className="home-vacio home-vacio--sm">Sin saldos pendientes.</p>}
            <div className="lista-simple">
              {cobros.map((c) => (
                <div className="item-simple" key={c.id_paquete}>
                  <Avatar nombre={c.clienta_nombre} size="sm" />
                  <div className="item-simple__txt">
                    <b>{c.clienta_nombre}</b>
                    <span>
                      {c.concepto} · {formatColones(c.saldo)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="home-seguimientos">
          <Card titulo="Seguimientos pendientes" contador={seguimientos.length}>
            {!cargando && seguimientos.length === 0 && <p className="home-vacio">Sin seguimientos pendientes.</p>}
            <div className="lista-simple">
              {seguimientos.map((s) => (
                <div className="item-simple" key={s.id_interes}>
                  <Avatar nombre={s.clienta_nombre} size="sm" />
                  <div className="item-simple__txt">
                    <b>{s.clienta_nombre}</b>
                    <span>{s.descripcion}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="home-vencer">
          <Card titulo="Paquetes por vencer">
            {!cargando && paquetesPorVencer.length === 0 && <p className="home-vacio">Ninguno próximo a vencer.</p>}
            {paquetesPorVencer.map((p) => (
              <div className="alerta-row" key={p.id_paquete}>
                <span className="chip">{p.dias_restantes} días</span>
                {p.clienta_nombre} · {p.sesiones_restantes} sesión{p.sesiones_restantes === 1 ? '' : 'es'} restante
                {p.sesiones_restantes === 1 ? '' : 's'}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
