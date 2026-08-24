import { useEffect, useState, useState as useStateAlias } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFichaClienta } from '@/hooks/useFichaClienta'
import { useStorageFicha } from '@/hooks/useStorageFicha'
import { supabase as supabaseClient } from '@/lib/supabaseClient'
import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import { SelectField, TextAreaField, EstadoCargando, EstadoError, EstadoVacio } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import { Toast } from '@/components/Toast'
import { MedidasTab } from '@/features/ficha/MedidasTab'
import { PlanTratamientoTab } from '@/features/ficha/PlanTratamientoTab'
import { ProductosTab } from '@/features/ficha/ProductosTab'
import { FotosTab } from '@/features/ficha/FotosTab'
import { DocumentosTab } from '@/features/ficha/DocumentosTab'
import { HistorialTab } from '@/features/ficha/HistorialTab'
import '@/components/components.css'
import '@/components/shared.css'
import './FichaClientaPage.css'

const TABS = [
  'Datos personales',
  'Salud',
  'Evaluación inicial',
  'Plan de tratamiento',
  'Medidas',
  'Consentimientos',
  'Fotos',
  'Documentos',
  'Citas',
  'Paquetes',
  'Productos',
  'Historial',
] as const
type Tab = (typeof TABS)[number]

function formatColones(v: number): string {
  return '₡' + Math.round(v).toLocaleString('es-CR')
}

