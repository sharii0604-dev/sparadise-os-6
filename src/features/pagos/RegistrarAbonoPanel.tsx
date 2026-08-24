import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Panel } from '@/components/Panel'
import { SelectField, TextField } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import { useBuscadorClientas } from '@/hooks/useBuscadorClientas'
import type { CatalogoMetodoPago } from '@/hooks/useCatalogos'
import type { PaqueteConSaldo } from '@/hooks/usePagosData'
import '@/features/agenda/NuevaCitaPanel.css'

interface RegistrarAbonoPanelProps {
  abierto: boolean
  onCerrar: () => void
  onRegistrado: () => void
  metodosPago: CatalogoMetodoPago[]
  paqueteFijado?: PaqueteConSaldo | null
}

export function RegistrarAbonoPanel({ abierto, onCerrar, onRegistrado, metodosPago, paqueteFijado }: RegistrarAbonoPanelProps) {
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [clientaSeleccionada, setClientaSeleccionada] = useState<{ id_clienta: string; nombre_completo: string } | null>(null)
  const { resultados, buscando } = useBuscadorClientas(terminoBusqueda)

  const [paquetesClienta, setPaquetesClienta] = useState<{ id_paquete: string; nombre: string; saldo: number }[]>([])
  const [idPaquete, setIdPaquete] = useState('')
  const [idMetodoPago, setIdMetodoPago] = useState('')
  const [monto, setMonto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paqueteActivo = paqueteFijado ?? null

  async function cargarPaquetesDeClienta(idClienta: string) {
    const { data } = await supabase
      .from('paquete')
      .select('id_paquete, nombre, precio_total, abono ( monto )')
      .eq('id_clienta', idClienta)
      .eq('estado', 'activo')
    setPaquetesClienta(
      ((data ?? []) as any[]).map((p) => ({
        id_paquete: p.id_paquete,
        nombre: p.nombre,
        saldo: Number(p.precio_total) - (p.abono ?? []).reduce((acc: number, a: any) => acc + Number(a.monto), 0),
      }))
    )
  }

  async function handleRegistrar() {
    const idPaqueteFinal = paqueteActivo?.id_paquete ?? idPaquete
    const montoNumero = Number(monto)
    if (!idPaqueteFinal || !idMetodoPago || !montoNumero || montoNumero <= 0) {
      setError('Selecciona el paquete, el método de pago e ingresa un monto válido.')
      return
    }
    setEnviando(true)
    setError(null)
    const { error: err } = await supabase.from('abono').insert({
      id_paquete: idPaqueteFinal,
      id_metodo_pago: Number(idMetodoPago),
      monto: montoNumero,
    })
    setEnviando(false)
    if (err) {
      setError(`No se pudo registrar el abono: ${err.message}`)
      return
    }
    setTerminoBusqueda('')
    setClientaSeleccionada(null)
    setPaquetesClienta([])
    setIdPaquete('')
    setIdMetodoPago('')
    setMonto('')
    onRegistrado()
    onCerrar()
  }

  return (
    <Panel titulo="Registrar abono" abierto={abierto} onCerrar={onCerrar}>
      {!paqueteActivo && (
        <div className="campo">
          <label htmlFor="buscar-clienta-abono">Clienta</label>
          {clientaSeleccionada ? (
            <div className="clienta-elegida">
              <span>{clientaSeleccionada.nombre_completo}</span>
              <button
                type="button"
                className="btn-texto"
                onClick={() => {
                  setClientaSeleccionada(null)
                  setPaquetesClienta([])
                  setIdPaquete('')
                }}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <input
                id="buscar-clienta-abono"
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
                      <button
                        type="button"
                        onClick={() => {
                          setClientaSeleccionada(c)
                          cargarPaquetesDeClienta(c.id_clienta)
                        }}
                      >
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
      )}

      {paqueteActivo ? (
        <div className="clienta-elegida" style={{ marginBottom: 18 }}>
          <span>
            {paqueteActivo.nombre} · {paqueteActivo.clienta_nombre}
          </span>
        </div>
      ) : (
        clientaSeleccionada && (
          <SelectField label="Paquete" placeholder="Selecciona un paquete activo" value={idPaquete} onChange={(e) => setIdPaquete(e.target.value)}>
            {paquetesClienta.map((p) => (
              <option key={p.id_paquete} value={p.id_paquete}>
                {p.nombre} · saldo ₡{Math.round(p.saldo).toLocaleString('es-CR')}
              </option>
            ))}
          </SelectField>
        )
      )}

      <div className="campo-fila">
        <TextField label="Monto (₡)" type="number" min={1} value={monto} onChange={(e) => setMonto(e.target.value)} />
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
        <PrimaryButton onClick={handleRegistrar} disabled={enviando}>
          {enviando ? 'Registrando…' : 'Registrar abono'}
        </PrimaryButton>
      </div>
    </Panel>
  )
}
