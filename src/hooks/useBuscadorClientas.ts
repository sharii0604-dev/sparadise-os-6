import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface ClientaResultado {
  id_clienta: string
  nombre_completo: string
  telefono: string
  identificacion: string | null
}

/** Búsqueda con debounce por nombre, identificación o teléfono. */
export function useBuscadorClientas(termino: string) {
  const [resultados, setResultados] = useState<ClientaResultado[]>([])
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    if (termino.trim().length < 2) {
      setResultados([])
      return
    }
    let activo = true
    setBuscando(true)
    const t = setTimeout(async () => {
      const q = termino.trim()
      const { data, error } = await supabase
        .from('clienta')
        .select('id_clienta, nombre_completo, telefono, identificacion')
        .or(`nombre_completo.ilike.%${q}%,telefono.ilike.%${q}%,identificacion.ilike.%${q}%`)
        .order('nombre_completo')
        .limit(8)
      if (!activo) return
      if (!error) setResultados(data ?? [])
      setBuscando(false)
    }, 300)

    return () => {
      activo = false
      clearTimeout(t)
    }
  }, [termino])

  return { resultados, buscando }
}
