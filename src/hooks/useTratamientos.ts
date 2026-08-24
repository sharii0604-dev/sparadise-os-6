import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface TratamientoCatalogo {
  id_tratamiento: string
  nombre: string
  duracion_minutos: number
  activo: boolean
  categoria_nombre: string
  consentimientosRequeridos: string[]
}

export function useTratamientos() {
  const [tratamientos, setTratamientos] = useState<TratamientoCatalogo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = (await supabase
        .from('tratamiento')
        .select(
          `id_tratamiento, nombre, duracion_minutos, activo,
           categoria:id_categoria ( nombre ),
           tratamiento_consentimiento_requerido ( tipo_consentimiento:id_tipo_consentimiento ( nombre ) )`
        )
        .order('nombre')) as any

      if (err) throw err

      setTratamientos(
        (data ?? []).map((t: any) => ({
          id_tratamiento: t.id_tratamiento,
          nombre: t.nombre,
          duracion_minutos: t.duracion_minutos,
          activo: t.activo,
          categoria_nombre: t.categoria?.nombre ?? '—',
          consentimientosRequeridos: (t.tratamiento_consentimiento_requerido ?? []).map(
            (r: any) => r.tipo_consentimiento?.nombre ?? '—'
          ),
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando tratamientos')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { tratamientos, cargando, error, recargar: cargar }
}
