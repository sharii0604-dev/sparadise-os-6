import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface CitaAgenda {
  id_cita: string
  id_clienta: string
  id_tratamiento: string
  id_usuario_terapeuta: string
  id_cabina: number
  fecha: string
  hora_inicio: string
  duracion_minutos: number
  estado: 'sin_confirmar' | 'confirmada' | 'completada' | 'cancelada'
  notas: string | null
  clienta_nombre: string
  tratamiento_nombre: string
  terapeuta_nombre: string
  cabina_nombre: string
  requiereConsentimientoFaltante: boolean
}

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function useAgendaDia(fecha: string) {
  const [citas, setCitas] = useState<CitaAgenda[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = (await supabase
        .from('cita')
        .select(
          `id_cita, id_clienta, id_tratamiento, id_usuario_terapeuta, id_cabina,
           fecha, hora_inicio, duracion_minutos, estado, notas,
           clienta:id_clienta ( nombre_completo ),
           tratamiento:id_tratamiento ( nombre, id_tratamiento ),
           terapeuta:id_usuario_terapeuta ( nombre_completo ),
           cabina:id_cabina ( nombre )`
        )
        .eq('fecha', fecha)
        .order('hora_inicio', { ascending: true })) as any

      if (err) throw err

      const citasRaw: any[] = data ?? []

      // Consentimientos requeridos por tratamiento presentes en el día, para
      // no hacer N consultas — se resuelve en un solo query adicional.
      const idsTratamiento = [...new Set(citasRaw.map((c) => c.id_tratamiento))]
      const idsClienta = [...new Set(citasRaw.map((c) => c.id_clienta))]

      const [requeridosRes, firmadosRes] = await Promise.all([
        idsTratamiento.length
          ? supabase
              .from('tratamiento_consentimiento_requerido')
              .select('id_tratamiento, id_tipo_consentimiento')
              .in('id_tratamiento', idsTratamiento)
          : Promise.resolve({ data: [], error: null }),
        idsClienta.length
          ? supabase
              .from('consentimiento')
              .select('id_clienta, id_tipo_consentimiento, estado')
              .in('id_clienta', idsClienta)
              .eq('estado', 'firmado')
          : Promise.resolve({ data: [], error: null }),
      ])
      if (requeridosRes.error) throw requeridosRes.error
      if (firmadosRes.error) throw firmadosRes.error

      const requeridosPorTratamiento = new Map<string, number[]>()
      for (const r of requeridosRes.data ?? []) {
        const lista = requeridosPorTratamiento.get(r.id_tratamiento) ?? []
        lista.push(r.id_tipo_consentimiento)
        requeridosPorTratamiento.set(r.id_tratamiento, lista)
      }
      const firmadosPorClienta = new Map<string, Set<number>>()
      for (const f of firmadosRes.data ?? []) {
        const set = firmadosPorClienta.get(f.id_clienta) ?? new Set<number>()
        set.add(f.id_tipo_consentimiento)
        firmadosPorClienta.set(f.id_clienta, set)
      }

      const citasFormateadas: CitaAgenda[] = citasRaw.map((c) => {
        const requeridos = requeridosPorTratamiento.get(c.id_tratamiento) ?? []
        const firmados = firmadosPorClienta.get(c.id_clienta) ?? new Set<number>()
        const faltaAlguno = requeridos.some((r) => !firmados.has(r))

        return {
          id_cita: c.id_cita,
          id_clienta: c.id_clienta,
          id_tratamiento: c.id_tratamiento,
          id_usuario_terapeuta: c.id_usuario_terapeuta,
          id_cabina: c.id_cabina,
          fecha: c.fecha,
          hora_inicio: c.hora_inicio,
          duracion_minutos: c.duracion_minutos,
          estado: c.estado,
          notas: c.notas,
          clienta_nombre: c.clienta?.nombre_completo ?? '—',
          tratamiento_nombre: c.tratamiento?.nombre ?? '—',
          terapeuta_nombre: c.terapeuta?.nombre_completo ?? '—',
          cabina_nombre: c.cabina?.nombre ?? '—',
          requiereConsentimientoFaltante: requeridos.length > 0 && faltaAlguno,
        }
      })

      citasFormateadas.sort((a, b) => minutosDesdeMedianoche(a.hora_inicio) - minutosDesdeMedianoche(b.hora_inicio))
      setCitas(citasFormateadas)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando la agenda')
    } finally {
      setCargando(false)
    }
  }, [fecha])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function confirmar(idCita: string) {
    const { error: err } = await supabase.from('cita').update({ estado: 'confirmada' }).eq('id_cita', idCita)
    if (err) throw err
    await cargar()
  }

  async function completar(idCita: string) {
    const { error: err } = await supabase.from('cita').update({ estado: 'completada' }).eq('id_cita', idCita)
    if (err) throw err
    await cargar()
  }

  async function cancelar(idCita: string, idMotivo: number) {
    const { error: err } = await supabase
      .from('cita')
      .update({ estado: 'cancelada', id_motivo_cancelacion: idMotivo })
      .eq('id_cita', idCita)
    if (err) throw err
    await cargar()
  }

  async function reprogramar(
    idCita: string,
    cambios: { fecha: string; hora_inicio: string; id_usuario_terapeuta: string; id_cabina: number; duracion_minutos: number }
  ) {
    const { error: err } = await supabase.from('cita').update(cambios).eq('id_cita', idCita)
    if (err) throw err
    await cargar()
  }

  return { citas, cargando, error, recargar: cargar, confirmar, completar, cancelar, reprogramar }
}

/** Ventana operativa del spa. No está fijada en los documentos entregados —
 * se usa 08:00–18:00 como valor por defecto razonable hasta que se confirme
 * el horario real de atención. */
export const HORA_APERTURA = 8 * 60
export const HORA_CIERRE = 18 * 60
export const PASO_MINUTOS = 30

/**
 * Calcula huecos reales disponibles para un terapeuta+cabina en una fecha,
 * a partir de las citas ya existentes (no canceladas) de ese recurso ese día.
 */
export async function calcularHuecosDisponibles(params: {
  fecha: string
  idTerapeuta: string
  idCabina: number
  duracionMinutos: number
}): Promise<{ hora: string; disponible: boolean }[]> {
  const { fecha, idTerapeuta, idCabina, duracionMinutos } = params

  const { data, error } = await supabase
    .from('cita')
    .select('hora_inicio, duracion_minutos, id_usuario_terapeuta, id_cabina')
    .eq('fecha', fecha)
    .neq('estado', 'cancelada')
    .or(`id_usuario_terapeuta.eq.${idTerapeuta},id_cabina.eq.${idCabina}`)

  if (error) throw error

  const ocupados: { inicio: number; fin: number }[] = (data ?? []).map((c: { hora_inicio: string; duracion_minutos: number }) => {
    const inicio = minutosDesdeMedianoche(c.hora_inicio)
    return { inicio, fin: inicio + c.duracion_minutos }
  })

  const slots: { hora: string; disponible: boolean }[] = []
  for (let t = HORA_APERTURA; t + duracionMinutos <= HORA_CIERRE; t += PASO_MINUTOS) {
    const finBloque = t + duracionMinutos
    const choca = ocupados.some((o: { inicio: number; fin: number }) => t < o.fin && finBloque > o.inicio)
    const h = String(Math.floor(t / 60)).padStart(2, '0')
    const m = String(t % 60).padStart(2, '0')
    slots.push({ hora: `${h}:${m}`, disponible: !choca })
  }
  return slots
}