export function FichaClientaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    clienta,
    contraindicaciones,
    evaluaciones,
    consentimientos,
    citas,
    paquetes,
    medidas,
    planesTratamiento,
    productos,
    historialCambios,
    cargando,
    error,
    recargar,
    agregarContraindicacion,
    registrarFirmaConsentimiento,
    crearEvaluacionInicial,
    crearMedida,
    crearPlanTratamiento,
    registrarProducto,
  } = useFichaClienta(id)
  const { fotos, documentos, cargando: cargandoStorage, subirFoto, subirDocumento } = useStorageFicha(id)
  const { contraindicacionesCatalogo, cargando: cargandoCat } = useCatalogosFicha()

  const [tab, setTab] = useState<Tab>('Datos personales')
  const [toast, setToast] = useState<string | null>(null)
  const [nuevaContraindicacion, setNuevaContraindicacion] = useState('')
  const [formEval, setFormEval] = useState({ motivo_consulta: '', que_desea_mejorar: '', expectativas: '' })
  const [guardandoEval, setGuardandoEval] = useState(false)

  function mostrarExito(msg: string) {
    setToast(msg)
  }
  function mostrarError(msg: string) {
    setToast(msg)
  }

  if (cargando) return <EstadoCargando>Cargando ficha…</EstadoCargando>
  if (error) return <EstadoError onReintentar={recargar}>{error}</EstadoError>
  if (!clienta) return <EstadoVacio>No se encontró la clienta.</EstadoVacio>

  return (
    <div className="ficha">
      <button type="button" className="btn-texto" onClick={() => navigate('/clientas')} style={{ padding: '0 0 10px' }}>
        ← Volver a Clientas
      </button>

      <div className="ficha-header card">
        <Avatar nombre={clienta.nombre_completo} size="lg" />
        <div>
          <h1>
            {clienta.nombre_completo} {clienta.es_vip && <Badge variant="vip">VIP</Badge>}
          </h1>
          <p>
            {clienta.telefono} {clienta.correo && `· ${clienta.correo}`}
          </p>
        </div>
      </div>

      <div className="pestanas">
        {TABS.map((t) => (
          <button key={t} type="button" className={`pestana${tab === t ? ' pestana--activa' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Datos personales' && (
        <div className="card ficha-grid">
          <Campo label="Identificación" valor={clienta.identificacion} />
          <Campo label="Fecha de nacimiento" valor={clienta.fecha_nacimiento} />
          <Campo label="Dirección" valor={clienta.direccion} />
          <Campo label="Metas" valor={clienta.metas} />
          <Campo label="Zona problemática" valor={clienta.zona_problematica} />
          <Campo label="Estilo de vida" valor={clienta.estilo_vida} />
          <Campo label="Ejercicio" valor={clienta.ejercicio} />
          <Campo label="Dieta" valor={clienta.dieta} />
          <Campo label="Vasos de agua/día" valor={clienta.vasos_agua_dia?.toString() ?? null} />
          <Campo label="Horas de sueño" valor={clienta.horas_sueno?.toString() ?? null} />
        </div>
      )}

      {tab === 'Salud' && (
        <div className="card">
          <h3 className="ficha-subtitulo">Contraindicaciones registradas</h3>
          {contraindicaciones.length === 0 && <EstadoVacio>Sin contraindicaciones registradas.</EstadoVacio>}
          <ul className="lista-chips">
            {contraindicaciones.map((c) => (
              <li key={c.id_contraindicacion_tipo} className="chip chip--rojo">
                {c.nombre}
              </li>
            ))}
          </ul>
          {!cargandoCat && (
            <div className="fila-agregar">
              <SelectField
                label="Agregar contraindicación"
                placeholder="Selecciona"
                value={nuevaContraindicacion}
                onChange={(e) => setNuevaContraindicacion(e.target.value)}
              >
                {contraindicacionesCatalogo
                  .filter((ct) => !contraindicaciones.some((c) => c.id_contraindicacion_tipo === ct.id_contraindicacion_tipo))
                  .map((ct) => (
                    <option key={ct.id_contraindicacion_tipo} value={ct.id_contraindicacion_tipo}>
                      {ct.nombre}
                    </option>
                  ))}
              </SelectField>
              <button
                type="button"
                className="btn-secundario"
                disabled={!nuevaContraindicacion}
                onClick={async () => {
                  try {
                    await agregarContraindicacion(Number(nuevaContraindicacion))
                    setNuevaContraindicacion('')
                    mostrarExito('Contraindicación agregada.')
                  } catch (e) {
                    mostrarError(e instanceof Error ? e.message : 'No se pudo agregar la contraindicación.')
                  }
                }}
              >
                Agregar
              </button>
            </div>
          )}
          {clienta.notas_salud && (
            <>
              <h3 className="ficha-subtitulo">Notas de salud</h3>
              <p>{clienta.notas_salud}</p>
            </>
          )}
        </div>
      )}

      {tab === 'Evaluación inicial' && (
        <div className="card">
          {evaluaciones.length === 0 && <EstadoVacio>Sin evaluación inicial registrada.</EstadoVacio>}
          {evaluaciones.map((ev) => (
            <div key={ev.id_evaluacion} className="eval-item">
              <div className="eval-item__fecha">{ev.fecha}</div>
              <p>
                <b>Motivo:</b> {ev.motivo_consulta ?? '—'}
              </p>
              <p>
                <b>Desea mejorar:</b> {ev.que_desea_mejorar ?? '—'}
              </p>
              <p>
                <b>Expectativas:</b> {ev.expectativas ?? '—'}
              </p>
              <span className="chip">{ev.estado_valoracion.replace(/_/g, ' ')}</span>
            </div>
          ))}

          <h3 className="ficha-subtitulo">Registrar nueva evaluación</h3>
          <TextAreaField
            label="Motivo de consulta"
            value={formEval.motivo_consulta}
            onChange={(e) => setFormEval((f) => ({ ...f, motivo_consulta: e.target.value }))}
          />
          <TextAreaField
            label="¿Qué desea mejorar?"
            value={formEval.que_desea_mejorar}
            onChange={(e) => setFormEval((f) => ({ ...f, que_desea_mejorar: e.target.value }))}
          />
          <TextAreaField
            label="Expectativas"
            value={formEval.expectativas}
            onChange={(e) => setFormEval((f) => ({ ...f, expectativas: e.target.value }))}
          />
          <PrimaryButton
            disabled={guardandoEval || !formEval.motivo_consulta.trim()}
            onClick={async () => {
              setGuardandoEval(true)
              try {
                await crearEvaluacionInicial(formEval)
                setFormEval({ motivo_consulta: '', que_desea_mejorar: '', expectativas: '' })
                mostrarExito('Evaluación registrada.')
              } catch (e) {
                mostrarError(e instanceof Error ? e.message : 'No se pudo registrar la evaluación.')
              } finally {
                setGuardandoEval(false)
              }
            }}
          >
            {guardandoEval ? 'Guardando…' : 'Guardar evaluación'}
          </PrimaryButton>
        </div>
      )}

      {tab === 'Plan de tratamiento' && (
        <PlanTratamientoTab
          planes={planesTratamiento}
          hayEvaluacion={evaluaciones.length > 0}
          onCrear={crearPlanTratamiento}
          onExito={mostrarExito}
          onError={mostrarError}
        />
      )}

      {tab === 'Medidas' && <MedidasTab medidas={medidas} onCrear={crearMedida} onExito={mostrarExito} onError={mostrarError} />}

      {tab === 'Consentimientos' && (
        <div className="card">
          {consentimientos.length === 0 && <EstadoVacio>Sin consentimientos asociados todavía.</EstadoVacio>}
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Fecha de firma</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {consentimientos.map((c) => (
                  <tr key={c.id_consentimiento}>
                    <td>{c.tipo_nombre}</td>
                    <td>
                      <span className={`estado estado--${c.estado === 'firmado' ? 'confirmada' : 'pendiente'}`}>{c.estado}</span>
                    </td>
                    <td>{c.fecha_firma ?? '—'}</td>
                    <td>
                      {c.estado !== 'firmado' && (
                        <button
                          type="button"
                          className="btn-texto"
                          onClick={async () => {
                            try {
                              await registrarFirmaConsentimiento(c.id_consentimiento)
                              mostrarExito('Firma registrada.')
                            } catch (e) {
                              mostrarError(e instanceof Error ? e.message : 'No se pudo registrar la firma.')
                            }
                          }}
                        >
                          Registrar firma
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            Los consentimientos se generan automáticamente al requerirlos un tratamiento agendado. Aquí solo se registra la firma de los ya existentes.
          </p>
        </div>
      )}

      {tab === 'Fotos' && (
        <FotosTab fotos={fotos} cargando={cargandoStorage} onSubir={subirFoto} onExito={mostrarExito} onError={mostrarError} />
      )}

      {tab === 'Documentos' && (
        <DocumentosTab documentos={documentos} cargando={cargandoStorage} onSubir={subirDocumento} onExito={mostrarExito} onError={mostrarError} />
      )}

      {tab === 'Citas' && (
        <div className="card">
          {citas.length === 0 && <EstadoVacio>Sin citas registradas.</EstadoVacio>}
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tratamiento</th>
                  <th>Terapeuta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((c) => (
                  <tr key={c.id_cita}>
                    <td>
                      {c.fecha} · {c.hora_inicio.slice(0, 5)}
                    </td>
                    <td>{c.tratamiento_nombre}</td>
                    <td>{c.terapeuta_nombre}</td>
                    <td>{c.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Paquetes' && (
        <div className="card">
          {paquetes.length === 0 && <EstadoVacio>Sin paquetes registrados.</EstadoVacio>}
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Paquete</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Abonado</th>
                  <th>Saldo</th>
                  <th>Vence</th>
                </tr>
              </thead>
              <tbody>
                {paquetes.map((p) => (
                  <tr key={p.id_paquete}>
                    <td>{p.nombre}</td>
                    <td>{p.estado}</td>
                    <td>{formatColones(p.precio_total)}</td>
                    <td>{formatColones(p.totalAbonado)}</td>
                    <td>{formatColones(p.precio_total - p.totalAbonado)}</td>
                    <td>{p.fecha_vencimiento ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Productos' && (
        <ProductosTab productos={productos} onRegistrar={registrarProducto} onExito={mostrarExito} onError={mostrarError} />
      )}

      {tab === 'Historial' && <HistorialTab historial={historialCambios} />}

      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
    </div>
  )
}

function Campo({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div className="ficha-campo">
      <div className="ficha-campo__label">{label}</div>
      <div className="ficha-campo__valor">{valor || '—'}</div>
    </div>
  )
}

// Catálogos propios de la ficha (contraindicaciones) que no forman parte de
// useCatalogos() porque solo se usan aquí.
function useCatalogosFicha() {
  const [contraindicacionesCatalogo, setContraindicacionesCatalogo] = useStateAlias<
    { id_contraindicacion_tipo: number; nombre: string }[]
  >([])
  const [cargando, setCargando] = useStateAlias(true)

  useEffect(() => {
    let activo = true
    supabaseClient
      .from('contraindicacion_tipo')
      .select('id_contraindicacion_tipo, nombre')
      .eq('activa', true)
      .order('nombre')
      .then(({ data }) => {
        if (!activo) return
        setContraindicacionesCatalogo(data ?? [])
        setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  return { contraindicacionesCatalogo, cargando }
}
