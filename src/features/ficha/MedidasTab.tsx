import { useState } from 'react'
import { TextField } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import { EstadoVacio } from '@/components/EstadosYFormularios'
import type { MedidaCorporal } from '@/hooks/useFichaClienta'

interface MedidasTabProps {
  medidas: MedidaCorporal[]
  onCrear: (datos: { peso: string; presion_arterial: string; zonas: { zona: string; valor_cm: string }[] }) => Promise<void>
  onExito: (msg: string) => void
  onError: (msg: string) => void
}

export function MedidasTab({ medidas, onCrear, onExito, onError }: MedidasTabProps) {
  const [peso, setPeso] = useState('')
  const [presion, setPresion] = useState('')
  const [zonas, setZonas] = useState<{ zona: string; valor_cm: string }[]>([{ zona: '', valor_cm: '' }])
  const [guardando, setGuardando] = useState(false)

  function actualizarZona(i: number, campo: 'zona' | 'valor_cm', valor: string) {
    setZonas((prev) => prev.map((z, idx) => (idx === i ? { ...z, [campo]: valor } : z)))
  }

  async function handleGuardar() {
    setGuardando(true)
    try {
      await onCrear({ peso, presion_arterial: presion, zonas })
      setPeso('')
      setPresion('')
      setZonas([{ zona: '', valor_cm: '' }])
      onExito('Medida registrada.')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo registrar la medida.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="card">
      {medidas.length === 0 && <EstadoVacio>Sin medidas registradas todavía.</EstadoVacio>}
      {medidas.map((m) => (
        <div key={m.id_medida} className="eval-item">
          <div className="eval-item__fecha">{m.fecha}</div>
          <p>
            {m.peso !== null && (
              <>
                <b>Peso:</b> {m.peso} kg{' '}
              </>
            )}
            {m.presion_arterial && (
              <>
                · <b>Presión:</b> {m.presion_arterial}
              </>
            )}
          </p>
          {m.zonas.length > 0 && (
            <ul className="lista-chips">
              {m.zonas.map((z) => (
                <li key={z.id_medida_zona} className="chip">
                  {z.zona}: {z.valor_cm} cm
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <h3 className="ficha-subtitulo">Registrar nueva medida</h3>
      <div className="campo-fila">
        <TextField label="Peso (kg)" type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} />
        <TextField label="Presión arterial" placeholder="120/80" value={presion} onChange={(e) => setPresion(e.target.value)} />
      </div>

      <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Zonas (opcional)</label>
      {zonas.map((z, i) => (
        <div className="campo-fila" key={i}>
          <input type="text" placeholder="Zona (ej. cintura)" value={z.zona} onChange={(e) => actualizarZona(i, 'zona', e.target.value)} />
          <input type="number" placeholder="cm" value={z.valor_cm} onChange={(e) => actualizarZona(i, 'valor_cm', e.target.value)} />
        </div>
      ))}
      <button type="button" className="btn-texto" style={{ padding: '0 0 16px' }} onClick={() => setZonas((prev) => [...prev, { zona: '', valor_cm: '' }])}>
        + Agregar otra zona
      </button>

      <div>
        <PrimaryButton onClick={handleGuardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar medida'}
        </PrimaryButton>
      </div>
    </div>
  )
}
