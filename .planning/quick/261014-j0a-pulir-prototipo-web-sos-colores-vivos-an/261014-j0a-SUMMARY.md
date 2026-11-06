---
phase: quick-261014-j0a
plan: 01
subsystem: apps/mobile (prototipo demo)
tags: [expo, react-native-web, reanimated, expo-linear-gradient, demo, sos, historial, ajustes]
requires:
  - phase: quick-261014-hhf
    provides: prototipo demo de la app móvil (login, contactos, SOS, cuenta regresiva, alerta activa)
provides:
  - web: la app corre en el navegador (columna de teléfono de 480 px) con persistencia en localStorage
  - SOS que responde al dedo (Android) y al mouse (web), con decoración no táctil debajo del Pressable
  - paleta viva con degradados y movimiento en todas las pantallas
  - pestañas Inicio / Historial / Contactos / Ajustes, vista del contacto y bienvenida de 3 pantallas
  - botón "Reiniciar demo" en Ajustes (extra aprobado por el orquestador)
affects: [apps/mobile]
tech-stack:
  added:
    - react-dom 19.2.3
    - react-native-web ^0.21.2
    - "@expo/metro-runtime ~57.0.17"
    - react-native-reanimated 4.5.1
    - react-native-worklets 0.10.1
    - expo-linear-gradient ~57.0.2
    - expo-font ~57.0.4
    - react-native-gesture-handler ~2.32.0 (solo pin del SDK; nadie lo importa)
  patterns:
    - "Decoración sobre un control táctil: View con pointerEvents 'none' en el style, renderizado ANTES del Pressable (nunca pointerEvents en <Svg>)"
    - "Progreso del hold con Animated de react-native (driver JS); Reanimated solo para adorno"
    - "toast() de módulo + <SnackbarHost /> montado una vez en la raíz"
    - "Estados de entrega simulados con una sola función (deliveryRows) para la alerta activa y el snapshot del historial"
key-files:
  created:
    - apps/mobile/src/components/TrailMap.tsx
    - apps/mobile/src/app/(auth)/welcome.tsx
    - apps/mobile/src/app/(app)/(tabs)/history.tsx
    - apps/mobile/src/app/(app)/(tabs)/settings.tsx
    - apps/mobile/src/app/(app)/history/[id].tsx
    - apps/mobile/src/app/(app)/tracking.tsx
  modified:
    - apps/mobile/package.json
    - apps/mobile/package-lock.json
    - apps/mobile/app.json
    - apps/mobile/src/theme.ts
    - apps/mobile/src/demo/logic.ts
    - apps/mobile/src/demo/logic.check.ts
    - apps/mobile/src/demo/store.tsx
    - apps/mobile/src/components/ui.tsx
    - apps/mobile/src/components/HoldButton.tsx
    - apps/mobile/src/components/ContactForm.tsx
    - apps/mobile/src/app/_layout.tsx
    - apps/mobile/src/app/(auth)/_layout.tsx
    - apps/mobile/src/app/(auth)/login.tsx
    - apps/mobile/src/app/(auth)/register.tsx
    - apps/mobile/src/app/(app)/_layout.tsx
    - apps/mobile/src/app/(app)/(tabs)/_layout.tsx
    - apps/mobile/src/app/(app)/(tabs)/index.tsx
    - apps/mobile/src/app/(app)/(tabs)/contacts.tsx
    - apps/mobile/src/app/(app)/countdown.tsx
    - apps/mobile/src/app/(app)/alert.tsx
decisions:
  - "L-01: web aprobada por Roberto el 2026-10-14 (react-dom, react-native-web, @expo/metro-runtime), fuera de la lista de 01-02"
  - "L-02: causa raíz del SOS que no respondía = capas SVG con pointerEvents en <Svg> encima del Pressable; ahora debajo y en un View no táctil"
  - "L-03: desviación deliberada de la paleta sobria de 01-UI-SPEC por una paleta viva con degradados"
  - "Desviación de 01-UI-SPEC ('sin pestañas muertas'): las 4 pestañas funcionan en local"
  - "Reiniciar demo (extra aprobado por el orquestador) vive en Ajustes, variante danger, con confirmación (confirm en web, Alert en Android)"
