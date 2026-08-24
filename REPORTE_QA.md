# Sparadise OS — Reporte de QA y endurecimiento

Fecha: 18 de agosto de 2026. Este documento responde punto por punto a los 12 ítems solicitados, distinguiendo explícitamente **qué se verificó en ejecución real** de **qué se verificó por análisis estático** — nada se reporta como "funcional" solo porque el código existe.

---

## 1. `npm install` / `npm run build` reales

**No se ejecutaron.** Este entorno de construcción sigue sin acceso a red (`registry.npmjs.org` responde `403 host_not_allowed`, verificado de nuevo al iniciar esta ronda de QA). Esto no ha cambiado desde las entregas anteriores.

**Lo que sí hice, y es sustancialmente más riguroso que antes:**

Construí un arnés de verificación con el compilador **`tsc` real** (v6.0.3, global en este sandbox) contra declaraciones de tipo escritas a mano para `react`, `react-dom/client`, `react-router-dom` y `@supabase/supabase-js` — no un catch-all `any`, sino interfaces reales (`useState`, `useEffect`, `HTMLAttributes`, `SupabaseClient.from().select().insert().update().eq()...`, `Session`, etc.) acotadas a lo que este proyecto usa. Con eso corrí `tsc --noEmit` real sobre los 57 archivos del proyecto.

**Resultado: `tsc --noEmit` termina con exit code 0 (sin errores) tras las correcciones.**

**Bugs reales encontrados y corregidos por este chequeo** (no los hubiera encontrado con `esbuild` solo, que no verifica tipos):
- `Badge.tsx` y `EstadoTag.tsx` usaban `React.ReactNode` sin importar `React` — hubiera roto el build real. Corregido: `import type { ReactNode } from 'react'`.
- 7 parámetros con tipo implícito `any` en callbacks de `.map()`/`.reduce()` (`useAgendaDia.ts`, `useDashboardData.ts`, `NuevaCitaPanel.tsx`, `ProductosTab.tsx`, `useStorageFicha.ts`) — el `tsconfig.json` del proyecto tiene `noUnusedLocals`/strict activado, así que `noImplicitAny` también aplica y estos hubieran fallado el build real. Corregidos con anotaciones de tipo explícitas.

**Lo que este arnés NO puede reemplazar:** un `npm install` real instala las versiones exactas de `@supabase/supabase-js`, `react-router-dom`, etc. y sus tipos reales, que pueden tener detalles que mis stubs (escritos a mano) no capturan perfectamente. Es la mejor verificación posible sin red, no un sustituto de correr el build de verdad. **Este sigue siendo tu primer paso antes de cualquier despliegue.**

```bash
npm install
npm run build
```

Si `npm run build` da algún error que mi arnés no detectó, pásamelo tal cual y lo corrijo en el siguiente turno.

---

## 2. Flujos CRUD contra el Supabase real

**Hallazgo importante que cambia el alcance de esta verificación: el proyecto real está completamente vacío.** Verificado con SQL directo:

```
clientas: 0, tratamientos: 0, citas: 0, paquetes: 0, promociones: 0, plantillas: 0, fotos: 0, productos: 0
```

Solo los catálogos (`rol`, `canal_llegada`, `metodo_pago`, etc.) tienen las filas semilla ya conocidas de la auditoría original.

**Lo que esto significa para la verificación:**
- **No pude probar un flujo CRUD de punta a punta con datos reales** porque no hay datos reales que leer, y no ejecuté ningún `INSERT`/`UPDATE` de prueba contra el proyecto real — hacerlo dejaría datos de prueba en tu base de producción, y me pediste explícitamente no modificar Supabase sin autorización. Interpreté que crear filas de prueba (aunque sea "solo para probar") entra en esa restricción.
- **Lo que sí verifiqué en ejecución real:** tomé las 6 consultas más complejas del frontend (las que usan `select()` con recursos incrustados: Agenda con 4 joins, Ficha con paquete→abono, Marketing con promoción→promoción_tratamiento→tratamiento, plantillas de paquete, fotos de expediente, historial de cambios) y las traduje a SQL equivalente, ejecutándolas contra el Supabase real con `EXPLAIN`. Postgres las **planificó sin error** — esto confirma que cada nombre de tabla, columna y relación de llave foránea que uso en el frontend existe exactamente como lo escribí. Un error de columna/tabla inexistente hubiera abortado el `EXPLAIN`.

**Si quieres que efectivamente pruebe un flujo de escritura de punta a punta** (crear una clienta de prueba, agendarle una cita, venderle un paquete, subir una foto, y luego borrar todo), dime y lo hago en el siguiente turno — pero necesito tu autorización explícita porque implica escribir en el proyecto real, aunque sea de prueba y con limpieza posterior.

---

## 3. Reducción de usos de `any`

