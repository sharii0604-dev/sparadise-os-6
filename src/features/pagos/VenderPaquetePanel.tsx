import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Panel } from '@/components/Panel'
import { SelectField, TextField } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import { useBuscadorClientas } from '@/hooks/useBuscadorClientas'
import { usePlantillasPaquete } from '@/hooks/usePlantillasPaquete'
import type { CatalogoMetodoPago } from '@/hooks/useCatalogos'

interface VenderPaquetePanelProps {
  abierto: boolean
  onCerrar: () => void
  onVendido: () => void
  metodosPago: CatalogoMetodoPago[]
}

export function VenderPaquetePanel({ abierto, onCerrar, onVendido, metodosPago }: VenderPaquetePanelProps) {
  const { plantillas, cargando: cargandoPlantillas } = usePlantillasPaquete()

  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [clientaSeleccionada, setClientaSeleccionada] = useState<{ id_clienta: string; nombre_completo: string } | null>(null)
  const { resultados, buscando } = useBuscadorClientas(terminoBusqueda)

  const [idPlantilla, setIdPlantilla] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [abonoInicial, setAbonoInicial] = useState('')
  const [idMetodoPago, setIdMetodoPago] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plantillaElegida = useMemo(() => plantillas.find((p) => p.id_plantilla_paquete === idPlantilla) ?? null, [plantillas, idPlantilla])
  const totalSesiones = plantillaElegida ? plantillaElegida.detalles.reduce((acc, d) => acc + d.cantidad_sesiones, 0) : 0

  function elegirPlantilla(id: string) {
    setIdPlantilla(id)
    const p = plantillas.find((x) => x.id_plantilla_paquete === id)
    if (p?.precio_sugerido) setPrecioTotal(String(p.precio_sugerido))
  }

  async function handeVender() {
    if (!clientaSeleccionada || !plantillaElegida || !precioTotal || Number(precioTotal) <= 0) {
      setError('Selecciona clienta, plantilla y un precio total válido.')
      return
    }
    setEnviando(true)
    setError(null)

    const { data: paqueteCreado, error: errPaquete } = await supabase
      .from('paquete')
      .insert({
        id_clienta: clientaSeleccionada.id_clienta,
        nombre: plantillaElegida.nombre,
        precio_total: Number(precioTotal),
        fecha_vencimiento: fechaVencimiento || null,
      })
      .select('id_paquete')
      .single()

    if (errPaquete || !paqueteCreado) {
      setEnviando(false)
      setError(`No se pudo crear el paquete: ${errPaquete?.message ?? 'error desconocido'}`)
      return
    }

    // Reparto proporcional del precio_total entre los tratamientos incluidos,
    // por cantidad de sesiones — `tratamiento` no tiene columna de precio
    // propia en el esquema, así que no hay otra fuente real para el
    // precio_snapshot de cada paquete_detalle.
    const filasDetalle = plantillaElegida.detalles.map((d) => ({
      id_paquete: paqueteCreado.id_paquete,
      id_tratamiento: d.id_tratamiento,
      cantidad_sesiones_total: d.cantidad_sesiones,
      precio_snapshot: Math.round((Number(precioTotal) * d.cantidad_sesiones) / totalSesiones),
    }))

    const { error: errDetalle } = await supabase.from('paquete_detalle').insert(filasDetalle)
    if (errDetalle) {
      setEnviando(false)
      setError(`El paquete se creó, pero no se pudieron registrar sus tratamientos: ${errDetalle.message}`)
      return
    }

    if (abonoInicial && Number(abonoInicial) > 0) {
      if (!idMetodoPago) {
        setEnviando(false)
        setError('El paquete y sus tratamientos se crearon, pero falta el método de pago para registrar el abono inicial.')
        return
      }
      const { error: errAbono } = await supabase.from('abono').insert({
        id_paquete: paqueteCreado.id_paquete,
        id_metodo_pago: Number(idMetodoPago),
        monto: Number(abonoInicial),
      })
      if (errAbono) {
        setEnviando(false)
        setError(`El paquete se creó, pero no se pudo registrar el abono inicial: ${errAbono.message}`)
        return
      }
    }

    setEnviando(false)
    setTerminoBusqueda('')
    setClientaSeleccionada(null)
    setIdPlantilla('')
    setPrecioTotal('')
    setFechaVencimiento('')
    setAbonoInicial('')
    setIdMetodoPago('')
    onVendido()
    onCerrar()
  }

  return (
    <Panel titulo="Vender paquete" abierto={abierto} onCerrar={onCerrar}>
      <div className="campo">
        <label htmlFor="buscar-clienta-venta">Clienta</label>
        {clientaSeleccionada ? (
          <div className="clienta-elegida">
            <span>{clientaSeleccionada.nombre_completo}</span>
            <button type="button" className="btn-texto" onClick={() => setClientaSeleccionada(null)}>
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <input
              id="buscar-clienta-venta"
              type="text"
              placeholder="Buscar clienta…"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
            {buscando && <p className="hint">Buscando…</p>}
            {resultados.length > 0 && (
              <ul className="resultados-busqueda">
                {resultados.map((c) => (
                  <li key={c.id_clienta}>
                    <button type="button" onClick={() => setClientaSeleccionada(c)}>
                      <b>{c.nombre_completo}</b>
                      <span>{c.telefono}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {!cargandoPlantillas && (
        <SelectField label="Plantilla de paquete" placeholder="Selecciona" value={idPlantilla} onChange={(e) => elegirPlantilla(e.target.value)}>
          {plantillas.map((p) => (
            <option key={p.id_plantilla_paquete} value={p.id_plantilla_paquete}>
              {p.nombre}
            </option>
          ))}
        </SelectField>
      )}

      {plantillaElegida && (
        <div className="plantilla-detalle">
          <b>Incluye:</b>
          <ul>
            {plantillaElegida.detalles.map((d) => (
              <li key={d.id_tratamiento}>
                {d.tratamiento_nombre} · {d.cantidad_sesiones} sesiones
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="campo-fila">
        <TextField label="Precio total (₡)" type="number" min={1} value={precioTotal} onChange={(e) => setPrecioTotal(e.target.value)} />
        <TextField label="Fecha de vencimiento" type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
      </div>

      <div className="campo-fila">
        <TextField label="Abono inicial (₡, opcional)" type="number" min={0} value={abonoInicial} onChange={(e) => setAbonoInicial(e.target.value)} />
        <SelectField label="Método de pago" placeholder="Selecciona" value={idMetodoPago} onChange={(e) => setIdMetodoPago(e.target.value)}>
          {metodosPago.map((m) => (
            <option key={m.id_metodo_pago} value={m.id_metodo_pago}>
              {m.nombre}
            </option>
          ))}
        </SelectField>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel-acciones">
        <button type="button" className="btn-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <PrimaryButton onClick={handeVender} disabled={enviando}>
          {enviando ? 'Vendiendo…' : 'Vender paquete'}
        </PrimaryButton>
      </div>
    </Panel>
  )
}
