import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Panel } from '@/components/Panel'
import { TextField, SelectField } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import type { CatalogoCanalLlegada } from '@/hooks/useCatalogos'

interface NuevaClientaPanelProps {
  abierto: boolean
  onCerrar: () => void
  onCreada: (idClienta: string) => void
  canalesLlegada: CatalogoCanalLlegada[]
}

export function NuevaClientaPanel({ abierto, onCerrar, onCreada, canalesLlegada }: NuevaClientaPanelProps) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [identificacion, setIdentificacion] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
const [direccion, setDireccion] = useState('')
const [estiloVida, setEstiloVida] = useState('')
const [dieta, setDieta] = useState('')
const [ejercicio, setEjercicio] = useState('')
const [vasosAguaDia, setVasosAguaDia] = useState('')
const [horasSueno, setHorasSueno] = useState('')
  const [idCanal, setIdCanal] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCrear() {
    if (!nombre.trim() || !telefono.trim() || !idCanal) {
      setError('Nombre, teléfono y canal de llegada son obligatorios.')
      return
    }
    setEnviando(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('clienta')
      .insert({
        nombre_completo: nombre.trim(),
        telefono: telefono.trim(),
        correo: correo.trim() || null,
        identificacion: identificacion.trim() || null,
        fecha_nacimiento: fechaNacimiento || null,
direccion: direccion.trim() || null,
estilo_vida: estiloVida.trim() || null,
dieta: dieta.trim() || null,
ejercicio: ejercicio.trim() || null,
vasos_agua_dia: vasosAguaDia.trim() || null,
horas_sueno: horasSueno.trim() || null,
        id_canal_llegada: Number(idCanal),
      })
      .select('id_clienta')
      .single()
    setEnviando(false)
    if (err) {
      setError(`No se pudo crear la clienta: ${err.message}`)
      return
    }
    setNombre('')
    setTelefono('')
    setCorreo('')
    setIdentificacion('')
    setFechaNacimiento('')
setDireccion('')
setEstiloVida('')
setDieta('')
setEjercicio('')
setVasosAguaDia('')
setHorasSueno('')
    setIdCanal('')
    onCreada(data!.id_clienta)
    onCerrar()
  }

  return (
    <Panel titulo="Nueva clienta" abierto={abierto} onCerrar={onCerrar}>
      <TextField label="Nombre completo" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <div className="campo-fila">
        <TextField label="Teléfono" required value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <TextField label="Identificación" value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} />
      </div>
      <TextField label="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
<TextField
  label="Dirección"
  value={direccion}
  onChange={(e) => setDireccion(e.target.value)}
/>

<TextField
  label="Estilo de vida"
  value={estiloVida}
  onChange={(e) => setEstiloVida(e.target.value)}
/>
<TextField
  label="Dieta"
  value={dieta}
  onChange={(e) => setDieta(e.target.value)}
/>
<TextField
  label="Ejercicio"
  value={ejercicio}
  onChange={(e) => setEjercicio(e.target.value)}
/>
<TextField
  label="Vasos de agua al día"
  value={vasosAguaDia}
  onChange={(e) => setVasosAguaDia(e.target.value)}
/>
<TextField
  label="Horas de sueño"
  value={horasSueno}
  onChange={(e) => setHorasSueno(e.target.value)}
/>
      <div className="campo-fila">
        <TextField label="Fecha de nacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
        <SelectField label="Canal de llegada" required placeholder="Selecciona" value={idCanal} onChange={(e) => setIdCanal(e.target.value)}>
          {canalesLlegada.map((c) => (
            <option key={c.id_canal_llegada} value={c.id_canal_llegada}>
              {c.nombre}
            </option>
          ))}
        </SelectField>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel-acciones">
        <button type="button" className="btn-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <PrimaryButton onClick={handleCrear} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Crear clienta'}
        </PrimaryButton>
      </div>
    </Panel>
  )
}
