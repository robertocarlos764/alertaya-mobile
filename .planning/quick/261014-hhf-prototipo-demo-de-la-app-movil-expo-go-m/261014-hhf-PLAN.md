---
phase: quick-261014-hhf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/mobile/package.json
  - apps/mobile/package-lock.json
  - apps/mobile/app.json
  - apps/mobile/tsconfig.json
  - apps/mobile/eslint.config.js
  - apps/mobile/App.tsx
  - apps/mobile/index.ts
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
autonomous: true
# Tarea rápida de demo: no completa ningún requisito del ROADMAP. ID propio a propósito para que
# execute-plan NO marque como completos AUTH/CONT/SOS/UBIC (la UI es local, sin servidor ni SMS).
requirements: [QUICK-261014-hhf]
demonstrates_ui_of: [AUTH-01, AUTH-02, CONT-01, SOS-01, SOS-02, SOS-04, UBIC-02]

estimate:
  tokens: 120000
  raw_tokens: 120000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "La app abre en Expo Go (Android, SDK 57) con tema oscuro y la franja 'MODO DEMO · no se envían SMS reales' visible arriba en TODAS las pantallas"
    - "El usuario se registra o inicia sesión localmente y, al cerrar y reabrir Expo Go, sigue dentro (sesión en SecureStore); nunca se guarda la contraseña"
    - "El usuario agrega, edita y elimina contactos (nombre, teléfono +57, relación) con la validación de UI-SPEC; con 0 contactos el SOS está deshabilitado y lo explica"
    - "Mantener SOS 2 s abre la cuenta regresiva roja de 5 s con vibración por segundo; CANCELAR vuelve a Inicio con 'Alerta cancelada. No se envió nada.' y no crea alerta"
    - "Al llegar a 0 aparece Alerta activa: cronómetro desde createdAt, titular honesto, estados por contacto En cola -> Enviado -> Entregado (o Falló + 'Llamar a {Nombre}' si el teléfono termina en 0000)"
    - "La ubicación mostrada es siempre el fix real del GPS con ±m y antigüedad, o 'Ubicación pendiente'; nunca una coordenada por defecto"
    - "Reabrir la app con una alerta activa entra directo a Alerta activa; mantener ESTOY A SALVO 3 s la finaliza y vuelve a Inicio"
  artifacts:
    - path: "apps/mobile/src/demo/logic.ts"
      provides: "Funciones puras: normalizePhone, formatPhone, isEmail, initials, simulatedStatus, headline, formatElapsed, ago"
      exports: ["normalizePhone", "formatPhone", "isEmail", "initials", "simulatedStatus", "headline", "formatElapsed", "ago"]
    - path: "apps/mobile/src/demo/logic.check.ts"
      provides: "Chequeo ejecutable con node (sin framework) de la lógica de logic.ts"
    - path: "apps/mobile/src/demo/store.tsx"
      provides: "DemoProvider + useDemo: sesión, contactos, alerta activa persistidos en SecureStore, flag hydrated, COUNTDOWN_SECONDS"
      exports: ["DemoProvider", "useDemo", "COUNTDOWN_SECONDS"]
    - path: "apps/mobile/src/components/ui.tsx"
      provides: "Screen, AppText, Button, TextField, Header, Avatar, DeliveryStatus, DemoBanner"
    - path: "apps/mobile/src/components/HoldButton.tsx"
      provides: "Botón de mantener presionado (ring SOS 2000 ms / fill a salvo 3000 ms) con hápticos y accessibilityActions"
    - path: "apps/mobile/src/lib/useLocation.ts"
      provides: "Hook de ubicación en primer plano con estados sin_permiso/denegado/obteniendo/fijada/sin_senal y fix real"
    - path: "apps/mobile/src/app/(app)/_layout.tsx"
      provides: "Stack con guardia de alerta activa (Stack.Protected) y countdown como fullScreenModal"
    - path: "apps/mobile/src/app/(app)/alert.tsx"
      provides: "Pantalla Alerta activa con estados simulados honestos, ubicación real, compartir, ESTOY A SALVO, 123"
  key_links:
    - from: "apps/mobile/src/app/_layout.tsx"
      to: "apps/mobile/src/demo/store.tsx"
      via: "DemoProvider envuelve todo; Stack.Protected guard={!!session} sobre (app) y guard={!session} sobre (auth)"
      pattern: "Stack.Protected"
    - from: "apps/mobile/src/app/(app)/countdown.tsx"
      to: "apps/mobile/src/app/(app)/alert.tsx"
      via: "startAlert(fix) cambia activeAlert; la guardia de (app)/_layout quita countdown/tabs y deja solo alert"
      pattern: "startAlert"
    - from: "apps/mobile/src/app/(app)/alert.tsx"
      to: "apps/mobile/src/demo/logic.ts"
      via: "simulatedStatus(i, telefono, now - createdAt) -> DeliveryStatus; headline(estados) -> titular"
      pattern: "simulatedStatus"
    - from: "apps/mobile/src/lib/useLocation.ts"
      to: "apps/mobile/src/demo/store.tsx"
      via: "countdown pasa el fix a startAlert; alert llama setAlertLocation(fix) en cada fix nuevo"
      pattern: "setAlertLocation"
---

<objective>
Prototipo navegable de la app móvil (`apps/mobile`) para el demo del 2026-10-15, SOLO modo demo en Expo Go sobre un Android físico.

Decisiones bloqueadas por Roberto (no re-preguntar): **(L1) modo demo puro con datos locales** (sin backend, sin Supabase, sin API); **(L2) Expo Go** (sin MapLibre, sin Reanimated, sin DM Sans; solo módulos que trae Expo Go, todos ya instalados en 01-02).

Purpose: mostrar el flujo completo registro -> contactos -> SOS -> cuenta regresiva -> alerta activa -> estoy a salvo con el diseño de 01-UI-SPEC, sin afirmar nunca un envío real: la franja "MODO DEMO" en todas las pantallas es lo que vuelve honestos los estados simulados (Core Value). La ubicación sí es real (expo-location) o "pendiente", nunca inventada.

