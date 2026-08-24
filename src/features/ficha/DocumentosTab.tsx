import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SelectField, EstadoVacio, EstadoCargando } from '@/components/EstadosYFormularios'
import type { DocumentoConUrl } from '@/hooks/useStorageFicha'

interface DocumentosTabProps {
  documentos: DocumentoConUrl[]
  cargando: boolean
  onSubir: (archivo: File, datos: { idDocumentoTipo: number; notas: string }) => Promise<void>
  onExito: (msg: string) => void
  onError: (msg: string) => void
}

export function DocumentosTab({ documentos, cargando, onSubir, onExito, onError }: DocumentosTabProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [tiposDocumento, setTiposDocumento] = useState<{ id_documento_tipo: number; nombre: string }[]>([])
  const [idTipo, setIdTipo] = useState('')
  const [notas, setNotas] = useState('')
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    supabase
      .from('documento_tipo')
      .select('id_documento_tipo, nombre')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => setTiposDocumento(data ?? []))
  }, [])

  async function handleArchivoElegido(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (!idTipo) {
      onError('Selecciona primero el tipo de documento.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setSubiendo(true)
    try {
      await onSubir(archivo, { idDocumentoTipo: Number(idTipo), notas })
      setNotas('')
      onExito('Documento subido.')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo subir el documento.')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="card">
      {cargando && <EstadoCargando>Cargando documentos…</EstadoCargando>}
      {!cargando && documentos.length === 0 && <EstadoVacio>Sin documentos adjuntos todavía.</EstadoVacio>}
      {!cargando && documentos.length > 0 && (
        <div className="tabla-wrap" style={{ marginBottom: 20 }}>
          <table className="tabla">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id_documento}>
                  <td>{d.tipo_nombre}</td>
                  <td>{d.fecha_carga.slice(0, 10)}</td>
                  <td>{d.notas ?? '—'}</td>
                  <td>
                    {d.urlFirmada && (
                      <a href={d.urlFirmada} target="_blank" rel="noreferrer" className="btn-texto">
                        Ver
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="ficha-subtitulo">Subir nuevo documento</h3>
      <div className="campo-fila">
        <SelectField label="Tipo de documento" placeholder="Selecciona" value={idTipo} onChange={(e) => setIdTipo(e.target.value)}>
          {tiposDocumento.map((t) => (
            <option key={t.id_documento_tipo} value={t.id_documento_tipo}>
              {t.nombre}
            </option>
          ))}
        </SelectField>
        <div className="campo">
          <label htmlFor="notas-doc">Notas (opcional)</label>
          <input id="notas-doc" type="text" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>
      </div>
      <input ref={inputRef} type="file" onChange={handleArchivoElegido} disabled={subiendo} style={{ marginBottom: 14 }} />
      {subiendo && <p className="hint">Subiendo…</p>}
    </div>
  )
}
