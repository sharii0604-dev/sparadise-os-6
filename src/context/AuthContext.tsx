import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database'

type UsuarioRow = Database['public']['Tables']['usuario']['Row']

/** Usuario con el nombre de su rol ya resuelto (join a public.rol), no un valor fijo. */
export type UsuarioConRol = UsuarioRow & {
  rol: { nombre: string } | null
}

interface AuthContextValue {
  session: Session | null
  usuario: UsuarioConRol | null
  /** true mientras se resuelve la sesión inicial o se recarga el usuario tras login */
  cargando: boolean
  /**
   * true justo después de haber cerrado la sesión automáticamente porque
   * public.usuario.estado = 'desactivado'. LoginPage lo lee una sola vez
   * para mostrar el motivo y luego se limpia.
   */
  cuentaDesactivada: boolean
  limpiarAvisoCuentaDesactivada: () => void
  cerrarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [usuario, setUsuario] = useState<UsuarioConRol | null>(null)
  const [cargando, setCargando] = useState(true)
  const [cuentaDesactivada, setCuentaDesactivada] = useState(false)

  useEffect(() => {
    let activo = true

    async function cargarUsuario(userId: string) {
      // join real a public.rol — el rol mostrado en el AppShell debe venir
      // de aquí, nunca de un valor fijo en el componente.
      const { data, error } = (await supabase
        .from('usuario')
        .select('*, rol:id_rol ( nombre )')
        .eq('id_usuario', userId)
        .single()) as unknown as { data: UsuarioConRol | null; error: { message: string } | null }

      if (!activo) return

      if (error) {
        // No detenemos la sesión de Auth por esto: el usuario queda autenticado
        // pero sin perfil cargado. El AppShell decide cómo mostrarlo.
        console.error('No se pudo cargar el perfil de usuario:', error.message)
        setUsuario(null)
        return
      }

      // SEGURIDAD: un usuario con estado='desactivado' no puede seguir usando
      // Sparadise OS aunque su sesión de Supabase Auth siga siendo válida.
      // Esto es una barrera del lado del cliente (cierra la sesión y bloquea
      // la navegación) — NO reemplaza una política RLS que valide
      // usuario.estado en el backend. Ver nota en el reporte de QA: mientras
      // no exista esa validación a nivel de RLS, un token válido robado o
      // reutilizado técnicamente podría seguir llamando la API de Supabase
      // directamente (fuera de esta interfaz) hasta que expire.
      if (data && data.estado === 'desactivado') {
        await supabase.auth.signOut()
        if (!activo) return
        setUsuario(null)
        setSession(null)
        setCuentaDesactivada(true)
        return
      }

      setUsuario(data)
    }

    supabase.auth.getSession().then(({ data: { session: sesionActual } }) => {
      if (!activo) return
      setSession(sesionActual)
      if (sesionActual?.user) {
        cargarUsuario(sesionActual.user.id).finally(() => activo && setCargando(false))
      } else {
        setCargando(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sesionNueva) => {
      if (!activo) return
      setSession(sesionNueva)
      if (sesionNueva?.user) {
        setCargando(true)
        cargarUsuario(sesionNueva.user.id).finally(() => activo && setCargando(false))
      } else {
        setUsuario(null)
        setCargando(false)
      }
    })

    return () => {
      activo = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  function limpiarAvisoCuentaDesactivada() {
    setCuentaDesactivada(false)
  }

  return (
    <AuthContext.Provider
      value={{ session, usuario, cargando, cuentaDesactivada, limpiarAvisoCuentaDesactivada, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
