import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface ClientaListado {
  id_clienta: string
  nombre_completo: string
  telefono: string
  correo: string | null
  identificacion: string | null
  es_vip: boolean
  fecha_ultima_visita: string | null
  canal_nombre: string
}

export type FiltroClientas = 'todas' | 'vip' | 'activas' | 'sin_visitas'

function diasDesde(fechaISO: string): number {
  return Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000)
}

export function useClientasListado(termino: string, filtro: FiltroClientas) {
  const [clientas, setClientas] = useState<ClientaListado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      let query = supabase
        .from('clienta')
        .select(
          `id_clienta, nombre_completo, telefono, correo, identificacion, es_vip, fecha_ultima_visita,
           canal:id_canal_llegada ( nombre )`
        )
        .order('nombre_completo')

      if (termino.trim().length >= 2) {
        const q = termino.trim()
        query = query.or(`nombre_completo.ilike.%${q}%,telefono.ilike.%${q}%,identificacion.ilike.%${q}%,correo.ilike.%${q}%`)
      }
      if (filtro === 'vip') query = query.eq('es_vip', true)

      const { data, error: err } = (await query) as any
      if (err) throw err

      let lista: ClientaListado[] = (data ?? []).map((c: any) => ({
        id_clienta: c.id_clienta,
        nombre_completo: c.nombre_completo,
        telefono: c.telefono,
        correo: c.correo,
        identificacion: c.identificacion,
        es_vip: c.es_vip,
        fecha_ultima_visita: c.fecha_ultima_visita,
        canal_nombre: c.canal?.nombre ?? '—',
      }))

      // "Activas" (última visita ≤ 30 días) / "Sin visitas" se calculan en
      // cliente porque dependen de una comparación de fechas relativa a hoy.
      if (filtro === 'activas') {
        lista = lista.filter((c) => c.fecha_ultima_visita && diasDesde(c.fecha_ultima_visita) <= 30)
      } else if (filtro === 'sin_visitas') {
        lista = lista.filter((c) => !c.fecha_ultima_visita)
      }

      setClientas(lista)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando clientas')
    } finally {
      setCargando(false)
    }
  }, [termino, filtro])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { clientas, cargando, error, recargar: cargar }
}
