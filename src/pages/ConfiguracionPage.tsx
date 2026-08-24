import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useConfiguracionData } from '@/hooks/useConfiguracionData'
import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/EstadosYFormularios'
import { Toast } from '@/components/Toast'
import '@/components/components.css'
import '@/components/shared.css'
import '@/pages/FichaClientaPage.css'
import './ConfiguracionPage.css'

const TABS = ['Mi cuenta', 'Recordatorios', 'Usuarios y equipo'] as const
type Tab = (typeof TABS)[number]

const TIPO_CONDICION_LABEL: Record<string, string> = {
  cumpleanos: 'Cumpleaños de la clienta',
  paquete_por_vencer: 'Paquete por vencer',
  cita_proxima: 'Cita próxima',
  interes_sin_seguimiento: 'Interés sin seguimiento',
}

export function ConfiguracionPage() {
  const { usuario, cerrarSesion } = useAuth()
  const { reglas, equipo, cargando, error, recargar, alternarEstadoUsuario } = useConfiguracionData()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('Mi cuenta')
  const [toast, setToast] = useState<string | null>(null)
  const [procesandoUsuario, setProcesandoUsuario] = useState<string | null>(null)

  async function handleCerrarSesion() {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  async function handleAlternarUsuario(idUsuario: string, estadoActual: 'activo' | 'desactivado') {
    setProcesandoUsuario(idUsuario)
    try {
      await alternarEstadoUsuario(idUsuario, estadoActual === 'activo' ? 'desactivado' : 'activo')
      setToast('Estado del usuario actualizado.')
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'No se pudo actualizar el usuario.')
    } finally {
      setProcesandoUsuario(null)
    }
  }

  return (
    <div className="configuracion">
      <h1>Configuración</h1>

      <div className="pestanas">
        {TABS.map((t) => (
          <button key={t} type="button" className={`pestana${tab === t ? ' pestana--activa' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Mi cuenta' && (
        <div className="card">
          <div className="mi-cuenta__cabecera">
            <Avatar nombre={usuario?.nombre_completo ?? ''} size="lg" variant="durazno" />
            <div>
              <div className="mi-cuenta__nombre">{usuario?.nombre_completo ?? '—'}</div>
              <div className="hint">
                {usuario?.correo} {usuario?.rol?.nombre && `· ${usuario.rol.nombre}`}
              </div>
            </div>
          </div>
          <div className="ficha-grid" style={{ marginTop: 18 }}>
            <div className="ficha-campo">
              <div className="ficha-campo__label">Preferencia de bienvenida</div>
              <div className="ficha-campo__valor">{usuario?.preferencia_bienvenida ?? '—'}</div>
            </div>
            <div className="ficha-campo">
              <div className="ficha-campo__label">Último ingreso</div>
              <div className="ficha-campo__valor">{usuario?.fecha_ultimo_ingreso ?? '—'}</div>
            </div>
          </div>
          <button type="button" className="btn-secundario" style={{ marginTop: 22 }} onClick={handleCerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      )}

      {tab === 'Recordatorios' && (
        <div className="card">
          {error && <EstadoError onReintentar={recargar}>{error}</EstadoError>}
          {cargando && <EstadoCargando>Cargando reglas…</EstadoCargando>}
          {!cargando && !error && reglas.length === 0 && <EstadoVacio>Sin reglas de recordatorio configuradas.</EstadoVacio>}
          {!cargando &&
            !error &&
            reglas.map((r) => (
              <div key={r.id_regla} className="fila-ia">
                <div>
                  <b>{r.nombre}</b>
                  <span>
                    {TIPO_CONDICION_LABEL[r.tipo_condicion] ?? r.tipo_condicion}
                    {r.parametro_dias !== null && ` · ${r.parametro_dias} días`} · para {r.destinatario_nombre}
                  </span>
                </div>
                <span className={`estado estado--${r.activa ? 'confirmada' : 'pendiente'}`} style={{ marginLeft: 'auto' }}>
                  {r.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            ))}
        </div>
      )}

      {tab === 'Usuarios y equipo' && (
        <div className="card">
          {error && <EstadoError onReintentar={recargar}>{error}</EstadoError>}
          {cargando && <EstadoCargando>Cargando equipo…</EstadoCargando>}
          {!cargando && !error && (
            <div className="tabla-wrap">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Último ingreso</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {equipo.map((u) => (
                    <tr key={u.id_usuario}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar nombre={u.nombre_completo} size="sm" />
                        {u.nombre_completo}
                        {u.id_usuario === usuario?.id_usuario && <Badge variant="activo">Tú</Badge>}
                      </td>
                      <td>{u.correo}</td>
                      <td>{u.rol_nombre}</td>
                      <td>{u.fecha_ultimo_ingreso ?? '—'}</td>
                      <td>
                        <span className={`estado estado--${u.estado === 'activo' ? 'confirmada' : 'pendiente'}`}>{u.estado}</span>
                      </td>
                      <td>
                        {u.id_usuario !== usuario?.id_usuario && (
                          <button
                            type="button"
                            className="btn-texto"
                            disabled={procesandoUsuario === u.id_usuario}
                            onClick={() => handleAlternarUsuario(u.id_usuario, u.estado)}
                          >
                            {u.estado === 'activo' ? 'Desactivar acceso' : 'Reactivar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="hint" style={{ marginTop: 12 }}>
            Crear nuevos usuarios requiere invitarlos desde Supabase Auth (fuera de esta pantalla por ahora) — el trigger
            <code> crear_perfil_usuario</code> crea su fila en <code>usuario</code> automáticamente al aceptar la invitación.
          </p>
        </div>
      )}

      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
    </div>
  )
}