Conteo real antes/después:
- **Antes de esta ronda:** ~53 (estimado, no medido con precisión en el reporte anterior).
- **Ahora: 53 exactos**, medidos con `grep`. El número no bajó drásticamente — y quiero explicar honestamente por qué, en vez de inflar el progreso.

**Lo que sí hice:**
- Añadí tipos `Insert`/`Update` reales (no `never`) a `database.ts` para: `plan_tratamiento`, `medida_corporal`, `medida_zona`, `consentimiento` (Update), `registro_producto`, `promocion`, `promocion_tratamiento`, `publicacion_contenido`, `tratamiento`, `foto_expediente`, `documento_adjunto`, `usuario` (Update). Esto **eliminó 9 casts `as any`** en los paneles que insertan/actualizan estas tablas (`NuevoTratamientoPanel`, `NuevaPromocionPanel`, `NuevaPublicacionPanel`, `useFichaClienta`, `useConfiguracionData`).
- Cada tipo nuevo está respaldado por una restricción **real** confirmada con SQL contra `information_schema`/`pg_constraint` — no inventada. Ejemplo: descubrí que `registro_producto.tipo` solo admite `'vendido'`/`'recomendado'` con una regla de coherencia (`precio_al_momento` obligatorio solo si es `'vendido'`), y que `foto_expediente.estado` es `'activa'`/`'archivada'` (no `'activo'` como en otras tablas, donde había asumido mal el patrname).

**Por qué quedan 53:** revisé cada uno individualmente (no es ruido disperso). El **100% de los `any` restantes están concentrados en 12 hooks de datos**, y siguen el mismo patrón exacto en los 12: un único cast `as any` envolviendo la respuesta de un `Promise.all` con selects que usan **recursos incrustados** (`tabla:fk ( columna )`), seguido de un `.map()` que produce un objeto con **tipo explícito y real** para el resto de la app. La causa estructural es que `database.ts` es un archivo escrito a mano sin el arreglo `Relationships` que `supabase-js` necesita para tipar selects con joins — ese arreglo solo lo genera confiablemente `supabase gen types typescript` (CLI real, requiere red). Escribirlo a mano para las 41 tablas sin poder verificarlo contra el `supabase-js` real sería introducir tipos que *parecen* correctos pero que no puedo confirmar que compilen — un riesgo peor que el `any` documentado.

**Verificación de que no es descuido:** confirmé con `grep` que cada uno de los 53 aparece exactamente en el patrón "un cast por consulta, tipado explícito después" — no hay `any` sueltos en lógica de negocio, componentes de UI, o funciones de validación.

---

## 4. Usuarios desactivados bloqueados

**Implementado y es correcto hasta donde el frontend puede llegar — con un límite real que documento, no oculto.**

- `AuthContext` ahora, después de cargar el perfil de `usuario`, revisa `estado === 'desactivado'` y si es así: cierra la sesión de Supabase Auth inmediatamente (`signOut()`), limpia el estado local, y `LoginPage` muestra el aviso.
- **Límite real (verificado, no supuesto):** esto es una barrera del lado del cliente. Un token JWT de Supabase Auth ya emitido para un usuario que luego se desactiva **sigue siendo técnicamente válido para llamar la API REST de Supabase directamente** (fuera de esta interfaz) hasta que expire (por defecto ~1 hora), *a menos que* las políticas RLS de las tablas de negocio también validen `usuario.estado`. **Verifiqué con SQL que ninguna política RLS actual valida `estado` de `usuario`** — todas usan `auth.role() = 'authenticated'` sin más. Esto es una decisión de backend, no de frontend, y **no la cambié** porque implica modificar RLS existente sin tu autorización (ver sección de bloqueos, al final).

---

## 5. RLS de todas las operaciones de escritura usadas por el frontend

**Verificado con SQL directo contra `pg_policies` — no supuesto en ningún caso.** Tabla completa:

