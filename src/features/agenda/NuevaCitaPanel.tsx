import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Panel } from '@/components/Panel'
import { SelectField, TextAreaField, EstadoCargando } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import { useBuscadorClientas } from '@/hooks/useBuscadorClientas'
import { calcularHuecosDisponibles } from '@/hooks/useAgendaDia'
import type { CatalogoTratamiento, CatalogoCabina, CatalogoTerapeuta } from '@/hooks/useCatalogos'
import './NuevaCitaPanel.css'

interface NuevaCitaPanelProps {
  abierto: boolean
  onCerrar: () => void
  onCreada: () => void
  fechaInicial: string
  tratamientos: CatalogoTratamiento[]
  cabinas: CatalogoCabina[]
  terapeutas: CatalogoTerapeuta[]
}

export function NuevaCitaPanel({
  abierto,
  onCerrar,
  onCreada,
  fechaInicial,
  tratamientos,
  cabinas,
  terapeutas,
}: NuevaCitaPanelProps) {
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [clientaSeleccionada, setClientaSeleccionada] = useState<{ id_clienta: string; nombre_completo: string } | null>(null)
  const { resultados, buscando } = useBuscadorClientas(terminoBusqueda)

  const [idTratamiento, setIdTratamiento] = useState('')
  const [idTerapeuta, setIdTerapeuta] = useState('')
  const [idCabina, setIdCabina] = useState('')
  const [fecha, setFecha] = useState(fechaInicial)
  const [duracion, setDuracion] = useState(60)
  const [notas, setNotas] = useState('')

  const [huecos, setHuecos] = useState<{ hora: string; disponible: boolean }[]>([])
  const [cargandoHuecos, setCargandoHuecos] = useState(false)
  const [horaElegida, setHoraElegida] = useState<string | null>(null)

  const [advertenciaConsentimiento, setAdvertenciaConsentimiento] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tratamientoElegido = useMemo(
    () => tratamientos.find((t) => t.id_tratamiento === idTratamiento) ?? null,
    [tratamientos, idTratamiento]
  )

  // Reset al abrir/cerrar
  useEffect(() => {
    if (!abierto) return
    setTerminoBusqueda('')
    setClientaSeleccionada(null)
    setIdTratamiento('')
    setIdTerapeuta('')
    setIdCabina('')
    setFecha(fechaInicial)
    setDuracion(60)
    setNotas('')
    setHuecos([])
    setHoraElegida(null)
    setAdvertenciaConsentimiento(null)
    setError(null)
  }, [abierto, fechaInicial])

  // Autocompleta duración al elegir tratamiento.
  useEffect(() => {
    if (tratamientoElegido) setDuracion(tratamientoElegido.duracion_minutos)
  }, [tratamientoElegido])

  // Verifica consentimiento requerido para clienta + tratamiento elegidos.
  useEffect(() => {
    setAdvertenciaConsentimiento(null)
    if (!clientaSeleccionada || !idTratamiento) return
    let activo = true
    async function verificar() {
      const { data: requeridos } = await supabase
        .from('tratamiento_consentimiento_requerido')
        .select('id_tipo_consentimiento, tipo_consentimiento:id_tipo_consentimiento ( nombre )')
        .eq('id_tratamiento', idTratamiento)
      if (!activo || !requeridos || requeridos.length === 0) return

      const { data: firmados } = await supabase
        .from('consentimiento')
        .select('id_tipo_consentimiento')
        .eq('id_clienta', clientaSeleccionada!.id_clienta)
        .eq('estado', 'firmado')
      if (!activo) return

      const firmadosSet = new Set((firmados ?? []).map((f: { id_tipo_consentimiento: number }) => f.id_tipo_consentimiento))
      const faltantes = (requeridos as any[]).filter((r) => !firmadosSet.has(r.id_tipo_consentimiento))
      if (faltantes.length > 0) {
        const nombres = faltantes.map((f) => f.tipo_consentimiento?.nombre ?? 'consentimiento').join(', ')
        setAdvertenciaConsentimiento(`Falta firmar: ${nombres}. Se puede agendar, pero debe firmarse antes de la sesión.`)
      }
    }
    verificar()
    return () => {
      activo = false
    }
  }, [clientaSeleccionada, idTratamiento])

  // Calcula huecos reales al tener terapeuta + cabina + fecha + duración.
  useEffect(() => {
    setHoraElegida(null)
    if (!idTerapeuta || !idCabina || !fecha || !duracion) {
      setHuecos([])
      return
    }
    let activo = true
    setCargandoHuecos(true)
    calcularHuecosDisponibles({ fecha, idTerapeuta, idCabina: Number(idCabina), duracionMinutos: duracion })
      .then((res) => activo && setHuecos(res))
      .catch(() => activo && setHuecos([]))
      .finally(() => activo && setCargandoHuecos(false))
    return () => {
      activo = false
    }
  }, [idTerapeuta, idCabina, fecha, duracion])

  async function handleCrear() {
    if (!clientaSeleccionada || !idTratamiento || !idTerapeuta || !idCabina || !horaElegida) {
      setError('Completa clienta, tratamiento, terapeuta, cabina y hora antes de agendar.')
      return
    }
    setEnviando(true)
    setError(null)
    const { error: err } = await supabase.from('cita').insert({
      id_clienta: clientaSeleccionada.id_clienta,
      id_tratamiento: idTratamiento,
      id_usuario_terapeuta: idTerapeuta,
      id_cabina: Number(idCabina),
      fecha,
      hora_inicio: horaElegida,
      duracion_minutos: duracion,
      notas: notas || null,
    })
    setEnviando(false)
    if (err) {
      setError(`No se pudo agendar la cita: ${err.message}`)
      return
    }
    onCreada()
    onCerrar()
  }

  return (
    <Panel titulo="Nueva cita" abierto={abierto} onCerrar={onCerrar}>
      <div className="campo">
        <label htmlFor="buscar-clienta">Clienta</label>
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
              id="buscar-clienta"
              type="text"
              placeholder="Buscar por nombre, teléfono o identificación…"
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

      <SelectField
        label="Tratamiento"
        placeholder="Selecciona un tratamiento"
        value={idTratamiento}
        onChange={(e) => setIdTratamiento(e.target.value)}
        disabled={!clientaSeleccionada}
      >
        {tratamientos.map((t) => (
          <option key={t.id_tratamiento} value={t.id_tratamiento}>
            {t.nombre} · {t.duracion_minutos} min
          </option>
        ))}
      </SelectField>

      {advertenciaConsentimiento && <div className="aviso-consentimiento">⚠ {advertenciaConsentimiento}</div>}

      <div className="campo-fila">
        <SelectField
          label="Terapeuta"
          placeholder="Elegir"
          value={idTerapeuta}
          onChange={(e) => setIdTerapeuta(e.target.value)}
          disabled={!idTratamiento}
        >
          {terapeutas.map((t) => (
            <option key={t.id_usuario} value={t.id_usuario}>
              {t.nombre_completo}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Cabina"
          placeholder="Elegir"
          value={idCabina}
          onChange={(e) => setIdCabina(e.target.value)}
          disabled={!idTratamiento}
        >
          {cabinas.map((c) => (
            <option key={c.id_cabina} value={c.id_cabina}>
              {c.nombre}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="campo-fila">
        <div className="campo">
          <label htmlFor="fecha-cita">Fecha</label>
          <input id="fecha-cita" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="duracion-cita">Duración (min)</label>
          <input
            id="duracion-cita"
            type="number"
            min={15}
            step={5}
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
          />
        </div>
      </div>

      {idTerapeuta && idCabina && (
        <div className="campo">
          <label>Hora disponible</label>
          {cargandoHuecos && <EstadoCargando>Calculando huecos reales…</EstadoCargando>}
          {!cargandoHuecos && huecos.length === 0 && <p className="hint">Sin horarios dentro del horario de atención (08:00–18:00).</p>}
          {!cargandoHuecos && huecos.length > 0 && (
            <div className="grid-huecos">
              {huecos.map((h) => (
                <button
                  key={h.hora}
                  type="button"
                  disabled={!h.disponible}
                  className={`hueco${horaElegida === h.hora ? ' hueco--elegido' : ''}`}
                  onClick={() => setHoraElegida(h.hora)}
                >
                  {h.hora}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <TextAreaField label="Notas (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} />

      {error && <div className="form-error">{error}</div>}

      <div className="panel-acciones">
        <button type="button" className="btn-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <PrimaryButton onClick={handleCrear} disabled={enviando}>
          {enviando ? 'Agendando…' : 'Agendar cita'}
        </PrimaryButton>
      </div>
    </Panel>
  )
}