Output: app Expo Router en `apps/mobile/src/app`, store local en `src/demo`, componentes en `src/components`, hook de ubicación en `src/lib`; bundle Android que compila; recorrido de demo para Roberto.

Fuera de alcance (no implementar, no simular con texto que lo prometa): Supabase/API, cliente OpenAPI tipado, mapa MapLibre, Reanimated, DM Sans, página pública `/t/[token]` (01-10), outbox offline y banner "Sin conexión", pantalla "Revisa tu correo", reintentos "Reintentando (1 de 2)", funciones de Fase 2+. Este prototipo NO completa los planes 01-11..01-15: no tocar ROADMAP.md ni REQUIREMENTS.md ni marcar nada como hecho.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@apps/mobile/AGENTS.md
@apps/mobile/src/theme.ts
@.planning/phases/01-sos-de-punta-a-punta/01-UI-SPEC.md

Leer de 01-UI-SPEC.md solo: "Color" (tabla de estados de entrega), "Mapa de pantallas y navegación", "Contrato por pantalla (app)", "Copywriting Contract". Ignorar la sección de la página pública web.

Hechos verificados en node_modules (SDK 57, no confiar en memoria):
- expo-router 57.0.27: `Stack`, `Redirect`, `router`, `useLocalSearchParams` desde `expo-router`; `Tabs` SOLO desde `expo-router/js-tabs` (el export `Tabs` de `expo-router` está deprecado). `Stack.Protected` existe con prop única `guard: boolean` (sin `redirectTo`, eso es SDK 58). Cuando un guard pasa a false, React Navigation quita esas pantallas del historial y cae en la primera pantalla disponible en el orden declarado. Pantallas no declaradas se agregan solas SIN protección, por eso hay que declarar todas.
- expo-location: `useForegroundPermissions()` -> `[permiso | null, request, get]`; `watchPositionAsync(opts, cb)` -> subscription con `.remove()`; `hasServicesEnabledAsync()`; `Accuracy.High`. `coords.accuracy` puede ser null.
- expo-keep-awake: `useKeepAwake()`. expo-haptics: `impactAsync(ImpactFeedbackStyle.Light)`, `notificationAsync(NotificationFeedbackType.Warning | Success)`.
- expo-secure-store: `getItemAsync/setItemAsync/deleteItemAsync`; claves solo `[A-Za-z0-9._-]`; valores pequeños (~2 KB).
- `npx expo lint` sin config en shell no interactivo se auto-configura: instala `eslint@^9` y `eslint-config-expo` como devDependencies, escribe `eslint.config.js` y agrega el script `lint`. Ambos paquetes verificados en npm (repos github.com/eslint/eslint y github.com/expo/expo).
- Node v24 ejecuta `.ts` con type-stripping: `node src/demo/logic.check.ts` funciona si logic.ts usa solo sintaxis borrable (sin `enum`, sin `namespace`, sin parameter properties) y no importa nada.
- Iconos: `MaterialIcons` de `@expo/vector-icons` (nombres con guion: `my-location`, `touch-app`, `done-all`, `error-outline`, `delete-outline`, `verified-user`, `location-off`, `arrow-back`, `visibility`, `visibility-off`, `info-outline`, `place`, `share`, `phone`, `shield`, `home`, `group`, `add`, `schedule`, `check`, `map`). tsc valida el nombre.

Estado git: rama `dev`. `apps/mobile/package.json`, `package-lock.json`, `app.json` y `src/theme.ts` ya traen cambios sin commitear de los `expo install` de 01-02: van en el commit de la Tarea 1. No commitear `.gsd/`, `.planning/milestone.lock`, `.planning/state.json` ni `.planning/config.json` (no son de este plan). No hacer push.

Convenciones: TS 2 espacios, comillas simples, punto y coma; `StyleSheet.create` al final del archivo; comentarios y textos de UI en español (Colombia, tuteo); vocabulario de dominio en español (`nombre`, `telefono`, `relacion`, `en_cola`...). Colores/espacios/radios/tipografía SOLO desde `@/theme` (`colors`, `space`, `radius`, `type`); cero hex fuera de `src/theme.ts` (las opacidades se logran con la prop `opacity` sobre un color del tema). Importar `type` de `@/theme` por su nombre, sin alias.
</context>

<tasks>

<task type="tracer">
  <name>Tarea 1: Arranque Expo Router + store demo + login -> Inicio en Expo Go (un camino de punta a punta)</name>
  <files>apps/mobile/package.json, apps/mobile/package-lock.json, apps/mobile/app.json, apps/mobile/tsconfig.json, apps/mobile/eslint.config.js, apps/mobile/App.tsx (borrar), apps/mobile/index.ts (borrar), apps/mobile/src/demo/logic.ts, apps/mobile/src/demo/logic.check.ts, apps/mobile/src/demo/store.tsx, apps/mobile/src/components/ui.tsx, apps/mobile/src/app/_layout.tsx, apps/mobile/src/app/(auth)/_layout.tsx, apps/mobile/src/app/(auth)/login.tsx, apps/mobile/src/app/(app)/_layout.tsx, apps/mobile/src/app/(app)/(tabs)/_layout.tsx, apps/mobile/src/app/(app)/(tabs)/index.tsx</files>
  <action>
Config (L2 Expo Go):
- package.json: `main` = `expo-router/entry`. Borrar `App.tsx` e `index.ts`. No instalar paquetes a mano.
- tsconfig.json: mantener `extends` y `strict`; agregar `paths` `{"@/*": ["./src/*"]}` SIN `baseUrl` (deprecado en TS 6) y `allowImportingTsExtensions: true` (válido porque la base ya trae `noEmit` y `moduleResolution: bundler`; lo necesita logic.check.ts para correr en node).
- app.json: `name` "AlertaYA" (dejar `slug` igual), `scheme` "alertaya", `userInterfaceStyle` "dark", `backgroundColor` "#0D0D0D", `android.package` "com.robertocarlos764.alertaya", `android.adaptiveIcon.backgroundColor` "#0D0D0D" (resto de android igual, incluido `predictiveBackGestureEnabled: false`). En `plugins` dejar "expo-router" y "expo-secure-store" y agregar `["expo-location", { "locationWhenInUsePermission": "AlertaYA usa tu ubicación para que tus contactos de emergencia te encuentren cuando activas una alerta.", "isAndroidBackgroundLocationEnabled": false }]` (solo primer plano; segundo plano es Fase 2).

