import { useRef, useState, type ChangeEvent } from 'react'
import { EstadoVacio, EstadoCargando } from '@/components/EstadosYFormularios'
import type { FotoConUrl } from '@/hooks/useStorageFicha'

interface FotosTabProps {
  fotos: FotoConUrl[]
  cargando: boolean
  onSubir: (archivo: File, datos: { zona_corporal: string; apta_marketing: boolean }) => Promise<void>
  onExito: (msg: string) => void
  onError: (msg: string) => void
}

export function FotosTab({ fotos, cargando, onSubir, onExito, onError }: FotosTabProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [zona, setZona] = useState('')
  const [aptaMarketing, setAptaMarketing] = useState(false)
  const [subiendo, setSubiendo] = useState(false)

  async function handleArchivoElegido(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)
    try {
      await onSubir(archivo, { zona_corporal: zona, apta_marketing: aptaMarketing })
      setZona('')
      setAptaMarketing(false)
      onExito('Foto subida al expediente.')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo subir la foto.')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="card">
      {cargando && <EstadoCargando>Cargando fotos…</EstadoCargando>}
      {!cargando && fotos.length === 0 && <EstadoVacio>Sin fotos en el expediente todavía.</EstadoVacio>}
      {!cargando && fotos.length > 0 && (
        <div className="galeria-grid" style={{ marginBottom: 20 }}>
          {fotos.map((f) => (
            <div key={f.id_foto} className="galeria-item">
              {f.urlFirmada ? <img src={f.urlFirmada} alt={`Foto de expediente ${f.fecha}`} loading="lazy" /> : <div className="hint">Sin vista previa</div>}
              <div className="galeria-item__pie">
                {f.fecha} {f.zona_corporal && `· ${f.zona_corporal}`} {f.apta_marketing && '· apta marketing'}
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="ficha-subtitulo">Subir nueva foto</h3>
      <div className="campo-fila">
        <div className="campo">
          <label htmlFor="zona-foto">Zona corporal (opcional)</label>
          <input id="zona-foto" type="text" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Ej. abdomen" />
        </div>
        <div className="campo" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 400 }}>
            <input type="checkbox" checked={aptaMarketing} onChange={(e) => setAptaMarketing(e.target.checked)} />
            Apta para marketing
          </label>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleArchivoElegido} disabled={subiendo} style={{ marginBottom: 14 }} />
      {subiendo && <p className="hint">Subiendo…</p>}
    </div>
  )
}
