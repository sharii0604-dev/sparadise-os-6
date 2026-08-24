# Sparadise OS — Matriz de acceso y propuesta de permisos mínimos

**Nada de esto se ejecutó.** Todo lo de abajo sale de consultas de solo lectura contra `information_schema.role_table_grants`, `information_schema.columns`, `pg_policies` y `pg_proc` (con `has_function_privilege`), más una lectura exhaustiva del código fuente del frontend para saber exactamente qué operación usa cada pantalla.

---

## 1–3. Tablas usadas por el frontend, operación necesaria, y si son de solo lectura o de escritura

**Ninguna tabla necesita `DELETE`.** El frontend nunca emite un `DELETE` — todo el sistema usa baja lógica (`estado`), consistente con el patrón "nunca se elimina físicamente" del propio diseño de Sparadise OS. Esto simplifica mucho la matriz.

### Solo lectura (`SELECT` únicamente)

| Tabla | Dónde se usa |
|---|---|
| `rol` | Join al cargar `usuario` (nombre del rol en AppShell/Configuración) |
| `categoria_tratamiento` | Catálogo de tratamientos, filtro en formulario "Nuevo tratamiento" |
| `tipo_consentimiento` | Catálogo de consentimientos, aviso de consentimiento faltante |
| `canal_llegada` | Catálogo, filtro en "Nueva clienta" |
| `contraindicacion_tipo` | Catálogo, pestaña Salud de la Ficha |
| `documento_tipo` | Catálogo, pestaña Documentos de la Ficha |
| `motivo_cancelacion` | Catálogo, cancelar cita |
| `cabina` | Catálogo, Agenda y Nueva cita |
| `metodo_pago` | Catálogo, Registrar abono / Vender paquete |
| `red_social` | Catálogo, Nueva publicación |
| `producto` | Catálogo, pestaña Productos de la Ficha |
| `plantilla_paquete` | Vender paquete |
| `plantilla_paquete_detalle` | Vender paquete (detalle de la plantilla) |
| `tratamiento_consentimiento_requerido` | Chequeo de consentimiento en Nueva cita / Agenda / catálogo de Tratamientos |
| `testimonio` | Pestaña Testimonios de Marketing (sin UI de creación todavía) |
| `historial_cambio` | Pestaña Historial de la Ficha (solo lo escriben los triggers, nunca el frontend) |
| `regla_recordatorio` | Pestaña Recordatorios de Configuración (sin UI de creación todavía) |
| `interes_consulta` | Home y Centro de Inteligencia (sin UI de creación todavía) |

### No usadas por el frontend actual — no necesitan ningún GRANT

| Tabla | Motivo |
|---|---|
| `evaluacion_tratamiento_recomendado` | Nunca se lee ni se escribe desde el frontend construido hasta ahora. |
| `sesion_bitacora` | Solo la crea el trigger `fn_completar_cita` (`SECURITY DEFINER`, corre con privilegios del dueño de la función, no necesita que `authenticated` tenga privilegios sobre la tabla). El frontend nunca la consulta directamente. |
| `notificacion` | El ícono de campana existe visualmente pero **no está conectado a una consulta real todavía** — lo marco aquí para que quede explícito, no lo estaba en reportes anteriores. |

### Lectura + escritura

