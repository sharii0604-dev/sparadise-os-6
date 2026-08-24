import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Panel } from '@/components/Panel'
import { TextField, SelectField } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import type { CatalogoCategoriaTratamiento } from '@/hooks/useCatalogos'

interface NuevoTratamientoPanelProps {
  abierto: boolean
  onCerrar: () => void
  onCreado: () => void
  categorias: CatalogoCategoriaTratamiento[]
}

export function NuevoTratamientoPanel({ abierto, onCerrar, onCreado, categorias }: NuevoTratamientoPanelProps) {
  const [nombre, setNombre] = useState('')
  const [idCategoria, setIdCategoria] = useState('')
  const [duracion, setDuracion] = useState(60)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCrear() {
    if (!nombre.trim() || !idCategoria || !duracion) {
      setError('Nombre, categoría y duración son obligatorios.')
      return
    }
    setEnviando(true)
    setError(null)
    const { error: err } = await supabase.from('tratamiento').insert({
      nombre: nombre.trim(),
      id_categoria: Number(idCategoria),
      duracion_minutos: duracion,
      activo: true,
    })
    setEnviando(false)
    if (err) {
      setError(`No se pudo crear el tratamiento: ${err.message}`)
      return
    }
    setNombre('')
    setIdCategoria('')
    setDuracion(60)
    onCreado()
    onCerrar()
  }

  return (
    <Panel titulo="Nuevo tratamiento" abierto={abierto} onCerrar={onCerrar}>
      <TextField label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <div className="campo-fila">
        <SelectField label="Categoría" required placeholder="Selecciona" value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)}>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </SelectField>
        <TextField label="Duración (min)" type="number" min={15} step={5} value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} />
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel-acciones">
        <button type="button" className="btn-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <PrimaryButton onClick={handleCrear} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Crear tratamiento'}
        </PrimaryButton>
      </div>
    </Panel>
  )
}