`src/demo/logic.ts` (puro, sin imports, sintaxis borrable):
- `type DeliveryState = 'en_cola' | 'enviado' | 'entregado' | 'fallido'`.
- `normalizePhone(input)`: quita todo lo que no sea dígito; si quedan 12 dígitos que empiezan por "57" quita ese prefijo; válido solo si son 10 dígitos que empiezan por 3 -> devuelve `+57XXXXXXXXXX`, si no `null`.
- `formatPhone(e164)`: `+573001234567` -> "+57 300 123 4567".
- `isEmail(s)`: regex simple `^\S+@\S+\.\S+$` sobre el valor recortado.
- `initials(nombre)`: primeras letras de las dos primeras palabras en mayúscula; vacío -> "?".
- `simulatedStatus(index, telefono, elapsedMs)`: estado derivado del tiempo transcurrido (determinista, sobrevive a cerrar/reabrir, sin timers persistidos). Con `offset = index * 800`: antes de `2000 + offset` -> en_cola; si el teléfono termina en "0000": en_cola hasta `5000 + offset` y luego fallido (nunca pasa por enviado); si no: enviado hasta `5000 + offset * 1.25` y luego entregado.
- `headline(estados)`: devuelve `{ titulo, subtitulo, fallo }` según la tabla "Titular honesto" de UI-SPEC: todos fallido -> "No pudimos avisar a tus contactos" / "Llámalos directamente o al 123." / fallo true; al menos 1 entregado -> "Alerta activa" / "{n} de {m} contactos recibieron tu aviso."; al menos 1 enviado -> "Alerta activa" / "Mensajes enviados. Esperando confirmación de entrega."; resto -> "Alerta activa" / "Guardada en tu teléfono. Avisando a tus contactos…".
- `formatElapsed(ms)`: "MM:SS", y "H:MM:SS" desde 1 h. `ago(ms)`: "hace {x} s" bajo 60 s, si no "hace {x} min".

`src/demo/logic.check.ts`: importa `./logic.ts` (con extensión), sin `node:assert` (no hay @types/node): helper local `eq(actual, expected, label)` que lanza `Error` si difieren; al final `console.log('logic ok')`. Casos mínimos: normalizePhone("300 123 4567") = "+573001234567", normalizePhone("+57 300 123 4567") = "+573001234567", normalizePhone("2001234567") = null, normalizePhone("30012") = null; formatPhone; initials("María García") = "MG", initials("") = "?"; simulatedStatus(0, "+573001234567", 0 / 3000 / 7000) = en_cola / enviado / entregado; simulatedStatus(0, "+573000000000", 3000 / 6000) = en_cola / fallido; headline todos fallido -> fallo true; headline [entregado, en_cola] -> subtitulo "1 de 2 contactos recibieron tu aviso."; formatElapsed(65000) = "01:05", formatElapsed(3723000) = "1:02:03".

`src/demo/store.tsx` (L1, React context, sin librerías):
- Tipos: `Session { nombre, correo, telefono }`; `Contact { id, nombre, telefono (E.164), relacion? }`; `Fix { lat, lon, accuracy: number | null, at }`; `ActiveAlert { id, createdAt, location: Fix | null, contactIds: string[] }`. Los estados de entrega NO se guardan: se derivan con `simulatedStatus` (contactIds congela quiénes reciben la alerta).
- `export const COUNTDOWN_SECONDS = 5` con comentario: hace las veces de `perfil.ventana_confirmacion_segundos` (D-02: la UI no escribe 5 literal).
- Persistencia: tres claves SecureStore separadas `demo.session`, `demo.contacts`, `demo.alert` (JSON; `deleteItemAsync` cuando el valor es null). Al montar, leer las tres con `Promise.all`, `JSON.parse` en try/catch (dato corrupto -> null) y poner `hydrated = true`. Comentario `ponytail:` en contactos: SecureStore ~2 KB por valor ≈ 15 contactos; pasar a expo-sqlite/archivo si se necesita más.
- Acciones: `register(session)`; `login(correo)` -> sesión con `nombre` = parte local del correo capitalizada, `telefono` "" (modo demo: acepta cualquier correo válido y contraseña de 6+; la contraseña nunca se guarda ni se pasa al store); `logout()` (borra solo la sesión); `addContact(c)` con id `Date.now().toString(36) + Math.random().toString(36).slice(2, 6)`; `updateContact(c)`; `removeContact(id)`; `startAlert(location)` (no hace nada si no hay contactos: nunca una alerta sin destinatarios); `setAlertLocation(fix)`; `finishAlert()`.
- `DemoProvider` + `useDemo()` (lanza error claro si se usa fuera del provider).

