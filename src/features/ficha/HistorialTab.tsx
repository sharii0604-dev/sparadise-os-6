import { EstadoVacio } from '@/components/EstadosYFormularios'
import type { HistorialCambioClienta } from '@/hooks/useFichaClienta'

export function HistorialTab({ historial }: { historial: HistorialCambioClienta[] }) {
  return (
    <div className="card">
      {historial.length === 0 && <EstadoVacio>Sin cambios registrados en el expediente de esta clienta.</EstadoVacio>}
      {historial.length > 0 && (
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Campo</th>
                <th>Antes</th>
                <th>Después</th>
                <th>Quién</th>
                <th>Cuándo</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.id_historial}>
                  <td>{h.campo_modificado}</td>
                  <td>{h.valor_anterior ?? '—'}</td>
                  <td>{h.valor_nuevo ?? '—'}</td>
                  <td>{h.usuario_nombre}</td>
                  <td>{new Date(h.fecha).toLocaleString('es-CR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="hint" style={{ marginTop: 12 }}>
        Solo se muestran cambios directos sobre los datos de la clienta (auditoría de <code>public.clienta</code>). Los cambios en citas, paquetes u otras
        tablas relacionadas tienen su propio historial y no están incluidos aquí todavía.
      </p>
    </div>
  )
}
