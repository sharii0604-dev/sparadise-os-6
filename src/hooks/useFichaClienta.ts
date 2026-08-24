import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database'

type ClientaRow = Database['public']['Tables']['clienta']['Row']

export interface ContraindicacionClienta {
  id_contraindicacion_tipo: number
  nombre: string
  fecha_registro: string
}
export interface EvaluacionInicial {
  id_evaluacion: string
  fecha: string
  motivo_consulta: string | null
  que_desea_mejorar: string | null
  expectativas: string | null
  estado_valoracion: string
}
export interface ConsentimientoClienta {
  id_consentimiento: string
  tipo_nombre: string
  id_tipo_consentimiento: number
  estado: string
  fecha_firma: string | null
}
export interface CitaHistorial {
  id_cita: string
  fecha: string
  hora_inicio: string
  estado: string
  tratamiento_nombre: string
  terapeuta_nombre: string
}
export interface PaqueteClienta {
  id_paquete: string
  nombre: string
  estado: string
  precio_total: number
  totalAbonado: number
  fecha_vencimiento: string | null
}
export interface MedidaCorporal {
  id_medida: string
  fecha: string
  peso: number | null
  presion_arterial: string | null
  zonas: { id_medida_zona: string; zona: string; valor_cm: number }[]
}
export interface PlanTratamientoClienta {
  id_plan: string
  objetivos: string | null
  descripcion_programa: string | null
  fecha_inicio: string | null
  evaluacion_fecha: string
}
export interface ProductoClienta {
  id_registro_producto: string
  producto_nombre: string
  fecha: string
  tipo: 'vendido' | 'recomendado'
  cantidad: number
  precio_al_momento: number | null
}
export interface HistorialCambioClienta {
  id_historial: string
  campo_modificado: string
  valor_anterior: string | null
  valor_nuevo: string | null
  fecha: string
  usuario_nombre: string
}