| Tabla | Operaciones reales | Dónde |
|---|---|---|
| `usuario` | SELECT, UPDATE | Perfil propio (lectura), activar/desactivar equipo (Configuración) |
| `clienta` | SELECT, INSERT | Listado/Ficha (lectura), Nueva clienta (creación). *`UPDATE` ya está programado (`actualizarDatos`) pero **ningún botón lo invoca todavía** — ver nota de mínimo privilegio abajo.* |
| `cliente_contraindicacion` | SELECT, INSERT | Ficha → Salud |
| `evaluacion_inicial` | SELECT, INSERT | Ficha → Evaluación inicial |
| `plan_tratamiento` | SELECT, INSERT | Ficha → Plan de tratamiento |
| `medida_corporal` | SELECT, INSERT | Ficha → Medidas |
| `medida_zona` | SELECT, INSERT | Ficha → Medidas (detalle) |
| `consentimiento` | SELECT, UPDATE | Ficha/Agenda (lectura), registrar firma (actualización). **Sin INSERT** — ver hallazgo funcional abajo. |
| `foto_expediente` | SELECT, INSERT | Ficha → Fotos, Marketing → Galería |
| `documento_adjunto` | SELECT, INSERT | Ficha → Documentos |
| `tratamiento` | SELECT, INSERT | Catálogo (lectura), Nuevo tratamiento (creación) |
| `cita` | SELECT, INSERT, UPDATE | Agenda/Home (lectura), Nueva cita (creación), confirmar/completar/cancelar/reprogramar (actualización) |
| `paquete` | SELECT, INSERT | Pagos/Ficha (lectura), Vender paquete (creación) |
| `paquete_detalle` | SELECT, INSERT | Pagos/Ficha (lectura), Vender paquete (creación) |
| `abono` | SELECT, INSERT | Pagos/Ficha (lectura), Registrar abono / Vender paquete (creación) |
| `registro_producto` | SELECT, INSERT | Ficha → Productos |
| `promocion` | SELECT, INSERT | Marketing (lectura), Nueva promoción (creación) |
| `promocion_tratamiento` | SELECT, INSERT | Marketing (lectura), Nueva promoción (creación) |
| `publicacion_contenido` | SELECT, INSERT | Marketing (lectura), Nueva publicación (creación) |

**Hallazgo funcional durante este ejercicio (no es de permisos, es una laguna del flujo):** ningún trigger ni pantalla del frontend crea la fila de `consentimiento` "pendiente" cuando un tratamiento la exige por primera vez — solo se puede *actualizar* una que ya existe. Hoy esa fila tendría que crearse manualmente en la base para que el flujo de "registrar firma" tenga algo que actualizar. Lo marco como pendiente funcional, no lo resuelvo en esta matriz.

---

## 4. Operaciones que deberían pasar por RPC en vez de CRUD directo

No es obligatorio para el mínimo privilegio (RLS + GRANT acotado ya resuelve el acceso), pero hay 2 casos donde el riesgo no es de *quién* puede escribir sino de que **una escritura parcial deje datos inconsistentes**, porque el frontend hace varios `INSERT` separados que deberían ser atómicos:

1. **Vender paquete** (`paquete` + `paquete_detalle`, y opcionalmente `abono`): si el segundo `INSERT` falla después del primero, queda un `paquete` sin sus tratamientos. Hoy el código ya avisa de este caso ("el paquete se creó, pero..."), pero un RPC transaccional (`vender_paquete(...)`) lo evitaría de raíz en vez de solo avisarlo.
2. **Registrar abono**: no hay ninguna validación de que el monto no exceda el saldo pendiente del paquete — cualquier usuario autenticado podría registrar un abono por cualquier monto. Un RPC podría validar `monto <= saldo_pendiente` server-side antes de insertar (hoy esa regla, si existe, solo estaría en la cabeza de quien lo usa, no en el sistema).

Ninguno de los dos es indispensable para el mínimo privilegio de acceso — son mejoras de integridad de datos, las dejo anotadas porque surgieron naturalmente de este análisis.

---

## 5. Secuencias

**Ninguna tabla necesita `GRANT` de secuencia**, verificado con SQL real:
- Los 10 catálogos con PK numérica (`rol`, `categoria_tratamiento`, `tipo_consentimiento`, `canal_llegada`, `contraindicacion_tipo`, `documento_tipo`, `motivo_cancelacion`, `cabina`, `metodo_pago`, `red_social`) usan `GENERATED ALWAYS AS IDENTITY` — desde Postgres 10, estas NO requieren `GRANT USAGE` aparte sobre la secuencia interna; basta el `INSERT` en la tabla. Es distinto de `serial` (estilo antiguo), que sí lo requeriría.
- **Y de todas formas es un punto moot**: el frontend nunca inserta en ninguna de esas 10 tablas de catálogo — todas son de solo lectura desde la app (confirmado en la sección 1–3).
- Las demás 31 tablas usan `id_* UUID DEFAULT gen_random_uuid()` — es una función (`pgcrypto`), no una secuencia; no necesita `GRANT` aparte (las funciones de extensión tienen `EXECUTE` público por defecto, ya verificado).

