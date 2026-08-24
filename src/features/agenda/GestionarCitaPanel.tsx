import { useEffect, useState } from 'react'
import { Panel } from '@/components/Panel'
import { SelectField, EstadoCargando } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import { calcularHuecosDisponibles, type CitaAgenda } from '@/hooks/useAgendaDia'
import type { CatalogoCabina, CatalogoTerapeuta, CatalogoMotivoCancelacion } from '@/hooks/useCatalogos'
import '@/features/agenda/NuevaCitaPanel.css'

interface GestionarCitaPanelProps {
  cita: CitaAgenda | null
  onCerrar: () => void
  onConfirmar: (id: string) => Promise<void>
  onCompletar: (id: string) => Promise<void>
  onCancelar: (id: string, idMotivo: number) => Promise<void>
  onReprogramar: (
    id: string,
    cambios: { fecha: string; hora_inicio: string; id_usuario_terapeuta: string; id_cabina: number; duracion_minutos: number }
  ) => Promise<void>
  cabinas: CatalogoCabina[]
  terapeutas: CatalogoTerapeuta[]
  motivosCancelacion: CatalogoMotivoCancelacion[]
}

type Modo = 'ver' | 'cancelar' | 'reprogramar'

export function GestionarCitaPanel({
  cita,
  onCerrar,
  onConfirmar,
  onCompletar,
  onCancelar,
  onReprogramar,
  cabinas,
  terapeutas,
  motivosCancelacion,
}: GestionarCitaPanelProps) {
  const [modo, setModo] = useState<Modo>('ver')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cancelar
  const [idMotivo, setIdMotivo] = useState('')

  // Reprogramar
  const [fecha, setFecha] = useState('')
  const [idTerapeuta, setIdTerapeuta] = useState('')
  const [idCabina, setIdCabina] = useState('')
  const [duracion, setDuracion] = useState(60)
  const [huecos, setHuecos] = useState<{ hora: string; disponible: boolean }[]>([])
  const [cargandoHuecos, setCargandoHuecos] = useState(false)
  const [horaElegida, setHoraElegida] = useState<string | null>(null)

  useEffect(() => {
    if (!cita) return
    setModo('ver')
    setError(null)
    setIdMotivo('')
    setFecha(cita.fecha)
    setIdTerapeuta(cita.id_usuario_terapeuta)
    setIdCabina(String(cita.id_cabina))
    setDuracion(cita.duracion_minutos)
    setHoraElegida(cita.hora_inicio.slice(0, 5))
  }, [cita])

  useEffect(() => {
    if (modo !== 'reprogramar' || !cita) return
    let activo = true
    setCargandoHuecos(true)
    calcularHuecosDisponibles({ fecha, idTerapeuta, idCabina: Number(idCabina), duracionMinutos: duracion })
      .then((res) => {
        if (!activo) return
        // La hora actual de la cita siempre cuenta como "disponible" para
        // ella misma, aunque el cálculo la vea ocupada por sí misma.
        setHuecos(res.map((h) => (h.hora === cita.hora_inicio.slice(0, 5) ? { ...h, disponible: true } : h)))
      })
      .catch(() => activo && setHuecos([]))
      .finally(() => activo && setCargandoHuecos(false))
    return () => {
      activo = false
    }
  }, [modo, cita, fecha, idTerapeuta, idCabina, duracion])

  if (!cita) return null

  async function ejecutar(accion: () => Promise<void>) {
    setProcesando(true)
    setError(null)
    try {
      await accion()
      onCerrar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Panel titulo={cita.clienta_nombre} abierto={!!cita} onCerrar={onCerrar}>
      <div className="cita-detalle">
        <p>
          <b>{cita.tratamiento_nombre}</b> · {cita.hora_inicio.slice(0, 5)} · {cita.duracion_minutos} min
        </p>
        <p className="hint">
          {cita.terapeuta_nombre} · {cita.cabina_nombre}
        </p>
        {cita.notas && <p className="hint">Notas: {cita.notas}</p>}
        {cita.requiereConsentimientoFaltante && <div className="aviso-consentimiento">⚠ Falta consentimiento firmado para este tratamiento.</div>}
      </div>

      {error && <div className="form-error">{error}</div>}

      {modo === 'ver' && cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
        <div className="acciones-cita">
          {cita.estado === 'sin_confirmar' && (
            <button type="button" className="btn-secundario" disabled={procesando} onClick={() => ejecutar(() => onConfirmar(cita.id_cita))}>
              Confirmar asistencia
            </button>
          )}
          <button type="button" className="btn-secundario" disabled={procesando} onClick={() => ejecutar(() => onCompletar(cita.id_cita))}>
            Marcar como completada
          </button>
          <button type="button" className="btn-secundario" disabled={procesando} onClick={() => setModo('reprogramar')}>
            Reprogramar
          </button>
          <button type="button" className="btn-texto" disabled={procesando} onClick={() => setModo('cancelar')}>
            Cancelar cita
          </button>
        </div>
      )}

      {modo === 'cancelar' && (
        <>
          <SelectField label="Motivo de cancelación" placeholder="Selecciona un motivo" value={idMotivo} onChange={(e) => setIdMotivo(e.target.value)}>
            {motivosCancelacion.map((m) => (
              <option key={m.id_motivo_cancelacion} value={m.id_motivo_cancelacion}>
                {m.nombre}
              </option>
            ))}
          </SelectField>
          <div className="panel-acciones">
            <button type="button" className="btn-secundario" onClick={() => setModo('ver')}>
              Volver
            </button>
            <PrimaryButton
              disabled={!idMotivo || procesando}
              onClick={() => ejecutar(() => onCancelar(cita.id_cita, Number(idMotivo)))}
            >
              {procesando ? 'Cancelando…' : 'Confirmar cancelación'}
            </PrimaryButton>
          </div>
        </>
      )}

      {modo === 'reprogramar' && (
        <>
          <div className="campo-fila">
            <div className="campo">
              <label htmlFor="reprog-fecha">Fecha</label>
              <input id="reprog-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="reprog-duracion">Duración (min)</label>
              <input id="reprog-duracion" type="number" min={15} step={5} value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} />
            </div>
          </div>
          <div className="campo-fila">
            <SelectField label="Terapeuta" value={idTerapeuta} onChange={(e) => setIdTerapeuta(e.target.value)}>
              {terapeutas.map((t) => (
                <option key={t.id_usuario} value={t.id_usuario}>
                  {t.nombre_completo}
                </option>
              ))}
            </SelectField>
            <SelectField label="Cabina" value={idCabina} onChange={(e) => setIdCabina(e.target.value)}>
              {cabinas.map((c) => (
                <option key={c.id_cabina} value={c.id_cabina}>
                  {c.nombre}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="campo">
            <label>Hora disponible</label>
            {cargandoHuecos && <EstadoCargando>Calculando huecos reales…</EstadoCargando>}
            {!cargandoHuecos && (
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
          <div className="panel-acciones">
            <button type="button" className="btn-secundario" onClick={() => setModo('ver')}>
              Volver
            </button>
            <PrimaryButton
              disabled={!horaElegida || procesando}
              onClick={() =>
                ejecutar(() =>
                  onReprogramar(cita.id_cita, {
                    fecha,
                    hora_inicio: horaElegida!,
                    id_usuario_terapeuta: idTerapeuta,
                    id_cabina: Number(idCabina),
                    duracion_minutos: duracion,
                  })
                )
              }
            >
              {procesando ? 'Guardando…' : 'Confirmar nuevo horario'}
            </PrimaryButton>
          </div>
        </>
      )}
    </Panel>
  )
}
