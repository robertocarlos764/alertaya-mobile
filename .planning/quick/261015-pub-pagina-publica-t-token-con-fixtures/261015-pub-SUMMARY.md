---
phase: quick-261015-pub
plan: 01
subsystem: apps/web (pagina publica del link)
tags: [nextjs, maplibre-gl, vitest, fixtures, tracking, privacidad]
requires: []
provides:
  - "apps/web: Next.js 16.4.1 App Router, unica ruta /t/[token] (/ responde 404)"
  - "Modulo unico de acceso trackingSource.ts con el contrato de 01-09; fixtures demo-* sin NEXT_PUBLIC_API_URL"
  - "Todos los estados de la tabla de UI-SPEC, mapa OpenFreeMap dark, polling y cabeceras de privacidad"
affects: [01-10]
tech-stack:
  added:
    - next 16.4.1, react / react-dom 19.3.0 (create-next-app)
    - maplibre-gl 6.13.0
    - vitest 5.0.3 (dev)
    - eslint 9 + eslint-config-next 16.4.1, typescript 5, @types/react, @types/react-dom (dev, de create-next-app)
    - "@types/node ^24 (dev; create-next-app trae ^20, que choca con el peer de vitest 5)"
  patterns:
    - "Estado = applyResult(prev, resultado, relojCliente); pantalla = toViewModel(estado, relojCliente) cada segundo"
    - "Antiguedad con desfase serverNow - reloj del cliente guardado al recibir"
    - "Primer fetch y polling en un solo setTimeout (delay 0 la primera vez) para cumplir react-hooks/set-state-in-effect"
key-files:
  created:
    - apps/web/next.config.ts
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/globals.css
    - apps/web/src/app/t/[token]/page.tsx
    - apps/web/src/app/t/[token]/TrackingView.tsx
    - apps/web/src/app/t/[token]/TrackingMap.tsx
    - apps/web/src/lib/api-types.ts
    - apps/web/src/lib/trackingSource.ts
    - apps/web/src/lib/fixtures.ts
    - apps/web/src/lib/trackingState.ts
    - apps/web/src/lib/trackingState.test.ts
    - apps/web/src/lib/geo.ts
    - apps/web/src/lib/geo.test.ts
decisions:
  - "Fuente de datos: con NEXT_PUBLIC_API_URL solo el API real; sin ella solo fixtures, anunciadas con la franja 'MODO DEMO · datos de prueba'"
  - "Estilo de mapa: OpenFreeMap dark (lo fija UI-SPEC y 01-10); la atribucion la aporta la fuente del estilo"
  - "maplibre-gl directo + next/dynamic ssr:false, sin @vis.gl/react-maplibre (decision de 01-10)"
  - "Se conserva cacheComponents de create-next-app: params se lee dentro de <Suspense> y el shell 'Cargando alerta…' se prerenderiza"
  - "La ventana de 1 h (D-07) tambien se aplica en el cliente: aunque el servidor enviara datos, pasada 1 h no se muestran"
status: complete
actuals:
  tasks: 3
  commits: 4
---

# Quick 261015-pub: pagina publica /t/[token] con fixtures

**La pagina que abre el contacto desde el SMS ya existe en `apps/web` con todos los estados de UI-SPEC; hoy lee fixtures y 01-10 solo tiene que apuntarla al API real y desplegarla.**

## Que se hizo

| Tarea | Commit | Resumen |
| ----- | ------ | ------- |
| 1 | `337a6cc` | Proyecto `apps/web` (create-next-app 16.4.1), tema oscuro/rojo de UI-SPEC, `lang="es-CO"`, DM Sans 400/600, robots noindex y cabeceras de `/t/*` |
| 2 | `17c8420` | `trackingState.ts`, `geo.ts` y sus pruebas; `trackingSource.ts` (unico acceso) y `fixtures.ts` |
| 3 | `2612397` | `page.tsx` (Suspense sobre params), `TrackingView.tsx` (polling, reloj, estados, botones) y `TrackingMap.tsx` (maplibre) |

- **Modulo de acceso:** `src/lib/trackingSource.ts` exporta `fetchTracking(token)` y `usingFixtures`. Con `NEXT_PUBLIC_API_URL` hace `GET {API}/api/public/tracking/{token}` con `cache: "no-store"`, `referrerPolicy: "no-referrer"` y timeout de 10 s; 404/410 -> enlace no disponible, otro error HTTP o JSON invalido -> error de servidor, excepcion -> error de red. Sin la variable importa `fixtures.ts` de forma diferida.
- **Fixtures (tokens):** `demo-activa` (trayecto que crece cada 5 s), `demo-pendiente`, `demo-sin-actualizar` (ultimo punto de hace 3 min, ambar), `demo-finalizada` (hace 10 min), `demo-finalizada-vieja` (hace 61 min, con la forma que devuelve el servidor), `demo-sin-red` (alterna 20 s con red y 20 s sin red), `demo-error` (5xx), `demo-nombre-largo` (62 caracteres con tildes); cualquier otro token -> 404.
- **Estados:** cargando, activa, ubicacion pendiente (sin mapa, Google Maps deshabilitado con "Disponible cuando haya ubicación."), finalizada < 1 h (sin 123, sin pulso, sin polling), finalizada >= 1 h (sin ningun dato ni botones), enlace no disponible (con 123), error inicial (Reintentar + 123 y sigue reintentando solo), barra "Sin conexión. Reintentando…" conservando el ultimo dato.
- **Polling:** primer fetch inmediato; luego 5 s, 15 s desde el tercer fallo seguido; solo con la pestaña visible y fetch inmediato al volver; se detiene en finalizada y en enlace no disponible. La pantalla de finalizada pasa sola a "sin datos" al cumplirse la hora porque el modelo se recalcula cada segundo.
- **Mapa:** OpenFreeMap dark, pin rojo 16 px con anillo pulsante (sin pulso en finalizada y con `prefers-reduced-motion`), circulo de precision (relleno 15 %, borde 40 %), trayecto rojo al 60 % de 4 px, punto de inicio blanco, `fitBounds` inicial, sigue el ultimo punto hasta que la persona arrastra o hace zoom y entonces aparece "Centrar". Atribucion visible sin compactar.