export function useFichaClienta(idClienta: string | undefined) {
  const [clienta, setClienta] = useState<ClientaRow | null>(null)
  const [contraindicaciones, setContraindicaciones] = useState<ContraindicacionClienta[]>([])
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionInicial[]>([])
  const [consentimientos, setConsentimientos] = useState<ConsentimientoClienta[]>([])
  const [citas, setCitas] = useState<CitaHistorial[]>([])
  const [paquetes, setPaquetes] = useState<PaqueteClienta[]>([])
  const [medidas, setMedidas] = useState<MedidaCorporal[]>([])
  const [planesTratamiento, setPlanesTratamiento] = useState<PlanTratamientoClienta[]>([])
  const [productos, setProductos] = useState<ProductoClienta[]>([])
  const [historialCambios, setHistorialCambios] = useState<HistorialCambioClienta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!idClienta) return
    setCargando(true)
    setError(null)
    try {
      const [clientaRes, contraRes, evalRes, consentRes, citasRes, paquetesRes, medidasRes, planesRes, productosRes, historialRes] =
        (await Promise.all([
          supabase.from('clienta').select('*').eq('id_clienta', idClienta).single(),
          supabase
            .from('cliente_contraindicacion')
            .select('id_contraindicacion_tipo, fecha_registro, tipo:id_contraindicacion_tipo ( nombre )')
            .eq('id_clienta', idClienta),
          supabase.from('evaluacion_inicial').select('*').eq('id_clienta', idClienta).order('fecha', { ascending: false }),
          supabase
            .from('consentimiento')
            .select('id_consentimiento, id_tipo_consentimiento, estado, fecha_firma, tipo:id_tipo_consentimiento ( nombre )')
            .eq('id_clienta', idClienta),
          supabase
            .from('cita')
            .select('id_cita, fecha, hora_inicio, estado, tratamiento:id_tratamiento ( nombre ), terapeuta:id_usuario_terapeuta ( nombre_completo )')
            .eq('id_clienta', idClienta)
            .order('fecha', { ascending: false })
            .limit(20),
          supabase
            .from('paquete')
            .select('id_paquete, nombre, estado, precio_total, fecha_vencimiento, abono ( monto )')
            .eq('id_clienta', idClienta)
            .order('fecha_compra', { ascending: false }),
          supabase
            .from('medida_corporal')
            .select('id_medida, fecha, peso, presion_arterial, medida_zona ( id_medida_zona, zona, valor_cm )')
            .eq('id_clienta', idClienta)
            .order('fecha', { ascending: false }),
          supabase
            .from('plan_tratamiento')
            .select('id_plan, objetivos, descripcion_programa, fecha_inicio, evaluacion:id_evaluacion ( fecha )')
            .eq('id_clienta', idClienta)
            .order('fecha_inicio', { ascending: false }),
          supabase
            .from('registro_producto')
            .select('id_registro_producto, fecha, tipo, cantidad, precio_al_momento, producto:id_producto ( nombre )')
            .eq('id_clienta', idClienta)
            .order('fecha', { ascending: false }),
          supabase
            .from('historial_cambio')
            .select('id_historial, campo_modificado, valor_anterior, valor_nuevo, fecha, usuario:id_usuario ( nombre_completo )')
            .eq('entidad_afectada', 'clienta')
            .eq('id_entidad_afectada', idClienta)
            .order('fecha', { ascending: false })
            .limit(30),
        ])) as any

      if (clientaRes.error) throw clientaRes.error
      if (contraRes.error) throw contraRes.error
      if (evalRes.error) throw evalRes.error
      if (consentRes.error) throw consentRes.error
      if (citasRes.error) throw citasRes.error
      if (paquetesRes.error) throw paquetesRes.error
      if (medidasRes.error) throw medidasRes.error
      if (planesRes.error) throw planesRes.error
      if (productosRes.error) throw productosRes.error
      if (historialRes.error) throw historialRes.error

      setClienta(clientaRes.data)

      setContraindicaciones(
        (contraRes.data ?? []).map((c: any) => ({
          id_contraindicacion_tipo: c.id_contraindicacion_tipo,
          nombre: c.tipo?.nombre ?? '—',
          fecha_registro: c.fecha_registro,
        }))
      )

      setEvaluaciones(evalRes.data ?? [])

      setConsentimientos(
        (consentRes.data ?? []).map((c: any) => ({
          id_consentimiento: c.id_consentimiento,
          id_tipo_consentimiento: c.id_tipo_consentimiento,
          tipo_nombre: c.tipo?.nombre ?? '—',
          estado: c.estado,
          fecha_firma: c.fecha_firma,
        }))
      )

      setCitas(
        (citasRes.data ?? []).map((c: any) => ({
          id_cita: c.id_cita,
          fecha: c.fecha,
          hora_inicio: c.hora_inicio,
          estado: c.estado,
          tratamiento_nombre: c.tratamiento?.nombre ?? '—',
          terapeuta_nombre: c.terapeuta?.nombre_completo ?? '—',
        }))
      )

      setPaquetes(
        (paquetesRes.data ?? []).map((p: any) => ({
          id_paquete: p.id_paquete,
          nombre: p.nombre,
          estado: p.estado,
          precio_total: Number(p.precio_total),
          fecha_vencimiento: p.fecha_vencimiento,
          totalAbonado: (p.abono ?? []).reduce((acc: number, a: any) => acc + Number(a.monto), 0),
        }))
      )

      setMedidas(
        (medidasRes.data ?? []).map((m: any) => ({
          id_medida: m.id_medida,
          fecha: m.fecha,
          peso: m.peso !== null ? Number(m.peso) : null,
          presion_arterial: m.presion_arterial,
          zonas: (m.medida_zona ?? []).map((z: any) => ({
            id_medida_zona: z.id_medida_zona,
            zona: z.zona,
            valor_cm: Number(z.valor_cm),
          })),
        }))
      )

      setPlanesTratamiento(
        (planesRes.data ?? []).map((p: any) => ({
          id_plan: p.id_plan,
          objetivos: p.objetivos,
          descripcion_programa: p.descripcion_programa,
          fecha_inicio: p.fecha_inicio,
          evaluacion_fecha: p.evaluacion?.fecha ?? '—',
        }))
      )

      setProductos(
        (productosRes.data ?? []).map((r: any) => ({
          id_registro_producto: r.id_registro_producto,
          producto_nombre: r.producto?.nombre ?? '—',
          fecha: r.fecha,
          tipo: r.tipo,
          cantidad: r.cantidad,
          precio_al_momento: r.precio_al_momento !== null ? Number(r.precio_al_momento) : null,
        }))
      )

      setHistorialCambios(
        (historialRes.data ?? []).map((h: any) => ({
          id_historial: h.id_historial,
          campo_modificado: h.campo_modificado,
          valor_anterior: h.valor_anterior,
          valor_nuevo: h.valor_nuevo,
          fecha: h.fecha,
          usuario_nombre: h.usuario?.nombre_completo ?? 'Sistema',
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando la ficha de la clienta')
    } finally {
      setCargando(false)
    }
  }, [idClienta])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function actualizarDatos(cambios: Database['public']['Tables']['clienta']['Update']) {
    if (!idClienta) return
    const { error: err } = await supabase.from('clienta').update(cambios).eq('id_clienta', idClienta)
    if (err) throw err
    await cargar()
  }

  async function agregarContraindicacion(idTipo: number) {
    if (!idClienta) return
    const { error: err } = await supabase.from('cliente_contraindicacion').insert({ id_clienta: idClienta, id_contraindicacion_tipo: idTipo })
    if (err) throw err
    await cargar()
  }

  async function registrarFirmaConsentimiento(idConsentimiento: string) {
    // No hay UPDATE tipado en el schema manual para `consentimiento`
    // (columna `Update: never`) así que se castea el resultado. La política
    // RLS de escritura ya se verificó con SQL directo contra pg_policies:
    // `auth.role() = 'authenticated'`, sin restricción de dueño — cualquier
    // usuario autenticado puede registrar la firma.
    const { error: err } = await supabase
      .from('consentimiento')
      .update({ estado: 'firmado', fecha_firma: new Date().toISOString().slice(0, 10) })
      .eq('id_consentimiento', idConsentimiento)
    if (err) throw err
    await cargar()
  }

  async function crearEvaluacionInicial(datos: {
    motivo_consulta: string
    que_desea_mejorar: string
    expectativas: string
  }) {
    if (!idClienta) return
    const { error: err } = await supabase.from('evaluacion_inicial').insert({
      id_clienta: idClienta,
      motivo_consulta: datos.motivo_consulta || null,
      que_desea_mejorar: datos.que_desea_mejorar || null,
      expectativas: datos.expectativas || null,
      objetivos_acordados: null,
      presupuesto_estimado: null,
      estado_valoracion: 'lo_esta_pensando',
    })
    if (err) throw err
    await cargar()
  }

  async function crearMedida(datos: { peso: string; presion_arterial: string; zonas: { zona: string; valor_cm: string }[] }) {
    if (!idClienta) return
    const { data: medidaCreada, error: errMedida } = await supabase
      .from('medida_corporal')
      .insert({
        id_clienta: idClienta,
        id_sesion: null,
        peso: datos.peso ? Number(datos.peso) : null,
        presion_arterial: datos.presion_arterial || null,
      })
      .select('id_medida')
      .single()
    if (errMedida || !medidaCreada) throw new Error(errMedida?.message ?? 'No se pudo crear la medida.')

    const zonasValidas = datos.zonas.filter((z) => z.zona.trim() && z.valor_cm)
    if (zonasValidas.length > 0) {
      const filas = zonasValidas.map((z) => ({
        id_medida: medidaCreada.id_medida,
        zona: z.zona.trim(),
        valor_cm: Number(z.valor_cm),
      }))
      const { error: errZonas } = await supabase.from('medida_zona').insert(filas)
      if (errZonas) throw new Error(`La medida se creó, pero no se pudieron guardar las zonas: ${errZonas.message}`)
    }
    await cargar()
  }

  async function crearPlanTratamiento(datos: { objetivos: string; descripcion_programa: string; fecha_inicio: string }) {
    if (!idClienta) return
    if (evaluaciones.length === 0) {
      throw new Error('Registra primero una evaluación inicial — el plan de tratamiento se vincula a una evaluación existente.')
    }
    const idEvaluacionMasReciente = evaluaciones[0].id_evaluacion
    const { error: err } = await supabase.from('plan_tratamiento').insert({
      id_clienta: idClienta,
      id_evaluacion: idEvaluacionMasReciente,
      objetivos: datos.objetivos || null,
      descripcion_programa: datos.descripcion_programa || null,
      fecha_inicio: datos.fecha_inicio || null,
    })
    if (err) throw err
    await cargar()
  }

  async function registrarProducto(datos: { idProducto: string; tipo: 'vendido' | 'recomendado'; cantidad: number; precioAlMomento: string }) {
    if (!idClienta) return
    // CHECK real de la base (verificado con SQL): tipo='vendido' exige
    // precio_al_momento no nulo; tipo='recomendado' lo exige nulo.
    const { error: err } = await supabase.from('registro_producto').insert({
      id_clienta: idClienta,
      id_producto: datos.idProducto,
      tipo: datos.tipo,
      cantidad: datos.cantidad,
      precio_al_momento: datos.tipo === 'vendido' ? Number(datos.precioAlMomento) : null,
    })
    if (err) throw err
    await cargar()
  }

  return {
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
    recargar: cargar,
    actualizarDatos,
    agregarContraindicacion,
    registrarFirmaConsentimiento,
    crearEvaluacionInicial,
    crearMedida,
    crearPlanTratamiento,
    registrarProducto,
  }
}