`src/components/ui.tsx` (un solo archivo):
- `Screen({ children, scroll?, edges = ['bottom'], style? })`: `SafeAreaView` de react-native-safe-area-context con esas `edges` (el borde superior lo cubre DemoBanner), fondo `colors.bg`, padding 24; con `scroll` envuelve en `KeyboardAvoidingView behavior="padding"` + `ScrollView` (`contentContainerStyle` padding 24 y `flexGrow: 1`, `keyboardShouldPersistTaps="handled"`).
- `AppText({ variant = 'body', color?, style, ...TextProps })` con las variantes de `type` (body/label/meta/heading/display); color por defecto `colors.text`.
- `Button({ title, onPress, variant = 'primary' | 'outline' | 'ghost', icon?, loading?, disabled? })`: `Pressable` con `minHeight` 56, radio `radius.input`, escala 0.95 al presionar vía `style={({ pressed }) => ...}`; primary fondo `colors.accent` texto blanco 16/600; outline borde `colors.border` 1.5; ghost sin fondo texto `colors.textMuted`; disabled fondo `colors.border` y texto `colors.disabled`; loading -> `ActivityIndicator` blanco en lugar del texto y deshabilitado. `accessibilityRole="button"` y `accessibilityState`.
- `TextField({ label, error?, prefix?, secure?, ...TextInputProps })`: label en variante `label` color `colors.textMuted`, 8 sobre el input; input 56, radio 10, fondo `colors.surface`, borde `colors.border` 1, foco `colors.accent` 1.5, error `colors.accent` 1 + fila con icono `error-outline` 14 y mensaje 12 en `colors.accent`; `prefix` ("+57") fijo a la izquierda; `secure` agrega botón ojo `visibility`/`visibility-off` (objetivo 48) que alterna `secureTextEntry`; `placeholderTextColor` `colors.textMuted`.
- `Avatar({ nombre, size = 40 })`: círculo `colors.border`, iniciales blancas 600 (12 en 40, 28 en 80) con `initials`.
- `Header({ right? })`: fila con `shield` 28 `colors.accent` + "AlertaYA" Body 600 `colors.accent` a la izquierda; a la derecha `right` o, por defecto, `Avatar` con el nombre de la sesión (no es botón).
- `DeliveryStatus({ state })`: ÚNICO lugar que pinta un estado de entrega, con la tabla de UI-SPEC: en_cola "En cola" `colors.textMuted` `schedule` "Esperando red"; enviado "Enviado" `colors.text` `check` "Esperando confirmación de entrega"; entregado "Entregado" `colors.success` `done-all` "Confirmado por el operador"; fallido "Falló" `colors.accent` `error-outline` "No se pudo enviar el SMS". Exportar también la etiqueta para `accessibilityLabel` ("{Nombre}, {etiqueta}").
- `DemoBanner()`: franja fina, `paddingTop` = `useSafeAreaInsets().top`, fondo `colors.surface`, borde inferior 1 `colors.warning`, icono `info-outline` 14 + texto variante `label` en `colors.warning`: "MODO DEMO · no se envían SMS reales".

Rutas:
- `src/app/_layout.tsx`: `DemoProvider` envuelve un componente interno que, mientras `!hydrated`, devuelve un View `colors.bg` con `shield` 48 `colors.accent` centrado (splash, sin parpadeo de login). Ya hidratado: View flex 1 con `StatusBar style="light"` (expo-status-bar), `DemoBanner` arriba (una sola vez = visible en todas las pantallas) y `Stack` con `screenOptions` `headerShown: false`, `contentStyle` fondo `colors.bg`; hijos: `Stack.Protected guard={!!session}` con `Stack.Screen name="(app)"` y `Stack.Protected guard={!session}` con `Stack.Screen name="(auth)"`.
- `src/app/(auth)/_layout.tsx`: `Stack` sin header con `Stack.Screen name="login"` declarado primero y `name="register"`.
- `src/app/(auth)/login.tsx`: UI-SPEC Login. `Screen scroll`; arriba (margen 64) `shield` 48, "AlertaYA" heading, subtítulo "Protección de alto nivel para lo que más importa." en `colors.textMuted`. Campos CORREO ELECTRÓNICO (texto guía "nombre@ejemplo.com", `keyboardType="email-address"`, `autoComplete="email"`, `autoCapitalize="none"`) y CONTRASEÑA (`secure`, `autoComplete="password"`). Errores solo de campos tocados (onBlur) o tras intentar enviar: "Ingresa un correo válido." / "Mínimo 6 caracteres.". Botón "Iniciar sesión" deshabilitado mientras haya errores; al enviar `login(correo.trim())`: la guardia lleva a Inicio sola. Enlace "¿No tienes una cuenta? **Crear cuenta**" (texto `colors.textMuted`, enlace blanco 600) -> `router.push('/register')`. Sin "Olvidé mi contraseña" ni biometría.
- `src/app/(app)/_layout.tsx`: `Stack` sin header. Declarar TODAS las pantallas (si no, se agregan sin guardia): `Stack.Protected guard={!activeAlert}` con, en este orden, `(tabs)`, `contacts/new`, `contacts/[id]` y `countdown` (`presentation: 'fullScreenModal'`, `gestureEnabled: false`, `animation: 'fade'`); luego `Stack.Protected guard={!!activeAlert}` con `alert`. Así (D-12) con alerta activa la única pantalla posible es `/alert` (al abrir, al reabrir y al terminar la cuenta regresiva), atrás en `/alert` sale de la app porque no queda historial, y al finalizar cae en `(tabs)`. Las rutas que crean las Tareas 2 y 3 se declaran aquí desde ya.
- `src/app/(app)/(tabs)/_layout.tsx`: `Tabs` de `expo-router/js-tabs`, `headerShown: false`, `tabBarStyle` fondo `colors.surface`, `borderTopColor` `colors.border`, `height: 64 + insets.bottom` (con `useSafeAreaInsets`; un `height` fijo de 64 se come el inset de la barra de navegación), `tabBarActiveTintColor` `colors.accent`, inactivo `colors.textMuted`, etiqueta 12/600. Pantallas: `index` "Inicio" icono `home`, `contacts` "Contactos" icono `group`.
- `src/app/(app)/(tabs)/index.tsx`: Inicio con `Screen edges={[]}` (la tab bar ya cubre el borde inferior), `Header` y un enlace ghost "Cerrar sesión" -> `logout()` al final. La Tarea 3 agrega aquí el botón SOS y la card de ubicación.

Correr `npx expo lint` por primera vez en esta tarea (auto-configura eslint; aceptar el `eslint.config.js` y el script `lint` que genera, y commitear package.json/package-lock.json resultantes).
  </action>
  <verify>
    <automated>cd apps/mobile && node src/demo/logic.check.ts && npx tsc --noEmit && npx expo lint && npx expo export --platform android --output-dir dist</automated>
  </verify>
  <done>`logic ok` impreso; tsc sin errores; expo lint sin errores (eslint.config.js creado); el bundle Android se genera en `dist/` (ignorado por git); `App.tsx` e `index.ts` ya no existen; `grep -n "expo-router/entry" apps/mobile/package.json` encuentra la línea. Camino único listo: abrir -> splash -> login -> Inicio con header y franja MODO DEMO.</done>