| Tabla | Operación usada | Política real | Resultado esperado |
|---|---|---|---|
| `cita` | INSERT, UPDATE | `auth.role() = 'authenticated'` | Cualquier usuario autenticado puede agendar/confirmar/completar/cancelar/reprogramar. |
| `clienta` | INSERT | `auth.role() = 'authenticated'` | Cualquiera puede crear clientas. |
| `cliente_contraindicacion` | INSERT | `auth.role() = 'authenticated'` | OK. |
| `evaluacion_inicial` | INSERT | `auth.role() = 'authenticated'` | OK. |
| `consentimiento` | UPDATE | `auth.role() = 'authenticated'` | OK — registrar firma funciona para cualquier usuario. |
| `abono` | INSERT | `auth.role() = 'authenticated'` | OK. |
| `tratamiento` | INSERT | `auth.role() = 'authenticated'` | OK. |
| `publicacion_contenido` | INSERT | `auth.role() = 'authenticated'` | OK. |
| `promocion`, `promocion_tratamiento` | INSERT | `auth.role() = 'authenticated'` | OK. |
| `plan_tratamiento`, `medida_corporal`, `medida_zona`, `registro_producto` | INSERT | `auth.role() = 'authenticated'` | OK. |
| `paquete`, `paquete_detalle` | INSERT | `auth.role() = 'authenticated'` | OK — venta de paquetes funciona. |
| `foto_expediente`, `documento_adjunto` | INSERT | `auth.role() = 'authenticated'` | OK. |
| `storage.objects` (`fotos-expediente`, `documentos-adjuntos`) | INSERT, SELECT | `bucket_id = '...'`, rol `authenticated`, sin restricción de dueño | OK. Sin política DELETE en ningún bucket (coherente con "nunca se elimina físicamente"). |
| **`usuario`** | UPDATE (propio) | `auth.uid() = id_usuario` **Y** `estado` no puede cambiar (`WITH CHECK` lo exige igual al actual) | Un usuario **no puede autoeditarse el estado** — correcto, previene autoactivación. |
| **`usuario`** | UPDATE (de otro) | Solo si el actor tiene `rol.nombre = 'Dueña'` | **Encontrado y corregido**: "Desactivar acceso" fallaba en silencio para no-Dueñas. Ver punto 9. |

**Conclusión de este punto:** todas las escrituras que el frontend usa hoy están cubiertas por una política real que las permite, **excepto** activar/desactivar usuarios ajenos, que correctamente requiere ser Dueña — y ahora lo comunica en vez de fallar en silencio.

---

## 6. Venta de paquetes desde `plantilla_paquete`

**Construido.** Nuevo panel "Vender paquete" en Pagos:
- Busca clienta → elige plantilla (`plantilla_paquete` + `plantilla_paquete_detalle`, con los tratamientos incluidos visibles) → precio total editable (autocompletado desde `precio_sugerido` si existe) → fecha de vencimiento → abono inicial opcional.
- Al confirmar: crea `paquete`, luego una fila en `paquete_detalle` por cada tratamiento de la plantilla, y opcionalmente un `abono` inicial.
- **Decisión documentada, no inventada silenciosamente:** `tratamiento` no tiene columna de precio propia en el esquema (confirmado en la auditoría original), así que `precio_snapshot` de cada `paquete_detalle` se calcula repartiendo el precio total proporcionalmente por cantidad de sesiones. Es la única fuente de precio real disponible; si tienes otro criterio de reparto, dímelo y lo ajusto.
- Probado por análisis estático + `EXPLAIN` de la consulta de lectura de plantillas contra el esquema real (ver punto 2). No probado con una venta real de punta a punta por la razón explicada en el punto 2.

---

## 7. Ficha de Clienta completada

Pasó de 6 a **12 pestañas**, todas con datos reales de las tablas ya existentes:

| Pestaña | Qué hace |
|---|---|
| Datos personales | Lectura (ya existía). |
| Salud | Contraindicaciones + agregar (ya existía). |
| Evaluación inicial | Lectura + crear (ya existía). |
| **Plan de tratamiento** (nueva) | Lectura de `plan_tratamiento` + crear, vinculado a la evaluación más reciente (`id_evaluacion` es obligatorio en el esquema real — si no hay evaluación, el formulario lo explica en vez de fallar). |
| **Medidas** (nueva) | Lectura de `medida_corporal` + `medida_zona` anidadas + formulario para registrar peso/presión y N zonas libres (zona es texto libre en el esquema, no hay catálogo — no inventé una taxonomía fija). |
| Consentimientos | Ya existía. |
| **Fotos** (nueva) | Galería con URLs firmadas (bucket privado) + subida real a `Storage` (`fotos-expediente`) + registro en `foto_expediente`. |
| **Documentos** (nueva) | Lista + subida real a `Storage` (`documentos-adjuntos`) + registro en `documento_adjunto`, con tipo de documento real de `documento_tipo`. |
| Citas | Ya existía. |
| Paquetes | Ya existía. |
| **Productos** (nueva) | Historial de `registro_producto` + registrar, respetando el CHECK real (`tipo` vendido/recomendado + coherencia de precio). |
| **Historial** (nueva) | Lectura de `historial_cambio` filtrado a `entidad_afectada='clienta'` y esa clienta. |

---

## 8. Storage implementado

- **Fotos de expediente** (`fotos-expediente`) y **documentos adjuntos** (`documentos-adjuntos`): subida real vía `supabase.storage.from(bucket).upload()`, con la ruta `idClienta/timestamp-nombrearchivo` para evitar colisiones.
- Ambos buckets son **privados** (confirmado en la auditoría original), así que la visualización usa `createSignedUrl()` (10 minutos de validez) en vez de una URL pública que no funcionaría.
- Políticas de Storage verificadas de nuevo con SQL en esta ronda: INSERT/SELECT abiertas a cualquier `authenticated`, sin restricción por carpeta/dueño, **sin política DELETE** en ningún bucket — coherente con el patrón "nunca se elimina físicamente" del resto del esquema. No implementé eliminación de archivos porque no hay política que lo permita.

