import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/Avatar'
import {
  IconInicio,
  IconClientas,
  IconAgenda,
  IconPagos,
  IconTratamientos,
  IconMarketing,
  IconDashboard,
  IconCentroInteligencia,
  IconMas,
} from '@/components/icons'
import './AppShell.css'

/**
 * 8 secciones fijas del menú principal — mismo orden y set exacto que
 * 01_Panel_Bienvenida.html y 02_Arquitectura_Navegacion.html §01.
 * Configuración no es un ítem del menú principal: se accede desde el bloque
 * de usuario (sidebar) o desde "Más" en móvil, tal como documenta la Guía de
 * navegación ("Siempre visibles: ⚙️ Perfil y configuración").
 */
const NAV_ITEMS = [
  { to: '/', label: 'Inicio', Icon: IconInicio, end: true },
  { to: '/clientas', label: 'Clientas', Icon: IconClientas, end: false },
  { to: '/agenda', label: 'Agenda', Icon: IconAgenda, end: false },
  { to: '/pagos', label: 'Pagos', Icon: IconPagos, end: false },
  { to: '/tratamientos', label: 'Tratamientos', Icon: IconTratamientos, end: false },
  { to: '/marketing', label: 'Marketing', Icon: IconMarketing, end: false },
  { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard, end: false },
  { to: '/inteligencia', label: 'Centro de inteligencia', Icon: IconCentroInteligencia, end: false },
] as const

/** 5 accesos de la bottom-nav móvil, mismo set que 01_Panel_Bienvenida.html mobile-layout. */
const BOTTOM_NAV_ITEMS = [
  { to: '/', label: 'Inicio', Icon: IconInicio, end: true },
  { to: '/agenda', label: 'Agenda', Icon: IconAgenda, end: false },
  { to: '/clientas', label: 'Clientas', Icon: IconClientas, end: false },
  { to: '/pagos', label: 'Pagos', Icon: IconPagos, end: false },
  { to: '/configuracion', label: 'Más', Icon: IconMas, end: false },
] as const

export function AppShell() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  async function handleCerrarSesion() {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  const nombreMostrado = usuario?.nombre_completo ?? 'Cargando…'
  // Rol real desde public.rol, vía el join que hace AuthContext al cargar el
  // usuario — nunca hardcodeado. Se omite la línea mientras carga o si el
  // usuario no tiene rol asignado.
  const rolMostrado = usuario?.rol?.nombre ?? null

  return (
    <div className="app-shell">
      {/* ---- Sidebar de escritorio ---- */}
      <aside className="sidebar">
        <div className="logo">
          <b>Spa</b>radise OS
        </div>
        <nav>
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item--activo' : ''}`}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar-user" onClick={() => navigate('/configuracion')}>
          <Avatar nombre={nombreMostrado} size="sm" variant="durazno" />
          <div>
            <div className="sidebar-user__nombre">{usuario?.nombre_completo ?? '…'}</div>
            {rolMostrado && <div className="sidebar-user__rol">{rolMostrado}</div>}
          </div>
        </button>
      </aside>

      {/* ---- Contenido de la página activa ---- */}
      <div className="app-shell__content">
        <Outlet context={{ usuario, cerrarSesion: handleCerrarSesion }} />
      </div>

      {/* ---- Navegación inferior móvil ---- */}
      <nav className="bottom-nav">
        {BOTTOM_NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `bn-item${isActive ? ' bn-item--activo' : ''}`}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
