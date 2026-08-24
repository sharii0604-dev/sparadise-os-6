import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface FotoConUrl {
  id_foto: string
  fecha: string
  zona_corporal: string | null
  apta_marketing: boolean
  urlFirmada: string | null
}
export interface DocumentoConUrl {
  id_documento: string
  fecha_carga: string
  notas: string | null
  tipo_nombre: string
  urlFirmada: string | null
}

const SEGUNDOS_URL_FIRMADA = 60 * 10 // 10 minutos — solo para verla/descargarla en la sesión actual

export function useStorageFicha(idClienta: string | undefined) {
  const [fotos, setFotos] = useState<FotoConUrl[]>([])
  const [documentos, setDocumentos] = useState<DocumentoConUrl[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!idClienta) return
    setCargando(true)
    setError(null)
    try {
      const [fotosRes, documentosRes] = await Promise.all([
        supabase
          .from('foto_expediente')
          .select('id_foto, url_archivo, fecha, zona_corporal, apta_marketing')
          .eq('id_clienta', idClienta)
          .eq('estado', 'activa')
          .order('fecha', { ascending: false }),
        supabase
          .from('documento_adjunto')
          .select('id_documento, url_archivo, fecha_carga, notas, tipo:id_documento_tipo ( nombre )')
          .eq('id_clienta', idClienta)
          .order('fecha_carga', { ascending: false }),
      ])

      if (fotosRes.error) throw fotosRes.error
      if (documentosRes.error) throw documentosRes.error

      const fotosConUrl = await Promise.all(
        (fotosRes.data ?? []).map(
          async (f: { id_foto: string; url_archivo: string; fecha: string; zona_corporal: string | null; apta_marketing: boolean }) => {
            const { data: urlData } = await supabase.storage.from('fotos-expediente').createSignedUrl(f.url_archivo, SEGUNDOS_URL_FIRMADA)
            return {
              id_foto: f.id_foto,
              fecha: f.fecha,
              zona_corporal: f.zona_corporal,
              apta_marketing: f.apta_marketing,
              urlFirmada: urlData?.signedUrl ?? null,
            }
          }
        )
      )
      setFotos(fotosConUrl)

      const documentosConUrl = await Promise.all(
        ((documentosRes.data ?? []) as any[]).map(async (d) => {
          const { data: urlData } = await supabase.storage.from('documentos-adjuntos').createSignedUrl(d.url_archivo, SEGUNDOS_URL_FIRMADA)
          return {
            id_documento: d.id_documento,
            fecha_carga: d.fecha_carga,
            notas: d.notas,
            tipo_nombre: d.tipo?.nombre ?? '—',
            urlFirmada: urlData?.signedUrl ?? null,
          }
        })
      )
      setDocumentos(documentosConUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando archivos')
    } finally {
      setCargando(false)
    }
  }, [idClienta])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function subirFoto(archivo: File, datos: { zona_corporal: string; apta_marketing: boolean }) {
    if (!idClienta) return
    const rutaArchivo = `${idClienta}/${Date.now()}-${archivo.name}`
    const { error: errUpload } = await supabase.storage.from('fotos-expediente').upload(rutaArchivo, archivo)
    if (errUpload) throw new Error(`No se pudo subir la foto: ${errUpload.message}`)

    const { error: errInsert } = await supabase.from('foto_expediente').insert({
      id_clienta: idClienta,
      url_archivo: rutaArchivo,
      zona_corporal: datos.zona_corporal || null,
      apta_marketing: datos.apta_marketing,
      estado: 'activa',
    })
    if (errInsert) throw new Error(`La foto se subió, pero no se pudo registrar en el expediente: ${errInsert.message}`)
    await cargar()
  }

  async function subirDocumento(archivo: File, datos: { idDocumentoTipo: number; notas: string }) {
    if (!idClienta) return
    const rutaArchivo = `${idClienta}/${Date.now()}-${archivo.name}`
    const { error: errUpload } = await supabase.storage.from('documentos-adjuntos').upload(rutaArchivo, archivo)
    if (errUpload) throw new Error(`No se pudo subir el documento: ${errUpload.message}`)

    const { error: errInsert } = await supabase.from('documento_adjunto').insert({
      id_clienta: idClienta,
      id_documento_tipo: datos.idDocumentoTipo,
      url_archivo: rutaArchivo,
      notas: datos.notas || null,
    })
    if (errInsert) throw new Error(`El documento se subió, pero no se pudo registrar: ${errInsert.message}`)
    await cargar()
  }

  return { fotos, documentos, cargando, error, recargar: cargar, subirFoto, subirDocumento }
}
