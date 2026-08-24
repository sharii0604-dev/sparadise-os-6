import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Panel } from '@/components/Panel'
import { TextField } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import type { CatalogoTratamiento } from '@/hooks/useCatalogos'
import '@/features/agenda/NuevaCitaPanel.css'
import './NuevaPlantillaPanel.css'

interface FilaTratamiento {
  idTratamiento: string
  cantidadSesiones: string
}

interface NuevaPlantillaPanelProps {
  abierto: boolean
  onCerrar: () => void
  onCreada: () => void
  tratamientos: CatalogoTratamiento[]
}

const FILA_VACIA: FilaTratamiento = { idTratamiento: '', cantidadSesiones: '' }

export function NuevaPlantillaPanel({ abierto, onCerrar, onCreada, tratamientos }: NuevaPlantillaPanelProps) {
  const [nombre, setNombre] = useState('')
  const [precioSugerido, setPrecioSugerido] = useState('')
  const [filas, setFilas] = useState<FilaTratamiento[]>([{ ...FILA_VACIA }])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function actualizarFila(i: number, campo: keyof FilaTratamiento, valor: string) {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)))
  }

  function agregarFila() {
    setFilas((prev) => [...prev, { ...FILA_VACIA }])
  }

  function quitarFila(i: number) {
    setFilas((prev) => prev.filter((_, idx) => idx !== i))
  }

  function resetear() {
    setNombre('')
    setPrecioSugerido('')
    setFilas([{ ...FILA_VACIA }])
    setError(null)
  }

  async function handleCrear() {
    const filasValidas = filas.filter((f) => f.idTratamiento && Number(f.cantidadSesiones) > 0)

    if (!nombre.trim()) {
      setError('El nombre del paquete es obligatorio.')
      return
    }
    if (filasValidas.length === 0) {
      setError('Agrega al menos un tratamiento con su cantidad de sesiones.')
      return
    }
    const idsRepetidos = new Set<string>()
    for (const f of filasValidas) {
      if (idsRepetidos.has(f.idTratamiento)) {
        setError('No repitas el mismo tratamiento en dos filas — usa una sola fila por tratamiento.')
        return
      }
      idsRepetidos.add(f.idTratamiento)
    }

    setEnviando(true)
    setError(null)

    const { data: plantillaCreada, error: errPlantilla } = await supabase
      .from('plantilla_paquete')
      .insert({
        nombre: nombre.trim(),
        precio_sugerido: precioSugerido ? Number(precioSugerido) : null,
        activa: true,
      })
      .select('id_plantilla_paquete')
      .single()

    if (errPlantilla || !plantillaCreada) {
      setEnviando(false)
      setError(`No se pudo crear la plantilla: ${errPlantilla?.message ?? 'error desconocido'}`)
      return
    }

    const filasDetalle = filasValidas.map((f) => ({
      id_plantilla_paquete: plantillaCreada.id_plantilla_paquete,
      id_tratamiento: f.idTratamiento,
      cantidad_sesiones: Number(f.cantidadSesiones),
    }))

    const { error: errDetalle } = await supabase.from('plantilla_paquete_detalle').insert(filasDetalle)
    if (errDetalle) {
      setEnviando(false)
      setError(`La plantilla se creó, pero no se pudieron guardar sus tratamientos: ${errDetalle.message}`)
      return
    }

    setEnviando(false)
    resetear()
    onCreada()
    onCerrar()
  }

  return (
    <Panel titulo="Nueva plantilla de paquete" abierto={abierto} onCerrar={onCerrar}>
      <TextField label="Nombre del paquete" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Glow Facial" />
      <TextField
        label="Precio sugerido (₡, opcional)"
        type="number"
        min={0}
        value={precioSugerido}
        onChange={(e) => setPrecioSugerido(e.target.value)}
      />

      <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>Tratamientos incluidos</label>
      {filas.map((f, i) => (
        <div className="fila-plantilla" key={i}>
          <select value={f.idTratamiento} onChange={(e) => actualizarFila(i, 'idTratamiento', e.target.value)}>
            <option value="" disabled>
              Selecciona un tratamiento
            </option>
            {tratamientos.map((t) => (
              <option key={t.id_tratamiento} value={t.id_tratamiento}>
                {t.nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            placeholder="Sesiones"
            value={f.cantidadSesiones}
            onChange={(e) => actualizarFila(i, 'cantidadSesiones', e.target.value)}
          />
          <button
            type="button"
            className="fila-plantilla__quitar"
            onClick={() => quitarFila(i)}
            disabled={filas.length === 1}
            aria-label="Quitar tratamiento"
          >
            🗑
          </button>
        </div>
      ))}
      <button type="button" className="btn-texto" style={{ padding: '0 0 16px' }} onClick={agregarFila}>
        + Agregar tratamiento
      </button>

      {error && <div className="form-error">{error}</div>}

      <div className="panel-acciones">
        <button type="button" className="btn-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <PrimaryButton onClick={handleCrear} disabled={enviando}>
          {enviando ? 'Creando…' : 'Crear plantilla'}
        </PrimaryButton>
      </div>
    </Panel>
  )
}
