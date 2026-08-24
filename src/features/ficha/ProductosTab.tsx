import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SelectField, TextField, EstadoVacio } from '@/components/EstadosYFormularios'
import { PrimaryButton } from '@/components/PrimaryButton'
import type { ProductoClienta } from '@/hooks/useFichaClienta'

interface ProductosTabProps {
  productos: ProductoClienta[]
  onRegistrar: (datos: { idProducto: string; tipo: 'vendido' | 'recomendado'; cantidad: number; precioAlMomento: string }) => Promise<void>
  onExito: (msg: string) => void
  onError: (msg: string) => void
}

function formatColones(v: number): string {
  return '₡' + Math.round(v).toLocaleString('es-CR')
}

export function ProductosTab({ productos, onRegistrar, onExito, onError }: ProductosTabProps) {
  const [catalogo, setCatalogo] = useState<{ id_producto: string; nombre: string; precio: number }[]>([])
  const [idProducto, setIdProducto] = useState('')
  const [tipo, setTipo] = useState<'vendido' | 'recomendado'>('vendido')
  const [cantidad, setCantidad] = useState('1')
  const [precio, setPrecio] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    supabase
      .from('producto')
      .select('id_producto, nombre, precio')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => setCatalogo((data ?? []).map((p: { id_producto: string; nombre: string; precio: number }) => ({ ...p, precio: Number(p.precio) }))))
  }, [])

  function alElegirProducto(id: string) {
    setIdProducto(id)
    const p = catalogo.find((x) => x.id_producto === id)
    if (p && tipo === 'vendido') setPrecio(String(p.precio))
  }

  async function handleRegistrar() {
    if (!idProducto || !cantidad || (tipo === 'vendido' && !precio)) {
      onError('Selecciona el producto, la cantidad y (si es venta) el precio.')
      return
    }
    setGuardando(true)
    try {
      await onRegistrar({ idProducto, tipo, cantidad: Number(cantidad), precioAlMomento: precio })
      setIdProducto('')
      setCantidad('1')
      setPrecio('')
      onExito('Producto registrado.')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo registrar el producto.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="card">
      {productos.length === 0 && <EstadoVacio>Sin productos registrados todavía.</EstadoVacio>}
      {productos.length > 0 && (
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id_registro_producto}>
                  <td>{p.producto_nombre}</td>
                  <td>{p.tipo === 'vendido' ? 'Vendido' : 'Recomendado'}</td>
                  <td>{p.cantidad}</td>
                  <td>{p.precio_al_momento !== null ? formatColones(p.precio_al_momento) : '—'}</td>
                  <td>{p.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="ficha-subtitulo">Registrar producto</h3>
      <div className="campo-fila">
        <SelectField label="Producto" placeholder="Selecciona" value={idProducto} onChange={(e) => alElegirProducto(e.target.value)}>
          {catalogo.map((p) => (
            <option key={p.id_producto} value={p.id_producto}>
              {p.nombre}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Tipo"
          value={tipo}
          onChange={(e) => {
            const nuevoTipo = e.target.value as 'vendido' | 'recomendado'
            setTipo(nuevoTipo)
            if (nuevoTipo === 'recomendado') setPrecio('')
          }}
        >
          <option value="vendido">Vendido</option>
          <option value="recomendado">Recomendado</option>
        </SelectField>
      </div>
      <div className="campo-fila">
        <TextField label="Cantidad" type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        {tipo === 'vendido' && (
          <TextField label="Precio al momento (₡)" type="number" min={0} value={precio} onChange={(e) => setPrecio(e.target.value)} />
        )}
      </div>
      <PrimaryButton onClick={handleRegistrar} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Registrar'}
      </PrimaryButton>
    </div>
  )
}
