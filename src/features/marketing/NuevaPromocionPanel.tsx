import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Panel } from '@/components/Panel'
import { TextField } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import type { CatalogoTratamiento } from '@/hooks/useCatalogos'

interface NuevaPromocionPanelProps {
  abierto: boolean
  onCerrar: () => void
  onCreada: () => void
  tratamientos: CatalogoTratamiento[]
}

export function NuevaPromocionPanel({ abierto, onCerrar, onCreada, tratamientos }: NuevaPromocionPanelProps) {
  const [nombre, setNombre] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [idsTratamiento, setIdsTratamiento] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function alternar(id: string) {
    setIdsTratamiento((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleCrear() {
    if (!nombre.trim() || !fechaInicio || !fechaFin) {
      setError('Nombre, fecha de inicio y fecha de fin son obligatorios.')
      return
    }
    setEnviando(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('promocion')
      .insert({ nombre: nombre.trim(), fecha_inicio: fechaInicio, fecha_fin: fechaFin, estado: 'programada' })
      .select('id_promocion')
      .single()

    if (err || !data) {
      setEnviando(false)
      setError(`No se pudo crear la promoción: ${err?.message ?? 'error desconocido'}`)
      return
    }

    if (idsTratamiento.length > 0) {
      const filas = idsTratamiento.map((id) => ({ id_promocion: data.id_promocion, id_tratamiento: id }))
      const { error: errRel } = await supabase.from('promocion_tratamiento').insert(filas)
      if (errRel) {
        setEnviando(false)
        setError(`La promoción se creó, pero no se pudieron asociar los tratamientos: ${errRel.message}`)
        return
      }
    }

    setEnviando(false)
    setNombre('')
    setFechaInicio('')
    setFechaFin('')
    setIdsTratamiento([])
    onCreada()
    onCerrar()
  }

  return (
    <Panel titulo="Nueva promoción" abierto={abierto} onCerrar={onCerrar}>
      <TextField label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <div className="campo-fila">
        <TextField label="Fecha de inicio" type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        <TextField label="Fecha de fin" type="date" required value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
      </div>

      <div className="campo">
        <label>Tratamientos incluidos</label>
        <ul className="lista-chips">
          {tratamientos.map((t) => (
            <li key={t.id_tratamiento}>
              <button
                type="button"
                className={`chip-toggle${idsTratamiento.includes(t.id_tratamiento) ? ' chip-toggle--activo' : ''}`}
                onClick={() => alternar(t.id_tratamiento)}
              >
                {t.nombre}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel-acciones">
        <button type="button" className="btn-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <PrimaryButton onClick={handleCrear} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Crear promoción'}
        </PrimaryButton>
      </div>
    </Panel>
  )
}