---

## 9. Errores silenciosos — auditoría completa

Revisé **las 27 operaciones de escritura** del frontend (`grep` exhaustivo de `.insert(`/`.update(`/`.upload(`). Confirmé que las 27:
1. Capturan el `error` de la respuesta de Supabase.
2. Lo convierten en una excepción (`throw`) con mensaje legible, nunca lo ignoran.
3. El componente que llama tiene `try/catch` y muestra el error real al usuario (toast o mensaje en el panel).
4. Llaman a `recargar()`/`cargar()` **solo si la operación fue exitosa**, para refrescar los datos mostrados.

**El error silencioso real que encontré y corregí** (no hipotético): `alternarEstadoUsuario` en Configuración no detectaba cuando RLS bloqueaba la actualización de otro usuario (ver punto 5) porque no pedía `.select()` de vuelta — Postgrest devuelve 200 aunque 0 filas hayan cambiado. Ahora encadena `.select().single()`, lo que convierte el bloqueo silencioso en un error real y explícito ("Solo el rol Dueña puede...").

No encontré otros casos de este patrón en el resto de la app porque el resto de las tablas no tienen políticas restrictivas por dueño — pero si en el futuro se agrega una política así a otra tabla, el mismo patrón de bug podría repetirse ahí.

---

## 10. Sin datos ni tablas inventadas

Confirmado — todo lo construido en esta ronda usa exclusivamente tablas/columnas reales, verificadas con SQL antes de escribir el código correspondiente (`registro_producto.tipo`, `foto_expediente.estado`, columnas de `plantilla_paquete`/`plantilla_paquete_detalle`, políticas de Storage). Ninguna métrica del Dashboard/Centro de Inteligencia se tocó en esta ronda — siguen siendo agregaciones reales ya verificadas en la entrega anterior.

---

## 11. Supabase — no modificado, correcciones documentadas

**No se ejecutó ningún DDL ni cambio de datos.** Todo lo de esta ronda fue lectura (`SELECT`, `EXPLAIN`, `information_schema`, `pg_policies`, `pg_constraint`) más el código del frontend.

**Correcciones de backend que identifiqué y que necesitarían tu autorización explícita:**

1. **RLS de `usuario.estado` en las demás tablas** (relacionado al punto 4): si quieres que un usuario desactivado quede bloqueado también a nivel de base de datos (no solo en esta interfaz), habría que agregar una condición tipo `EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND estado = 'activo')` a las políticas de escritura (y posiblemente lectura) de las tablas de negocio. Esto es un cambio de RLS real en producción — no lo hice.
2. Las correcciones de seguridad de la auditoría original (`SECURITY DEFINER` expuestas a `anon`, `registrar_ingreso_usuario`, `search_path` mutable, límites de Storage) **siguen pendientes**, sin tocar.

---

## 12. Resumen ejecutivo

**Build:** no ejecutado con red real (sigue bloqueada); verificado con `tsc --noEmit` real (stubs de tipos escritos a mano) + `esbuild` — 0 errores tras corregir 2 bugs reales y 7 tipos implícitos.

**Módulos con escritura probada por análisis estático + validez de esquema confirmada por SQL/EXPLAIN real:** Login, AppShell, Home, Agenda (CRUD completo de citas), Clientas, Ficha (12 pestañas), Pagos (abonos + venta de paquetes), Tratamientos, Marketing, Configuración.

**No probado con datos reales de punta a punta:** ningún módulo, porque el proyecto está vacío y crear datos de prueba requiere tu autorización (punto 2).

**Pendientes reales que quedan fuera de esta ronda:**
- Vista semanal y drag-and-drop en Agenda.
- Edición inline de "Datos personales" en la Ficha (el tipo `Update` de `clienta` ya existe, falta el formulario).
- Crear usuarios nuevos desde la UI (requiere invitación vía Supabase Auth).
- Reducir los 53 `any` restantes requeriría los tipos reales generados por `supabase gen types typescript` (necesita la CLI con red) — no es negligencia, es un límite estructural de este entorno.

**Bloqueos que requieren tu decisión:**
1. ¿Autorizas que cree y luego borre datos de prueba en el proyecto real para probar un flujo de escritura de punta a punta?
2. ¿Quieres que proponga (sin aplicar) el cambio de RLS para que `usuario.estado = 'desactivado'` bloquee también a nivel de base de datos, no solo en el frontend?
3. El reparto proporcional de precio en "Vender paquete" (punto 6) — ¿es el criterio correcto o tenías otro en mente?
