# Sparadise OS — Entrega ejecutable

React + TypeScript + Vite, conectado al Supabase real de `Sparadise-os`. Auditado y probado en un E2E real (ver `REPORTE_QA.md` y `MATRIZ_PERMISOS.md`).

## Por qué tienes que correr `npm install`/`npm run build` tú, no yo

El entorno donde escribí este proyecto no tiene acceso a red (confirmado de nuevo antes de esta entrega: `registry.npmjs.org` sigue devolviendo `403`). No pude ejecutar `npm install` ni `npm run build` reales en ningún momento de todo este proyecto. Lo que sí hice, como último chequeo antes de esta entrega:
- `tsc --noEmit` real (compilador oficial v6.0.3) contra tipos escritos a mano para React/React Router/Supabase — **0 errores**.
- `esbuild` sobre los 57 archivos `.ts`/`.tsx` — **0 errores**.

Esto reduce el riesgo de que `npm run build` falle, pero no lo garantiza al 100% — un `npm install` real trae las versiones y tipos exactos de las librerías, que pueden tener matices que mis tipos escritos a mano no capturan. Es tu primer paso.

## Paso 1 — Instalar y compilar

```bash
cd sparadise-os
npm install
npm run build
```

`npm run build` corre `tsc -b && vite build`: primero el chequeo de tipos real, después el bundle de producción. Si algo falla aquí, es la primera señal real de un problema — pásamelo tal cual (el mensaje completo de la terminal) y lo reviso.

## Paso 2 — Variables de entorno

```bash
cp .env.example .env
```

Abre `.env` y completa `VITE_SUPABASE_ANON_KEY` con el *anon key* del proyecto `Sparadise-os` (Supabase → Project Settings → API). `VITE_SUPABASE_URL` ya viene completo.

## Paso 3 — Ejecutar localmente

Para desarrollo (recarga en caliente):
```bash
npm run dev
```
Abre la URL que muestra la terminal (normalmente `http://localhost:5173`).

Para probar exactamente el build de producción (más fiel a un despliegue real):
```bash
npm run preview
```

## Paso 4 — Iniciar sesión

Necesitas un usuario real de Supabase Auth cuyo `id` tenga fila correspondiente en `public.usuario` (el trigger `crear_perfil_usuario` la crea sola al registrarse). Si no tienes credenciales a mano, créalas desde Supabase → Authentication → Users, o usa "¿Olvidaste tu contraseña?" en el Login si ya existe una cuenta con correo pero sin contraseña conocida.

## Tu plan de prueba manual

Tal como lo definiste:

1. **Login** → confirma que entra y te lleva al Home.
2. **Home** → revisa que las tarjetas carguen (van a verse mayormente vacías: el proyecto real no tiene datos de negocio todavía, solo catálogos).
3. **Clientas** → crea una clienta real de prueba, ábrela y verifica que llegue a su Ficha.
4. **Ficha** → recorre las 12 pestañas.
5. **Agenda** → agenda una cita para esa clienta, confírmala, reprográmala, cancélala.
6. **Pagos** → vende un paquete, registra un abono.
7. **Marketing** → crea una publicación y una promoción.
8. **Subir una foto** (Ficha → Fotos) y **un documento** (Ficha → Documentos) — esta es la única parte que **no pude probar yo mismo** en ninguna ronda anterior (no tengo forma de hacer una subida HTTP real con archivo binario desde este sandbox). Es la prueba más importante que te queda pendiente a ti.

Si algo de esto falla, dime exactamente en qué paso y qué mensaje de error viste (o una captura) y lo corrijo.

## Qué NO cambié en esta entrega

Tal como pediste: sin cambios estructurales, sin RLS/GRANT/tablas/funciones nuevas, sin funcionalidades nuevas. El único ajuste fue quitar un script `lint` roto de `package.json` (apuntaba a `eslint`, que nunca estuvo instalado — hubiera fallado si lo corrías).

## Documentos de referencia

- `REPORTE_QA.md` — build, tipos, errores corregidos, auditoría de errores silenciosos.
- `MATRIZ_PERMISOS.md` — matriz de acceso tabla por tabla, GRANT aplicados, comparación con RLS.
