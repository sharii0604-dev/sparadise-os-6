import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface RankingItem {
  nombre: string
  valor: number
}

interface DashboardData {
  ingresosMes: number
  ingresosSemana: number
  clientasNuevasMes: number
  sesionesRealizadasMes: number
  clientasVip: number
  interesSinSeguimiento: number
  citasProximos7Dias: number
  tratamientosMasSolicitados: RankingItem[]
  canalesLlegada: RankingItem[]
  cargando: boolean
  error: string | null
}

function inicioDeMes(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function hace7Dias(): string {
  const d = new Date(Date.now() - 7 * 86400000)
  return d.toISOString().slice(0, 10)
}
function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}
function en7Dias(): string {
  const d = new Date(Date.now() + 7 * 86400000)
  return d.toISOString().slice(0, 10)
}

export function useDashboardData(): DashboardData {
  const [ingresosMes, setIngresosMes] = useState(0)
  const [ingresosSemana, setIngresosSemana] = useState(0)
  const [clientasNuevasMes, setClientasNuevasMes] = useState(0)
  const [sesionesRealizadasMes, setSesionesRealizadasMes] = useState(0)
  const [clientasVip, setClientasVip] = useState(0)
  const [interesSinSeguimiento, setInteresSinSeguimiento] = useState(0)
  const [citasProximos7Dias, setCitasProximos7Dias] = useState(0)
  const [tratamientosMasSolicitados, setTratamientosMasSolicitados] = useState<RankingItem[]>([])
  const [canalesLlegada, setCanalesLlegada] = useState<RankingItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const inicioMes = inicioDeMes()

      const [
        abonosMesRes,
        abonosSemanaRes,
        clientasNuevasRes,
        sesionesRes,
        vipRes,
        interesRes,
        citasProximasRes,
        citasMesRes,
        clientasCanalRes,
      ] = await Promise.all([
        supabase.from('abono').select('monto').gte('fecha', inicioMes),
        supabase.from('abono').select('monto').gte('fecha', hace7Dias()),
        supabase.from('clienta').select('id_clienta', { count: 'exact', head: true }).gte('fecha_creacion', inicioMes),
        supabase.from('sesion_bitacora').select('id_sesion', { count: 'exact', head: true }).gte('fecha', inicioMes),
        supabase.from('clienta').select('id_clienta', { count: 'exact', head: true }).eq('es_vip', true),
        supabase
          .from('interes_consulta')
          .select('id_interes', { count: 'exact', head: true })
          .in('estado_seguimiento', ['nuevo', 'sin_respuesta']),
        supabase
          .from('cita')
          .select('id_cita', { count: 'exact', head: true })
          .gte('fecha', hoyISO())
          .lte('fecha', en7Dias())
          .neq('estado', 'cancelada'),
        supabase
          .from('cita')
          .select('id_tratamiento, tratamiento:id_tratamiento ( nombre )')
          .gte('fecha', inicioMes)
          .neq('estado', 'cancelada'),
        supabase.from('clienta').select('id_canal_llegada, canal:id_canal_llegada ( nombre )').gte('fecha_creacion', inicioMes),
      ])

      for (const r of [abonosMesRes, abonosSemanaRes, clientasNuevasRes, sesionesRes, vipRes, interesRes, citasProximasRes, citasMesRes, clientasCanalRes]) {
        if (r.error) throw r.error
      }

      setIngresosMes((abonosMesRes.data ?? []).reduce((acc: number, a: any) => acc + Number(a.monto), 0))
      setIngresosSemana((abonosSemanaRes.data ?? []).reduce((acc: number, a: any) => acc + Number(a.monto), 0))
      setClientasNuevasMes(clientasNuevasRes.count ?? 0)
      setSesionesRealizadasMes(sesionesRes.count ?? 0)
      setClientasVip(vipRes.count ?? 0)
      setInteresSinSeguimiento(interesRes.count ?? 0)
      setCitasProximos7Dias(citasProximasRes.count ?? 0)

      const conteoTratamientos = new Map<string, number>()
      for (const c of (citasMesRes.data ?? []) as any[]) {
        const nombre = c.tratamiento?.nombre ?? 'Sin especificar'
        conteoTratamientos.set(nombre, (conteoTratamientos.get(nombre) ?? 0) + 1)
      }
      setTratamientosMasSolicitados(
        [...conteoTratamientos.entries()]
          .map(([nombre, valor]) => ({ nombre, valor }))
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 5)
      )

      const conteoCanales = new Map<string, number>()
      for (const c of (clientasCanalRes.data ?? []) as any[]) {
        const nombre = c.canal?.nombre ?? 'Sin especificar'
        conteoCanales.set(nombre, (conteoCanales.get(nombre) ?? 0) + 1)
      }
      setCanalesLlegada(
        [...conteoCanales.entries()]
          .map(([nombre, valor]) => ({ nombre, valor }))
          .sort((a, b) => b.valor - a.valor)
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando el dashboard')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    ingresosMes,
    ingresosSemana,
    clientasNuevasMes,
    sesionesRealizadasMes,
    clientasVip,
    interesSinSeguimiento,
    citasProximos7Dias,
    tratamientosMasSolicitados,
    canalesLlegada,
    cargando,
    error,
  }
}
