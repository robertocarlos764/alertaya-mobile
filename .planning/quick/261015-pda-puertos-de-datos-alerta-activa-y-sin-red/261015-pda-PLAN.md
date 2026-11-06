---
phase: quick-261015-pda
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/mobile/src/data/auth.ts
  - apps/mobile/src/data/contacts.ts
  - apps/mobile/src/data/alerts.ts
  - apps/mobile/src/data/demo.ts
  - apps/mobile/src/data/index.ts
  - apps/mobile/src/data/logic.ts
  - apps/mobile/src/data/logic.check.ts
  - apps/mobile/src/demo/logic.ts
  - apps/mobile/src/demo/logic.check.ts
  - apps/mobile/src/demo/store.tsx
  - apps/mobile/src/components/ui.tsx
  - apps/mobile/src/components/ContactForm.tsx
  - apps/mobile/src/components/TrailMap.tsx
  - apps/mobile/src/app/**
autonomous: true
# Tarea rápida en modo demo: no completa ningún requisito del ROADMAP (todo local, sin servidor ni SMS).
requirements: [QUICK-261015-pda]
prepares: [01-11, 01-12, 01-13, 01-14, 01-15]

must_haves:
  truths:
    - "Ninguna pantalla importa @/demo/store: todas leen y escriben por los puertos AuthRepository, ContactsRepository y AlertsRepository que entrega src/data/index.ts (único punto que elige el adaptador)"
    - "Los puertos usan los nombres de 01-06/01-13/01-14: entregas en_cola|enviando|reintento|enviado|entregado|fallido|cancelado con intentos, alerta activa|finalizada, clientGeneratedId, serverId, creadoEn, trackingUrl, ultimaUbicacion {lat, lon, precisionMetros, capturadaEn}"
    - "Al llegar a 0 la alerta se guarda en el teléfono con clientGeneratedId antes de cualquier red; mientras el 'servidor' (simulado) no la confirma, el titular dice 'Guardada en tu teléfono. Avisando a tus contactos…' y cada contacto 'En cola · Esperando red'"
    - "Sin conexión (web: navigator.onLine) la alerta activa muestra 'Sin conexión. Tu alerta está guardada y se enviará en cuanto vuelva la red.'; nunca 'Enviado' sin confirmación"
    - "ESTOY A SALVO (3 s) -> 'Finalizando…' -> estado finalizada y pantalla final; sin red falla con 'No pudimos finalizar la alerta. Sigue activa. Intenta de nuevo.' y la alerta sigue activa"
    - "Al abrir la app con una alerta (activa o finalizada sin cerrar) la única pantalla es /alert (D-12), decidido por la función pura initialScreen"
    - "Login, registro, contactos y cuenta regresiva cubren los estados de UI-SPEC: enviando (spinner, campos deshabilitados), error en banner, cargando (3 skeleton), error de carga con Reintentar, error al guardar, deadline absoluto en la cuenta regresiva"
    - "La franja MODO DEMO se muestra mientras el adaptador sea el demo (IS_DEMO)"
---

<objective>
Avanzar el frontend móvil mientras el backend está bloqueado (sin Twilio, ngrok, Supabase ni teléfono): separar las pantallas del store demo con tres puertos pequeños y un adaptador demo, completar la alerta activa según UI-SPEC y D-09..D-12, modelar "sin red" (SOS-03) sin inventar un servidor y llenar los estados de UI-SPEC que faltan.

Cómo deja el camino a 01-11..01-15: el adaptador real se agrega como otro archivo que implementa los mismos hooks (`useAuth`, `useContacts`, `useAlerts`) y se elige en `src/data/index.ts`. Las funciones puras (`alertHeadline`, `toDeliveryView`, `initialScreen`, `secondsLeft`, `sosAvailability`) siguen las firmas de los `<behavior>` de esos planes, para que al llegar Jest solo se muevan.
</objective>

<tasks>

<task type="auto">
  <name>Tarea 1: Puertos de datos + adaptador demo + pantallas por los puertos</name>
  <action>
    `src/data/{auth,contacts,alerts}.ts`: solo tipos (un archivo por puerto). Comandos async que rechazan con `Error` cuyo `message` ya es copy de UI-SPEC. `src/data/demo.ts`: hooks que implementan los puertos sobre `useDemo()`. `src/data/index.ts`: elige el adaptador, exporta `DataProvider`, `useAuth`, `useContacts`, `useAlerts`, `useDevicePrefs` (ajustes, bienvenida, reinicio: locales del dispositivo) e `IS_DEMO`. `src/data/logic.ts`: `initialScreen` pura (D-12) con su check. Migrar todas las pantallas y `ui.tsx`.
  </action>
  <verify>grep -rn "@/demo/store" src/app src/components = vacío salvo tipos; tsc, lint y checks en verde</verify>
</task>

<task type="auto">
  <name>Tarea 2: Alerta activa completa y sin red</name>
  <action>
    Store: alerta con `clientGeneratedId` (UUID v4), `syncedAt` (confirmación simulada a 1 s solo con red), `estado` y `finalizadaEn`. Lógica pura: `alertHeadline({synced, estados})` (con singular), `toDeliveryView(estado, intentos, sincronizada)` (solo 'enviado' produce Enviado, solo 'entregado' produce Entregado), checks de orden monótono de `simulatedStatus`. Pantalla: banner sin conexión, titular honesto, cronómetro desde `creadoEn`, Llamar a {Nombre} en fila fallida, Compartir enlace (deshabilitado "Generando enlace…" sin confirmar; en demo, sin trackingUrl, se comparte la ubicación real con Maps como antes), 123, ESTOY A SALVO con Finalizando…/error, pantalla final.
  </action>
  <verify>checks de lógica en verde; tsc; lint</verify>
</task>

<task type="auto">
  <name>Tarea 3: Estados de UI-SPEC que faltan</name>
  <action>
    Login: enviando (spinner, inputs deshabilitados, sin doble envío) y banner de error. Registro: igual + estado "Revisa tu correo" si el puerto devuelve `needsEmailConfirmation`. Contactos: 3 filas skeleton, error con "Reintentar"; formulario con spinner y "No se pudo guardar el contacto. Intenta de nuevo."; error al eliminar. Cuenta regresiva: deadline absoluto (`secondsLeft`), dispara al volver a primer plano si venció. Inicio: `sosAvailability` (error de carga no bloquea el SOS).
  </action>
  <verify>tsc; lint; checks; npx expo export --platform web</verify>
</task>

</tasks>

<out_of_scope>
Paquetes nuevos (NetInfo, expo-crypto, react-query, supabase-js, MapLibre, Jest): pendientes para 01-11/01-13. Nada contra Supabase, sin push. No se toca apps/web, apps/api, .gsd/, config.json, milestone.lock, state.json.
</out_of_scope>
