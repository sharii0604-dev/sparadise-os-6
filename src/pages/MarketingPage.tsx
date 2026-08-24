import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useMarketingData } from '@/hooks/useMarketingData'
import { useCatalogos } from '@/hooks/useCatalogos'
import { NuevaPublicacionPanel } from '@/features/marketing/NuevaPublicacionPanel'
import { NuevaPromocionPanel } from '@/features/marketing/NuevaPromocionPanel'
import { PrimaryButton } from '@/components/PrimaryButton'
import { IconMas } from '@/components/icons'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/EstadosYFormularios'
import { Toast } from '@/components/Toast'
import '@/components/components.css'
import '@/components/shared.css'
import './MarketingPage.css'

const TABS = ['Calendario de contenido', 'Galería', 'Testimonios', 'Promociones'] as const
type Tab = (typeof TABS)[number]

function useRedesSociales() {
  const [redes, setRedes] = useState<{ id_red_social: number; nombre: string }[]>([])
  useEffect(() => {
    supabase
      .from('red_social')
      .select('id_red_social, nombre')
      .eq('activa', true)
      .then(({ data }) => setRedes(data ?? []))
  }, [])
  return redes
}

export function MarketingPage() {
  const { publicaciones, fotos, testimonios, promociones, cargando, error, recargar } = useMarketingData()
  const { tratamientos } = useCatalogos()
  const redesSociales = useRedesSociales()

  const [tab, setTab] = useState<Tab>('Calendario de contenido')
  const [panelPublicacion, setPanelPublicacion] = useState(false)
  const [panelPromocion, setPanelPromocion] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  return (
    <div className="marketing">
      <div className="marketing-top">
        <h1>Marketing</h1>
        {tab === 'Calendario de contenido' && (
          <PrimaryButton icon={<IconMas />} onClick={() => setPanelPublicacion(true)}>
            Nueva publicación
          </PrimaryButton>
        )}
        {tab === 'Promociones' && (
          <PrimaryButton icon={<IconMas />} onClick={() => setPanelPromocion(true)}>
            Nueva promoción
          </PrimaryButton>
        )}
      </div>

      <div className="pestanas">
        {TABS.map((t) => (
          <button key={t} type="button" className={`pestana${tab === t ? ' pestana--activa' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {error && <EstadoError onReintentar={recargar}>{error}</EstadoError>}
      {cargando && <EstadoCargando>Cargando marketing…</EstadoCargando>}

      {!cargando && !error && (
        <>
          {tab === 'Calendario de contenido' && (
            <div className="card">
              {publicaciones.length === 0 && <EstadoVacio>Sin publicaciones planeadas todavía.</EstadoVacio>}
              <div className="tabla-wrap">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Red</th>
                      <th>Texto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicaciones.map((p) => (
                      <tr key={p.id_publicacion}>
                        <td>{p.fecha_planeada}</td>
                        <td>{p.red_social_nombre}</td>
                        <td style={{ maxWidth: 320 }}>{p.texto_post ?? '—'}</td>
                        <td>
                          <span className="chip">{p.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'Galería' && (
            <div className="card">
              {fotos.length === 0 && <EstadoVacio>Sin fotos marcadas como aptas para marketing todavía.</EstadoVacio>}
              <div className="galeria-grid">
                {fotos.map((f) => (
                  <div key={f.id_foto} className="galeria-item">
                    <img src={f.url_archivo} alt={`Foto de ${f.clienta_nombre}`} loading="lazy" />
                    <div className="galeria-item__pie">
                      {f.clienta_nombre} · {f.fecha}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Testimonios' && (
            <div className="card">
              {testimonios.length === 0 && <EstadoVacio>Sin testimonios registrados todavía.</EstadoVacio>}
              {testimonios.map((t) => (
                <div key={t.id_testimonio} className="testimonio-item">
                  <p>&ldquo;{t.texto}&rdquo;</p>
                  <span className="hint">
                    {t.clienta_nombre} · {t.fecha}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'Promociones' && (
            <div className="card">
              {promociones.length === 0 && <EstadoVacio>Sin promociones registradas todavía.</EstadoVacio>}
              <div className="tabla-wrap">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Promoción</th>
                      <th>Vigencia</th>
                      <th>Tratamientos</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promociones.map((p) => (
                      <tr key={p.id_promocion}>
                        <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                        <td>
                          {p.fecha_inicio} → {p.fecha_fin}
                        </td>
                        <td>{p.tratamientos.length > 0 ? p.tratamientos.join(', ') : '—'}</td>
                        <td>
                          <span className={`estado estado--${p.estado === 'activa' ? 'confirmada' : 'pendiente'}`}>{p.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <NuevaPublicacionPanel
        abierto={panelPublicacion}
        onCerrar={() => setPanelPublicacion(false)}
        onCreada={() => {
          recargar()
          setToast('Publicación creada.')
        }}
        redesSociales={redesSociales}
      />

      <NuevaPromocionPanel
        abierto={panelPromocion}
        onCerrar={() => setPanelPromocion(false)}
        onCreada={() => {
          recargar()
          setToast('Promoción creada.')
        }}
        tratamientos={tratamientos}
      />

      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
    </div>
  )
}
