---
phase: quick-261015-pda
plan: 01
subsystem: apps/mobile (prototipo demo)
tags: [expo, puertos, adaptador-demo, alerta-activa, offline, ui-spec]
requires:
  - phase: quick-261014-j0a
    provides: prototipo demo pulido (web, animaciones, historial, ajustes)
provides:
  - "src/data: puertos AuthRepository, ContactsRepository, AlertsRepository + adaptador demo + punto único de elección (index.ts)"
  - "src/data/logic.ts: initialScreen, alertHeadline, toDeliveryView, secondsLeft, sosAvailability, uuidV4 con chequeo node"
  - "Alerta activa completa (D-09..D-12) y modo sin red honesto (SOS-03) sobre el adaptador demo"
  - "Estados de UI-SPEC en login, registro, contactos y cuenta regresiva"
affects: [apps/mobile]
tech-stack:
  added: []
  patterns:
    - "Puerto = lo que devuelve un hook (useAuth/useContacts/useAlerts); el adaptador real será otro archivo con los mismos hooks"
    - "Comandos async que rechazan con Error cuyo message ya es copy de UI-SPEC"
    - "Servidor SIMULADO en el store demo: confirma la alerta 1 s después de que haya red; sin confirmación todo queda En cola"
key-files:
  created:
    - apps/mobile/src/data/auth.ts
    - apps/mobile/src/data/contacts.ts
    - apps/mobile/src/data/alerts.ts
    - apps/mobile/src/data/demo.ts
    - apps/mobile/src/data/index.ts
    - apps/mobile/src/data/logic.ts
    - apps/mobile/src/data/logic.check.ts
  modified:
    - apps/mobile/src/demo/store.tsx
    - apps/mobile/src/demo/logic.ts
    - apps/mobile/src/demo/logic.check.ts
    - apps/mobile/src/components/ui.tsx
    - apps/mobile/src/components/ContactForm.tsx
    - apps/mobile/src/components/TrailMap.tsx
    - apps/mobile/src/lib/useLocation.ts
    - apps/mobile/src/app/_layout.tsx
    - apps/mobile/src/app/(app)/_layout.tsx
    - apps/mobile/src/app/(app)/alert.tsx
    - apps/mobile/src/app/(app)/countdown.tsx
    - apps/mobile/src/app/(app)/tracking.tsx
    - apps/mobile/src/app/(app)/(tabs)/index.tsx
    - apps/mobile/src/app/(app)/(tabs)/contacts.tsx
    - apps/mobile/src/app/(app)/(tabs)/history.tsx
    - apps/mobile/src/app/(app)/(tabs)/settings.tsx
    - apps/mobile/src/app/(app)/history/[id].tsx
    - apps/mobile/src/app/(auth)/_layout.tsx
    - apps/mobile/src/app/(auth)/login.tsx
    - apps/mobile/src/app/(auth)/register.tsx
    - apps/mobile/src/app/(auth)/welcome.tsx
decisions:
  - "Los puertos son la forma que devuelven los hooks (no clases): encaja con react-query, que 01-11..01-15 usarán en el adaptador real"
  - "Historial, ajustes, bienvenida y reinicio quedan fuera de los puertos (useLocalExtras): viven en el teléfono en esta fase; el historial real es Fase 3"
  - "Estoy a salvo lleva a una pantalla final (pedido de Roberto) en vez de solo el snackbar de UI-SPEC; 'Volver al inicio' la cierra"
  - "toDeliveryView: en_cola con alerta confirmada dice 'Preparando el SMS' (UI-SPEC no define esa línea); sin confirmar, 'Esperando red'"
metrics:
  completed: 2026-10-15
  tasks: 3
  commits: 3
status: complete
---

# Quick 261015-pda: Puertos de datos, alerta activa completa y sin red — Summary

Las pantallas ya no hablan con el store demo: leen y escriben por tres puertos pequeños que entrega `src/data/index.ts`. Sobre el adaptador demo, la alerta activa quedó completa según UI-SPEC y D-09..D-12, la alerta se guarda en el teléfono con `clientGeneratedId` antes de cualquier red, y login, registro, contactos y cuenta regresiva cubren los estados de UI-SPEC que faltaban.

## Commits (en `dev`, base `eb03b9c`)

| Tarea | Commit | Resumen |
|-------|--------|---------|
| 1 | `098189d` | Puertos + adaptador demo + `initialScreen` (D-12); ninguna pantalla importa `@/demo/store` |
| 2 | `8dfa27c` | Alerta activa completa y modo sin red |
| 3 | `b9e6701` | Estados de UI-SPEC en login, registro, contactos y cuenta regresiva |

## Qué se hizo