</task>

<task type="auto">
  <name>Tarea 2: Registro + Contactos (lista, agregar, editar, eliminar)</name>
  <files>apps/mobile/src/app/(auth)/register.tsx, apps/mobile/src/app/(app)/(tabs)/contacts.tsx, apps/mobile/src/components/ContactForm.tsx, apps/mobile/src/app/(app)/contacts/new.tsx, apps/mobile/src/app/(app)/contacts/[id].tsx</files>
  <action>
Todo local (L1); copy exacto de UI-SPEC "Copywriting Contract" y "Contrato por pantalla".

- `(auth)/register.tsx` (AUTH-01 en UI): `Screen scroll`; botón flecha `arrow-back` (objetivo 48) -> `router.back()`; "Crear cuenta" heading + "Únete a la red de seguridad más avanzada." `colors.textMuted`. Campos en orden: NOMBRE COMPLETO, CORREO ELECTRÓNICO, TELÉFONO (`prefix="+57"`, `keyboardType="phone-pad"`, texto guía "300 123 4567", máximo 10 dígitos), CONTRASEÑA (`secure`). Validación al salir del campo y al enviar, mostrando solo campos tocados: "Ingresa tu nombre." / "Ingresa un correo válido." / "Ingresa un celular colombiano de 10 dígitos (ej. 300 123 4567)." (con `normalizePhone`) / "Mínimo 6 caracteres.". CTA "Crear cuenta" deshabilitado mientras haya errores; al enviar `register({ nombre: nombre.trim(), correo: correo.trim(), telefono: normalizePhone(...) })`; la guardia de Stack.Protected lleva a Inicio sola. La contraseña solo se valida, nunca se guarda.
- `src/components/ContactForm.tsx` (compartido por nuevo y editar, CONT-01 en UI): props `{ id?: string }`. Si hay `id` y no existe el contacto -> `router.back()` en un efecto y no renderizar nada. Header con `arrow-back` + "Nuevo contacto" / "Editar contacto" (heading). `Avatar size={80}` con iniciales en vivo del nombre. Sección "INFORMACIÓN" (variante label). NOMBRE COMPLETO (texto guía "Ej: María García"); TELÉFONO (`prefix="+57"`, 10 dígitos; al editar mostrar los 10 dígitos locales); RELACIÓN opcional: chips de selección única "Mamá", "Papá", "Pareja", "Hermano/a", "Amigo/a", "Otro" (alto 40, radio `radius.pill`, fondo `colors.surface`, borde `colors.border`, seleccionado borde `colors.accent`; tocar de nuevo deselecciona; `accessibilityState={{ selected }}`). Validación: "El nombre es obligatorio." / "Ingresa un celular colombiano de 10 dígitos (ej. 300 123 4567)." / duplicado (otro contacto con el mismo E.164, excluyendo el que se edita) "Ya tienes un contacto con ese número.". CTA "Guardar contacto" (primary, margen inferior 32) deshabilitado con errores; guarda con `addContact`/`updateContact`, `ToastAndroid.show('{Nombre} agregado.' | 'Cambios guardados.', ToastAndroid.SHORT)` y `router.back()`. Solo en nuevo, bajo el CTA (variante meta, `colors.textMuted`): "Este contacto recibirá un SMS con un enlace cuando actives una alerta.".
- `(app)/contacts/new.tsx`: solo renderiza `<ContactForm />`. `(app)/contacts/[id].tsx`: lee `id` con `useLocalSearchParams<{ id: string }>()` y renderiza `<ContactForm id={id} />`.
- `(app)/(tabs)/contacts.tsx`: `Screen edges={[]}`; `Header`; título "Contactos" heading + contador `colors.textMuted`: 1 -> "1 contacto de emergencia", n -> "{n} contactos de emergencia". `FlatList` con `contentContainerStyle` paddingBottom 80 (el FAB no tapa la última fila). Fila (fondo `colors.surface`, borde `colors.border`, radio `radius.row`, padding 16, minHeight 72, gap 8): `Avatar` 40, nombre Body 600 una línea con elipsis, debajo "{Relación} · {+57 300 123 4567}" variante meta `colors.textMuted` una línea (sin relación: solo el teléfono con `formatPhone`); tocar la fila -> `router.push({ pathname: '/contacts/[id]', params: { id } })`; icono `delete-outline` 24 `colors.textMuted` con objetivo 48 y `accessibilityLabel` "Eliminar a {Nombre}" -> `Alert.alert('Eliminar contacto', '¿Eliminar a {Nombre} de tus contactos de emergencia? Dejará de recibir tus alertas.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => removeContact(id) }])`. Vacío (0): "Sin contactos aún" heading + "Agrega a quienes quieres que avisemos en una emergencia. Necesitas al menos uno para usar SOS." + Button outline "Agregar contacto" -> `router.push('/contacts/new')`. FAB circular 56 `colors.accent` con icono `add` blanco, absoluto abajo a la derecha (margen 16), escala 0.95 al presionar, `accessibilityLabel` "Agregar contacto" -> `/contacts/new`. Sin skeleton ni error de carga (los datos son locales y ya están hidratados).
  </action>
  <verify>
    <automated>cd apps/mobile && npx tsc --noEmit && npx expo lint</automated>
  </verify>
  <done>tsc y lint sin errores; existen las 5 rutas/archivos; `grep -rn "Ya tienes un contacto con ese número." apps/mobile/src` y `grep -rn "contacto de emergencia" apps/mobile/src` encuentran el copy; ContactForm es el único formulario de contacto (new y [id] solo lo renderizan).</done>
</task>

