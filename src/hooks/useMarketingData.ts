import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface PublicacionContenido {
  id_publicacion: string
  red_social_nombre: string
  texto_post: string | null
  hashtags: string | null
  fecha_planeada: string
  estado: string
}
export interface FotoGaleria {
  id_foto: string
  url_archivo: string
  clienta_nombre: string
  fecha: string
  zona_corporal: string | null
}
export interface TestimonioItem {
  id_testimonio: string
  clienta_nombre: string
  texto: string
  fecha: string
  mostrar_nombre_completo: boolean
}
export interface PromocionItem {
  id_promocion: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
  tratamientos: string[]
}

export function useMarketingData() {
  const [publicaciones, setPublicaciones] = useState<PublicacionContenido[]>([])
  const [fotos, setFotos] = useState<FotoGaleria[]>([])
  const [testimonios, setTestimonios] = useState<TestimonioItem[]>([])
  const [promociones, setPromociones] = useState<PromocionItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [pubRes, fotoRes, testRes, promoRes] = await Promise.all([
        supabase
          .from('publicacion_contenido')
          .select('id_publicacion, texto_post, hashtags, fecha_planeada, estado, red_social:id_red_social ( nombre )')
          .order('fecha_planeada', { ascending: true }),
        supabase
          .from('foto_expediente')
          .select('id_foto, url_archivo, fecha, zona_corporal, clienta:id_clienta ( nombre_completo )')
          .eq('apta_marketing', true)
          .order('fecha', { ascending: false })
          .limit(24),
        supabase
          .from('testimonio')
          .select('id_testimonio, texto, fecha, mostrar_nombre_completo, clienta:id_clienta ( nombre_completo )')
          .order('fecha', { ascending: false }),
        supabase
          .from('promocion')
          .select('id_promocion, nombre, fecha_inicio, fecha_fin, estado, promocion_tratamiento ( tratamiento:id_tratamiento ( nombre ) )')
          .order('fecha_inicio', { ascending: false }),
      ] as any)

      if (pubRes.error) throw pubRes.error
      if (fotoRes.error) throw fotoRes.error
      if (testRes.error) throw testRes.error
      if (promoRes.error) throw promoRes.error

      setPublicaciones(
        (pubRes.data ?? []).map((p: any) => ({
          id_publicacion: p.id_publicacion,
          red_social_nombre: p.red_social?.nombre ?? '—',
          texto_post: p.texto_post,
          hashtags: p.hashtags,
          fecha_planeada: p.fecha_planeada,
          estado: p.estado,
        }))
      )

      setFotos(
        (fotoRes.data ?? []).map((f: any) => ({
          id_foto: f.id_foto,
          url_archivo: f.url_archivo,
          fecha: f.fecha,
          zona_corporal: f.zona_corporal,
          clienta_nombre: f.clienta?.nombre_completo ?? '—',
        }))
      )

      setTestimonios(
        (testRes.data ?? []).map((t: any) => ({
          id_testimonio: t.id_testimonio,
          texto: t.texto,
          fecha: t.fecha,
          mostrar_nombre_completo: t.mostrar_nombre_completo,
          clienta_nombre: t.mostrar_nombre_completo ? t.clienta?.nombre_completo ?? '—' : 'Clienta anónima',
        }))
      )

      setPromociones(
        (promoRes.data ?? []).map((p: any) => ({
          id_promocion: p.id_promocion,
          nombre: p.nombre,
          fecha_inicio: p.fecha_inicio,
          fecha_fin: p.fecha_fin,
          estado: p.estado,
          tratamientos: (p.promocion_tratamiento ?? []).map((r: any) => r.tratamiento?.nombre ?? '—'),
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando marketing')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { publicaciones, fotos, testimonios, promociones, cargando, error, recargar: cargar }
}