metrics:
  duration: "~1 h 10 min"
  completed: 2026-10-14
  tasks: 3
  files: 26
status: complete
actuals:
  tokens: 19200
  tasks: 3
  commits: 3
plan_head_before: 545ac25b2e29777bf81d9ed5fa66a1bafe7bc452
---

# Phase quick-261014-j0a Plan 01: Pulir el prototipo web, SOS, colores vivos y animación Summary

**El prototipo corre en navegador y en Expo Go, el SOS responde al dedo y al mouse, y la app tiene paleta viva, movimiento en cada pantalla, Historial, Ajustes, vista del contacto, bienvenida y "Reiniciar demo".**

## Qué se hizo

Tres commits en `dev` (base `545ac25`), uno por tarea:

| Tarea | Commit | Resumen |
| ----- | ------ | ------- |
| 1 (tracer) | `4aedb2f` | Paquetes de web y animación, SOS corregido, paleta viva, localStorage en web, snackbar propio |
| 2 | `db9eb60` | Entradas escalonadas, contactos animados, estados de entrega con transición, cuenta regresiva y punto ACTIVA animados |
| 3 | `e304456` | Historial + detalle, Ajustes, vista del contacto, bienvenida, lógica pura con chequeos, Reiniciar demo |

- **SOS (L-02):** la decoración (glow, ondas y anillo de progreso) quedó dentro de un `View` con `pointerEvents: 'none'` en su style y renderizado antes del `Pressable`. Ya no hay `pointerEvents` en ningún `<Svg>`. Con 0 contactos el disco es gris, con candado y "SIN CONTACTOS"; al tocarlo tiembla, vibra (Android) y muestra el snackbar "Agrega al menos un contacto para usar SOS." con la acción AGREGAR. `startAlert` del store sigue ignorando 0 contactos.
- **Web (L-01):** `leer`/`guardar` usan `localStorage` en web y SecureStore en Android; sin `ToastAndroid` en todo `src`; columna de teléfono de 480 px; "Abrir ajustes" no aparece en web.
- **Paleta y movimiento (L-03):** `theme.ts` conserva todas las claves y suma las vivas más `gradients`. `PressableScale` con resorte, `Card`, `Button` con degradado (variantes `cool` y `danger`), `Chip`, `Respira`, `Logo`, `PuntoActivo`, `SnackbarHost`/`toast`, `entrada(i)`. La cuenta regresiva tiene número que salta, anillo por segundo y fondo pulsante.
- **Pantallas nuevas (L-04):** pestañas Inicio | Historial | Contactos | Ajustes con indicador animado; Historial con snapshot de estados simulados y detalle con `TrailMap` (SVG) o "Sin ubicación registrada"; Ajustes con ventana de 3/5/10 s y modo silencioso que sí cambian la cuenta regresiva; "Vista del contacto" con iframe de OpenStreetMap solo en web y solo con fix real; bienvenida de 3 pantallas en el primer arranque.
- **Extra aprobado:** "Reiniciar demo" en Ajustes. Pide confirmación (`window.confirm` en web, `Alert.alert` en Android) y borra sesión, contactos, alerta, historial, ajustes y el flag de bienvenida (memoria y almacenamiento), así que vuelve a la bienvenida.
- **Honestidad (L-05):** la franja "MODO DEMO · no se envían SMS reales" sigue montada en la raíz; el historial dice "Estados simulados (modo demo)."; la vista del contacto dice "Vista previa (modo demo)"; no hay "ENVIADA" ni coordenadas literales fuera de `logic.check.ts`.