<task type="auto">
  <name>Tarea 3: SOS (hold 2 s) + ubicación real + cuenta regresiva + alerta activa + ESTOY A SALVO</name>
  <files>apps/mobile/src/components/HoldButton.tsx, apps/mobile/src/lib/useLocation.ts, apps/mobile/src/app/(app)/(tabs)/index.tsx, apps/mobile/src/app/(app)/countdown.tsx, apps/mobile/src/app/(app)/alert.tsx</files>
  <action>
Sin Reanimated (L2): RN `Animated` + react-native-svg.

- `src/components/HoldButton.tsx`: props `{ variant: 'ring' | 'fill', durationMs, onComplete, disabled?, onPressingChange?, accessibilityLabel, accessibilityHint, actionLabel }`. Lógica común: `onPressIn` -> si no está deshabilitado, háptico `impactAsync(Light)`, `onPressingChange(true)`, `Animated.timing(progress, { toValue: 1, duration: durationMs, easing: Easing.linear, useNativeDriver: false })` y en el callback `({ finished })` solo si `finished`: háptico (`Warning` en ring, `Success` en fill) y `onComplete()`. `onPressOut` antes de completar -> `stopAnimation` y volver a 0 en 200 ms, `onPressingChange(false)`. Valores animados separados para progreso (driver JS, props SVG/ancho) y escala (driver nativo) porque no se pueden mezclar drivers en un mismo valor. Accesibilidad: `accessibilityRole="button"`, `accessibilityState={{ disabled }}`, `accessibilityActions={[{ name: 'activate', label: actionLabel }]}` y `onAccessibilityAction` que llama `onComplete()` si no está deshabilitado (TalkBack no puede mantener presionado).
  - `ring` (SOS, D-01): círculo 220 `colors.accent` con "SOS" variante display + icono `touch-app` 32 debajo; escala 0.92 en 130 ms al presionar y vuelve a 1 al soltar. Detrás, glow estático: `Svg` ~340 con `RadialGradient` de `colors.accent` (opacidad ~0.45 cerca del botón -> 0 en el borde). Encima, `Svg` 256x256 rotado -90° con track `Circle` r 124 trazo 8 `colors.border` y `Animated.createAnimatedComponent(Circle)` r 124 trazo 8 `colors.text`, `strokeDasharray` = 2πr y `strokeDashoffset` interpolado de 2πr a 0. Deshabilitado: círculo `colors.border`, texto `colors.disabled`, sin glow, el hold no hace nada. Comentario `ponytail:` sin pulso del glow ni stagger de entrada (y por eso sin rama de "reducir animaciones"); agregar con Reanimated en el dev build.
  - `fill` (ESTOY A SALVO, D-09): botón 56 ancho completo, radio 10, borde 1.5 `colors.success`, icono `verified-user` + "ESTOY A SALVO" 16/600 `colors.success` letterSpacing 1; relleno absoluto a la izquierda con ancho interpolado '0%'->'100%', fondo `colors.success` y `opacity: 0.25`.