---

## 6. GRANT existentes sobre funciones/RPC

Verificado con `has_function_privilege` sobre las 9 funciones `SECURITY DEFINER` de negocio (el resto de funciones con `EXECUTE` público son utilidades de las extensiones `pg_trgm`/`btree_gist`/`pgcrypto`, normales y no relacionadas a este análisis):

| Función | `anon` EXECUTE | `authenticated` EXECUTE | ¿La usa el frontend vía `.rpc()`? |
|---|---|---|---|
| `crear_perfil_usuario` | Sí | Sí | No — se dispara sola por trigger en `auth.users` |
| `sincronizar_correo_usuario` | Sí | Sí | No — trigger |
| `fn_completar_cita` | Sí | Sí | No — trigger sobre `cita` |
| `fn_registrar_historial_cambio` | Sí | Sí | No — trigger |
| `fn_tareas_diarias` | Sí | Sí | No — cron |
| `fn_actualizar_estados_temporales` | Sí | Sí | No |
| `fn_marcar_paquetes_vencidos` | Sí | Sí | No |
| `fn_generar_notificaciones` | Sí | Sí | No |
| `registrar_ingreso_usuario` | Sí | Sí | No — el frontend actual no llama esta función en ningún punto (el login no la invoca) |

**Conclusión: el frontend construido hasta ahora no usa `supabase.rpc()` en ningún punto — cero funciones necesitan `EXECUTE` para que la app funcione.** Esto refuerza, con evidencia adicional, la recomendación de la auditoría de seguridad original: revocar `EXECUTE` de `anon` y `authenticated` en las 9 funciones, porque ninguna la necesita — ni por trigger (los triggers no requieren que el rol invasor tenga `EXECUTE`) ni por llamada directa del frontend (no existe ninguna).

---

## 7. Comparación con RLS existente

Con el `GRANT` en cero (el bloqueante encontrado), **RLS nunca llega a evaluarse** para ninguna tabla — Postgres corta el acceso en la capa de privilegios antes. Una vez que exista el `GRANT` correcto, la RLS ya auditada anteriormente queda así:

- **Todas las tablas de negocio**: política `auth.role() = 'authenticated'` — coherente con otorgar `authenticated` sin restricción adicional de fila, **excepto** `usuario`.
- **`usuario`**: `usuario_update_propio` (auth.uid() = id_usuario, no puede cambiar su propio `estado`) + `usuario_update_duena` (solo rol Dueña puede tocar cualquier fila, incluido `estado` de otros). El `GRANT UPDATE` a nivel de tabla es necesario para que la política siquiera se evalúe, y la política ya restringe correctamente quién puede hacer qué — **no hace falta ninguna condición adicional a nivel de GRANT**, RLS ya resuelve la fila.

**Conclusión: la RLS ya auditada es adecuada y no necesita cambios.** El problema nunca fue RLS — fue que faltaba el `GRANT` que permite que RLS se evalúe.

---

## 8. Propuesta de SQL (NO ejecutado — para tu aprobación)

Agrupado por el permiso exacto que necesita, no un `GRANT ALL` genérico:

