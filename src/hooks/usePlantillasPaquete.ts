import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface DetallePlantilla {
  id_tratamiento: string
  tratamiento_nombre: string
  cantidad_sesiones: number
}
export interface PlantillaPaquete {
  id_plantilla_paquete: string
  nombre: string
  precio_sugerido: number | null
  detalles: DetallePlantilla[]
}

export function usePlantillasPaquete() {
  const [plantillas, setPlantillas] = useState<PlantillaPaquete[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data } = await supabase
      .from('plantilla_paquete')
      .select(
        `id_plantilla_paquete, nombre, precio_sugerido, activa,
         plantilla_paquete_detalle ( id_tratamiento, cantidad_sesiones, tratamiento:id_tratamiento ( nombre ) )`
      )
      .eq('activa', true)

    setPlantillas(
      ((data ?? []) as any[]).map((p) => ({
        id_plantilla_paquete: p.id_plantilla_paquete,
        nombre: p.nombre,
        precio_sugerido: p.precio_sugerido !== null ? Number(p.precio_sugerido) : null,
        detalles: (p.plantilla_paquete_detalle ?? []).map((d: any) => ({
          id_tratamiento: d.id_tratamiento,
          tratamiento_nombre: d.tratamiento?.nombre ?? '—',
          cantidad_sesiones: d.cantidad_sesiones,
        })),
      }))
    )
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { plantillas, cargando, recargar: cargar }
}
