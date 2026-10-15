---
phase: quick-261015-pub
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/package.json
  - apps/web/package-lock.json
  - apps/web/tsconfig.json
  - apps/web/next.config.ts
  - apps/web/eslint.config.mjs
  - apps/web/.gitignore
  - apps/web/.env.example
  - apps/web/AGENTS.md
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
autonomous: true
# Adelanta la interfaz de 01-10 sin API, ngrok ni Vercel. ID propio para no marcar NOTI-03/UBIC-02
# como completos: el link real (SMS -> API -> pagina) lo cierra 01-10.
requirements: [QUICK-261015-pub]
demonstrates_ui_of: [NOTI-03, UBIC-02]

estimate:
  tokens: 120000
  tasks: 3
  confidence: medium

must_haves:
  truths:
    - "`/t/[token]` en apps/web (Next.js 16 App Router) pinta el shell 'Cargando alerta…' y luego el estado que devuelve un unico modulo de acceso (`src/lib/trackingSource.ts`) con el contrato de 01-09 (`personName`, `personPhone`, `status`, `lastLocation|null`, `trail`, `startedAt`, `endedAt|null`, `serverNow`)"
    - "Sin `NEXT_PUBLIC_API_URL` el modulo usa fixtures locales (tokens `demo-*`) y la pagina lo anuncia con la franja 'MODO DEMO'; con la variable definida nunca usa fixtures"
    - "Estados de la tabla de UI-SPEC: cargando, activa con ubicacion, ubicacion pendiente (sin mapa ni coordenada), finalizada < 1 h, finalizada >= 1 h sin datos, enlace no disponible, error inicial con Reintentar, sin conexion durante el polling conservando el ultimo dato"
    - "Mapa maplibre-gl con estilo OpenFreeMap dark (el que fija UI-SPEC/01-10), pin pulsante, circulo de precision, trayecto, punto de inicio, boton Centrar y atribucion visible"
    - "Antiguedad en vivo cada segundo calculada con `serverNow`, ambar con ' — sin actualizar' a partir de 2 min"
    - "Polling cada 5 s con la pestana visible, fetch inmediato al volver, 15 s tras 3 fallos, se detiene en finalizada y en enlace no disponible"
    - "`/t/*` responde con Referrer-Policy no-referrer, X-Robots-Tag noindex,nofollow y Cache-Control no-store"
  prohibitions:
    - requirement_id: UBIC-02
      statement: "MUST NOT pintar mapa, coordenada ni centro por defecto cuando el contrato trae `lastLocation` null"
      verification: test
---

<objective>
Construir la pagina publica `/t/[token]` de 01-10 con datos de fixtures detras de un unico modulo de acceso,
para que 01-10 solo tenga que definir `NEXT_PUBLIC_API_URL` (y generar tipos) y desplegar en Vercel.
</objective>

<context>
@.planning/phases/01-sos-de-punta-a-punta/01-10-PLAN.md
@.planning/phases/01-sos-de-punta-a-punta/01-09-PLAN.md
@.planning/phases/01-sos-de-punta-a-punta/01-UI-SPEC.md (Pagina publica de seguimiento)
@.planning/phases/01-sos-de-punta-a-punta/01-CONTEXT.md (D-06, D-07, D-08, D-16)
@.planning/phases/01-sos-de-punta-a-punta/01-02-SUMMARY.md (paquetes aprobados)
</context>

<tasks>

<task type="tracer">
  <name>Tarea 1: Proyecto apps/web con tema y cabeceras de privacidad</name>
  <action>`create-next-app@16.4.1` (TS, App Router, src, ESLint, sin Tailwind); quitar la plantilla (solo existe `/t/[token]`);
  `maplibre-gl@6.13.0` y `vitest@5.0.3` exactos; scripts `test` y `typecheck`; `next.config.ts` con `headers()` para `/t/:path*`;
  `layout.tsx` con `lang="es-CO"`, DM Sans 400/600 y robots noindex; `globals.css` con los tokens de UI-SPEC.</action>
  <verify>`npm run build` compila.</verify>
</task>

<task type="auto" tdd="true">
  <name>Tarea 2: Logica pura y modulo de acceso con fixtures</name>
  <behavior>
    - applyResult/toViewModel: pendiente sin mapa ni URL de Google Maps; activa con antiguedad por `serverNow`; ambar > 120 s; finalizada < 1 h sin 123 ni polling; >= 1 h sin datos ni botones; 404 -> noDisponible con 123; error sin datos -> errorInicial; error con datos -> conserva datos y barra sin conexion
    - formatAge(45) = "hace 45 s", formatAge(130) = "hace 2 min"; nextDelay(0..2) = 5000, nextDelay(3) = 15000
    - precisionCircle cerrado de 49 puntos a radio ± 1 m; googleMapsUrl
  </behavior>
  <verify>`npx vitest run` en verde.</verify>
</task>

<task type="auto">
  <name>Tarea 3: Vista cliente, mapa y polling</name>
  <action>`page.tsx` con Suspense sobre `params` (cacheComponents); `TrackingView.tsx` con polling, reloj de 1 s, banner aria-live, hoja inferior y botones;
  `TrackingMap.tsx` con `next/dynamic` `ssr:false`.</action>
  <verify>`npm run lint`, `npm run typecheck`, `npm run build`; recorrido de los tokens demo con `next start`.</verify>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation |
|-----------|----------|-----------|-------------|------------|
| T-q261015-01 | Information Disclosure | Token via Referer | mitigate | `Referrer-Policy: no-referrer` en `/t/*`, `rel="noopener noreferrer"` en Google Maps |
| T-q261015-02 | Information Disclosure | Indexacion / cache | mitigate | `X-Robots-Tag`, metadata robots, `Cache-Control: no-store`, `fetch` con `cache: "no-store"` |
| T-q261015-03 | Tampering (XSS) | Nombre de la persona | mitigate | Solo texto via React; sin `dangerouslySetInnerHTML` |
| T-q261015-04 | Spoofing | Fixtures confundidas con datos reales | mitigate | Fixtures solo sin `NEXT_PUBLIC_API_URL`, franja 'MODO DEMO' visible |
</threat_model>

<output>
`261015-pub-SUMMARY.md` y fila en "Quick Tasks Completed" de `.planning/STATE.md`.
</output>
