import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface CatalogoTratamiento {
  id_tratamiento: string
  nombre: string
  duracion_minutos: number
  id_categoria: number
  activo: boolean
}
export interface CatalogoCabina {
  id_cabina: number
  nombre: string
  activa: boolean
}
export interface CatalogoTerapeuta {
  id_usuario: string
  nombre_completo: string
}
export interface CatalogoMetodoPago {
  id_metodo_pago: number
  nombre: string
}
export interface CatalogoCanalLlegada {
  id_canal_llegada: number
  nombre: string
}
export interface CatalogoMotivoCancelacion {
  id_motivo_cancelacion: number
  nombre: string
}
export interface CatalogoCategoriaTratamiento {
  id_categoria: number
  nombre: string
}

interface Catalogos {
  tratamientos: CatalogoTratamiento[]
  cabinas: CatalogoCabina[]
  terapeutas: CatalogoTerapeuta[]
  metodosPago: CatalogoMetodoPago[]
  canalesLlegada: CatalogoCanalLlegada[]
  motivosCancelacion: CatalogoMotivoCancelacion[]
  categoriasTratamiento: CatalogoCategoriaTratamiento[]
  cargando: boolean
  error: string | null
}

/**
 * Catálogos "de apoyo" compartidos por varios módulos (Agenda, Clientas,
 * Pagos, Tratamientos). Se cargan una sola vez por sesión de la pantalla que
 * los usa — son tablas pequeñas y de baja frecuencia de cambio.
 */
export function useCatalogos(): Catalogos {
  const [tratamientos, setTratamientos] = useState<CatalogoTratamiento[]>([])
  const [cabinas, setCabinas] = useState<CatalogoCabina[]>([])
  const [terapeutas, setTerapeutas] = useState<CatalogoTerapeuta[]>([])
  const [metodosPago, setMetodosPago] = useState<CatalogoMetodoPago[]>([])
  const [canalesLlegada, setCanalesLlegada] = useState<CatalogoCanalLlegada[]>([])
  const [motivosCancelacion, setMotivosCancelacion] = useState<CatalogoMotivoCancelacion[]>([])
  const [categoriasTratamiento, setCategoriasTratamiento] = useState<CatalogoCategoriaTratamiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      try {
        const [t, c, u, mp, cl, mc, ct] = await Promise.all([
          supabase.from('tratamiento').select('id_tratamiento, nombre, duracion_minutos, id_categoria, activo').eq('activo', true).order('nombre'),
          supabase.from('cabina').select('id_cabina, nombre, activa').eq('activa', true).order('nombre'),
          // Terapeutas = todo el equipo activo. El esquema no distingue un rol
          // "terapeuta" específico en `rol` más allá del nombre; se listan
          // todos los usuarios activos como recurso asignable, consistente
          // con el comentario de diseño de `rol` ("hoy sin diferencias de
          // permisos").
          supabase.from('usuario').select('id_usuario, nombre_completo').eq('estado', 'activo').order('nombre_completo'),
          supabase.from('metodo_pago').select('id_metodo_pago, nombre').eq('activo', true).order('nombre'),
          supabase.from('canal_llegada').select('id_canal_llegada, nombre').eq('activo', true).order('nombre'),
          supabase.from('motivo_cancelacion').select('id_motivo_cancelacion, nombre').eq('activo', true).order('nombre'),
          supabase.from('categoria_tratamiento').select('id_categoria, nombre').eq('activa', true).order('nombre'),
        ])
        if (!activo) return
        for (const r of [t, c, u, mp, cl, mc, ct]) {
          if (r.error) throw r.error
        }
        setTratamientos(t.data ?? [])
        setCabinas(c.data ?? [])
        setTerapeutas(u.data ?? [])
        setMetodosPago(mp.data ?? [])
        setCanalesLlegada(cl.data ?? [])
        setMotivosCancelacion(mc.data ?? [])
        setCategoriasTratamiento(ct.data ?? [])
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'Error cargando catálogos')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => {
      activo = false
    }
  }, [])

  return {
    tratamientos,
    cabinas,
    terapeutas,
    metodosPago,
    canalesLlegada,
    motivosCancelacion,
    categoriasTratamiento,
    cargando,
    error,
  }
}
