import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Panel } from '@/components/Panel'
import { SelectField, TextAreaField, TextField } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'

interface RedSocial {
  id_red_social: number
  nombre: string
}

interface NuevaPublicacionPanelProps {
  abierto: boolean
  onCerrar: () => void
  onCreada: () => void
  redesSociales: RedSocial[]
}

export function NuevaPublicacionPanel({ abierto, onCerrar, onCreada, redesSociales }: NuevaPublicacionPanelProps) {
  const [idRed, setIdRed] = useState('')
  const [texto, setTexto] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [fecha, setFecha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCrear() {
    if (!idRed || !fecha) {
      setError('La red social y la fecha planeada son obligatorias.')
      return
    }
    setEnviando(true)
    setError(null)
    const { error: err } = await supabase.from('publicacion_contenido').insert({
      id_red_social: Number(idRed),
      texto_post: texto || null,
      hashtags: hashtags || null,
      fecha_planeada: fecha,
      estado: 'idea',
    })
    setEnviando(false)
    if (err) {
      setError(`No se pudo crear la publicación: ${err.message}`)
      return
    }
    setIdRed('')
    setTexto('')
    setHashtags('')
    setFecha('')
    onCreada()
    onCerrar()
  }

  return (
    <Panel titulo="Nueva publicación" abierto={abierto} onCerrar={onCerrar}>
      <div className="campo-fila">
        <SelectField label="Red social" required placeholder="Selecciona" value={idRed} onChange={(e) => setIdRed(e.target.value)}>
          {redesSociales.map((r) => (
            <option key={r.id_red_social} value={r.id_red_social}>
              {r.nombre}
            </option>
          ))}
        </SelectField>
        <TextField label="Fecha planeada" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <TextAreaField label="Texto del post" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <TextField label="Hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#sparadise #bienestar" />

      {error && <div className="form-error">{error}</div>}

      <div className="panel-acciones">
        <button type="button" className="btn-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <PrimaryButton onClick={handleCrear} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Crear publicación'}
        </PrimaryButton>
      </div>
    </Panel>
  )
}