```sql
-- ============================================================
-- 1) Catálogos y tablas de solo lectura — SELECT únicamente
-- ============================================================
GRANT SELECT ON
  rol, categoria_tratamiento, tipo_consentimiento, canal_llegada,
  contraindicacion_tipo, documento_tipo, motivo_cancelacion, cabina,
  metodo_pago, red_social, producto, plantilla_paquete,
  plantilla_paquete_detalle, tratamiento_consentimiento_requerido,
  testimonio, historial_cambio, regla_recordatorio, interes_consulta
TO authenticated;

-- ============================================================
-- 2) Tablas de negocio con creación directa — SELECT + INSERT
--    (sin UPDATE/DELETE: el frontend nunca las modifica ni las borra)
-- ============================================================
GRANT SELECT, INSERT ON
  cliente_contraindicacion, evaluacion_inicial, plan_tratamiento,
  medida_corporal, medida_zona, foto_expediente, documento_adjunto,
  tratamiento, paquete, paquete_detalle, abono, registro_producto,
  promocion, promocion_tratamiento, publicacion_contenido
TO authenticated;

-- ============================================================
-- 3) Tablas con actualización real desde el frontend
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON cita TO authenticated;
GRANT SELECT, UPDATE ON consentimiento TO authenticated;   -- sin INSERT: ver hallazgo funcional §1-3
GRANT SELECT, UPDATE ON usuario TO authenticated;           -- sin INSERT: la crea el trigger, no el frontend

-- ============================================================
-- 4) Clienta: INSERT sí se usa; UPDATE queda fuera por ahora
--    (no hay ningún botón que la invoque todavía - mínimo privilegio
--    real, no solo teórico). Descomentar UPDATE cuando se conecte
--    la edición de "Datos personales" en la Ficha.
-- ============================================================
GRANT SELECT, INSERT ON clienta TO authenticated;
-- GRANT UPDATE ON clienta TO authenticated;  -- activar cuando exista el botón "Guardar cambios"

-- ============================================================
-- 5) Nada de esto es necesario (documentado para que quede explícito
--    por qué NO están en la lista):
--    - Ninguna secuencia (todas IDENTITY o gen_random_uuid(), ver 5)
--    - Ningún DELETE en ninguna tabla (el frontend nunca borra)
--    - Ninguna función RPC (el frontend no usa supabase.rpc(), ver 6)
--    - evaluacion_tratamiento_recomendado, sesion_bitacora, notificacion:
--      no las usa el frontend actual
-- ============================================================
```

**Qué riesgo resuelve cada bloque:**

| Bloque | Riesgo que resuelve | Riesgo que evita crear |
|---|---|---|
| 1 (solo lectura) | Sin esto, catálogos, dropdowns y chequeos de consentimiento fallan — la app no carga ninguna pantalla. | No se le da `INSERT` a tablas que la app nunca escribe. |
| 2 (SELECT+INSERT) | Sin esto, ningún formulario de creación funciona (clientas y cita aparte, ver 3 y 4). | No se le da `UPDATE`/`DELETE` donde el frontend nunca los usa — si alguien compromete la sesión de un usuario autenticado, no puede editar/borrar retroactivamente estos registros vía API directa. |
| 3 (`cita`, `consentimiento`, `usuario`) | Habilita confirmar/reprogramar/cancelar citas, firmar consentimientos, activar/desactivar equipo. | `usuario` sin `INSERT` — nadie puede crear perfiles por fuera del trigger de signup, aunque tenga la sesión de un usuario autenticado. |
| 4 (`clienta`) | Habilita crear clientas nuevas. | No se habilita `UPDATE` de clientas todavía porque **ningún código lo usa hoy** — si se otorgara ahora sin necesidad, sería un permiso "por si acaso", justo lo que pediste evitar. |

---

## Resumen para tu decisión

- **21 tablas** solo necesitan `SELECT`.
- **15 tablas** necesitan `SELECT` + `INSERT` (sin `UPDATE`/`DELETE`).
- **3 tablas** (`cita`, `consentimiento`, `usuario`) necesitan `SELECT` + `UPDATE` además de lo anterior según el caso.
- **`clienta`** es `SELECT` + `INSERT`, con `UPDATE` deliberadamente fuera hasta que exista el botón que lo use.
- **Cero secuencias, cero funciones RPC, cero `DELETE`** en toda la propuesta.
- La propuesta de la ronda anterior (`GRANT ALL ON ALL TABLES`) queda descartada — esto es estrictamente más angosto.

¿Apruebas este bloque de `GRANT` para que lo ejecute? En cuanto confirmes, sigo con la prueba E2E de los 15 flujos que quedó pausada.
