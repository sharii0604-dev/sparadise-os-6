import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface ReglaRecordatorio {
  id_regla: string
  nombre: string
  tipo_condicion: string
  parametro_dias: number | null
  activa: boolean
  destinatario_nombre: string
}
export interface UsuarioEquipo {
  id_usuario: string
  nombre_completo: string
  correo: string
  rol_nombre: string
  estado: 'activo' | 'desactivado'
  fecha_ultimo_ingreso: string | null
}

export function useConfiguracionData() {
  const [reglas, setReglas] = useState<ReglaRecordatorio[]>([])
  const [equipo, setEquipo] = useState<UsuarioEquipo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [reglasRes, equipoRes] = await Promise.all([
        supabase
          .from('regla_recordatorio')
          .select('id_regla, nombre, tipo_condicion, parametro_dias, activa, destinatario:id_usuario_destinatario ( nombre_completo )'),
        supabase.from('usuario').select('id_usuario, nombre_completo, correo, estado, fecha_ultimo_ingreso, rol:id_rol ( nombre )').order('nombre_completo'),
      ] as any)

      if (reglasRes.error) throw reglasRes.error
      if (equipoRes.error) throw equipoRes.error

      setReglas(
        (reglasRes.data ?? []).map((r: any) => ({
          id_regla: r.id_regla,
          nombre: r.nombre,
          tipo_condicion: r.tipo_condicion,
          parametro_dias: r.parametro_dias,
          activa: r.activa,
          destinatario_nombre: r.destinatario?.nombre_completo ?? '—',
        }))
      )

      setEquipo(
        (equipoRes.data ?? []).map((u: any) => ({
          id_usuario: u.id_usuario,
          nombre_completo: u.nombre_completo,
          correo: u.correo,
          rol_nombre: u.rol?.nombre ?? '—',
          estado: u.estado,
          fecha_ultimo_ingreso: u.fecha_ultimo_ingreso,
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando configuración')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function alternarEstadoUsuario(idUsuario: string, nuevoEstado: 'activo' | 'desactivado') {
    // IMPORTANTE (verificado con SQL directo contra pg_policies, no supuesto):
    // la política `usuario_update_duena` es la única que permite modificar el
    // estado de OTRO usuario, y solo si el actor tiene rol.nombre = 'Dueña'.
    // Sin `.select()`, Postgrest devuelve 200 aunque RLS bloquee la fila (0
    // filas afectadas) y no hay forma de detectarlo — por eso se encadena
    // `.select().single()`: si RLS bloqueó la actualización, `single()` no
    // encuentra la fila y lanza un error real que sí podemos mostrar.
    const { error: err } = await supabase
      .from('usuario')
      .update({ estado: nuevoEstado })
      .eq('id_usuario', idUsuario)
      .select()
      .single()
    if (err) {
      throw new Error(
        err.code === 'PGRST116'
          ? 'No se pudo actualizar: solo el rol "Dueña" puede activar o desactivar el acceso de otro usuario.'
          : err.message
      )
    }
    await cargar()
  }

  return { reglas, equipo, cargando, error, recargar: cargar, alternarEstadoUsuario }
}
