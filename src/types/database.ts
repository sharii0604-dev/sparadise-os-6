/**
 * Tipos de la base de datos de Sparadise OS — esquema completo.
 *
 * Generado a mano a partir de `information_schema.columns` real del proyecto
 * Sparadise-os (xvmdwqjanlmrchqzfceb), no inventado. Cuando tengas la CLI de
 * Supabase disponible, reemplaza este archivo por el generado con:
 *   supabase gen types typescript --project-id xvmdwqjanlmrchqzfceb > src/types/database.ts
 *
 * Nota: este archivo no declara el arreglo `Relationships` que supabase-js
 * usa para tipar selects con recursos incrustados (`tabla:fk(...)`). Las
 * consultas que usan ese patrón castean su resultado explícitamente — ver
 * comentarios en cada hook de datos.
 */

type UUID = string
type DateStr = string // 'YYYY-MM-DD'
type TimeStr = string // 'HH:MM:SS'
type TimestampStr = string // ISO 8601

export interface Database {
  public: {
    Tables: {
      // ---- Identidad y equipo ----
      usuario: {
        Row: {
          id_usuario: UUID
          id_rol: number
          nombre_completo: string
          correo: string
          foto_perfil_url: string | null
          preferencia_bienvenida: 'frase' | 'versiculo' | 'ninguna'
          estado: 'activo' | 'desactivado'
          fecha_ultimo_ingreso: TimestampStr | null
          fecha_creacion: TimestampStr
        }
        Insert: never
        // Solo `estado` se edita desde el frontend (Configuración → Usuarios).
        // RLS real (verificado con SQL): usuario_update_propio exige que
        // auth.uid() = id_usuario Y que estado no cambie (no puede
        // autoelevarse); usuario_update_duena permite modificar CUALQUIER
        // usuario, incluyendo estado, solo si el actor tiene rol 'Dueña'.
        Update: { estado?: 'activo' | 'desactivado'; preferencia_bienvenida?: 'frase' | 'versiculo' | 'ninguna' }
      }
      rol: {
        Row: { id_rol: number; nombre: string; descripcion: string | null }
        Insert: never
        Update: never
      }

      // ---- Catálogos ----
      categoria_tratamiento: {
        Row: { id_categoria: number; nombre: string; activa: boolean }
        Insert: never
        Update: never
      }
      tipo_consentimiento: {
        Row: { id_tipo_consentimiento: number; nombre: string; descripcion: string | null; activo: boolean }
        Insert: never
        Update: never
      }
      canal_llegada: {
        Row: { id_canal_llegada: number; nombre: string; activo: boolean }
        Insert: never
        Update: never
      }
      contraindicacion_tipo: {
        Row: { id_contraindicacion_tipo: number; nombre: string; activa: boolean }
        Insert: never
        Update: never
      }
      documento_tipo: {
        Row: { id_documento_tipo: number; nombre: string; activo: boolean }
        Insert: never
        Update: never
      }
      motivo_cancelacion: {
        Row: { id_motivo_cancelacion: number; nombre: string; activo: boolean }
        Insert: never
        Update: never
      }
      cabina: {
        Row: { id_cabina: number; nombre: string; activa: boolean }
        Insert: never
        Update: never
      }
      metodo_pago: {
        Row: { id_metodo_pago: number; nombre: string; activo: boolean }
        Insert: never
        Update: never
      }
      red_social: {
        Row: { id_red_social: number; nombre: string; activa: boolean }
        Insert: never
        Update: never
      }

      // ---- Clientas y expediente ----
      clienta: {
        Row: {
          id_clienta: UUID
          identificacion: string | null
          nombre_completo: string
          fecha_nacimiento: DateStr | null
          telefono: string
          correo: string | null
          direccion: string | null
          id_canal_llegada: number
          metas: string | null
          zona_problematica: string | null
          estilo_vida: string | null
          ejercicio: string | null
          dieta: string | null
          vasos_agua_dia: number | null
          horas_sueno: number | null
          notas_salud: string | null
          es_vip: boolean
          fecha_ultima_visita: DateStr | null
          fecha_creacion: TimestampStr
        }
        Insert: {
          identificacion?: string | null
          nombre_completo: string
          fecha_nacimiento?: DateStr | null
          telefono: string
          correo?: string | null
          direccion?: string | null
          id_canal_llegada: number
          metas?: string | null
          zona_problematica?: string | null
          estilo_vida?: string | null
          ejercicio?: string | null
          dieta?: string | null
          vasos_agua_dia?: number | null
          horas_sueno?: number | null
          notas_salud?: string | null
          es_vip?: boolean
        }
        Update: Partial<Database['public']['Tables']['clienta']['Insert']>
      }
      cliente_contraindicacion: {
        Row: { id_clienta: UUID; id_contraindicacion_tipo: number; fecha_registro: DateStr }
        Insert: { id_clienta: UUID; id_contraindicacion_tipo: number }
        Update: never
      }
      evaluacion_inicial: {
        Row: {
          id_evaluacion: UUID
          id_clienta: UUID
          fecha: DateStr
          motivo_consulta: string | null
          que_desea_mejorar: string | null
          expectativas: string | null
          objetivos_acordados: string | null
          presupuesto_estimado: number | null
          estado_valoracion: 'lo_esta_pensando' | 'aprobada' | 'rechazada' | string
        }
        Insert: Omit<Database['public']['Tables']['evaluacion_inicial']['Row'], 'id_evaluacion' | 'fecha'>
        Update: never
      }
      evaluacion_tratamiento_recomendado: {
        Row: { id_evaluacion: UUID; id_tratamiento: UUID }
        Insert: { id_evaluacion: UUID; id_tratamiento: UUID }
        Update: never
      }
      plan_tratamiento: {
        Row: {
          id_plan: UUID
          id_clienta: UUID
          id_evaluacion: UUID
          objetivos: string | null
          descripcion_programa: string | null
          fecha_inicio: DateStr | null
        }
        Insert: {
          id_clienta: UUID
          id_evaluacion: UUID
          objetivos?: string | null
          descripcion_programa?: string | null
          fecha_inicio?: DateStr | null
        }
        Update: never
      }
      medida_corporal: {
        Row: {
          id_medida: UUID
          id_clienta: UUID
          id_sesion: UUID | null
          fecha: DateStr
          peso: number | null
          presion_arterial: string | null
        }
        Insert: {
          id_clienta: UUID
          id_sesion?: UUID | null
          peso?: number | null
          presion_arterial?: string | null
        }
        Update: never
      }
      medida_zona: {
        Row: { id_medida_zona: UUID; id_medida: UUID; zona: string; valor_cm: number }
        Insert: { id_medida: UUID; zona: string; valor_cm: number }
        Update: never
      }
      consentimiento: {
        Row: {
          id_consentimiento: UUID
          id_clienta: UUID
          id_tipo_consentimiento: number
          fecha_firma: DateStr | null
          forma_captura: string | null
          archivo_firma: string | null
          estado: 'pendiente' | 'firmado' | string
        }
        Insert: { id_clienta: UUID; id_tipo_consentimiento: number; estado?: string }
        Update: Partial<{ estado: string; fecha_firma: DateStr | null; forma_captura: string | null; archivo_firma: string | null }>
      }
      foto_expediente: {
        Row: {
          id_foto: UUID
          id_clienta: UUID
          id_sesion: UUID | null
          id_tratamiento: UUID | null
          id_consentimiento_autorizacion: UUID | null
          url_archivo: string
          fecha: DateStr
          numero_sesion: number | null
          zona_corporal: string | null
          apta_marketing: boolean
          estado: 'activa' | 'archivada'
        }
        // CHECK real de la base: estado solo admite 'activa'/'archivada'
        // (verificado con SQL) — no 'activo' como en otras tablas.
        Insert: {
          id_clienta: UUID
          id_sesion?: UUID | null
          id_tratamiento?: UUID | null
          id_consentimiento_autorizacion?: UUID | null
          url_archivo: string
          numero_sesion?: number | null
          zona_corporal?: string | null
          apta_marketing?: boolean
          estado?: 'activa' | 'archivada'
        }
        Update: never
      }
      documento_adjunto: {
        Row: {
          id_documento: UUID
          id_clienta: UUID
          id_documento_tipo: number
          url_archivo: string
          fecha_carga: TimestampStr
          notas: string | null
        }
        Insert: {
          id_clienta: UUID
          id_documento_tipo: number
          url_archivo: string
          notas?: string | null
        }
        Update: never
      }

      // ---- Tratamientos y agenda ----
      tratamiento: {
        Row: {
          id_tratamiento: UUID
          id_categoria: number
          nombre: string
          duracion_minutos: number
          activo: boolean
          fecha_creacion: TimestampStr
        }
        Insert: { id_categoria: number; nombre: string; duracion_minutos: number; activo?: boolean }
        Update: never
      }
      tratamiento_consentimiento_requerido: {
        Row: { id_tratamiento: UUID; id_tipo_consentimiento: number }
        Insert: never
        Update: never
      }
      cita: {
        Row: {
          id_cita: UUID
          id_clienta: UUID
          id_tratamiento: UUID
          id_usuario_terapeuta: UUID
          id_cabina: number
          id_promocion: UUID | null
          id_paquete_detalle: UUID | null
          fecha: DateStr
          hora_inicio: TimeStr
          duracion_minutos: number
          hora_fin: TimeStr | null
          estado: 'sin_confirmar' | 'confirmada' | 'completada' | 'cancelada'
          id_motivo_cancelacion: number | null
          notas: string | null
          fecha_creacion: TimestampStr
        }
        Insert: {
          id_clienta: UUID
          id_tratamiento: UUID
          id_usuario_terapeuta: UUID
          id_cabina: number
          id_paquete_detalle?: UUID | null
          fecha: DateStr
          hora_inicio: TimeStr
          duracion_minutos: number
          notas?: string | null
        }
        Update: Partial<{
          id_usuario_terapeuta: UUID
          id_cabina: number
          fecha: DateStr
          hora_inicio: TimeStr
          duracion_minutos: number
          estado: Database['public']['Tables']['cita']['Row']['estado']
          id_motivo_cancelacion: number | null
          notas: string | null
        }>
      }
      sesion_bitacora: {
        Row: {
          id_sesion: UUID
          id_clienta: UUID
          id_cita: UUID
          id_tratamiento: UUID
          id_usuario_terapeuta: UUID
          fecha: DateStr
          notas: string | null
          proxima_recomendacion: string | null
        }
        Insert: never
        Update: never
      }

      // ---- Paquetes y pagos ----
      plantilla_paquete: {
        Row: { id_plantilla_paquete: UUID; nombre: string; precio_sugerido: number | null; activa: boolean }
        Insert: { nombre: string; precio_sugerido?: number | null; activa?: boolean }
        Update: never
      }
      plantilla_paquete_detalle: {
        Row: { id_plantilla_paquete: UUID; id_tratamiento: UUID; cantidad_sesiones: number }
        Insert: { id_plantilla_paquete: UUID; id_tratamiento: UUID; cantidad_sesiones: number }
        Update: never
      }
      paquete: {
        Row: {
          id_paquete: UUID
          id_clienta: UUID
          nombre: string
          fecha_compra: DateStr
          fecha_vencimiento: DateStr | null
          precio_total: number
          estado: 'activo' | 'agotado' | 'vencido'
          fecha_creacion: TimestampStr
        }
        Insert: {
          id_clienta: UUID
          nombre: string
          fecha_vencimiento?: DateStr | null
          precio_total: number
        }
        Update: never
      }
      paquete_detalle: {
        Row: {
          id_paquete_detalle: UUID
          id_paquete: UUID
          id_tratamiento: UUID
          cantidad_sesiones_total: number
          cantidad_sesiones_usadas: number
          precio_snapshot: number
        }
        Insert: {
          id_paquete: UUID
          id_tratamiento: UUID
          cantidad_sesiones_total: number
          precio_snapshot: number
        }
        Update: never
      }
      abono: {
        Row: { id_abono: UUID; id_paquete: UUID; id_metodo_pago: number; fecha: DateStr; monto: number }
        Insert: { id_paquete: UUID; id_metodo_pago: number; monto: number }
        Update: never
      }
      producto: {
        Row: { id_producto: UUID; nombre: string; precio: number; activo: boolean }
        Insert: never
        Update: never
      }
      registro_producto: {
        Row: {
          id_registro_producto: UUID
          id_clienta: UUID
          id_producto: UUID
          fecha: DateStr
          tipo: 'vendido' | 'recomendado'
          cantidad: number
          precio_al_momento: number | null
          observaciones: string | null
        }
        // CHECK real de la base: tipo='vendido' exige precio_al_momento no
        // nulo; tipo='recomendado' lo exige nulo (verificado con SQL).
        Insert: {
          id_clienta: UUID
          id_producto: UUID
          tipo: 'vendido' | 'recomendado'
          cantidad: number
          precio_al_momento: number | null
          observaciones?: string | null
        }
        Update: never
      }

      // ---- Marketing ----
      promocion: {
        Row: {
          id_promocion: UUID
          nombre: string
          fecha_inicio: DateStr
          fecha_fin: DateStr
          estado: 'programada' | 'activa' | 'finalizada' | string
          fecha_creacion: TimestampStr
        }
        Insert: { nombre: string; fecha_inicio: DateStr; fecha_fin: DateStr; estado?: string }
        Update: never
      }
      promocion_tratamiento: {
        Row: { id_promocion: UUID; id_tratamiento: UUID }
        Insert: { id_promocion: UUID; id_tratamiento: UUID }
        Update: never
      }
      testimonio: {
        Row: {
          id_testimonio: UUID
          id_clienta: UUID
          id_foto: UUID | null
          texto: string
          url_audio_video: string | null
          mostrar_nombre_completo: boolean
          fecha: DateStr
        }
        Insert: never
        Update: never
      }
      publicacion_contenido: {
        Row: {
          id_publicacion: UUID
          id_red_social: number
          id_foto: UUID | null
          texto_post: string | null
          hashtags: string | null
          fecha_planeada: DateStr
          estado: 'idea' | 'programado' | 'publicado' | string
        }
        Insert: {
          id_red_social: number
          texto_post?: string | null
          hashtags?: string | null
          fecha_planeada: DateStr
          estado?: string
        }
        Update: never
      }

      // ---- Sistema ----
      historial_cambio: {
        Row: {
          id_historial: UUID
          id_usuario: UUID | null
          entidad_afectada: string
          id_entidad_afectada: UUID
          campo_modificado: string
          valor_anterior: string | null
          valor_nuevo: string | null
          fecha: TimestampStr
        }
        Insert: never
        Update: never
      }
      regla_recordatorio: {
        Row: {
          id_regla: UUID
          nombre: string
          tipo_condicion: string
          parametro_dias: number | null
          id_usuario_destinatario: UUID
          activa: boolean
          fecha_creacion: TimestampStr
        }
        Insert: never
        Update: never
      }
      notificacion: {
        Row: {
          id_notificacion: UUID
          id_regla: UUID
          entidad_referencia: string
          id_entidad_referencia: UUID
          clave_cohorte: string
          fecha_generacion: TimestampStr
          leida: boolean
          fecha_leida: TimestampStr | null
        }
        Insert: never
        Update: never
      }
      interes_consulta: {
        Row: {
          id_interes: UUID
          id_clienta: UUID
          id_tratamiento: UUID | null
          id_canal_llegada: number
          id_usuario_responsable: UUID | null
          fecha: TimestampStr
          estado_seguimiento:
            | 'nuevo'
            | 'en_seguimiento'
            | 'agendo_valoracion'
            | 'inicio_tratamiento'
            | 'no_interesado'
            | 'sin_respuesta'
          observaciones: string | null
        }
        Insert: never
        Update: never
      }
    }
  }
}
