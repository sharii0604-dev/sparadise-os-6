import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface PaqueteConSaldo {
  id_paquete: string
  nombre: string
  estado: 'activo' | 'agotado' | 'vencido'
  precio_total: number
  totalAbonado: number
  saldo: number
  fecha_compra: string
  fecha_vencimiento: string | null
  clienta_nombre: string
  id_clienta: string
}

export type FiltroPagos = 'todos' | 'con_saldo' | 'vencidos'

export function usePagosData(filtro: FiltroPagos) {
  const [paquetes, setPaquetes] = useState<PaqueteConSaldo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = (await supabase
        .from('paquete')
        .select(
          `id_paquete, nombre, estado, precio_total, fecha_compra, fecha_vencimiento, id_clienta,
           clienta:id_clienta ( nombre_completo ),
           abono ( monto )`
        )
        .order('fecha_compra', { ascending: false })) as any

      if (err) throw err

      let lista: PaqueteConSaldo[] = (data ?? []).map((p: any) => {
        const totalAbonado = (p.abono ?? []).reduce((acc: number, a: any) => acc + Number(a.monto), 0)
        return {
          id_paquete: p.id_paquete,
          nombre: p.nombre,
          estado: p.estado,
          precio_total: Number(p.precio_total),
          totalAbonado,
          saldo: Number(p.precio_total) - totalAbonado,
          fecha_compra: p.fecha_compra,
          fecha_vencimiento: p.fecha_vencimiento,
          clienta_nombre: p.clienta?.nombre_completo ?? '—',
          id_clienta: p.id_clienta,
        }
      })

      if (filtro === 'con_saldo') lista = lista.filter((p) => p.saldo > 0)
      if (filtro === 'vencidos') lista = lista.filter((p) => p.estado === 'vencido')

      setPaquetes(lista)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando pagos')
    } finally {
      setCargando(false)
    }
  }, [filtro])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { paquetes, cargando, error, recargar: cargar }
}