## Verificacion

- `npx vitest run`: 2 archivos, 13 pruebas en verde (estados, antiguedad con reloj del cliente corrido 10 min, ambar > 120 s, finalizada 10 / 61 min, 404, error inicial, red con datos previos, formatAge, nextDelay, circulo de 49 puntos a 50 m ± 1 m, URL de Google Maps).
- `npm run lint` (eslint 9 + eslint-config-next): sin errores ni advertencias. `npm run typecheck`: sin errores.
- `npm run build`: compila; `/t/[token]` sale como Partial Prerender y `/` como 404.
- `curl -I` contra `next start`: `/t/demo-activa` responde 200 con `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow` y `Cache-Control: no-store`; `/` responde 404.
- Recorrido con Chrome headless por CDP a 360 px (script en el scratchpad, sin instalar nada): los 8 tokens muestran el estado esperado, sin scroll horizontal; el mapa pinta trayecto, inicio, pin y precision; `demo-sin-red` muestra la barra con la antiguedad real avanzando.
- `git grep -e "4\.7110" -e "-74\.0721" -- apps` no encuentra nada; `grep -rn "supabase\|dangerouslySetInnerHTML" apps/web/src` tampoco.

## Desviaciones

**1. [Rule 1 - Bug] El worker de maplibre-gl 6 no cargaba con Turbopack**
- maplibre deduce la URL del worker desde `import.meta.url`, que el bundler reescribe ("Worker failed to load").
- Fix: `setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href)` en `TrackingMap.tsx`; Turbopack emite el archivo como recurso estatico.

**2. [Rule 1 - Bug] El contenedor del mapa media 0 px**
- `.maplibregl-map { position: relative }` del CSS de maplibre pisaba el `position: absolute` del contenedor. Fix: selector mas especifico `.map-area .map-canvas`.

**3. [Rule 3 - Bloqueo] `@types/node@^20` de create-next-app choca con el peer opcional de vitest 5.0.3**
- Se subio a `@types/node@^24` (Node local 24.19). Solo tipos, sin paquete nuevo.

**4. Ajustes respecto del texto de 01-10**
- La URL `api/public/tracking` vive en `src/lib/trackingSource.ts`, no en `TrackingView.tsx` (pedido de un unico modulo de acceso). El criterio de grep de 01-10 debe apuntar a ese archivo.
- ESLint si se instalo (lo trae create-next-app y se pidio lint en verde); 01-10 decia `--no-eslint`.
- No hay `vitest.config.ts`: las pruebas son TS puro con imports relativos y vitest las encuentra sin configuracion.
- `formatAge` tambien produce horas ("hace 2 h") y `Llamar a {Nombre}` usa el nombre completo (envuelve en dos lineas con nombres largos; botones de alto minimo 56).
- Finalizada sin ningun punto muestra "No se registró ninguna ubicación durante la alerta." en el bloque del mapa (UI-SPEC no tenia copy para ese caso).
- Turbopack copia a `.next/static/media` todos los `.mjs` de `maplibre-gl/dist` (el bundle usa `new URL(\`./${t}\`, import.meta.url)`); solo se descarga el worker. Peso extra en el despliegue, no en el navegador.

## Fuera de la lista aprobada (no instalado)

- `openapi-typescript 7.13.0` esta aprobado pero no se instalo: `apps/api/openapi.json` aun no existe (llega con 01-09). `src/lib/api-types.ts` esta escrito a mano con los campos de `TrackingDtos.cs` de 01-09.
- Nada mas fuera de la lista.

## Lo que le queda a 01-10

1. Cuando 01-09 publique `apps/api/openapi.json`: instalar `openapi-typescript@7.13.0`, agregar el script `gen:api` y reemplazar los tipos de `src/lib/api-types.ts` por los generados (o reexportarlos con los mismos nombres) para no tocar `trackingState.ts`.
2. Definir `NEXT_PUBLIC_API_URL=https://<NGROK_DOMAIN>` (local en `.env.local`, en Vercel con `vercel env add`). Con eso la franja "MODO DEMO" y las fixtures desaparecen solas.
3. Instalar la CLI de Vercel aprobada, `vercel link`, `vercel deploy --prod`, comprobar el alias de produccion en incognito y registrarlo como `Public:WebBaseUrl` del API (SMS y CORS).
4. Verificaciones humanas de 01-10: link real de un SMS en el telefono, ubicacion en vivo caminando, finalizar y ver FINALIZADA.
5. Opcional: decidir si se borran `fixtures.ts` y la rama de fixtures cuando el API exista; hoy no se cargan con la variable definida.

## Threat Flags

Ninguno nuevo. T-01-45, T-01-46, T-01-47 y T-01-49 de 01-10 quedan mitigados en el codigo; T-01-48 (Vercel Authentication) se resuelve al desplegar.

## Self-Check: PASSED

- Archivos en disco y commits `337a6cc`, `17c8420`, `2612397` en `dev`.
- Sin cambios en `apps/mobile`, `apps/api`, `.planning/config.json`, `.planning/milestone.lock`, `.planning/state.json` ni `.gsd/`.