- `src/lib/useLocation.ts`: `useLocation()` devuelve `{ state, fix, request }` con `state` 'sin_permiso' | 'denegado' | 'obteniendo' | 'fijada' | 'sin_senal' y `fix: Fix | null` (tipo `Fix` del store). Con `Location.useForegroundPermissions()`: permiso null -> obteniendo; `status` 'undetermined' -> sin_permiso; 'denied' -> denegado; concedido -> efecto: si `hasServicesEnabledAsync()` es false -> sin_senal; si no `watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 }, ...)` mapeando a `{ lat, lon, accuracy: coords.accuracy == null ? null : Math.round(coords.accuracy), at: loc.timestamp }`; si a los 20 s no llegó ningún fix -> sin_senal (sigue escuchando y pasa a fijada cuando llegue). Limpieza: `subscription.remove()` y `clearTimeout` (cuidar el caso en que el efecto se desmonta antes de que resuelva la promesa del watch). `request` = el request del hook. NUNCA una coordenada por defecto (UBIC-02).
- `(app)/(tabs)/index.tsx` (completar Inicio de la Tarea 1): orden vertical centrado: `Header`; espacio flexible; `HoldButton variant="ring" durationMs={2000}` con `accessibilityLabel` "Botón SOS", `accessibilityHint` "Mantén presionado dos segundos para iniciar la cuenta regresiva", `actionLabel` "Iniciar cuenta regresiva SOS", `onComplete` -> `router.push('/countdown')`, `disabled` si no hay contactos; 40; texto de ayuda Body centrado: "Mantén presionado 2 segundos para activar." (`colors.textMuted`) y mientras presiona "Sigue presionando…" (`colors.text`); con 0 contactos en su lugar "Agrega al menos un contacto para poder usar SOS." + Button outline "Agregar contacto" -> `/contacts/new`; espacio flexible; card UBICACIÓN ACTUAL (fondo `colors.surface`, borde `colors.border`, radio 16, padding 16; icono `map` en cuadro `colors.bg` radio 12; punto de color + línea según la tabla de UI-SPEC: sin_permiso "Permite la ubicación para que tus contactos te vean en el mapa." + Button "Permitir ubicación" -> `request()` (`colors.warning`); denegado "Sin permiso de ubicación. Tu alerta saldrá con ubicación pendiente." + enlace "Abrir ajustes" -> `Linking.openSettings()` (`colors.warning`); obteniendo "Obteniendo ubicación…" (`colors.textMuted`); fijada "Ubicación lista · ±{n} m" (sin "±" si accuracy es null) (`colors.success`); sin_senal "Sin señal GPS. Tu alerta saldrá con ubicación pendiente." (`colors.warning`); icono `my-location` a la derecha); al final el ghost "Cerrar sesión". El SOS nunca se bloquea por ubicación.
- `(app)/countdown.tsx` (D-02, D-03, D-04): `useKeepAwake()`; `Screen` con fondo `colors.deepRed` (override de estilo). `left` arranca en `COUNTDOWN_SECONDS`; efecto por cada cambio de `left`: si `left > 0` -> `Vibration.vibrate(200)`, pulso del numeral (un `Animated.Value` 0->1 en 150 ms con driver nativo: escala 1.15->1 del numeral y opacidad 0.6->0.25 de un círculo `colors.accent` ~240 detrás) y `setTimeout` de 1000 ms que resta 1 (limpiar en el cleanup); si `left === 0` -> `startAlert(fixRef.current)` (fix del `useLocation()` propio guardado en un ref, o null). No navegar a mano: al cambiar `activeAlert`, la guardia de `(app)/_layout` quita countdown y deja `/alert` (sin pantalla intermedia, D-04). `BackHandler.addEventListener('hardwareBackPress', () => true)` mientras está montada. Centro: "ENVIANDO ALERTA EN" variante label blanco con `opacity: 0.8`; numeral `Math.max(left, 1)` fontSize 160 / 600 blanco; "segundos" Body blanco; 24 más abajo "Tus contactos recibirán un SMS con tu ubicación." Body blanco opacidad 0.8 centrado. Abajo, margen 24: botón "CANCELAR" altura 72, ancho completo, fondo `colors.text`, texto heading 600 `colors.deepRed`, radio 10, escala 0.95 al presionar -> `Vibration.vibrate(80)`, `router.back()`, `ToastAndroid.show('Alerta cancelada. No se envió nada.', ToastAndroid.SHORT)`.
- `(app)/alert.tsx` (D-09 a D-12, SOS-04 en UI): `useKeepAwake()`; si `activeAlert` es null devolver null (transición). Reloj: `now` con `setInterval` de 1000 ms. `useLocation()`: en un efecto, cada `fix` nuevo -> `setAlertLocation(fix)`. `Screen scroll`, en orden:
  1. `Header right=`: punto 8 `colors.accent` con `Animated.loop` de opacidad 1->0.3 (driver nativo) + "ACTIVA" variante label `colors.accent` + `formatElapsed(now - createdAt)` 16/600 blanco `fontVariant: ['tabular-nums']`.
  2. Titular con `headline(estados)`: título heading (en `colors.accent` si `fallo`) + subtítulo Body `colors.textMuted`. Sin icono grande de éxito ni titular con exclamación.
  3. "UBICACIÓN QUE VEN TUS CONTACTOS" (label): con `location` -> card `colors.surface`, borde `colors.border`, radio 16, padding 16, icono `place` 32 `colors.accent` + "±{n} m · {ago(now - location.at)}" Body (color `colors.warning` si pasan 2 min). Nunca coordenadas en pantalla. Sin `location` -> bloque `colors.surface` alto 192 radio 16 con `location-off` 32 `colors.warning` y "Ubicación pendiente. Esperando señal GPS; tus contactos ven este mismo aviso.". Sin mapa en Expo Go (MapLibre fuera de alcance).
  4. "CONTACTOS" (label): por cada contacto de `activeAlert.contactIds` (en ese orden, índice i) una fila `colors.surface` radio 12 padding 16 minHeight 72 gap 8: `Avatar` 40, nombre Body 600 (hasta 2 líneas), teléfono `formatPhone` variante meta `colors.textMuted`, a la derecha `<DeliveryStatus state={simulatedStatus(i, telefono, now - createdAt)} />`; `accessibilityLabel` "{Nombre}, {etiqueta}". Si fallido: debajo Button outline "Llamar a {Nombre}" icono `phone` -> `Linking.openURL('tel:' + telefono)` (abre el marcador, no marca solo).
  5. Button outline icono `share` "Compartir ubicación" -> `Share.share({ message: 'Esta es mi ubicación (±{n} m): https://www.google.com/maps/search/?api=1&query={lat},{lon}' })` con el fix REAL de la alerta; deshabilitado sin ubicación. (Se desvía a propósito de "Sigue mi ubicación en vivo" de UI-SPEC: el enlace de Google Maps es un punto fijo y la página pública en vivo no existe aún; prometer "en vivo" violaría el Core Value.)
  6. `HoldButton variant="fill" durationMs={3000}` con `accessibilityLabel` "Estoy a salvo", `accessibilityHint` "Mantén presionado tres segundos para finalizar la alerta", `actionLabel` "Finalizar alerta"; debajo "Mantén presionado 3 segundos" variante meta `colors.textMuted`; `onComplete` -> `finishAlert()` + `ToastAndroid.show('Demo: alerta finalizada. Estamos avisando a tus contactos que estás a salvo.', ToastAndroid.LONG)`; la guardia devuelve a Inicio sola (sin `router.replace`).
  7. Button ghost icono `phone` "Llamar al 123" -> `Linking.openURL('tel:123')`.
  Sin botón "Cancelar alerta" (PIN = Fase 5) y sin manejar atrás (sin historial debajo, atrás sale de la app).
  </action>
  <verify>
    <automated>cd apps/mobile && node src/demo/logic.check.ts && npx tsc --noEmit && npx expo lint && (npx expo-doctor || echo DOCTOR_REVIEW) && npx expo export --platform android --output-dir dist && test -z "$(grep -rnE '#[0-9A-Fa-f]{3,8}\b' src --include=*.ts --include=*.tsx | grep -v 'src/theme.ts')" && test -z "$(grep -rn "Tabs.*from 'expo-router'" src)" && test -z "$(grep -rnE "from '(react-native-reanimated|@maplibre[^']*|@supabase[^']*)'" src)" && test -z "$(grep -rn 'ENVIADA' src)" && echo GATES_OK</automated>
    <human-check>
      <test>Roberto en Expo Go sobre el Android físico sigue el "Recorrido del demo" de este plan (pasos 1 a 10).</test>
      <expected>Cada paso se comporta como está escrito; la franja MODO DEMO se ve en todas las pantallas; ningún estado o ubicación aparece sin su fuente (simulación declarada o GPS real).</expected>
      <why_human>Hápticos, vibración, permisos de ubicación, ToastAndroid, guardias de navegación al reabrir y el hold solo se pueden comprobar en el dispositivo.</why_human>
    </human-check>
  </verify>
  <done>`logic ok` y `GATES_OK` impresos; tsc y lint sin errores; expo-doctor sin desajuste de versiones del SDK (si imprime DOCTOR_REVIEW: corregir lo que sea de este plan y anotar en el SUMMARY lo ajeno); bundle Android generado; sin hex fuera de theme.ts, sin `Tabs` deprecado, sin imports de Reanimated/MapLibre/Supabase.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| usuario -> formularios | Texto libre (nombre, correo, teléfono, contraseña) entra al store y a SecureStore |
| app -> almacenamiento del dispositivo | Sesión, contactos y alerta persisten en SecureStore (Keystore de Android) |
| app -> SO (Linking/Share) | `tel:` y hoja de compartir del sistema con datos del usuario |
| app -> persona que mira el demo | Estados de entrega simulados podrían leerse como envíos reales |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-q261014-01 | Spoofing | alert.tsx / DeliveryStatus (estados simulados) | high | mitigate | `DemoBanner` montado una sola vez en el root `_layout.tsx` -> visible en todas las pantallas; toast de fin con prefijo "Demo:"; "Compartir ubicación" no promete seguimiento en vivo |
| T-q261014-02 | Tampering | useLocation / startAlert | high | mitigate | El fix solo sale de `watchPositionAsync`; sin fix -> `location: null` y bloque "Ubicación pendiente"; ninguna coordenada por defecto en el código |
| T-q261014-03 | Information Disclosure | store.tsx (datos personales en reposo) | medium | mitigate | Todo en SecureStore (cifrado por Keystore); la contraseña nunca se guarda ni llega al store |
| T-q261014-04 | Tampering | `Linking.openURL('tel:' + telefono)` | low | mitigate | Solo teléfonos que pasaron `normalizePhone` (`+573XXXXXXXXX`), así que no se puede inyectar otro esquema de URL |
| T-q261014-05 | Information Disclosure | Share de ubicación | low | accept | Solo por toque explícito del usuario y a través de la hoja nativa; nada se envía solo |
| T-q261014-06 | Elevation of Privilege | permiso de ubicación (Ley 1581) | low | mitigate | Se pide solo primer plano y solo al tocar "Permitir ubicación" con el texto explicativo; `isAndroidBackgroundLocationEnabled: false` |
| T-q261014-SC | Tampering | `npx expo lint` instala eslint + eslint-config-expo | high | mitigate | Verificados en npm: `eslint` (github.com/eslint/eslint) y `eslint-config-expo` 57.x (github.com/expo/expo, mantenedores de Expo); los instala la propia CLI de Expo, sin otros paquetes nuevos |
</threat_model>

<verification>
Desde `apps/mobile`:
- `node src/demo/logic.check.ts` -> `logic ok`
- `npx tsc --noEmit` y `npx expo lint` sin errores
- `npx expo-doctor` sin desajuste de versiones del SDK 57
- `npx expo export --platform android --output-dir dist` genera el bundle
- Gates de grep de la Tarea 3 -> `GATES_OK`

## Recorrido del demo (verificación humana de Roberto en Expo Go)

1. `cd apps/mobile && npx expo start` (misma Wi-Fi que el teléfono; si la red bloquea, `npx expo start --tunnel`). Escanear el QR con Expo Go (debe soportar SDK 57).
2. Splash oscuro con escudo -> Login con la franja "MODO DEMO · no se envían SMS reales" arriba. Tocar "Crear cuenta", llenar nombre, correo, 300 123 4567 y contraseña de 6+ -> entra a Inicio.
3. Inicio: SOS gris con "Agrega al menos un contacto para poder usar SOS." -> "Agregar contacto": "Ana García", 300 111 2222, Mamá -> "Guardar contacto" -> toast "Ana García agregado.". Agregar "Prueba Falla" con 300 000 0000 (sirve para mostrar el estado Falló). Probar el error de duplicado con el mismo número.
4. Pestaña Contactos: "2 contactos de emergencia"; tocar una fila y editar ("Cambios guardados."); el icono de borrar abre el diálogo "Eliminar contacto" (cancelar).
5. Inicio: card de ubicación -> "Permitir ubicación" -> aceptar -> "Ubicación lista · ±n m".
6. Mantener SOS menos de 2 s y soltar: el anillo vuelve a 0 y no pasa nada. Mantener 2 s: cuenta regresiva roja 5..1 con vibración por segundo; atrás no hace nada; "CANCELAR" -> Inicio con "Alerta cancelada. No se envió nada.".
7. Mantener SOS 2 s otra vez y dejar llegar a 0 -> Alerta activa: cronómetro corriendo, titular que cambia con los estados, Ana: En cola -> Enviado -> Entregado; Prueba Falla: En cola -> Falló + "Llamar a Prueba" (abre el marcador). Ubicación "±n m · hace x s". "Compartir ubicación" abre la hoja del sistema con un enlace de Google Maps.
8. Cerrar Expo Go del todo (deslizar desde recientes) y reabrir el proyecto -> entra directo a Alerta activa con el cronómetro siguiendo desde la hora real de inicio.
9. Mantener "ESTOY A SALVO" 3 s -> vuelve a Inicio con el toast de alerta finalizada.
10. Opcional: negar el permiso de ubicación (o activar modo avión sin GPS) -> card en ámbar y, al activar SOS, "Ubicación pendiente" en la alerta. "Cerrar sesión" -> Login.

Si en el paso 7 u 8 la navegación no cambia sola al iniciar o finalizar la alerta, el arreglo va en `(app)/_layout.tsx` (guardias), no en las pantallas.
</verification>

<success_criteria>
- Las 3 tareas cumplen su `<done>` y el comando automático de la Tarea 3 imprime `logic ok` y `GATES_OK`.
- El recorrido del demo (pasos 1-9) funciona en Expo Go en el Android de Roberto.
- ROADMAP.md y REQUIREMENTS.md quedan intactos: los planes 01-11..01-15 y los requisitos AUTH/CONT/SOS/UBIC siguen abiertos.
</success_criteria>

<output>
Crear `.planning/quick/261014-hhf-prototipo-demo-de-la-app-movil-expo-go-m/261014-hhf-SUMMARY.md` al terminar.
</output>
