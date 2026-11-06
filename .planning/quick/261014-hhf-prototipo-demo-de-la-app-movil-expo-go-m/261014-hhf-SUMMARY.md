---
phase: quick-261014-hhf
plan: 01
subsystem: mobile
tags: [expo, expo-router, expo-go, demo, sos, secure-store, expo-location]
requires: []
provides:
  - "Prototipo navegable en Expo Go: registro/login -> contactos -> SOS (hold 2 s) -> cuenta regresiva 5 s -> alerta activa -> ESTOY A SALVO"
  - "src/demo/logic.ts: funciones puras con chequeo ejecutable (node src/demo/logic.check.ts)"
  - "src/demo/store.tsx: DemoProvider/useDemo persistido en SecureStore"
affects: [apps/mobile]
tech-stack:
  added: [eslint@9.39.5, eslint-config-expo@57.0.2]
  patterns:
    - "Stack.Protected como guardia de sesion y de alerta activa (D-12)"
    - "Estados de entrega derivados del tiempo (simulatedStatus), nunca guardados"
    - "Animated de RN + react-native-svg en lugar de Reanimated (Expo Go)"
key-files:
  created:
    - apps/mobile/src/demo/logic.ts
    - apps/mobile/src/demo/logic.check.ts
    - apps/mobile/src/demo/store.tsx
    - apps/mobile/src/components/ui.tsx
    - apps/mobile/src/components/ContactForm.tsx
    - apps/mobile/src/components/HoldButton.tsx
    - apps/mobile/src/lib/useLocation.ts
    - apps/mobile/src/app/_layout.tsx
    - apps/mobile/src/app/(auth)/_layout.tsx
    - apps/mobile/src/app/(auth)/login.tsx
    - apps/mobile/src/app/(auth)/register.tsx
    - apps/mobile/src/app/(app)/_layout.tsx
    - apps/mobile/src/app/(app)/(tabs)/_layout.tsx
    - apps/mobile/src/app/(app)/(tabs)/index.tsx
    - apps/mobile/src/app/(app)/(tabs)/contacts.tsx
    - apps/mobile/src/app/(app)/contacts/new.tsx
    - apps/mobile/src/app/(app)/contacts/[id].tsx
    - apps/mobile/src/app/(app)/countdown.tsx
    - apps/mobile/src/app/(app)/alert.tsx
    - apps/mobile/eslint.config.js
  modified:
    - apps/mobile/package.json
    - apps/mobile/package-lock.json
    - apps/mobile/app.json
    - apps/mobile/tsconfig.json
    - apps/mobile/src/theme.ts
  deleted:
    - apps/mobile/App.tsx
    - apps/mobile/index.ts
decisions:
  - "Modo demo puro con datos locales (L1) y Expo Go (L2), decididos por Roberto: sin backend, sin MapLibre, sin Reanimated"
  - "'Compartir ubicación' envía un enlace fijo de Google Maps y no promete seguimiento en vivo (la página pública 01-10 aún no existe)"
  - "El plan no completa ningún requisito de ROADMAP: ROADMAP.md y REQUIREMENTS.md quedan intactos"
metrics:
  started: 2026-10-14T17:50:00Z
  completed: 2026-10-14T18:06:00Z
  tasks: 3
  files: 27
status: complete
commits: 3
plan_head_before: 17b6b3484c41fd37d7b6971ab528a82b0b6551db
actuals:
  tokens: 16000
  tasks: 3
  commits: 3
---

# Quick 261014-hhf: Prototipo demo de la app móvil (Expo Go) Summary

Prototipo navegable de AlertaYA en Expo Go con tema oscuro, franja "MODO DEMO · no se envían SMS reales" en todas las pantallas, sesión/contactos/alerta persistidos en SecureStore, hold de 2 s con anillo SVG, cuenta regresiva cancelable y alerta activa con estados de entrega simulados de forma honesta y ubicación GPS real (o "Ubicación pendiente").

## Qué se construyó

- **Tarea 1 (tracer, `8313c67`)**: Expo Router como entrada (`expo-router/entry`), alias `@/`, `app.json` oscuro con plugin de `expo-location` solo en primer plano, `logic.ts` puro con `logic.check.ts` ("logic ok"), store con tres claves de SecureStore y guardias `Stack.Protected` de sesión. Login hasta Inicio con splash sin parpadeo. ESLint configurado con `expo lint`.
- **Tarea 2 (`33eab29`)**: registro con validación al salir del campo, `ContactForm` único para nuevo/editar (chips de relación, duplicado, toast), lista de contactos con contador, diálogo de eliminar, estado vacío y FAB.
- **Tarea 3 (`8ad1ec4`)**: `HoldButton` (ring SOS 2000 ms y fill ESTOY A SALVO 3000 ms, hápticos, `accessibilityActions`), `useLocation` (cinco estados, nunca coordenada por defecto), Inicio con card de ubicación, `countdown` (vibración por segundo, atrás deshabilitado, CANCELAR) y `alert` (cronómetro desde `createdAt`, titular honesto, estados En cola -> Enviado -> Entregado / Falló + "Llamar a", compartir, 123).

## Verificación automática (todo en `apps/mobile`)

