import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import '@/components/components.css'
import './LoginPage.css'

type Modo = 'ingresar' | 'recuperar'

export function LoginPage() {
  const { session, cargando, cuentaDesactivada, limpiarAvisoCuentaDesactivada } = useAuth()
  const [modo, setModo] = useState<Modo>('ingresar')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState<string | null>(null)

  if (!cargando && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    limpiarAvisoCuentaDesactivada()
    setEnviando(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    })

    setEnviando(false)

    if (authError) {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.')
    }
    // Si no hay error, onAuthStateChange en AuthProvider actualiza la sesión
    // y <Navigate> de arriba redirige automáticamente al render siguiente.
  }

  async function handleRecuperar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMensajeRecuperacion(null)
    setEnviando(true)

    const { error: authError } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/login`,
    })

    setEnviando(false)

    if (authError) {
      setError('No se pudo enviar el correo de recuperación. Verifica el correo e intenta de nuevo.')
      return
    }
    setMensajeRecuperacion('Si el correo existe en Sparadise OS, te enviamos un enlace para restablecer la contraseña.')
  }

  return (
    <div className="login-pantalla">
      <div className="login-tarjeta">
        <div className="login-logo">
          <b>Spa</b>radise OS
        </div>
        <p className="login-sub">{modo === 'ingresar' ? 'Inicia sesión para continuar' : 'Recupera el acceso a tu cuenta'}</p>

        {error && <div className="form-error">{error}</div>}
        {cuentaDesactivada && !error && (
          <div className="form-error">
            Tu acceso a Sparadise OS fue desactivado. Contacta a un administrador si crees que es un error.
          </div>
        )}
        {mensajeRecuperacion && <div className="form-error" style={{ background: 'var(--exito-bg)', borderLeftColor: 'var(--exito)' }}>{mensajeRecuperacion}</div>}

        {modo === 'ingresar' ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="campo">
              <label htmlFor="correo">Correo</label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tucorreo@sparadise.com"
              />
            </div>
            <div className="campo">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-primario login-submit" disabled={enviando}>
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </button>
            <button
              type="button"
              className="btn-texto login-olvido"
              onClick={() => {
                setModo('recuperar')
                setError(null)
                setMensajeRecuperacion(null)
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form onSubmit={handleRecuperar} noValidate>
            <div className="campo">
              <label htmlFor="correo-recuperar">Correo</label>
              <input
                id="correo-recuperar"
                type="email"
                autoComplete="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tucorreo@sparadise.com"
              />
            </div>
            <button type="submit" className="btn-primario login-submit" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>
            <button
              type="button"
              className="btn-texto login-olvido"
              onClick={() => {
                setModo('ingresar')
                setError(null)
                setMensajeRecuperacion(null)
              }}
            >
              Volver a iniciar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