## Verificación

- `node src/demo/logic.check.ts` imprime `logic ok` (los asserts nuevos se escribieron primero y fallaron con "does not provide an export named DEFAULT_SETTINGS" antes de implementar: RED, luego GREEN).
- `npx tsc --noEmit` y `npx expo lint`: sin errores ni advertencias.
- `npx expo export --platform android` y `--platform web`: compilan.
- Gates impresos: `T1_OK`, `T2_OK`, `DEPS_OK` (solo los 8 paquetes aprobados), `GATES_OK`, `SMOKE_OK` (servidor de desarrollo en el puerto 8099, ya detenido).
- `npm ls react react-dom --depth=0`: ambos 19.2.3.
- **Verificación extra no pedida:** recorrido con Chrome headless (script de CDP, sin instalar nada) sobre el servidor web. Pasó: bienvenida -> Comenzar -> login; SOS sin contactos (snackbar + AGREGAR); soltar antes de 2 s no inicia; mantener 2 s con el mouse inicia la cuenta regresiva; la cuenta termina en la alerta activa con contactos y botón "Ver lo que ven tus contactos"; vista del contacto con "UBICACIÓN PENDIENTE" y sin iframe; Historial y detalle con el recorrido; Ajustes cambia la ventana a 10 s y la guarda; Reiniciar demo deja el storage vacío y vuelve a la bienvenida.
- `npx expo-doctor`: 20/21. Único fallo: parche de `expo` (esperado ~57.0.29, instalado 57.0.24), heredado de 01-02, solo anotado.

## Desviaciones del plan

### Auto-fixed Issues

**1. [Rule 3 - Bloqueo] Origen de `react-dom` no coincide literalmente con `github.com/facebook/react`**
- **Found during:** Tarea 1, comprobación `npm view <paquete> repository.url`
- **Issue:** react-dom (y el `react` ya instalado) devuelven `git+https://github.com/react/react.git`, no `facebook/react`.
- **Verificación hecha antes de instalar:** `github.com/facebook/react` responde 301 a `github.com/react/react` (el repositorio cambió de organización); los mantenedores en npm son `fb` y `react-bot <react-core@meta.com>`; el `react` que ya estaba instalado trae la misma URL. Es el mismo proyecto, no un paquete sustituto. Se instaló.
- **Commit:** `4aedb2f`

**2. [Rule 1 - Bug] `StyleSheet.absoluteFillObject` no existe en React Native 0.86**
- **Found during:** Tarea 1, `tsc`
- **Fix:** se usa `...StyleSheet.absoluteFill`.
- **Files modified:** `HoldButton.tsx`
- **Commit:** `4aedb2f`

**3. [Rule 2 - Crítico] `Alert.alert` de react-native-web no hace nada, también en "Reiniciar demo"**
- **Fix:** el reinicio usa `window.confirm` en web, igual que eliminar contacto; sin esto el botón nuevo no habría hecho nada en el navegador.
- **Files modified:** `settings.tsx`
- **Commit:** `e304456`

### Ajustes menores respecto del texto del plan (sin cambiar el comportamiento pedido)

- `PuntoActivo` pasó de `alert.tsx` a `ui.tsx` porque la vista del contacto también lo usa.
- `formatFecha` se agregó a `logic.ts` (no en la pantalla) para usarla desde Historial y su detalle sin importar de un archivo de ruta.
- `Chip`, `Respira` y `Logo` son componentes nuevos de `ui.tsx` que no figuraban en el plan (los usan ContactForm, Ajustes, login y bienvenida).
- `COUNTDOWN_OPTIONS`, `Settings` y `DEFAULT_SETTINGS` viven en `logic.ts`; el store reexporta el tipo `Settings`.

## Registro pedido por el plan