- `node src/demo/logic.check.ts` -> `logic ok`
- `npx tsc --noEmit` -> sin errores
- `npx expo lint` -> sin errores
- `npx expo export --platform android --output-dir dist` -> bundle Android generado (`dist/` ignorado por git)
- Gates de grep (sin hex fuera de `theme.ts`, sin `Tabs` deprecado, sin Reanimated/MapLibre/Supabase, sin "ENVIADA") -> `GATES_OK`
- `npx expo-doctor` -> 19/21; ver "Pendientes" (2 avisos, no resueltos a propósito)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Bloqueo] `npx expo lint` no pudo instalar eslint por conflicto de peer deps preexistente**
- **Found during:** Tarea 1
- **Issue:** `npm install` fallaba con ERESOLVE: `react-dom@19.3.1` (instalado en 01-02 como peer opcional) exige `react@^19.3.1` y el proyecto fija `react@19.2.3`.
- **Fix:** se instalaron exactamente los dos paquetes aprobados (`eslint@^9` -> 9.39.5 y `eslint-config-expo@~57.0.2`, ambos verificados en npm) con `npm install -D ... --legacy-peer-deps`; luego `npx expo lint` generó `eslint.config.js` y el script `lint`. No se sustituyó ningún paquete.
- **Files modified:** apps/mobile/package.json, apps/mobile/package-lock.json
- **Commit:** 8313c67

**2. [Rule 1 - Bug] Reglas `react-hooks/refs` e impureza de React Compiler en lint**
- **Found during:** Tarea 3
- **Issue:** `useRef(new Animated.Value()).current`, `fixRef.current = fix` en render y `useState(Date.now())` rompían lint.
- **Fix:** `useState(() => new Animated.Value(...))`, asignación del ref en un efecto y `useState(() => Date.now())`.
- **Files modified:** HoldButton.tsx, countdown.tsx, alert.tsx
- **Commit:** 8ad1ec4

**3. [Rule 2 - Crítico] Guarda anti-bucle en `setAlertLocation`**
- **Found during:** Tarea 1 (store)
- **Issue:** `alert.tsx` llama `setAlertLocation(fix)` en un efecto cuyas dependencias incluyen la acción; como la acción cambia con cada actualización del store, habría un bucle infinito.
- **Fix:** `setAlertLocation` ignora un fix con el mismo `at` que ya está guardado.
- **Files modified:** apps/mobile/src/demo/store.tsx
- **Commit:** 8313c67

**4. [Menor] `addContact` recibe el contacto sin `id`** (`Omit<Contact, 'id'>`), porque el store genera el id como pide el plan; `CANCELAR` y el margen inferior dependen del padding de `Screen` (24) en vez de un margen propio, para no duplicar el espacio.

### Pendientes / avisos de `expo-doctor` (no resueltos a propósito)

- **Falta el peer `expo-font`** (lo exige `@expo/vector-icons`). No está entre los paquetes aprobados en 01-02, así que no se instaló. En Expo Go no afecta (Expo Go ya lo trae y el bundle exporta bien); sí hará falta para el development build. Resolver con `npx expo install expo-font` previa aprobación de Roberto.
- **`expo` 57.0.24 vs 57.0.29 esperado** (desfase de parche, heredado de 01-02). No se tocó.
- `npx expo-doctor` se descargó con `npx` en el momento (es la herramienta oficial que cita el plan y AGENTS.md); no modifica el proyecto.
- Aviso de Node: `logic.check.ts` imprime `MODULE_TYPELESS_PACKAGE_JSON` (inocuo; evitarlo exigiría `"type": "module"` en package.json).

## Known Stubs

Ninguno que bloquee el objetivo. Los estados de entrega (En cola/Enviado/Entregado/Falló) son simulados a propósito (`simulatedStatus`) y quedan declarados al usuario por la franja MODO DEMO visible en todas las pantallas. Fuera de alcance según el plan: Supabase/API, mapa MapLibre, Reanimated, DM Sans, página pública `/t/[token]`, outbox offline.

## Threat Flags

Ninguno nuevo respecto al `<threat_model>` del plan.

## Recorrido humano pendiente (para Roberto, en Expo Go sobre el Android físico)

No se ejecutó en dispositivo (hápticos, vibración, permisos, ToastAndroid, guardias al reabrir y hold solo se comprueban allí). Pasos 1 a 10 de "Recorrido del demo" del PLAN:

1. `cd apps/mobile && npx expo start` (o `--tunnel`), escanear con Expo Go (SDK 57).
2. Splash -> Login con la franja MODO DEMO; "Crear cuenta" con datos válidos -> entra a Inicio.
3. SOS gris sin contactos; agregar "Ana García" 300 111 2222 (Mamá) y "Prueba Falla" 300 000 0000; probar el duplicado.
4. Pestaña Contactos: contador, editar ("Cambios guardados."), diálogo de eliminar (cancelar).
5. Inicio: "Permitir ubicación" -> "Ubicación lista · ±n m".
6. SOS < 2 s no hace nada; 2 s abre la cuenta regresiva 5..1 con vibración; atrás no hace nada; CANCELAR -> "Alerta cancelada. No se envió nada.".
7. SOS y dejar llegar a 0: Alerta activa con cronómetro, estados de Ana y de Prueba Falla (+ "Llamar a Prueba"), ubicación "±n m · hace x s", compartir.
8. Cerrar Expo Go del todo y reabrir: entra directo a Alerta activa con el cronómetro desde la hora real de inicio.
9. Mantener ESTOY A SALVO 3 s -> Inicio con el toast de alerta finalizada.
10. Opcional: negar ubicación o GPS apagado -> "Ubicación pendiente" en la alerta; "Cerrar sesión" -> Login.

Si en el paso 7 u 8 la navegación no cambia sola, el arreglo va en `(app)/_layout.tsx` (guardias).

## Self-Check: PASSED

- Archivos creados verificados en disco (20 archivos listados) y `App.tsx`/`index.ts` eliminados.
- Commits `8313c67`, `33eab29`, `8ad1ec4` existen en `dev`; `git rev-list --count 17b6b34..HEAD` = 3.
- ROADMAP.md y REQUIREMENTS.md sin cambios.