- **Puertos (`src/data/{auth,contacts,alerts}.ts`, solo tipos).** Nombres de 01-06/01-13/01-14: `DeliveryEstado` = `en_cola | enviando | reintento | enviado | entregado | fallido | cancelado` con `intentos`; `AlertEstado` = `activa | finalizada`; `Alert { clientGeneratedId, serverId, estado, creadoEn, finalizadaEn, trackingUrl, ultimaUbicacion { lat, lon, precisionMetros, capturadaEn }, trail, contactos }`. `AlertsRepository.online` es `boolean | null` (null = no se sabe).
- **Adaptador demo (`src/data/demo.ts`)** sobre `useDemo()`; **`src/data/index.ts`** es el único punto que lo elige y exporta `IS_DEMO` (la franja MODO DEMO depende de él).
- **Alerta activa:** cronómetro desde `creadoEn`; banner "Sin conexión. Tu alerta está guardada y se enviará en cuanto vuelva la red."; titular `alertHeadline` (nunca "enviado" sin confirmación del servidor; singular "1 de 1 contacto recibió tu aviso."); estados solo por `toDeliveryView`; fila fallida con "Llamar a {Nombre}" (`tel:`) y háptico al pasar a Falló; "Generando enlace…" hasta que la alerta se confirma, "Compartir enlace" con `trackingUrl` cuando exista, y en el demo (sin página pública) "Compartir ubicación" con el enlace de Maps de la ubicación real; "Llamar al 123"; ESTOY A SALVO (3 s) -> "Finalizando…" -> estado `finalizada` y pantalla final; sin red rechaza con "No pudimos finalizar la alerta. Sigue activa. Intenta de nuevo.".
- **Sin red (SOS-03):** `startAlert` guarda en SecureStore/localStorage con `clientGeneratedId` (UUID v4) y `syncedAt: null`. El "servidor" simulado del store la confirma 1 s después de que haya red; mientras tanto todos los contactos están "En cola · Esperando red". En web la red se detecta con `navigator.onLine`.
- **D-12:** `initialScreen` decide splash / bienvenida / login / alerta / inicio; con alerta activa (o finalizada sin cerrar) la única pantalla es `/alert`. Alertas guardadas por la versión anterior del demo se normalizan al leerlas.
- **Estados de UI-SPEC:** login y registro con spinner, campos deshabilitados, sin doble envío y `ErrorBanner`; registro con "Revisa tu correo" si el puerto devuelve `needsEmailConfirmation`; contactos con `SkeletonRows` (3 filas), error de carga con "Reintentar", error al guardar y al eliminar; el formulario espera la lista; cuenta regresiva con deadline absoluto (`secondsLeft`) que dispara al volver a primer plano si venció; Inicio con `sosAvailability` (un error de carga nunca bloquea el SOS) y "Avisaremos a {n} contactos".

## Verificación

- `node src/data/logic.check.ts` -> `data logic ok` (initialScreen, alertHeadline, toDeliveryView incluido "solo enviado produce Enviado / solo entregado produce Entregado" sobre todos los estados del API, secondsLeft, sosAvailability, uuidV4).
- `node src/demo/logic.check.ts` -> `logic ok` (se agregó: `simulatedStatus` nunca retrocede en el tiempo; `formatElapsed(3725000)` = "1:02:05").
- `npx tsc --noEmit`: sin errores. `npx expo lint`: sin errores ni advertencias.
- `npx expo export --platform web`: compila (bundle web 2.6 MB).
- **Smoke extra en Chrome headless** sobre el bundle exportado, con una alerta sin confirmar sembrada en localStorage: abre directo en Alerta activa (D-12) con "01:05", "Guardada en tu teléfono…", dos "Esperando red", "Generando enlace…" y ubicación pendiente; 9 s después (con red) muestra "1 de 2 contactos recibió tu aviso.", "Entregado", "Falló" y "Llamar a Prueba Falla".

## Pendiente (para qué plan)

- **Paquetes no agregados (regla de la tarea):** `@react-native-community/netinfo` (detección de red en Android; hoy `online` es `null` allí y el banner nunca aparece) -> 01-13. `expo-crypto` (`randomUUID`; hoy `uuidV4` con `Math.random`, marcado `ponytail:`) -> 01-13. `@tanstack/react-query`, `@supabase/supabase-js`, `openapi-fetch` y Jest -> 01-11/01-12.
- **Adaptador real:** un archivo nuevo en `src/data/` con `useAuth` (01-11, Supabase), `useContacts` (01-12, `/api/emergency-contacts`) y `useAlerts` (01-13 POST + sync con backoff, 01-14 `/status`, `/active` y `/finish`, 01-15 ubicación), elegido en `src/data/index.ts`; con eso `IS_DEMO` pasa a false y la franja desaparece.
- **Mover las funciones puras** de `src/data/logic.ts` a `features/alert/*` y `features/auth/routeGuard.ts` cuando 01-11 instale Jest (las firmas ya siguen los `<behavior>`). `reconcileActiveAlert` (01-14) y `nextBackoffMs`/`syncPendingAlert` (01-13) no se hicieron: necesitan servidor.
- **Rehidratación desde el servidor al reabrir** (skeleton 200 ms) y "Tu sesión expiró" -> 01-14 y 01-11.
- `/tracking` (vista del contacto) y el botón que la abre solo existen con `IS_DEMO`; la página real es 01-10.

## Recorrido humano para Roberto

1. Web (`npx expo start --web`): SOS hasta 0 con DevTools en "Offline": banner sin conexión, contactos "En cola · Esperando red", ESTOY A SALVO falla con el snackbar y la alerta sigue activa. Volver a "Online": en ~1 s los estados avanzan.
2. ESTOY A SALVO con red: "Finalizando…" y pantalla "Alerta finalizada"; "Volver al inicio" la cierra y aparece en Historial.
3. Cuenta regresiva: cambiar de pestaña/app durante el conteo y volver después de que venza: dispara al volver.
4. Android (Expo Go): mismo recorrido salvo el banner sin red (sin NetInfo).

## Threat Flags

Ninguno nuevo: no hay red, credenciales ni datos nuevos fuera del teléfono. La contraseña sigue sin guardarse.

## Self-Check: PASSED

- Archivos de `src/data/` creados y en git; `grep -rn "@/demo/store" src/app src/components src/lib` vacío.
- Commits `098189d`, `8dfa27c`, `b9e6701` en `dev`. No se tocó `apps/web`, `apps/api`, `.gsd/`, `config.json`, `milestone.lock` ni `state.json`. Sin push.