- **Aprobación de Roberto (2026-10-14)** de `react-dom`, `react-native-web` y `@expo/metro-runtime`, fuera de la lista de 01-02. El resto de paquetes estaba en la lista aprobada de 01-02.
- **`react-native-gesture-handler`** se instaló solo como pin del SDK 57 (`~2.32.0`): `react-native-drawer-layout` (transitivo de expo-router) lo exige como peer al aparecer Reanimated y npm habría traído la 3.3.0 fuera del SDK. Nadie lo importa.
- **Desviación deliberada de la paleta** de 01-UI-SPEC por una paleta viva con degradados (L-03). El texto blanco sobre degradados vivos solo se usa en botones de 16/600 o más y en el SOS; el contraste de esos botones baja a ~4:1, aceptado por la desviación.
- **Desviación de las pestañas** de 01-UI-SPEC ("sin pestañas muertas"): las cuatro pestañas funcionan en local.
- **`--legacy-peer-deps`:** no hizo falta; `npx expo install` resolvió sin ERESOLVE.
- ROADMAP.md y REQUIREMENTS.md quedan intactos.

## Known Stubs

Ninguno. Los estados de entrega simulados son intencionales (modo demo, anunciados en pantalla) y no son un stub pendiente.

## Issues Encontrados / Notas

- **Advertencia de desarrollo en web:** `Received false for a non-boolean attribute collapsable` en la consola del navegador. Es el aviso conocido de Reanimated con react-native-web (agrega `collapsable={false}` a vistas animadas). No afecta el comportamiento ni aparece en Android.
- **No verificado aquí (necesita ojos y manos de Roberto):** toques reales del SOS en Expo Go, hápticos, el permiso de ubicación del navegador y el iframe de OpenStreetMap con un fix real (en el smoke no hay geolocalización, así que solo se vio la rama "ubicación pendiente"), y la sensación del movimiento.
- **Puerto 8081:** al terminar hay un `expo start --lan` en el puerto 8081 (PID 40636, creado a la 1:29 p. m.). No lo inicié yo; lo dejé como estaba. Mi servidor de smoke (8099) y el Chrome headless están cerrados.
- `npm audit` reporta 31 vulnerabilidades de dependencias transitivas del árbol de Expo; no se tocaron (fuera de alcance).
- `apps/mobile/dist/` quedó con los bundles de las verificaciones; está en `.gitignore` y no se commiteó.

## Recorrido humano para Roberto (no bloqueó la ejecución)

Seguir el "Recorrido del demo" de `261014-j0a-PLAN.md` en Chrome (`cd apps/mobile && npx expo start --web`, http://localhost:8081, modo dispositivo 390 x 844) y en Expo Go sobre su Android. Puntos que solo se comprueban a mano:

1. Paso 6: mantener el SOS con el dedo en Android (la causa raíz era táctil en Android) y confirmar que el anillo se llena y que soltar antes lo devuelve a 0.
2. Paso 5 y 9: aceptar el permiso de ubicación del navegador y ver el mapa de OpenStreetMap con el marcador real; en Android, el recorrido SVG.
3. Paso 7: con modo silencioso y 3 s, la cuenta no vibra y la pantalla es oscura.
4. Nuevo: Ajustes -> "Reiniciar demo" -> confirmar -> vuelve la bienvenida con todo en blanco (útil para ensayar).
5. Con "reducir movimiento" activado en el sistema, el movimiento decorativo se apaga y los holds siguen funcionando.

## Threat Flags

Ninguno nuevo. El iframe de OpenStreetMap, el `tel:` y localStorage ya estaban en el modelo de amenazas del plan (T-q261014j-03, -04, -06).

## Self-Check: PASSED

- Archivos creados verificados en disco: `TrailMap.tsx`, `welcome.tsx`, `history.tsx`, `settings.tsx`, `history/[id].tsx`, `tracking.tsx`.
- Commits existentes en `dev`: `4aedb2f`, `db9eb60`, `e304456` (`git rev-list --count 545ac25..HEAD` = 3).
