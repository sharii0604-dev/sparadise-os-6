import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface CitaHoy {
  id_cita: string
  hora_inicio: string
  estado: 'sin_confirmar' | 'confirmada' | 'completada' | 'cancelada'
  clienta_nombre: string
  tratamiento_nombre: string
  terapeuta_nombre: string
  numero_sesion: number | null
  sesiones_totales: number | null
}

export interface SeguimientoPendiente {
  id_interes: string
  clienta_nombre: string
  descripcion: string
}

export interface CumpleañosHoy {
  id_clienta: string
  nombre_completo: string
  clienta_desde: number
}

export interface CobroProgramado {
  id_paquete: string
  clienta_nombre: string
  concepto: string
  saldo: number
}

export interface PaqueteVencer {
  id_paquete: string
  clienta_nombre: string
  dias_restantes: number
  sesiones_restantes: number
}

interface HomeData {
  citasHoy: CitaHoy[]
  seguimientos: SeguimientoPendiente[]
  cumpleanos: CumpleañosHoy[]
  cobros: CobroProgramado[]
  paquetesPorVencer: PaqueteVencer[]
  cargando: boolean
  error: string | null
}

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useHomeData(): HomeData {
  const [citasHoy, setCitasHoy] = useState<CitaHoy[]>([])
  const [seguimientos, setSeguimientos] = useState<SeguimientoPendiente[]>([])
  const [cumpleanos, setCumpleanos] = useState<CumpleañosHoy[]>([])
  const [cobros, setCobros] = useState<CobroProgramado[]>([])
  const [paquetesPorVencer, setPaquetesPorVencer] = useState<PaqueteVencer[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    async function cargar() {
      setCargando(true)
      setError(null)
      const hoy = hoyISO()

      try {
        // Cast explícito: el archivo `types/database.ts` es un subconjunto manual
        // sin el arreglo `Relationships` que supabase-js usa para tipar selects
        // con recursos incrustados (`clienta:id_clienta(...)`). Sin ese arreglo,
        // el tipo inferido de estas consultas no es confiable — se castea aquí
        // a `any[]` y se tipa explícitamente en cada `.map()` de abajo, en vez
        // de dejar que el build dependa de una inferencia parcial. Se puede
        // quitar este cast cuando `database.ts` se regenere con la CLI de
        // Supabase (ver README).
        const [citasRes, seguimientosRes, clientasRes, paquetesRes] = (await Promise.all([
          // Citas de hoy, con clienta, tratamiento y terapeuta.
          supabase
            .from('cita')
            .select(
              `id_cita, hora_inicio, estado,
               clienta:id_clienta ( nombre_completo ),
               tratamiento:id_tratamiento ( nombre ),
               terapeuta:id_usuario_terapeuta ( nombre_completo ),
               paquete_detalle:id_paquete_detalle ( cantidad_sesiones_usadas, cantidad_sesiones_total )`
            )
            .eq('fecha', hoy)
            .neq('estado', 'cancelada')
            .order('hora_inicio', { ascending: true }),

          // Interés/consulta en seguimiento activo (sin cerrar).
          supabase
            .from('interes_consulta')
            .select(
              `id_interes, fecha, estado_seguimiento, observaciones,
               clienta:id_clienta ( nombre_completo )`
            )
            .in('estado_seguimiento', ['nuevo', 'en_seguimiento', 'agendo_valoracion'])
            .order('fecha', { ascending: true })
            .limit(5),

          // Todas las clientas con fecha de nacimiento — el cumpleaños de hoy
          // se filtra en el cliente porque no hay función de solo lectura
          // expuesta para esto (fn_proximo_cumpleanos no fue verificada como
          // segura para invocar desde el cliente en la auditoría de seguridad).
          supabase
            .from('clienta')
            .select('id_clienta, nombre_completo, fecha_nacimiento, fecha_creacion')
            .not('fecha_nacimiento', 'is', null),

          // Paquetes activos con vencimiento próximo, para "por vencer" y,
          // junto con sus abonos, para el saldo pendiente de "cobros".
          supabase
            .from('paquete')
            .select(
              `id_paquete, precio_total, fecha_vencimiento, estado, nombre,
               clienta:id_clienta ( nombre_completo ),
               paquete_detalle ( cantidad_sesiones_total, cantidad_sesiones_usadas ),
               abono ( monto )`
            )
            .eq('estado', 'activo'),
        ])) as any[]

        if (!activo) return

        if (citasRes.error) throw citasRes.error
        if (seguimientosRes.error) throw seguimientosRes.error
        if (clientasRes.error) throw clientasRes.error
        if (paquetesRes.error) throw paquetesRes.error

        // ---- Citas de hoy ----
        setCitasHoy(
          (citasRes.data ?? []).map((c: any) => ({
            id_cita: c.id_cita,
            hora_inicio: c.hora_inicio,
            estado: c.estado,
            clienta_nombre: c.clienta?.nombre_completo ?? '—',
            tratamiento_nombre: c.tratamiento?.nombre ?? '—',
            terapeuta_nombre: c.terapeuta?.nombre_completo ?? '—',
            numero_sesion: c.paquete_detalle ? c.paquete_detalle.cantidad_sesiones_usadas + 1 : null,
            sesiones_totales: c.paquete_detalle ? c.paquete_detalle.cantidad_sesiones_total : null,
          }))
        )

        // ---- Seguimientos pendientes ----
        const ETIQUETA_ESTADO: Record<string, string> = {
          nuevo: 'Contacto nuevo, sin seguimiento',
          en_seguimiento: 'En seguimiento',
          agendo_valoracion: 'Valoración agendada',
        }
        setSeguimientos(
          (seguimientosRes.data ?? []).map((i: any) => ({
            id_interes: i.id_interes,
            clienta_nombre: i.clienta?.nombre_completo ?? '—',
            descripcion: i.observaciones || ETIQUETA_ESTADO[i.estado_seguimiento] || i.estado_seguimiento,
          }))
        )

        // ---- Cumpleaños hoy ----
        const hoyDate = new Date()
        const mesHoy = hoyDate.getMonth() + 1
        const diaHoy = hoyDate.getDate()
        setCumpleanos(
          (clientasRes.data ?? [])
            .filter((c: any) => {
              if (!c.fecha_nacimiento) return false
              const [, mes, dia] = c.fecha_nacimiento.split('-').map(Number)
              return mes === mesHoy && dia === diaHoy
            })
            .map((c: any) => ({
              id_clienta: c.id_clienta,
              nombre_completo: c.nombre_completo,
              clienta_desde: new Date(c.fecha_creacion).getFullYear(),
            }))
        )

        // ---- Cobros programados y paquetes por vencer (derivados de `paquete`) ----
        // Nota: el esquema no tiene un concepto de "cobro programado" propio;
        // se interpreta como saldo pendiente de paquetes activos (precio_total
        // menos la suma de sus abonos), que es la lectura más cercana al
        // mockup sin inventar una tabla o campo que no existe.
        const cobrosCalculados: CobroProgramado[] = []
        const vencerCalculados: PaqueteVencer[] = []
        const hoyMs = hoyDate.setHours(0, 0, 0, 0)

        for (const p of (paquetesRes.data ?? []) as any[]) {
          const totalAbonado = (p.abono ?? []).reduce((acc: number, a: any) => acc + Number(a.monto), 0)
          const saldo = Number(p.precio_total) - totalAbonado
          if (saldo > 0) {
            cobrosCalculados.push({
              id_paquete: p.id_paquete,
              clienta_nombre: p.clienta?.nombre_completo ?? '—',
              concepto: p.nombre,
              saldo,
            })
          }

          if (p.fecha_vencimiento) {
            const vencMs = new Date(p.fecha_vencimiento).setHours(0, 0, 0, 0)
            const diasRestantes = Math.round((vencMs - hoyMs) / 86400000)
            if (diasRestantes >= 0 && diasRestantes <= 14) {
              const sesionesRestantes = (p.paquete_detalle ?? []).reduce(
                (acc: number, d: any) => acc + (d.cantidad_sesiones_total - d.cantidad_sesiones_usadas),
                0
              )
              vencerCalculados.push({
                id_paquete: p.id_paquete,
                clienta_nombre: p.clienta?.nombre_completo ?? '—',
                dias_restantes: diasRestantes,
                sesiones_restantes: sesionesRestantes,
              })
            }
          }
        }

        cobrosCalculados.sort((a, b) => b.saldo - a.saldo)
        vencerCalculados.sort((a, b) => a.dias_restantes - b.dias_restantes)

        setCobros(cobrosCalculados.slice(0, 5))
        setPaquetesPorVencer(vencerCalculados.slice(0, 5))
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'Error cargando el panel de bienvenida')
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [])

  return { citasHoy, seguimientos, cumpleanos, cobros, paquetesPorVencer, cargando, error }
}
