import { useMemo, useState } from 'react'
import { useAgendaDia, type CitaAgenda } from '@/hooks/useAgendaDia'
import { useCatalogos } from '@/hooks/useCatalogos'
import { NuevaCitaPanel } from '@/features/agenda/NuevaCitaPanel'
import { GestionarCitaPanel } from '@/features/agenda/GestionarCitaPanel'
import { PrimaryButton } from '@/components/PrimaryButton'
import { IconMas } from '@/components/icons'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/EstadosYFormularios'
import { Toast } from '@/components/Toast'
import '@/components/components.css'
import '@/components/shared.css'
import './AgendaPage.css'

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sumarDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.split('-').map(Number)
  const dt = new Date(y, m - 1, d + dias)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function formatFechaCorta(fechaISO: string): string {
  const [y, m, d] = fechaISO.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const texto = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long' }).format(dt)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const MINUTO_INICIO_GRILLA = 7 * 60 // 07:00
const MINUTO_FIN_GRILLA = 19 * 60 // 19:00
const PX_POR_MINUTO = 1.2

function minutosDesde(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

const ESTADO_LABEL: Record<CitaAgenda['estado'], string> = {
  sin_confirmar: 'Sin confirmar',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

export function AgendaPage() {
  const [fecha, setFecha] = useState(hoyISO())
  const { citas, cargando, error, recargar, confirmar, completar, cancelar, reprogramar } = useAgendaDia(fecha)
  const { tratamientos, cabinas, terapeutas, motivosCancelacion, cargando: cargandoCatalogos } = useCatalogos()

  const [panelNuevaCitaAbierto, setPanelNuevaCitaAbierto] = useState(false)
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaAgenda | null>(null)
  const [toast, setToast] = useState<{ mensaje: string; variante?: 'ok' | 'error' } | null>(null)

  const esHoy = fecha === hoyISO()
  const minutoAhora = useMemo(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  }, [])

  // Agrupación por terapeuta = columnas por recurso, tal como especifica el
  // Documento Maestro UX ("columnas por recurso: terapeuta + cabina").
  const columnas = useMemo(() => {
    const porTerapeuta = new Map<string, { nombre: string; citas: CitaAgenda[] }>()
    for (const c of citas) {
      if (!porTerapeuta.has(c.id_usuario_terapeuta)) {
        porTerapeuta.set(c.id_usuario_terapeuta, { nombre: c.terapeuta_nombre, citas: [] })
      }
      porTerapeuta.get(c.id_usuario_terapeuta)!.citas.push(c)
    }
    return [...porTerapeuta.entries()].map(([id, v]) => ({ id, ...v }))
  }, [citas])

  async function conManejoDeError(accion: () => Promise<void>, mensajeExito: string) {
    try {
      await accion()
      setToast({ mensaje: mensajeExito, variante: 'ok' })
    } catch (e) {
      setToast({ mensaje: e instanceof Error ? e.message : 'Ocurrió un error', variante: 'error' })
    }
  }

  return (
    <div className="agenda">
      <div className="agenda-top">
        <div>
          <h1>Agenda</h1>
          <div className="agenda-nav">
            <button type="button" className="btn-secundario" onClick={() => setFecha((f) => sumarDias(f, -1))} aria-label="Día anterior">
              ←
            </button>
            <span className="agenda-fecha">{formatFechaCorta(fecha)}</span>
            <button type="button" className="btn-secundario" onClick={() => setFecha((f) => sumarDias(f, 1))} aria-label="Día siguiente">
              →
            </button>
            {!esHoy && (
              <button type="button" className="btn-texto" onClick={() => setFecha(hoyISO())}>
                Hoy
              </button>
            )}
          </div>
        </div>
        <PrimaryButton icon={<IconMas />} onClick={() => setPanelNuevaCitaAbierto(true)} disabled={cargandoCatalogos}>
          Nueva cita
        </PrimaryButton>
      </div>

      {error && <EstadoError onReintentar={recargar}>{error}</EstadoError>}
      {cargando && <EstadoCargando>Cargando agenda…</EstadoCargando>}

      {!cargando && !error && citas.length === 0 && (
        <div className="card">
          <EstadoVacio>Nada agendado para hoy — buen momento para dar seguimiento 🌸</EstadoVacio>
        </div>
      )}

      {!cargando && !error && citas.length > 0 && (
        <>
          {/* ---- Vista de escritorio: columnas por terapeuta ---- */}
          <div className="agenda-grilla-desktop">
            {columnas.map((col) => (
              <div className="agenda-columna" key={col.id}>
                <div className="agenda-columna__titulo">{col.nombre}</div>
                <div className="agenda-columna__pista" style={{ height: (MINUTO_FIN_GRILLA - MINUTO_INICIO_GRILLA) * PX_POR_MINUTO }}>
                  {esHoy && minutoAhora >= MINUTO_INICIO_GRILLA && minutoAhora <= MINUTO_FIN_GRILLA && (
                    <div
                      className="linea-ahora"
                      style={{ top: (minutoAhora - MINUTO_INICIO_GRILLA) * PX_POR_MINUTO }}
                      aria-hidden="true"
                    />
                  )}
                  {col.citas.map((c) => {
                    const top = (minutosDesde(c.hora_inicio) - MINUTO_INICIO_GRILLA) * PX_POR_MINUTO
                    const alto = Math.max(c.duracion_minutos * PX_POR_MINUTO, 34)
                    return (
                      <button
                        key={c.id_cita}
                        type="button"
                        className={`bloque-cita bloque-cita--${c.estado}`}
                        style={{ top, height: alto }}
                        onClick={() => setCitaSeleccionada(c)}
                      >
                        <span className="bloque-cita__hora">{c.hora_inicio.slice(0, 5)}</span>
                        <span className="bloque-cita__nombre">{c.clienta_nombre}</span>
                        <span className="bloque-cita__estado">
                          {ESTADO_LABEL[c.estado]}
                          {c.requiereConsentimientoFaltante && ' · ⚠'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ---- Vista móvil: lista cronológica con recurso como etiqueta ---- */}
          <div className="agenda-lista-movil">
            {citas.map((c) => (
              <button
                key={c.id_cita}
                type="button"
                className={`fila-cita fila-cita--${c.estado}`}
                onClick={() => setCitaSeleccionada(c)}
              >
                <div className="fila-cita__hora">{c.hora_inicio.slice(0, 5)}</div>
                <div className="fila-cita__info">
                  <b>{c.clienta_nombre}</b>
                  <span>
                    {c.tratamiento_nombre} · {c.terapeuta_nombre}
                  </span>
                </div>
                <span className={`estado estado--${c.estado === 'confirmada' || c.estado === 'completada' ? 'confirmada' : 'pendiente'}`}>
                  {ESTADO_LABEL[c.estado]}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <NuevaCitaPanel
        abierto={panelNuevaCitaAbierto}
        onCerrar={() => setPanelNuevaCitaAbierto(false)}
        onCreada={() => conManejoDeError(async () => recargar(), 'Cita agendada.')}
        fechaInicial={fecha}
        tratamientos={tratamientos}
        cabinas={cabinas}
        terapeutas={terapeutas}
      />

      <GestionarCitaPanel
        cita={citaSeleccionada}
        onCerrar={() => setCitaSeleccionada(null)}
        onConfirmar={(id) => conManejoDeError(() => confirmar(id), 'Cita confirmada.')}
        onCompletar={(id) => conManejoDeError(() => completar(id), 'Cita marcada como completada.')}
        onCancelar={(id, motivo) => conManejoDeError(() => cancelar(id, motivo), 'Cita cancelada.')}
        onReprogramar={(id, cambios) => conManejoDeError(() => reprogramar(id, cambios), 'Cita reprogramada.')}
        cabinas={cabinas}
        terapeutas={terapeutas}
        motivosCancelacion={motivosCancelacion}
      />

      {toast && <Toast mensaje={toast.mensaje} variante={toast.variante} onCerrar={() => setToast(null)} />}
    </div>
  )
}
