import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface InteresPendiente {
  id_interes: string
  clienta_nombre: string
  dias_sin_seguimiento: number
  tratamiento_nombre: string
}
export interface ValoracionPendiente {
  id_evaluacion: string
  clienta_nombre: string
  fecha: string
}
export interface PaqueteVencerIA {
  id_paquete: string
  clienta_nombre: string
  dias_restantes: number
}
export interface DiaConMenosCitas {
  diaSemana: string
  promedioCitas: number
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function useCentroInteligencia() {
  const [interesSinAgendar, setInteresSinAgendar] = useState<InteresPendiente[]>([])
  const [valoracionesPendientes, setValoracionesPendientes] = useState<ValoracionPendiente[]>([])
  const [paquetesPorVencer, setPaquetesPorVencer] = useState<PaqueteVencerIA[]>([])
  const [diasConMenosCitas, setDiasConMenosCitas] = useState<DiaConMenosCitas[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const hace60Dias = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)
      const hoy = new Date().toISOString().slice(0, 10)

      const [interesRes, evalRes, paquetesRes, citasHistRes] = await Promise.all([
        supabase
          .from('interes_consulta')
          .select('id_interes, fecha, clienta:id_clienta ( nombre_completo ), tratamiento:id_tratamiento ( nombre )')
          .in('estado_seguimiento', ['nuevo', 'en_seguimiento', 'sin_respuesta'])
          .order('fecha', { ascending: true }),
        supabase
          .from('evaluacion_inicial')
          .select('id_evaluacion, fecha, clienta:id_clienta ( nombre_completo )')
          .eq('estado_valoracion', 'lo_esta_pensando')
          .order('fecha', { ascending: true }),
        supabase
          .from('paquete')
          .select('id_paquete, fecha_vencimiento, clienta:id_clienta ( nombre_completo )')
          .eq('estado', 'activo')
          .not('fecha_vencimiento', 'is', null),
        supabase.from('cita').select('fecha').gte('fecha', hace60Dias).neq('estado', 'cancelada'),
      ] as any)

      if (interesRes.error) throw interesRes.error
      if (evalRes.error) throw evalRes.error
      if (paquetesRes.error) throw paquetesRes.error
      if (citasHistRes.error) throw citasHistRes.error

      const hoyMs = new Date(hoy).getTime()

      setInteresSinAgendar(
        (interesRes.data ?? []).map((i: any) => ({
          id_interes: i.id_interes,
          clienta_nombre: i.clienta?.nombre_completo ?? '—',
          tratamiento_nombre: i.tratamiento?.nombre ?? 'Sin especificar',
          dias_sin_seguimiento: Math.floor((hoyMs - new Date(i.fecha).getTime()) / 86400000),
        }))
      )

      setValoracionesPendientes(
        (evalRes.data ?? []).map((e: any) => ({
          id_evaluacion: e.id_evaluacion,
          clienta_nombre: e.clienta?.nombre_completo ?? '—',
          fecha: e.fecha,
        }))
      )

      const vencerCalculado: PaqueteVencerIA[] = (paquetesRes.data ?? [])
        .map((p: any) => ({
          id_paquete: p.id_paquete,
          clienta_nombre: p.clienta?.nombre_completo ?? '—',
          dias_restantes: Math.round((new Date(p.fecha_vencimiento).getTime() - hoyMs) / 86400000),
        }))
        .filter((p: PaqueteVencerIA) => p.dias_restantes >= 0 && p.dias_restantes <= 14)
        .sort((a: PaqueteVencerIA, b: PaqueteVencerIA) => a.dias_restantes - b.dias_restantes)
      setPaquetesPorVencer(vencerCalculado)

      // Promedio de citas por día de la semana en los últimos 60 días.
      const conteoPorDia = new Array(7).fill(0)
      for (const c of (citasHistRes.data ?? []) as any[]) {
        const diaSemana = new Date(c.fecha + 'T00:00:00').getDay()
        conteoPorDia[diaSemana]++
      }
      // Aproximación simple: 60 días ≈ 8.5 semanas por cada día de la semana.
      const semanasAprox = 60 / 7
      const promedios: DiaConMenosCitas[] = DIAS_SEMANA.map((nombre, i) => ({
        diaSemana: nombre,
        promedioCitas: Math.round((conteoPorDia[i] / semanasAprox) * 10) / 10,
      }))
      promedios.sort((a, b) => a.promedioCitas - b.promedioCitas)
      setDiasConMenosCitas(promedios)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando el Centro de Inteligencia')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { interesSinAgendar, valoracionesPendientes, paquetesPorVencer, diasConMenosCitas, cargando, error, recargar: cargar }
}
