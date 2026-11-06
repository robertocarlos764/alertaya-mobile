# Walking Skeleton — AlertaYA

**Phase:** 1
**Generated:** 2026-10-06

## Capability Proven End-to-End

Una persona con sesion iniciada en la app Android mantiene SOS 2 s, deja correr la cuenta regresiva y su contacto recibe un SMS real de Twilio con un link que abre, sin login, la pagina publica con el estado real de la alerta (ubicacion real con precision y antiguedad, o "ubicacion pendiente"), mientras la app muestra solo estados de entrega confirmados.

Ruta del esqueleto por planes: 01-01 (API publico por ngrok) -> 01-03/01-05 (esquema versionado aplicado) -> 01-06 (POST /api/alerts transaccional) -> 01-07 (SMS real por el outbox) -> 01-09/01-10 (link publico) -> 01-11/01-13 (sesion y SOS en el telefono) -> 01-16 (APK release y recorrido de aceptacion).

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| App movil | Expo SDK 57 + React Native 0.86 + TypeScript, Expo Router en `apps/mobile/src/app/`, development build local con Gradle y APK release para la demo | Solo Android; Expo Go no incluye MapLibre; sin EAS de pago (D-17, D-21, D-13) |
| Estado en la app | @tanstack/react-query para datos del servidor + expo-secure-store para sesion y alerta pendiente | Polling y reintentos sin hand-roll; sin zustand ni zod (no hacen falta en esta fase) |
| Contrato API <-> app | `apps/api/openapi.json` exportado con Swashbuckle CLI 6.6.2 + openapi-typescript + openapi-fetch | Un cambio de contrato rompe `tsc`; sin runtime de codegen |
| API | ASP.NET Core 8 con controllers, 4 proyectos Clean Architecture junto al existente en `apps/api/` (Domain, Application, Infrastructure, Api) | Decision del usuario (Clean Architecture); refactor solo en el corte alerta/entregas; sin mover todo a `src/` |
| Errores HTTP | ProblemDetails (RFC 9457) con extension `code` estable | La app traduce `code` a copy en espanol; nunca mensajes internos |
| Base de datos | Supabase Postgres + PostGIS gratuito existente (`vzyasmeeyvbkpoiosses`); el API conecta por el pooler de sesion con un rol que omite RLS y aplica ownership en codigo | D-16; RLS deny-all en tablas nuevas como defensa en profundidad |
| Esquema | Migraciones versionadas de Supabase CLI (`supabase/migrations`: baseline + una migracion por fase) como unica fuente de verdad; EF Core solo mapea; aplicadas al remoto solo con confirmacion de Roberto | CLAUDE.md; una sola confirmacion por fase |
| Cola de avisos | Outbox propio en Postgres (`notification_deliveries` + `private.claim_deliveries` con `FOR UPDATE SKIP LOCKED` y lease) consumido por `DeliveryDispatcher` (BackgroundService) | Durable ante reinicios; la tabla es tambien el registro visible por contacto; sin Hangfire ni MediatR |
| SMS | Twilio trial detras del puerto `ISmsSender`; "entregado" solo por webhook firmado | D-14 (reversible: detras de interfaz); veracidad |
| Auth | Supabase Auth correo + contrasena; supabase-js en la app con SecureStore; el API valida el JWT (JWKS) y toma `sub`; perfil creado por el trigger `handle_new_user` con la metadata del signUp | D-20; sin PATCH de perfil desde la app |
| Link de seguimiento | Token opaco de 128 bits derivado por HMAC del id de la alerta; en BD solo SHA-256 y `revocado_en`; ventana de 1 h tras finalizar calculada en el servidor | D-07; el API puede volver a mostrar el link sin guardarlo en claro |
| Pagina publica | Next.js 16 App Router en Vercel Hobby (`apps/web`, ruta unica `/t/[token]`), maplibre-gl + OpenFreeMap dark, polling cada 5 s, sin supabase-js ni cookies | D-08, D-16; gratis y sin claves |
| Exposicion del API | API en la PC de Roberto expuesto con ngrok y dominio estatico gratuito; esa URL fija va en el APK, en Vercel y en el StatusCallback de Twilio | D-18 (reemplaza a D-15) |
| Tiempo | `TimeProvider` inyectado en el API (FakeTimeProvider en pruebas) | Ventana de 1 h y backoff deterministas |
| Pruebas | xUnit (Domain puro; integracion con WebApplicationFactory contra el proyecto Supabase remoto con `ALERTAYA_TEST_DB`, en serie y con usuarios `it-alertaya-…` que se limpian), pgTAP en el remoto ejecutado por `BdRemotaTests` (cada archivo en `begin;`/`rollback;`) + comparacion de catalogo con `supabase/catalog/remoto.txt`, jest-expo (logica pura TS), vitest (web) | D-22: sin Docker; el remoto solo tiene datos de prueba y trae `auth` y roles reales |
| Directory layout | `apps/api/{AlertaYA.Domain, AlertaYA.Application, AlertaYA.Infrastructure, AlertaYA.Api, tests/*}`, `apps/mobile/src/{app, components, features, lib, theme, i18n}`, `apps/web/src/{app/t/[token], lib}`, `supabase/{migrations, tests}`, `scripts/` | Rutas solo en `src/app` (AGENTS.md); logica pura testeable fuera de las pantallas |

## Stack Touched in Phase 1

- [x] Project scaffold (framework, build, lint, test runner) — 01-04 (API), 01-10 (web), 01-11 (app)
- [x] Routing — al menos una ruta real: `/(auth)/login`, `/(app)/(tabs)`, `/countdown`, `/alert`, `/t/[token]`
- [x] Database — lectura y escritura reales: contactos (01-06/01-12) y alerta + entregas (01-06/01-13)
- [x] UI — elemento interactivo conectado al API: boton SOS -> `POST /api/alerts` (01-13)
- [x] Deployment — API por ngrok (01-01), pagina en Vercel (01-10), APK release en el telefono (01-16); arranque documentado en `apps/api/README.md`

## Out of Scope (Deferred to Later Slices)

- Activadores manos libres (agitar, boton de encendido, palabra clave) y tracking con pantalla apagada (fases 2 y 7)
- Onboarding con todos los permisos y servicio en primer plano (fase 2)
- Historial, ajustes y modo silencioso (fase 3)
- Panel policial e IA (fase 4)
- Cancelar con PIN, llamada automatica al 123 y escalamiento (fase 5)
- OTP de celular, recuperacion de contrasena, SMS al designar contacto y push (fase 6)
- Remitente SMS sin prefijo trial / short code y hosting siempre encendido (ideas diferidas por presupuesto)

## Subsequent Slice Plan

Cada fase siguiente agrega un corte vertical sobre este esqueleto sin cambiar sus decisiones:

- Phase 2: agitar con la app cerrada dispara el mismo SOS (misma alerta local + mismo `POST /api/alerts` + mismo outbox) y la ubicacion llega con pantalla apagada
- Phase 3: historial con el estado final real de `notification_deliveries` y ajustes guardados en el perfil (ventana de cuenta regresiva ya configurable en `profiles`)
- Phase 4: panel web policial leyendo las mismas alertas y ubicaciones, con IA minima
- Phase 5: cancelacion con PIN como nueva transicion de la maquina de estados y nuevo tipo de entrega
- Phase 6: OTP, recuperacion de contrasena y nuevos tipos/canales en `notification_deliveries` (push)
- Phase 7: activadores por boton y voz que reutilizan la cuenta regresiva y la alerta local
