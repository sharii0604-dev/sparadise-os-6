import { useState } from 'react'
import { TextField, TextAreaField, EstadoVacio } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import type { PlanTratamientoClienta } from '@/hooks/useFichaClienta'

interface PlanTratamientoTabProps {
  planes: PlanTratamientoClienta[]
  hayEvaluacion: boolean
  onCrear: (datos: { objetivos: string; descripcion_programa: string; fecha_inicio: string }) => Promise<void>
  onExito: (msg: string) => void
  onError: (msg: string) => void
}

export function PlanTratamientoTab({ planes, hayEvaluacion, onCrear, onExito, onError }: PlanTratamientoTabProps) {
  const [objetivos, setObjetivos] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar() {
    setGuardando(true)
    try {
      await onCrear({ objetivos, descripcion_programa: descripcion, fecha_inicio: fechaInicio })
      setObjetivos('')
      setDescripcion('')
      setFechaInicio('')
      onExito('Plan de tratamiento registrado.')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo registrar el plan.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="card">
      {planes.length === 0 && <EstadoVacio>Sin plan de tratamiento registrado todavía.</EstadoVacio>}
      {planes.map((p) => (
        <div key={p.id_plan} className="eval-item">
          <div className="eval-item__fecha">
            Inicio: {p.fecha_inicio ?? '—'} · basado en evaluación del {p.evaluacion_fecha}
          </div>
          <p>
            <b>Objetivos:</b> {p.objetivos ?? '—'}
          </p>
          <p>
            <b>Programa:</b> {p.descripcion_programa ?? '—'}
          </p>
        </div>
      ))}

      <h3 className="ficha-subtitulo">Registrar nuevo plan</h3>
      {!hayEvaluacion ? (
        <p className="hint">Registra primero una evaluación inicial en la pestaña correspondiente — el plan se vincula a ella.</p>
      ) : (
        <>
          <TextAreaField label="Objetivos" value={objetivos} onChange={(e) => setObjetivos(e.target.value)} />
          <TextAreaField label="Descripción del programa" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <TextField label="Fecha de inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          <PrimaryButton onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar plan'}
          </PrimaryButton>
        </>
      )}
    </div>
  )
}
